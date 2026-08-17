import { useEffect, useCallback } from 'react';

/**
 * Custom Hook for URL Hash Deep-Linking & Quick Share
 */
export function useUrlState({ selectedAsset, nameKey, feeder, area, type, viewMode, onRestoreState }) {
  // Sync state to URL hash
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedAsset?.row && nameKey && selectedAsset.row[nameKey]) {
      params.set('asset', String(selectedAsset.row[nameKey]));
    }
    if (feeder) params.set('feeder', feeder);
    if (area) params.set('area', area);
    if (type) params.set('type', type);
    if (viewMode && viewMode !== 'table') params.set('view', viewMode);

    const hashStr = params.toString();
    const newUrl = hashStr ? `#${hashStr}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [selectedAsset, nameKey, feeder, area, type, viewMode]);

  // Generate shareable link
  const getShareableLink = useCallback(() => {
    return window.location.href;
  }, []);

  return { getShareableLink };
}
