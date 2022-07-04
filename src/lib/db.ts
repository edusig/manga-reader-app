import * as SQLite from 'expo-sqlite';
import {
  ADD_CHAPTER_QUERY,
  ADD_DIR_QUERY,
  ADD_DOWNLOAD_QUEUE_QUERY,
  ADD_PAGE_QUERY,
  DIR_QUERY,
  DOWNLOAD_QUEUE_QUERY,
  SQLITE_DB,
} from './constants';
import { LocalAPIData } from './interfaces';
import { dbExecute } from './sqlite-async';

const db = SQLite.openDatabase(SQLITE_DB);
const executor = dbExecute(db);

export const localGallerySave = async (item: LocalAPIData, url: string) => {
  const filesCount = item.files.reduce((sum, it) => sum + it.count, 0);
  const dirQ = await executor(ADD_DIR_QUERY, [item.name, item.fullPath, item.count, filesCount]);
  console.log('ADDED DIR', dirQ.insertId);
  if (dirQ.insertId != null) {
    item.files.forEach(async (chapter) => {
      const chapterQ = await executor(ADD_CHAPTER_QUERY, [
        chapter.name,
        chapter.fullPath,
        dirQ.insertId!,
      ]);
      console.log('ADDED CHAPTER', chapterQ.insertId);
      if (chapterQ.insertId != null) {
        chapter.files.forEach(async (page) => {
          const pageQ = await executor(ADD_PAGE_QUERY, [
            page,
            `${chapter.fullPath}/${page}`,
            chapterQ.insertId!,
          ]);
          console.log('ADDED PAGE', pageQ.insertId);
          await executor(ADD_DOWNLOAD_QUEUE_QUERY, [0, pageQ.insertId!, url]);
          console.log('ADDED TO DOWNLOAD QUEUE');
        });
      }
    });
  }
};

export const getDownloadQueue = () => executor(DOWNLOAD_QUEUE_QUERY);
export const getGalleries = () => executor(DIR_QUERY);
