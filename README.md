# Fragment divider for svelte files

Divide svelte files (also with typescript or css preprocessor) into script, style and HTML fragments including the line number where each fragment starts. 
Empty HTML fragments are ignored.

### Installation

npm install @floratmin/svelte-fragment-divider

### Usage:

```ts
import fs from 'fs';
import path from 'path';
import {svelteFragmentDivider} from '@floratmin/svelte-fragment-divider';

const fileName = 'src/App.svelte'
const svelteFile = fs.readFileSync(path.resolve(fileName), 'utf-8');

const fragments = svelteFragmentDivider(svelteFile, fileName);
```
From the following svelte file
```
<script lang="ts">
  export let a: string;
</script>

<style lang="less">
  p {
    color: black;
  }
</style>

<p>{'Foo'}</p>

{#if ifCondition}
  <Component prop={bar}>{baz}</Component>
{/if}

```
we get the following object:
```js
{
  fileName: 'src/App.svelte',
  htmlFragments: [
    {
      fragment: `
<p>{'Foo'}</p>
{#if ifCondition}
  <Component prop={bar}>{baz}</Component>
{/if}
`,
      startLine: 10,
      startChar: 111,
      endChar: 193
    },
  ],
  scriptInHTMLFragments: [
    {
      fragment: "'Foo'",
      startLine: 11,
      startChar: 116,
      endChar: 121
    },
    {
      fragment: 'ifCondition',
      startLine: 13,
      startChar: 133,
      endChar: 144
    },
    {
      fragment: 'bar',
      startLine: 14,
      startChar: 165,
      endChar: 168
    },
    {
      fragment: 'baz',
      startLine: 14,
      startChar: 171,
      endChar: 174
    },   
  ],     
  script: {
    fragment: `<script lang="ts">\n  export let a: string;\n</script>`,
    startLine: 1,
    startChar: 0,
    endChar: 52
  },
  style: {
    fragment: `<style lang="less">\n  p {\n    color: black;\n  }\n</style>`,
    startLine: 5,
    startChar: 54,
    endChar: 110
  }
};
```