@ Main Page
@use file.css

@import header.md

# Main Title

## Sub Title

### SUB SUB Title

$| () => 'This value is inserted here' |$

$| Page.title |$

$| () => {
  return 'This one too';
} |$

this
is a 
paragraph

---

another
paragraph

different type of text:
- *italic*
- **bold**
- ***Bold Italic***
- `Code words`

1. one
2. two

> This is some important
> stuff said by smart people
> In those boxes

```js
console.log('test');
```

@import cool/footer.md

![Brown Square](Brown.png)

[to Folder 1](/folder/index.md)