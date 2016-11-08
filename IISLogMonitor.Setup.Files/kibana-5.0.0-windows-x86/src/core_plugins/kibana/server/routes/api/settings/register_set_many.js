'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = registerSet;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

function registerSet(server) {
  server.route({
    path: '/api/kibana/settings',
    method: 'POST',
    handler: function handler(req, reply) {
      var key = req.params.key;
      var changes = req.payload.changes;

      var uiSettings = server.uiSettings();
      uiSettings.setMany(changes).then(function () {
        return uiSettings.getUserProvided().then(function (settings) {
          return reply({ settings: settings }).type('application/json');
        });
      })['catch'](function (reason) {
        return reply(_boom2['default'].wrap(reason));
      });
    }
  });
}

module.exports = exports['default'];
