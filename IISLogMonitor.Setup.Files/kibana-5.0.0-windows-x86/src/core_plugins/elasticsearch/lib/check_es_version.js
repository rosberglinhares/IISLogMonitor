/**
 * ES and Kibana versions are locked, so Kibana should require that ES has the same version as
 * that defined in Kibana's package.json.
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _es_bool = require('./es_bool');

var _es_bool2 = _interopRequireDefault(_es_bool);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _is_es_compatible_with_kibana = require('./is_es_compatible_with_kibana');

var _is_es_compatible_with_kibana2 = _interopRequireDefault(_is_es_compatible_with_kibana);

var _setup_error = require('./setup_error');

var _setup_error2 = _interopRequireDefault(_setup_error);

module.exports = function checkEsVersion(server, kibanaVersion) {
  server.log(['plugin', 'debug'], 'Checking Elasticsearch version');

  var client = server.plugins.elasticsearch.client;

  return client.nodes.info().then(function (info) {
    // Aggregate incompatible ES nodes.
    var incompatibleNodes = [];

    // Aggregate ES nodes which should prompt a Kibana upgrade.
    var warningNodes = [];

    _lodash2['default'].forEach(info.nodes, function (esNode) {
      if (!(0, _is_es_compatible_with_kibana2['default'])(esNode.version, kibanaVersion)) {
        // Exit early to avoid collecting ES nodes with newer major versions in the `warningNodes`.
        return incompatibleNodes.push(esNode);
      }

      // It's acceptable if ES is ahead of Kibana, but we want to prompt users to upgrade Kibana
      // to match it.
      if (_semver2['default'].gt(esNode.version, kibanaVersion)) {
        warningNodes.push(esNode);
      }
    });

    function getHumanizedNodeNames(nodes) {
      return nodes.map(function (node) {
        return 'v' + node.version + ' @ ' + node.http.publish_address + ' (' + node.ip + ')';
      });
    }

    if (warningNodes.length) {
      var simplifiedNodes = warningNodes.map(function (node) {
        return {
          version: node.version,
          http: {
            publish_address: node.http.publish_address
          },
          ip: node.ip
        };
      });

      server.log(['warning'], {
        tmpl: 'You\'re running Kibana <%= kibanaVersion %> with some newer versions of ' + 'Elasticsearch. Update Kibana to the latest version to prevent compatibility issues: ' + '<%= getHumanizedNodeNames(nodes).join(", ") %>',
        kibanaVersion: kibanaVersion,
        getHumanizedNodeNames: getHumanizedNodeNames,
        nodes: simplifiedNodes
      });
    }

    if (incompatibleNodes.length) {
      var incompatibleNodeNames = getHumanizedNodeNames(incompatibleNodes);

      var errorMessage = 'This version of Kibana requires Elasticsearch v' + (kibanaVersion + ' on all nodes. I found ') + ('the following incompatible nodes in your cluster: ' + incompatibleNodeNames.join(','));

      throw new _setup_error2['default'](server, errorMessage);
    }

    return true;
  });
};
