  //var sdmxmllib  = require('../src/sdmxmllib');
  var msg;

  var mes = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message';
  var str = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure';

  var getFixture = function (fixture, done) {
    var callback;
    callback = function(xmlSource) {
      msg = sdmxmllib.mapSDMXMLResponse(xmlSource);
      done();
    };
    readXMLFixture(fixture, callback);
  };

  var testProps = function (obj, props) {
    Object.keys(props).forEach( function (k) {
      if (typeof props[k] === 'object') {
        testProps(obj[k], props[k]);
      } else {
        obj.should.have.property(k, props[k]);
      }
    });
  };

  var findResource = function (c, id) {
    return msg.resources.filter(function (r) {
      return (r.class === c) && (r.id === id);
    })[0];
  };


  describe('Internal API for document object', function() {
    var dele;

    before(function (done) {
      readXMLFixture('fixtures/CL_FREQ.xml', function (xmlSource) {
        var doc = (new DOMParser()).parseFromString(xmlSource, 'text/xml');
        dele = doc.documentElement;
        done();
      });
    });

    it('api: returns all descendant elements with a matching local name and namespace', function () {

      var desc = sdmxmllib._getDescendantsNS(dele, 'Code');
      desc.length.should.equal(10);
      desc[0].getAttribute('id').should.equal('A');
      desc = sdmxmllib._getDescendantsNS(dele, 'NotThere');
      desc.should.have.lengthOf(0);
    });

    it('api: returns all child elements with a matching local name and namespace', function () {
      var desc = sdmxmllib._getChildrenNS(dele, 'Code');
      desc.length.should.equal(0);
      desc = sdmxmllib._getChildrenNS(dele, 'Header', mes);
      desc.should.have.lengthOf(1);
    });

    it('api: returns first child element with a matching local name and namespace', function () {
      var desc = sdmxmllib._getFirstChildNS(dele, 'Code');
      should.not.exist(desc);
      desc = sdmxmllib._getFirstChildNS(dele, 'Header', mes);
      desc.localName.should.equal('Header');
    });
  });


  describe('Message', function () {
    before(function (done) { getFixture('fixtures/CL_FREQ.xml', done); });

    it('contains header', function () {
      msg.should.have.property('header').that.is.an('object');
      testProps(msg.header, {
        id: 'IDREF340582',
        test: false,
        prepared: '2016-03-28T20:59:24.075Z',
        sender: { id: 'ECB' },
        receiver: { id: 'unknown' }
      });
    });

    it('contains resources', function () {
      msg.should.have.property('resources').that.is.an('array').with.lengthOf(1);
      msg.resources[0].should.have.property('class', 'Codelist');
      msg.should.have.property('references').that.is.an('object');
      Object.keys(msg.references).should.have.lengthOf(1);
      msg.references.should.contain.all.keys('urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ECB:CL_FREQ(1.0)');
    });
  });


  describe('Codelist', function () {
    before(function (done) { getFixture('fixtures/CL_FREQ.xml', done); });

    it('contains attributes', function () {
      testProps(msg.resources[0], {
        id: 'CL_FREQ',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ECB:CL_FREQ(1.0)',
        agencyID: 'ECB',
        version: '1.0',
        name: 'Frequency code list',
        package: 'codelist',
        class: 'Codelist'
      });
    });

    it('contains codes', function () {
      msg.resources[0].should.have.property('items').that.is.an('array').with.lengthOf(10);
      testProps(msg.resources[0].items[0], {
        id: 'A',
        name: 'Annual',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.Code=ECB:CL_FREQ(1.0).A',
        package: 'codelist',
        class: 'Code',
        agencyID: 'ECB',
        maintainableParentID: 'CL_FREQ',
        maintainableParentVersion: '1.0'
      });
    });

  });


  describe('ConceptScheme', function () {
    describe('SDW ConceptScheme', function () {
      before(function (done) { getFixture('fixtures/ECB_CONCEPTS.xml', done); });

      it('contains attributes', function () {
        testProps(msg.resources[0], {
          id: 'ECB_CONCEPTS',
          urn: 'urn:sdmx:org.sdmx.infomodel.conceptscheme.ConceptScheme=ECB:ECB_CONCEPTS(1.0)',
          agencyID: 'ECB',
          version: '1.0',
          name: 'ECB concepts',
          package: 'conceptscheme',
          class: 'ConceptScheme'
        });
      });

      it('contains concepts', function () {
        msg.resources[0].should.have.property('items').that.is.an('array').with.lengthOf(335);
        testProps(msg.resources[0].items[0], {
          id: 'COUNT_AREA',
          name: 'Counterpart area',
          urn: 'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=ECB:ECB_CONCEPTS(1.0).COUNT_AREA',
          package: 'conceptscheme',
          class: 'Concept',
          agencyID: 'ECB',
          maintainableParentID: 'ECB_CONCEPTS',
          maintainableParentVersion: '1.0'
        });
      });
    });

    describe('Global Registry ConceptScheme', function () {
      before(function (done) { getFixture('fixtures/CS_BOP.xml', done); });

      it('contains attributes', function () {
        testProps(msg.resources[0], {
          id: 'CS_BOP',
          urn: 'urn:sdmx:org.sdmx.infomodel.conceptscheme.ConceptScheme=IMF:CS_BOP(1.6)',
          agencyID: 'IMF',
          version: '1.6',
          name: 'Balance of Payments Concept Scheme',
          package: 'conceptscheme',
          class: 'ConceptScheme',
          isExternalReference: false,
          isFinal: true
        });
      });

      it('contains concepts', function () {
        msg.resources[0].should.have.property('items').that.is.an('array').with.lengthOf(32);
        testProps(msg.resources[0].items[0], {
          id: 'FREQ',
          name: 'Frequency',
          description: 'Frequency',
          urn: 'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=IMF:CS_BOP(1.6).FREQ',
          package: 'conceptscheme',
          class: 'Concept',
          coreRepresentation: {
            enumeration: {
              href: 'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(2.0)',
              rel: 'representation',
              type: 'codelist'
            }
          },
          agencyID: 'IMF',
          maintainableParentID: 'CS_BOP',
          maintainableParentVersion: '1.6'
        });
      });
    });
  });


  describe('CategoryScheme', function () {
    describe('SDW CategoryScheme', function () {
      before(function (done) { getFixture('fixtures/MOBILE_NAVI.xml', done); });

      it('contains attributes', function () {
        testProps(msg.resources[0], {
          id: 'MOBILE_NAVI',
          urn: 'urn:sdmx:org.sdmx.infomodel.categoryscheme.CategoryScheme=ECB:MOBILE_NAVI(1.0)',
          agencyID: 'ECB',
          version: '1.0',
          name: 'Economic concepts',
          package: 'categoryscheme',
          class: 'CategoryScheme'
        });
      });

      it('contains categories', function () {
        msg.resources[0].should.have.property('items').that.is.an('array').with.lengthOf(11);
        testProps(msg.resources[0].items[0], {
          id: '01',
          name: 'Monetary operations',
          urn: 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=ECB:MOBILE_NAVI(1.0).01',
          package: 'categoryscheme',
          class: 'Category',
        });
        msg.resources[0].items[0].should.have.property('description').with.lengthOf(143);
      });
    });
  });


  describe('AgencyScheme', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      testProps(findResource('AgencyScheme', 'AGENCIES'), {
        id: 'AGENCIES',
        urn: 'urn:sdmx:org.sdmx.infomodel.base.AgencyScheme=SDMX:AGENCIES(1.0)',
        agencyID: 'SDMX',
        version: '1.0',
        name: 'SDMX Agency Scheme',
        package: 'base',
        class: 'AgencyScheme'
      });
    });

    it('contains agencies', function () {
      findResource('AgencyScheme', 'AGENCIES').should.have.property('items').that.is.an('array').with.lengthOf(5);
      testProps(findResource('AgencyScheme', 'AGENCIES').items[0], {
        id: 'SDMX',
        name: 'SDMX',
        urn: 'urn:sdmx:org.sdmx.infomodel.base.Agency=SDMX',
        package: 'base',
        class: 'Agency'
      });
    });

  });


  describe('Dataflow', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      var dataflows = msg.resources.filter(function (r) { return r.class === 'Dataflow'; });
      dataflows.should.have.lengthOf(66);
      testProps(dataflows[0], {
        id: 'AME',
        urn: 'urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=ECB:AME(1.0)',
        agencyID: 'ECB',
        version: '1.0',
        name: 'AMECO',
        package: 'datastructure',
        class: 'Dataflow',
        structure: {
          href: 'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructure=ECB:ECB_AME1(1.0)',
          rel: 'structure',
          type: 'datastructure'
        }
      });
    });

  });


  describe('Categorisation', function () {
    before(function (done) { getFixture('fixtures/MOBILE_NAVI-categorisations.xml', done); });

    it('contains attributes', function () {
      var categorisations = msg.resources.filter(function (r) { return r.class === 'Categorisation'; });
      categorisations.should.have.lengthOf(70);
      testProps( categorisations[0], {
        id: '00CC3B37-3732-D5BD-EB54-E2EC6BE90E1A',
        urn: 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Categorisation=ECB:00CC3B37-3732-D5BD-EB54-E2EC6BE90E1A(1.0)',
        agencyID: 'ECB',
        version: '1.0',
        name: 'Categorise: DATAFLOWECB:YC(1.0)',
        package: 'categoryscheme',
        class: 'Categorisation',
        source: {
          href: 'urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=ECB:YC(1.0)',
          rel: 'source',
          type: 'dataflow'
        },
        target: {
          href: 'urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=ECB:MOBILE_NAVI(1.0).03',
          rel: 'target',
          type: 'category'
        }
      });
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
      testProps( findResource('HierarchicalCodelist', 'HCL_COUNTRY_GROUPINGS'), {
        id: 'HCL_COUNTRY_GROUPINGS',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCodelist=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0)',
        agencyID: 'ECB.DISS',
        version: '1.0',
        name: 'List of country groupings',
        package: 'codelist',
        class: 'HierarchicalCodelist'
      });
    });

    it('contains hierarchies', function () {
      var hcl = findResource('HierarchicalCodelist', 'HCL_COUNTRY_GROUPINGS');
      hcl.should.have.property('items').that.is.an('array').with.lengthOf(1);
      testProps( hcl.items[0], {
        id: 'EU_GROUPINGS_PROTOCOL',
        name: 'EU countries sorted by protocol order',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.Hierarchy=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL',
        package: 'codelist',
        class: 'Hierarchy',
        leveled: false
      });
      hcl.items[0].should.have.property('items').that.is.an('array').with.lengthOf(3);
      testProps( hcl.items[0].items[0], {
        id: '1',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCode=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL.1',
        code: {
          href: 'urn:sdmx:org.sdmx.infomodel.codelist.Code=ECB.DISS:CL_COUNTRY_GROUPINGS(1.0).EU',
          rel: 'code',
          type: 'code'
        }
      });
      hcl.items[0].items[0].should.have.property('items').that.is.an('array').with.lengthOf(28);
      testProps( hcl.items[0].items[0].items[0], {
        id: '1',
        urn: 'urn:sdmx:org.sdmx.infomodel.codelist.HierarchicalCode=ECB.DISS:HCL_COUNTRY_GROUPINGS(1.0).EU_GROUPINGS_PROTOCOL.1.1'
      });
    });

  });

