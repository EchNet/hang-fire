/* biz/messages.js */

module.exports = (function() {
  const Promise = require("promise");
  const models = require("../models/index");
  const Asset = models.Asset;
  const Message = models.Message;
  const User = models.User;

  function isPersonalType(type) {
    switch (type) {
    case Message.GREETING_TYPE:
    case Message.INVITE_TYPE:
      return true;
    default:
      return false;
    }
  }
  
  function createMessage(fromUser, fields) {
    return new Promise(function(resolve, reject) {

      var asset;
      var toUser;
      var message;

      // Other than announcement requires toUserId.
      if ((fields.toUserId == null) == isPersonalType(fields.type)) {
        throw { body: { toUserId: fields.toUserId || "?" }};
      }

      switch (fields.type) {
      case Message.ANNOUNCEMENT_TO_ALL_TYPE:
      case Message.ANNOUNCEMENT_TO_NEW_TYPE:
        // Announcement requires admin sender.
        if (fromUser.level > 0) {
          throw { status: 401 };
        }
        // Announcement requires start and end date.
        if (!fields.startDate) {
          fields.startDate = new Date();
        }
        if (!fields.endDate) {
          fields.endDate = new Date(fields.startDate.getTime() + 30*24*60*60*1000);
        }
      }
      

      // Validate asset.
      Asset.findById(fields.assetId).then(function(_asset) {
        //if (!_asset) {      // for another time
          //throw { body: { assetId: fields.assetId } }
        //}
        asset = _asset;

        // Validate toUser.
        return User.findById(fields.toUserId);
      }).then(function(_toUser) {
        if (!_toUser) {
          throw { body: { toUserId: fields.toUserId } }
        }
        toUser = _toUser;

        // Create message; include sender in fields.
        fields.fromUserId = fromUser.id;
        return Message.create(fields);
      }).then(function(message) {
        resolve({
          asset: asset,
          toUser: toUser,
          message: message
        });
      }).catch(function(error) {
        reject(error);
      });
    });
  }

  return {
    createMessage: createMessage
  }
})();
