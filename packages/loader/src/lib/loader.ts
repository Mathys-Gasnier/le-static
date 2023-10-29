import { existsSync, readFileSync, readdirSync } from 'fs';

export interface File {
  type: 'file',
  name: string,
  extention: string,
  content: string | Buffer
}

export interface Folder {
  type: 'folder',
  files: {
    [key: string]: File | Folder
  }
}

export interface Project {
  src: string,
  pages: Folder,
  components: Folder,
  resources: Folder,
  styles: Folder,
  config: Config
}

export function load(src: string): Project {

  const project: Project = {
    src,
    pages: loadFolder(`${src}/pages`),
    components: loadFolder(`${src}/components`),
    resources: loadFolder(`${src}/resources`),
    styles: loadFolder(`${src}/styles`),
    config: loadConfig(src)
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
        content: content
      }
    }
  }

  return folder;
}

export interface Config {
  server?: {
    port?: string | number
  },
  site?: {
    title?: string,
    favicon?: string
  },
  build?: {
    outDir?: string,
    components?: {
      prefix?: string,
      suffix?: string
    }
  }
}

function loadConfig(src: string): Config {
  const configPath = `${src}/.le-static.json`;
  if(!existsSync(configPath)) return { };
  const configContent = readFileSync(configPath);
  return JSON.parse(configContent.toString());
}