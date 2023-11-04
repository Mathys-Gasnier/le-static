# server

Static express server to serve built applications.

## Usage

```ts
function startServer(path: string, options: ServerOptions, project: Project);
```

The function to start the server takes the path of the built project to serve. <br>
The options for the server. <br>
And the project that it will be serving.

The port is by priority:
- The one in the passed options
- The one in the project config file
- The default: `8080`

## Options

The passed options can be used to control the following things:
- `port` - string or number, set the port of the express server