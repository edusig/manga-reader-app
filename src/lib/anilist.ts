import { Gallery } from './interfaces';

const apiUrl = 'https://graphql.anilist.co/';

const mangaQuery = `query Manga($search: String!) {
  Media(search: $search, type: MANGA, format: MANGA) {
    id
    idMal
    title {
      english
    }
    status
    description
    chapters
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    genres
    synonyms
    averageScore
    favourites
    siteUrl
  }
}`;

export const checkGalleries = (galleries: Gallery[]) => {
  galleries.forEach(async (it) => {
    if (it.manga == null) {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: mangaQuery,
          variables: { search: it.name },
        }),
      });
      console.log('ANILIST', res);
    }
  });
};
