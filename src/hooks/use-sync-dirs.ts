import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEffect } from 'react';
import { DEFAULT_DIRECTORIES_PATH } from '../lib/constants';

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

export const resetStorage = async () => {
  await FileSystem.deleteAsync(directoriesPath);
  await AsyncStorage.clear();
};

const syncDirs = async () => {
  console.log('START SYNC DIRS');
  if (!(await FileSystem.getInfoAsync(directoriesPath)).exists) {
    await FileSystem.makeDirectoryAsync(directoriesPath);
  }
  // await resetStorage();
  console.log('FINISH SYNC DIRS');
};

export const useSyncDirs = () => {
  useEffect(() => {
    syncDirs();
  }, []);
};
