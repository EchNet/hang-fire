// conf.js

const extend = require("extend");

const DEFAULTS = {
  pug: {
    baseDir: "templates",
    compileDebug: false,
    debug: false,
  },
  pages: {
    "livconn": {
      title: "Living Connections",
      stylesheet: "css/livconn.css",
      mainModule: "App"
    }
  },
  defaultPage: "livconn",
  server: {
    port: 4545,
    mounts: {
      "/": "./client"
    }
  },
  auth: {
    grantAdminToLocalRequest: false,
    enableExtHeaderAccess: false
  },
  clientServiceConfigurations: {
    apiService: {
      path: "ApiService",
      config: {}
    },
    facebookService: {
      path: "FacebookService",
      config: {
        appId: "1093072224140701",
        version: "v2.8"
      }
    },
    sessionManager: {
      path: "SessionManager",
      config: {
        retryTolerance: 3
      }
    },
    videoService: {
      path: "VideoService",
      config: {
        mimePriorityList: [
          "video/webm, codecs=vp9",
          "video/webm, codecs=vp8",
          "video/webm"
        ],
        timeChunk: 1000,
        bufferLimit: 100
      }
    }
  },
  videostore: {
    cloudinary: {
    }
  },
  email: {
    type: "mailgun",
    domain: "mg.livingcx.com",
    apiKey: "key-1a42bcc21a15252b0de1fc4ab0540863",
    from: "Do Not Reply <do-not-reply@mg.livingcx.com>"
  }
}

const OVERRIDES = {
  development: {
    pages: {
      "test": {
        title: "Test",
        stylesheet: "css/livconn.css",
        mainModule: "testui"
      }
    },
    auth: {
      enableExtHeaderAccess: true,
      enableAccessByUserId: true
    },
    videostore: {
      enableLocalStorage: true,
      cloudinary: {
        cloud_name: "living-connections",
        api_key: "425898524282428",
        api_secret: "7pPjCUilLoTETVKv9yRfrh-TwIo"
      }
    },
    clientServiceConfigurations: {
      sessionManager: {
        config: {
          pollingPeriod: 80000
        }
      },
      facebookService: {
        config: {
          timeoutPeriod: 1000,
          dummy: {
            name: "James Echmalian",
            email: "ech@ech.net",
            id: 100,
            picture: "https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/11209473_10153089662479492_5130115091816741964_n.jpg?oh=f2079615854fdb6ab9850a35a3e299b4&oe=58FFC615"
          }
        }
      }
    }
  },
  production: {
    server: {
      port: 4544,
    },
    email: {
      __allowedRecipients: [ "ech@ech.net", "rob777@comcast.net", "james.echmalian@gmail.com" ],
      defaultRecipient: "ech@ech.net"
    },
    videostore: {
      cloudinary: {
        cloud_name: "living-connections",
        api_key: "425898524282428",
        api_secret: "7pPjCUilLoTETVKv9yRfrh-TwIo"
      }
    }
  },
  test: {
    server: {
      port: 4546,
      mounts: {
        "/mocha": "./node_modules/grunt-blanket-mocha/node_modules/mocha",
        "/chai": "./node_modules/chai"
      }
    },
    auth: {
      enableExtHeaderAccess: true
    },
    videostore: {
      enableLocalStorage: true
    },
    email: {
      disabled: true
    }
  }
}

var env = process.env.NODE_ENV || "production";

module.exports = extend(true, { env: env }, DEFAULTS, OVERRIDES[env]);
