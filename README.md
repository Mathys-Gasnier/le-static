# LeStatic

A framework to create, generate and manage static markdown websites

## [cli](apps/cli/)
> A cli interface for le-static

### Usage

```
Usage: les [options]
Options:
  -p, --project <PATH>  Specify the directory of the project to build
  -s, --serve <PORT>    Serve the built project on a given port
  -h, --help            display help for command
```

## Packages

### [markdown-parser](packages/markdown-parser/)
> Parse a markdown string and outputs an AST.

### [loader](packages/loader/)
> Loads a project folders and it's config.

### [server](packages/server/)
> Static express server to serve built applications.

### [builder](packages/builder/)
> Builds a project and outputs it to the build directory.