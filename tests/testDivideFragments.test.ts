import { svelteFragmentDivider } from '../src';

// template literal function which removes first and last line of string and removes indentation for all other lines relative to indentation of second line.
function i(strings: TemplateStringsArray) {
  const stringArray = strings[0].split('\n');
  const indentation = stringArray[1].match(/\s*/g)![0].length;
  return stringArray
    .slice(1, -1)
    .map((string) => string.slice(indentation))
    .join('\n');
}

describe('Testing the proper division of svelte files', () => {
  test('Readme sample', () => {
    const svelteFile = i`
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
      `;
    expect(svelteFragmentDivider(svelteFile, 'src/App.svelte')).toEqual({
      fileName: 'src/App.svelte',
      htmlFragments: [
        {
          fragment: i`
          
          
          <p>{'Foo'}</p>

          {#if ifCondition}
            <Component prop={bar}>{baz}</Component>
          {/if}
          `,
          startLine: 9,
          startChar: 110,
          endChar: 193,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 11,
          startChar: 116,
          endChar: 121,
        },
        {
          fragment: 'ifCondition',
          startLine: 13,
          startChar: 133,
          endChar: 144,
        },
        {
          fragment: 'bar',
          startLine: 14,
          startChar: 165,
          endChar: 168,
        },
        {
          fragment: 'baz',
          startLine: 14,
          startChar: 171,
          endChar: 174,
        },
      ],
      script: {
        fragment: `<script lang="ts">\n  export let a: string;\n</script>`,
        startLine: 1,
        startChar: 0,
        endChar: 52,
      },
      style: {
        fragment: `<style lang="less">\n  p {\n    color: black;\n  }\n</style>`,
        startLine: 5,
        startChar: 54,
        endChar: 110,
      },
    });
  });
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
        <p>{Foo}</p>
      </body>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            
            <body>
              <p>{Foo}</p>
            </body>
            `,
          startLine: 8,
          startChar: 112,
          endChar: 142,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'Foo',
          startLine: 10,
          startChar: 126,
          endChar: 129,
        },
      ],
      script: {
        fragment: i`
          <script lang="ts">
            export let prop: string;
          </script>
          `,
        startLine: 1,
        startChar: 0,
        endChar: 55,
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
        startChar: 56,
        endChar: 112,
      },
    });
  });
  test('Typescript with module, style and HTML', () => {
    const svelteFile = i`
      <script type="module">
        export async function load({fetch}: {fetch: Function}): Promise<{props: {foo: string}, status: number, error: Error}> {
          const res = await fetch('/api');

          if (res.ok) return {
              props: await res.json(),
            };

          return {
            status: res.status,
            error: new Error(),
          }
        }
      </script>
      <script lang="ts">
        export let foo: string;
      </script>
      <style lang="less">
        p {
          color: black;
        }
      </style>
      <body>
        <p>{Foo}</p>
      </body>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            
            <body>
              <p>{Foo}</p>
            </body>
            `,
          startLine: 22,
          startChar: 447,
          endChar: 477,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'Foo',
          startLine: 24,
          startChar: 461,
          endChar: 464,
        },
      ],
      script: [
        {
          fragment: i`
            <script type="module">
              export async function load({fetch}: {fetch: Function}): Promise<{props: {foo: string}, status: number, error: Error}> {
                const res = await fetch('/api');

                if (res.ok) return {
                    props: await res.json(),
                  };

                return {
                  status: res.status,
                  error: new Error(),
                }
              }
            </script>
            `,
          startLine: 1,
          startChar: 0,
          endChar: 335,
        },
        {
          fragment: i`
            <script lang="ts">
              export let foo: string;
            </script>
            `,
          startLine: 15,
          startChar: 336,
          endChar: 390,
        },
      ],
      style: {
        fragment: i`
          <style lang="less">
            p {
              color: black;
            }
          </style>
          `,
        startLine: 18,
        startChar: 391,
        endChar: 447,
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
          fragment: "<p>{'Foo'}</p>\n",
          startLine: 1,
          startChar: 0,
          endChar: 15,
        },
        {
          fragment: "\n<p>{'Bar'}</p>\n",
          startLine: 6,
          startChar: 59,
          endChar: 75,
        },
        {
          fragment: "\n<p>{'Baz'}</p>",
          startLine: 10,
          startChar: 112,
          endChar: 127,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 4,
          endChar: 9,
        },
        {
          fragment: "'Bar'",
          startLine: 7,
          startChar: 64,
          endChar: 69,
        },
        {
          fragment: "'Baz'",
          startLine: 11,
          startChar: 117,
          endChar: 122,
        },
      ],
      script: {
        fragment: i`
        <script>
          export let prop;
        </script>
        `,
        startLine: 8,
        startChar: 75,
        endChar: 112,
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
        startChar: 15,
        endChar: 59,
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
          startChar: 0,
          endChar: 14,
        },
        {
          fragment: "<p>{'Bar'}</p>",
          startLine: 1,
          startChar: 44,
          endChar: 58,
        },
        {
          fragment: "<p>{'Baz'}</p>",
          startLine: 1,
          startChar: 89,
          endChar: 103,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 4,
          endChar: 9,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 48,
          endChar: 53,
        },
        {
          fragment: "'Baz'",
          startLine: 1,
          startChar: 93,
          endChar: 98,
        },
      ],
      script: {
        fragment: i`
        <script>export let a;</script>
        `,
        startLine: 1,
        startChar: 14,
        endChar: 44,
      },
      style: {
        fragment: i`
        <style>p{color: black;}</style>
        `,
        startLine: 1,
        startChar: 58,
        endChar: 89,
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
        startLine: 2,
        startChar: 1,
        endChar: 35,
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
          fragment: `\n<p>{'Foo'}</p>`,
          startLine: 3,
          startChar: 34,
          endChar: 49,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 4,
          startChar: 39,
          endChar: 44,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        startLine: 1,
        startChar: 0,
        endChar: 34,
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
          startChar: 0,
          endChar: 14,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 4,
          endChar: 9,
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
          fragment: `<p>{'Foo'}</p>\n`,
          startLine: 1,
          startChar: 0,
          endChar: 15,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 4,
          endChar: 9,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        startLine: 2,
        startChar: 15,
        endChar: 49,
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
        startChar: 47,
        endChar: 84,
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
        startChar: 1,
        endChar: 45,
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
          startChar: 0,
          endChar: 14,
        },
        {
          fragment: `<p>{'Bar'}</p>`,
          startLine: 5,
          startChar: 58,
          endChar: 72,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 4,
          endChar: 9,
        },
        {
          fragment: "'Bar'",
          startLine: 5,
          startChar: 62,
          endChar: 67,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        startLine: 5,
        startChar: 72,
        endChar: 109,
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
        startChar: 14,
        endChar: 58,
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
          fragment: `\n\n<p>\n  {'Foo'}\n  {'Bar'}\n</p>\n`,
          startLine: 3,
          startChar: 37,
          endChar: 68,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 6,
          startChar: 46,
          endChar: 51,
        },
        {
          fragment: "'Bar'",
          startLine: 7,
          startChar: 56,
          endChar: 61,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        startLine: 1,
        startChar: 0,
        endChar: 37,
      },
    });
  });
});
describe('Testing parsing of JavaScript in Svelte with HTML', () => {
  test('RawMustacheTag', () => {
    const svelteFile = i`4yy
      <p>{@html 'Foo'}</p>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<p>{@html 'Foo'}</p>`,
          startLine: 1,
          startChar: 0,
          endChar: 20,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 10,
          endChar: 15,
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
          startChar: 0,
          endChar: 32,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 23,
          endChar: 28,
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
          startChar: 0,
          endChar: 107,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 23,
          endChar: 28,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 31,
          endChar: 36,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 74,
          endChar: 79,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 85,
          endChar: 90,
        },
      ],
    });
  });
  test('Element with shortcut attribute', () => {
    const svelteFile = i`
      <Compontent {attribute} />
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `<Compontent {attribute} />`,
          startLine: 1,
          startChar: 0,
          endChar: 26,
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
          startChar: 0,
          endChar: 115,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 27,
          endChar: 32,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 35,
          endChar: 40,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 82,
          endChar: 87,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 93,
          endChar: 98,
        },
      ],
    });
  });
  test('Binding shortcut (#1)', () => {
    const svelteFile = i`
      <Compontent bind:value></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          endChar: 36,
          fragment: `<Compontent bind:value></Compontent>`,
          startChar: 0,
          startLine: 1,
        },
      ],
    });
  });
  test('Binding boolean shortcut', () => {
    const svelteFile = i`
      <input type="checkbox" disabled checked />
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          endChar: 42,
          fragment: `<input type="checkbox" disabled checked />`,
          startChar: 0,
          startLine: 1,
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
          startChar: 0,
          endChar: 105,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 22,
          endChar: 27,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 30,
          endChar: 35,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 72,
          endChar: 77,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 83,
          endChar: 88,
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
          startChar: 0,
          endChar: 217,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 19,
          endChar: 24,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 27,
          endChar: 32,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 66,
          endChar: 71,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 77,
          endChar: 82,
        },
        {
          fragment: "'Foo2'",
          startLine: 3,
          startChar: 126,
          endChar: 132,
        },
        {
          fragment: "'Bar2'",
          startLine: 3,
          startChar: 135,
          endChar: 141,
        },
        {
          fragment: "'Baz2'",
          startLine: 4,
          startChar: 182,
          endChar: 188,
        },
        {
          fragment: "'Bax2'",
          startLine: 4,
          startChar: 194,
          endChar: 200,
        },
      ],
    });
  });
  test('Class shortcuts', () => {
    const svelteFile = i`
      <Compontent class:active></Compontent>
      <Compontent class:valid></Compontent>
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: i`
            <Compontent class:active></Compontent>
            <Compontent class:valid></Compontent>
          `,
          startLine: 1,
          startChar: 0,
          endChar: 76,
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
          startChar: 0,
          endChar: 109,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 24,
          endChar: 29,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 32,
          endChar: 37,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 76,
          endChar: 81,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 87,
          endChar: 92,
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
          startChar: 0,
          endChar: 119,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 29,
          endChar: 34,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 37,
          endChar: 42,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 86,
          endChar: 91,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 97,
          endChar: 102,
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
          startChar: 0,
          endChar: 113,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 26,
          endChar: 31,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 34,
          endChar: 39,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 80,
          endChar: 85,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 91,
          endChar: 96,
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
          startChar: 0,
          endChar: 113,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: "'Foo'",
          startLine: 1,
          startChar: 26,
          endChar: 31,
        },
        {
          fragment: "'Bar'",
          startLine: 1,
          startChar: 34,
          endChar: 39,
        },
        {
          fragment: "'Baz'",
          startLine: 2,
          startChar: 80,
          endChar: 85,
        },
        {
          fragment: "'Bax'",
          startLine: 2,
          startChar: 91,
          endChar: 96,
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
          startChar: 0,
          endChar: 182,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'ifCondition',
          startLine: 1,
          startChar: 5,
          endChar: 16,
        },
        {
          fragment: "'Foo'",
          startLine: 2,
          startChar: 21,
          endChar: 26,
        },
        {
          fragment: 'ifCondition2',
          startLine: 4,
          startChar: 39,
          endChar: 51,
        },
        {
          fragment: "'Foo2'",
          startLine: 5,
          startChar: 56,
          endChar: 62,
        },
        {
          fragment: "'Bar2'",
          startLine: 7,
          startChar: 75,
          endChar: 81,
        },
        {
          fragment: 'ifCondition3',
          startLine: 9,
          startChar: 94,
          endChar: 106,
        },
        {
          fragment: "'Foo3'",
          startLine: 10,
          startChar: 111,
          endChar: 117,
        },
        {
          fragment: 'elseIfCondition3',
          startLine: 11,
          startChar: 129,
          endChar: 145,
        },
        {
          fragment: "'Bar3'",
          startLine: 12,
          startChar: 150,
          endChar: 156,
        },
        {
          fragment: "'Baz3'",
          startLine: 14,
          startChar: 169,
          endChar: 175,
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
          startChar: 0,
          endChar: 102,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'eachArray',
          startLine: 1,
          startChar: 7,
          endChar: 16,
        },
        {
          fragment: "'Foo'",
          startLine: 2,
          startChar: 26,
          endChar: 31,
        },
        {
          fragment: 'eachArray2',
          startLine: 4,
          startChar: 48,
          endChar: 58,
        },
        {
          fragment: "'Foo2'",
          startLine: 5,
          startChar: 68,
          endChar: 74,
        },
        {
          fragment: "'Bar2'",
          startLine: 7,
          startChar: 87,
          endChar: 93,
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
          startChar: 0,
          endChar: 32,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'keyBlock',
          startLine: 1,
          startChar: 6,
          endChar: 14,
        },
        {
          fragment: "'Foo'",
          startLine: 2,
          startChar: 19,
          endChar: 24,
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
          startChar: 0,
          endChar: 241,
        },
      ],
      scriptInHTMLFragments: [
        {
          fragment: 'promise',
          startLine: 1,
          startChar: 8,
          endChar: 15,
        },
        {
          fragment: "'Foo'",
          startLine: 2,
          startChar: 20,
          endChar: 25,
        },
        {
          fragment: "'Bar'",
          startLine: 4,
          startChar: 43,
          endChar: 48,
        },
        {
          fragment: "'Baz'",
          startLine: 6,
          startChar: 67,
          endChar: 72,
        },
        {
          fragment: 'promise2',
          startLine: 8,
          startChar: 91,
          endChar: 99,
        },
        {
          fragment: "'Foo2'",
          startLine: 9,
          startChar: 104,
          endChar: 110,
        },
        {
          fragment: "'Bar2'",
          startLine: 11,
          startChar: 128,
          endChar: 134,
        },
        {
          fragment: 'promise3',
          startLine: 13,
          startChar: 153,
          endChar: 161,
        },
        {
          fragment: "'Foo3'",
          startLine: 14,
          startChar: 176,
          endChar: 182,
        },
        {
          fragment: 'promise4',
          startLine: 16,
          startChar: 201,
          endChar: 209,
        },
        {
          fragment: "'Foo4'",
          startLine: 17,
          startChar: 225,
          endChar: 231,
        },
      ],
    });
  });
});
describe('Testing error handling', () => {
  test('Throws if unterminated literal is in html.', () => {
    const svelteFile = i`
      <p>{\`<script></script>\`}</p>

      <style>p {color: black;}</style>

      <script>
        export let p;
      </script>
    `;
    expect(() => svelteFragmentDivider(svelteFile)).toThrowError(i`
        Unterminated template literal (1:5)
        1: <p>{\`
      `);
  });
});
