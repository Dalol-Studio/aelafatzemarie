export const LOCAL_FS_BASE_URL = '/uploads';

export const isUrlFromLocalFs = (url?: string) =>
  url?.startsWith(LOCAL_FS_BASE_URL);
