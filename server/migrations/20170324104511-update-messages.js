'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Messages', 'state', {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER
    })
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Messages', 'state');
  }
};
