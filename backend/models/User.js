import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("employee", "it_staff", "manager"), defaultValue: "employee" },
  // email verification
  isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verificationCode: { type: DataTypes.STRING, allowNull: true },
  verificationExpires: { type: DataTypes.DATE, allowNull: true },
  // user management extensions
  department: { type: DataTypes.STRING, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true }, // user ID who created this account
});

export default User;
