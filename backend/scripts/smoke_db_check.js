import sequelize from '../config/db.js';
import '../models/User.js';
import Ticket from '../models/Ticket.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');

    const ticket = await Ticket.findByPk(1, { include: ['comments', 'creator'] });
    if (!ticket) {
      console.error('No ticket with id=1 found in DB');
      process.exit(2);
    }

    // Check relations
    const hasComments = Array.isArray(ticket.comments);
    const hasCreator = !!ticket.creator;
    console.log('Ticket found:', {
      id: ticket.id,
      title: ticket.title,
      hasComments,
      hasCreator,
    });

    if (hasComments && hasCreator) {
      console.log('DB smoke check OK');
      process.exit(0);
    }

    console.error('DB smoke check failed: missing relations');
    process.exit(3);
  } catch (err) {
    console.error('DB smoke check error:', err.message || err);
    process.exit(1);
  }
})();
