
export enum Statements {
  Paragraph,
  Header,
  Separator,
  Import
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
  }
);

export type Document = Statement[];

export function parse(input: string): Document {
  const document: Document = [];

  const lines = input.split(/\r?\n/g);

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