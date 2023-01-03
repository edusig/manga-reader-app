import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_DIRECTORIES_PATH, NO_HEADER } from '../lib/constants';
import { readChapter, updateChapterCurrentPage } from '../lib/gallery';
import { RootStackParamList } from '../lib/interfaces';
import { PrimaryText } from '../lib/style';
import { theme } from '../lib/theme';

type ChapterReadScreenProps = NativeStackScreenProps<RootStackParamList, 'Read'>;

const Page: FC<{
  path: string;
  width: number;
  onPress: () => void;
  index: number;
}> = ({ path, width, onPress, index }) => {
  const [height, setHeight] = useState(300);
  useEffect(() => Image.getSize(path, (w, h) => setHeight((width / w) * h)), [width]);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Image source={{ uri: path, width, height }} style={{ marginTop: index === 0 ? 40 : 0 }} />
    </TouchableWithoutFeedback>
  );
};

const MemoPage = memo(Page);

const directoriesPath = `${FileSystem.documentDirectory}${DEFAULT_DIRECTORIES_PATH}`;

export const ChapterReadScreen: FC<ChapterReadScreenProps> = ({ route, navigation }) => {
  const { chapter, gallery } = route.params;
  const listRef = useRef<FlatList<string>>();
  const dimensions = useWindowDimensions();
  const [show, setShow] = useState(false);
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [currentScroll, setCurrentScroll] = useState(0);
  const [currentSize, setCurrentSize] = useState(0);
  const chapterIndex = useMemo(
    () => gallery.chapters.findIndex(it => it.name === chapter?.name) ?? -1,
    [gallery, chapter],
  );
  const nextChapter = useMemo(
    () =>
      chapterIndex >= 0 && gallery.chapters.length - 1 > chapterIndex
        ? gallery.chapters[chapterIndex + 1]
        : undefined,
    [gallery, chapter, chapterIndex],
  );
  const renderItem = (it: ListRenderItemInfo<string>) =>
    it.item === 'end' ? (
      <View style={{ paddingVertical: 24 }}>
        {nextChapter == null ? (
          <View style={{ paddingVertical: 100, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 24 }}>This is the last chapter</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={goToNextChapter} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: 100,
                backgroundColor: '#444',
                alignItems: 'center',
                borderRadius: 16,
              }}
            >
              <Text style={{ color: 'white', fontSize: 24 }}>Next Chapter</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    ) : (
      <MemoPage
        path={`${directoriesPath}/${gallery.path}/${chapter.path}/${it.item}`}
        width={dimensions.width}
        index={it.index}
        onPress={() => {
          if (show) {
            navigation.setOptions(NO_HEADER);
          } else {
            const progress = (chapterIndex / (gallery.chapters.length - 1)) * 100;
            navigation.setOptions({
              headerBackTitleVisible: false,
              headerBackVisible: false,
              headerTransparent: false,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: theme.palette.background,
              },
              header: () => (
                <View
                  style={{
                    justifyContent: 'center',
                    height: 96,
                    paddingTop: insets.top,
                    backgroundColor: theme.palette.background,
                  }}
                >
                  <PrimaryText style={{ fontSize: 18, alignSelf: 'center' }}>
                    {route.params.gallery.name}
                  </PrimaryText>
                  <PrimaryText style={{ fontSize: 18, alignSelf: 'center' }}>
                    {route.params.chapter.name} ({chapterIndex + 1}/{gallery.chapters.length} -{' '}
                    {progress.toFixed(1)}%)
                  </PrimaryText>
                </View>
              ),
            });
          }
          setShow(prev => !prev);
        }}
      />
    );

  const goToNextChapter = useCallback(async () => {
    if (nextChapter == null || gallery == null) return;
    await readChapter(gallery.id, chapterIndex);
    navigation.replace('Read', { chapter: nextChapter, gallery });
  }, [chapterIndex, nextChapter, gallery, navigation]);

  const handleViewableItems = useCallback(info => {
    if (info.viewableItems.length > 0) {
      setCurrentPage(info.viewableItems[0].index ?? 0);
      updateChapterCurrentPage(gallery.id, chapter.name, info.viewableItems[0].index);
    }
  }, []);

  const handleScrollToIndexFail = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const offset = info.averageItemLength * info.index;
    if (listRef.current != null) {
      listRef.current.scrollToOffset({ offset, animated: false });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentScroll(event.nativeEvent.contentOffset.y);
  };

  const handleContentSizeChange = (_: number, contentHeight: number) => {
    setCurrentSize(contentHeight);
  };

  useEffect(() => {
    if (listRef.current != null && chapter.currentPage > 0) {
      setTimeout(() => {
        if (listRef.current != null) {
          listRef.current.scrollToIndex({ index: chapter.currentPage, animated: false });
        }
      }, 100);
    }
  }, [listRef, chapter]);

  return (
    <>
      <FlatList
        data={[...chapter.pages, 'end']}
        renderItem={renderItem}
        onViewableItemsChanged={handleViewableItems}
        keyExtractor={it => it}
        ref={listRef as any}
        onScrollToIndexFailed={handleScrollToIndexFail}
        initialNumToRender={chapter.pages.length}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
      />
      <View
        style={{
          backgroundColor: 'black',
          position: 'absolute',
          bottom: 0,
          left: 0,
          padding: 8,
          borderTopRightRadius: 16,
          paddingLeft: 16,
          flexDirection: 'row',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 8 }}>
          {currentPage + 1}/{chapter.pages.length ?? 0}
        </Text>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {((currentScroll / currentSize) * 100).toFixed(0)}%
        </Text>
      </View>
    </>
  );
};
