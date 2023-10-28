# markdown-parser

This library parses a markdown string and outputs a Document

A document is a liste of Statements, Statements are:
- Paragraph - One or more grouped lines
- Header - A line prefixed with one or more "#"
- Separator - A line with only "---"
- Import - An import statement: "<<< path/to/file"