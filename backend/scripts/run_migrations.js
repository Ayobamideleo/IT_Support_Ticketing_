import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/db.js';
import path from 'path';
import { pathToFileURL } from 'url';

(async () => {
  try {
    // Diagnostic: print migrations directory and entries to help debug glob issues
    const migrationsDir = path.join(process.cwd(), 'migrations');
    console.log('migrationsDir:', migrationsDir);
    try {
      const fs = await import('fs/promises');
      const entries = await fs.readdir(migrationsDir);
      console.log('migrations directory entries:', entries);
    } catch (err) {
      console.warn('Could not read migrations directory:', err.message || err);
    }
    // Build a POSIX-style glob pattern so the glob matcher works consistently
    // on Windows (convert backslashes to forward slashes).
    const globPattern = `${process.cwd().split(path.sep).join('/')}/migrations/*.js`;
    console.log('Using migrations glob pattern:', globPattern);

    const umzug = new Umzug({
      // Use an ESM-friendly resolver so Umzug can dynamically import migration files
      // in projects that use "type: module" (ESM). The default resolver may use
      // require() which doesn't work with ESM modules.
      migrations: {
        glob: globPattern,
        resolve: ({ name, path: migrationPath, context }) => {
          return {
            name,
            up: async () => {
              const migration = await import(pathToFileURL(migrationPath).href);
              return migration.up({ context });
            },
            down: async () => {
              const migration = await import(pathToFileURL(migrationPath).href);
              return migration.down({ context });
            },
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    console.log('Inspecting migrations...');
    const executedBefore = await umzug.executed();
    const pendingBefore = await umzug.pending();
    console.log('Already executed migrations:', executedBefore.map(m => m.name));
    console.log('Pending migrations:', pendingBefore.map(m => m.name));

    console.log('Running pending migrations...');
    const executed = await umzug.up();
    console.log('Migrations executed in this run:', executed.map(m => m.name));
    const executedAfter = await umzug.executed();
    const pendingAfter = await umzug.pending();
    console.log('Executed migrations (now):', executedAfter.map(m => m.name));
    console.log('Pending migrations (now):', pendingAfter.map(m => m.name));
    console.log('Migration run complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration runner failed:', err);
    process.exit(1);
  }
})();
