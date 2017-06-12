/* biz/messages.js */

const CONF = require("../conf");

const Promise = require("promise");
const models = require("../models/index");
const Asset = models.Asset;
const Message = models.Message;
const User = models.User;
const EmailProfile = models.EmailProfile;
const emailer = require("../connectors/email");
const pug = require("pug");

module.exports = (function() {

  function isPersonalType(type) {
    switch (type) {
    case Message.GREETING_TYPE:
    case Message.INVITE_TYPE:
      return true;
    default:
      return false;
    }
  }

  var gotMailFunction = pug.compileFile("templates/gotmail.pug", CONF.pug);

  // Generate the email message and send it.
  // Return a promise.
  function sendGotMail(fromUser, toUser) {
    return EmailProfile.findByUser(toUser)
    .then(function(emailProfiles) {
      if (emailProfiles.length) {
        var toEmailProfile = emailProfiles[0];
        return emailer.send({
          from: "Do not reply <do-not-reply@livingcx.com>",
          to: toEmailProfile.email,
          subject: "You have a new videogram",
          html: gotMailFunction({
            toUser: toUser,
            fromUser: fromUser,
            url: "http://livingcx.com/"
          })
        });
      }
    }).then(function() {
    }).catch(function(e) {
      console.error(e);
    });
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
        if (isPersonalType(fields.type)) {
          sendGotMail(fromUser, toUser);
        }

        resolve({
          asset: asset,
          toUser: toUser,
          message: message
        });

        return null; // quiet warning
      }).catch(function(error) {
        reject(error);
      });
    });
  }

  return {
    createMessage: createMessage
  }
})();
