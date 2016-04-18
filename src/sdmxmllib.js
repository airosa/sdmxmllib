//   sdmxmllib.js 0.5.0
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {

  var root = typeof exports !== "undefined" && exports !== null ? exports : this;

  var lib = { version: '0.5.0' };

  var slice = Function.call.bind(Array.prototype.slice);

  var mes = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message';
  var str = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure';
  var com = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common';

//==============================================================================

  // Main (only) interface method

  lib.mapSDMXMLResponse = function (doc) {
    var elem = doc.documentElement;

    var response = {
      header: mapHeader(_getFirstChild(elem, 'Header', mes)),
      resources: mapStructures(_getFirstChild(elem, 'Structures', mes)),
      errors: mapErrorMessages(_getChildren(elem, 'ErrorMessage', mes))
    };

    response.references = mapResources(response.resources);

    return response;
  };

//------------------------------------------------------------------------------

  var _getDescendants = function (parent, tag, ns) {
    ns = ns === undefined ? str : ns;
    return slice(parent.getElementsByTagNameNS(ns, tag));
  };

  lib._getDescendants = _getDescendants;

  var _getChildren = function (parent, tag, ns) {
    var children = _getDescendants(parent, tag, ns);
    return children.filter(function (e) {
      return  e.parentNode === parent;
    });
  };

  lib._getChildren = _getChildren;

  var _getFirstChild = function (parent, tag, ns) {
    var children = _getChildren(parent, tag, ns);
    return children[0];
  };

  lib._getFirstChild = _getFirstChild;

//------------------------------------------------------------------------------

  function mapStructures (structures) {
    var resources = [];

    if (structures === undefined) return resources;

    slice(structures.childNodes).forEach(function (c) {
      slice(c.childNodes).forEach(function (s) {
        if ((s.localName === undefined) || (s.localName === null)) return;

        var handler = {
          'Categorisation': mapSimpleMaintainable,
          'CategoryScheme': mapItemScheme,
          'Dataflow': mapSimpleMaintainable,
          'AgencyScheme': mapItemScheme,
          'Codelist': mapItemScheme,
          'ConceptScheme': mapItemScheme,
          'HierarchicalCodelist': mapHierarchicalCodelist,
        }[s.localName];

        if (handler === undefined) {
          console.log('No mapping for ' + s.localName);
        } else {
          resources.push(handler(s));
        }
      });
    });

    return resources;
  }


//------------------------------------------------------------------------------

  // Set of low level functions for getting element text and attributes

  function getElementText (parent, localName, ns) {
    var el = _getFirstChild(parent, localName, ns);
    if (el === undefined) return undefined;
    return el.textContent;
  }

  function getValue (attr) {
    if ((attr === undefined) || (attr === null)) return undefined;
    return attr.value;
  }

  function toNumeric(value) {
    if (value === undefined) return undefined;
    return +value;
  }

  function toBoolean (val) {
    if ((val === undefined) || (val === null)) return val;
    return val === 'true';
  }

  function mapElementsTextToArray (node, name, ns) {
    var elements = _getChildren(node, name, ns);
    if (elements.length === 0) return undefined;

    return elements.map(function (e) {
      return e.textContent;
    });
  }

//------------------------------------------------------------------------------

  // Functions for mapping the header information (only for structure messages)

  function mapHeader (h) {
    if (h === undefined) return undefined;

    return {
      test: toBoolean(getElementText(h, 'Test', mes)),
      id: getElementText(h, 'ID', mes),
      prepared: getElementText(h, 'Prepared', mes),
      sender: mapParty(_getFirstChild(h, 'Sender', mes)),
      receiver: mapParty(_getFirstChild(h, 'Receiver', mes))
    };
  }


  function mapParty (e) {
    if (e === undefined) return undefined;

    var party = {
      id: getValue(e.attributes.id),
      name: getElementText(e, 'Name', mes)
    };

    var contacts = _getChildren(e, 'Contact', mes);

    if (0 < contacts.length) {
      party.contacts = contacts.map(function (c) {
        return {
          name: getElementText(c, 'Name', mes),
          department: getElementText(node, 'Department', mes),
          role: getElementText(node, 'Role', mes),
          telephone: mapElementsTextToArray(node, 'Telephone', mes),
          fax: mapElementsTextToArray(node, 'Fax', mes),
          uri: mapElementsTextToArray(node, 'URI'),
          email: mapElementsTextToArray(node, 'Emails')
        };
      });
    }

    return party;
  }


  function mapErrorMessages (errors) {
    if (errors.length === 0) return undefined;
    return errors.map(function (e) {
      return {
        code: toNumeric(getValue(e.code)),
        message: getElementText(e, 'Text', mes)
      };
    });
  }

//------------------------------------------------------------------------------

  // Functions for mapping base artefact (identifiable etc.)

  function mapIdentifiableArtefact (node) {
    var result = {
      id: getValue(node.attributes.id),
      urn: getValue(node.attributes.urn),
      uri: getValue(node.attributes.uri),
      package: getValue(node.attributes.package),
      class: getValue(node.attributes.class),
      annotations: mapAnnotations(node)
    };

    if (result.package === undefined && result.urn !== undefined) {
      var fields = result.urn.split('=')[0].split('.');
      result.package = fields[3];
      result.class = fields[4];
    }

    return result;
  }


  function mapNameableArtefact (node) {
    var result = mapIdentifiableArtefact(node);
    result.name = getElementText(node, 'Name', com);
    result.description = getElementText(node, 'Description', com);
    return result;
  }


  function mapVersionableArtefact (node) {
    var result = mapNameableArtefact(node);
    result.validFrom = getValue(node.attributes.validFrom);
    result.validTo = getValue(node.attributes.validTo);
    return result;
  }


  function mapMaintainableArtefact (node) {
    var result = mapVersionableArtefact(node);
    result.agencyID = getValue(node.attributes.agencyID);
    result.version = getValue(node.attributes.version);
    result.isFinal = toBoolean(getValue(node.attributes.isFinal));
    result.isExternalReference = toBoolean(getValue(node.attributes.isExternalReference));
    result.structureURL = getValue(node.attributes.structureURL);
    result.serviceURL = getValue(node.attributes.serviceURL);

    if (result.urn === undefined) {
      result.urn = [
        'urn:sdmx:org.sdmx.infomodel.',
        result.package, '.',
        result.class, '=',
        result.agencyID, ':',
        result.id, '(', result.version, ')'
      ].join('');
    }

    return result;
  }


  function mapAnnotations (node) {
    var annotations = _getDescendants(node, 'Annotation', com);
    if (annotations.length === 0) return undefined;

    return annotations.map(function (a) {
      return {
        id: getValue(a.attributes.id),
        title: getElementText(a, 'AnnotationTitle', com),
        type: getElementText(a, 'AnnotationType', com),
        url: getElementText(a, 'AnnotationURL', com),
        text: getElementText(a, 'AnnotationText', com)
      };
    });
  }

//------------------------------------------------------------------------------

  // Set of functions for mapping references to artefacts (all map to urns)

  function mapLocalReference (node) {
    if ((node === undefined) || (node === null)) return undefined;
    var ref = _getFirstChild(node, 'Ref');
    if ((ref === undefined) || (ref === null)) return undefined;
    return getValue(ref.attributes.id);
  }


  function mapBaseReference (e) {
    return [
      'urn:sdmx:org.sdmx.infomodel.',
      getValue(e.attributes.package),
      '.',
      getValue(e.attributes.class),
      '=',
      getValue(e.attributes.agencyID),
      ':'
    ].join('');
  }


  function getURNReference (node) {
    var urn = getElementText(node, 'URN', null);
    if (urn !== undefined) return urn;

    var ref = _getFirstChild(node, 'Ref', null);
    if (ref === undefined) return undefined;

    if (getValue(ref.attributes.maintainableParentID)) {
      return mapBaseReference(ref) +
        [
          getValue(ref.attributes.maintainableParentID),
          '(',
          getValue(ref.attributes.maintainableParentVersion),
          ').',
          getValue(ref.attributes.id),
        ].join('');
    }

    return mapBaseReference(ref) +
      [
        getValue(ref.attributes.id),
        '(',
        getValue(ref.attributes.version),
        ')'
      ].join('');
  }


  function mapReference (node, rel, type) {
    if ((node === undefined) || (node === null)) return undefined;

    return {
      href: getURNReference(node),
      rel: rel,
      type: type
    };
  }


  function mapISOConceptReference (node) {
    if ((node === undefined) || (node === null)) return undefined;

    return {
      conceptAgency: getElementText(node, 'ConceptAgency'),
      conceptSchemeID: getElementText(node, 'ConceptSchemeID'),
      conceptID: getElementText(node, 'ConceptID')
    };
  }

//------------------------------------------------------------------------------

    // Functions for mapping item scheme like artefacts

  function mapItemScheme (e) {
    var itemName = {
      'CategoryScheme': 'Category',
      'Hierarchy': 'HierarchicalCode',
      'Codelist': 'Code',
      'ConceptScheme': 'Concept',
      'AgencyScheme': 'Agency'
    }[e.localName];

    var itemScheme = mapMaintainableArtefact(e);
    itemScheme.isPartial = toBoolean(e.attributes.isPartial);
    itemScheme.leveled = toBoolean(e.attributes.leveled); // Hierarchy

    var itemURN = [
      'urn:sdmx:org.sdmx.infomodel',
      '.', itemScheme.package,
      '', itemName,
      '=', itemScheme.agencyID,
      ':', itemScheme.id,
      '(', itemScheme.version, ')'
    ].join('');

    function mapItems (node, hierarchy) {
      var items = _getChildren(node, itemName);
      if (items.length === 0) return undefined;

      function mapItem (e) {
        var item = mapVersionableArtefact(e); // HierarchicalCode = versionable

        if (item.urn === undefined) {
          item.urn = itemURN + hierarchy + '.' + item.id;
        }

        item.parent = mapLocalReference(_getFirstChild(e, 'parent'));
        item.items = mapItems(e, hierarchy + '.' + item.id);

        if (e.localName === 'Concept') {
          item.isoConceptReference = mapISOConceptReference(_getFirstChild(e, 'ISOConceptReference'));
          item.coreRepresentation = mapRepresentation(_getFirstChild(e, 'CoreRepresentation'));
        }

        if (e.localName === 'HierarchicalCode') {
          item.code = mapReference(_getFirstChild(e, 'Code'), 'code', 'code');
        }

        return item;
      }

      return items.map(mapItem);
    }

    itemScheme.items = mapItems(e, '');

    return itemScheme;
  }

//------------------------------------------------------------------------------

  function mapSimpleMaintainable(e) {
    var result = mapMaintainableArtefact(e);

    if (e.localName === 'Dataflow') {
      result.structure = mapReference(_getFirstChild(e, 'Structure'), 'structure', 'datastructure');
    }

    if (e.localName === 'Categorisation') {
      result.source = mapReference(_getFirstChild(e, 'Source'), 'source', 'dataflow');
      result.target = mapReference(_getFirstChild(e, 'Target'), 'target', 'category');
    }

    return result;
  }

//------------------------------------------------------------------------------

    // Functions for mapping representations

  function mapTextFormat (e) {
    if ((e === undefined) || (e === null)) return undefined;

    return {
      textType: getValue(e.attributes.textType),
      isSequence: toBoolean(getValue(e.attributes.isSequence)),
      interval: toNumeric(getValue(e.attributes.interval)),
      startValue: toNumeric(getValue(e.attributes.startValue)),
      endValue: toNumeric(getValue(e.attributes.endValue)),
      timeInterval: getValue(getValue(e.attributes.timeInterval)),
      startTime: toNumeric(getValue(e.attributes.startTime)),
      endTime: toNumeric(getValue(e.attributes.endTime)),
      minLength: toNumeric(getValue(e.attributes.minLength)),
      maxLength: toNumeric(getValue(e.attributes.maxLength)),
      minValue: toNumeric(getValue(e.attributes.minValue)),
      maxValue: toNumeric(getValue(e.attributes.maxValue)),
      decimals: toNumeric(getValue(e.attributes.decimals)),
      pattern: getValue(e.attributes.pattern),
      isMultiLingual: toBoolean(getValue(e.attributes.isMultiLingual))
    };
  }


  function mapRepresentation (e) {
    if ((e === undefined) || (e === null)) return undefined;

    return {
      textFormat: mapTextFormat(_getFirstChild(e, 'TextFormat')),
      enumeration: mapReference(_getFirstChild(e, 'Enumeration'), 'representation', 'codelist'),
      enumerationFormat: mapTextFormat(_getFirstChild(e, 'EnumerationFormat'))
    };
  }

//------------------------------------------------------------------------------

  function mapHierarchicalCodelist (e) {
    // TODO add levels
    var hcl = mapMaintainableArtefact(e);

    var hierarchies = _getChildren(e, 'Hierarchy');
    if (hierarchies.length === 0) return hcl;

    hcl.items = hierarchies.map(function (h) {
        return mapItemScheme(h);
    });

    return hcl;
  }

//------------------------------------------------------------------------------

  // Functions for pre-processing responses

  function mapResources (resources) {
    var result = {};

    resources.forEach(function (r) {
        result[r.urn] = r;
    });

    var categorisations = resources.filter(function (r) { return r.class === 'Categorisation'; });
    var dataflows = resources.filter(function (r) { return r.class === 'Dataflow'; });
    var categoryschemes = resources.filter(function (r) { return r.class === 'CategoryScheme'; });
    var categories = [];

    function getCategories (c) {
      if (c.items === undefined) return;
      c.items.forEach(getCategories);
      categories = categories.concat(c.items);
    }

    categoryschemes.forEach(getCategories);

    var categoryMap = {};
    categories.forEach(function (c) { categoryMap[c.urn] = c; });

    categorisations.forEach(function (c) {
      var source = result[c.source.href];
      var target = categoryMap[c.target.href];
      if (target === undefined) return;
      if (target.children === undefined) target.children = [];
      target.children.push(source);
    });

    return result;
  }

//==============================================================================

  if (typeof define === 'function' && define.amd) {
    // Require.js - no dependencies
    define([], function () {
      // no setup
      return lib;
    });
  } else {
    // Add to global object
    root.sdmxmllib = lib;
  }

}).call(this);
