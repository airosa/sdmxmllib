(function () {

  var input = document.getElementById('requestURL');
  var xmlOutput = document.getElementById('sdmx-ml');
  var jsonOutput = document.getElementById('sdmx-json');
  var response;

//------------------------------------------------------------------------------

  // This code runs on page load and sets up the default request url
  (function () {
    var req = new sdmxjsonlib.request.URL();

    req.hostname = 'a-sdw-wsrest.ecb.europa.eu';
    req.path.pathname = 'service';

    req.path.resource = 'contentconstraint';
    req.path.agencyId = 'ECB';
    req.path.resourceId = 'ICP_CONSTRAINTS';

    //req.path.resource = 'hierarchicalcodelist';
    //req.path.agencyId = 'ECB.DISS';
    //req.path.resourceId = 'HCL_COUNTRY_GROUPINGS';

    //req.path.resource = 'datastructure';
    //req.path.agencyId = 'ECB';
    //req.path.resourceId = 'ECB_ICP1';
    //req.query.references = 'children';

    input.value = req.href();
  }).call(this);

//------------------------------------------------------------------------------

  // Sends the request and handles response
  var xhr = function (url) {
    var req = new XMLHttpRequest();

    // Response handler. Check the console for errors.
    var respond = function () {
        if (req.status !== 200) {
          console.warn(req.responseText);
          return;
        }
        // Show the raw response text on page
        xmlOutput.textContent = req.responseText;
        // convert XML to javascript objects
        var json = sdmxmllib.mapSDMXMLResponse(req.responseXML);
        // Convert to json and show on page
        jsonOutput.textContent = JSON.stringify(json, null, 2);
    };

    req.open('GET', url);
    // This will return latest version (SDMX-ML 2.1)
    req.setRequestHeader('Accept', 'application/xml');

    req.onreadystatechange = function () {
      if (req.readyState > 3) respond();
    };

    req.onerror = function (err) {
      console.warn(err);
    };

    req.send(null);
  };

//------------------------------------------------------------------------------

  // Handler for the request button
  document.getElementById('request').onclick = function () {
    xmlOutput.textContent = '';
    jsonOutput.textContent = '';
    xhr(input.value);
  };

}).call(this);
