
export enum Statements {
  Paragraph,
  Header,
  Separator,
  Import,
  UnorderedList,
  OrderedList,
  BlockQuotes
}

export type Statement = (
  {
    type: Statements.Paragraph,
    lines: string[]
  } |
  {
    type: Statements.Header,
    level: number,
    text: string
  } |
  {
    type: Statements.Separator
  } |
  {
    type: Statements.Import,
    name: string
  } |
  {
    type: Statements.UnorderedList,
    lines: string[]
  } |
  {
    type: Statements.OrderedList,
    lines: string[]
  } |
  {
    type: Statements.BlockQuotes,
    lines: string[]
  }
);

export type Document = Statement[];

export function parse(input: string): Document {
  const document: Document = [];

  const lines = input.split(/\r?\n/g);

  let accType = Statements.Paragraph;
  let acc: string[] = [];

  function push(statement: Statement) {
    if(statement.type === Statements.Paragraph) {
      if(acc.length === 0) return;
      acc = []; 
    }
    document.push(statement);
  }

  for(const line of lines) {
    const isEmpty = line.trim() === '';
    const isHeader = line.trimStart().match(/^(#+)\s*/);
    const isSeparator = line.trim() === '---';
    const isImport = line.trimStart().match(/^<<<\s*/);
    const isUnorderedList = line.trimStart().match(/^[-*+]\s*/);
    const isOrderedList = line.trimStart().match(/^[0-9]+\.\s*/);
    const isBlockQuote = line.trimStart().match(/^>\s*/);

    if(isUnorderedList && !isSeparator) {
      if(accType !== Statements.UnorderedList) push({ type: accType, lines: acc });

      accType = Statements.UnorderedList;
      acc.push(line.substring(isUnorderedList[0].length));
      continue;
    }
    if(accType === Statements.UnorderedList) {
      accType = Statements.Paragraph;
      push({ type: Statements.UnorderedList, lines: acc });
      acc = [];
    }

    if(isOrderedList) {
      if(accType !== Statements.OrderedList) push({ type: accType, lines: acc });

      accType = Statements.OrderedList;
      acc.push(line.substring(isOrderedList[0].length));
      continue;
    }
    if(accType === Statements.OrderedList) {
      accType = Statements.Paragraph;
      push({ type: Statements.OrderedList, lines: acc });
      acc = [];
    }

    if(isBlockQuote) {
      if(accType !== Statements.BlockQuotes) push({ type: accType, lines: acc });

      accType = Statements.BlockQuotes;
      acc.push(line.substring(isBlockQuote[0].length));
      continue;
    }
    if(accType === Statements.BlockQuotes) {
      accType = Statements.Paragraph;
      push({ type: Statements.BlockQuotes, lines: acc });
      acc = [];
    }
    
    if(isEmpty) {
      push({ type: Statements.Paragraph, lines: acc });
      continue;
    }

    if(isHeader) {
      push({ type: Statements.Paragraph, lines: acc });

      push({
        type: Statements.Header,
        level: isHeader[1].length,
        text: line.substring(isHeader[0].length).trimEnd()
      });
      continue;
    }

    if(isSeparator) {
      push({ type: Statements.Paragraph, lines: acc });
      push({ type: Statements.Separator });
      continue;
    }

    if(isImport) {
      push({ type: Statements.Paragraph, lines: acc });

      push({
        type: Statements.Import,
        name: line.substring(isImport[0].length).trimEnd()
      });
      continue;
    }

    acc.push(line.trimEnd());
  }

  push({ type: Statements.Paragraph, lines: acc });

  return document;
}