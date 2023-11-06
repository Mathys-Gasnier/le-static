import { DefaultFile, Folder } from '@le-static/loader';
import { mkdirSync, writeFileSync } from 'fs';

export function mapOverFolder<F extends DefaultFile, T extends DefaultFile>(folder: Folder<F>, map: (file: F) => T): Folder<T> {
    const builtFolder: Folder<T> = { type: 'folder', name: folder.name, files: { } };
  
    // Maps every entry of the folder while also building files
    for(const fileName in folder.files) {
      const file = folder.files[fileName];
      if(file.type === 'folder') {
        builtFolder.files[fileName] = mapOverFolder(file, map);
        continue;
      }
  
      builtFolder.files[fileName] = map(file);
    }
  
    return builtFolder;
}

// Create folder and files recursivly
export function createFolder<F extends DefaultFile>(folder: Folder<F>, path: string, map: (file: F) => { name: string, content: string | Buffer }) {
  mkdirSync(path, { recursive: true });

  for(const fileName in folder.files) {
    const file = folder.files[fileName];
    if(file.type === 'folder') {
      createFolder(file, `${ path }/${ fileName }`, map);
      continue;
    }

    const { name, content } = map(file);

    writeFileSync(`${ path }/${ name }`, content);
  }
}

// Traverse a folder structure to find a find or folder
export function find<F extends DefaultFile>(folder: Folder<F>, path: string): F | Folder<F> | false {
  if(path === '/') return folder;

  const trimmedPath = path.startsWith('/') ? path.substring(1) : path;

  const sections = trimmedPath.split('/');

  // Figure out the searched file or folder by looping over the path sections until we encounter a file or that we run out of sections
  let file: F | Folder<F> = folder;
  for(const section of sections) {
    if(!file) return false;
    if(file.type === 'file') break;
    file = file.files[section];
  }

  // If no file or folder is found return an error
  if(!file) return false;

  return file;
}