//   sdmxmllib.js
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {
  var _DOMParser;

  if (typeof DOMParser === 'object') {
    _DOMParser = DOMParser;
  } else {
    _DOMParser = require('xmldom').DOMParser;
  }

  var lib = {};

  var root = typeof exports !== 'undefined' && exports !== null ? exports : this;

  var slice = Function.call.bind(Array.prototype.slice);

  var mes = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message';
  var str = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure';
  var com = 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common';

//==============================================================================

  // Main (only) interface method

  lib.mapSDMXMLResponse = function (xmlSource) {
    var doc = (new _DOMParser()).parseFromString(xmlSource, 'text/xml');
    var elem = doc.documentElement;

    var response = {
      header: mapHeader(_getFirstChildNS(elem, 'Header', mes)),
      resources: mapStructures(_getFirstChildNS(elem, 'Structures', mes)),
      errors: mapErrorMessages(_getChildrenNS(elem, 'ErrorMessage', mes))
    };

    response.references = mapResources(response.resources);

    return response;
  };

//------------------------------------------------------------------------------

  var _getDescendantsNS = lib._getDescendantsNS = function (parent, tag, ns) {
    ns = ns === undefined ? str : ns;
    return slice(parent.getElementsByTagNameNS(ns, tag));
  };

  var _getChildrenNS = lib._getChildrenNS = function (parent, tag, ns) {
    var children = _getDescendantsNS(parent, tag, ns);
    return children.filter(function (e) {
      return  e.parentNode === parent;
    });
  };

  var _getFirstChildNS = lib._getFirstChildNS = function (parent, tag, ns) {
    var children = _getChildrenNS(parent, tag, ns);
    return children[0];
  };

  var _getChildren = function (parent, tag) {
    var children = slice(parent.getElementsByTagName(tag));
    return children.filter(function (e) {
      return e.parentNode === parent;
    });
  };

  var _getFirstChild = function (parent, tag) {
    var children = _getChildren(parent, tag);
    return children[0];
  };

  var _getElementChildNodes = function (node) {
    if ((node.childNodes === null) || (node.childNodes === undefined)) return [];
    return slice(node.childNodes).filter(function (n) {
      return n.nodeType === 1; // ELEMENT_NODE
    });
  };

//------------------------------------------------------------------------------

  function mapStructures (structures) {
    var result = [];

    if (structures === undefined) return result;

    _getElementChildNodes(structures).forEach(function (c) {
      _getElementChildNodes(c).forEach(function (s) {
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
          result.push(handler(s));
        }
      });
    });

    return result;
  }


//------------------------------------------------------------------------------

  // Set of low level functions for getting element text and attributes

  function getElementText (parent, localName, ns) {
    var el = _getFirstChildNS(parent, localName, ns);
    if (el === undefined) return undefined;
    return el.textContent;
  }

  function getAttrValue (element, name) {
    if (element.hasAttribute(name)) return element.getAttribute(name);
    return undefined;
  }

  function toNumeric(value) {
    if (value === undefined) return value;
    return +value;
  }

  function toBoolean (value) {
    if ((value === undefined) || (value === null)) return value;
    return value === 'true';
  }

  function mapElementsTextToArray (node, name, ns) {
    var elements = _getChildrenNS(node, name, ns);
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
      sender: mapParty(_getFirstChildNS(h, 'Sender', mes)),
      receiver: mapParty(_getFirstChildNS(h, 'Receiver', mes))
    };
  }


  function mapParty (e) {
    if (e === undefined) return undefined;

    var party = {
      id: getAttrValue(e, 'id'),
      name: getElementText(e, 'Name', mes)
    };

    var contacts = _getChildrenNS(e, 'Contact', mes);

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
        code: toNumeric(getAttrValue(e, 'code')),
        message: getElementText(e, 'Text', mes)
      };
    });
  }

//------------------------------------------------------------------------------

  // Functions for mapping base artefact (identifiable etc.)

  function mapIdentifiableArtefact (node) {
    var result = {
      id: getAttrValue(node, 'id'),
      urn: getAttrValue(node, 'urn'),
      uri: getAttrValue(node, 'uri'),
      package: getAttrValue(node, 'package'),
      class: getAttrValue(node, 'class'),
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
    result.validFrom = getAttrValue(node, 'validFrom');
    result.validTo = getAttrValue(node, 'validTo');
    return result;
  }


  function mapMaintainableArtefact (node) {
    var result = mapVersionableArtefact(node);
    result.agencyID = getAttrValue(node, 'agencyID');
    result.version = getAttrValue(node, 'version');
    result.isFinal = toBoolean(getAttrValue(node, 'isFinal'));
    result.isExternalReference = toBoolean(getAttrValue(node, 'isExternalReference'));
    result.structureURL = getAttrValue(node, 'structureURL');
    result.serviceURL = getAttrValue(node, 'serviceURL');

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
    var annotations = _getDescendantsNS(node, 'Annotation', com);
    if (annotations.length === 0) return undefined;

    return annotations.map(function (a) {
      return {
        id: getAttrValue(a, 'id'),
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
    var ref = _getFirstChildNS(node, 'Ref');
    if ((ref === undefined) || (ref === null)) return undefined;
    return getAttrValue(ref, 'id');
  }


  function mapBaseReference (e) {
    return [
      'urn:sdmx:org.sdmx.infomodel.',
      getAttrValue(e, 'package'),
      '.',
      getAttrValue(e, 'class'),
      '=',
      getAttrValue(e, 'agencyID'),
      ':'
    ].join('');
  }


  function getURNReference (node) {
    var urn = getElementText(node, 'URN', null);
    if (urn !== undefined) return urn;

    var ref = _getFirstChild(node, 'Ref');
    if (ref === undefined) return undefined;

    if (getAttrValue(ref, 'maintainableParentID') !== undefined) {
      return mapBaseReference(ref) +
        [
          getAttrValue(ref, 'maintainableParentID'),
          '(',
          getAttrValue(ref, 'maintainableParentVersion'),
          ').',
          getAttrValue(ref, 'id'),
        ].join('');
    }

    return mapBaseReference(ref) +
      [
        getAttrValue(ref, 'id'),
        '(',
        getAttrValue(ref, 'version'),
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
    itemScheme.isPartial = toBoolean(getAttrValue(e, 'isPartial'));
    itemScheme.leveled = toBoolean(getAttrValue(e, 'leveled')); // Hierarchy

    var itemURN = [
      'urn:sdmx:org.sdmx.infomodel',
      '.', itemScheme.package,
      '', itemName,
      '=', itemScheme.agencyID,
      ':', itemScheme.id,
      '(', itemScheme.version, ')'
    ].join('');

    function mapItems (node, hierarchy) {
      var items = _getChildrenNS(node, itemName);
      if (items.length === 0) return undefined;

      function mapItem (e) {
        var item = mapVersionableArtefact(e); // HierarchicalCode = versionable
        item.agencyID = itemScheme.agencyID;
        item.maintainableParentID = itemScheme.id;
        item.maintainableParentVersion = itemScheme.version;

        if (item.urn === undefined) {
          item.urn = itemURN + hierarchy + '.' + item.id;
        }

        item.parent = mapLocalReference(_getFirstChildNS(e, 'parent'));
        item.items = mapItems(e, hierarchy + '.' + item.id);

        if (e.localName === 'Concept') {
          item.isoConceptReference = mapISOConceptReference(_getFirstChildNS(e, 'ISOConceptReference'));
          item.coreRepresentation = mapRepresentation(_getFirstChildNS(e, 'CoreRepresentation'));
        }

        if (e.localName === 'HierarchicalCode') {
          item.code = mapReference(_getFirstChildNS(e, 'Code'), 'code', 'code');
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
      result.structure = mapReference(_getFirstChildNS(e, 'Structure'), 'structure', 'datastructure');
    }

    if (e.localName === 'Categorisation') {
      result.source = mapReference(_getFirstChildNS(e, 'Source'), 'source', 'dataflow');
      result.target = mapReference(_getFirstChildNS(e, 'Target'), 'target', 'category');
    }

    return result;
  }

//------------------------------------------------------------------------------

    // Functions for mapping representations

  function mapTextFormat (e) {
    if ((e === undefined) || (e === null)) return undefined;

    return {
      textType: getAttrValue(e, 'textType'),
      isSequence: toBoolean(getAttrValue(e, 'isSequence')),
      interval: toNumeric(getAttrValue(e, 'interval')),
      startValue: toNumeric(getAttrValue(e, 'startValue')),
      endValue: toNumeric(getAttrValue(e, 'endValue')),
      timeInterval: getAttrValue(getAttrValue(e, 'timeInterval')),
      startTime: toNumeric(getAttrValue(e, 'startTime')),
      endTime: toNumeric(getAttrValue(e, 'endTime')),
      minLength: toNumeric(getAttrValue(e, 'minLength')),
      maxLength: toNumeric(getAttrValue(e, 'maxLength')),
      minValue: toNumeric(getAttrValue(e, 'minValue')),
      maxValue: toNumeric(getAttrValue(e, 'maxValue')),
      decimals: toNumeric(getAttrValue(e, 'decimals')),
      pattern: getAttrValue(e, 'pattern'),
      isMultiLingual: toBoolean(getAttrValue(e, 'isMultiLingual'))
    };
  }


  function mapRepresentation (e) {
    if ((e === undefined) || (e === null)) return undefined;

    return {
      textFormat: mapTextFormat(_getFirstChildNS(e, 'TextFormat')),
      enumeration: mapReference(_getFirstChildNS(e, 'Enumeration'), 'representation', 'codelist'),
      enumerationFormat: mapTextFormat(_getFirstChildNS(e, 'EnumerationFormat'))
    };
  }

//------------------------------------------------------------------------------

  function mapHierarchicalCodelist (e) {
    // TODO add levels
    var hcl = mapMaintainableArtefact(e);

    var hierarchies = _getChildrenNS(e, 'Hierarchy');
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
