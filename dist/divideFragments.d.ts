export declare type SvelteCodeFragment = {
    fragment: string;
    start: number;
};
export declare type SvelteCodeFragments = {
    script: SvelteCodeFragment | undefined;
    style: SvelteCodeFragment | undefined;
    htmlFragments: SvelteCodeFragment[] | undefined;
};
export declare function svelteFragmentDivider(file: string): SvelteCodeFragments;
