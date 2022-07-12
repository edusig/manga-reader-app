import * as FileSystem from 'expo-file-system';
import { DEFAULT_DIRECTORIES_PATH } from './constants';
import { Chapter, Gallery, GalleryInput, MangaStatus } from './interfaces';
import { galleryStorage } from './storage';

const mangaStatusLabelDict: Record<MangaStatus, string> = {
  [MangaStatus.CANCELLED]: 'Cancelled',
  [MangaStatus.FINISHED]: 'Finished',
  [MangaStatus.HIATUS]: 'Hiatus',
  [MangaStatus.NOT_YET_RELEASED]: 'Not release',
  [MangaStatus.RELEASING]: 'Releasing',
};

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

export const readChapter = (gallery: Gallery, chapterIndex: number) => {
  const newChapters = gallery.chapters.slice(0);
  newChapters.splice(chapterIndex, 1, { ...gallery.chapters[chapterIndex], read: true });
  const newGallery = { ...gallery, lastReadAt: new Date().toString(), chapters: newChapters };
  return galleryStorage.updateItem(newGallery);
};

export const getGalleryLastReadChapter = (gallery: Gallery) =>
  gallery.chapters.find((it) => it.read === false) ?? gallery.chapters[0];

export const getGalleryLastReadChapterNumber = (chapter: Chapter) =>
  parseInt(chapter.name.split('-')[0].replace(/[^0-9]/gi, ''), 10);

export const getGalleryDetail = (gallery: Gallery) => {
  const infos = [];
  if (gallery.manga?.favorites) {
    infos.push(`Favorites: ${gallery.manga.favorites}`);
  }
  if (gallery.manga?.status) {
    infos.push(`Status: ${mangaStatusLabelDict[gallery.manga.status]}`);
  }
  if (gallery.manga?.averageScore) {
    infos.push(`Average Score: ${gallery.manga.averageScore}`);
  }
  if (gallery.manga?.description) {
    infos.push(
      `Description: ${gallery.manga.description
        .replaceAll('<br>', '\n')
        .replaceAll('<br/>', '\n')}`,
    );
  }
  return infos.join('\n');
};

export const upsertGallery = (gallery: GalleryInput) => {
  const galleries = galleryStorage.getCollection();
  const found = galleries.find((it) => it.name === gallery.name);
  if (found != null) {
    const foundChapterNames = found.chapters.map((it) => it.name);
    const merge: Gallery = {
      ...gallery,
      ...found,
      chapters: [
        ...found.chapters,
        ...gallery.chapters.filter((it) => !foundChapterNames.includes(it.name)),
      ],
    };
    return galleryStorage.updateItem(merge);
  }
  return galleryStorage.addItem(gallery);
};

export const updateLastReadAt = async (gallery: Gallery) => {
  gallery.lastReadAt = new Date().toString();
  await galleryStorage.updateItem(gallery);
};

export const bulkChapterMarkAsRead = (gallery: Gallery, chapters: string[]) => {
  const newChapters = gallery.chapters
    .slice(0)
    .map((it) => ({ ...it, read: it.read || chapters.includes(it.name) }));
  const newGallery = { ...gallery, lastReadAt: new Date().toString(), chapters: newChapters };
  return galleryStorage.updateItem(newGallery);
};

export const bulkChapterDelete = (gallery: Gallery, chapters: string[]) => {
  const newChapters = gallery.chapters.slice(0).filter((it) => !chapters.includes(it.name));
  const newGallery = { ...gallery, chapters: newChapters };
  const removeChapters = gallery.chapters.slice(0).filter((it) => chapters.includes(it.name));
  for (const chapter of removeChapters) {
    FileSystem.deleteAsync(`${directoriesPath}/${gallery.path}/${chapter.path}`);
  }
  return galleryStorage.updateItem(newGallery);
};
