import { Document, Head, LineType, parse } from '@le-static/markdown-parser';
import { DefaultFile, Folder, Project } from '@le-static/loader';
import { existsSync, rmSync } from 'fs';
import { run } from './Integration';
import { createFolder, find, mapOverFolder } from './FileUtils';

export function build(project: Project): Builder {
  return new Builder(project);
}

export interface Page extends DefaultFile {
  name: string,
  head: Head,
  document: Document
}

export type Component = Page;

export interface BuiltPage extends Page {
  content: string
}

export type BuiltComponent = BuiltPage;

export class Builder {

  public components: Folder<BuiltComponent> = { type: 'folder', name: 'components', files: { } };
  public pages: Folder<Page> = { type: 'folder', name: 'pages', files: { } };

  constructor(public project: Project) {

    // Figure out in which dir the output should be
    const distPath = `${ this.project.src }/${ this.project.config.build?.outDir ?? 'dist' }`;

    // If the output dir already exists, delete it
    if(existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });

    // Convert the file in the pages directory to pages
    this.pages = mapOverFolder(this.project.pages, (f) => {
      const [ head, document ] = parse(f.content.toString());

      return {
        type: 'file',
        name: f.name,
        head, document
      } as Page;
    });

    // Build every components using page builder
    this.components = mapOverFolder(this.project.components, (f) => {
      const [ head, document ] = parse(f.content.toString());

      const component: Component = {
        type: 'file',
        name: f.name,
        head, document
      };

      return this.buildPage(component) as BuiltComponent;
    })

    // Build the pages
    const builtPages = mapOverFolder(this.pages, (page) => this.buildPage(page));

    // Write all the pages, styles and resources to the output dir
    createFolder(builtPages, `${ distPath }`, (page) => ({
      name: `${page.name}.html`,
      content: this.wrapPage(page)
    }));
    createFolder(this.project.styles, `${ distPath }/styles`, (f) => ({ name: `${ f.name }.${ f.extention }`, content: f.content }));
    createFolder(this.project.resources, `${ distPath }/resources`, (f) => ({ name: `${ f.name }.${ f.extention }`, content: f.content }));
  }

  public buildPage(page: Page): BuiltPage {
    const builtPage: BuiltPage = { ...page, content: '' };
  
    for(const line of page.document) {
      if(line.type === LineType.Header) {
        builtPage.content += `<h${ line.level } class="header h-${ line.level }">${ line.text }</h${ line.level }>\n`;
      }else if(line.type === LineType.Paragraph) {
        builtPage.content += `<p class="paragraph">${ this.buildStrings(line.lines.join('\n')) }</p>\n`;
      }else if(line.type === LineType.Separator) {
        builtPage.content += `<span class="separator"></span>\n`;
      }else if(line.type === LineType.Import) {
        const component = this.resolveImport(line.file);

        if(!component) {
          builtPage.content += `<error>Cannot resolve import ${ line.file }</error>`;
          continue;
        }

        builtPage.content += this.wrapComponent(component);
      }else if(line.type === LineType.UnorderedList) {
        builtPage.content += `<ul class="ul">${ line.lines.map((str) => `<li class="li">${ this.buildStrings(str) }</li>`).join('') }</ul>`;
      }else if(line.type === LineType.OrderedList) {
        builtPage.content += `<ol class="ol">${ line.lines.map((str) => `<li class="li">${ this.buildStrings(str) }</li>`).join('') }</ol>`;
      }else if(line.type === LineType.BlockQuotes) {
        builtPage.content += `<p class="block-quotes">${ this.buildStrings(line.lines.join('\n')) }</p>`;
      }else if(line.type === LineType.CodeBlock) {
        builtPage.content += `<pre class="codeblock"><code class="lang-${ line.language }">${ line.lines.join('\n') }</code></pre>`;
      }else if(line.type === LineType.Integration) {
        builtPage.content += run(this, page, line.code);
      }
    }

    return builtPage;
  }

  public resolveImport(path: string): BuiltComponent | false {
    const component = find(this.components, path);

    if(!component || component.type === 'folder') return false;

    return component;
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

  // Returns the component html structure with it's content, style links and title as a class
  public wrapComponent(component: BuiltComponent): string {
    return `<div class="component component-${ component.head.title ?? component.name }">
      ${ (component.head.css ?? []).map((file) => `<link rel="stylesheet" href="/styles/${file}" />`).join('\n') }
      ${ component.content }
    </div>`;
  }

  // Returns a page html structure with it's title, prefix, suffix, style links and content
  public wrapPage(page: BuiltPage): string {
    const prefix = this.project.config.build?.components?.prefix ? this.resolveImport(this.project.config.build.components.prefix) : false;
    const suffix = this.project.config.build?.components?.suffix ? this.resolveImport(this.project.config.build.components.suffix) : false;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ (this.project.config.site?.title ?? '%page_name%').replace(/%page_name%/gm, page.head.title ?? '') }</title>
  ${ this.project.config.site?.favicon ? `<link rel="icon" type="image/x-icon" href="${ this.project.config.site.favicon }">` : '' }
  <link rel="stylesheet" href="/styles/index.css" />
  ${ (page.head.css ?? []).map((file) => `<link rel="stylesheet" href="/styles/${ file }" />`).join('\n') }
</head>
<body>
  ${ prefix ? this.wrapComponent(prefix) : '' }
  ${ page.content }
  ${ suffix ? this.wrapComponent(suffix) : '' }
</body>
</html>
    `;
  }

  /*public resolveImport(path: string): Component | false {
    const sections = path.split('/');

    // If the path is in the component cache return the cached version
    if(this.componentCache[path]) return this.componentCache[path];

    // Else figure out the file by looping over the path sections until we encounter a file or that we run out of sections
    let projectFile: File | Folder<File> = this.project.components;
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

  public buildFolder(folder: Folder<File>): Folder<Page> {
    const builtFolder: Folder<Page> = { type: 'folder', files: { } };
  
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
      }else if(line.type === LineType.Integration) {
        fileOutput += run(this, file, head, line.code);
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
  }*/

}