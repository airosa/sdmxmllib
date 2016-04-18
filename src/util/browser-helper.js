(function () {

  window.readXMLFixture = function (filename, callback) {
    var onReadyStateChange, request;
    request = new XMLHttpRequest();
    onReadyStateChange = function () {
      if (request.readyState !== 4) {
        return;
      }
      callback(request.responseXML);
    };
    request.open('GET', filename);
    request.onreadystatechange = onReadyStateChange;
    request.send();
  };

}).call(this);
