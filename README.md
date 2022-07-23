# Manga Reader App

A expo (react native) app to download manga chapters from a remote server to your phone. It comes
with its own node file server and api to download your local manga. There is also a util to download
the manga information from [anilist](https://anilist.co/)

## How to use

[Use directly in the Expo Go App](https://expo.dev/@edusig/image-gallery) or run locally

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
