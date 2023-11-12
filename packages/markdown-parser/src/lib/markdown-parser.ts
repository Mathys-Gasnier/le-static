
export enum LineType {
  Blank,
  Paragraph,
  Separator,
  Header,
  CodeBlock,
  Import,
  UnorderedList,
  OrderedList,
  BlockQuotes,
  Integration
}

export type LexedLine = {
  type: LineType,
  tokens: string[] // List of tokens for that line
};

export type Line = (
  {
    type: LineType.Separator
  } |
  {
    type: LineType.Paragraph | LineType.UnorderedList | LineType.OrderedList | LineType.BlockQuotes,
    lines: string[]
  } |
  {
    type: LineType.Header,
    level: number, text: string
  } |
  {
    type: LineType.CodeBlock,
    language: string,
    lines: string[]
  } | {
    type: LineType.Import,
    file: string
  } | {
    type: LineType.Integration,
    code: string,
    closed: boolean
  }
);

export type Document = Line[];

export interface Head {
  title?: string,
  template?: string,
  css?: string[],
  defines?: Record<string, string>
}

// While a line correspond to a Head element (title, css, etc) it's captured and removed from the lines returned
// The returned values contains the Head and then the left over lines that are the Document of the page
export function parseHead(inputLines: string[]): [ Head, string[] ] {
  const head: Head = {};

  const rest = [ ...inputLines ];

  for(const line of inputLines) {
    const trimmed = line.trim();

    // @use path/to/file.css
    const isUseStatement = trimmed.match(/^@use\s+/);
    if(isUseStatement) {
      head.css = [
        ...(head.css ?? []),
        trimmed.substring(isUseStatement[0].length)
      ];
      rest.shift();
      continue;
    }

    const isBeStatement = trimmed.match(/^@be\s+/);
    if(isBeStatement) {
      if(head.template) throw new Error('Page template cannot be set more than once !');
      head.template = trimmed.substring(isBeStatement[0].length);
      rest.shift();
      continue;
    }

    const isDefineStatement = trimmed.match(/^@define\s+([a-zA-Z_-]+)\s+(.*)$/);
    if(isDefineStatement) {
      head.defines = {
        ...(head.defines ?? {}),
        [isDefineStatement[1]]: isDefineStatement[2].trimEnd()
      };
      rest.shift();
      continue;
    }

    // @ Page Title
    const isTitle = trimmed.match(/^@\s+/);
    if(isTitle) {
      if(head.title) throw new Error('Page title cannot be set more than once !');
      head.title = trimmed.substring(isTitle[0].length)
      rest.shift();
      continue;
    }

    break;
  }

  return [
    head, rest
  ];
}

export function parse(input: string): [ Head, Document ] {
  let inputLines = input.split(/\r?\n/g);

  // We parse the head of the page and then assign the left over lines to the lines we are looping over
  const parsedHead = parseHead(inputLines);
  const head = parsedHead[0];
  inputLines = parsedHead[1];

  const lines: LexedLine[] = [];
  let inCodeBlock = false;
  let inIntegration = false;

  for(const line of inputLines) {

    const trimmed = line.trim();

    // If we are in an interaction we capture everything until the integration close tag
    if(inIntegration) {
      const end = line.indexOf('|$');
      if(end !== -1) {
        lines.push({ type: LineType.Integration, tokens: [ 'e', line.substring(0, end) ] });
        inIntegration = false;
        continue;
      }
      lines.push({ type: LineType.Integration, tokens: [ '', line ] });
      continue;
    }
    
    // If we are in a codeblock we simply capture lines as raw text, except if it's the code block ending
    if(inCodeBlock) {

      if(trimmed === '```') {
        inCodeBlock = false;
        lines.push({ type: LineType.CodeBlock, tokens: [ '```' ] });
        continue;
      }

      lines.push({ type: LineType.CodeBlock, tokens: [ line ] });
      continue;
    }

    // Blank Line
    if(trimmed === '') {
      lines.push({ type: LineType.Blank, tokens: [] });
      continue;
    }

    // Separator "---"
    if(trimmed === '---') {
      lines.push({ type: LineType.Separator, tokens: [ '---' ] });
      continue;
    }

    // Code Block start
    if(trimmed.startsWith('```')) {
      lines.push({ type: LineType.CodeBlock, tokens: [ '```', line.split('```')[1] ] });
      inCodeBlock = true;
      continue;
    }

    // # Title, ## sub title
    const isHeader = trimmed.match(/^(#+)\s*/);
    if(isHeader) {
      lines.push({
        type: LineType.Header,
        tokens: [
          isHeader[1],
          trimmed.substring(isHeader[0].length)
        ]
      });
      continue;
    }

    // @import path/to/component.md
    const isImport = trimmed.match(/^@import\s+/);
    if(isImport) {
      lines.push({
        type: LineType.Import,
        tokens: [ trimmed.substring(isImport[0].length) ]
      });
      continue;
    }

    /*
    - Unordered
    - List
    */
    const isUnorderedList = trimmed.match(/^[-+*]\s*/);
    if(isUnorderedList) {
      lines.push({
        type: LineType.UnorderedList,
        tokens: [ trimmed.substring(isUnorderedList[0].length) ]
      });
      continue;
    }

    /*
    1. Ordered
    2. List
    */
    const isOrderedList = trimmed.match(/^[0-9]+\.\s*/);
    if(isOrderedList) {
      lines.push({
        type: LineType.OrderedList,
        tokens: [ trimmed.substring(isOrderedList[0].length) ]
      });
      continue;
    }


    /*
    > Block
    > Quote
    */
    const isBlockQuote = trimmed.match(/^>\s*/);
    if(isBlockQuote) {
      lines.push({
        type: LineType.BlockQuotes,
        tokens: [ trimmed.substring(isBlockQuote[0].length) ]
      });
      continue;
    }

    /*
    $| () => 'js function to insert this value' |$
    */
   const isIntegration = line.indexOf('$|');
   if(isIntegration !== -1) {
    const isEnding = line.indexOf('|$');

    lines.push({ type: LineType.Integration, tokens: [ `s${isEnding === -1 ? '' : 'e'}`, line.substring(isIntegration + 2, isEnding === -1 ? undefined : isEnding) ] });

    if(isEnding === -1) inIntegration = true;
    continue;
   }

    // If it's not any of the above line type, then it's a paragraph
    lines.push({ type: LineType.Paragraph, tokens: [ line.trimEnd() ] });
  }

  const document: Document = [];
  const last = () => document[document.length - 1];

  // To build the document we reduce the line list to accumulate multiple line of the same type
  for(const line of lines) {
    if(line.type === LineType.Separator) {
      document.push({ type: line.type });
    }else if(
      line.type === LineType.Paragraph ||
      line.type === LineType.UnorderedList ||
      line.type === LineType.OrderedList ||
      line.type === LineType.BlockQuotes
    ) {
      // We accumulate the above line types
      const lastLine = last();
      if(!lastLine || lastLine.type !== line.type) {
        document.push({ type: line.type, lines: [ line.tokens[0] ?? '' ] });
      }else {
        lastLine.lines.push(line.tokens[0] ?? '');
      }
    }else if(line.type === LineType.Header) {
      document.push({
        type: LineType.Header,
        level: line.tokens[0].length,
        text: line.tokens[1]
      });
    }else if(line.type === LineType.CodeBlock) {
      const lastLine = last();
      if(!lastLine || lastLine.type !== LineType.CodeBlock) {
        document.push({
          type: LineType.CodeBlock,
          language: line.tokens[1],
          lines: []
        });
      }else if(line.tokens[0] !== '```') {
        lastLine.lines.push(line.tokens[0] ?? '');
      }
    }else if(line.type === LineType.Import) {
      document.push({
        type: line.type,
        file: line.tokens[0]
      });
    }else if(line.type === LineType.Integration) {
      const lastLine = last();
      if(
        !lastLine || 
        lastLine.type !== LineType.Integration ||
        lastLine.closed
      ) {
        document.push({
          type: LineType.Integration,
          code: line.tokens[1],
          closed: line.tokens[0].includes('e')
        });
      }else {
        lastLine.closed = line.tokens[0].includes('e');
        lastLine.code += line.tokens[1];
      }
    }
  }

  return [ head, document ];
}