export default ({ env }) => {
  const filename = env('DATABASE_FILENAME', ':memory:');
  const rawClient = env('DATABASE_CLIENT', 'sqlite');
  const client = ['sqlite3', 'better-sqlite3'].includes(rawClient) ? 'sqlite' : rawClient;

  return {
    connection: {
      client,
      connection: {
        filename,
      },
      useNullAsDefault: true,
    },
  };
};
