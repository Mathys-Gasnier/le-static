import { program } from 'commander';
import { isAbsolute, resolve } from 'path';
import { build } from 'builder';
import { startServer } from 'server';
import { load } from 'loader';

program
  .name('lestatic')
  .argument('[project_path]')
  .action((project_path?: string) => {
    let path = project_path ?? process.cwd();
    if(!isAbsolute(path)) path = resolve(process.cwd(), path);

    const project = load(path);

    if(!project) {
      console.log('Cannot find project, are you missing config file .le-static.json');
      return;
    }

    build(project);

    console.log(`Build Successfull`);
  })
  .command('serve')
    .argument('[project_path]')
    .option('-p, --port <PORT>', 'Set the server port')
    .action((project_path, options) => {
      
        let path = project_path ?? process.cwd();
        if(!isAbsolute(path)) path = resolve(process.cwd(), path);

        const project = load(path);

        if(!project) {
          console.log('Cannot find project, are you missing config file .le-static.json');
          return;
        }

        build(project);
        
        console.log(`Build Successfull`);
        console.log(`Starting Server...`);

        startServer(`${path}/dist`, {
          port: options.port
        }, project);
    });

program.parse();