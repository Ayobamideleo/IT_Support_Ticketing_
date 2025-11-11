import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const TicketComment = sequelize.define("TicketComment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
});

TicketComment.belongsTo(User, { foreignKey: "userId", as: "author" });

export default TicketComment;
