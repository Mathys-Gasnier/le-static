import express from 'express';
import { Config } from 'loader';

export interface ServerOptions {
  port: string | number
}

export function startServer(path: string, options: ServerOptions, config: Config) {
  const port = options.port ?? config.server?.port ?? 8080;
  const app = express();
  
  app.use(express.static(path));

  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
}