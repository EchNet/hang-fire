'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Reminders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.INTEGER
      },
      timeZone: {
        allowNull: false,
        type: Sequelize.STRING
      },
      repeat: {
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      expired: {
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      deliverAt: {
        allowNull: false,
        type: Sequelize.STRING
      },
      lastDeliveredAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      fromUserId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      toUserId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      assetId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      } 
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Reminders');
  }
};
