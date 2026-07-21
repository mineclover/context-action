import type {
  DurableOperationRedisClient,
  DurableOperationRedisEvalOptions,
} from '../../src/redis-operation-backend';

export interface FakeRedisClient extends DurableOperationRedisClient {
  readonly values: Map<string, string>;
  readonly members: Set<string>;
}

export function createFakeRedisClient(): FakeRedisClient {
  const values = new Map<string, string>();
  const members = new Set<string>();

  const client: FakeRedisClient = {
    values,
    members,
    get: async key => values.get(key),
    eval: async <TResult>(_script: string, options: DurableOperationRedisEvalOptions): Promise<TResult> => {
      const [recordKey, indexKey] = options.keys;
      const [expected, next, member] = options.arguments;
      if (!recordKey || !indexKey || member === undefined) throw new Error('Invalid fake Redis command.');
      const current = values.get(recordKey);
      if (expected === '') {
        if (current !== undefined) return 0 as TResult;
      } else if (current === undefined || JSON.parse(current).revision !== Number(expected)) {
        return 0 as TResult;
      }
      if (next === '') {
        values.delete(recordKey);
        members.delete(member);
      } else {
        values.set(recordKey, next);
        members.add(member);
      }
      void indexKey;
      return 1 as TResult;
    },
    rangeByLex: async (_key, min, _max, limit) => {
      const sorted = [...members].sort();
      const start = min === '-'
        ? 0
        : sorted.findIndex(member => member > min.slice(1));
      return sorted.slice(start < 0 ? sorted.length : start, (start < 0 ? sorted.length : start) + limit);
    },
  };
  return client;
}
