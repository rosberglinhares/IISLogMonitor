'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _get_basic_auth_realm = require('./get_basic_auth_realm');

var _get_basic_auth_realm2 = _interopRequireDefault(_get_basic_auth_realm);

var _lodashInternalToPath = require('lodash/internal/toPath');

var _lodashInternalToPath2 = _interopRequireDefault(_lodashInternalToPath);

var _filter_headers = require('./filter_headers');

var _filter_headers2 = _interopRequireDefault(_filter_headers);

module.exports = function (server, client) {
  return function (req, endpoint) {
    var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var filteredHeaders = (0, _filter_headers2['default'])(req.headers, server.config().get('elasticsearch.requestHeadersWhitelist'));
    _lodash2['default'].set(params, 'headers', filteredHeaders);
    var path = (0, _lodashInternalToPath2['default'])(endpoint);
    var api = _lodash2['default'].get(client, path);
    var apiContext = _lodash2['default'].get(client, path.slice(0, -1));
    if (_lodash2['default'].isEmpty(apiContext)) {
      apiContext = client;
    }
    if (!api) throw new Error('callWithRequest called with an invalid endpoint: ' + endpoint);
    return api.call(apiContext, params)['catch'](function (err) {
      if (err.status === 401) {
        // TODO: The err.message is temporary until we have support for getting headers in the client.
        // Once we have that, we should be able to pass the contents of the WWW-Authenticate head to getRealm
        var realm = (0, _get_basic_auth_realm2['default'])(err.message) || 'Authorization Required';
        var options = { realm: realm };
        return _bluebird2['default'].reject(_boom2['default'].unauthorized('Unauthorized', 'Basic', options));
      }
      return _bluebird2['default'].reject(err);
    });
  };
};
