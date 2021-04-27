"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svelteFragmentDivider = void 0;
const node_html_parser_1 = require("node-html-parser");
function escapeRegExp(unescapedString) {
    return unescapedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function stripEmptyStartEnd(rawString) {
    return rawString.replace(/^\s+/, '').replace(/^\s+$/, '');
}
function linesCount(multilineString) {
    return (multilineString.match(/\n/g) || '').length;
}
function svelteFragmentDivider(file) {
    var _a, _b;
    const svelteFileRoot = node_html_parser_1.parse(file);
    const jsString = (_a = svelteFileRoot.querySelector('script')) === null || _a === void 0 ? void 0 : _a.toString();
    const cssString = (_b = svelteFileRoot.querySelector('style')) === null || _b === void 0 ? void 0 : _b.toString();
    const jsRegex = jsString && new RegExp(escapeRegExp(jsString));
    const cssRegex = cssString && new RegExp(escapeRegExp(cssString));
    const firstSplit = jsRegex ? file.split(jsRegex) : [file];
    const secondSplit = cssRegex ? firstSplit.map((split) => split.split(cssRegex)) : [firstSplit];
    let htmlFragmentAdjusters = [];
    const html = {
        start: '',
        middle: '',
        end: '',
    };
    const splits = secondSplit.flatMap((e) => e);
    if (jsString && cssString) {
        htmlFragmentAdjusters = splits.flatMap((fragment, i) => (i === 0
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
                    : 0));
        html.start = splits[0].replace(/\n$/, '');
        html.middle = splits[1].replace(/(^\n|\n$)/g, '');
        html.end = splits[2].replace(/^\n/, '');
    }
    else if (jsString || cssString) {
        htmlFragmentAdjusters = splits.map((fragment, i) => (i === 0
            ? fragment.slice(-1) === '\n'
                ? 1
                : 0
            : fragment.slice(0, 1) === '\n'
                ? 1
                : 0));
        html.start = splits[0].replace(/\n$/, '');
        html.end = splits[1].replace(/^\n/, '');
    }
    const htmlFragmentLengths = [linesCount(html.start), linesCount(html.middle), linesCount(html.end)];
    const jsLength = ((jsString || '').match(/\n/g) || '').length;
    const cssLength = ((cssString || '').match(/\n/g) || '').length;
    const htmlFragments = [];
    let style;
    let script;
    if (jsString && cssString) {
        const scriptFirst = secondSplit[0].length === 1;
        const firstSection = 1;
        const secondSection = firstSection + htmlFragmentLengths[0] + htmlFragmentAdjusters[0];
        const thirdSection = secondSection + (scriptFirst ? jsLength : cssLength) + htmlFragmentAdjusters[1];
        const fourthSection = thirdSection + htmlFragmentLengths[1] + htmlFragmentAdjusters[2];
        const fifthSection = fourthSection + (scriptFirst ? cssLength : jsLength) + htmlFragmentAdjusters[3];
        if (stripEmptyStartEnd(html.start) !== '') {
            htmlFragments.push({ fragment: html.start, start: firstSection });
        }
        if (stripEmptyStartEnd(html.middle) !== '') {
            htmlFragments.push({ fragment: html.middle, start: thirdSection });
        }
        if (stripEmptyStartEnd(html.end) !== '') {
            htmlFragments.push({ fragment: html.end, start: fifthSection });
        }
        style = { fragment: cssString, start: scriptFirst ? fourthSection : secondSection };
        script = { fragment: jsString, start: scriptFirst ? secondSection : fourthSection };
    }
    else if (jsString || cssString) {
        const firstSection = 1;
        const secondSection = firstSection + htmlFragmentLengths[0] + htmlFragmentAdjusters[0];
        const thirdSection = secondSection + (jsString ? jsLength : cssLength) + htmlFragmentAdjusters[1];
        if (stripEmptyStartEnd(html.start) !== '') {
            htmlFragments.push({ fragment: html.start, start: firstSection });
        }
        if (stripEmptyStartEnd(html.end) !== '') {
            htmlFragments.push({ fragment: html.end, start: thirdSection });
        }
        if (jsString) {
            script = { fragment: jsString, start: secondSection };
        }
        else {
            style = { fragment: cssString, start: secondSection };
        }
    }
    else if (stripEmptyStartEnd(splits[0]) !== '') {
        htmlFragments.push({ fragment: splits[0], start: 1 });
    }
    return {
        htmlFragments: htmlFragments.length > 0 ? htmlFragments : undefined,
        script,
        style,
    };
}
exports.svelteFragmentDivider = svelteFragmentDivider;
