import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LocalAPIResponse } from '../lib/interfaces';

export interface UseServerUrlOptions {
  onSuccess?: <APIResponse = LocalAPIResponse>(data: APIResponse) => void;
}

export const useServerUrl = <APIResponse = LocalAPIResponse>(options?: UseServerUrlOptions) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<APIResponse | undefined>();
  const handleSetUrl = async (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl !== url) {
      await AsyncStorage.setItem('serverUrl', newUrl);
    }
  };
  const loadData = async () => {
    const serverUrl = await AsyncStorage.getItem('serverUrl');
    if (serverUrl != null) {
      setUrl(serverUrl);
      handleSearchLocal(serverUrl);
    }
  };

  const handleSearchLocal = async (newUrl?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${newUrl ?? url}/api`);
      const data: APIResponse = await res.json();
      setLocal(data);
      if (options?.onSuccess != null) options.onSuccess(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  return {
    url,
    setUrl: handleSetUrl,
    handleSearchLocal,
    local,
    loading,
  };
};
