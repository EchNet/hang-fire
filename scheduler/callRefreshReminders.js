var RefreshReminders = require("./refreshReminders");

const processReminderHandle = new RefreshReminders();

processReminderHandle.processReminders()
.then(function(result) {
  console.log(result);
})
.catch(function(error) {
  console.error(error);
})
