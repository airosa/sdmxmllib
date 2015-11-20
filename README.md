sdmxmllib
===========

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
- Data Structure
- Hierarchical Codelist (partial: no levels)
- Content Constraint (partial: only cuberegions)

See the [XML mapping sample](http://airosa.github.io/sdmxmllib/samples/sdmxmlmap/)
for a live demo.

## Main changes to SDMX-ML format ##

The format follows the SDMX-ML format with similar structure and property names.
Following are main changes:

- Categories contain categorisations array with references to sources i.e. data
flows.
- Components in Data Structure Definitions contain representation attribute.
Contents come from either from the localRepresentation or the concept (if .
- All concepts contain explicit default representation.


## Usage ##

You can use [require.js](http://requirejs.org):

```javascript
var sdmxmllib = require('sdmxmllib');
console.log('sdmxmllib version: ' + sdmxmllib.version);
```

or just include the library on a web page:

```
<script src="sdmxmllib.js"></script>
<script>console.log('sdmxmllib version: ' + sdmxmllib.version);</script>
```

## Mapping ##

### mapSDMXMLResponse

Maps SDMX-ML Structure message to Javascript objects:

```
// req is a XMLHttpRequest object
var msg = sdmxmllib.mapSDMXMLResponse(req.responseXML);

console.log(msg.header.id);                 // "IDREF99224"
console.log(msg.codelists.length);          // 10
console.log(msg.codelists[0].id);           // "CL_ADJUSTMENT"
console.log(msg.codelists[0].name);         // "Adjustment indicator code list"
console.log(msg.codelists[0].codes[0].id);  // "C"
```
