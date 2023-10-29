import { existsSync, readFileSync, readdirSync } from 'fs';

export interface File {
  type: 'file',
  name: string,
  extention: string,
  content: string
}

export interface Folder {
  type: 'folder',
  files: {
    [key: string]: File | Folder
  }
}

export interface Project {
  pages: Folder,
  components: Folder,
  resources: Folder,
  styles: Folder
}

export function load(src: string): Project {

  const project: Project = {
    pages: loadFolder(`${src}/pages`),
    components: loadFolder(`${src}/components`),
    resources: loadFolder(`${src}/resources`),
    styles: loadFolder(`${src}/styles`)
  }

  return project;
}

function loadFolder(src: string): Folder {
  const folder: Folder = { type: 'folder', files: { } };

  if(!existsSync(src)) return folder;

  for(const file of readdirSync(src, { withFileTypes: true })) {
    if(file.isDirectory()) folder.files[file.name] = loadFolder(`${src}/${file.name}`);
    else {
      const name = file.name.split('.').slice(0, -1).join('.');
      const extention = file.name.split('.').slice(-1).join('');
      const content = readFileSync(`${src}/${file.name}`);

      folder.files[file.name] = {
        type: 'file',
        name: name,
        extention: extention,
        content: content.toString()
      }
    }
  }

  return folder;
}