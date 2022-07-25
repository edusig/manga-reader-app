import styled from '@emotion/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FC, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import useSWR from 'swr';
import { useServerUrl } from '../hooks/use-server-url';
import { discoverFetcher } from '../lib/discover-fetcher';
import {
  DiscoverAPIResponse,
  DiscoverConnector,
  DiscoverConnectorData,
  DiscoverListData,
  RootStackParamList,
} from '../lib/interfaces';
import { ModalDialog, ModalOverlay, PrimaryText, SecondaryText } from '../lib/style';

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

const ItemContainer = styled.View`
  border-bottom-color: ${(props) => props.theme.palette.border};
  border-bottom-width: 1px;
  flex-direction: row;
  background-color: ${(props) => props.theme.palette.surface};
`;

const ConnectorImage = styled(Image)`
  width: 80px;
  height: 80px;
`;

const ConnectorItem = styled(Pressable)`
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.palette.border};
  padding: 12px 8px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
const ConnectorItemTitle = styled(PrimaryText)`
  font-size: 20px;
  flex-basis: 90%;
`;

const MangaTitle = styled(PrimaryText)`
  font-size: 20px;
`;

const MangaContent = styled.View`
  flex-grow: 1;
  flex-shrink: 1;
  padding: 8px;
`;

const MangaImage = styled(Image)`
  width: 80px;
  height: 120px;
`;

const Connector: FC<{
  data: DiscoverConnector;
  onSelect: (data: DiscoverConnector) => void;
  index: number;
}> = ({ data, onSelect }) => {
  return (
    <ConnectorItem onPress={() => onSelect(data)}>
      <ItemContainer>
        <ConnectorImage source={{ uri: data.logoUrl, width: 80, height: 80 }} />
        <ConnectorItemTitle>{data.name}</ConnectorItemTitle>
      </ItemContainer>
    </ConnectorItem>
  );
};

const Manga: FC<{
  data: DiscoverListData;
  onPress: (data: DiscoverListData) => void;
  index: number;
}> = ({ data, onPress }) => {
  return (
    <Pressable onPress={() => onPress(data)}>
      <ItemContainer>
        <MangaImage source={{ uri: data.image, width: 80, height: 120 }} />
        <MangaContent>
          <MangaTitle allowFontScaling>{data.title}</MangaTitle>
          <SecondaryText allowFontScaling>Latest Chapter: #{data.latestChapter}</SecondaryText>
          <SecondaryText allowFontScaling>{data.genres}</SecondaryText>
        </MangaContent>
      </ItemContainer>
    </Pressable>
  );
};

type DiscoverScreenProps = NativeStackScreenProps<RootStackParamList, 'Download'>;

export const DiscoverScreen: FC<DiscoverScreenProps> = ({ navigation }) => {
  const dimensions = useWindowDimensions();

  // States
  const { url, setUrl, local, handleSearchLocal, loading } = useServerUrl<
    DiscoverAPIResponse<DiscoverConnectorData>
  >({
    onSuccess: () => {
      if (connector == null) {
        setConnectorSelectionModal(true);
      }
    },
  });
  const [connector, setConnector] = useState<DiscoverConnector | null>(null);
  const [connectorSelectionModal, setConnectorSelectionModal] = useState(false);
  const mangaListQ = useSWR<DiscoverAPIResponse<DiscoverListData[]>>(
    `${url}/api/${connector?.name}`,
    discoverFetcher,
    { isPaused: () => connector == null },
  );
  console.log('MANGA LIST', connector, connector == null, mangaListQ);

  // List Renders
  const renderConnector = (it: ListRenderItemInfo<DiscoverConnector>) => (
    <Connector data={it.item} index={it.index} onSelect={handleSelectConnector} />
  );
  const renderManga = (it: ListRenderItemInfo<DiscoverListData>) => (
    <Manga data={it.item} index={it.index} onPress={handleOpenManga} />
  );

  // Handlers
  const handleSelectConnector = async (data: DiscoverConnector) => {
    setConnector(data);
    setConnectorSelectionModal(false);
  };
  const handleOpenManga = (manga: DiscoverListData) => {
    if (connector != null) {
      navigation.navigate('DiscoverManga', { manga, connector });
    }
  };

  // Render
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
      {url == null || url.length <= 0 ? (
        <Text>Add the server url to start discovering manga...</Text>
      ) : local?.data != null && connector != null ? (
        <FlatList
          data={mangaListQ.data?.data ?? []}
          renderItem={renderManga}
          ListEmptyComponent={<PrimaryText>No mangas found.</PrimaryText>}
        />
      ) : (
        <ActivityIndicator />
      )}
      <Modal animationType="fade" transparent={true} visible={connectorSelectionModal}>
        <ModalOverlay>
          <ModalDialog>
            <FlatList
              data={local?.data?.connectors ?? []}
              renderItem={renderConnector}
              ListHeaderComponent={
                <Container>
                  <PrimaryText>Connectors:</PrimaryText>
                </Container>
              }
              ListEmptyComponent={<PrimaryText>No connectors found.</PrimaryText>}
            />
          </ModalDialog>
        </ModalOverlay>
      </Modal>
    </SafeAreaView>
  );
};
