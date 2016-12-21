/* index.js */

const CONFIG = require("./conf");

// Create server.
var express = require("express");
var server = express();

// Mount static asset directories.
for (var mkey in CONFIG.server.mounts) {
  server.use(mkey, express.static(CONFIG.server.mounts[mkey]));
}

// Add POST body parsers.
var bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: '1mb' }));
server.use(bodyParser.urlencoded({
  limit: '1mb',
  extended: true
}));
server.use(bodyParser.raw({
  inflate: true,
  limit: "10mb",
  type: "video/*"
}));

// Add cookie parser.
var cookieParser = require("cookie-parser");
server.use(cookieParser());

// Error reporting.
function jsonError(err) {
  var self = this;
  console.error(err);
  self.status(err.status || 500);
  self.json(err.body || {});
}
function jsonResultOf(promise) {
  var self = this;
  promise.then(function(model) {
    self.json(model);
  }).catch(function(err) {
    self.jsonError(err);
  });
}
server.use(function(req, res, next) {
  res.jsonError = jsonError;
  res.jsonResultOf = jsonResultOf;
  next();
});

// Add middleware.
server.use(require("./auth").resolveSessionAndUser);

// Index page.
var pug = require("pug");
server.get("/", function(request, response) {
  // Recompile every time, because why not?
  var pageFunction = pug.compileFile("templates/page.pug", CONFIG.pug);
  response.set("Content-Type", "text/html");
  response.send(pageFunction(CONFIG.pages.livconn));
});

// Routers.
server.use("/users", require("./routers/users"));
server.use("/sessions", require("./routers/sessions"));
server.use("/assets", require("./routers/assets"));
server.use("/messages", require("./routers/messages"));
server.use("/emailprofiles", require("./routers/emailprofiles"));
server.use("/announcements", require("./routers/announcements"));
server.use("/a", require("./routers/alpha"));
server.use("/o", require("./routers/omega"));
server.use("/admin", require("./routers/admin"));
server.use("/videos", require("./routers/videos"));

var port = process.env.PORT || CONFIG.server.port;
server.set("port", port);
server.listen(port, function () {
  console.log("Listening on port", port);
});
