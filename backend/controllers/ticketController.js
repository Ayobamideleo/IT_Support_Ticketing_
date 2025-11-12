import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import TicketComment from "../models/TicketComment.js";
import { sendGeneric, sendBulkGeneric } from "../services/emailService.js";
import { Op } from "sequelize";

// ✅ CREATE TICKET (Employees, IT Staff, Managers)
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority, issueType, slaCategory, dueAt, department } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium",
      issueType: issueType || null,
      userId: req.user.id,
      slaCategory: slaCategory || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      department: department || null,
    });

    // Notify: creator, all IT Staff, and Managers
    try {
      const creator = await User.findByPk(req.user.id);
      const itAndManagers = await User.findAll({
        where: { role: { [Op.in]: ["it_staff", "manager"] } },
        attributes: ["email", "name", "role"],
      });

      const subject = `New Ticket #${ticket.id}: ${ticket.title}`;
      const baseBody = [
        `A new ticket has been raised by ${creator?.name || "an employee"} (${creator?.email || "unknown"}).`,
        `Title: ${ticket.title}`,
        `Issue Type: ${ticket.issueType || "n/a"}`,
        `Priority: ${ticket.priority}`,
        `Department: ${ticket.department || "n/a"}`,
        `Status: ${ticket.status}`,
      ].join("\n");

      // Send to creator
      if (creator?.email) {
        await sendGeneric(
          creator.email,
          `Your ticket #${ticket.id} has been created`,
          [
            `Hi ${creator.name},`,
            `Your ticket has been created successfully and our IT Staff will review it shortly.`,
            `\n${baseBody}`,
          ].join("\n")
        );
      }

      // Send to IT Staff and Managers (broadcast)
      const broadcastRecipients = itAndManagers.map((u) => u.email).filter(Boolean);
      await sendBulkGeneric(
        broadcastRecipients,
        subject,
        [
          `Hello IT Staff/Managers,`,
          baseBody,
          `\nPlease take appropriate action.`,
        ].join("\n")
      );
    } catch (notifyErr) {
      console.warn('[notify] createTicket notification failed:', notifyErr?.message || notifyErr);
    }

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ GET ALL TICKETS (IT Staff & Managers)
export const getAllTickets = async (req, res) => {
  try {
    // Pagination & Filters
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100); // safety cap
    const offset = (page - 1) * limit;

    const { status, priority, issueType, department, q } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (issueType) where.issueType = issueType;
    if (department) where.department = department;
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    console.log('[DEBUG] getAllTickets query:', req.query, 'constructed where:', where);

    const { rows, count } = await Ticket.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
        { model: TicketComment, as: "comments", limit: 3 },
      ],
    });

    const totalPages = Math.ceil(count / limit) || 1;
    console.log('[DEBUG] getAllTickets result count:', count, 'page:', page, 'limit:', limit);
    return res.status(200).json({ page, totalPages, total: count, pageSize: limit, results: rows });
  } catch (error) {
    console.error('Get all tickets error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ GET TICKETS FOR LOGGED-IN USER (Employees)
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { userId: req.user.id },
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
        { model: TicketComment, as: "comments", limit: 5 },
      ],
    });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ UPDATE TICKET STATUS (IT Staff & Managers)
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["open", "assigned", "in_progress", "resolved", "closed"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid or missing status value" });
    }

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
    // if resolved/closed set closedAt
    if (status === 'resolved' || status === 'closed') {
      ticket.closedAt = new Date();
    }
    await ticket.save();

    // Notify creator and assignee
    try {
      const updated = await Ticket.findByPk(id, {
        include: [
          { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
          { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
        ],
      });
      const recipients = [updated?.creator?.email, updated?.assignee?.email].filter(Boolean);
      const subj = `Ticket #${updated.id} status changed to ${updated.status}`;
      const body = [
        `Ticket: ${updated.title}`,
        `New Status: ${updated.status}`,
        updated.dueAt ? `Due: ${new Date(updated.dueAt).toLocaleString()}` : null,
      ].filter(Boolean).join("\n");
      await sendBulkGeneric(recipients, subj, body);
    } catch (notifyErr) {
      console.warn('[notify] updateTicketStatus notification failed:', notifyErr?.message || notifyErr);
    }

    res.status(200).json({ message: "Ticket status updated", ticket });
  } catch (error) {
    console.error('Update ticket status error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ UPDATE TICKET PRIORITY (IT Staff & Managers)
export const updateTicketPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const allowedPriorities = ["low", "medium", "high"];
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    ticket.priority = priority;
    await ticket.save();

    // Notify creator and assignee
    try {
      const updated = await Ticket.findByPk(id, {
        include: [
          { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
          { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
        ],
      });
      const recipients = [updated?.creator?.email, updated?.assignee?.email].filter(Boolean);
      const subj = `Ticket #${updated.id} priority updated to ${updated.priority}`;
      const body = [`Ticket: ${updated.title}`, `New Priority: ${updated.priority}`].join("\n");
      await sendBulkGeneric(recipients, subj, body);
    } catch (notifyErr) {
      console.warn('[notify] updateTicketPriority notification failed:', notifyErr?.message || notifyErr);
    }

    res.status(200).json({ message: "Ticket priority updated", ticket });
  } catch (error) {
    console.error('Update ticket priority error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ ASSIGN TICKET (IT Staff & Managers)
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // validate input
    if (assignedTo === undefined || assignedTo === null) {
      return res.status(400).json({ message: "assignedTo is required" });
    }

    const assignedToInt = parseInt(assignedTo, 10);
    if (isNaN(assignedToInt)) {
      return res.status(400).json({ message: "assignedTo must be a number" });
    }

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // ensure assignee exists
  const assignee = await User.findByPk(assignedToInt);
  if (!assignee) return res.status(404).json({ message: "Assignee not found" });

  ticket.assignedTo = assignedToInt;
  ticket.status = "assigned";
    await ticket.save();

    // Fetch updated ticket with creator and assignee info
    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
      ],
    });

    // Notify creator and new assignee
    try {
      const recipients = [updatedTicket?.creator?.email, updatedTicket?.assignee?.email].filter(Boolean);
      const subj = `Ticket #${updatedTicket.id} assigned to ${updatedTicket?.assignee?.name || 'IT Staff'}`;
      const body = [
        `Ticket: ${updatedTicket.title}`,
        `Assigned To: ${updatedTicket?.assignee?.name || 'IT Staff'}`,
        `Status: ${updatedTicket.status}`,
      ].join("\n");
      await sendBulkGeneric(recipients, subj, body);
    } catch (notifyErr) {
      console.warn('[notify] assignTicket notification failed:', notifyErr?.message || notifyErr);
    }

    res.status(200).json({ message: "Ticket assigned successfully", ticket: updatedTicket });
  } catch (error) {
    console.error('Assign ticket error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// GET single ticket with comments and relations
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] },
        { model: TicketComment, as: "comments", include: [{ model: User, as: 'author', attributes: ['id','name'] }] },
      ],
    });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Get ticket by id error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// GET SLA breaches
export const getSLABreaches = async (req, res) => {
  try {
    const now = new Date();
    const breaches = await Ticket.findAll({
      where: {
        dueAt: { [Op.lt]: now },
        status: { [Op.notIn]: ['resolved', 'closed'] },
      },
      include: [ { model: User, as: 'creator', attributes: ['id','name'] }, { model: User, as: 'assignee', attributes: ['id','name'] } ],
    });
    res.status(200).json(breaches);
  } catch (error) {
    console.error('Get SLA breaches error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// GET simple stats for manager dashboard
export const getStats = async (req, res) => {
  try {
    const total = await Ticket.count();
    const open = await Ticket.count({ where: { status: 'open' } });
    const inProgress = await Ticket.count({ where: { status: 'in_progress' } });
    const resolved = await Ticket.count({ where: { status: 'resolved' } });
    const closed = await Ticket.count({ where: { status: 'closed' } });

    // Department aggregation
    const deptAgg = await Ticket.findAll({
      attributes: [
        'department',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      group: ['department']
    });

    // avg resolution time (hours)
    const resolvedTickets = await Ticket.findAll({ where: { status: 'resolved', closedAt: { [Op.ne]: null } } });
    let avgHours = 0;
    if (resolvedTickets.length > 0) {
      const totalMs = resolvedTickets.reduce((acc, t) => acc + (new Date(t.closedAt) - new Date(t.createdAt)), 0);
      avgHours = Math.round((totalMs / resolvedTickets.length) / (1000 * 60 * 60));
    }

    const ticketsByDepartment = deptAgg.map(row => ({
      department: row.get('department') || 'Unknown',
      count: parseInt(row.get('count')) || 0,
    }));

    res.status(200).json({ total, open, inProgress, resolved, closed, avgResolutionHours: avgHours, ticketsByDepartment });
  } catch (error) {
    console.error('Get stats error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};

// ✅ DELETE TICKET (Managers)
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await ticket.destroy();
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error('Delete ticket error:', error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Unexpected server error, please try again later' });
    }
    return res.status(500).json({ message: 'Unexpected server error, please try again later', error: error.message });
  }
};
