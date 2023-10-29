import { Statements, parse } from 'markdown-parser';
import { Config, File, Folder, Project, load } from 'loader';
import { existsSync, mkdirSync, rmSync, writeFileSync,  } from 'fs';

export interface BuiltFile {
  type: 'file',
  name: string,
  content: string
}

export interface BuiltFolder {
  type: 'folder',
  files: {
    [key: string]: BuiltFile | BuiltFolder
  }
}

export function build(src: string, config?: Config): Builder {

  return new Builder(src, config);
}

type ProjectFolder = 'styles' | 'components' | 'resources';

const extentionMap: Record<string, ProjectFolder> = {
  'css': 'styles',
  'md': 'components',
  'png': 'resources'
};

export class Builder {

  public project: Project;

  constructor(public src: string, public configOverwrites?: Config) {
    this.project = load(src);

    const distPath = `${src}/${this.configOverwrites?.outDir ?? this.project.config.outDir ?? 'dist'}`;

    if(existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });

    const pages = this.buildFolder(this.project.pages);

    this.createFolder(pages, `${distPath}`, (file) => this.wrapHtml(file.name, file.content.toString()));
    this.createFolder(this.project.styles, `${distPath}/styles`);
    this.createFolder(this.project.resources, `${distPath}/resources`, (file) => file.content);
  }

  public resolveImport(path: string): [ boolean, boolean, string, string ] {
    const sections = path.split('/');

    const file = sections[sections.length - 1].split('.');
    const name = file.slice(0, -1).join('.');
    const extention = file[file.length - 1];

    let projectFile: File | Folder = this.project[extentionMap[extention as keyof typeof extentionMap] as ProjectFolder];
    for(const section of sections) {
      if(!projectFile) return [ true, false, '', `<error>Cannot find ${path}</error>`];
      if(projectFile.type === 'file') break;
      projectFile = projectFile.files[section];
    }

    if(projectFile.type === 'folder') projectFile = projectFile.files[`index.${extention}`];
    if(projectFile.type === 'folder' || !projectFile) return [ true, false, '', `<error>Cannot find ${path}</error>`];

    if(extention === 'css') {
      return [ false, false, name, `<link rel="stylesheet" href="/styles/${path}" />` ];
    }else if(extention === 'md') {
      const builtFile = this.buildFile(projectFile);
      return [ false, true, name, builtFile.content.toString() ];
    }else if(extention === 'png') {
      return [ false, false, name, `<img alt="${name}" src="/resources/${path}" class="image image-${name}" />` ];
    }

    return [ true, false, '', `<error>Cannot find ${path}</error>`];
  }

  public buildFolder(folder: Folder): Folder {
    const builtFolder: Folder = { type: 'folder', files: { } };
  
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
        fileOutput += `<p class="paragraph">${statement.lines.join('\n')}</p>\n`;
      }else if(statement.type === Statements.Separator) {
        fileOutput += `<span class="separator"></span>\n`;
      }else if(statement.type === Statements.Import) {
        const [ error, withDiv, name, content ] = this.resolveImport(statement.name);
        if(error || !withDiv) {
          fileOutput += content;
          continue;
        }
        fileOutput += `<div class="component component-${name}">\n${content}\n</div>\n`;
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
  <title>${pageName}</title>
  <link rel="stylesheet" href="styles/index.css" />
</head>
<body>
  ${content}
</body>
</html>
    `;
  }

  public createFolder(folder: Folder, path: string, mapFunction: (file: File) => string | Buffer = (file) => file.content) {
    mkdirSync(path, { recursive: true });

    for(const fileName in folder.files) {
      const file = folder.files[fileName];
      if(file.type === 'folder') {
        this.createFolder(file, `${path}/${fileName}`);
        continue;
      }

      writeFileSync(`${path}/${file.name}.${file.extention}`, mapFunction(file));
    }
  }

}