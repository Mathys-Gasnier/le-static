import { Document, Statements, parse } from './markdown-parser';

describe('markdownParser', () => {
  it('Should properly parse basic markdown', () => {
    expect(parse(`<<< file.css
# Title

## Sub Title

### SUB SUB Title

this
is a 
paragraph

---

another
paragraph

<<< cool/footer.md`))
    .toEqual([
      { type: Statements.Import, name: "file.css" },
      { type: Statements.Header, level: 1, text: "Title" },
      { type: Statements.Header, level: 2, text: "Sub Title" },
      { type: Statements.Header, level: 3, text: "SUB SUB Title" },
      {
        type: Statements.Paragraph,
        lines: [
          'this',
          'is a',
          'paragraph',
        ]
      },
      { type: Statements.Separator },
      {
        type: Statements.Paragraph,
        lines: [
          'another',
          'paragraph'
        ]
      },
      { type: Statements.Import, name: 'cool/footer.md' }
    ] as Document);
  });
});
