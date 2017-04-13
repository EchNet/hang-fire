'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Messages', 'fromUserId', {
      allowNull: false,
      type: Sequelize.INTEGER
    }).then(function() {
      return queryInterface.addColumn('Messages', 'toUserId', {
        allowNull: false,
        type: Sequelize.INTEGER
      });
    }).then(function() {
      return queryInterface.addColumn('Messages', 'assetId', {
        allowNull: false,
        type: Sequelize.INTEGER
      });
    }).then(function() {
      return queryInterface.changeColumn('Messages', 'type', {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      });
    }).then(function() {
      return queryInterface.changeColumn('Messages', 'status', {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      });
    })
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Messages', 'fromUserId')
    .then(function() {
      return queryInterface.removeColumn('Messages', 'toUserId');
    }).then(function() {
      return queryInterface.removeColumn('Messages', 'assetId');
    })
  }
};
