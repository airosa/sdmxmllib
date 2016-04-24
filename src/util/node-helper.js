global.sdmxmllib = require('../../src/sdmxmllib').sdmxmllib;
var fs = require('fs');
var chai = require('chai');
global.should = chai.should();
global.DOMParser = require('xmldom').DOMParser;

global.readXMLFixture = function (filename, callback) {
  var file = fs.readFileSync('./test/' + filename, 'utf8');
  callback(file);
};
