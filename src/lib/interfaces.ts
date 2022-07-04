export interface Gallery {
  id: number;
  name: string;
  path: string;
  dirs_count: number;
  files_count: number;
  last_read_at?: Date;
  last_read_dir?: string;
  last_read_item?: string;
  manga?: string;
  manga_ref?: Manga;
  download_left?: number;
}

export enum MangaStatus {
  FINISHED = 'FINISHED',
  RELEASING = 'RELEASING',
  NOT_YET_RELEASED = 'NOT_YET_RELEASED',
  CANCELLED = 'CANCELLED',
  HIATUS = 'HIATUS',
}

export interface Manga {
  id: number;
  id_mal: number;
  status: MangaStatus;
  description: string;
  chapters: number;
  cover_xlarge: string;
  cover_large: string;
  cover_medium: string;
  cover_color: string;
  banner: string;
  genres: string[];
  synonyms: string[];
  average_score: number;
  favorites: number;
  site_url: string;
}

export interface LocalAPIData {
  count: number;
  fullPath: string;
  name: string;
  files: {
    count: number;
    fullPath: string;
    name: string;
    files: string[];
  }[];
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
