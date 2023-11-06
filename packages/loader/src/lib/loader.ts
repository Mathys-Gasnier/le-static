import { existsSync, readFileSync, readdirSync } from 'fs';

export interface DefaultFile {
  type: 'file'
}

export interface File extends DefaultFile {
  name: string,
  extention: string,
  content: string | Buffer
}

export interface Folder<FileType extends DefaultFile> {
  type: 'folder',
  name: string,
  files: {
    [key: string]: FileType | Folder<FileType>
  }
}

export interface Project {
  src: string,
  pages: Folder<File>,
  components: Folder<File>,
  resources: Folder<File>,
  styles: Folder<File>,
  config: Config
}

export function load(src: string): Project | null {

  if(!existsSync(`${src}/.le-static.json`)) return null;

  const project: Project = {
    src,
    pages: loadFolder(`${src}/pages`, 'pages'),
    components: loadFolder(`${src}/components`, 'components'),
    resources: loadFolder(`${src}/resources`, 'resources'),
    styles: loadFolder(`${src}/styles`, 'styles'),
    config: loadConfig(src)
  }

  return project;
}

function loadFolder(src: string, name: string): Folder<File> {
  const folder: Folder<File> = { type: 'folder', name, files: { } };

  if(!existsSync(src)) return folder;

  // Loops over all files and folder in src
  for(const file of readdirSync(src, { withFileTypes: true })) {
    // If it is a directory, recurse
    if(file.isDirectory()) folder.files[file.name] = loadFolder(`${src}/${file.name}`, file.name);
    else {
      // Else get the name, extension and content of the file and add them to the folder
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
    title?: string, // %page_name% is replaced with the name of the current page
    favicon?: string
  },
  build?: {
    outDir?: string,
    components?: {
      prefix?: string, // Component added before each page content
      suffix?: string  // Component added after each page content
    }
  }
}

function loadConfig(src: string): Config {
  const configPath = `${src}/.le-static.json`;
  if(!existsSync(configPath)) return { };
  const configContent = readFileSync(configPath);
  return JSON.parse(configContent.toString());
}