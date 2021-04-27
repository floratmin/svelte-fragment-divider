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
      <style>
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
          start: 9,
        },
      ],
      script: {
        fragment: i`
          <script lang="ts">
            export let prop: string;
          </script>
          `,
        start: 1,
      },
      style: {
        fragment: i`
          <style>
            p {
              color: black;
            }
          </style>
          `,
        start: 4,
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
          start: 1,
        },
        {
          fragment: "<p>{'Bar'}</p>",
          start: 7,
        },
        {
          fragment: "<p>{'Baz'}</p>",
          start: 11,
        },
      ],
      script: {
        fragment: i`
        <script>
          export let prop;
        </script>
        `,
        start: 8,
      },
      style: {
        fragment: i`
        <style>
          p {
            color: black;
          }
        </style>
        `,
        start: 2,
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
          start: 1,
        },
        {
          fragment: "<p>{'Bar'}</p>",
          start: 1,
        },
        {
          fragment: "<p>{'Baz'}</p>",
          start: 1,
        },
      ],
      script: {
        fragment: i`
        <script>export let a;</script>
        `,
        start: 1,
      },
      style: {
        fragment: i`
        <style>p{color: black;}</style>
        `,
        start: 1,
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
        start: 1,
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
          start: 4,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        start: 1,
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
          start: 1,
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
          start: 1,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let a;
          </script>
        `,
        start: 2,
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
        start: 8,
      },
      style: {
        fragment: i`
          <style>
            p {
              color: black;
            }
          </style>
        `,
        start: 2,
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
          start: 1,
        },
        {
          fragment: `<p>{'Bar'}</p>`,
          start: 5,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        start: 5,
      },
      style: {
        fragment: i`
          <style>
            p {
              color: black;
            }
          </style>
        `,
        start: 1,
      },
    });
  });
  test('Space in HTML fragments is preserved', () => {
    const svelteFile = i`
      <script>
        export let prop;
      </script>
      
      <p>{'Foo'}</p>
      
    `;
    expect(svelteFragmentDivider(svelteFile)).toEqual({
      htmlFragments: [
        {
          fragment: `\n<p>{'Foo'}</p>\n`,
          start: 4,
        },
      ],
      script: {
        fragment: i`
          <script>
            export let prop;
          </script>
        `,
        start: 1,
      },
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
});
