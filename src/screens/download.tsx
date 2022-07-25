import styled from '@emotion/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useGalleries } from '../hooks/use-galleries';
import { useServerUrl } from '../hooks/use-server-url';
import { downloadManga, DownloadProgress, DownloadProgressCallback } from '../lib/download';
import { Gallery, LocalAPIData, RootStackParamList } from '../lib/interfaces';
import { ModalDialog, ModalOverlay, PrimaryText } from '../lib/style';
import { theme } from '../lib/theme';

const TextInputStyled = styled(TextInput)`
  border-radius: 8px;
  padding: 8px 12px;
  background-color: ${(props) => props.theme.palette.surface};
  color: ${(props) => props.theme.palette.primaryText};
  height: 40px;
  flex: 1;
  margin-top: 4px;
`;

const Container = styled.View`
  padding: 0 8px;
`;

const InputLabel = styled(PrimaryText)`
  font-size: 20px;
  margin-top: 8px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled(PrimaryText)`
  font-size: 28px;
  margin-bottom: 8px;
`;

const GalleryItem = styled(Pressable)`
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.palette.border};
  padding: 12px 8px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
const GalleryItemTitle = styled(PrimaryText)`
  font-size: 20px;
  flex-basis: 90%;
`;

const ProgressBarContainer = styled.View`
  background-color: #555;
  width: 300px;
  height: 30px;
  border-radius: 8px;
`;

const ProgressBar = styled.View<DownloadProgress>`
  background-color: ${(props) => props.theme.palette.success};
  height: 30px;
  width: ${(props) => ((props.cur / props.total) * 100).toString()}%;
  border-radius: 8px;
`;

const ProgressTitle = styled(PrimaryText)`
  font-size: 20px;
  margin-bottom: 8px;
`;

type DownloadScreenProps = NativeStackScreenProps<RootStackParamList, 'Download'>;

const LocalGallery: FC<{
  data: LocalAPIData;
  onSelect: (data: LocalAPIData) => void;
  onAdd: (data: LocalAPIData) => void;
  index: number;
  gallery?: Gallery;
}> = ({ data, gallery, onSelect, onAdd }) => {
  const allDownloaded = useMemo(() => {
    const chapterNames = gallery?.chapters.map((it) => it.name);
    return data.files.every((it) => chapterNames?.includes(it.name));
  }, [gallery, data]);
  return (
    <GalleryItem onPress={() => onSelect(data)}>
      <GalleryItemTitle>
        {data.name} - ({data.files.length} chapters)
      </GalleryItemTitle>
      {allDownloaded ? (
        <MaterialCommunityIcons name="check-all" size={32} color={theme.palette.success} />
      ) : (
        <Pressable onPress={() => onAdd(data)}>
          <MaterialCommunityIcons name="plus" size={32} color={theme.palette.primaryText} />
        </Pressable>
      )}
    </GalleryItem>
  );
};

export const DownloadScreen: FC<DownloadScreenProps> = ({ navigation }) => {
  const dimensions = useWindowDimensions();
  const { url, setUrl, local, handleSearchLocal, loading } = useServerUrl();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();

  const galleries = useGalleries();

  const renderItem = (it: ListRenderItemInfo<LocalAPIData>) => (
    <LocalGallery
      data={it.item}
      gallery={galleries.find((gallery) => gallery.name === it.item.name)}
      index={it.index}
      onSelect={handleOpen}
      onAdd={handleConfirmAdd}
    />
  );

  const handleDownloadProgress: DownloadProgressCallback = (progress) => {
    if (progress.cur < progress.total) {
      setDownloadProgress(progress);
    } else {
      setDownloadProgress(undefined);
    }
  };

  const handleOpen = async (data: LocalAPIData) => {
    const gallery = galleries.find((it) => it.name === data.name);
    navigation.navigate('DownloadGallery', { apiData: data, gallery: gallery, url });
  };

  const handleConfirmAdd = async (data: LocalAPIData) => {
    Alert.alert(
      'Confirm download all',
      `Are you sure you want to download all of the ${data.files.length} chapters?`,
      [
        { text: 'Download', onPress: () => handleAddLocal(data) },
        { text: 'Cancel', style: 'cancel' },
      ],
      {
        cancelable: true,
      },
    );
  };

  const handleAddLocal = async (data: LocalAPIData) => {
    if (galleries.find((it) => it.name === data.name) != null) {
      Alert.alert('Gallery already added! Select individual chapters to continue.');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadManga(url, data, { progressCallback: handleDownloadProgress });
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
  return (
    <SafeAreaView style={{ height: dimensions.height - 100 }}>
      <Container>
        <InputLabel>Server url:</InputLabel>
        <InputContainer>
          <TextInputStyled
            value={url}
            keyboardType="url"
            onChangeText={setUrl}
            onSubmitEditing={() => {
              handleSearchLocal();
            }}
            keyboardAppearance="dark"
          />
        </InputContainer>
      </Container>
      {local?.data != null ? (
        <FlatList
          data={local?.data ?? []}
          renderItem={renderItem}
          ListHeaderComponent={
            <Container>
              <PrimaryText>Galleries:</PrimaryText>
            </Container>
          }
          ListEmptyComponent={<PrimaryText>No galleries found.</PrimaryText>}
        />
      ) : (
        <ActivityIndicator />
      )}
      <Modal animationType="fade" transparent={true} visible={isDownloading}>
        <ModalOverlay>
          <ModalDialog>
            {downloadProgress != null ? (
              <>
                <Title>Downloading</Title>
                <ProgressTitle>
                  {`${downloadProgress.cur} of ${downloadProgress.total} pages (${(
                    (downloadProgress.cur / downloadProgress.total) *
                    100
                  ).toFixed(2)}%)`}
                </ProgressTitle>
                {downloadProgress != null && (
                  <ProgressBarContainer>
                    <ProgressBar {...downloadProgress} />
                  </ProgressBarContainer>
                )}
              </>
            ) : (
              <Title>Adding gallery...</Title>
            )}
          </ModalDialog>
        </ModalOverlay>
      </Modal>
    </SafeAreaView>
  );
};
