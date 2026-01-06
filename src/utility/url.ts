// Remove protocol, www, and trailing slash from url
export const shortenUrl = (url?: string) => url
  ? url
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .replace(/\/$/, '')
  : undefined;

// Remove protocol, and trailing slash from url
export const removeUrlProtocol = (url?: string) => url
  ? url
    .replace(/^(?:https?:\/\/)?/i, '')
    .replace(/\/$/, '')
  : undefined;

// Add protocol to url and remove trailing slash
export const makeUrlAbsolute = (url?: string) => url !== undefined
  ? (!url.startsWith('http') ? `https://${url}` : url)
    .replace(/\/$/, '')
  : undefined;

export const removeParamsFromUrl = (urlString: string, params: string[]) => {
  const url = new URL(urlString);
  for (const param of params) {
    url.searchParams.delete(param);
  }
  return url.toString();
};

export const downloadFileFromBrowser = async (
  url: string,
  fileName: string,
) => {
  try {
    // Use API proxy to avoid CORS issues with S3/external storage
    const encodedUrl = encodeURIComponent(url);
    const encodedName = encodeURIComponent(fileName);
    const proxyUrl = `/api/download?url=${encodedUrl}&fileName=${encodedName}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    // Fallback: try direct link (may open in new tab for cross-origin)
    console.warn('Download via proxy failed, trying direct link:', error);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Necessary for useClientSearchParams to see window.location changes,
// particularly for paths that only change query params
export const replacePathWithEvent = (pathname: string) => {
  window.history.pushState(null, '', pathname);
  dispatchEvent(new Event('replacestate'));
};
