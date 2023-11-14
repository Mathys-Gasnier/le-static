import { find } from './FileUtils';
import { Builder, Page } from './builder';
import { createContext, runInContext } from 'vm';

export function run(builder: Builder, page: Page, code: string, props?: Record<string, string>): unknown {
    const context = {
      Page: {
        title: page.head.title ?? page.name
      },
      ...(page.head.defines ?? { }),
      ...(props ?? { }),
      getFolder(path: string) {
        const folder = find(builder.pages, path);
        if(!folder || folder.type === 'file') return [ ];
        return folder;
      }
    };
    createContext(context);

    const result = runInContext(code, context);

    const output = typeof result === 'function' ? result() : result;

    return output;
}