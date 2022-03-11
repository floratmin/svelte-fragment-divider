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
  script?: SvelteCodeFragment | SvelteCodeFragment[] | undefined;
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
  const jsStrings = svelteFileRoot.querySelectorAll('script')?.map((script) => script.toString());
  const cssString = svelteFileRoot.querySelector('style')?.toString();
  const jsRegExs = jsStrings && jsStrings.map((jsString) => new RegExp(escapeRegExp(jsString)));
  const cssRegex = cssString && new RegExp(escapeRegExp(cssString));
  const jsMatchs = jsRegExs.map((jsRegEx) => jsRegEx && file.match(jsRegEx));
  const cssMatch = cssRegex && file.match(cssRegex);
  const allMatchs = <RegExpMatchArray[]>[...jsMatchs, cssMatch].filter(Boolean);
  const positions = allMatchs.map((match) => [<number>match.index, <number>match.index + match[0].length]).sort((a, b) => a[0] - b[0]);
  positions.unshift([-Infinity, 0]);
  positions.push([file.length, Infinity]);
  const htmlPositions: number[][] = [];
  positions.slice(0, -1).forEach(([, end], i) => {
    if (end !== positions[i + 1][0]) {
      htmlPositions.push([end, positions[i + 1][0]]);
    }
  });
  const script = (<RegExpMatchArray[]>jsMatchs.filter(Boolean)).map((match) => ({
    fragment: match[0],
    startLine: linesCount(file.slice(0, <number>match.index)) + 1,
    startChar: <number>match.index,
    endChar: <number>match.index + match[0].length,
  }));
  const style = cssMatch && {
    fragment: cssMatch[0],
    startLine: linesCount(file.slice(0, <number>cssMatch.index)) + 1,
    startChar: <number>cssMatch.index,
    endChar: <number>cssMatch.index + cssMatch[0].length,
  };
  const htmlFragments = htmlPositions
    .map(([start, end]) => <[number, number, string]>[start, end, file.slice(start, end)])
    .filter(([, , htmlFragment]) => stripEmptyStartEnd(htmlFragment) !== '')
    .map(([startChar, endChar, htmlFragment]) => ({
      fragment: htmlFragment,
      startLine: linesCount(file.slice(0, startChar)) + 1,
      startChar,
      endChar,
    }));
  const scriptInHTMLFragments =
    htmlFragments.length > 0 ? <SvelteCodeFragment[]>htmlFragments.flatMap((fragment) => svelteJsParser(fragment, fileName)).filter((e) => e) : undefined;
  return {
    ...(fileName ? { fileName } : {}),
    ...(htmlFragments.length > 0 ? { htmlFragments } : {}),
    ...(script.length > 0 ? (script.length > 1 ? { script } : { script: script[0] }) : {}),
    ...(style && style.fragment !== '' ? { style } : {}),
    ...(scriptInHTMLFragments && scriptInHTMLFragments.length > 0 ? { scriptInHTMLFragments } : {}),
  };
}

export function svelteJsParser(fragment: SvelteCodeFragment, fileName?: string): SvelteCodeFragment[] | undefined {
  let ast: Ast;
  try {
    ast = svelte.parse(fragment.fragment);
    if (ast.html.children) {
      return ast.html.children.flatMap((child) =>
        getChildFragment(child, fragment.fragment).map((codeFragment: SvelteCodeFragment) => ({
          fragment: codeFragment.fragment,
          startLine: fragment.startLine + codeFragment.startLine - 1,
          startChar: fragment.startChar + codeFragment.startChar,
          endChar: fragment.startChar + codeFragment.endChar,
        })),
      );
    }
  } catch (e: any) {
    const errors = e.toString().split('\n');
    throw new Error(`${errors[0]}${fileName ? ` in file ${fileName}` : ''}\n${errors[1]}`);
  }
  return undefined;
}

function getChildFragment(child: TemplateNode, svelteFile: string): SvelteCodeFragment[] {
  if (['MustacheTag', 'RawMustacheTag'].includes(child.type)) {
    return [
      {
        fragment: svelteFile.slice(child.expression.start, child.expression.end),
        startLine: child.expression.loc.start.line,
        startChar: child.expression.start,
        endChar: child.expression.end,
      },
    ];
  }
  if (['Element', 'InlineComponent'].includes(child.type)) {
    const children: SvelteCodeFragment[] | undefined = [];
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
