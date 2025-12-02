import TicketComment from "../models/TicketComment.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { sendBulkGeneric, composeEmailHtml } from "../services/emailService.js";

export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Comment body is required' });

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user?.role === 'employee' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for this ticket' });
    }

    const comment = await TicketComment.create({ ticketId: id, userId: req.user.id, body });

    // Notify creator and assignee about the new comment
    try {
      const [author, fullTicket] = await Promise.all([
        User.findByPk(req.user.id, { attributes: ['id','name','email','role'] }),
        Ticket.findByPk(id, {
          include: [
            { association: 'creator', attributes: ['id','name','email','role'] },
            { association: 'assignee', attributes: ['id','name','email','role'] },
          ],
        }),
      ]);
      const recipients = [fullTicket?.creator?.email, fullTicket?.assignee?.email].filter(Boolean);
      const subj = `New comment on Ticket #${fullTicket.id}: ${fullTicket.title}`;
      const excerpt = body.length > 180 ? body.slice(0, 177) + '...' : body;
      const detailRows = [
        ['Ticket', `#${fullTicket.id} — ${fullTicket.title}`],
        ['Author', author?.name || 'Someone'],
        ['Comment', excerpt],
      ];
      const textLines = [
        'Hello,',
        `A new comment was added to ticket #${fullTicket.id}.`,
        '',
        ...detailRows.map(([label, value]) => `${label}: ${value}`),
        '',
        'Reply from the WYZE IT Support dashboard to keep the conversation going.',
      ];
      const html = composeEmailHtml({
        title: `New Comment on Ticket #${fullTicket.id}`,
        intro: [
          'Hello,',
          `A new comment was added to ticket #${fullTicket.id}.`,
        ],
        details: detailRows,
        outro: ['Reply from the WYZE IT Support dashboard to keep the conversation going.'],
      });
      await sendBulkGeneric(recipients, subj, { text: textLines.join('\n'), html });
    } catch (notifyErr) {
      console.warn('[notify] addComment notification failed:', notifyErr?.message || notifyErr);
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Add comment error:', error);
    if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Unexpected server error' });
    return res.status(500).json({ message: 'Unexpected server error', error: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (req.user?.role === 'employee' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for this ticket' });
    }

    const comments = await TicketComment.findAll({ where: { ticketId: id }, include: ['author'], order:[['createdAt','ASC']] });
    res.status(200).json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Unexpected server error' });
    return res.status(500).json({ message: 'Unexpected server error', error: error.message });
  }
};
