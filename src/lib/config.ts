import Constants from 'expo-constants';

export interface Environment {
  advancedPassword: string;
  filterTags: string[];
  defaultFileServer?: string;
}

const extra = Constants?.manifest2?.extra?.expoClient?.extra ?? Constants.manifest?.extra;
export const env: Environment = {
  ...(extra as any),
  advancedPassword: 'password',
};
