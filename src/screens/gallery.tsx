import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useMemo } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { useGalleries } from '../hooks/use-galleries';
import { updateLastReadAt } from '../lib/gallery';
import { Chapter, RootStackParamList } from '../lib/interfaces';
import { PrimaryText, SecondaryText } from '../lib/style';

type GalleryViewProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const ChapterItem: FC<Chapter & { onPress: () => void }> = ({ name, read, onPress }) => (
  <TouchableHighlight activeOpacity={0.6} underlayColor="#DD" onPress={onPress}>
    <View style={styles.chapter}>
      <PrimaryText style={styles.chapterTitle}>{name}</PrimaryText>
      <SecondaryText>{read ? 'Read' : 'New'}</SecondaryText>
    </View>
  </TouchableHighlight>
);

export const GalleryScreen: FC<GalleryViewProps> = ({ route, navigation }) => {
  const galleryParam = route.params.gallery;
  const galleries = useGalleries();
  const gallery = useMemo(
    () => galleries.find((it) => it.id === galleryParam.id) ?? galleryParam,
    [galleries, galleryParam],
  );
  const handleReadChapter = (index: number) => () => {
    updateLastReadAt(gallery);
    navigation.push('Read', {
      chapter: gallery.chapters[index],
      gallery,
    });
  };
  const renderItem = (it: ListRenderItemInfo<Chapter>) => (
    <ChapterItem {...it.item} onPress={handleReadChapter(it.index)} />
  );
  return (
    <SafeAreaView>
      <FlatList data={gallery?.chapters ?? []} renderItem={renderItem} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chapter: {
    padding: 16,
  },
  chapterTitle: {
    fontSize: 20,
  },
  galleryTitle: {
    fontSize: 28,
  },
});
