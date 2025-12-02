import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import TicketComment from "../models/TicketComment.js";
import { sendGeneric, sendBulkGeneric, composeEmailHtml } from "../services/emailService.js";
import { Op } from "sequelize";

const formatDateTime = (value) => {
  if (!value) return "n/a";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleString();
};

const ticketDetails = (ticket) => [
  ["Title", ticket.title],
  ["Issue Type", ticket.issueType || "n/a"],
  ["Priority", ticket.priority || "n/a"],
  ["Department", ticket.department || "n/a"],
  ["SLA Category", ticket.slaCategory || "n/a"],
  ["Due", formatDateTime(ticket.dueAt)],
  ["Status", ticket.status],
];

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

      const detailRows = ticketDetails(ticket);

      if (creator?.email) {
        const creatorName = creator?.name || "there";
        const subject = `Your ticket #${ticket.id} has been created`;
        const textLines = [
          `Hi ${creatorName},`,
          "Your support ticket has been logged successfully. Our IT team will review it shortly.",
          "",
          ...detailRows.map(([label, value]) => `${label}: ${value}`),
          "",
          "WYZE IT Support Desk",
        ];
        const html = composeEmailHtml({
          title: `Ticket #${ticket.id} Created`,
          intro: [
            `Hi ${creatorName},`,
            "Your support ticket has been logged successfully. Our IT team will review it shortly.",
          ],
          details: detailRows,
          outro: ["We will notify you as soon as there is progress.", ""],
        });
        await sendGeneric(creator.email, subject, { text: textLines.join("\n"), html });
      }

      const broadcastRecipients = itAndManagers.map((u) => u.email).filter(Boolean);
      if (broadcastRecipients.length) {
        const reporter = `${creator?.name || "An employee"} (${creator?.email || "unknown"})`;
        const subject = `New Ticket #${ticket.id}: ${ticket.title}`;
        const textLines = [
          "Hello team,",
          `A new ticket has been raised by ${reporter}.`,
          "",
          ...detailRows.map(([label, value]) => `${label}: ${value}`),
          "",
          "Please log in to the WYZE IT Support dashboard to triage this request.",
        ];
        const html = composeEmailHtml({
          title: `New Ticket #${ticket.id}`,
          intro: [
            "Hello team,",
            `A new ticket has been raised by ${reporter}.`,
          ],
          details: detailRows,
          outro: ["Please log in to the WYZE IT Support dashboard to triage this request."],
        });
        await sendBulkGeneric(broadcastRecipients, subject, { text: textLines.join("\n"), html });
      }
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
      if (recipients.length) {
        const subject = `Ticket #${updated.id} status changed to ${updated.status}`;
        const detailRows = [...ticketDetails(updated), ['Updated At', formatDateTime(new Date())]];
        if (updated.closedAt) {
          detailRows.push(['Closed At', formatDateTime(updated.closedAt)]);
        }
        const textLines = [
          'Hello,',
          `Ticket #${updated.id} is now ${updated.status}.`,
          '',
          ...detailRows.map(([label, value]) => `${label}: ${value}`),
          '',
          'Visit the WYZE IT Support dashboard for full history.',
        ];
        const html = composeEmailHtml({
          title: `Ticket #${updated.id} Updated`,
          intro: [
            'Hello,',
            `Ticket #${updated.id} is now ${updated.status}.`,
          ],
          details: detailRows,
          outro: ['Visit the WYZE IT Support dashboard for full history.'],
        });
        await sendBulkGeneric(recipients, subject, { text: textLines.join('\n'), html });
      }
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
      if (recipients.length) {
        const subject = `Ticket #${updated.id} priority updated to ${updated.priority}`;
        const detailRows = [...ticketDetails(updated)];
        const textLines = [
          'Hello,',
          `Ticket #${updated.id} priority is now ${updated.priority}.`,
          '',
          ...detailRows.map(([label, value]) => `${label}: ${value}`),
          '',
          'Please adjust your response plan if needed.',
        ];
        const html = composeEmailHtml({
          title: `Ticket #${updated.id} Priority Updated`,
          intro: [
            'Hello,',
            `Ticket #${updated.id} priority is now ${updated.priority}.`,
          ],
          details: detailRows,
          outro: ['Please adjust your response plan if needed.'],
        });
        await sendBulkGeneric(recipients, subject, { text: textLines.join('\n'), html });
      }
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
      if (recipients.length) {
        const assigneeName = updatedTicket?.assignee?.name || 'IT Staff';
        const subject = `Ticket #${updatedTicket.id} assigned to ${assigneeName}`;
        const detailRows = [...ticketDetails(updatedTicket), ['Assigned To', assigneeName]];
        const textLines = [
          'Hello,',
          `Ticket #${updatedTicket.id} has been assigned to ${assigneeName}.`,
          '',
          ...detailRows.map(([label, value]) => `${label}: ${value}`),
          '',
          'Please review the ticket in the WYZE IT Support dashboard.',
        ];
        const html = composeEmailHtml({
          title: `Ticket #${updatedTicket.id} Assigned`,
          intro: [
            'Hello,',
            `Ticket #${updatedTicket.id} has been assigned to ${assigneeName}.`,
          ],
          details: detailRows,
          outro: ['Please review the ticket in the WYZE IT Support dashboard.'],
        });
        await sendBulkGeneric(recipients, subject, { text: textLines.join('\n'), html });
      }
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

    if (req.user?.role === 'employee' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for this ticket' });
    }
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
