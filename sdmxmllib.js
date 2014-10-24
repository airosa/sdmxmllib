//   sdmxmllib.js 0.1.0
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {

    var root = typeof exports !== "undefined" && exports !== null ? exports : this;

    var lib = {
        request: {},
        response: {}
    };

    lib.version = '0.1.0';

//==============================================================================

    lib.mapSDMXMLResponse = function (doc) {
        var result = {};

        mapHeader(doc, result);
        mapErrors(doc, result);

        mapItemSchemes(doc, result, 'Codelist', 'Code', 'codelists', 'codes');
        mapItemSchemes(doc, result, 'ConceptScheme', 'Concept', 'conceptSchemes', 'concepts');
        mapItemSchemes(doc, result, 'AgencyScheme', 'Agency', 'agencySchemes', 'agencies');
        mapDataFlows(doc, result);

        return result;
    };


    function getElementText (ancestor, tag) {
        var element = ancestor.querySelector(tag);
        if (element) return element.textContent;
        return undefined;
    }


    function getElementAttr (ancestor, tag, attr) {
        var element = ancestor.querySelector(tag);
        if (element) return element.getAttribute(attr);
        return undefined;
    }


    function getAttributeValue (doc, name) {
        if (doc.getAttribute(name) === null) return undefined;
        return doc.getAttribute(name);
    }


    function getBooleanAttributeValue (doc, name) {
        var value = getAttributeValue(doc, name);
        if (value) return value === 'true';
        return undefined;
    }


    function mapElementsTextToArray (doc, name) {
        var elements = [].slice.call(doc.querySelector(name));
        if (elements.length === 0) return undefined;

        return elements.map(function (e) {
            return e.textContent;
        });
    }


    function mapHeader (doc, json) {
        var h = doc.querySelector('Header');
        if (h === null) return;

        json.header = {};
        json.header.test = getElementText(h, 'Test') === 'true';
        json.header.id = getElementText(h, 'ID');
        json.header.prepared = getElementText(h, 'Prepared');

        json.header.sender = mapParty(h, 'Sender');
        json.header.receiver = mapParty(h, 'Receiver');
    }


    function mapParty (doc, name) {
        var partydoc = doc.querySelector(name);
        if (partydoc === null) return undefined;

        var party = {};

        party.id = getAttributeValue(partydoc, 'id');
        party.name = getElementText(partydoc, 'Name');
        party.contacts = [];

        var contacts = [].slice.call(partydoc.querySelectorAll('Contact'));

        contacts.forEach(function (contactdoc) {
            var contact = {};
            contact.name = getElementText(contactdoc, 'Name');
            contact.department = getElementText(contactdoc, 'Department');
            contact.role = getElementText(contactdoc, 'Role');
            contact.telephone = mapElementsTextToArray(contactdoc, 'Telephone');
            contact.fax = mapElementsTextToArray(contactdoc, 'Fax');
            contact.uri = mapElementsTextToArray(contactdoc, 'URI');
            contact.email = mapElementsTextToArray(contactdoc, 'Emails');
            party.contacts.push(contact);
        });


        return party;
    }


    function mapErrors (doc, json) {
        var errors = [].slice.call(doc.querySelectorAll('ErrorMessage'));
        if (errors.length === 0) return;

        json.errors = [];

        errors.forEach(function (error) {
            json.errors.push({
                code: +getAttributeValue(error, 'code'),
                message: getElementText(error, 'Text')
            });
        });
    }

    // TODO refactor maps to any artefact
    function mapIdentifiableArtefact (doc, json) {
        json.id = getAttributeValue(doc, 'id');
        json.urn = getAttributeValue(doc, 'urn');
        json.uri = getAttributeValue(doc, 'uri');
        json.annotations = mapAnnotations(doc);
    }


    function mapNameableArtefact (doc, json) {
        mapIdentifiableArtefact(doc, json);
        json.name = getElementText(doc, 'Name');
        json.description = getElementText(doc, 'Description');
    }


    function mapMaintainableArtefact (doc, json) {
        mapNameableArtefact(doc, json);
        json.validFrom = getAttributeValue(doc, 'validFrom');
        json.validTo = getAttributeValue(doc, 'validTo');
        json.isFinal = getBooleanAttributeValue(doc, 'isFinal');
        json.isExternalReference = getBooleanAttributeValue(doc, 'isExternalReference');
        json.structureURL = getAttributeValue(doc, 'structureURL');
        json.serviceURL = getAttributeValue(doc, 'serviceURL');
    }


    function mapAnnotations (doc) {
        var annotations = [].slice.call(doc.querySelectorAll('Annotation'));
        if (annotations.length === 0) return undefined;

        return annotations.map(function (a) {
            return {
                title: getElementText(a, 'AnnotationTitle'),
                type: getElementText(a, 'AnnotationType'),
                url: getElementText(a, 'AnnotationURL'),
                id: getAttributeValue(a, 'id'),
                text: getElementText(a, 'AnnotationText')
            };
        });
    }


    function mapReference (doc) {
        if ((doc === undefined) || (doc === null)) return undefined;
        if (doc.querySelector('URN')) return doc.querySelector('URN').textContent;

        var ref = doc.querySelector('Ref');
        if (ref) {
            return [
                'urn:sdmx:org.sdmx.infomodel.',
                getAttributeValue(ref, 'package'),
                '.',
                getAttributeValue(ref, 'class'),
                '=',
                getAttributeValue(ref, 'agencyID'),
                ':',
                getAttributeValue(ref, 'id'),
                '(',
                getAttributeValue(ref, 'version'),
                ')'
            ].join('');
        }

        return undefined;
    }


    function mapLocalReference (doc) {
        if ((doc === undefined) || (doc === null)) return undefined;
        var ref = doc.querySelector('Ref');
        if (ref === undefined) return undefined;
        return getAttributeValue(ref, 'id');
    }


    function mapItem (doc) {
        var item = {};
        mapNameableArtefact(doc, item);
        item.parent = mapLocalReference(doc.querySelector('parent'));
        // Concept
        if (doc.querySelector('ISOConceptReference')) {
            item.isoConceptReference = {
                conceptAgency: getElementText(doc, 'ConceptAgency'),
                conceptSchemeID: getElementText(doc, 'ConceptSchemeID'),
                conceptID: getElementText(doc, 'ConceptID')
            };
        }
        return item;
    }


    function mapItemSchemes (doc, json, schemeNameXML, itemNameXML, schemeArrayName, itemArrayName) {
        var itemSchemes = [].slice.call(doc.querySelectorAll(schemeNameXML));
        if (itemSchemes.length === 0) return;

        json[schemeArrayName] = itemSchemes.map(function (itemdoc) {
            var itemScheme = {};
            mapMaintainableArtefact(itemdoc, itemScheme);
            itemScheme.isPartial = getBooleanAttributeValue(itemdoc, 'isPartial');
            var items = [].slice.call(itemdoc.querySelectorAll(itemNameXML));
            itemScheme[itemArrayName] = items.map(mapItem);
            return itemScheme;
        });
    }


    function mapDataFlows (doc, json) {
        var artefacts = [].slice.call(doc.querySelectorAll('Dataflow'));
        if (artefacts.length === 0) return;

        json.dataFlows = artefacts.map(function (artefact) {
            var dataFlow = {};
            mapMaintainableArtefact(artefact, dataFlow);
            dataFlow.structure = mapReference(artefact);
            return dataFlow;
        });

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
