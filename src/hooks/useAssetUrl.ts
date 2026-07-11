import { useState, useEffect } from 'react';
import { getMediaAsset } from '../utils/indexedDB';

export function useAssetUrl(id?: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let isMounted = true;
    
    getMediaAsset(id).then(blob => {
      if (!isMounted) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } else {
        setUrl(null);
      }
    });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  return url;
}
