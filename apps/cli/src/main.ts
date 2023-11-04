import { program } from 'commander';
import { isAbsolute, resolve } from 'path';
import { build } from 'builder';
import { startServer } from 'server';
import { Project, load } from 'loader';

function buildProject(project_path?: string): Project {
      
  let path = project_path ?? process.cwd();
  if(!isAbsolute(path)) path = resolve(process.cwd(), path);

  const project = load(path);

  if(!project) {
    console.log('Cannot find project, are you missing config file ".le-static.json"');
    return;
  }

  build(project);
  
  console.log(`Build Successfull`);

  return project;
}

program
  .name('les')
  .option('-p, --project <path>', 'Specify the directory of the project to build')
  .option('-s, --serve <PORT>', 'Serve the built project on a given port')
  .action((options) => {
      const project = buildProject(options.project);

      if(project && options.serve) {
        console.log(`Starting Server...`);

        startServer(`${project.src}/dist`, {
          port: options.serve
        }, project);
      }
  });

program.parse();