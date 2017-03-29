'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('UserMessageEvents', 'userId', {
      allowNull: false,
      type: Sequelize.INTEGER
    }).then(function() {
      return queryInterface.addColumn('UserMessageEvents', 'messageId', {
        allowNull: false,
        type: Sequelize.INTEGER
      });
    })
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('UserMessageEvents', 'userId')
    .then(function() {
      return queryInterface.removeColumn('UserMessageEvents', 'messageId');
    })
  }
};
