const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  patriarchName: {
    type: DataTypes.STRING
  },
  matriarchName: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  foundingDate: {
    type: DataTypes.DATE
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

// Table de liaison pour les membres de la famille
const FamilyMember = sequelize.define('FamilyMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    references: {
      model: 'Families',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  relationship: {
    type: DataTypes.STRING,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Table pour les codes d'invitation
const FamilyInvite = sequelize.define('FamilyInvite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  familyId: {
    type: DataTypes.UUID,
    references: {
      model: 'Families',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING,
    unique: true
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  expiresAt: {
    type: DataTypes.DATE
  }
});

// Relations
Family.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Family.belongsToMany(User, { through: FamilyMember, as: 'members' });
User.belongsToMany(Family, { through: FamilyMember, as: 'families' });

Family.hasMany(FamilyInvite);
FamilyInvite.belongsTo(Family);
FamilyInvite.belongsTo(User, { as: 'inviteCreator', foreignKey: 'createdBy' });

module.exports = { Family, FamilyMember, FamilyInvite };
