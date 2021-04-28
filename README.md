# Fragment divider for svelte files

Divide svelte files into script, style and HTML fragments including the line number where each fragment starts. 
Empty HTML fragments are ignored.

### Installation

npm install @floratmin/svelte-fragment-divider

### Usage:

```ts
import fs from 'fs';
import {svelteFragmentDivider} from '@floratmin/svelte-fragment-divider';

const svelteFile = fs.readFileSync('./App.svelte', 'utf-8');

const fragments = svelteFragmentDivider(svelteFile);
```
From the following file
```html

<script lang="ts">
  export let a: string;
</script>

<style>
  p {
    color: black;
  }
</style>

<p>{'Foo'}</p>

{#if ifCondition}
  {'Bar'}
{/if}
```
we get the following object:
```js
{
   htmlFragments: [
    {
      fragment: `\n<p>{'Foo'}</p>\n{#if ifCondition}\n  {'Bar'}\n{/if}`,
      startLine: 11,
    },
  ],
  scriptInHTMLFragments: [
    {
      fragment: "'Foo'",
      startLine: 12
    },
    {
      fragment: "'Bar'",
      startLine: 15 
    },   
  ],     
  script: {
    fragment: `<script lang="ts">\n  export let a: string;</script>`,
    startLine: 2,   
  },
  style: {
    fragment: `<style>\n  p {\n    color: black;\n  }\n</style>`,
    startLine: 6,
  },
};
```