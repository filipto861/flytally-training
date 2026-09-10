import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var __trainingSql: NeonQueryFunction<false, false> | undefined;
}

let productionSql: NeonQueryFunction<false, false> | undefined;

function databaseUrl(): string {
  const value = process.env.TRAINING_DATABASE_URL?.trim();
  if (!value) throw new Error("TRAINING_DATABASE_URL is not configured.");
  return value;
}

function getSql(): NeonQueryFunction<false, false> {
  const cached = process.env.NODE_ENV === "production" ? productionSql : globalThis.__trainingSql;
  if (cached) return cached;
  const client = neon(databaseUrl(), { fullResults: false, arrayMode: false });
  if (process.env.NODE_ENV === "production") productionSql = client;
  else globalThis.__trainingSql = client;
  return client;
}

const deferredSqlTarget = (() => undefined) as unknown as NeonQueryFunction<false, false>;

export const sql = new Proxy(deferredSqlTarget, {
  apply(_target, thisArg, argArray) { return Reflect.apply(getSql(), thisArg, argArray); },
  get(_target, property) {
    const client = getSql();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as NeonQueryFunction<false, false>;
