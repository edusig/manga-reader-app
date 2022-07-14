import styled from '@emotion/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { useGalleries } from '../hooks/use-galleries';
import { bulkChapterDelete, bulkChapterMarkAsRead, updateLastReadAt } from '../lib/gallery';
import { Chapter, RootStackParamList } from '../lib/interfaces';
import { PrimaryText, SecondaryText } from '../lib/style';
import { theme } from '../lib/theme';

type GalleryViewProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const Container = styled.View`
  padding: 0 8px;
`;

const ActionContainer = styled(Container)`
  flex-direction: row;
  justify-content: space-between;
`;

const Row = styled.View`
  flex-direction: row;
`;

const ChapterItem: FC<{
  chapter: Chapter;
  isSelecting: boolean;
  selected: boolean;
  onPress: () => void;
}> = ({ chapter, isSelecting, selected, onPress }) => (
  <TouchableHighlight activeOpacity={0.6} underlayColor="#DD" onPress={onPress}>
    <View style={styles.chapter}>
      <Row>
        {isSelecting && (
          <MaterialCommunityIcons
            name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={selected ? '#00FF00' : theme.palette.primaryText}
            style={{ marginRight: 16 }}
          />
        )}
        <View>
          <PrimaryText style={styles.chapterTitle}>{chapter.name}</PrimaryText>
          <SecondaryText>
            {chapter.read ? 'Read' : 'New'} - {chapter.pages.length} pages
          </SecondaryText>
        </View>
      </Row>
    </View>
  </TouchableHighlight>
);

export const GalleryScreen: FC<GalleryViewProps> = ({ route, navigation }) => {
  const galleryParam = route.params.gallery;
  const galleries = useGalleries();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const gallery = useMemo(
    () => galleries.find((it) => it.id === galleryParam.id) ?? galleryParam,
    [galleries, galleryParam],
  );
  const sortedChapters = useMemo(
    () =>
      (gallery.chapters ?? [])
        .slice(0)
        .sort((a: Chapter, b: Chapter) => a.name.localeCompare(b.name, 'en', { numeric: true })),
    [gallery],
  );
  const resetSelection = () => {
    setIsSelecting(false);
    setSelected([]);
  };
  const handleReadChapter = (index: number) => () => {
    updateLastReadAt(gallery);
    navigation.push('Read', {
      chapter: gallery.chapters[index],
      gallery,
    });
  };
  const handleToggleSelect = (data: Chapter) => () => {
    setSelected((prev) =>
      selected.includes(data.name) ? prev.filter((it) => it !== data.name) : [...prev, data.name],
    );
  };
  const handleToggleSelectAll = () => {
    setSelected(
      selected.length === gallery.chapters.length ? [] : gallery.chapters.map((it) => it.name),
    );
  };
  const handleRemoveSelected = () => {
    Alert.alert(
      'Confirm deletion',
      'Are you sure you want to delete these chapters?',
      [
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            bulkChapterDelete(gallery, selected);
            resetSelection();
          },
        },
        { style: 'cancel', text: 'Keep' },
      ],
      { cancelable: true },
    );
  };
  const handleMarkSelectedAsRead = () => {
    Alert.alert(
      'Confirm mark as read',
      'Are you sure you want to mark these chapters as read?',
      [
        {
          style: 'destructive',
          text: 'Mark as read',
          onPress: () => {
            bulkChapterMarkAsRead(gallery, selected);
            resetSelection();
          },
        },
        { style: 'cancel', text: 'Cancel' },
      ],
      { cancelable: true },
    );
  };
  const renderItem = (it: ListRenderItemInfo<Chapter>) => (
    <ChapterItem
      chapter={it.item}
      isSelecting={isSelecting}
      selected={selected.includes(it.item.name)}
      onPress={isSelecting ? handleToggleSelect(it.item) : handleReadChapter(it.index)}
    />
  );
  return (
    <SafeAreaView>
      {isSelecting ? (
        <ActionContainer>
          <Button title="Cancel" color={theme.palette.error} onPress={resetSelection} />
          <Row>
            <Button
              title={selected.length === gallery.chapters.length ? 'Deselect all' : 'Select all'}
              onPress={handleToggleSelectAll}
            />
            <Button
              title="Mark as Read"
              disabled={selected.length === 0}
              onPress={handleMarkSelectedAsRead}
            />
            <Button
              title="Remove"
              disabled={selected.length === 0}
              color={theme.palette.error}
              onPress={handleRemoveSelected}
            />
          </Row>
        </ActionContainer>
      ) : (
        <Row>
          <Button title="Select" onPress={() => setIsSelecting(true)} />
        </Row>
      )}
      <FlatList data={sortedChapters} renderItem={renderItem} />
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
