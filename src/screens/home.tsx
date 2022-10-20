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
import { checkGallery } from '../lib/anilist';
import { env } from '../lib/config';
import { DEFAULT_DIRECTORIES_PATH } from '../lib/constants';
import {
  getGalleryDetail,
  getGalleryLastReadChapter,
  getGalleryLastReadChapterNumber,
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
  width: 80px;
  height: 120px;
`;

const ListHeader = styled.View`
  justify-content: space-between;
  flex-direction: row;
`;

enum SortKind {
  NAME = 'Name',
  LAST_READ = 'Last Read',
  CHAPTER_COUNT = 'Chapter Count',
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
};

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

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
        <SecondaryText allowFontScaling>
          {gallery.chapters.length} chapters -{' '}
          {gallery.lastReadAt != null ? format(new Date(gallery.lastReadAt), 'Pp') : 'Never read'}
        </SecondaryText>
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
  const [sortKind, setSortKind] = useState<SortKind>(SortKind.NAME);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdult, setShowAdult] = useState(false);

  const timeoutRef = useRef();
  const [presses, setPresses] = useState(0);

  const sortedGalleries = useMemo(() => {
    const sorted = galleries.slice(0).sort(sortKinds[sortKind].sort);
    return sortOrder === SortOrder.DESC ? sorted.reverse() : sorted;
  }, [galleries, sortKind, sortOrder]);

  const filteredGalleries = useMemo(
    () =>
      showAdult || env.adultTags == null || env.adultTags.length <= 0
        ? sortedGalleries
        : sortedGalleries.filter(
            it =>
              it.manga?.genres == null ||
              !env.adultTags.some(tag => it.manga?.genres.includes(tag)),
          ),
    [sortedGalleries, showAdult],
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
        if (index === 1) return handleReadLatest(gallery)();
        if (index === 2) return navigation.push('Gallery', { gallery });
        if (index === 3) return getManga(gallery);
      },
    );
  };
  const handleSort = () => {
    showActionSheetWithOptions(
      {
        options: Object.keys(sortKinds).concat(['Cancel']),
        cancelButtonIndex: 3,
        userInterfaceStyle: 'dark',
        title: 'Choose the sorting key',
      },
      index => {
        if (index != null && index < 3) {
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
              options: [`${showAdult ? 'Hide' : 'Show'} adult galleries`, 'Cancel'],
              cancelButtonIndex: 1,
              userInterfaceStyle: 'dark',
              title: 'Advanced Controls',
            },
            selectedIdx => {
              if (selectedIdx === 0) setShowAdult(prev => !prev);
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
        <Text style={{ color: 'white' }}>Showing {filteredGalleries.length} galleries</Text>
      </Pressable>
      <FlatList
        data={filteredGalleries}
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
