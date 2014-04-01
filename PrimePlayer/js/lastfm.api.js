/**
 * This script is based on Felix Bruns' work.
 * Here just everything that is not needed for Prime Player has been removed.
 * We also use jQuery to save some code and store the session info and a sessionTimeoutCallback in the object.
 *
 * Copyright (c) 2008-2010, Felix Bruns <felixbruns@web.de>
 * @author Sven Recknagel (svenrecknagel@googlemail.com)
 */
function LastFM(options){
  /* Set default values for required options. */
  var apiKey    = options.apiKey    || '';
  var apiSecret = options.apiSecret || '';
  this.apiUrl    = options.apiUrl    || 'https://ws.audioscrobbler.com/2.0/';

  this.session = {};
  this.sessionTimeoutCallback;
  this.unavailableMessage;
  var that = this;

  /* Internal call (POST, GET). */
  var internalCall = function(params, callbacks, requestMethod){
    params.format = 'json';
    $.ajax({
      type: requestMethod,
      url: that.apiUrl,
      data: params,
      timeout: 10000
    }).done(function(response) {
      if (response.error) {
        if (typeof(callbacks.error) == "function") {
          callbacks.error(response.error, response.message);
        }
        if (response.error == 9 && typeof(that.sessionTimeoutCallback) == "function") {
          that.sessionTimeoutCallback();
        }
      } else {
        callbacks.success(response);
      }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      if (typeof(callbacks.error) == "function") {
        var msg = textStatus;
        if (jqXHR.status) msg += " " + jqXHR.status;
        if (errorThrown && errorThrown != textStatus) msg += " " + errorThrown;
        if (that.unavailableMessage) msg = that.unavailableMessage + " (" + msg + ")";
        callbacks.error(-1, msg);
      }
    });
  };

  /* Normal method call. */
	var call = function(method, params, callbacks, requestMethod){
		/* Set default values. */
		params        = params        || {};
		callbacks     = callbacks     || {};
		requestMethod = requestMethod || 'GET';

		/* Add parameters. */
		params.method  = method;
		params.api_key = apiKey;

		/* Call method. */
		internalCall(params, callbacks, requestMethod);
	};
  
  /* Signed method call. */
  var signedCall = function(method, params, callbacks, requestMethod){
    /* Set default values. */
    params        = params        || {};
    callbacks     = callbacks     || {};
    requestMethod = requestMethod || 'GET';

    /* Add parameters. */
    params.method  = method;
    params.api_key = apiKey;

    /* Add session key. */
    if(that.session.key){
      params.sk = that.session.key;
    }

    /* Get API signature. */
    params.api_sig = auth.getApiSignature(params);

    /* Call method. */
    internalCall(params, callbacks, requestMethod);
  };

  /* Auth methods. */
  this.auth = {
    getSession : function(params, callbacks){
      signedCall('auth.getSession', params, callbacks);
    }
  };

  /* Track methods. */
  this.track = {
    getInfo : function(params, callbacks){
      call('track.getInfo', params, callbacks);
    },

    love : function(params, callbacks){
      signedCall('track.love', params, callbacks, 'POST');
    },

    scrobble : function(params, callbacks){
      signedCall('track.scrobble', params, callbacks, 'POST');
    },

    unlove : function(params, callbacks){
      signedCall('track.unlove', params, callbacks, 'POST');
    },

    updateNowPlaying : function(params, callbacks){
      signedCall('track.updateNowPlaying', params, callbacks, 'POST');
    }
  };

  /* Private auth methods. */
  var auth = {
    getApiSignature : function(params){
      var keys   = [];
      var string = '';

      for(var key in params){
        keys.push(key);
      }

      keys.sort();

      for(var index in keys){
        var key = keys[index];

        string += key + params[key];
      }

      string += apiSecret;

      return hex_md5(string);
    }
  };
}
