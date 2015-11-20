(function () {

  var input = document.getElementById('requestURL');
  var xmlOutput = document.getElementById('sdmx-ml');
  var jsonOutput = document.getElementById('sdmx-json');

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
        var json = sdmxmllib.mapSDMXMLResponse(req.responseXML, url);
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

  // set default url for the input
  input.value = 'http://sdw-wsrest.ecb.europa.eu/service/categoryscheme/ECB/MOBILE_NAVI?references=parentsandsiblings';
  //input.value = 'https://a-sdw-wsrest.ecb.europa.eu/service/contentconstraint/ECB/ICP_CONSTRAINTS';
  //input.value = 'https://a-sdw-wsrest.ecb.europa.eu/service/hierarchicalcodelist/ECB.DISS/HCL_COUNTRY_GROUPINGS';
  //input.value = 'https://a-sdw-wsrest.ecb.europa.eu/service/dataflow/ECB/ICP?references=children';

  // Handler for the request button
  document.getElementById('request').onclick = function () {
    xmlOutput.textContent = '';
    jsonOutput.textContent = '';
    xhr(input.value);
  };

}).call(this);
