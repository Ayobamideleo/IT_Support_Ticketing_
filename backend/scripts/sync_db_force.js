import sequelize from '../config/db.js';
// import models so Sequelize is aware of them before syncing
import '../models/User.js';
import '../models/Ticket.js';
import '../models/TicketComment.js';

(async () => {
  try {
    console.log('Running sequelize.sync({ force: true }) — this will DROP and recreate tables.');
    await sequelize.sync({ force: true });
    console.log('Force sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Force sync failed:', err);
    process.exit(1);
  }
})();
