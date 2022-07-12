export interface Chapter {
  name: string;
  path: string;
  pages: string[];
  read: boolean;
  currentPage: number;
}

export interface Gallery extends Node {
  name: string;
  path: string;
  dirsCount: number;
  filesCount: number;
  lastReadAt?: string;
  chapters: Chapter[];
  manga?: Manga;
}

export type GalleryInput = Omit<Gallery, 'id'>;

export enum MangaStatus {
  FINISHED = 'FINISHED',
  RELEASING = 'RELEASING',
  NOT_YET_RELEASED = 'NOT_YET_RELEASED',
  CANCELLED = 'CANCELLED',
  HIATUS = 'HIATUS',
}

export interface Manga extends Node {
  idMal: number;
  status: MangaStatus;
  description: string;
  chapters?: number;
  coverImage: {
    color: string;
    xlarge: string;
    large: string;
    medium: string;
  };
  bannerImage: string;
  genres: string[];
  synonyms: string[];
  averageScore: number;
  favorites: number;
  site_url: string;
  title: {
    english: string;
  };
}

export interface LocalAPIData {
  fullPath: string;
  name: string;
  files: LocalAPIDataFiles[];
}

export interface LocalAPIDataFiles {
  fullPath: string;
  name: string;
  files: string[];
}

export interface LocalAPIResponse {
  count: number;
  data: LocalAPIData[];
}

export interface DownloadQueueItem {
  path: string;
  page_id: number;
  error: boolean;
  api_url: string;
}

export interface Indexer {
  lastId: number;
  collection: string[];
}

export interface Node {
  id: number;
}

export type RootStackParamList = {
  Home: undefined;
  Download: undefined;
  DownloadGallery: {
    url: string;
    gallery?: Gallery;
    apiData: LocalAPIData;
  };
  Gallery: {
    gallery: Gallery;
  };
  Read: {
    gallery: Gallery;
    chapter: Chapter;
  };
};
