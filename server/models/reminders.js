'use strict';

module.exports = function(sequelize, DataTypes) {
  var Reminders;
  var models;

  function schema() {
    return {
      fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false   
      },
     toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false, 
      },    
      status: DataTypes.INTEGER,
     assetId: {
        type: DataTypes.INTEGER,
        allowNull: false  
      },     
     status: {
        type: DataTypes.STRING,
        defaultValue: 0 
      },    
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deliverAt: { 
        type : DataTypes.STRING,
      },
      Repeat: { 
        type : DataTypes.STRING,
      }, 
      Expired: { 
        type : DataTypes.STRING,
      },  
      lastDeliveredAt: { 
        type : DataTypes.STRING,
      },    
      timeZone: {
        type: DataTypes.STRING  
      }    
    } 
  }

  function associate(_models) {
    models = _models;
    Reminders.belongsTo(models.User, { as: "fromUser" });
    Reminders.belongsTo(models.User, { as: "toUser" });  
    Reminders.belongsTo(models.Asset, {as: "asset"});  
  }

   
  

  function destroyAll() {
    return Reminders.destroy({ where: {} });
  }

  function destroyByUserAndPeerIds(fromUserId, toUserId) {
    return Reminders.destroy({
      where: {
        fromUserId: fromUserId,
        toUserId: toUserId
      },
    })
  }

  function findByFromUserId(userId) {
    return Reminders.findAll({
      where: { fromUserId: userId },
      include: [{
        model: models.User,
        as: "fromUser",
        required: true
      }],
      include: [{
        model: models.Users,
        as: "toUser",
        required: true
      },
      {
        model: models.Assets,
        as: "asset"  
      }],     
      order: [ [ "status", "deliverAt" ] ]
    })
  }

  function findByToUserId(userId) {
    return Reminders.findAll({
      where: { toUserId: userId },
      include: [{
        model: models.Users,
        as: "toUser",
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
    return Reminders.findOne({
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
    return Reminders.destroy({ where: where });
  }    
   
function destroyById(id) {
    return destroyWhere({ id: id });
  }    

  Reminders = sequelize.define("Reminders", schema(), {
    classMethods: {
      associate: associate,
      destroyAll: destroyAll,
      destroyByUserAndPeerIds: destroyByUserAndPeerIds,
      findByFromUserId: findByFromUserId,
      findByToUserId: findByToUserId,  
      findByFromUserAndToUserIds: findByFromUserAndToUserIds,
      destroyById: destroyById    
    }     
  })

  return Reminders;
};
