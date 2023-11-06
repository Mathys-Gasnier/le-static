#!/usr/bin/env node

import { isAbsolute, resolve } from 'path';
import { build } from '@le-static/builder';
import { startServer } from '@le-static/server';
import { Project, load } from '@le-static/loader';

// Builds a project at the passed path or at the current working directory
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


// Define the options of the cli
const options = {
  project: {
    flags: [ '-p', '--project' ],
    value: true
  },
  serve: {
    flags: [ '-s', '--serve' ],
    value: true
  }
};

// Assumes runned via node, removes node and file name
const userArgs = process.argv.splice(2);

// Found options
const userOptions: Partial<Record<keyof typeof options, true | string>> = { };

// Current arg we are looping on
let idx = 0;
while(idx < userArgs.length) {
  // Get the arg and find if it matches an option
  const arg = userArgs[idx];
  const option = Object.entries(options).find(([ , value ]) => value.flags.includes(arg));

  // If not go to the next arg
  if(!option) {
    idx++;
    continue;
  }

  // If we found an option, get it's value if it's needed, add it the the found options and continue parsing options
  const [ name, config ] = option;

  const value = config.value ? userArgs[idx + 1] : true;

  userOptions[name] = value;
  idx += config.value ? 2 : 1;
}

const project = buildProject(userOptions.project.toString());

// If the serve option is set, start the server on the given port
if(project && options.serve) {
  console.log(`Starting Server...`);

  startServer(`${project.src}/dist`, {
    port: userOptions.serve.toString()
  }, project);
}
