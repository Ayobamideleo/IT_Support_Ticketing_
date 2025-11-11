import sequelize from '../config/db.js';

(async () => {
  try {
    console.log('Running sequelize.sync({ alter: true }) to update schema...');
    await sequelize.sync({ alter: true });
    console.log('Schema sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Schema sync failed:', err);
    process.exit(1);
  }
})();
