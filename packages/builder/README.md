# builder

Builds a project and outputs it to the build directory.

## Usage

```ts
function build(project: Project);
```

The build function takes in a project loaded via the loader package. <br>
It then builds every pages of that project, the components used are also built and cached to avoid rebuild the same component many times. <br>
When every page has been built they are written to the dist file, and it then copies every style files and resource files to the dist directory.

