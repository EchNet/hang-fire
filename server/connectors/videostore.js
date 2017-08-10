/* connectors/videostore.js */

const CONFIG = require("../conf");
const Promise = require("promise");
const cloudinary = require ('cloudinary');
const tmp = require("tmp");
const fs = require("fs");
const random = require("../util/random");

cloudinary.config(CONFIG.videostore.cloudinary);

// Write buffer to file descriptor and close the fd.  Return promise.
function writeAndClose(fd, buffer) {
  return new Promise(function(resolve, reject) {
    fs.write(fd, buffer, 0, buffer.length, 0, function(err, written) {
      console.log("saveVideo: written", written);
      fs.closeSync(fd);
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

// Upload file to cloudinary.  Return promise.
function uploadToCloudinary(path) {
  return new Promise(function(resolve, reject) {
    function checkResult(result) {
      console.log("saveVideo: result from cloudinary", result); 
      if (result && result.public_id) {
        resolve({
          key: result.public_id,
          url: result.secure_url,
          storageSystemId: 1
        });
      }
      else {
        reject(result);
      }
    }
    cloudinary.uploader.upload(path, checkResult, { resource_type: "video" });
  });
}

// Rename a file.  Return promise.
function renameFile(oldPath, newPath) {
  return new Promise(function(resolve, reject) {
    fs.rename(oldPath, newPath, function(err) {
      if (err) reject(); else resolve();
    })
  });
}

// Save to local file.
function saveLocal(path) {
  return new Promise(function(resolve, reject) {
    var key = random.id();
    var uri = "/tmp/" + key + ".webm";
    fs.rename(path, "./client" + uri, function(err) {
      if (err) {
        reject(err);
      }
      else {
        resolve({
          key: key,
          url: uri,
          storageSystemId: 0
        })
      }
    })
  })
}

// Save video file.  Return promise.
function saveToStorageSystem(path) {
  return new Promise(function(resolve, reject) {
    uploadToCloudinary(path)
    .then(resolve)
    .catch(function(err) {
      if (CONFIG.videostore.enableLocalStorage) {
        resolve(saveLocal(path))
      }
      else {
        reject(err);
      }
    });
  });
}

// Save video data to temporary file, then copy to storage system.
function saveVideo(buffer) {
  console.log("saveVideo", typeof buffer, buffer.length);
  return new Promise(function(resolve, reject) {
    tmp.file(function(err, path, fd, cleanupCallback) {
      if (err) {
        reject(err);
      }
      else {
        console.log("saveVideo: temp file", path, fd);
        writeAndClose(fd, buffer)
        .then(function() {
          return saveToStorageSystem(path);
        })
        .then(function(result) {
          if (result.storageSystemId != 0) {
            cleanupCallback();
          }
          resolve(result);
        })
        .catch(function (err) {
          cleanupCallback();
          reject(err);
        })
      }
    });
  });
}

module.exports = {
  saveVideo: saveVideo
}
