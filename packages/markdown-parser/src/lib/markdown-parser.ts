
export enum LineType {
  Blank,
  Paragraph,
  Separator,
  Header,
  CodeBlock,
  Import,
  UnorderedList,
  OrderedList,
  BlockQuotes
}

export type LexedLine = {
  type: LineType,
  tokens: string[]
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
  }
);

export type Document = Line[];

export interface Head {
  title?: string,
  css?: string[]
}

export function parseHead(inputLines: string[]): [ Head, string[] ] {
  const head: Head = {};

  const rest = [ ...inputLines ];

  for(const line of inputLines) {
    const trimmed = line.trim();

    const isUseStatement = trimmed.match(/^@use\s+/);
    if(isUseStatement) {
      head.css = [
        ...(head.css ?? []),
        trimmed.substring(isUseStatement[0].length)
      ];
      rest.shift();
      continue;
    }

    const isTitle = trimmed.match(/^@\s+/);
    if(isTitle) {
      if(head.title) throw new Error('Page title cannot be set twice !');
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

  const parsedHead = parseHead(inputLines);
  const head = parsedHead[0];

  inputLines = parsedHead[1];

  const lines: LexedLine[] = [];
  let inCodeBlock = false;

  for(const line of inputLines) {

    const trimmed = line.trim();
    
    if(inCodeBlock) {

      if(trimmed === '```') {
        inCodeBlock = false;
        lines.push({ type: LineType.CodeBlock, tokens: [ '```' ] });
        continue;
      }

      lines.push({ type: LineType.CodeBlock, tokens: [ line ] });
      continue;
    }

    if(trimmed === '') {
      lines.push({ type: LineType.Blank, tokens: [] });
      continue;
    }

    if(trimmed === '---') {
      lines.push({ type: LineType.Separator, tokens: [ '---' ] });
      continue;
    }

    if(trimmed.startsWith('```')) {
      lines.push({ type: LineType.CodeBlock, tokens: [ '```', line.split('```')[1] ] });
      inCodeBlock = true;
      continue;
    }

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

    const isImport = trimmed.match(/^@import\s+/);
    if(isImport) {
      lines.push({
        type: LineType.Import,
        tokens: [ trimmed.substring(isImport[0].length) ]
      });
      continue;
    }

    const isUnorderedList = trimmed.match(/^[-+*]\s*/);
    if(isUnorderedList) {
      lines.push({
        type: LineType.UnorderedList,
        tokens: [ trimmed.substring(isUnorderedList[0].length) ]
      });
      continue;
    }

    const isOrderedList = trimmed.match(/^[0-9]+\.\s*/);
    if(isOrderedList) {
      lines.push({
        type: LineType.OrderedList,
        tokens: [ trimmed.substring(isOrderedList[0].length) ]
      });
      continue;
    }

    const isBlockQuote = trimmed.match(/^>\s*/);
    if(isBlockQuote) {
      lines.push({
        type: LineType.BlockQuotes,
        tokens: [ trimmed.substring(isBlockQuote[0].length) ]
      });
      continue;
    }

    lines.push({ type: LineType.Paragraph, tokens: [ line.trimEnd() ] });
  }

  const document: Document = [];
  const last = () => document[document.length - 1];

  for(const line of lines) {
    if(line.type === LineType.Separator) {
      document.push({ type: line.type });
    }else if(
      line.type === LineType.Paragraph ||
      line.type === LineType.UnorderedList ||
      line.type === LineType.OrderedList ||
      line.type === LineType.BlockQuotes
    ) {
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
    }
  }

  return [ head, document ];
}