import AsyncStorage from '@react-native-async-storage/async-storage';
import { groupBy } from './group-by';
import { Gallery, Indexer, Manga, Node } from './interfaces';

export enum StorageEventType {
  COLLECTION_CHANGE = 'CollectionChange',
}

export type StorageEventCallback<CollectionType extends Node = Node> = (
  event: StorageEventType,
  collection: CollectionType[],
) => void;

class Storage<CollectionType extends Node = Node> {
  private indexKey: string;
  private collectionKey: string;
  private indexer: Indexer = {
    lastId: 0,
    collection: [],
  };
  private collection: CollectionType[] = [];
  private listeners: StorageEventCallback<CollectionType>[] = [];

  constructor(collectionKey: string) {
    this.indexKey = `${collectionKey}Index`;
    this.collectionKey = collectionKey;
    this.setup();
  }

  async setup() {
    await this.setupIndexer();
    this.collection = await this.setupCollection();
    this.emit(StorageEventType.COLLECTION_CHANGE);
  }

  private async setupIndexer() {
    try {
      const indexer = await AsyncStorage.getItem(this.indexKey);
      if (indexer != null) {
        this.indexer = JSON.parse(indexer);
      }
    } catch (e) {
      console.error(e);
    }
  }

  private async setupCollection() {
    try {
      const res = await AsyncStorage.multiGet(
        this.indexer.collection.map((it) => `${this.collectionKey}-${it}`),
      );
      return res.flatMap(([_, v]) => {
        try {
          if (v != null) return [JSON.parse(v)];
        } catch (e) {
          console.error(e);
        }
      });
    } catch (e) {}
    return [];
  }

  async saveCollection() {
    try {
      const keys = this.collection.map(
        (it) => [`${this.collectionKey}-${it.id}`, JSON.stringify(it)] as [string, string],
      );
      await AsyncStorage.multiSet(keys);
    } catch (e) {}
  }

  async saveIndexer() {
    try {
      AsyncStorage.setItem(this.indexKey, JSON.stringify(this.indexer));
    } catch (e) {}
  }

  getCollection() {
    return this.collection;
  }

  getCollectionById() {
    return groupBy(this.collection, 'id');
  }

  setCollection(newCollection: CollectionType[]) {
    this.collection = newCollection;
    this.emit(StorageEventType.COLLECTION_CHANGE);
  }

  async addItem(value: Omit<CollectionType, 'id'>) {
    const id = this.indexer.lastId + 1;
    try {
      const item = { ...value, id } as CollectionType;
      await AsyncStorage.setItem(`${this.collectionKey}-${id}`, JSON.stringify(item));
      this.collection.push(item);
      this.indexer.collection.push(id.toString());
      this.indexer.lastId = id;
      await this.saveIndexer();
      this.emit(StorageEventType.COLLECTION_CHANGE);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  async removeItem(id: number) {
    const index = this.collection.findIndex((it) => it.id === id);
    if (index < 0) return false;
    try {
      await AsyncStorage.removeItem(`${this.collectionKey}-${id}`);
      this.collection.splice(index, 1);
      this.indexer.collection = this.indexer.collection.filter((it) => it !== id.toString());
      await this.saveIndexer();
      this.emit(StorageEventType.COLLECTION_CHANGE);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  async updateItem(value: CollectionType) {
    const index = this.collection.findIndex((it) => it.id === value.id);
    if (index < 0) return false;
    try {
      await AsyncStorage.setItem(`${this.collectionKey}-${value.id}`, JSON.stringify(value));
      this.collection[index] = value;
      this.emit(StorageEventType.COLLECTION_CHANGE);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  on(callback: StorageEventCallback<CollectionType>) {
    this.listeners.push(callback);
    callback(StorageEventType.COLLECTION_CHANGE, this.collection);
  }

  off(callback: StorageEventCallback<CollectionType>) {
    this.listeners = this.listeners.filter((it) => it !== callback);
  }

  private emit(event: StorageEventType) {
    this.listeners.forEach((fn) => fn(event, this.collection));
  }
}

export const galleryStorage = new Storage<Gallery>('galleries');
export const mangaStorage = new Storage<Manga>('mangas');
