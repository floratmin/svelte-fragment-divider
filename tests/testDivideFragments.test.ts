import { svelteFragmentDivider } from '../src';

// template literal function which removes first and last line of string and removes indentation for all other lines relative to indentation of second line.
function i(strings: TemplateStringsArray) {
  const stringArray = strings[0].split('\n');
  const indentation = stringArray[1].match(/\s*/g)![0].length;
  return stringArray.slice(1, -1).map((string) => string.slice(indentation)).join('\n');
}

describe('Testing the proper division of svelte files', () => {
  test('Typescript, style and HTML', () => {
    const svelteFile = i`
      <script lang="ts">
        export let prop: string;
      </script>
      <style lang="less">
        p {
          color: black;
        }
      </style>
      <body>
        <p>{'Foo'}</p>
      </body>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            <body>
              <p>{'Foo'}</p>
            </body>
            `,
          startLine: 9,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 10,
        },
      ],
      script: {
        fragment: i`
          <script lang="ts">
            export let prop: string;
          </script>
          `,
        startLine: 1,
      },
      style: {
        fragment: i`
          <style lang="less">
            p {
              color: black;
            }
          </style>
          `,
        startLine: 4,
      },
    });
  });
  test('HTML, style, HTML, script, HTML', () => {
    const svelteFile = i`
      <p>{'Foo'}</p>
      <style>
        p {
          color: black;
        }
      </style>
      <p>{'Bar'}</p>
      <script>
        export let prop;
      </script>
      <p>{'Baz'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: "<p>{'Foo'}</p>",
          startLine: 1,
        },
        {
          fragment: "<p>{'Bar'}</p>",
          startLine: 7,
        },
        {
          fragment: "<p>{'Baz'}</p>",
          startLine: 11,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 7,
        },
        {
          fragment: '\'Baz\'',
          startLine: 11,
        },
      ],
      script: {
        fragment: i`
        <script>
          export let prop;
        </script>
        `,
        startLine: 8,
      },
      style: {
        fragment: i`
        <style>
          p {
            color: black;
          }
        </style>
        `,
        startLine: 2,
      },
    });
  });
  test('File in one line', () => {
    const svelteFile = i`
      <p>{'Foo'}</p><script>export let a;</script><p>{'Bar'}</p><style>p{color: black;}</style><p>{'Baz'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: "<p>{'Foo'}</p>",
          startLine: 1,
        },
        {
          fragment: "<p>{'Bar'}</p>",
          startLine: 1,
        },
        {
          fragment: "<p>{'Baz'}</p>",
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 1,
        },
      ],
      script: {
        fragment: i`
        <script>export let a;</script>
        `,
        startLine: 1,
      },
      style: {
        fragment: i`
        <style>p{color: black;}</style>
        `,
        startLine: 1,
      },
    });
  });
  test('Only script', () => {
    const svelteFile = i`
      <script>
        export let a;
      </script>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        startLine: 1,
      },
    });
  });
  test('Script and HTML', () => {
    const svelteFile = i`
      <script>
        export let a;
      </script>
      <p>{'Foo'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{'Foo'}</p>`,
          startLine: 4,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 4,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        startLine: 1,
      },
    });
  });
  test('Only HTML', () => {
    const svelteFile = i`
      <p>{'Foo'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{'Foo'}</p>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
      ],
    });
  });
  test('HTML and script and empty HTML fragment', () => {
    const svelteFile = i`
      <p>{'Foo'}</p>
      <script>
        export let a;
      </script>
        
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{'Foo'}</p>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        startLine: 2,
      },
    });
  });
  test('Empty HTML fragments', () => {
    const svelteFile = i`
      
      <style>
        p {
          color: black;
        }
      </style>
      
      <script>
        export let prop;
      </script>
      
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        startLine: 8,
      },
      style: {
        fragment: i`
          <style>
            p {
              color: black;
            }
          </style>
        `,
        startLine: 2,
      },
    });
  });
  test('Bad formatting', () => {
    const svelteFile = i`
      <p>{'Foo'}</p><style>
        p {
          color: black;
        }
      </style><p>{'Bar'}</p><script>
        export let prop;
      </script>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{'Foo'}</p>`,
          startLine: 1,
        },
        {
          fragment: `<p>{'Bar'}</p>`,
          startLine: 5,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 5,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        startLine: 5,
      },
      style: {
        fragment: i`
          <style>
            p {
              color: black;
            }
          </style>
        `,
        startLine: 1,
      },
    });
  });
  test('File Name', () => {
    const svelteFile = ``;
    expect(svelteFragmentDivider(svelteFile, 'FileName')).toEqual({
      fileName: 'FileName',
    });
  });
  test('Empty file', () => {
    const svelteFile = ``;
    expect(svelteFragmentDivider(svelteFile)).toEqual({});
  });
  test('Only whitespace', () => {
    const svelteFile = ` \n \t\n `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({});
  });
  test('Space in HTML fragments is preserved', () => {
    const svelteFile = i`
      <script>
        export let prop;
      </script>
      
      <p>
        {'Foo'}
        {'Bar'}
      </p>
      
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `\n<p>\n  {'Foo'}\n  {'Bar'}\n</p>\n`,
          startLine: 4,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 6,
        },
        {
          fragment: '\'Bar\'',
          startLine: 7,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        startLine: 1,
      },
    });
  });
});
describe('Testing parsing of JavaScript in Svelte with HTML', () => {
  test('RawMustacheTag', () => {
    const svelteFile = i`
      <p>{@html 'Foo'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{@html 'Foo'}</p>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
      ],
    });
  });
  test('Element with attribute', () => {
    const svelteFile = i`
      <Compontent attribute={'Foo'} />
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent attribute={'Foo'} />`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
      ],
    });
  });
  test('Element with attribute and child', () => {
    const svelteFile = i`
      <Compontent attribute={'Foo'}>{'Bar'}</Compontent>
      <Compontent attribute={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent attribute={'Foo'}>{'Bar'}</Compontent>\n<Compontent attribute={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Binding', () => {
    const svelteFile = i`
      <Compontent bind:property={'Foo'}>{'Bar'}</Compontent>
      <Compontent bind:property={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent bind:property={'Foo'}>{'Bar'}</Compontent>\n<Compontent bind:property={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('EventHandler', () => {
    const svelteFile = i`
      <Compontent on:event={'Foo'}>{'Bar'}</Compontent>
      <Compontent on:event={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent on:event={'Foo'}>{'Bar'}</Compontent>\n<Compontent on:event={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Binding', () => {
    const svelteFile = i`
      <Compontent bind:property={'Foo'}>{'Bar'}</Compontent>
      <Compontent bind:property={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent bind:property={'Foo'}>{'Bar'}</Compontent>\n<Compontent bind:property={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Class', () => {
    const svelteFile = i`
      <Compontent class={'Foo'}>{'Bar'}</Compontent>
      <Compontent class={'Baz'}><p>{'Bax'}<p></Compontent>
      <Compontent class:active={'Foo2'}>{'Bar2'}</Compontent>
      <Compontent class:active={'Baz2'}><p>{'Bax2'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            <Compontent class={'Foo'}>{'Bar'}</Compontent>
            <Compontent class={'Baz'}><p>{'Bax'}<p></Compontent>
            <Compontent class:active={'Foo2'}>{'Bar2'}</Compontent>
            <Compontent class:active={'Baz2'}><p>{'Bax2'}<p></Compontent>
            `,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
        {
          fragment: '\'Foo2\'',
          startLine: 3,
        },
        {
          fragment: '\'Bar2\'',
          startLine: 3,
        },
        {
          fragment: '\'Baz2\'',
          startLine: 4,
        },
        {
          fragment: '\'Bax2\'',
          startLine: 4,
        },
      ],
    });
  });
  test('Action', () => {
    const svelteFile = i`
      <Compontent use:action={'Foo'}>{'Bar'}</Compontent>
      <Compontent use:action={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent use:action={'Foo'}>{'Bar'}</Compontent>\n<Compontent use:action={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Transition', () => {
    const svelteFile = i`
      <Compontent transition:fade={'Foo'}>{'Bar'}</Compontent>
      <Compontent transition:fade={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent transition:fade={'Foo'}>{'Bar'}</Compontent>\n<Compontent transition:fade={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Animation', () => {
    const svelteFile = i`
      <Compontent animate:flip={'Foo'}>{'Bar'}</Compontent>
      <Compontent animate:flip={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent animate:flip={'Foo'}>{'Bar'}</Compontent>\n<Compontent animate:flip={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('Let', () => {
    const svelteFile = i`
      <Compontent let:property={'Foo'}>{'Bar'}</Compontent>
      <Compontent let:property={'Baz'}><p>{'Bax'}<p></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent let:property={'Foo'}>{'Bar'}</Compontent>\n<Compontent let:property={'Baz'}><p>{'Bax'}<p></Compontent>`,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: '\'Foo\'',
          startLine: 1,
        },
        {
          fragment: '\'Bar\'',
          startLine: 1,
        },
        {
          fragment: '\'Baz\'',
          startLine: 2,
        },
        {
          fragment: '\'Bax\'',
          startLine: 2,
        },
      ],
    });
  });
  test('IfBlock', () => {
    const svelteFile = i`
      {#if ifCondition}
        {'Foo'}
      {/if}
      {#if ifCondition2}
        {'Foo2'}
      {:else}
        {'Bar2'}
      {/if}
      {#if ifCondition3}
        {'Foo3'}
      {:else if elseIfCondition3}
        {'Bar3'}
      {:else}
        {'Baz3'}
      {/if}
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
          {#if ifCondition}
            {'Foo'}
          {/if}
          {#if ifCondition2}
            {'Foo2'}
          {:else}
            {'Bar2'}
          {/if}
          {#if ifCondition3}
            {'Foo3'}
          {:else if elseIfCondition3}
            {'Bar3'}
          {:else}
            {'Baz3'}
          {/if}
          `,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'ifCondition',
          startLine: 1,
        },
        {
          fragment: '\'Foo\'',
          startLine: 2,
        },
        {
          fragment: 'ifCondition2',
          startLine: 4,
        },
        {
          fragment: '\'Foo2\'',
          startLine: 5,
        },
        {
          fragment: '\'Bar2\'',
          startLine: 7,
        },
        {
          fragment: 'ifCondition3',
          startLine: 9,
        },
        {
          fragment: '\'Foo3\'',
          startLine: 10,
        },
        {
          fragment: 'elseIfCondition3',
          startLine: 11,
        },
        {
          fragment: '\'Bar3\'',
          startLine: 12,
        },
        {
          fragment: '\'Baz3\'',
          startLine: 14,
        },
      ],
    });
  });
  test('EachBlock', () => {
    const svelteFile = i`
      {#each eachArray as e}
        {'Foo'}
      {/each}
      {#each eachArray2 as e}
        {'Foo2'}
      {:else}
        {'Bar2'}
      {/each}
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
          {#each eachArray as e}
            {'Foo'}
          {/each}
          {#each eachArray2 as e}
            {'Foo2'}
          {:else}
            {'Bar2'}
          {/each}
          `,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'eachArray',
          startLine: 1,
        },
        {
          fragment: '\'Foo\'',
          startLine: 2,
        },
        {
          fragment: 'eachArray2',
          startLine: 4,
        },
        {
          fragment: '\'Foo2\'',
          startLine: 5,
        },
        {
          fragment: '\'Bar2\'',
          startLine: 7,
        },
      ],
    });
  });
  test('KeyBlock', () => {
    const svelteFile = i`
      {#key keyBlock}
        {'Foo'}
      {/key}
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            {#key keyBlock}
              {'Foo'}
            {/key}
          `,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'keyBlock',
          startLine: 1,
        },
        {
          fragment: '\'Foo\'',
          startLine: 2,
        },
      ],
    });
  });
  test('AwaitBlock', () => {
    const svelteFile = i`
      {#await promise}
        {'Foo'}
      {:then name}
        {'Bar'}
      {:catch name}
        {'Baz'}
      {/await}
      {#await promise2}
        {'Foo2'}
      {:then name}
        {'Bar2'}
      {/await}
      {#await promise3 then name}
        {'Foo3'}
      {/await}
      {#await promise4 catch name}
        {'Foo4'}
      {/await}
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            {#await promise}
              {'Foo'}
            {:then name}
              {'Bar'}
            {:catch name}
              {'Baz'}
            {/await}
            {#await promise2}
              {'Foo2'}
            {:then name}
              {'Bar2'}
            {/await}
            {#await promise3 then name}
              {'Foo3'}
            {/await}
            {#await promise4 catch name}
              {'Foo4'}
            {/await}
          `,
          startLine: 1,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'promise',
          startLine: 1,
        },
        {
          fragment: '\'Foo\'',
          startLine: 2,
        },
        {
          fragment: '\'Bar\'',
          startLine: 4,
        },
        {
          fragment: '\'Baz\'',
          startLine: 6,
        },
        {
          fragment: 'promise2',
          startLine: 8,
        },
        {
          fragment: '\'Foo2\'',
          startLine: 9,
        },
        {
          fragment: '\'Bar2\'',
          startLine: 11,
        },
        {
          fragment: 'promise3',
          startLine: 13,
        },
        {
          fragment: '\'Foo3\'',
          startLine: 14,
        },
        {
          fragment: 'promise4',
          startLine: 16,
        },
        {
          fragment: '\'Foo4\'',
          startLine: 17,
        },
      ],
    });
  });
});
