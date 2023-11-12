# loader

Loads a project folders and it's config.

## Project loading

When used the `load()` function takes the `src` (path) of a project and returns eather a `Project` or `null`. <br>
It retuns null if the path given to the load function has no config file (`.le-static.json`).

## Config

The config is a json file `.le-static.json` that needs to be at the root of the project.
```json
{
    "server": {
        "port": 8080 // number or string, defines the server port when serving the app (default: 8080)
    },
    "site": {
        "title": "%page_name%", // string, the title of every pages on the site, %page_name% is replaced by the name of the current page (default: "%page_name%")
        "favicon": "" // string, the favicon of the site (default: None)
    },
    "build": {
        "outDir": "dist", // string, the folder where the builder will output the built project (default: "dist")
        "components": {
            "prefix": "", // string, component added before each page content (default: None)
            "suffix": "" // string, component added after each page content (default: None)
        }
    }
}
```

## Project Structure

A project is defined by the config file but also by a number of folders:
- `pages/` - It contains every pages of the site, routes are defined with the folder structure and index.md files are served on folder access.
- `components/` - It contains the components that you can import in the pages, you can import components in components.
- `styles/` - It contains the styles that you can use across your pages and components.
- `resources/` - It's the folder you use to store images and anything that doesn't fit in another folder.
- `templates/` - It contains the templates that can be used in pages

## Folder

Every folder has a `name` and a `files` object. It contains key value pairs to every sub files or folders.

## File

A file stores it's `name`, `extention` and `content` eather as a string or as a Buffer (for images).