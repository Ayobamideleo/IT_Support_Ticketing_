import TicketComment from "../models/TicketComment.js";
import Ticket from "../models/Ticket.js";

export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Comment body is required' });

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const comment = await TicketComment.create({ ticketId: id, userId: req.user.id, body });
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
    const comments = await TicketComment.findAll({ where: { ticketId: id }, include: ['author'], order:[['createdAt','ASC']] });
    res.status(200).json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Unexpected server error' });
    return res.status(500).json({ message: 'Unexpected server error', error: error.message });
  }
};
