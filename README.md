# sdmxmllib

[![Build Status](https://travis-ci.org/airosa/sdmxmllib.svg?branch=master)](https://travis-ci.org/airosa/sdmxmllib)
[![current version](https://img.shields.io/npm/v/sdmxmllib.svg)](https://www.npmjs.com/package/sdmxmllib)
[![License](https://img.shields.io/npm/l/sdmxmllib.svg)](http://spdx.org/licenses/MIT)

Experimental Javascript client library for mapping SDMX-ML 2.1 structure messages.

This library contains functions for mapping SDMX-ML 2.1 structure messages to
Javascript objects. Library is used for prototyping the SDMX-JSON Structure
message and supports a limited number of structures (with more to come):

- Codelist
- Concept Scheme
- Agency Scheme
- Dataflow
- Category Scheme
- Categorisation
- Hierarchical Codelist (partial: no levels)

See the [XML mapping sample](http://airosa.github.io/sdmxmllib/samples/sdmxmlmap/)
for a live demo.


## Usage ##

Either include the library on a web page or require in Node.js.

## Mapping ##

### mapSDMXMLResponse

Maps SDMX-ML Structure message into Javascript objects. Accepts a SDMX-ML 2.1
Structure Message as input.

```
// req is a XMLHttpRequest object
var msg = sdmxmllib.mapSDMXMLResponse(req.responseText);

console.log(msg.header.id);                 // "IDREF99224"
console.log(msg.resources.length);          // 10
console.log(msg.resources[0].id);           // "CL_ADJUSTMENT"
console.log(msg.resources[0].name);         // "Adjustment indicator code list"
console.log(msg.resources[0].items[0].id);  // "C"
```
