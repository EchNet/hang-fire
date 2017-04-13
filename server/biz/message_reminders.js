/* invitation.js */

const CONF = require("../conf");

const extend = require("extend");
const pug = require("pug");
const emailer = require("../connectors/email");
const models = require("../models/index");
const EmailProfile = models.EmailProfile;
const random = require("../util/random");
const Promise = require("promise");


// Generate the email message and send it.
// Return a promise.
function sendEmail(self) {
  var bodyFunction = pug.compileFile(self.templateName, CONF.pug);
  var body = bodyFunction(self);
    
  var emailOptions = {
    to: self.toEmail,
    subject: self.subject,
    type: self.type,
    html: body,
    fromUser: self.fromUser,
    toUser: self.toUser
  };
  if (self.senderEmail) {
    emailOptions.from = self.fromUser.name
      ? (self.fromUser.name + " <" + self.senderEmail + ">")
      : self.senderEmail; 
    emailOptions["h:ReplyTo"] = self.senderEmail;
  }

  return emailer.send(emailOptions);
}


function sendReminderEmail(reminder, req) {

  var fromUser = {"id": reminder.fromUser.id , "name": reminder.fromUser.name};
  var toUser = {"id": reminder.toUser.id , "name": reminder.toUser.name};
  var host = req.headers.host;
  var protocol = host.match(/localhost/) ? "http:" : "https:";

  // Get the sender's and receiver semail address.
  return models.EmailProfile.findByUser(fromUser)
  .then(function(emailProfiles) {
    console.log('debug in emailProfiles' + emailProfiles[0].email);
    if (emailProfiles && emailProfiles.length) {
      fromUser.email = emailProfiles[0].email;
    }
    return models.EmailProfile.findByUser(toUser)
    .then(function(emailProfiles) {
     if(emailProfiles && emailProfiles.length) {
        toUser.email = emailProfiles[0].email;
        return sendEmail({
        toUser: toUser,
        fromUser: fromUser,  
        templateName: "templates/noticeMessageReceiver.pug", 
        subject: "You have an Unviewed Message",
        type: 'receiver',
        toEmail: toUser.email,
        senderEmail: fromUser.email,
        fromUser: fromUser.name,
        url: protocol + "//" + host
      })
       .then(function(){
        return sendEmail({
        toUser: fromUser,
        fromUser: toUser,  
        templateName: "templates/noticeMessageSender.pug", 
        subject: "A Message you have sent has not been viewed",
        type: 'sender',
        toEmail: fromUser.email,
        senderEmail: toUser.email,
        fromUser: fromUser.name,
        url: protocol + "//" + host
      }); 
     }); 
    }
   });
  });


}

module.exports = {
  sendReminderEmail: sendReminderEmail
};
