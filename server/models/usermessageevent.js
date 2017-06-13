'use strict';
module.exports = function(sequelize, DataTypes) {
  const extend = require("extend");

  const RECEIVE = "receive";
  const VIEW = "view";

  var UserMessageEvent;

  function schema() {
    return {
      type: DataTypes.STRING,
      clientTime: DataTypes.DATE,
    }
  }
  
  function associate(models) {
    UserMessageEvent.belongsTo(models.User, { as: "user" });
    UserMessageEvent.belongsTo(models.Message, { as: "message" });
  }

  function builder() {
    var values = {};
    return {
      userId: function(userId) {
        values.userId = userId;
        return this;
      },
      messageId: function(messageId) {
        values.messageId = messageId;
        return this;
      },
      type: function(type) {
        values.type = type;
        return this;
      },
      clientTime: function(clientTime) {
        values.clientTime = clientTime;
        return this;
      },
      build: function() {
        return UserMessageEvent.create(values);
      }
    }
  }

  function anyUserMessageView(userId, messageId) {
    return UserMessageEvent.findOne({
      where: {
        "type": VIEW,
        "userId": userId,
        "messageId": messageId
      }
    });
  }

  function destroyAll() {
    return UserMessageEvent.destroy({});
  }

  UserMessageEvent = sequelize.define('UserMessageEvent', schema(), {
    classMethods: {
      associate: associate,
      builder: builder,
      destroyAll: destroyAll,
      anyUserMessageView: anyUserMessageView
    }
  });

  UserMessageEvent.RECEIVE = RECEIVE;
  UserMessageEvent.VIEW = VIEW;

  return UserMessageEvent;
};
