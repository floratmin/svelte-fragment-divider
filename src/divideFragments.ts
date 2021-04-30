import * as svelte from 'svelte/compiler';
import { TemplateNode, Ast } from 'svelte/types/compiler/interfaces';
import { parse } from 'node-html-parser';

export type SvelteCodeFragment = {
  fragment: string;
  startLine: number;
  startChar: number;
  endChar: number;
};

export type SvelteCodeFragments = {
  fileName?: string | undefined;
  script?: SvelteCodeFragment | undefined;
  style?: SvelteCodeFragment | undefined;
  htmlFragments?: SvelteCodeFragment[] | undefined;
  scriptInHTMLFragments?: SvelteCodeFragment[] | undefined;
};

function escapeRegExp(unescapedString: string): string {
  return unescapedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function stripEmptyStartEnd(rawString: string): string {
  return rawString.replace(/^\s+/, '').replace(/^\s+$/, '');
}

function linesCount(multilineString: string): number {
  return (multilineString.match(/\r?\n/g) || '').length;
}

export function svelteFragmentDivider(file: string, fileName?: string): SvelteCodeFragments {
  const svelteFileRoot = parse(file);
  const jsString = svelteFileRoot.querySelector('script')?.toString();
  const cssString = svelteFileRoot.querySelector('style')?.toString();
  const jsRegex = jsString && new RegExp(escapeRegExp(jsString));
  const cssRegex = cssString && new RegExp(escapeRegExp(cssString));
  const firstSplit = jsRegex ? file.split(jsRegex) : [file];
  const secondSplit = cssRegex ? firstSplit.map((split) => split.split(cssRegex)) : [firstSplit];
  let htmlFragmentAdjusters: number[] = [];
  const html = {
    start: '',
    middle: '',
    end: '',
  };
  const splits = secondSplit.flatMap((e) => e);
  const scriptFirst = secondSplit[0].length === 1;
  if (firstSplit.length > 2) {
    throw new Error(
      `File ${
        fileName ? `${fileName} ` : ''
      }contains content in <script>...</script> also as a string. Fixing this will probably lead to an 'Unterminated template literal' error.`,
    );
  }
  if (secondSplit.some((split) => split.length > 2) || (secondSplit.length > 1 && secondSplit.every((split) => split.length === 2))) {
    throw new Error(
      `File ${
        fileName ? `${fileName} ` : ''
      }contains content in <style>...</style> also as a string. Fixing this will probably lead to an 'Unterminated template literal' error.`,
    );
  }
  if (jsString && cssString) {
    htmlFragmentAdjusters = splits.flatMap((fragment, i) => (
      i === 0
        ? fragment.slice(-1) === '\n'
          ? 1
          : 0
        : i === 1
          ? fragment !== '\n' && fragment.slice(0, 1) === '\n' && fragment.slice(-1) === '\n'
            ? [1, 1]
            : fragment.slice(0, 1) === '\n'
              ? [1, 0]
              : fragment.slice(-1) === '\n'
                ? [0, 1]
                : [0, 0]
          : fragment.slice(0, 1) === '\n'
            ? 1
            : 0
    ));
    html.start = splits[0].replace(/\r?\n$/, '');
    html.middle = splits[1].replace(/(^\r?\n|\r?\n$)/g, '');
    html.end = splits[2].replace(/^\r?\n/, '');
  } else if (jsString || cssString) {
    htmlFragmentAdjusters = splits.map((fragment, i) => (
      i === 0
        ? fragment.slice(-1) === '\n'
          ? 1
          : 0
        : fragment.slice(0, 1) === '\n'
          ? 1
          : 0
    ));
    html.start = splits[0].replace(/\r?\n$/, '');
    html.end = splits[1].replace(/^\r?\n/, '');
  }
  const htmlFragmentsLinesCount = [linesCount(html.start), linesCount(html.middle), linesCount(html.end)];
  const jsLength = linesCount(jsString || '');
  const cssLength = linesCount(cssString || '');
  const htmlFragments: SvelteCodeFragment[] = [];
  let scriptInHTMLFragments: SvelteCodeFragment[] = [];
  let style: SvelteCodeFragment | undefined;
  let script: SvelteCodeFragment | undefined;
  let endChar = 0;
  let startChar: number;
  if (jsString && cssString) {
    const firstSection = 1;
    const secondSection = firstSection + htmlFragmentsLinesCount[0] + htmlFragmentAdjusters[0];
    const thirdSection = secondSection + (scriptFirst ? jsLength : cssLength) + htmlFragmentAdjusters[1];
    const fourthSection = thirdSection + htmlFragmentsLinesCount[1] + htmlFragmentAdjusters[2];
    const fifthSection = fourthSection + (scriptFirst ? cssLength : jsLength) + htmlFragmentAdjusters[3];
    [startChar, endChar] = [endChar, endChar + html.start.length];
    if (stripEmptyStartEnd(html.start) !== '') {
      htmlFragments.push({
        fragment: html.start,
        startLine: firstSection,
        startChar,
        endChar,
      });
    }
    endChar += htmlFragmentAdjusters[0];
    if (scriptFirst) {
      [startChar, endChar] = [endChar, endChar + jsString.length];
      script = {
        fragment: jsString,
        startLine: secondSection,
        startChar,
        endChar,
      };
    } else {
      [startChar, endChar] = [endChar, endChar + cssString.length];
      style = {
        fragment: cssString,
        startLine: secondSection,
        startChar,
        endChar,
      };
    }
    endChar += htmlFragmentAdjusters[1];
    [startChar, endChar] = [endChar, endChar + html.middle.length];
    if (stripEmptyStartEnd(html.middle) !== '') {
      htmlFragments.push({
        fragment: html.middle,
        startLine: thirdSection,
        startChar,
        endChar,
      });
    }
    endChar += htmlFragmentAdjusters[2];
    if (scriptFirst) {
      [startChar, endChar] = [endChar, endChar + cssString.length];
      style = {
        fragment: cssString,
        startLine: fourthSection,
        startChar,
        endChar,
      };
    } else {
      [startChar, endChar] = [endChar, endChar + jsString.length];
      script = {
        fragment: jsString,
        startLine: fourthSection,
        startChar,
        endChar,
      };
    }
    endChar += htmlFragmentAdjusters[3];
    [startChar, endChar] = [endChar, endChar + html.end.length];
    if (stripEmptyStartEnd(html.end) !== '') {
      htmlFragments.push({
        fragment: html.end,
        startLine: fifthSection,
        startChar,
        endChar,
      });
    }
  } else if (jsString || cssString) {
    const firstSection = 1;
    const secondSection = firstSection + htmlFragmentsLinesCount[0] + htmlFragmentAdjusters[0];
    const thirdSection = secondSection + (jsString ? jsLength : cssLength) + htmlFragmentAdjusters[1];
    [startChar, endChar] = [endChar, endChar + html.start.length];
    if (stripEmptyStartEnd(html.start) !== '') {
      htmlFragments.push({
        fragment: html.start,
        startLine: firstSection,
        startChar,
        endChar,
      });
    }
    endChar += htmlFragmentAdjusters[0];
    if (jsString) {
      [startChar, endChar] = [endChar, endChar + jsString.length];
      script = {
        fragment: jsString,
        startLine: secondSection,
        startChar,
        endChar,
      };
    } else {
      [startChar, endChar] = [endChar, endChar + cssString.length];
      style = {
        fragment: cssString,
        startLine: secondSection,
        startChar,
        endChar,
      };
    }
    endChar += htmlFragmentAdjusters[1];
    [startChar, endChar] = [endChar, endChar + html.end.length];
    if (stripEmptyStartEnd(html.end) !== '') {
      htmlFragments.push({
        fragment: html.end,
        startLine: thirdSection,
        startChar,
        endChar,
      });
    }
  } else if (stripEmptyStartEnd(splits[0]) !== '') {
    htmlFragments.push({
      fragment: splits[0],
      startLine: 1,
      startChar: 0,
      endChar: splits[0].length,
    });
  }
  if (htmlFragments.length > 0) {
    scriptInHTMLFragments = <SvelteCodeFragment []>htmlFragments.flatMap((fragment) => svelteJsParser(fragment, fileName)).filter((e) => e);
  }
  return {
    ...(fileName ? {fileName} : {}),
    ...(htmlFragments.length > 0 ? {htmlFragments} : {}),
    ...(script ? {script} : {}),
    ...(style ? {style} : {}),
    ...(scriptInHTMLFragments.length > 0 ? {scriptInHTMLFragments} : {}),
  };
}

export function svelteJsParser(fragment: SvelteCodeFragment, fileName?: string): SvelteCodeFragment[] | undefined {
  let ast: Ast;
  try {
    ast = svelte.parse(fragment.fragment);
    if (ast.html.children) {
      return ast.html.children
        .flatMap(
          (child) => getChildFragment(child, fragment.fragment)
            .map((codeFragment: SvelteCodeFragment) => ({
              fragment: codeFragment.fragment,
              startLine: fragment.startLine + codeFragment.startLine - 1,
              startChar: fragment.startChar + codeFragment.startChar,
              endChar: fragment.startChar + codeFragment.endChar,
            })),
        );
    }
  } catch (e) {
    const errors = e.toString().split('\n');
    throw new Error(`${errors[0]}${fileName ? ` in file ${fileName}` : ''}\n${errors[1]}`);
  }
  return undefined;
}

function getChildFragment(child: TemplateNode, svelteFile: string): SvelteCodeFragment[] {
  if (['MustacheTag', 'RawMustacheTag'].includes(child.type)) {
    return [{
      fragment: svelteFile.slice(child.expression.start, child.expression.end),
      startLine: child.expression.loc.start.line,
      startChar: child.expression.start,
      endChar: child.expression.end,
    }];
  }
  if (['Element', 'InlineComponent'].includes(child.type)) {
    const children: SvelteCodeFragment [] | undefined = [];
    child.attributes.forEach((attribute: TemplateNode) => {
      children.push(...getChildFragment(attribute, svelteFile));
    });
    if (child.children) {
      child.children.forEach((node) => {
        children.push(...getChildFragment(node, svelteFile));
      });
    }
    return children;
  }
  if (child.type === 'Attribute') {
    return child.value.flatMap((node: TemplateNode) => getChildFragment(node, svelteFile));
  }
  if (['Binding', 'EventHandler', 'Class', 'Action', 'Transition', 'Animation', 'Let'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
        startChar: child.expression.start,
        endChar: child.expression.end,
      },
    ];
  }
  if (['EachBlock', 'IfBlock', 'KeyBlock'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
        startChar: child.expression.start,
        endChar: child.expression.end,
      },
      ...child.children!.flatMap((node) => getChildFragment(node, svelteFile)),
      ...(child.else ? child.else.children!.flatMap((node: TemplateNode) => getChildFragment(node, svelteFile)) : []),
    ];
  }
  if (['AwaitBlock'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
        startChar: child.expression.start,
        endChar: child.expression.end,
      },
      ...child.pending.children!.flatMap((node: TemplateNode) => getChildFragment(node, svelteFile)),
      ...child.then.children!.flatMap((node: TemplateNode) => getChildFragment(node, svelteFile)),
      ...child.catch.children!.flatMap((node: TemplateNode) => getChildFragment(node, svelteFile)),
    ];
  }
  return [];
}
