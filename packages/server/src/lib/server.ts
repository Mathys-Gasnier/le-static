import express from 'express';

export function startServer(path: string) {
  const app = express();
  
  app.use(express.static(path));

  app.listen(8080, () => {
    console.log(`Server listening on ${8080}`);
  });
}