import * as svelte from 'svelte/compiler';
import { TemplateNode } from 'svelte/types/compiler/interfaces';
import { parse } from 'node-html-parser';

export type SvelteCodeFragment = {
  fragment: string;
  startLine: number;
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
  return (multilineString.match(/\n/g) || '').length;
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
    html.start = splits[0].replace(/\n$/, '');
    html.middle = splits[1].replace(/(^\n|\n$)/g, '');
    html.end = splits[2].replace(/^\n/, '');
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
    html.start = splits[0].replace(/\n$/, '');
    html.end = splits[1].replace(/^\n/, '');
  }
  const htmlFragmentLengths = [linesCount(html.start), linesCount(html.middle), linesCount(html.end)];
  const jsLength = ((jsString || '').match(/\n/g) || '').length;
  const cssLength = ((cssString || '').match(/\n/g) || '').length;
  const htmlFragments: SvelteCodeFragment[] = [];
  let scriptInHTMLFragments: SvelteCodeFragment[] = [];
  let style: SvelteCodeFragment | undefined;
  let script: SvelteCodeFragment | undefined;
  if (jsString && cssString) {
    const scriptFirst = secondSplit[0].length === 1;
    const firstSection = 1;
    const secondSection = firstSection + htmlFragmentLengths[0] + htmlFragmentAdjusters[0];
    const thirdSection = secondSection + (scriptFirst ? jsLength : cssLength) + htmlFragmentAdjusters[1];
    const fourthSection = thirdSection + htmlFragmentLengths[1] + htmlFragmentAdjusters[2];
    const fifthSection = fourthSection + (scriptFirst ? cssLength : jsLength) + htmlFragmentAdjusters[3];
    if (stripEmptyStartEnd(html.start) !== '') {
      htmlFragments.push({fragment: html.start, startLine: firstSection});
    }
    if (stripEmptyStartEnd(html.middle) !== '') {
      htmlFragments.push({fragment: html.middle, startLine: thirdSection});
    }
    if (stripEmptyStartEnd(html.end) !== '') {
      htmlFragments.push({fragment: html.end, startLine: fifthSection});
    }
    style = {fragment: cssString, startLine: scriptFirst ? fourthSection : secondSection};
    script = {fragment: jsString, startLine: scriptFirst ? secondSection : fourthSection};
  } else if (jsString || cssString) {
    const firstSection = 1;
    const secondSection = firstSection + htmlFragmentLengths[0] + htmlFragmentAdjusters[0];
    const thirdSection = secondSection + (jsString ? jsLength : cssLength) + htmlFragmentAdjusters[1];
    if (stripEmptyStartEnd(html.start) !== '') {
      htmlFragments.push({fragment: html.start, startLine: firstSection});
    }
    if (stripEmptyStartEnd(html.end) !== '') {
      htmlFragments.push({fragment: html.end, startLine: thirdSection});
    }
    if (jsString) {
      script = {fragment: jsString, startLine: secondSection};
    } else {
      style = {fragment: cssString, startLine: secondSection};
    }
  } else if (stripEmptyStartEnd(splits[0]) !== '') {
    htmlFragments.push({fragment: splits[0], startLine: 1});
  }
  if (htmlFragments.length > 0) {
    scriptInHTMLFragments = <SvelteCodeFragment []>htmlFragments.flatMap((fragment) => svelteJsParser(fragment)).filter((e) => e);
  }
  return {
    ...(fileName ? {fileName} : {}),
    ...(htmlFragments.length > 0 ? {htmlFragments} : {}),
    ...(script ? {script} : {}),
    ...(style ? {style} : {}),
    ...(scriptInHTMLFragments.length > 0 ? {scriptInHTMLFragments} : {}),
  };
}

export function svelteJsParser(fragment: SvelteCodeFragment): SvelteCodeFragment[] | undefined {
  const ast = svelte.parse(fragment.fragment);
  if (ast.html.children) {
    return ast.html.children
      .flatMap(
        (child) => (child.type === 'InlineComponent'
          ? [
            ...child.attributes.flatMap((attribute: TemplateNode) => getChildJs(attribute, fragment.fragment)),
            ...(child.children ? child.children.flatMap((attribute: TemplateNode) => getChildJs(attribute, fragment.fragment)) : []),
          ]
          : getChildJs(child, fragment.fragment)
        )
          .map((codeFragment: SvelteCodeFragment) => ({fragment: codeFragment.fragment, startLine: fragment.startLine + codeFragment.startLine - 1})),
      );
  }
  return undefined;
}

function getChildJs(child: TemplateNode, svelteFile: string): SvelteCodeFragment[] {
  if (['MustacheTag', 'RawMustacheTag'].includes(child.type)) {
    return [{fragment: svelteFile.slice(child.expression.start, child.expression.end), startLine: child.expression.loc.start.line}];
  }
  if (child.type === 'Element') {
    const children: {fragment: string, startLine: number}[] | undefined = [];
    child.attributes.forEach((attribute: TemplateNode) => {
      children.push(...getChildJs(attribute, svelteFile));
    });
    if (child.children) {
      child.children.forEach((node) => {
        children.push(...getChildJs(node, svelteFile));
      });
    }
    return children;
  }
  if (child.type === 'Attribute') {
    return child.value.flatMap((node: TemplateNode) => getChildJs(node, svelteFile));
  }
  if (['Binding', 'EventHandler', 'Class', 'Action', 'Transition', 'Animation', 'Let'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
      },
    ];
  }
  if (['EachBlock', 'IfBlock', 'KeyBlock'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
      },
      ...child.children!.flatMap((node) => getChildJs(node, svelteFile)),
      ...(child.else ? child.else.children!.flatMap((node: TemplateNode) => getChildJs(node, svelteFile)) : []),
    ];
  }
  if (['AwaitBlock'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
      },
      ...child.pending.children!.flatMap((node: TemplateNode) => getChildJs(node, svelteFile)),
      ...child.then.children!.flatMap((node: TemplateNode) => getChildJs(node, svelteFile)),
      ...child.catch.children!.flatMap((node: TemplateNode) => getChildJs(node, svelteFile)),
    ];
  }
  return [];
}
