import express from 'express';
import { Project } from 'loader';

export interface ServerOptions {
  port: string | number
}

export async function startServer(path: string, options: ServerOptions, project: Project) {
  // Gets the port, priority: passed options (cli), config options then default
  const port = options.port ?? project.config.server?.port ?? 8080;

  const app = express();
  
  // Serve the dist path as a static folder
  app.use(express.static(path));

  // Start the server
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
}