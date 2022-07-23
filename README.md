# Manga Reader App

A expo (react native) app to download manga chapters from a remote server to your phone. It comes
with its own node file server and api to download your local manga. There is also a util to download
the manga information from [anilist](https://anilist.co/)

## How to use

[Use directly in the Expo Go App](https://expo.dev/@edusig/manga-reader-app) or run locally

### Run locally

#### Clone the repository

`git clone git@github.com:edusig/manga-reader-app.git`

#### Install the dependencies

```sh
npm i
#  or
yarn
```

#### Run the expo app

To learn more [read the Expo docs](https://expo.dev/)

```sh
npm run start
# or
yarn start
```

#### Run local file server

```sh
npm run start:api
# or
yarn start:api
```

The local file server will serve files from the repository directory. To change the directory pass
it as the first argument.

```sh
npm run start:api /path/to/files/directory
# or
yarn start:api /path/to/files/directory
```

#### Run your own file server

The app expects the API to have 1 main endpoint and a static file server.

- `/api` should return with the signature bellow
- every other route should serve static files

The app will use the paths returned by the `/api` route to download the pages of a selected manga
and/or chapter. For example: If you choose to download "Chapter 1" from "Example Manga" it will
download the first page from `/Example Manga/Chapter 1/01.jpg`

##### Expected /api response interface

```ts
interface ApiResponse {
  // An array of mangas
  data: Array<{
    name: string;
    // Path of to the manga e.g. "Example Manga"
    fullPath: string;
    // An array of chapters
    files: Array<{
      name: string;
      // Path including the manga path e.g. "Example Manga/Chapter 1"
      fullPath: string;
      // An array of pages
      files: string[];
    }>;
  }>;
}
```

##### Example of a /api response

```json
{
  "data": [
    "name": "Example Manga",
    "fullPath": "Example Manga",
    "files": [
      {
        "name": "Chapter 1",
        "fullPath": "Example Manga/Chapter 1",
        "files": ["01.jpg", "02.jpg", "03.jpg"]
      }
    ]
  ]
}
```
