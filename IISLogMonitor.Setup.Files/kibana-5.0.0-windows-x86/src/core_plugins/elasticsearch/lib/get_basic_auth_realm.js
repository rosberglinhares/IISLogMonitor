'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = getBasicAuthRealm;

function getBasicAuthRealm(message) {
  if (!message || typeof message !== 'string') return null;

  var parts = message.match(/Basic\ realm=\\"(.*)\\"/);
  if (parts && parts.length === 2) return parts[1];else return null;
}

;
module.exports = exports['default'];
