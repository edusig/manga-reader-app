import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DownloadModal } from './src/components/download-modal';
import { Galleries } from './src/components/galleries';
import { useSyncDirs } from './src/hooks/use-sync-dirs';
import { checkGalleries } from './src/lib/anilist';
import { getGalleries, localGallerySave } from './src/lib/db';
import { downloadQueue } from './src/lib/download_queue';
import { Gallery, LocalAPIResponse } from './src/lib/interfaces';

export default function App() {
  useSyncDirs();
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [local, setLocal] = useState<LocalAPIResponse | undefined>();

  const handleSearchLocal = async (url: string) => {
    const res = await fetch(url);
    const data: LocalAPIResponse = await res.json();
    setLocal(data);
    console.log(data);
  };

  const handleAddLocal = async (index: number, url: string) => {
    const item = local?.data[index];
    if (item == null) return;

    try {
      await localGallerySave(item, url);
    } catch (e) {
      console.error(e);
    }

    downloadQueue.start();
  };

  useEffect(() => {
    const initialize = async () => {
      const res = await getGalleries();
      console.log(res);
      setGalleries(res.rows._array);
      checkGalleries(res.rows._array);
    };
    initialize();
  }, []);

  return (
    <>
      {currentGallery == null ? (
        <Galleries galleries={galleries} onDownload={() => setDownloadModalOpen(true)} />
      ) : (
        <View />
      )}
      <StatusBar style="auto" />
      <DownloadModal
        open={downloadModalOpen}
        local={local}
        onClose={() => {
          setDownloadModalOpen(false);
        }}
        onSearch={handleSearchLocal}
        onAdd={handleAddLocal}
      />
    </>
  );
}
