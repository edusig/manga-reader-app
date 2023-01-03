import styled from '@emotion/native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import format from 'date-fns/format';
import isBefore from 'date-fns/isBefore';
import * as FileSystem from 'expo-file-system';
import { FC, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useGalleries } from '../hooks/use-galleries';
import { checkGallery, clearGalleryInfo } from '../lib/anilist';
import { env } from '../lib/config';
import { DEFAULT_DIRECTORIES_PATH } from '../lib/constants';
import {
  getGalleryDetail,
  getGalleryLastReadChapter,
  getGalleryLastReadChapterIndex,
  getGalleryLastReadChapterNumber,
  mangaStatusLabelDict,
  updateLastReadAt,
} from '../lib/gallery';
import { Gallery, RootStackParamList } from '../lib/interfaces';
import { galleryStorage } from '../lib/storage';
import { EmptyText, ModalDialog, ModalOverlay, PrimaryText, SecondaryText } from '../lib/style';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const GalleryItemContainer = styled.View`
  border-bottom-color: ${props => props.theme.palette.border};
  border-bottom-width: 1px;
  flex-direction: row;
  background-color: ${props => props.theme.palette.surface};
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

const GalleryImage = styled(Image as any)`
  width: 100px;
  height: 150px;
`;

const ListHeader = styled.View`
  justify-content: space-between;
  flex-direction: row;
`;

const ProgressBarContainer = styled.View`
  background-color: #555;
  margin-top: 8px;
  height: 4px;
`;

const ProgressBar = styled.View<{ progress: string }>`
  background-color: ${props => props.theme.palette.success};
  height: 4px;
  width: ${props => props.progress}%;
`;

enum SortKind {
  NAME = 'Name',
  LAST_READ = 'Last Read',
  CHAPTER_COUNT = 'Chapter Count',
  SCORE = 'Score',
}

enum SortOrder {
  ASC = 'Asc',
  DESC = 'Desc',
}

const sortKinds: Record<SortKind, { sort: (a: Gallery, b: Gallery) => number }> = {
  [SortKind.NAME]: {
    sort: (a: Gallery, b: Gallery) => a.name.localeCompare(b.name, 'en'),
  },
  [SortKind.LAST_READ]: {
    sort: (a: Gallery, b: Gallery) => {
      if (a.lastReadAt != null && b.lastReadAt != null) {
        return isBefore(new Date(b.lastReadAt), new Date(a.lastReadAt)) ? -1 : 1;
      } else if (a.lastReadAt == null) {
        return 1;
      } else if (b.lastReadAt == null) {
        return -1;
      }
      return 0;
    },
  },
  [SortKind.CHAPTER_COUNT]: {
    sort: (a: Gallery, b: Gallery) => a.chapters.length - b.chapters.length,
  },
  [SortKind.SCORE]: {
    sort: (a: Gallery, b: Gallery) => (a.manga?.averageScore ?? 0) - (b.manga?.averageScore ?? 0),
  },
};

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

const GalleryItem: FC<{
  gallery: Gallery;
  onPress: () => void;
  onLongPress: () => void;
}> = ({ gallery, onPress, onLongPress }) => {
  const lastReadChapterIndex = getGalleryLastReadChapterIndex(gallery);
  const progress = (lastReadChapterIndex / (gallery.chapters.length - 1)) * 100;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <GalleryItemContainer>
        <GalleryImage
          source={{
            uri:
              gallery.manga?.coverImage.xlarge ??
              gallery.manga?.coverImage.large ??
              gallery.manga?.coverImage.medium ??
              gallery.manga?.bannerImage ??
              (gallery.chapters.at(0)?.pages.at(0) != null
                ? `${directoriesPath}/${gallery.path}/${
                    gallery.chapters.at(0)?.path
                  }/${gallery.chapters.at(0)?.pages.at(0)}`
                : undefined),
            width: 100,
            height: 150,
          }}
        />
        <GalleryContent>
          <GalleryTitle>
            {gallery.manga?.title.english ?? gallery.manga?.title.romaji ?? gallery.name}
          </GalleryTitle>
          <SecondaryText>
            {gallery.chapters.length} chapter{gallery.chapters.length !== 1 ? 's' : ''}
          </SecondaryText>
          <SecondaryText>
            {gallery.lastReadAt != null
              ? `Last Read: ${format(new Date(gallery.lastReadAt), 'Pp')}`
              : 'Never read'}
          </SecondaryText>
          {gallery.manga?.genres != null && (
            <SecondaryText>Genres: {gallery.manga?.genres.join(', ')}</SecondaryText>
          )}
          {gallery.manga?.averageScore != null && (
            <SecondaryText>Score: {gallery.manga?.averageScore}</SecondaryText>
          )}
          {gallery.manga?.status != null && (
            <SecondaryText>Status: {mangaStatusLabelDict[gallery.manga.status]}</SecondaryText>
          )}
          {gallery.filtered && <SecondaryText>Manually Hidden</SecondaryText>}
          {gallery.manga?.genres != null &&
            env.filterTags != null &&
            gallery.manga?.genres.some(genre => env.filterTags.includes(genre)) && (
              <SecondaryText>Tags Hidden</SecondaryText>
            )}
          {progress > 0 && (
            <>
              <ProgressBarContainer>
                <ProgressBar progress={progress.toString()} />
              </ProgressBarContainer>
              <SecondaryText>{progress.toFixed(1)}%</SecondaryText>
            </>
          )}
        </GalleryContent>
        <GalleryItemNumberContainer>
          <GalleryItemNumber>
            #{getGalleryLastReadChapterNumber(getGalleryLastReadChapter(gallery))}
          </GalleryItemNumber>
        </GalleryItemNumberContainer>
      </GalleryItemContainer>
    </Pressable>
  );
};

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const dimensions = useWindowDimensions();
  const galleries = useGalleries();
  const { showActionSheetWithOptions } = useActionSheet();
  const [sortKind, setSortKind] = useState<SortKind>(SortKind.NAME);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilteredTags, setShowFilteredTags] = useState(false);

  const timeoutRef = useRef();
  const [presses, setPresses] = useState(0);

  const sortedGalleries = useMemo(() => {
    const sorted = galleries.slice(0).sort(sortKinds[sortKind].sort);
    return sortOrder === SortOrder.DESC ? sorted.reverse() : sorted;
  }, [galleries, sortKind, sortOrder]);

  const filteredGalleries = useMemo(
    () =>
      showFilteredTags || env.filterTags == null || env.filterTags.length <= 0
        ? sortedGalleries
        : sortedGalleries.filter(
            it =>
              it.manga?.genres == null ||
              !env.filterTags.some(tag =>
                it.manga?.genres.map(g => g.toLocaleLowerCase()).includes(tag.toLocaleLowerCase()),
              ),
          ),
    [sortedGalleries, showFilteredTags],
  );
  const manualFilteredGalleries = useMemo(
    () => filteredGalleries.filter(it => showFilteredTags || !it.filtered),
    [filteredGalleries],
  );

  const handleDeleteGallery = (id: number) => async () => {
    setIsLoading(true);
    try {
      const galleriesById = galleryStorage.getCollectionById();
      const path = `${directoriesPath}/${galleriesById[id].path}`;
      await galleryStorage.removeItem(id);
      await FileSystem.deleteAsync(path);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };
  const handleReadLatest = (gallery: Gallery) => () => {
    const latest = gallery.chapters.find(it => it.read === false) ?? gallery.chapters[0];
    updateLastReadAt(gallery);
    navigation.push('Read', { gallery, chapter: latest });
  };
  const getManga = (gallery: Gallery) => {
    if (gallery.manga != null) clearGalleryInfo(gallery);
    else checkGallery(gallery);
  };
  const handleGalleryPress = (gallery: Gallery) => () => {
    if (gallery.chapters.length > 0) return handleReadLatest(gallery)();
    navigation.push('Gallery', { gallery });
  };
  const handleGalleryFilterToggle = (gallery: Gallery) => {
    galleryStorage.updateItem({ ...gallery, filtered: !gallery.filtered });
  };
  const handleGalleryLongPress = (gallery: Gallery) => () => {
    showActionSheetWithOptions(
      {
        options: [
          'Delete',
          gallery.filtered ? 'Show/Remove filter' : 'Hide/Filter',
          'View Chapters',
          gallery.manga != null ? 'Remove manga info' : 'Get manga info',
          'Cancel',
        ],
        cancelButtonIndex: 4,
        userInterfaceStyle: 'dark',
        destructiveButtonIndex: 0,
        title: `${gallery.name} Info`,
        message: getGalleryDetail(gallery),
      },
      index => {
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
        if (index === 1) return handleGalleryFilterToggle(gallery);
        if (index === 2) return navigation.push('Gallery', { gallery });
        if (index === 3) return getManga(gallery);
      },
    );
  };
  const handleSort = () => {
    showActionSheetWithOptions(
      {
        options: Object.keys(sortKinds).concat(['Cancel']),
        cancelButtonIndex: 4,
        userInterfaceStyle: 'dark',
        title: 'Choose the sorting key',
      },
      index => {
        if (index != null && index < 4) {
          setSortKind(Object.keys(sortKinds)[index] as SortKind);
          setSortOrder(SortOrder.ASC);
        }
      },
    );
  };
  const handleSortOrder = () => {
    showActionSheetWithOptions(
      {
        options: ['Asc', 'Desc', 'Cancel'],
        cancelButtonIndex: 2,
        userInterfaceStyle: 'dark',
        title: 'Choose the sorting order',
      },
      index => {
        if (index === 0) setSortOrder(SortOrder.ASC);
        if (index === 1) setSortOrder(SortOrder.DESC);
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
  const handleAdvancedDetails = () => {
    if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    if (presses === 10) {
      Alert.prompt('Password', 'Input the password to show advanced info', (text: string) => {
        if (text === env.advancedPassword) {
          showActionSheetWithOptions(
            {
              options: [`${showFilteredTags ? 'Hide' : 'Show'} filtered galleries`, 'Cancel'],
              cancelButtonIndex: 1,
              userInterfaceStyle: 'dark',
              title: 'Advanced Controls',
            },
            selectedIdx => {
              if (selectedIdx === 0) setShowFilteredTags(prev => !prev);
            },
          );
        } else {
          Alert.alert('Wrong', 'Ops, nothing to see here XP.');
        }
      });
      setPresses(0);
    } else {
      setPresses(prev => prev + 1);
      setTimeout(() => {
        setPresses(0);
      }, 5000);
    }
  };
  return (
    <SafeAreaView style={{ height: dimensions.height - 60 }}>
      <ListHeader>
        <Button color="white" title={`Order by: ${sortKind}`} onPress={handleSort} />
        <Button color="white" title={`Order direction: ${sortOrder}`} onPress={handleSortOrder} />
      </ListHeader>
      <Pressable style={{ marginVertical: 8 }} onPress={handleAdvancedDetails}>
        <Text style={{ color: 'white' }}>Showing {manualFilteredGalleries.length} galleries</Text>
      </Pressable>
      <FlatList
        data={manualFilteredGalleries}
        renderItem={renderItem}
        keyExtractor={it => it.id.toString()}
        ListEmptyComponent={<EmptyText>No galleries found.</EmptyText>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <Modal animationType="fade" transparent={true} visible={isLoading}>
        <ModalOverlay>
          <ModalDialog>
            <Text style={{ color: 'white', fontSize: 24 }}>Removing gallery...</Text>
          </ModalDialog>
        </ModalOverlay>
      </Modal>
    </SafeAreaView>
  );
};
