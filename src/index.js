//-- load fixture file instead of fetching content from WS
var fileContent = require("raw!../test/fixtures/ECB_EXR1.xml");

// load lib
var sdmxmllib = require('./sdmxmllib');

// parse
var msg = sdmxmllib.mapSDMXMLResponse(fileContent);

// use to display something
var content = '';
content += '<p>' + msg.header.id + '</p>';
content += '<p>' + msg.resources.length + '</p>';
content += '<p>' + msg.resources[0].id + '</p>';
content += '<p>' + msg.resources[0].name + '</p>';
content += '<p>' + msg.resources[0].items[0].id + '</p>';

document.getElementsByTagName('body')[0].innerHTML = content;
