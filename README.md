# Fragment divider for svelte files

Divide svelte files into script, style and HTML fragments including the line number where each fragment starts. 
Empty HTML fragments are ignored.

### Installation

npm install @floratmin/svelte-fragment-divider

### Usage:

```ts
import fs from 'fs';
import {svelteFragmentDivider} from './divideFragments';

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
```
we get the following object:
```js
{
   htmlFragments: [
    {
      fragment: `\n<p>{'Foo'}</p>`,
      start: 11,
    },
  ],
  script: {
    fragment: `<script lang="ts">\n  export let a: string;</script>`,
    start: 2,   
  },
  style: {
    fragment: `<style>\n  p {\n    color: black;\n  }\n</style>`,
    start: 6,
  },
};
```