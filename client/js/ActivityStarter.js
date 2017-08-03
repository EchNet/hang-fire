// ActivityStarter.js - logic for selecting, creating, and initializing an activity.

define([ "ConnectionViewer", "MessageViewer", "AnnouncementEditor", "CreateInviteEditor", "ProfileVideoEditor",
  "UpdateInviteEditor", "UserNameEditor", "ReminderEditor", "CreateGreetingEditor" ],
function( ConnectionViewer,  MessageViewer, AnnouncementEditor,   CreateInviteEditor, ProfileVideoEditor,
  UpdateInviteEditor,   UserNameEditor,   ReminderEditor, CreateGreetingEditor) {

  function classForActionItem(actionItem) {
    if (actionItem.topic == "con") {
      return ConnectionViewer;
    }
    var isCreate = false;
    switch (actionItem.aspect) {
    case "cre":
      isCreate = true;
    case "upd":
      switch (actionItem.topic) {
      case "ann":
        return AnnouncementEditor;
      case "gre":
        return CreateGreetingEditor;
      case "inv":
        return isCreate ? CreateInviteEditor : UpdateInviteEditor;
      case "pro":
        return ProfileVideoEditor;
      case "rem":
        return ReminderEditor;
      case "usr":
        return UserNameEditor;
      }
      break;
    case "rec":
    case "in":
      return MessageViewer;
    }
  }

  return {
    startActivityFor: function(actionItem) {
      var ActivityClass = classForActionItem(actionItem);
      return new ActivityClass("<div>", { actionItem: actionItem })
    }
  }
});
