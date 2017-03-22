// ActivityStarter.js - logic for selecting, creating, and initializing an activity.

define([ "ConnectionViewer", "MessageViewer", "AnnouncementEditor", "CreateInviteEditor",
  "UpdateInviteEditor", "ProfileEditor", "UserNameEditor", "InviteViewer", "CreateReminderEditor" ],
function( ConnectionViewer,  MessageViewer,  AnnouncementEditor,   CreateInviteEditor,
  UpdateInviteEditor, ProfileEditor,   UserNameEditor,   InviteViewer, CreateReminderEditor) {

  function classForActionItem(actionItem) {
    if (actionItem.topic == "con") {
      return ConnectionViewer;
    }
    if (actionItem.topic == "inv") {
      switch (actionItem.aspect) {
      case "cre":
        return CreateInviteEditor;
      case "upd":
        return UpdateInviteEditor;
      case "rec":
        return InviteViewer;
      }
    }
    if (actionItem.topic == "rem") {
      switch (actionItem.aspect) {
      case "cre":
        return CreateReminderEditor;
      }
    }
    if (actionItem.aspect == "rec") {
      return MessageViewer;
    }
    switch (actionItem.topic) {
    case "ann":
      return AnnouncementEditor;
    case "pro":
      return ProfileEditor;
    case "usr":
      return UserNameEditor;
    }
  }

  return {
    startActivityFor: function(actionItem) {
      var ActivityClass = classForActionItem(actionItem);
      return new ActivityClass("<div>", { actionItem: actionItem })
    }
  }
});
