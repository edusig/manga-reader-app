import { FC, useState } from 'react';
import {
  Button,
  FlatList,
  ListRenderItemInfo,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LocalAPIData, LocalAPIResponse } from '../lib/interfaces';

export interface DownloadModalProps {
  open: boolean;
  local?: LocalAPIResponse;
  onClose: () => void;
  onSearch: (url: string) => void;
  onAdd: (index: number, url: string) => void;
}

const LocalGallery: FC<
  LocalAPIData & { onAdd: (index: number, url: string) => void; index: number; url: string }
> = ({ name, count, onAdd, index, url }) => {
  return (
    <View style={styles.galleryItem}>
      <Text style={styles.galleryItemTitle}>
        {name} - ({count} chapters)
      </Text>
      <Button
        title="Add"
        onPress={() => {
          onAdd(index, url);
        }}
      />
    </View>
  );
};

export const DownloadModal: FC<DownloadModalProps> = ({
  open,
  local,
  onClose,
  onSearch,
  onAdd,
}) => {
  const [url, setUrl] = useState('');
  const renderItem = (it: ListRenderItemInfo<LocalAPIData>) => (
    <LocalGallery {...it.item} index={it.index} url={url} onAdd={onAdd} />
  );
  const handleSearch = () => {
    onSearch(url);
  };
  return (
    <Modal animationType="fade" transparent={true} visible={open} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Download Files</Text>
          <Text>Server url:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={url}
              keyboardType="url"
              onChangeText={setUrl}
              onSubmitEditing={handleSearch}
            />
          </View>
          {local != null && (
            <FlatList
              data={local.data}
              renderItem={renderItem}
              ListHeaderComponent={<Text>Galerias encontradas:</Text>}
              ListEmptyComponent={<Text>Nenhuma galeria encontrada.</Text>}
              ListFooterComponent={<Button title="Close" onPress={onClose} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    backgroundColor: '#000000AA',
  },
  modalView: {
    marginHorizontal: 16,
    marginVertical: 32,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#efefef',
    height: 40,
    flex: 1,
    marginTop: 4,
  },
  galleryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    marginBottom: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryItemTitle: {
    fontSize: 16,
    flexShrink: 1,
    flexBasis: '86%',
  },
});
