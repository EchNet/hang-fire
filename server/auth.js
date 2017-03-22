/* auth.js - Authentication middleware */

// Here is where sessions, users, and email profiles are managed.

const CONFIG = require("./conf");
const models = require("./models/index");
const Ticket = models.EmailSessionSeed;
const Promise = require("promise");
const exec = require("./util/exec");

// Look up a session given its external ID, maybe from a cookie.
function findSession(externalId) {
  return models.Session.findByExternalId(externalId);
}

// Look up a ticket, given an email address.
function findTicket(eseed) {
  if (CONFIG.env == "development") {
    // Development backdoor.
    if (eseed.match(/u_\d+/)) {
      return Promise.resolve({ userId: eseed.substring(2) });
    }
  }
  return Ticket.findByExternalId(eseed, { current: 1, deep: 1 });
}

// Look up an email profile, given a email address.
function findEmailProfile(email) {
  return models.EmailProfile.findByEmail(email, { deep: 1 });
}

// Find user by ID
function findUser(userId) {
  return models.User.findById(userId, { includeEmail: true, includeFacebook: true });
}

// Create a new user.
function createNewUser(name) {
  return models.User.builder().name(name).build();
}

// Create email profile.
function createEmailProfile(user, email) {
  return models.EmailProfile.builder().email(email).user(user).build();
}

// If there is no user having the given email address, create both new User and
// new EmailProfile records.
function findOrCreateUserByEmail(email) {
  return findEmailProfile(email)
  .then(function(emailProfile) {
    if (emailProfile && emailProfile.user) {
      return emailProfile.user;
    }
    return createNewUser("")
    .then(function(user) {
      return (emailProfile
        ? emailProfile.updateAttributes({ userId: user.id })
        : createEmailProfile(user, email))
      .then(function() {
        return user;
      });
    })
  })
}

// Does the request originate from the local host?
function isLocalRequest(req) {
  switch (req.headers["x-forwarded-for"] || req.connection.remoteAddress) {
  case "127.0.0.1":
  case "::1":
    return true;
  }
  return false;
}

// Transmit session ID to client.
function sendSessionCookie(res, sessionId) {
  res.cookie("s", sessionId, {
    maxAge: 2147483647,
    path: "/",
  });
}

// If the user is logged in, log out.
function logOut(request) {
  if (request.session) {
    models.Session.destroyById(request.session.id);
  }
  request.session = null;
  request.user = null;
}

//
// Class AuthMgr - a manager of user/session state.
//
function AuthMgr(req, res) {
  // Express thingies.
  this.req = req;
  this.res = res;
}

function setUser(self, user) {
  self.req.user = user;
  self.req.isAdmin = user.level <= 0;
}

function setSession(self, session) {
  self.req.session = session;
  setUser(self, session.user);
}

function extHeaderAccessEnabled(self) {
  return CONFIG.auth.enableExtHeaderAccess && self.req.headers["x-access-key"] === CONFIG.adminKey;
}

function extHeaderLogin(self) {
  var effectiveUserId = self.req.headers["x-effective-user"];
  if (effectiveUserId) {
    return models.User.findById(effectiveUserId)
    .then(function(user) {
      setUser(self, user || {
        id: parseInt(effectiveUserId),
        name: "Test",
        level: 1
      });
      //console.log("Assumed identity of user for testing:", effectiveUserId);
    })
  }
  else {
    self.req.isAdmin = true;
    //console.log("Admin access for testing");
  }
}

// If the request includes session identification, fetch the session and user objects.
function AuthMgr_establishSessionAndUser(self) {
  // Sessions are persisted via cookie.
  var sessionCookie = self.req.cookies && self.req.cookies.s;

  return (sessionCookie ? findSession(sessionCookie) : Promise.resolve())
  .then(function(session) {
    if (session) {
      setSession(self, session);
    }
    else if (extHeaderAccessEnabled(self)) {
      return extHeaderLogin(self);
    }
    else if (CONFIG.auth.grantAdminToLocalRequest && isLocalRequest(self.req)) {
      self.req.isAdmin = true;
      console.log("Grant admin access to local connection");
    }
    return null;   // avoid dangling promise warnings
  });
}

// Follow up with a ticket just used to log in...
function closeTicket(ticket, toUser) {
  // If this ticket is part of an invitation, deliver the invitation.
  return models.Invite.findByTicketId(ticket.id).then(function(invite) {
    if (invite && invite.state == 0) {
      return invite.updateAttributes({
        state: 1,
        toUserId: toUser.id 
      });
    }
  });
}

// Create a new session and send its ID to the client as a cookie.
function AuthMgr_logIn(self, user) {
  // Create a session.
  return models.Session.builder().user(user).build()
  .then(function(session) {
    setSession(self, session);
    sendSessionCookie(self.res, session.externalId);
    return session;
  });
}

// A user has clicked on an invitation/ticket email.
function AuthMgr_resolveTicket(self, eseed) {
  return findTicket(eseed)
  .then(function(emailSessionSeed) {
    if (emailSessionSeed) {
      logOut(self.req);
      return (
        // Find the user by ID or by the given email address, or create one.
        ("userId" in emailSessionSeed)
          ? findUser(emailSessionSeed.userId)
          : findOrCreateUserByEmail(emailSessionSeed.email)
      )
      // Log in.
      .then(function(user) {
        return AuthMgr_logIn(self, user);
      })
      .then(function(session) {
        return closeTicket(emailSessionSeed, session.user);
      });
    }
    return null;   // avoid dangling promise warnings
  })
}

// I want to identify myself through Facebook.
function AuthMgr_handleFacebookLogin(self, facebookId, otherFacebookInfo) {
  return models.FacebookProfile.upsert({
    facebookId: facebookId,
    name: otherFacebookInfo.name,
    email: otherFacebookInfo.email,
    picture: otherFacebookInfo.picture
  })
  .then(function() {
    return models.FacebookProfile.findByFacebookId(facebookId);
  })
  .then(function(facebookProfile) {
    var currentUser = self.req.session && self.req.session.user;

    // Is there a user associated with this profile?
    if (facebookProfile.userId != null) {
      // If so, and it matches the already logged-in user, carry on.
      if (!currentUser || facebookProfile.userId != currentUser.id) {
        // Otherwise, start a new session with the user identified by the profile.
        return findUser(facebookProfile.userId)
        .then(function(user) {
          return AuthMgr_logIn(self, user);
        });
      }
    }
    else {
      // This is a new profile.  If there is a user logged in...
      if (currentUser) {
        // If the user already has a facebook profile, log them out.
        if (currentUser.facebookProfile) {
          logOut(self.req);
          currentUser = null;
        }
        // Otherwise, associate the new profile with the current user.
        else {
          return facebookProfile.updateAttributes({
            userId: currentUser.id
          });
        }
      }
      // Create a new user with the given profile and log them in.
      return createNewUser(facebookProfile.name || facebookProfile.email || "")
      .then(function(user) {
        currentUser = user;
        return facebookProfile.updateAttributes({
          userId: user.id
        })
      })
      .then(function() {
        return AuthMgr_logIn(self, currentUser);
      });
    }
    return null;   // avoid dangling promise warnings
  });
}

AuthMgr.prototype = {
  establishSessionAndUser: function() {
    return AuthMgr_establishSessionAndUser(this);
  },
  resolveEmailSessionSeed: function(eseed) {
    return AuthMgr_resolveTicket(this, eseed);
  },
  handleFacebookLogin: function(facebookId, otherFacebookInfo) {
    return AuthMgr_handleFacebookLogin(this, facebookId, otherFacebookInfo);
  }
}

module.exports = AuthMgr;
