import { Document, LineType, parse } from './markdown-parser';

describe('markdownParser', () => {
  it('Should properly parse basic markdown', () => {
    const markdown = `@ Main Page
@use test.css

# Title

## Sub Title

### SUB SUB Title

$| () => 'This value is inserted here' |$

$| () => {
  return 'This one too';
} |$

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

    expect(body).toEqual([
      { type: LineType.Header, level: 1, text: "Title" },
      { type: LineType.Header, level: 2, text: "Sub Title" },
      { type: LineType.Header, level: 3, text: "SUB SUB Title" },
      {
        type: LineType.Integration,
        code: " () => 'This value is inserted here' ",
        closed: true
      },
      {
        type: LineType.Integration,
        code: " () => {  return 'This one too';} ",
        closed: true
      },
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

  it('Should parse a page that is using template', () => {
    const markdown = `@ Main Page
@be template.md
@define property value1
@define thing thingy
`;
    const [ head, body ] = parse(markdown);

    expect(head).toEqual({
      title: 'Main Page',
      template: 'template.md',
      defines: {
        'property': 'value1',
        'thing': 'thingy'
      }
    });

    expect(body).toEqual([ ] as Document);
  });
});
