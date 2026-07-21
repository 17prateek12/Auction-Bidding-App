export const runMigration = async () => {
  console.log('PostgreSQL is active as the sole primary database.');
};

if (require.main === module) {
  runMigration();
}
