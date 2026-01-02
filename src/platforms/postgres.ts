import { POSTGRES_SSL_ENABLED } from '@/app/config';
import { removeParamsFromUrl } from '@/utility/url';
import type { Pool, QueryResult, QueryResultRow } from 'pg';

export type Primitive = string | number | boolean | undefined | null;

let pool: Pool;

const getPool = async () => {
  if (!pool) {
    const { Pool: PoolClass } = await import('pg');
    pool = new PoolClass({
      ...process.env.POSTGRES_URL && {
        connectionString: removeParamsFromUrl(
          process.env.POSTGRES_URL,
          ['sslmode'],
        ),
      },
      ...POSTGRES_SSL_ENABLED && { ssl: true },
    });
  }
  return pool;
};

export const query = async <T extends QueryResultRow = any>(
  queryString: string,
  values: Primitive[] = [],
) => {
  const p = await getPool();
  const client = await p.connect();
  let response: QueryResult<T>;
  try {
    response = await client.query<T>(queryString, values);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
  return response;
};

export const sql = <T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) => {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error('Invalid template literal argument');
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ''}`;
  }

  return query<T>(result, values);
};

const isTemplateStringsArray = (
  strings: unknown,
): strings is TemplateStringsArray => {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
};

export const testDatabaseConnection = async () =>
  query('SELECt COUNT(*) FROM pg_stat_user_tables');
