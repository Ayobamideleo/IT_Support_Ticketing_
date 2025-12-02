import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  const table = 'Users';
  const desc = await qi.describeTable(table);

  if (!desc.mustChangePassword) {
    await qi.addColumn(table, 'mustChangePassword', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
};

export const down = async ({ context: qi }) => {
  const table = 'Users';
  const desc = await qi.describeTable(table);

  if (desc.mustChangePassword) {
    await qi.removeColumn(table, 'mustChangePassword');
  }
};
