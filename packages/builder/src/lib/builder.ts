import { Statements, parse } from 'markdown-parser';
import { File, Folder, Project } from 'loader';
import { existsSync, mkdirSync, rmSync, writeFileSync,  } from 'fs';

export function build(project: Project): Builder {
  return new Builder(project);
}

type ProjectFolder = 'styles' | 'components';

const extentionMap: Record<string, ProjectFolder> = {
  'css': 'styles',
  'md': 'components'
};

export class Builder {

  public componentCache: Record<string, string> = {};

  constructor(public project: Project) {

    // Figure out in which dir the output should be
    const distPath = `${this.project.src}/${this.project.config.build?.outDir ?? 'dist'}`;

    // If the output dir already exists, delete it
    if(existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });

    // Build the pages
    const pages = this.buildFolder(this.project.pages);

    // Write all the pages, styles and resources to the output dir
    this.createFolder(pages, `${distPath}`, (file) => this.wrapHtml(file.name, file.content.toString()));
    this.createFolder(this.project.styles, `${distPath}/styles`);
    this.createFolder(this.project.resources, `${distPath}/resources`, (file) => file.content);
  }

  public resolveImport(path: string): [ boolean, boolean, string, string ] {
    const sections = path.split('/');

    // Decompose the file name
    const file = sections[sections.length - 1].split('.');
    const name = file.slice(0, -1).join('.');
    const extention = file[file.length - 1];

    // If the path is in the component cache return the cached version
    if(this.componentCache[path]) return [ false, true, name, this.componentCache[path] ];

    // Else figure out the file by looping over the path sections until we encounter a file or that we run out of sections
    let projectFile: File | Folder = this.project[extentionMap[extention as keyof typeof extentionMap] as ProjectFolder];
    for(const section of sections) {
      if(!projectFile) return [ true, false, '', `<error>Cannot find ${path}</error>`];
      if(projectFile.type === 'file') break;
      projectFile = projectFile.files[section];
    }

    // If the path leads to a folder or no file return an error
    if(projectFile.type === 'folder' || !projectFile) return [ true, false, '', `<error>Cannot find ${path}</error>`];

    if(extention === 'css') {
      // If it's a style import return the link to the css file
      return [ false, false, name, `<link rel="stylesheet" href="/styles/${path}" />` ];
    }else if(extention === 'md') {
      // If it's a component, it builds it, adds it to the cache and returns it
      const builtFile = this.buildFile(projectFile);
      this.componentCache[path] = builtFile.content.toString();
      return [ false, true, name, builtFile.content.toString() ];
    }

    // If we reach this, it means that the extention is not supported
    return [ true, false, '', `<error>Import of "${extention}" files not supported</error>`];
  }

  public buildFolder(folder: Folder): Folder {
    const builtFolder: Folder = { type: 'folder', files: { } };
  
    // Maps every entry of the folder while also building files
    for(const fileName in folder.files) {
      const file = folder.files[fileName];
      if(file.type === 'folder') {
        builtFolder.files[fileName] = this.buildFolder(file);
        continue;
      }
  
      builtFolder.files[fileName] = this.buildFile(file);
    }
  
    return builtFolder;
  }
  
  public buildFile(file: File): File {
    const parsedFile = parse(file.content.toString());
  
    let fileOutput = '';
  
    for(const statement of parsedFile) {
      if(statement.type === Statements.Header) {
        fileOutput += `<h${statement.level} class="header h-${statement.level}">${statement.text}</h${statement.level}>\n`;
      }else if(statement.type === Statements.Paragraph) {
        fileOutput += `<p class="paragraph">${this.buildStrings(statement.lines.join('\n'))}</p>\n`;
      }else if(statement.type === Statements.Separator) {
        fileOutput += `<span class="separator"></span>\n`;
      }else if(statement.type === Statements.Import) {
        const [
          error,   // Was there an error ?
          withDiv, // Does it needs to be wrapped in a div element ?
          name,    // The name of the imported thing
          content  // It's content
        ] = this.resolveImport(statement.name);
        // If there is an error or that we don't need a div, we simply add the output to the file
        if(error || !withDiv) {
          fileOutput += content;
          continue;
        }
        // Else we add the output while wrapping it in a div
        fileOutput += `<div class="component component-${name}">\n${content}\n</div>\n`;
      }else if(statement.type === Statements.UnorderedList) {
        fileOutput += `<ul class="ul">${statement.lines.map((str) => `<li class="li">${this.buildStrings(str)}</li>`).join('')}</ul>`;
      }else if(statement.type === Statements.OrderedList) {
        fileOutput += `<ol class="ol">${statement.lines.map((str) => `<li class="li">${this.buildStrings(str)}</li>`).join('')}</ol>`;
      }else if(statement.type === Statements.BlockQuotes) {
        fileOutput += `<p class="block-quotes">${this.buildStrings(statement.lines.join('\n'))}</p>`;
      }
    }
  
    return {
      type: 'file',
      name: file.name,
      extention: 'html',
      content: fileOutput
    };
  }

  public wrapHtml(pageName: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(this.project.config.site?.title ?? '%page_name%').replace(/%page_name%/gm, pageName)}</title>
  ${this.project.config.site?.favicon ? `<link rel="icon" type="image/x-icon" href="${this.project.config.site.favicon}">` : ''}
  <link rel="stylesheet" href="styles/index.css" />
</head>
<body>
  ${this.project.config.build?.components?.prefix ? this.resolveImport(this.project.config.build?.components?.prefix)[3] : ''}
  ${content}
  ${this.project.config.build?.components?.suffix ? this.resolveImport(this.project.config.build?.components?.suffix)[3] : ''}
</body>
</html>
    `;
  }

  // Create folder and files recursivly
  public createFolder(folder: Folder, path: string, mapFunction: (file: File) => string | Buffer = (file) => file.content) {
    mkdirSync(path, { recursive: true });

    for(const fileName in folder.files) {
      const file = folder.files[fileName];
      if(file.type === 'folder') {
        this.createFolder(file, `${path}/${fileName}`, mapFunction);
        continue;
      }

      writeFileSync(`${path}/${file.name}.${file.extention}`, mapFunction(file));
    }
  }

  public buildStrings(input: string): string {
    // Handle strings syntax like **bold**, *italic* texts, and [Links](https://google.com)
    return input
      .replace(/(?<!!)\[(.*)\]\((.*?)(.md)?\)/gm, (str, p1, p2, p3) => {
        return `<a href="${p2}${p3 ? '.html' : ''}">${p1}</a>`;
      })
      .replace(/!\[(.*)\]\((.*?)?\)/gm, (str, p1, p2) => {
        return `<img alt="${p1}" src="/resources/${p2}" class="image image-${p1}" />`;
      })
      .replace(/\*\*(.*?)\*\*/gm, '<b>$1</b>')
      .replace(/\*(.*?)\*/gm, '<i>$1</i>')
      .replace(/`(.*?)`/gm, '<code>$1</code>');
  }

}