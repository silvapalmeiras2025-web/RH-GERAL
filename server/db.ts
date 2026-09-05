/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import { DatabaseState, LocalTrabalho, RecordType, Secretaria } from '../src/types.js';

const { Pool } = pg;

// Reaproveita a pool entre invocações "quentes" de função serverless (Vercel) e no processo local
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: pg.Pool | undefined;
}

function getConnectionString(): string {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Variável de ambiente POSTGRES_URL (ou DATABASE_URL) não configurada. Configure a conexão com o banco Postgres.'
    );
  }
  return url;
}

function getPool(): pg.Pool {
  if (!global.__pgPool) {
    const connectionString = getConnectionString();
    global.__pgPool = new Pool({
      connectionString,
      // Vercel Postgres (Neon) exige SSL; um Postgres local tradicional não precisa.
      ssl: connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5
    });
  }
  return global.__pgPool;
}

const emptyState = (): DatabaseState => ({
  admissoes: [],
  demissoes: [],
  faltas: [],
  ferias: [],
  lotacoes: [],
  horasExtras: [],
  ajudasCusto: [],
  gratificacoes: [],
  permutas: [],
  frequencias: [],
  locaisTrabalho: []
});

let schemaReadyPromise: Promise<void> | null = null;

// Cria as tabelas na primeira chamada; operação idempotente (CREATE TABLE IF NOT EXISTS)
export function ensureSchema(): Promise<void> {
  if (!schemaReadyPromise) {
    schemaReadyPromise = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS locais_trabalho (
          id TEXT PRIMARY KEY,
          secretaria TEXT NOT NULL,
          nome TEXT NOT NULL,
          endereco TEXT NOT NULL DEFAULT '',
          responsavel TEXT NOT NULL DEFAULT '',
          ativo BOOLEAN NOT NULL DEFAULT true,
          "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          secretaria TEXT NOT NULL,
          "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
          payload JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
        CREATE INDEX IF NOT EXISTS idx_records_secretaria ON records(secretaria);
        CREATE INDEX IF NOT EXISTS idx_locais_secretaria ON locais_trabalho(secretaria);
        `
      )
      .then(() => undefined)
      .catch((err) => {
        schemaReadyPromise = null;
        throw err;
      });
  }
  return schemaReadyPromise;
}

function rowToLocal(row: any): LocalTrabalho {
  return {
    id: row.id,
    secretaria: row.secretaria,
    nome: row.nome,
    endereco: row.endereco,
    responsavel: row.responsavel,
    ativo: row.ativo,
    timestamp: new Date(row.timestamp).toISOString()
  };
}

export async function readDatabase(): Promise<DatabaseState> {
  await ensureSchema();
  const pool = getPool();

  const [recordsResult, locaisResult] = await Promise.all([
    pool.query('SELECT type, payload FROM records ORDER BY "timestamp" ASC'),
    pool.query('SELECT * FROM locais_trabalho ORDER BY nome ASC')
  ]);

  const state = emptyState();
  for (const row of recordsResult.rows) {
    const type = row.type as RecordType;
    if (Array.isArray((state as any)[type])) {
      (state as any)[type].push(row.payload);
    }
  }
  state.locaisTrabalho = locaisResult.rows.map(rowToLocal);

  return state;
}

export async function insertRecord(type: RecordType, record: any): Promise<void> {
  await ensureSchema();
  await getPool().query(
    'INSERT INTO records (id, type, secretaria, "timestamp", payload) VALUES ($1, $2, $3, $4, $5)',
    [record.id, type, record.secretaria, record.timestamp, JSON.stringify(record)]
  );
}

export async function deleteRecord(type: RecordType, id: string): Promise<boolean> {
  await ensureSchema();
  const result = await getPool().query('DELETE FROM records WHERE type = $1 AND id = $2', [type, id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listLocaisTrabalho(secretaria?: Secretaria): Promise<LocalTrabalho[]> {
  await ensureSchema();
  const result = secretaria
    ? await getPool().query('SELECT * FROM locais_trabalho WHERE secretaria = $1 ORDER BY nome ASC', [secretaria])
    : await getPool().query('SELECT * FROM locais_trabalho ORDER BY nome ASC');
  return result.rows.map(rowToLocal);
}

export async function findLocalByNome(secretaria: Secretaria, nome: string): Promise<LocalTrabalho | null> {
  await ensureSchema();
  const result = await getPool().query(
    'SELECT * FROM locais_trabalho WHERE secretaria = $1 AND lower(nome) = lower($2)',
    [secretaria, nome]
  );
  return result.rows[0] ? rowToLocal(result.rows[0]) : null;
}

export async function createLocalTrabalho(input: {
  id: string;
  secretaria: Secretaria;
  nome: string;
  endereco: string;
  responsavel: string;
  timestamp: string;
}): Promise<LocalTrabalho> {
  await ensureSchema();
  const result = await getPool().query(
    `INSERT INTO locais_trabalho (id, secretaria, nome, endereco, responsavel, ativo, "timestamp")
     VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING *`,
    [input.id, input.secretaria, input.nome, input.endereco, input.responsavel, input.timestamp]
  );
  return rowToLocal(result.rows[0]);
}

export async function updateLocalTrabalho(
  id: string,
  fields: Partial<Pick<LocalTrabalho, 'nome' | 'endereco' | 'responsavel' | 'ativo'>>
): Promise<LocalTrabalho | null> {
  await ensureSchema();
  const result = await getPool().query('SELECT * FROM locais_trabalho WHERE id = $1', [id]);
  if (!result.rows[0]) return null;

  const merged = { ...rowToLocal(result.rows[0]), ...fields };
  const updated = await getPool().query(
    'UPDATE locais_trabalho SET nome = $1, endereco = $2, responsavel = $3, ativo = $4 WHERE id = $5 RETURNING *',
    [merged.nome, merged.endereco, merged.responsavel, merged.ativo, id]
  );
  return rowToLocal(updated.rows[0]);
}

export async function deleteLocalTrabalho(id: string): Promise<boolean> {
  await ensureSchema();
  const result = await getPool().query('DELETE FROM locais_trabalho WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
