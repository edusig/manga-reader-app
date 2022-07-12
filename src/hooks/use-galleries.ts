import { useEffect, useState } from 'react';
import { Gallery } from '../lib/interfaces';
import { galleryStorage, StorageEventCallback } from '../lib/storage';

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const handleEvents: StorageEventCallback<Gallery> = (_, collection) => {
    setGalleries(collection.slice(0));
  };
  useEffect(() => {
    galleryStorage.on(handleEvents);
    return () => {
      galleryStorage.off(handleEvents);
    };
  }, []);
  return galleries;
};
