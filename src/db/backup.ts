import { query } from '@/platforms/postgres';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'public', 'backups');

export const backupDatabaseToLocalFs = async () => {
  if (!existsSync(BACKUP_DIR)) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }

  // Get all table names
  const tablesResult = await query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  
  const tables = tablesResult.rows.map(row => row.tablename);
  const backupMeta: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tables: [],
  };

  for (const table of tables) {
    try {
      const dataResult = await query(`SELECT * FROM ${table}`);
      const filePath = path.join(BACKUP_DIR, `${table}.json`);
      
      await fs.writeFile(
        filePath, 
        JSON.stringify(dataResult.rows, null, 2)
      );
      
      backupMeta.tables.push({
        name: table,
        rowCount: dataResult.rowCount,
        file: `${table}.json`
      });
      
      console.log(`Backed up ${table}: ${dataResult.rowCount} rows`);
    } catch (error) {
      console.error(`Failed to backup table ${table}:`, error);
      backupMeta.tables.push({
        name: table,
        error: String(error)
      });
    }
  }

  await fs.writeFile(
    path.join(BACKUP_DIR, 'backup-meta.json'),
    JSON.stringify(backupMeta, null, 2)
  );

  return backupMeta;
};
