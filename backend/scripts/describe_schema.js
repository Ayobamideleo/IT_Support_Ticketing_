import sequelize from '../config/db.js';

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    console.log('Listing tables...');
    const tables = await qi.showAllTables();
    console.log('Tables:', tables);

    const candidates = ['Tickets', 'tickets', 'Ticket', 'ticket'];
    for (const t of candidates) {
      try {
        console.log(`
Describing table: ${t}`);
        const desc = await qi.describeTable(t);
        console.log(JSON.stringify(desc, null, 2));
      } catch (e) {
        console.log(`Could not describe ${t}: ${e.message}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error describing schema:', err);
    process.exit(1);
  }
})();
