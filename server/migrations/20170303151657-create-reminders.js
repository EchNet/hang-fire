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
      Repeat: {
        allowNull: false,
        type: Sequelize.STRING
      },
      Expired: {
        allowNull: false,
        type: Sequelize.STRING
      },
      deliverAt: {
        allowNull: false,
        type: Sequelize.STRING
      },
      lastDeliveredAt: {
        allowNull: false,
        type: Sequelize.STRING
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
