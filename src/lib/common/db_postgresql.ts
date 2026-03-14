
import type { Pool as PgPool, PoolClient } from "pg";
import pkg from 'pg';
const {Pool} = pkg;

import { env } from '$env/dynamic/private';

type ErrorLogger = {
    error: (message?: unknown, ...optionalParams: unknown[]) => void;
};

const processLogger: ErrorLogger =
    (globalThis as { processLogger?: ErrorLogger }).processLogger ?? console;

const sqlTemplateFingerprint = (sql: string): string => {
    const withoutStrings = sql.replace(/'(?:''|[^'])*'/g, "?");
    const withoutNumbers = withoutStrings.replace(/\b\d+(\.\d+)?\b/g, "?");
    const normalized = withoutNumbers.replace(/\s+/g, " ").trim();
    return normalized.length > 300 ? `${normalized.slice(0, 300)}…` : normalized;
};

const paramTypeSummary = (params: unknown[]): string[] =>
    params.map((param) => {
        if (param === null) return "null";
        if (Array.isArray(param)) return "array";
        return typeof param;
    });

const PostgreSQL = () => {

    const api = {
        checkConnection: async (): Promise<boolean> => {
            const client = await (await DBInstance.getInstance()).getClient();
            try {
                await client.query("SELECT 1");
                return true;
            } finally {
                client.release();
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: async (sql: string, params: any[] = []): Promise<any> => {
            const pool = await (await DBInstance.getInstance()).getPool();
            try{ 
                //console.log(sql, params);
                const res = await pool.query(sql, params);
                return res;
            } catch (err) {
                processLogger.error(
                    {
                        sqlTemplate: sqlTemplateFingerprint(sql),
                        paramCount: params.length,
                        paramTypes: paramTypeSummary(params),
                        errorMessage: err instanceof Error ? err.message : String(err),
                        errorStack: err instanceof Error ? err.stack : undefined
                    },
                    "Database query failed"
                );
                throw new Error('There was a problem reading the database')
            }

        },
    }; 
    return api;
};

export default PostgreSQL;


// Singleton pattern - used to connect to the database ONCE throughout the entire life of the app
export class DBInstance {
    private static pool: PgPool;
    private static instance: DBInstance | undefined;
    private static instancePromise: Promise<DBInstance> | undefined;
    private async initialize() {
        try {
            const port = Number(env.SECRET_PGPORT);
            if (!Number.isInteger(port) || port <= 0 || port > 65535) {
                throw new Error("Invalid SECRET_PGPORT");
            }
            DBInstance.pool = new Pool({
                database: env.SECRET_PGDATABASE,
                host: env.SECRET_PGHOST,
                user: env.SECRET_PGUSER,
                password: env.SECRET_PGPASSWORD,
                port: port,
                idleTimeoutMillis: 15000,
                connectionTimeoutMillis: 5000,
                max: 50
            })
        } catch (err) {
            processLogger.error(
                {
                    errorMessage: err instanceof Error ? err.message : String(err),
                    errorStack: err instanceof Error ? err.stack : undefined
                },
                "Database initialization failed"
            );
            throw new Error('Unable to connect to database')
        }
    }
    public static getInstance = async (): Promise<DBInstance> => {
        if (DBInstance.instance) return DBInstance.instance;
        DBInstance.instancePromise ??= (async () => {
            const instance = new DBInstance();
            await instance.initialize();
            DBInstance.instance = instance;
            return instance;
        })().catch((err) => {
            DBInstance.instancePromise = undefined;
            throw err;
        });
        return DBInstance.instancePromise;
    };
    public getPool = async (): Promise<PgPool> => {
        return DBInstance.pool;
    }
    public getClient = async (): Promise<PoolClient> => {
        return DBInstance.pool.connect();
    }
}
