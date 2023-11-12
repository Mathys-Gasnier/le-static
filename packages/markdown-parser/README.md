# markdown-parser

Parse a markdown string and outputs an AST.

## AST

The AST contains:

The Head, it contains an optional page title and an optional css array that contains a list of used css files.

The Document is a list of lines:
- `Paragraph` - One or more grouped lines
- `Header` - A line prefixed with one or more `#`
- `Separator` - A line with only `---`
- `CodeBlock` - A multi line code block declared with three backtick
- `Import` - An import statement: `@import path/to/file`
- `UnorderedList` - A list of lines that start with eather `-`, `*` or `+`
- `OrderedList` - A list of lines that start with a number followed by a `.`
- `BlockQuotes` - Group of lines that starts with `>`
- `Integration` - A block of js code that's executed on build

## Head Usage

### Page Title
To set the page title you can use the following snyax, It cannot be used more than once on a page.
```
@ Page Title
```

### Be Statement
To set the page template, It cannot be used more than once on a page.
```
@be path/to/template.md
```

### Define Statement
A define statement can be used to set properties that are used by the template declared via the be statement.
```
@declare name some value
```

### Use Statement
A use statement can be used to import style files into the page.
```
@use path/to/file.css
```

## Body Usage

### Paragraph
A paragraph is a group of lines that don't fit in any other category, they are automaticly separated by whitespaces and other line type.
> The returned data contains a `lines` field, with a list of the paragraph lines as string.

### Header
An header is defined by a line starting with one or more `#`.
> The returned data contains the `level` of the header (alias the number of `#`), and the text after the `#`s and any whitespaces.

```md
# Title
## Sub title
```

### Separator
Use to create separation between two elements.
> Returns no aditional values.

```md
---
```

### Code Block
A code block can be use to apply specific syntax or style to multiple lines of code.

> Returns the `langage` of the code block and it's content `lines`.

Valid:
`````md
```js
console.log('Hello World!');
```
`````

Invalid:
`````md
```console.log('Hello World');```


```
console.log('Hello World');```
`````

### Import
Import statements can be used to import component and place them inside the page.
> Returns the path of the `file` imported.

```
@import path/to/component.md
```

### UnorderedList
Unordered lists are a grouping of multiple lines starting with `-`, `*` or `+`.
> Returns the list of `lines` without the prefix (`-`, `*` or `+`).

```md
- First Element
- Second
* Third
+ Fourth
```

### OrderedList
Ordered lists are a grouping of multiple lines starting with a number suffixed by a `.`, the number given has no importance.
> Returns the list of `lines` without the prefix.

```md
1. First Element
2. Second
9. Third
```

### Block Quotes
Block quotes are a grouping of multiple lines stating with `>`.
> Returns the list of `lines` without the prefix.

```md
> This is the inside of a
> Block Quote !
```

### Integration
Integration are a block of js, it can be a function or anything else. \
They are executed when the file is built, they can be used to generate content depending on the current state of the project.
> Returns the `code` inside the block and if it's been `closed`

```md
$|
() => 'This String will be put in place of this block'
|$
```