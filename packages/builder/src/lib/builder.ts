import { Head, LineType, parse } from '@le-static/markdown-parser';
import { File, Folder, Project } from '@le-static/loader';
import { existsSync, mkdirSync, rmSync, writeFileSync,  } from 'fs';

export function build(project: Project): Builder {
  return new Builder(project);
}

export interface PageFolder extends Folder {
  files: {
    [key: string]: Page | PageFolder
  }
}

export interface Page extends File {
  head: Head
}

export type Component = Page;

export class Builder {

  public componentCache: Record<string, Component> = {};

  constructor(public project: Project) {

    // Figure out in which dir the output should be
    const distPath = `${ this.project.src }/${ this.project.config.build?.outDir ?? 'dist' }`;

    // If the output dir already exists, delete it
    if(existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });

    // Build the pages
    const pages = this.buildFolder(this.project.pages);

    // Write all the pages, styles and resources to the output dir
    this.createFolder<PageFolder, Page>(pages, `${ distPath }`, (file) => this.wrapHtml(file.head, file.content.toString()));
    this.createFolder(this.project.styles, `${ distPath }/styles`);
    this.createFolder(this.project.resources, `${ distPath }/resources`, (file) => file.content);
  }

  public resolveImport(path: string): Component | false {
    const sections = path.split('/');

    // If the path is in the component cache return the cached version
    if(this.componentCache[path]) return this.componentCache[path];

    // Else figure out the file by looping over the path sections until we encounter a file or that we run out of sections
    let projectFile: File | Folder = this.project.components;
    for(const section of sections) {
      if(!projectFile) return false;
      if(projectFile.type === 'file') break;
      projectFile = projectFile.files[section];
    }

    // If the path leads to a folder or no file return an error
    if(projectFile.type === 'folder' || !projectFile) return false;

    // Builds the component and adds it to the component cache
    const builtFile = this.buildFile(projectFile);
    this.componentCache[path] = builtFile;
    return builtFile;
  }

  public buildFolder(folder: Folder): PageFolder {
    const builtFolder: PageFolder = { type: 'folder', files: { } };
  
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
  
  public buildFile(file: File): Page {
    const [ head, document ] = parse(file.content.toString());
  
    let fileOutput = '';
  
    for(const line of document) {
      if(line.type === LineType.Header) {
        fileOutput += `<h${ line.level } class="header h-${ line.level }">${ line.text }</h${ line.level }>\n`;
      }else if(line.type === LineType.Paragraph) {
        fileOutput += `<p class="paragraph">${ this.buildStrings(line.lines.join('\n')) }</p>\n`;
      }else if(line.type === LineType.Separator) {
        fileOutput += `<span class="separator"></span>\n`;
      }else if(line.type === LineType.Import) {
        const component = this.resolveImport(line.file);

        if(!component) {
          fileOutput += `<error>Cannot resolve import ${ line.file }</error>`;
          continue;
        }

        fileOutput += this.wrapComponent(component);
      }else if(line.type === LineType.UnorderedList) {
        fileOutput += `<ul class="ul">${ line.lines.map((str) => `<li class="li">${ this.buildStrings(str) }</li>`).join('') }</ul>`;
      }else if(line.type === LineType.OrderedList) {
        fileOutput += `<ol class="ol">${ line.lines.map((str) => `<li class="li">${ this.buildStrings(str) }</li>`).join('') }</ol>`;
      }else if(line.type === LineType.BlockQuotes) {
        fileOutput += `<p class="block-quotes">${ this.buildStrings(line.lines.join('\n')) }</p>`;
      }else if(line.type === LineType.CodeBlock) {
        fileOutput += `<pre class="codeblock"><code class="lang-${ line.language }">${ line.lines.join('\n') }</code></pre>`;
      }
    }
  
    return {
      type: 'file',
      name: file.name,
      extention: 'html',
      content: fileOutput,
      head
    };
  }

  // Returns the component html structure with it's content, style links and title as a class
  public wrapComponent(component: Component): string {
    return `<div class="component component-${ component.head.title ?? component.name }">
      ${ (component.head.css ?? []).map((file) => `<link rel="stylesheet" href="/styles/${file}" />`).join('\n') }
      ${ component.content }
    </div>`;
  }

  // Returns a page html structure with it's title, prefix, suffix, style links and content
  public wrapHtml(head: Head, content: string): string {
    const prefix = this.project.config.build?.components?.prefix ? this.resolveImport(this.project.config.build.components.prefix) : false;
    const suffix = this.project.config.build?.components?.suffix ? this.resolveImport(this.project.config.build.components.suffix) : false;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ (this.project.config.site?.title ?? '%page_name%').replace(/%page_name%/gm, head.title ?? '') }</title>
  ${ this.project.config.site?.favicon ? `<link rel="icon" type="image/x-icon" href="${ this.project.config.site.favicon }">` : '' }
  <link rel="stylesheet" href="/styles/index.css" />
  ${ (head.css ?? []).map((file) => `<link rel="stylesheet" href="/styles/${ file }" />`).join('\n') }
</head>
<body>
  ${ prefix ? this.wrapComponent(prefix) : '' }
  ${ content }
  ${ suffix ? this.wrapComponent(suffix) : '' }
</body>
</html>
    `;
  }

  // Create folder and files recursivly
  public createFolder<Fo extends Folder, Fi extends File>(folder: Fo, path: string, mapFunction: (file: Fi) => string | Buffer = (file) => file.content) {
    mkdirSync(path, { recursive: true });

    for(const fileName in folder.files) {
      const file = folder.files[fileName];
      if(file.type === 'folder') {
        this.createFolder(file, `${ path }/${ fileName }`, mapFunction);
        continue;
      }

      writeFileSync(`${ path }/${ file.name }.${ file.extention }`, mapFunction(file as Fi));
    }
  }

  public buildStrings(input: string): string {
    // Handle strings syntax like **bold**, *italic* texts, and [Links](https://google.com)
    return input
      .replace(/(?<!!)\[(.*)\]\((.*?)(.md)?\)/gm, (str, p1, p2, p3) => {
        return `<a href="${ p2 }${ p3 ? '.html' : '' }">${ p1 }</a>`;
      })
      .replace(/!\[(.*)\]\((.*?)?\)/gm, (str, p1, p2) => {
        return `<img alt="${ p1 }" src="/resources/${ p2 }" class="image image-${ p1 }" />`;
      })
      .replace(/\*\*(.*?)\*\*/gm, '<b>$1</b>')
      .replace(/\*(.*?)\*/gm, '<i>$1</i>')
      .replace(/`(.*?)`/gm, '<code>$1</code>');
  }

}