
export enum Statements {
  Paragraph, // Normal paragraph separated by other Statements or blank lines
  Header, // Header line (one or multiple # to define level)
  Separator, // An horizontal line/separator
  Import, // Import styles and components
  UnorderedList,
  OrderedList,
  BlockQuotes // Paragraph preceded with >
}

export type Statement = (
  {
    type: Statements.Paragraph,
    lines: string[]
  } |
  {
    type: Statements.Header,
    level: number, // # = 1, ## = 2, ...
    text: string
  } |
  {
    type: Statements.Separator
  } |
  {
    type: Statements.Import,
    name: string // name/path of the imported thing
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

  // The current accumulating statement (used for statements that accumulate lines)
  let accType = Statements.Paragraph;
  // Line accumulator
  let acc: string[] = [];

  function push(statement: Statement) {
    // If the pushed statement is a paragraph, check if the accumulator is not empty, if not reset it
    if(statement.type === Statements.Paragraph) {
      if(acc.length === 0) return;
      acc = []; 
    }
    document.push(statement);
  }

  for(const line of lines) {
    // every condition for knowing the statement type
    const isEmpty = line.trim() === ''; // Is the line a blank line ?
    const isHeader = line.trimStart().match(/^(#+)\s*/); // Is the line a header line ? (starts with one or more #)
    const isSeparator = line.trim() === '---'; // Is the line a separator ?
    const isImport = line.trimStart().match(/^<<<\s*/); // Is the line an import statement ? (line starts with "<<<")
    const isUnorderedList = line.trimStart().match(/^[-*+]\s*/); // Is the line an unordered list ? (line starts with one of -, * or +)
    const isOrderedList = line.trimStart().match(/^[0-9]+\.\s*/); // Is the line an ordered list ? (line starts with a number followwed by a ".")
    const isBlockQuote = line.trimStart().match(/^>\s*/); // Is the line a blockquote ? (line starts with a ">")

    // We also check for the separator otherwise separator are understood as unordered lists
    if(isUnorderedList && !isSeparator) {
      // If we aren't accumulating a unordered list push the accumulator to the document and proceed
      if(accType !== Statements.UnorderedList) push({ type: accType, lines: acc });

      accType = Statements.UnorderedList;
      acc.push(line.substring(isUnorderedList[0].length));
      continue;
    }
    // If it's not an ordered list and we were accumulating one then reset the accumulator and push the unordered list
    if(accType === Statements.UnorderedList) {
      accType = Statements.Paragraph;
      push({ type: Statements.UnorderedList, lines: acc });
      acc = [];
    }

    // Same as unordered list
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

    // Same as unordered list
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
    
    // If we encounter a blank line we try to push a paragraph (blank lines cut paragraphs)
    if(isEmpty) {
      push({ type: Statements.Paragraph, lines: acc });
      continue;
    }

    if(isHeader) {
      // Seen in every branch that continues the loop
      // ensure that the accumulator for paragraph is handled when being "cut" by other statements
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

    // If it's just plain text we add it to the paragraph accumulator
    acc.push(line.trimEnd());
  }

  // Push the maybe existing accumulator
  push({ type: accType, lines: acc });

  return document;
}