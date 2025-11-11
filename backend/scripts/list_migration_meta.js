import sequelize from '../config/db.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB — listing SequelizeMeta (migration) table rows...');
    const [results] = await sequelize.query('SELECT * FROM `SequelizeMeta`');
    console.log('SequelizeMeta rows:', results);
    process.exit(0);
  } catch (err) {
    console.error('Failed to read SequelizeMeta table (it may not exist yet):', err.message || err);
    process.exit(1);
  }
})();
