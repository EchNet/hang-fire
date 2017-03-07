/* index.js */

const pug = require("pug");
const CONFIG = require("./conf");
const AuthMgr = require("./auth");

// Create server.
var express = require("express");
var server = express();

// Mount static asset directories.
for (var mkey in CONFIG.server.mounts) {
  server.use(mkey, express.static(CONFIG.server.mounts[mkey]));
}

// Add POST body parsers.
var bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: '100kb' }));
server.use(bodyParser.urlencoded({
  limit: '100kb',
  extended: true
}));
server.use(bodyParser.raw({
  inflate: true,
  limit: "10mb",
  type: "video/*"
}));

// Add middleware.
server.use(require("cookie-parser")());
server.use(require("./jsonish"));
server.use(function(req, res, next) {
  new AuthMgr(req, res).establishSessionAndUser()
  .then(function() {
    next();
    return null;
  })
  .catch(function(err) {
    next(err);
    return null;
  });
});

// One page template serves all.
function servePage(pageConfig, response) {
  // Recompile every time, because why not?
  var pageFunction = pug.compileFile("templates/page.pug", CONFIG.pug);
  response.set("Content-Type", "text/html");
  response.send(pageFunction(pageConfig));
}

// Index page.
server.get("/", function(req, res) {
  if (req.query && req.query.e) {
    new AuthMgr(req, res).resolveEmailSessionSeed(req.query.e)
    .then(function() {
      // Strip away the session seed.
      return res.redirect("/");
    })
    .catch(function(err) {
      console.error(err);
      return res.redirect("/");
    });
  }
  else {
    servePage(CONFIG.pages.livconn, res);
  }
});

// Client configuration JS.
server.get("/js/services.js", function(req, res) {
  res.set("Content-Type", "application/javascript");
  res.send(compileClientServiceConfiguration());
});

function compileClientServiceConfiguration() {

  function clist(func) {
    var csc = CONFIG.clientServiceConfigurations;
    var array = [];
    for (var key in csc) {
      array.push(func(key, csc[key]));
    }
    return array.join(",");
  }

  return "" +
    "define([" +
    clist(function(k, v) { return '"' + v.path + '"'; }) +
    "], function(" +
    clist(function(k, v) { return k }) +
    "){ return { " +
    clist(function(k, v) { return k + ": new " + k + "(" + JSON.stringify(v.config) + ")"; }) + 
    "} });";
}

// For testing
if (CONFIG.env == "development") {
  server.get("/test", function(request, response) {
    servePage(CONFIG.pages.test, response);
  });
}

// Routers.
server.use("/", require("./routers/alpha"));
server.use("/api", require("./api"));
server.use("/admin", require("./routers/admin"));
server.use("/assets", require("./routers/assets"));
server.use("/createReminder", require("./routers/createReminder"));
server.use("/getAllReminderMessages", require("./routers/getAllReminderMessages"));

function setAdminKey() {
  const random = require("./util/random");
  const fs = require('fs');
  var adminKey = random.id();
  CONFIG.adminKey = adminKey;
  console.log(adminKey);
  if (!fs.existsSync("tmp")) {
    fs.mkdirSync("tmp", 0744);
  }
  fs.writeFileSync("tmp/adminKey", adminKey);
}

var port = process.env.PORT || CONFIG.server.port;
server.set("port", port);
server.listen(port, function () {
  setAdminKey();
  console.log("Server running in", CONFIG.env, "mode");
  console.log("Listening on port", port);
});
