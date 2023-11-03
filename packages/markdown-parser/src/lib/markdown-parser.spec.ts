//import { Document, Statements, parse } from './markdown-parser';
import { Document, LineType, parse } from './markdown-parser';

describe('markdownParser', () => {
  it('Should properly parse basic markdown', () => {
    const markdown = `@ Main Page
@use test.css

# Title

## Sub Title

### SUB SUB Title

this
is a 
paragraph

---

another
paragraph

\`\`\`js
console.log('code block');
\`\`\`

- one
-maybe two
* three
+ four

1. one
2. two
3. three

> I'm
> A
> BlockQuote

@import cool/footer.md
`;
    const [ head, body ] = parse(markdown);

    expect(head).toEqual({
      title: 'Main Page',
      css: [ 'test.css' ]
    });

    expect(body)
    .toEqual([
      { type: LineType.Header, level: 1, text: "Title" },
      { type: LineType.Header, level: 2, text: "Sub Title" },
      { type: LineType.Header, level: 3, text: "SUB SUB Title" },
      {
        type: LineType.Paragraph,
        lines: [
          'this',
          'is a',
          'paragraph',
        ]
      },
      { type: LineType.Separator },
      {
        type: LineType.Paragraph,
        lines: [
          'another',
          'paragraph'
        ]
      },
      {
        type: LineType.CodeBlock,
        language: 'js',
        lines: [ "console.log('code block');" ]
      },
      {
        type: LineType.UnorderedList,
        lines: [ 'one', 'maybe two', 'three', 'four' ]
      },
      {
        type: LineType.OrderedList,
        lines: [ 'one', 'two', 'three' ]
      },
      {
        type: LineType.BlockQuotes,
        lines: [ "I'm", 'A', 'BlockQuote' ]
      },
      {
        type: LineType.Import,
        file: 'cool/footer.md'
      }
    ] as Document);
  });
});
