'use strict';

var filename = require('path').basename(__filename);
var fn = require('../' + filename);

var _ = require('lodash');
var expect = require('chai').expect;

describe(filename, function () {
  it('exports a function', function () {
    expect(fn).to.be.a('function');
  });

  it('returns an object with keys named for the javascript files in the directory', function () {
    var fnList = fn('series_functions');

    expect(fnList).to.be.an('object');
    expect(fnList.sum).to.be.a('object');
  });

  it('also includes index.js files in direct subdirectories, and names the keys for the directory', function () {
    var fnList = fn('series_functions');

    expect(fnList).to.be.an('object');
    expect(fnList.es).to.be.a('object');
  });
});
