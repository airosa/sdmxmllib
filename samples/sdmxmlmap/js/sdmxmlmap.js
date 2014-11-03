(function () {

  var input = document.getElementById('requestURL');
  var xmlOutput = document.getElementById('sdmx-ml');
  var jsonOutput = document.getElementById('sdmx-json');
  var response;

//------------------------------------------------------------------------------

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

  var xhr = function (url) {
    var req = new XMLHttpRequest();

    var respond = function () {
        if (req.status !== 200) return console.warn(reg.status + ' ' + req.statusText);
        xmlOutput.textContent = req.responseText;
        var json = sdmxmllib.mapSDMXMLResponse(req.responseXML);
        jsonOutput.textContent = JSON.stringify(json, null, 2);
    };

    req.open('GET', url);
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

  document.getElementById('request').onclick = function () {
    xmlOutput.textContent = '';
    jsonOutput.textContent = '';
    xhr(input.value);
  };

}).call(this);
