import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { StorageListResponse } from './types';

import { LOCAL_FS_BASE_URL } from './local-fs';

export const localFsPut = async (
  file: Buffer,
  fileName: string,
): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, file);
  return `${LOCAL_FS_BASE_URL}/${fileName}`;
};

export const localFsCopy = async (
  sourceUrl: string,
  destinationFileName: string,
  _addRandomSuffix?: boolean,
): Promise<string> => {
  const sourceFileName = sourceUrl.split('/').pop();
  if (!sourceFileName) throw new Error('Invalid source URL');
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const sourcePath = path.join(uploadDir, sourceFileName);
  
  if (!existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const destinationPath = path.join(uploadDir, destinationFileName);
  await fs.copyFile(sourcePath, destinationPath);
  
  return `${LOCAL_FS_BASE_URL}/${destinationFileName}`;
};

export const localFsDelete = async (fileName: string) => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, fileName);
  if (existsSync(filePath)) {
    await fs.unlink(filePath);
  }
};

export const localFsList = async (
  prefix: string,
): Promise<StorageListResponse> => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) return [];

  const files = await fs.readdir(uploadDir);
  const matchingFiles = files.filter(file => file.startsWith(prefix));

  return Promise.all(matchingFiles.map(async (fileName) => {
    const stats = await fs.stat(path.join(uploadDir, fileName));
    return {
      url: `${LOCAL_FS_BASE_URL}/${fileName}`,
      fileName,
      uploadedAt: stats.mtime,
      size: stats.size.toString(),
    };
  }));
};
