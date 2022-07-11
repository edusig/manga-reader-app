import * as FileSystem from 'expo-file-system';
import { DEFAULT_DIRECTORIES_PATH } from './constants';
import { upsertGallery } from './gallery';
import { Gallery, GalleryInput, LocalAPIData } from './interfaces';
import { slugify } from './slugify';

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export interface DownloadProgress {
  cur: number;
  total: number;
}

const setupGalleryDirs = async (galleryDir: string, chapters: Gallery['chapters']) => {
  // Creates gallery dir
  if (!(await FileSystem.getInfoAsync(galleryDir)).exists) {
    await FileSystem.makeDirectoryAsync(galleryDir);
  }
  // Creates chapters dirs
  for (const chapter of chapters) {
    const chapterDir = `${galleryDir}/${chapter.path}`;
    if (!(await FileSystem.getInfoAsync(chapterDir)).exists) {
      await FileSystem.makeDirectoryAsync(chapterDir, { intermediates: true });
    }
  }
};

const downloadPages = async (
  downloads: { url: string; file: string }[],
  progressCallback?: DownloadProgressCallback,
) => {
  let batchSize = 3;
  let batches = Math.ceil(downloads.length / batchSize);
  let retriesLeft = 3;
  let cur = 0;
  while (cur < batches) {
    if (retriesLeft === 0) {
      return false;
    }
    try {
      const res = await Promise.all(
        downloads
          .slice(batchSize * cur, batchSize * (cur + 1))
          .map((it) => FileSystem.downloadAsync(it.url, it.file)),
      );
      if (res.some((it) => it.status !== 200)) {
        retriesLeft--;
        continue;
      }
    } catch (e) {
      retriesLeft--;
      continue;
    }
    cur++;
    retriesLeft = 3;
    if (progressCallback != null)
      progressCallback({ cur: cur * batchSize, total: downloads.length });
  }
  return true;
};

export const downloadManga = async (
  url: string,
  data: LocalAPIData,
  options?: {
    filterChapters?: string[];
    progressCallback?: DownloadProgressCallback;
  },
) => {
  const filesCount = data.files.reduce((sum, it) => sum + it.files.length, 0);
  const chapters =
    options?.filterChapters != null
      ? data.files.filter((it) => options?.filterChapters?.includes(it.name))
      : data.files;
  const gallery: GalleryInput = {
    dirsCount: chapters.length,
    filesCount,
    name: data.name,
    path: slugify(data.fullPath),
    chapters: chapters.map((it) => ({
      name: it.name,
      path: slugify(it.name),
      pages: it.files,
      currentPage: 0,
      read: false,
    })),
  };
  let success = false;
  const galleryDir = `${directoriesPath}/${gallery.path}`;
  try {
    await setupGalleryDirs(galleryDir, gallery.chapters);
    const downloads = gallery.chapters.flatMap((chapter) =>
      chapter.pages.map((page) => ({
        url: `${url}/${encodeURIComponent(`${gallery.name}/${chapter.name}/${page}`)}`,
        file: `${galleryDir}/${chapter.path}/${page}`,
      })),
    );
    const download = await downloadPages(downloads, options?.progressCallback);
    success = download && (await upsertGallery(gallery));
  } catch (e) {
    console.error(e);
  }
  if (success === false) {
    try {
      for (let i = 0; i < gallery.chapters.length; i++) {
        await FileSystem.deleteAsync(`${galleryDir}/${gallery.chapters[i].path}/`);
      }
    } catch (e) {
      console.error(e);
    }
  }
  return success;
};
