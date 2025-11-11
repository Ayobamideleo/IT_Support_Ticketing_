import express from "express";
import {
  createTicket,
  getAllTickets,
  getMyTickets,
  updateTicketStatus,
  deleteTicket,
  updateTicketPriority,
  assignTicket, // ✅ added
  getTicketById,
  getSLABreaches,
  getStats,
} from "../controllers/ticketController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { addComment, getComments } from "../controllers/commentController.js";

const router = express.Router();

// Validation Schemas
const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(["low", "medium", "high"]).optional(),
  issueType: z.enum(["hardware", "software", "networking", "access_control", "email", "printer", "phone", "other"]).optional(),
  slaCategory: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  department: z.string().optional().nullable(),
});
const updateStatusSchema = z.object({ status: z.enum(["open","assigned","in_progress","resolved","closed"]) });
const updatePrioritySchema = z.object({ priority: z.enum(["low","medium","high"]) });
const assignSchema = z.object({ assignedTo: z.union([z.number(), z.string().regex(/^\d+$/)]) });
const addCommentSchema = z.object({ body: z.string().min(1) });

// Employees, IT staff, and managers can create tickets
router.post("/", verifyToken, allowRoles("employee", "it_staff", "manager"), validate(createTicketSchema), createTicket);

// Employees, IT staff, and managers can view their own tickets
router.get("/my", verifyToken, allowRoles("employee", "it_staff", "manager"), getMyTickets);

// IT staff and managers can view all tickets
router.get("/", verifyToken, allowRoles("it_staff", "manager"), getAllTickets);

// manager & it: stats
router.get('/stats', verifyToken, allowRoles('it_staff','manager'), getStats);

// SLA breaches
router.get('/sla/breaches', verifyToken, allowRoles('it_staff','manager'), getSLABreaches);

// ✅ IT staff and managers can assign tickets
router.put("/:id/assign", verifyToken, allowRoles("it_staff", "manager"), validate(assignSchema), assignTicket);

// ✅ IT staff and managers can update ticket status
router.put("/:id/status", verifyToken, allowRoles("it_staff", "manager"), validate(updateStatusSchema), updateTicketStatus);

// ✅ IT staff and managers can update ticket priority
router.put("/:id/priority", verifyToken, allowRoles("it_staff", "manager"), validate(updatePrioritySchema), updateTicketPriority);

// GET ticket by id (with comments)
router.get('/:id', verifyToken, allowRoles('employee','it_staff','manager'), getTicketById);

// Comments routes
router.get('/:id/comments', verifyToken, allowRoles('employee','it_staff','manager'), getComments);
router.post('/:id/comments', verifyToken, allowRoles('employee','it_staff','manager'), validate(addCommentSchema), addComment);

// Only managers can delete tickets
router.delete("/:id", verifyToken, allowRoles("manager"), deleteTicket);

export default router;
