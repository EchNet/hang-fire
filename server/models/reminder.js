'use strict';

module.exports = function(sequelize, DataTypes) {
  var Reminder;
  var models;

  function schema() {
    return {
      fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false   
      },
      toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false 
      },    
      assetId: {
        type: DataTypes.INTEGER,
        allowNull: false  
      },     
      deliverAt: { 
        type : DataTypes.STRING,
        allowNull: false  
      },
      repeat: { 
        type : DataTypes.INTEGER
      }, 
      expired: { 
        type : DataTypes.INTEGER
      },  
      lastDeliveredAt: { 
        type : DataTypes.DATE,
      },    
      timeZone: {
        type: DataTypes.STRING  
      },    
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    } 
  }

  function associate(_models) {
    models = _models;
    Reminder.belongsTo(models.User, { as: "fromUser" });
    Reminder.belongsTo(models.User, { as: "toUser" });  
    Reminder.belongsTo(models.Asset, { as: "asset" });  
  }

  function destroyAll() {
    return Reminder.destroy({ where: {} });
  }

  function findByFromUserId(userId) {
    return Reminder.findAll({
      where: { fromUserId: userId },
      include: [{
        model: models.User,
        as: "toUser",
        required: true
      },
      {
        model: models.User,
        as: "fromUser",
        required: true
      },            
      {
        model: models.Asset,
        as: "asset"  
      }]     
    })
  }

  function findByToUserId(userId) {
    return Reminder.findAll({
      where: { toUserId: userId },
      include: [{
        model: models.Users,
        as: "toUser",
        required: true
      },
      {
        model: models.Users,
        as: "fromUser",
        required: true
      },               
      {
        model: models.Assets,
        as: "asset"  
      }],    
      order: [ [ "deliverAt", "ASC" ] ]
    })
  }
    
  function findByFromUserAndToUserIds(fromUserId, toUserId) {
    return Reminder.findOne({
      where: {
        fromUserId: fromUserId,
        toUserId: toUserId
      },
    include: [{
        model: models.Users,
        as: "toUser",
        required: true
      },
      {
        model: models.Assets,
        as: "asset"  
      }],       
    })
  }
 
  function destroyWhere(where) {
    return Reminder.destroy({ where: where });
  }    
   
  function destroyById(id) {
    return destroyWhere({ id: id });
  }    

  Reminder = sequelize.define("Reminder", schema(), {
    classMethods: {
      associate: associate,
      destroyAll: destroyAll,
      findByFromUserId: findByFromUserId,
      findByToUserId: findByToUserId,  
      findByFromUserAndToUserIds: findByFromUserAndToUserIds,
      destroyById: destroyById    
    }     
  })

  return Reminder;
};
