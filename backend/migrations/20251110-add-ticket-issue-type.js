import { DataTypes } from 'sequelize';

export const up = async ({ context: qi }) => {
  const table = 'tickets';
  const desc = await qi.describeTable(table);

  if (!desc.issueType) {
    await qi.addColumn(table, 'issueType', {
      type: DataTypes.ENUM("hardware", "software", "networking", "access_control", "email", "printer", "phone", "other"),
      allowNull: true,
    });
  }
};

export const down = async ({ context: qi }) => {
  const table = 'tickets';
  const desc = await qi.describeTable(table);
  
  if (desc.issueType) {
    await qi.removeColumn(table, 'issueType');
  }
};
