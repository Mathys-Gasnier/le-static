import { program } from 'commander';
import { isAbsolute, resolve } from 'path';
import { build } from 'builder';
import { startServer } from 'server';

program
  .argument('[project_path]')
  .action((project_path?: string) => {
    let path = project_path ?? process.cwd();
    if(!isAbsolute(path)) path = resolve(process.cwd(), path);
    build(path);
    console.log(`Build Successfull`);
  })
  .command('serve')
    .argument('[project_path]')
    .action((project_path) => {
        let path = project_path ?? process.cwd();
        if(!isAbsolute(path)) path = resolve(process.cwd(), path);
        build(path);
        console.log(`Build Successfull`);
        console.log(`Starting Server...`);
        startServer(`${path}/dist`);
    });

program.parse();