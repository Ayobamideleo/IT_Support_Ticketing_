import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  const table = 'Users';
  const desc = await qi.describeTable(table);
  
  if (!desc.department) {
    await qi.addColumn(table, 'department', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!desc.lastLoginAt) {
    await qi.addColumn(table, 'lastLoginAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!desc.createdBy) {
    await qi.addColumn(table, 'createdBy', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
};

export const down = async ({ context: qi }) => {
  const table = 'Users';
  const desc = await qi.describeTable(table);
  
  if (desc.createdBy) await qi.removeColumn(table, 'createdBy');
  if (desc.lastLoginAt) await qi.removeColumn(table, 'lastLoginAt');
  if (desc.department) await qi.removeColumn(table, 'department');
};
