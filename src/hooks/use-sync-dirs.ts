import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { useEffect } from 'react';
import {
  CHECK_DIRS_TABLE_QUERY,
  DEFAULT_DIRECTORIES_PATH,
  INITIALIZE_DB_QUERY,
  SQLITE_DB,
} from '../lib/constants';
import { dbExecute } from '../lib/sqlite-async';

const tables = ['directory', 'chapter', 'page', 'manga', 'download_queue'];

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

const syncDirs = async () => {
  console.log('START SYNC DIRS');
  if (!(await FileSystem.getInfoAsync(directoriesPath)).exists) {
    await FileSystem.makeDirectoryAsync(directoriesPath);
  }
  const db = SQLite.openDatabase(SQLITE_DB);
  const executor = dbExecute(db);
  try {
    let isDBInitialized = true;
    for (const table of tables) {
      // await executor(DROP_TABLES_QUERY, [table]);
      isDBInitialized =
        isDBInitialized && (await executor(CHECK_DIRS_TABLE_QUERY, [table])).rows.length > 0;
    }
    if (!isDBInitialized) {
      console.log('INITIALIZING DB');
      for (const query of INITIALIZE_DB_QUERY) {
        await executor(query);
      }
    }
  } catch (e) {
    console.error(e);
  }
  console.log('FINISH SYNC DIRS');
};

export const useSyncDirs = () => {
  useEffect(() => {
    syncDirs();
  }, []);
};
