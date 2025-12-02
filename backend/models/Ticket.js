import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import TicketComment from "./TicketComment.js";

const Ticket = sequelize.define("Ticket", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM("open", "assigned", "in_progress", "resolved", "closed"),
    defaultValue: "open",
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high"),
    defaultValue: "medium", // default priority for new tickets
  },
  issueType: {
    type: DataTypes.ENUM("hardware", "software", "networking", "access_control", "email", "printer", "phone", "other"),
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true, // ticket may or may not be assigned yet
  },
  // SLA and lifecycle fields
  slaCategory: { type: DataTypes.STRING, allowNull: true },
  dueAt: { type: DataTypes.DATE, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  costEstimate: { type: DataTypes.DECIMAL(10,2), allowNull: true },
});

// Relationships
User.hasMany(Ticket, {
  foreignKey: { name: "userId", allowNull: true },
  as: "createdTickets",
  onDelete: "SET NULL",
  hooks: true,
});
Ticket.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: true },
  as: "creator",
  onDelete: "SET NULL",
});

Ticket.belongsTo(User, {
  foreignKey: { name: "assignedTo", allowNull: true },
  as: "assignee",
  onDelete: "SET NULL",
}); // IT staff or manager assigned to handle it

// Comments
Ticket.hasMany(TicketComment, { foreignKey: "ticketId", as: "comments" });

export default Ticket;
