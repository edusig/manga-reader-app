import { ThemeProvider } from '@emotion/react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable } from 'react-native';
import { useSyncDirs } from './src/hooks/use-sync-dirs';
import { NO_HEADER } from './src/lib/constants';
import { RootStackParamList } from './src/lib/interfaces';
import { theme } from './src/lib/theme';
import { DiscoverScreen } from './src/screens/discover';
import { DownloadScreen } from './src/screens/download';
import { DownloadGalleryScreen } from './src/screens/download-gallery';
import { GalleryScreen } from './src/screens/gallery';
import { HomeScreen } from './src/screens/home';
import { ChapterReadScreen } from './src/screens/read';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useSyncDirs();
  return (
    <ActionSheetProvider>
      <ThemeProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.palette.background,
              },
              headerTitleStyle: {
                color: theme.palette.primaryText,
              },
              headerTintColor: theme.palette.primaryText,
              contentStyle: {
                backgroundColor: theme.palette.background,
              },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'Galleries',
                headerRight: () => (
                  <Pressable onPress={() => navigation.push('Download')}>
                    <MaterialCommunityIcons
                      name="download"
                      size={24}
                      color={theme.palette.primaryText}
                    />
                  </Pressable>
                ),
                // headerLeft: () => (
                //   <Pressable onPress={() => navigation.push('Discover')}>
                //     <MaterialCommunityIcons
                //       name="compass-outline"
                //       size={24}
                //       color={theme.palette.primaryText}
                //     />
                //   </Pressable>
                // ),
              })}
            />
            <Stack.Screen
              name="Download"
              component={DownloadScreen}
              options={{ title: 'Downloads' }}
            />
            <Stack.Screen
              name="DownloadGallery"
              component={DownloadGalleryScreen}
              options={({ route }) => ({
                title: `Download - ${route.params.apiData.name}`,
              })}
            />
            <Stack.Screen
              name="Gallery"
              component={GalleryScreen}
              options={({ route }) => ({ title: `${route.params.gallery.name}` })}
            />
            <Stack.Screen name="Read" component={ChapterReadScreen} options={NO_HEADER} />
            <Stack.Screen
              name="Discover"
              component={DiscoverScreen}
              options={{ title: 'Discover' }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </ThemeProvider>
    </ActionSheetProvider>
  );
}
