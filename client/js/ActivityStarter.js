// ActivityStarter.js - logic for selecting, creating, and initializing an activity.

define([ "ConnectionViewer", "MessageViewer", "AnnouncementEditor", "CreateInviteEditor", "ProfileVideoEditor",
  "UpdateInviteEditor", "UserNameEditor", "CreateReminderEditor", "CreateGreetingEditor" ],
function( ConnectionViewer,  MessageViewer, AnnouncementEditor,   CreateInviteEditor, ProfileVideoEditor,
  UpdateInviteEditor,   UserNameEditor,   CreateReminderEditor, CreateGreetingEditor) {

  function classForActionItem(actionItem) {
    if (actionItem.topic == "inv") {
      switch (actionItem.aspect) {
      case "cre":
        return CreateInviteEditor;
      case "upd":
        return UpdateInviteEditor;
      }
    }
    if (actionItem.topic == "con") {
      return ConnectionViewer;
    }
    if (actionItem.topic == "rem") {
      switch (actionItem.aspect) {
      case "cre":
        return CreateReminderEditor;
      }
    }
    if (actionItem.aspect == "rec" || actionItem.aspect == "in") {
      return MessageViewer;
    }
    switch (actionItem.topic) {
    case "ann":
      return AnnouncementEditor;
    case "gre":
      return CreateGreetingEditor;
    case "pro":
      return ProfileVideoEditor;
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
