// http.js

define([ "jquery" ], function($) {

  var GET = "GET";
  var POST = "POST";
  var PUT = "PUT";
  var DELETE = "DELETE";

  var CONTENT_TYPE_HDR = "Content-type";
  var FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";

  ////////////// HttpMethod

  function HttpMethod(state) {
    $.extend(this, state);
    this.params = {};
  }

  function buildQuery(self) {
    var queryString = "";
    var query = self.query;
    for (var i = 0; i < query.length; ++i) {
      var q = query[i];
      var pval = q.value || self.params[q.key];
      if (pval != null) {
        if (queryString) queryString += "&";
        queryString += q.lhs;
        if (pval !== true) {
          queryString += "=" + encodeURIComponent(String(pval));
        }
      }
    }
    return queryString;
  }

  function getUrl(self) {
    var uri = self.baseUrl;
    var path = self.path;
    for (var i = 0; i < path.length; ++i) {
      var comp = path[i];
      if (comp.value) {
        var comps = comp.value.split("/");
        for (var j = 0; j < comps.length; ++j) {
          if (!uri.endsWith("/")) {
            uri += "/";
          }
          uri += comps[j];
        }
      }
      else {
        var pval = self.params[comp.key];
        if (!uri.endsWith("/")) {
          uri += "/";
        }
        uri += encodeURIComponent(String(pval));
      }
    }
    if (self.method === GET) {
      var query = buildQuery(self);
      if (query) {
        uri += "?" + query;
      }
    }
    return uri;
  }

  function getBody(self) {
    if (self.body) {
      return self.body;
    }
    if (self.contentType == FORM_CONTENT_TYPE) {
      return buildQuery(self);
    }
  }

  function executeHttpMethod(self) {
    var promise = $.Deferred();
    var req = new XMLHttpRequest();
    req.addEventListener("load", function() {
      if (req.status === 200) {
        promise.resolve(JSON.parse(req.responseText));
      }
      else {
        promise.reject(new Error("status " + req.status));
      }
    });
    req.addEventListener("error", function(e) {
      promise.reject(e);
    });
    req.open(self.method, self.getUrl());
    if (self.contentType) {
      req.setRequestHeader(CONTENT_TYPE_HDR, self.contentType);
    }
    try {
      req.send(self.getBody());
    }
    catch (e) {
      promise.reject(e);
    }
    return promise;
  }

  HttpMethod.prototype = {
    getUrl: function() {
      return getUrl(this);
    },
    setBody: function(body) {
      this.body = body;
      return this;
    },
    getBody: function() {
      return getBody(this);
    },
    execute: function() {
      return executeHttpMethod(this);
    }
  }

  ////////////// HttpMethodBuilder

  function HttpMethodBuilder(method) {
    this.method = method;
    this.baseUrl = "/";
    this.path = [];
    this.query = [];
    this.setters = {};
  }

  function setterFunc(key) {
    return function(value) {
      this.params[key] = value;
      return this;
    }
  }

  function addSetter(builder, key) {
    var funcName = "set" + key.charAt(0).toUpperCase() + key.substring(1);
    builder.setters[funcName] = setterFunc(key);
  }

  function buildHttpMethod(builder) {
    // Snapshot builder state.
    var builderState = {
      method: builder.method,
      baseUrl: builder.baseUrl,
      path: builder.path.slice(),
      query: builder.query.slice(),
      contentType: builder.contentType
    }
    // Generate the constructor.
    var classFunc = function() {
      $.extend(this, builderState);
      this.params = {};
    }
    classFunc.prototype = $.extend({}, HttpMethod.prototype, builder.setters);
    return classFunc;
  }

  HttpMethodBuilder.prototype = {
    setBaseUrl: function(baseUrl) {
      this.baseUrl = baseUrl;
      return this;
    },
    addPathComponent: function(value) {
      this.path.push({ value: value });
      return this;
    },
    addPathParameter: function(key) {
      this.path.push({ key: key });
      addSetter(this, key);
      return this;
    },
    addQueryPair: function(lhs, value) {
      this.query.push({ lhs: lhs, value: value });
      return this;
    },
    addQueryParameter: function(lhs, key) {
      this.query.push({ lhs: lhs, key: key || lhs });
      addSetter(this, key || lhs);
      return this;
    },
    build: function() {
      return buildHttpMethod(this);
    }
  }

  HttpMethod.Get = function() {
    HttpMethodBuilder.call(this, GET);
  };
  HttpMethod.Get.prototype = HttpMethodBuilder.prototype;

  HttpMethod.Post = HttpMethod.PostForm = function() {
    HttpMethodBuilder.call(this, POST);
    this.contentType = FORM_CONTENT_TYPE;
  };
  HttpMethod.PostForm.prototype = HttpMethodBuilder.prototype;

  HttpMethod.PostBinary = function(contentType) {
    HttpMethodBuilder.call(this, POST);
    this.contentType = contentType;
  };
  HttpMethod.PostBinary.prototype = HttpMethodBuilder.prototype;

  HttpMethod.PutForm = function() {
    HttpMethodBuilder.call(this, PUT);
    this.contentType = FORM_CONTENT_TYPE;
  };
  HttpMethod.PutForm.prototype = HttpMethodBuilder.prototype;

  HttpMethod.DeleteForm = function() {
    HttpMethodBuilder.call(this, DELETE);
  };
  HttpMethod.DeleteForm.prototype = HttpMethodBuilder.prototype;

  return HttpMethod;
});
