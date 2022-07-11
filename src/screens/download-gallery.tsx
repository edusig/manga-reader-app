import styled from '@emotion/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { downloadManga, DownloadProgress, DownloadProgressCallback } from '../lib/download';
import { LocalAPIDataFiles, RootStackParamList } from '../lib/interfaces';
import { ModalDialog, ModalOverlay, PrimaryText } from '../lib/style';
import { theme } from '../lib/theme';

const Container = styled.View`
  padding: 0 8px;
`;

const Title = styled(PrimaryText)`
  font-size: 28px;
  margin-bottom: 8px;
`;

const GalleryItem = styled(Pressable)`
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.palette.border};
  padding: 8px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const GalleryItemTitle = styled(PrimaryText)`
  font-size: 20px;
  flex-shrink: 1;
  flex-basis: 86%;
`;

const ActionContainer = styled(Container)`
  flex-direction: row;
  justify-content: space-between;
`;

const AllDownloadedText = styled(PrimaryText)`
  font-size: 24px;
  margin: 12px 0;
`;

type DownloadGalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'DownloadGallery'>;

const LocalGalleryChapter: FC<{
  data: LocalAPIDataFiles;
  onSelect: (data: LocalAPIDataFiles) => void;
  selected: boolean;
  downloaded?: boolean;
}> = ({ data, selected, downloaded, onSelect }) => {
  return (
    <GalleryItem onPress={downloaded ? undefined : () => onSelect(data)}>
      <MaterialCommunityIcons
        name={
          downloaded
            ? 'file-check'
            : selected
            ? 'checkbox-marked-circle'
            : 'checkbox-blank-circle-outline'
        }
        size={24}
        color={selected ? '#00FF00' : theme.palette.primaryText}
      />
      <GalleryItemTitle>
        {data.name} - ({data.files.length} files)
      </GalleryItemTitle>
    </GalleryItem>
  );
};

export const DownloadGalleryScreen: FC<DownloadGalleryScreenProps> = ({ navigation, route }) => {
  const dimensions = useWindowDimensions();
  const { gallery, apiData, url } = route.params;
  const [isDownloading, setIsDownloading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();
  const chapterNames = useMemo(() => gallery?.chapters.map((it) => it.name), [gallery?.chapters]);

  const renderItem = (it: ListRenderItemInfo<LocalAPIDataFiles>) => (
    <LocalGalleryChapter
      data={it.item}
      selected={selected.includes(it.item.name)}
      downloaded={gallery?.chapters.map((it) => it.name).includes(it.item.name)}
      onSelect={handleToggleSelect}
    />
  );

  const handleDownloadProgress: DownloadProgressCallback = (progress) => {
    if (progress.cur < progress.total) {
      setDownloadProgress(progress);
    } else {
      setDownloadProgress(undefined);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadManga(url, apiData, {
        filterChapters: selected,
        progressCallback: handleDownloadProgress,
      });
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error while trying to download gallery');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(undefined);
    }
  };

  const handleToggleSelect = (data: LocalAPIDataFiles) => {
    setSelected((prev) =>
      selected.includes(data.name) ? prev.filter((it) => it !== data.name) : [...prev, data.name],
    );
  };

  const handleToggleSelectAll = () => {
    const chapterNames = gallery?.chapters.map((it) => it.name);
    setSelected(
      selected.length === apiData.files.length
        ? []
        : apiData.files.map((it) => it.name).filter((it) => !chapterNames?.includes(it)),
    );
  };
  return (
    <SafeAreaView style={{ height: dimensions.height - 100 }}>
      {(chapterNames?.length ?? 0) >= apiData.files.length ? (
        <Container style={{ alignItems: 'center' }}>
          <AllDownloadedText>All chapters already downloaded</AllDownloadedText>
        </Container>
      ) : (
        <ActionContainer>
          <Button
            title={selected.length === apiData.files.length ? 'Deselect all' : 'Select all'}
            onPress={handleToggleSelectAll}
          />
          <Button title="Download Selected" onPress={handleDownload} />
        </ActionContainer>
      )}
      <FlatList
        data={apiData.files}
        renderItem={renderItem}
        ListHeaderComponent={
          <Container>
            <PrimaryText>Chapters found:</PrimaryText>
          </Container>
        }
        ListEmptyComponent={<PrimaryText>No chapters found.</PrimaryText>}
      />
      <Modal animationType="fade" transparent={true} visible={isDownloading}>
        <ModalOverlay>
          <ModalDialog>
            <Title>
              {downloadProgress != null
                ? `Downloading: ${downloadProgress.cur} of ${downloadProgress.total} pages`
                : 'Adding gallery...'}
            </Title>
          </ModalDialog>
        </ModalOverlay>
      </Modal>
    </SafeAreaView>
  );
};
