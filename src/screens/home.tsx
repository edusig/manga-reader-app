import styled from '@emotion/native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useGalleries } from '../hooks/use-galleries';
import { checkGallery } from '../lib/anilist';
import {
  getGalleryDetail,
  getGalleryLastReadChapter,
  getGalleryLastReadChapterNumber,
  updateLastReadAt,
} from '../lib/gallery';
import { Gallery, RootStackParamList } from '../lib/interfaces';
import { galleryStorage } from '../lib/storage';
import { EmptyText, PrimaryText, SecondaryText } from '../lib/style';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const GalleryItemContainer = styled.View`
  border-bottom-color: ${(props) => props.theme.palette.border};
  border-bottom-width: 1px;
  flex-direction: row;
  background-color: ${(props) => props.theme.palette.surface};
`;

const GalleryTitle = styled(PrimaryText)`
  font-size: 20px;
`;

const GalleryContent = styled.View`
  flex-grow: 1;
  flex-shrink: 1;
  padding: 8px;
`;

const GalleryItemNumberContainer = styled.View`
  padding: 8px;
  padding-left: 0;
  margin-left: 0;
  justify-content: center;
`;

const GalleryItemNumber = styled(SecondaryText)`
  font-size: 24px;
`;

const GalleryImage = styled(Image)`
  width: 80px;
  height: 120px;
`;

const GalleryItem: FC<{
  gallery: Gallery;
  onPress: () => void;
  onLongPress: () => void;
}> = ({ gallery, onPress, onLongPress }) => (
  <Pressable onPress={onPress} onLongPress={onLongPress}>
    <GalleryItemContainer>
      <GalleryImage source={{ uri: gallery.manga?.coverImage.medium, width: 80, height: 120 }} />
      <GalleryContent>
        <GalleryTitle allowFontScaling>{gallery.name}</GalleryTitle>
        <SecondaryText allowFontScaling>{gallery.manga?.genres.join(', ')}</SecondaryText>
      </GalleryContent>
      <GalleryItemNumberContainer>
        <GalleryItemNumber>
          #{getGalleryLastReadChapterNumber(getGalleryLastReadChapter(gallery))}
        </GalleryItemNumber>
      </GalleryItemNumberContainer>
    </GalleryItemContainer>
  </Pressable>
);

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const dimensions = useWindowDimensions();
  const galleries = useGalleries();
  const { showActionSheetWithOptions } = useActionSheet();
  const sortedGalleries = useMemo(
    () => galleries.sort((a, b) => a.name.localeCompare(b.name, 'en')),
    [galleries],
  );

  const handleDeleteGallery = (id: number) => () => {
    galleryStorage.removeItem(id);
  };
  const handleReadLatest = (gallery: Gallery) => () => {
    const latest = gallery.chapters.find((it) => it.read === false) ?? gallery.chapters[0];
    updateLastReadAt(gallery);
    navigation.push('Read', { gallery, chapter: latest });
  };
  const getManga = (gallery: Gallery) => {
    checkGallery(gallery);
  };
  const handleGalleryPress = (gallery: Gallery) => () => {
    if (gallery.chapters.length > 0) return handleReadLatest(gallery)();
    navigation.push('Gallery', { gallery });
  };
  const handleGalleryLongPress = (gallery: Gallery) => () => {
    showActionSheetWithOptions(
      {
        options: ['Delete', 'Read', 'View Chapters', 'Get manga info', 'Cancel'],
        cancelButtonIndex: 4,
        userInterfaceStyle: 'dark',
        destructiveButtonIndex: 0,
        title: `${gallery.name} Info`,
        message: getGalleryDetail(gallery),
      },
      (index) => {
        if (index === 0) {
          Alert.alert(
            'Confirm deletion',
            'Are you sure you want to delete this gallery and all its files?',
            [
              { style: 'destructive', text: 'Delete', onPress: handleDeleteGallery(gallery.id) },
              { style: 'cancel', text: 'Keep' },
            ],
            { cancelable: true },
          );
        }
        if (index === 1) return handleReadLatest(gallery)();
        if (index === 2) return navigation.push('Gallery', { gallery });
        if (index === 3) return getManga(gallery);
      },
    );
  };
  const renderItem = (it: ListRenderItemInfo<Gallery>) => (
    <GalleryItem
      gallery={it.item}
      onPress={handleGalleryPress(it.item)}
      onLongPress={handleGalleryLongPress(it.item)}
    />
  );
  return (
    <SafeAreaView style={{ height: dimensions.height - 60 }}>
      <FlatList
        data={sortedGalleries}
        renderItem={renderItem}
        keyExtractor={(it) => it.name}
        ListEmptyComponent={<EmptyText>No galleries found.</EmptyText>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};
