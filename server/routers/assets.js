/* assets.js */

const Asset = require("../models/index").Asset;
const videoStoreConnector = require("../connectors/videostore");

var router = require("express").Router();

function createAsset(creatorId, mime, key, url) {
  return Asset.create({
    creatorId: creatorId,
    mime: mime,
    key: key,
    url: url
  })
}

// Create
router.post("/", function(req, res) {
  if (!req.user) {
    res.jsonError({ status: 401 });
  }
  var mime = req.get("Content-Type");
  if (!mime.startsWith("video/")) {
    res.jsonError({ status: 503, mime: mime });
  }
  return res.jsonResultOf(
    videoStoreConnector.saveVideo(req.body).then(function(info) {
      return createAsset(req.user.id, mime, info.key, info.url);
    })
  )
});

// Retrieve (by id)
router.get("/:id", function(req, res) {
  if (!req.isAdmin) {
    res.jsonError({ status: 401 });
  }
  else {
    res.jsonResultOf(Asset.findById(req.params.id));
  }
});

// Delete all.
router.delete("/", function(req, res) {
  if (!req.isAdmin) {
    res.jsonError({ status: 401 });
  }
  else {
    res.jsonResultOf(Asset.destroy({ where: {} }));
  }
});

// Delete one.
router.delete("/:id", function(req, res) {
  if (!req.isAdmin) {
    res.jsonError({ status: 401 });
  }
  else {
    res.jsonResultOf(Asset.destroyById(req.params.id));
  }
});

module.exports = router;
