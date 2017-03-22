var RefreshReminders = require("./refreshReminders");

const processReminderHandle = new RefreshReminders();

processReminderHandle.processReminders()
.then(function(result) {
  console.log(result);
  process.exit(0);
})
.catch(function(error) {
  console.error(error);
  process.exit(1);
})
