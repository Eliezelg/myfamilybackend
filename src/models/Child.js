const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Child = sequelize.define('Child', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  birthDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

Child.belongsTo(User, { as: 'parent', foreignKey: 'parentId' });
User.hasMany(Child, { as: 'children', foreignKey: 'parentId' });

module.exports = Child;
