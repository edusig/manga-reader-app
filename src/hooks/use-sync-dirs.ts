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
  // const info = await FileSystem.getInfoAsync(directoriesPath);
  // console.log('DIRECTORIES INFO', info);
  // const freeDisk = await FileSystem.getFreeDiskStorageAsync()
  // console.log('FREE DISK', freeDisk);
  // const readDir = await FileSystem.readDirectoryAsync(directoriesPath);
  // console.log('READ DIR', readDir);
  // try {
  //   await FileSystem.deleteAsync(`${directoriesPath}/martial-arts-reigns`);
  // } catch(e) {
  //   console.error(e);
  // }
  // await resetStorage();
  console.log('FINISH SYNC DIRS');
};

export const useSyncDirs = () => {
  useEffect(() => {
    syncDirs();
  }, []);
};
