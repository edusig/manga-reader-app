import * as FileSystem from 'expo-file-system';
import { DEFAULT_DIRECTORIES_PATH } from './constants';
import { getDownloadQueue } from './db';
import { DownloadQueueItem } from './interfaces';

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

class DownloadQueue {
  private running = false;
  private queue: DownloadQueueItem[] = [];

  async start() {
    if (this.running === false) {
      this.running = true;
      await this.getNewQueueItems();
      this.consumeQueue();
    }
  }

  private async consumeQueue() {
    if (this.running === false) return;
    const item = this.queue.shift();
    if (item != null) {
      await FileSystem.downloadAsync(
        `${item.api_url}/download?file=${encodeURIComponent(item.path)}`,
        `${directoriesPath}/${item.path}`,
      );
    } else {
      await this.getNewQueueItems();
    }
    setTimeout(this.consumeQueue, 100);
  }

  private async getNewQueueItems() {
    const downloadQ = await getDownloadQueue();
    const newItems = downloadQ.rows._array.map(
      (it): DownloadQueueItem => ({
        error: Boolean(it.error),
        page_id: it.page_id,
        path: it.path,
        api_url: it.api_url,
      }),
    );
    if (newItems.length === 0 && this.queue.length === 0) {
      this.running = false;
    } else {
      this.queue = this.queue.concat(newItems);
    }
  }
}

export const downloadQueue = new DownloadQueue();
