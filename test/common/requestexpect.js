const expect = require("chai").expect;
const request = require("request");
const fs = require("fs");

const SERVER_URL = "http://localhost:4546";

const rootKey = fs.readFileSync("tmp/adminKey");

function expector(response, body) {

  return {

    expectStatusCode: function(expectedStatusCode) {
      if (expectedStatusCode == 200 && response.statusCode != 200) {
        console.log(body);
      }
      expect(response.statusCode).to.equal(expectedStatusCode);
      return this;
    },

    expectResponseHeader: function(name, value) {
      expect(response.headers[name]).to.equal(value);
    },

    expectRedirect: function(expectedLocation) {
      expect(response.statusCode).to.equal(302);
      expect(response.headers["location"]).to.equal(expectedLocation);
      return this;
    },

    expectBody: function(expectedBody) {
      expect(body).to.equal(expectedBody);
      return this;
    },

    getJson: function() {
      var obj = JSON.parse(body);
      expect(obj).to.exist;
      return obj;
    },

    getSetCookie: function(name) {
      expect(response.headers["set-cookie"]).to.exist;
      expect(response.headers["set-cookie"].length).to.equal(1);
      var cookie = response.headers["set-cookie"][0];
      var m = cookie.match(/^s=([^;]+);/);
      expect(m).to.exist;
      return m[1];
    }
  }
}

function makeRequest(method, uri) {

  if (uri === undefined) {
    uri = method;
    method = "GET";
  }

  var params = {
    method: method,
    url: SERVER_URL + uri,
    headers: {},
    followRedirect: false
  }

  var data;
  var contentType;

  return {

    asRoot: function() {
      params.headers["X-Access-Key"] = rootKey;
      delete params.headers["X-Effective-User"];
      return this;
    },

    asUser: function(userId) {
      params.headers["X-Access-Key"] = rootKey;
      params.headers["X-Effective-User"] = userId;
      return this;
    },

    withData: function(_data) {
      data = _data;
      return this;
    },

    withCookie: function(name, value) {
      params.headers["Cookie"] = name + "=" + value;
      return this;
    },

    withContentType: function(_contentType) {
      contentType = _contentType;
      return this;
    },

    go: function() {
      return new Promise(function(resolve, reject) {
        if (contentType) {
          params.headers["Content-Type"] = contentType;
          params.body = data;
        }
        else if (data) {
          params.form = data;
        }
        request(params, function(error, response, body) {
          if (error) {
            reject(error);
          }
          else {
            resolve(expector(response, body));
          }
        })
      })
    },

    getJson: function() {
      return this.go().then(function(expector) {
        expector.expectStatusCode(200);
        return expector.getJson();
      });
    }
  }
}

module.exports = {
  makeRequest: makeRequest
}
