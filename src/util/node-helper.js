global.sdmxmllib = require('../../src/sdmxmllib').sdmxmllib;
var jsdom = require('jsdom');
var fs = require('fs');
var chai = require('chai');
global.should = chai.should();


global.readXMLFixture = function (filename, callback) {
  var file = fs.readFileSync('./test/' + filename, 'utf8');

  jsdom.env({
    parsingMode: 'xml',
    html: file,
    done: function (err, window) {
      callback(window.document);
    }
  });
};
