const targetEnvironment =
  process.env.DURABLE_OPERATION_ENVIRONMENT?.trim() || 'unknown';

function readEndpoint(name, protocols) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (!protocols.includes(endpoint.protocol)) {
    throw new Error(`${name} must use one of: ${protocols.join(', ')}`);
  }
  if (!endpoint.hostname) {
    throw new Error(`${name} must include a hostname.`);
  }
  return endpoint;
}

try {
  const redis = readEndpoint('REDIS_URL', ['redis:', 'rediss:']);
  const postgresName = process.env.DATABASE_URL?.trim()
    ? 'DATABASE_URL'
    : 'POSTGRES_URL';
  if (!process.env.DATABASE_URL?.trim() && !process.env.POSTGRES_URL?.trim()) {
    throw new Error('DATABASE_URL (or POSTGRES_URL) is required.');
  }
  const postgres = readEndpoint(postgresName, ['postgres:', 'postgresql:']);
  if (targetEnvironment === 'production' && redis.protocol !== 'rediss:') {
    throw new Error('production REDIS_URL must use rediss://.');
  }

  console.log(
    JSON.stringify({
      status: 'ok',
      environment: targetEnvironment,
      redisProtocol: redis.protocol,
      redisHost: redis.hostname,
      postgresVariable: postgresName,
      postgresProtocol: postgres.protocol,
      postgresHost: postgres.hostname,
    })
  );
} catch (error) {
  console.error(
    `Durable-operation environment preflight failed: ${
      error instanceof Error ? error.message : 'invalid endpoint configuration'
    }`
  );
  process.exitCode = 2;
}
