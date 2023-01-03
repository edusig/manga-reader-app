import { Gallery, Manga } from './interfaces';
import { galleryStorage } from './storage';

const apiUrl = 'https://graphql.anilist.co/';

const mangaQuery = `query Manga($search: String!) {
  Media(search: $search, type: MANGA, format: MANGA) {
    id
    idMal
    title {
      english
      romaji
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

export const checkGallery = async (gallery: Gallery) => {
  if (gallery.manga == null) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: mangaQuery, variables: { search: gallery.name } }),
    });
    const data: Manga = (await res.json()).data.Media;
    galleryStorage.updateItem({ ...gallery, manga: data });
  }
};

export const clearGalleryInfo = async (gallery: Gallery) => {
  galleryStorage.updateItem({ ...gallery, manga: undefined });
}
