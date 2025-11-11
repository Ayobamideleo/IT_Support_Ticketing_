import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  const table = 'users';
  const desc = await qi.describeTable(table);
  if (!desc.isVerified) {
    await qi.addColumn(table, 'isVerified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
  }
  if (!desc.verificationCode) {
    await qi.addColumn(table, 'verificationCode', { type: DataTypes.STRING, allowNull: true });
  }
  if (!desc.verificationExpires) {
    await qi.addColumn(table, 'verificationExpires', { type: DataTypes.DATE, allowNull: true });
  }
};

export const down = async ({ context: qi }) => {
  const table = 'users';
  const desc = await qi.describeTable(table);
  if (desc.verificationExpires) await qi.removeColumn(table, 'verificationExpires');
  if (desc.verificationCode) await qi.removeColumn(table, 'verificationCode');
  if (desc.isVerified) await qi.removeColumn(table, 'isVerified');
};
