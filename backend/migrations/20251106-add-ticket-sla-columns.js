import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  // Adds columns if they don't exist (queryInterface.addColumn is idempotent in the sense
  // it will throw if column exists — the runner here guards by checking describeTable first)
  const table = 'tickets';
  const desc = await qi.describeTable(table);

  if (!desc.slaCategory) {
    await qi.addColumn(table, 'slaCategory', { type: DataTypes.STRING, allowNull: true });
  }
  if (!desc.dueAt) {
    await qi.addColumn(table, 'dueAt', { type: DataTypes.DATE, allowNull: true });
  }
  if (!desc.closedAt) {
    await qi.addColumn(table, 'closedAt', { type: DataTypes.DATE, allowNull: true });
  }
  if (!desc.department) {
    await qi.addColumn(table, 'department', { type: DataTypes.STRING, allowNull: true });
  }
  if (!desc.costEstimate) {
    await qi.addColumn(table, 'costEstimate', { type: DataTypes.DECIMAL(10,2), allowNull: true });
  }
};

export const down = async ({ context: qi }) => {
  const table = 'tickets';
  const desc = await qi.describeTable(table);
  if (desc.costEstimate) await qi.removeColumn(table, 'costEstimate');
  if (desc.department) await qi.removeColumn(table, 'department');
  if (desc.closedAt) await qi.removeColumn(table, 'closedAt');
  if (desc.dueAt) await qi.removeColumn(table, 'dueAt');
  if (desc.slaCategory) await qi.removeColumn(table, 'slaCategory');
};
