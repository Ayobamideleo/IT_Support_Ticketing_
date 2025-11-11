import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

(async () => {
  try {
    console.log('Starting idempotent migration: add Ticket SLA columns if missing.');
    const qi = sequelize.getQueryInterface();

    // ensure models are loaded so table names and associations are available
    await import('../models/User.js');
    await import('../models/Ticket.js');
    await import('../models/TicketComment.js');

    const tableName = 'tickets';
    const describe = await qi.describeTable(tableName);

    const columnsToAdd = [
      { name: 'slaCategory', type: DataTypes.STRING },
      { name: 'dueAt', type: DataTypes.DATE },
      { name: 'closedAt', type: DataTypes.DATE },
      { name: 'department', type: DataTypes.STRING },
      { name: 'costEstimate', type: DataTypes.DECIMAL(10,2) },
    ];

    for (const col of columnsToAdd) {
      if (describe[col.name]) {
        console.log(`Column ${col.name} already exists on ${tableName}, skipping.`);
        continue;
      }
      console.log(`Adding column ${col.name} to ${tableName}...`);
      await qi.addColumn(tableName, col.name, { type: col.type, allowNull: true });
      console.log(`Added ${col.name}`);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
