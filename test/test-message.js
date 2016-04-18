(function () {
  var msg, dele, firstResource;

  var mes = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message';
  var str = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure';

  var getFixture = function (fixture, done) {
    var callback;
    callback = function(testDocument) {
      dele = testDocument.documentElement;
      msg = sdmxmllib.mapSDMXMLResponse(testDocument);
      firstResource = msg.resources[0];
      done();
    };
    readXMLFixture(fixture, callback);
  };


  describe('Internal API for document object', function() {
    before(function (done) { getFixture('fixtures/CL_FREQ.xml', done); });

    it('api: returns all descendant elements with a matching local name and namespace', function () {
      var desc = sdmxmllib._getDescendants(dele, 'Code');
      desc.length.should.equal(10);
      desc[0].id.should.equal('A');
      desc = sdmxmllib._getDescendants(dele, 'NotThere');
      desc.length.should.equal(0);
    });

    it('api: returns all child elements with a matching local name and namespace', function () {
      var desc = sdmxmllib._getChildren(dele, 'Code');
      desc.length.should.equal(0);
      desc = sdmxmllib._getChildren(dele, 'Header', mes);
      desc.length.should.equal(1);
    });

    it('api: returns first child element with a matching local name and namespace', function () {
      var desc = sdmxmllib._getFirstChild(dele, 'Code');
      should.not.exist(desc);
      desc = sdmxmllib._getFirstChild(dele, 'Header', mes);
      desc.localName.should.equal('Header');
    });
  });


  describe('Message', function () {
    //before(function (done) { getFixture('fixtures/CL_FREQ.xml', done); });

    it('contains header', function () {
      msg.should.have.property('header');
      var header = msg.header;
      header.should.have.property('id', 'IDREF340582');
      header.should.have.property('test', false);
      header.should.have.property('prepared');
      header.should.have.property('sender').with.property('id', 'ECB');
      header.should.have.property('receiver').with.property('id', 'unknown');
    });

    it('contains resources', function () {
      msg.should.have.property('resources').that.is.an('array');
      msg.resources.length.should.equal(1);
      msg.should.have.property('references').that.is.an('object');
      Object.keys(msg.references).length.should.equal(1);
      Object.keys(msg.references)[0].should.equal('urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ECB:CL_FREQ(1.0)');
    });
  });


  describe('Codelist', function () {
    before(function (done) { getFixture('fixtures/CL_FREQ.xml', done); });

    it('contains attributes', function () {
      firstResource.should.have.property('id', 'CL_FREQ');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ECB:CL_FREQ(1.0)');
      firstResource.should.have.property('agencyID', 'ECB');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'Frequency code list');
      firstResource.should.have.property('package', 'codelist');
      firstResource.should.have.property('class', 'Codelist');
    });

    it('contains codes', function () {
      firstResource.should.have.property('items').that.is.an('array');
      var items = firstResource.items;
      items.length.should.eql(10);
      items[0].should.have.property('id', 'A');
      items[0].should.have.property('name', 'Annual');
      items[0].should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.Code=ECB:CL_FREQ(1.0).A');
      items[0].should.have.property('package', 'codelist');
      items[0].should.have.property('class', 'Code');
    });

  });



  describe('ConceptScheme', function () {
    before(function (done) { getFixture('fixtures/ECB_CONCEPTS.xml', done); });

    it('contains attributes', function () {
      firstResource.should.have.property('id', 'ECB_CONCEPTS');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.conceptscheme.ConceptScheme=ECB:ECB_CONCEPTS(1.0)');
      firstResource.should.have.property('agencyID', 'ECB');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'ECB concepts');
      firstResource.should.have.property('package', 'conceptscheme');
      firstResource.should.have.property('class', 'ConceptScheme');
    });

    it('contains concepts', function () {
      firstResource.should.have.property('items').that.is.an('array');
      var items = firstResource.items;
      items.length.should.equal(335);
      items[0].should.have.property('id', 'COUNT_AREA');
      items[0].should.have.property('name', 'Counterpart area');
      items[0].should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=ECB:ECB_CONCEPTS(1.0).COUNT_AREA');
      items[0].should.have.property('package', 'conceptscheme');
      items[0].should.have.property('class', 'Concept');
    });

  });


  describe('CategoryScheme', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI.xml', done); });

    it('contains attributes', function () {
      firstResource.should.have.property('id', 'MOBILE_NAVI');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=ECB:MOBILE_NAVI(1.0)');
      firstResource.should.have.property('agencyID', 'ECB');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'Economic concepts');
      firstResource.should.have.property('package', 'categoryscheme');
      firstResource.should.have.property('class', 'CategoryScheme');
    });

    it('contains categories', function () {
      firstResource.should.have.property('items').that.is.an('array');
      var items = firstResource.items;
      items.length.should.equal(11);
      items[0].should.have.property('id', '01');
      items[0].should.have.property('name', 'Monetary operations');
      items[0].should.have.property('description').that.has.length(143);
      items[0].should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=ECB:MOBILE_NAVI(1.0).01');
      items[0].should.have.property('package', 'categoryscheme');
      items[0].should.have.property('class', 'Category');
    });

  });


  describe('AgencyScheme', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      firstResource = msg.resources.filter(function (r) { return r.class === 'AgencyScheme'; })[0];
      firstResource.should.have.property('id', 'AGENCIES');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.base.AgencyScheme=SDMX:AGENCIES(1.0)');
      firstResource.should.have.property('agencyID', 'SDMX');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'SDMX Agency Scheme');
      firstResource.should.have.property('package', 'base');
      firstResource.should.have.property('class', 'AgencyScheme');
    });

    it('contains agencies', function () {
      firstResource.should.have.property('items').that.is.an('array');
      var items = firstResource.items;
      items.length.should.equal(5);
      items[0].should.have.property('id', 'SDMX');
      items[0].should.have.property('name', 'SDMX');
      items[0].should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.base.Agency=SDMX');
      items[0].should.have.property('package', 'base');
      items[0].should.have.property('class', 'Agency');
    });

  });


  describe('Dataflow', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      var dataflows = msg.resources.filter(function (r) { return r.class === 'Dataflow'; });
      dataflows.length.should.equal(66);
      firstResource = dataflows[0];
      firstResource.should.have.property('id', 'AME');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=ECB:AME(1.0)');
      firstResource.should.have.property('agencyID', 'ECB');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'AMECO');
      firstResource.should.have.property('package', 'datastructure');
      firstResource.should.have.property('class', 'Dataflow');
      firstResource.should.have.property('structure').that.is.an('object');
      firstResource.structure.should.have.property('href', 'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructure=ECB:ECB_AME1(1.0)');
      firstResource.structure.should.have.property('rel', 'structure');
      firstResource.structure.should.have.property('type', 'datastructure');
    });

  });


  describe('Categorisation', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      var categorisations = msg.resources.filter(function (r) { return r.class === 'Categorisation'; });
      categorisations.length.should.equal(70);
      firstResource = categorisations[0];
      firstResource.should.have.property('id', '00CC3B37-3732-D5BD-EB54-E2EC6BE90E1A');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Categorisation=ECB:00CC3B37-3732-D5BD-EB54-E2EC6BE90E1A(1.0)');
      firstResource.should.have.property('agencyID', 'ECB');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'Categorise: DATAFLOWECB:YC(1.0)');
      firstResource.should.have.property('package', 'categoryscheme');
      firstResource.should.have.property('class', 'Categorisation');
      firstResource.should.have.property('source').that.is.an('object');
      firstResource.source.should.have.property('href', 'urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=ECB:YC(1.0)');
      firstResource.source.should.have.property('rel', 'source');
      firstResource.source.should.have.property('type', 'dataflow');
      firstResource.should.have.property('target').that.is.an('object');
      firstResource.target.should.have.property('href', 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=ECB:MOBILE_NAVI(1.0).03');
      firstResource.target.should.have.property('rel', 'target');
      firstResource.target.should.have.property('type', 'category');
    });

    it('maps dataflows to categories', function () {
      var cs = msg.references['urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=ECB:MOBILE_NAVI(1.0)'];
      var c = cs.items[2];
      c.id.should.equal('03');
      c.should.have.property('children').that.is.an('array');
      c.children.length.should.equal(29);
      c.children[0].should.be.an('object');
      c.children[0].should.have.property('class', 'Dataflow');
      c.children[0].should.have.property('id', 'YC');
    });

  });


  describe('HierarchicalCodelist', function () {
    before(function (done) { getFixture('fixtures/HCL_COUNTRY_GROUPINGS.xml', done); });

    it('contains attributes', function () {
      firstResource = msg.resources.filter(function (r) { return r.class === 'HierarchicalCodelist'; })[0];
      firstResource.should.have.property('id', 'HCL_COUNTRY_GROUPINGS');
      firstResource.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCodelist=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0)');
      firstResource.should.have.property('agencyID', 'ECB.DISS');
      firstResource.should.have.property('version', '1.0');
      firstResource.should.have.property('name', 'List of country groupings');
      firstResource.should.have.property('package', 'codelist');
      firstResource.should.have.property('class', 'HierarchicalCodelist');
    });

    it('contains hierarchies', function () {
      firstResource.should.have.property('items').that.is.an('array');
      var items = firstResource.items;
      items.length.should.equal(1);
      var h = items[0];
      h.should.have.property('id', 'EU_GROUPINGS_PROTOCOL');
      h.should.have.property('name', 'EU countries sorted by protocol order');
      h.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.Hierarchy=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL');
      h.should.have.property('package', 'codelist');
      h.should.have.property('class', 'Hierarchy');
      h.should.have.property('leveled', false);
      h.should.have.property('items').that.is.an('array');
      h.items[0].should.be.an('object');
      var hc1 = h.items[0];
      hc1.should.have.property('id', '1');
      hc1.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCode=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL.1');
      hc1.should.have.property('code').that.is.an('object');
      hc1.code.should.have.property('href', 'urn:sdmx:org.sdmx.infomodel.codelist.Code=ECB.DISS:CL_COUNTRY_GROUPINGS(1.0).EU');
      hc1.code.should.have.property('rel', 'code');
      hc1.code.should.have.property('type', 'code');
      hc1.should.have.property('items').that.is.an('array');
      hc1.items.should.have.length(28);
      var hc2 = hc1.items[0];
      hc2.should.have.property('id', '1');
      hc2.should.have.property('urn', 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCode=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL.1.1');
    });

  });

}).call(this);
