import { FC } from 'react';
import {
  Button,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gallery } from '../lib/interfaces';
export interface GalleriesProps {
  galleries: Gallery[];
  onDownload: () => void;
}

const GalleryItem: FC<Gallery> = ({ name }) => (
  <View>
    <Text>{name}</Text>
  </View>
);

export const Galleries: FC<GalleriesProps> = ({ galleries, onDownload }) => {
  const renderItem = (it: ListRenderItemInfo<Gallery>) => <GalleryItem {...it.item} />;
  return (
    <>
      <SafeAreaView>
        <FlatList
          data={galleries}
          renderItem={renderItem}
          keyExtractor={(it) => it.name}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma galeria encontrada.</Text>}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Galleries</Text>
              <Button title="Download" onPress={onDownload} />
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingLeft: 12,
    paddingRight: 12,
    height: 52,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  title: {
    fontSize: 28,
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    paddingTop: 12,
    textAlign: 'center',
  },
});
