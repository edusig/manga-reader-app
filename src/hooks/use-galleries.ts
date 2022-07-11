import { useEffect, useState } from 'react';
import { Gallery } from '../lib/interfaces';
import { galleryStorage, StorageEventCallback } from '../lib/storage';

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const handleEvents: StorageEventCallback<Gallery> = (_, collection) => {
    console.log('GALLERY HOOK UPDATED', collection);
    setGalleries(collection.slice(0));
  };
  useEffect(() => {
    console.log('USE GALLERIES SETUP');
    galleryStorage.on(handleEvents);
    return () => {
      console.log('USE GALLERIES CLEANUP');
      galleryStorage.off(handleEvents);
    };
  }, []);
  return galleries;
};
