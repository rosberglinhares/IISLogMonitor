'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = setupSettings;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _lodash = require('lodash');

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

function setupSettings(kbnServer, server, config) {
  var status = kbnServer.status.create('ui settings');

  if (!config.get('uiSettings.enabled')) {
    status.disabled('uiSettings.enabled config is set to `false`');
    return;
  }

  var uiSettings = {
    // returns a Promise for the value of the requested setting
    get: get,
    // returns a Promise for a hash of setting key/value pairs
    getAll: getAll,
    // .set(key, value), returns a Promise for persisting the new value to ES
    set: set,
    // takes a key/value hash, returns a Promise for persisting the new values to ES
    setMany: setMany,
    // returns a Promise for removing the provided key from user-specific settings
    remove: remove,
    // takes an array, returns a Promise for removing every provided key from user-specific settings
    removeMany: removeMany,

    // returns a Promise for the default settings, follows metadata format (see ./defaults)
    getDefaults: getDefaults,
    // returns a Promise for user-specific settings stored in ES, follows metadata format
    getUserProvided: getUserProvided,
    // returns a Promise merging results of getDefaults & getUserProvided, follows metadata format
    getRaw: getRaw
  };

  server.decorate('server', 'uiSettings', function () {
    return uiSettings;
  });
  kbnServer.ready().then(mirrorEsStatus);

  function get(key) {
    return getAll().then(function (all) {
      return all[key];
    });
  }

  function getAll() {
    return getRaw().then(function (raw) {
      return Object.keys(raw).reduce(function (all, key) {
        var item = raw[key];
        var hasUserValue = ('userValue' in item);
        all[key] = hasUserValue ? item.userValue : item.value;
        return all;
      }, {});
    });
  }

  function getRaw() {
    return Promise.all([getDefaults(), getUserProvided()]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var defaults = _ref2[0];
      var user = _ref2[1];
      return (0, _lodash.defaultsDeep)(user, defaults);
    });
  }

  function getDefaults() {
    return Promise.resolve((0, _defaults2['default'])());
  }

  function userSettingsNotFound(kibanaVersion) {
    status.red('Could not find user-provided settings for Kibana ' + kibanaVersion);
    return {};
  }

  function getUserProvided() {
    var client = server.plugins.elasticsearch.client;

    var clientSettings = getClientSettings(config);
    return client.get(_extends({}, clientSettings)).then(function (res) {
      return res._source;
    })['catch']((0, _lodash.partial)(userSettingsNotFound, clientSettings.id)).then(function (user) {
      return hydrateUserSettings(user);
    });
  }

  function setMany(changes) {
    var client = server.plugins.elasticsearch.client;

    var clientSettings = getClientSettings(config);
    return client.update(_extends({}, clientSettings, {
      body: { doc: changes }
    })).then(function () {
      return {};
    });
  }

  function set(key, value) {
    return setMany(_defineProperty({}, key, value));
  }

  function remove(key) {
    return set(key, null);
  }

  function removeMany(keys) {
    var changes = {};
    keys.forEach(function (key) {
      changes[key] = null;
    });
    return setMany(changes);
  }

  function mirrorEsStatus() {
    var esStatus = kbnServer.status.getForPluginId('elasticsearch');

    if (!esStatus) {
      status.red('UI Settings requires the elasticsearch plugin');
      return;
    }

    copyStatus();
    esStatus.on('change', copyStatus);

    function copyStatus() {
      var state = esStatus.state;

      var statusMessage = state === 'green' ? 'Ready' : 'Elasticsearch plugin is ' + state;
      status[state](statusMessage);
    }
  }
}

function hydrateUserSettings(user) {
  return Object.keys(user).reduce(expand, {});
  function expand(expanded, key) {
    var userValue = user[key];
    if (userValue !== null) {
      expanded[key] = { userValue: userValue };
    }
    return expanded;
  }
}

function getClientSettings(config) {
  var index = config.get('kibana.index');
  var id = config.get('pkg.version');
  var type = 'config';
  return { index: index, type: type, id: id };
}
module.exports = exports['default'];
