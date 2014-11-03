//   sdmxmllib.js 0.2.0
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {

    var root = typeof exports !== "undefined" && exports !== null ? exports : this;

    var lib = {
        request: {},
        response: {}
    };

    lib.version = '0.2.0';

//==============================================================================

    lib.mapSDMXMLResponse = function (doc) {
        var result = {};

        mapHeader(doc, result);
        mapErrors(doc, result);

        result.codelists = mapItemSchemes(doc, 'Codelist', 'Code', 'codes');
        result.conceptSchemes = mapItemSchemes(doc, 'ConceptScheme', 'Concept', 'concepts');
        result.agencySchemes = mapItemSchemes(doc, 'AgencyScheme', 'Agency', 'agencies');
        result.categorySchemes = mapItemSchemes(doc, 'CategoryScheme', 'Category', 'categories');
        result.dataflows = mapSimpleMaintainables(doc, 'Dataflow');
        result.categorisations = mapSimpleMaintainables(doc, 'Categorisation');
        result.dataStructures = mapDataStructures(doc);
        result.hierarchicalCodelists = mapHierarchicalCodelists(doc);

        return result;
    };

//------------------------------------------------------------------------------

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


    function getAttributeValue (node, name) {
        if ((node === undefined) || (node === null)) return undefined;
        if (node.getAttribute(name) === null) return undefined;
        return node.getAttribute(name);
    }


    function getNumericAttributeValue(node, name) {
        var value = getAttributeValue(node, name);
        if (value === undefined) return undefined;
        return +value;
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

//------------------------------------------------------------------------------

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
                code: getNumericAttributeValue(error, 'code'),
                message: getElementText(error, 'Text')
            });
        });
    }

//------------------------------------------------------------------------------

    function mapIdentifiableArtefact (node) {
        var result = {};
        result.id = getAttributeValue(node, 'id');
        result.urn = getAttributeValue(node, 'urn');
        result.uri = getAttributeValue(node, 'uri');
        result.annotations = mapAnnotations(node);
        return result;
    }


    function mapNameableArtefact (node) {
        var result = mapIdentifiableArtefact(node);
        result.name = getElementText(node, 'Name');
        result.description = getElementText(node, 'Description');
        return result;
    }


    function mapVersionableArtefact (node) {
        var result = mapNameableArtefact(node);
        result.validFrom = getAttributeValue(node, 'validFrom');
        result.validTo = getAttributeValue(node, 'validTo');
        return result;
    }


    function mapMaintainableArtefact (node) {
        var result = mapVersionableArtefact(node);
        result.isFinal = getBooleanAttributeValue(node, 'isFinal');
        result.isExternalReference = getBooleanAttributeValue(node, 'isExternalReference');
        result.structureURL = getAttributeValue(node, 'structureURL');
        result.serviceURL = getAttributeValue(node, 'serviceURL');
        return result;
    }

//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------

    function mapLocalReference (node) {
        if ((node === undefined) || (node === null)) return undefined;
        return getAttributeValue(node.querySelector('Ref'), 'id');
    }


    function mapBaseReference (node) {
        return [
            'urn:sdmx:org.sdmx.infomodel.',
            getAttributeValue(node, 'package'),
            '.',
            getAttributeValue(node, 'class'),
            '=',
            getAttributeValue(node, 'agencyID'),
            ':'
        ].join('');
    }


    function mapItemReference (node) {
        if ((node === undefined) || (node === null)) return undefined;
        if (node.querySelector('URN')) return node.querySelector('URN').textContent;

        var ref = node.querySelector('Ref');
        if (ref) {
            return mapBaseReference(ref) +
                [
                    getAttributeValue(ref, 'maintainableParentID'),
                    '(',
                    getAttributeValue(ref, 'maintainableParentVersion'),
                    ').',
                    getAttributeValue(ref, 'id'),
                ].join('');
        }

        return undefined;
    }


    function mapReference (node) {
        if ((node === undefined) || (node === null)) return undefined;
        if (node.querySelector('URN')) return node.querySelector('URN').textContent;

        var ref = node.querySelector('Ref');
        if (ref) {
            return mapBaseReference(ref) +
                [
                    getAttributeValue(ref, 'id'),
                    '(',
                    getAttributeValue(ref, 'version'),
                    ')'
                ].join('');
        }

        return undefined;
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

    function mapItemSchemes (doc, schemeNameXML, itemNameXML, itemArrayName) {
        function mapItems (node) {
            var items = [].slice.call(node.querySelectorAll(itemNameXML));
            if (items.length === 0) return undefined;
            return items.filter(function (i) { return i.parentNode === node; } ).map(mapItem);
        }

        function mapItem (node) {
            var item = mapVersionableArtefact(node); // HierarchicalCode = versionable
            item.parent = mapLocalReference(node.querySelector('parent'));
            item[itemArrayName] = mapItems(node);

            if (itemNameXML === 'Concept') {
                item.isoConceptReference = mapISOConceptReference(node.querySelector('ISOConceptReference'));
                item.coreRepresentation = mapRepresentation(node.querySelector('CoreRepresentation'));
            }

            if (itemNameXML === 'HierarchicalCode') {
                item.code = mapItemReference(node.querySelector('Code'));
            }

            return item;
        }

        var itemSchemes = [].slice.call(doc.querySelectorAll(schemeNameXML));
        if (itemSchemes.length === 0) return undefined;

        return itemSchemes.map(function (schemenode) {
            var itemScheme = mapMaintainableArtefact(schemenode);
            itemScheme.isPartial = getBooleanAttributeValue(schemenode, 'isPartial');
            itemScheme.leveled = getBooleanAttributeValue(schemenode, 'leveled'); // Hierarchy
            itemScheme[itemArrayName] = mapItems(schemenode);
            return itemScheme;
        });
    }


    function mapSimpleMaintainables(doc, nameXML) {
        var artefacts = [].slice.call(doc.querySelectorAll(nameXML));
        if (artefacts.length === 0) return undefined;

        return artefacts.map(function (artefactnode) {
            var artefact = mapMaintainableArtefact(artefactnode);

            if (nameXML === 'Dataflow') {
                artefact.structure = mapReference(artefactnode.querySelector('Structure'));
            }

            if (nameXML === 'Categorisation') {
                artefact.source = mapReference(artefactnode.querySelector('Source'));
                artefact.target = mapReference(artefactnode.querySelector('Target'));
            }

            return artefact;
        });
    }

//------------------------------------------------------------------------------

    function mapTextFormat (node) {
        if ((node === undefined) || (node === null)) return undefined;

        return {
            textType: getAttributeValue(node, 'textType'),
            isSequence: getBooleanAttributeValue(node, 'isSequence'),
            interval: getNumericAttributeValue(node, 'interval'),
            startValue: getNumericAttributeValue(node, 'startValue'),
            endValue: getNumericAttributeValue(node, 'endValue'),
            timeInterval: getAttributeValue(node, 'timeInterval'),
            startTime: getNumericAttributeValue(node, 'startTime'),
            endTime: getNumericAttributeValue(node, 'endTime'),
            minLength: getNumericAttributeValue(node, 'minLength'),
            maxLength: getNumericAttributeValue(node, 'maxLength'),
            minValue: getNumericAttributeValue(node, 'minValue'),
            maxValue: getNumericAttributeValue(node, 'maxValue'),
            decimals: getNumericAttributeValue(node, 'decimals'),
            pattern: getAttributeValue(node, 'pattern'),
            isMultiLingual: getBooleanAttributeValue(node, 'isMultiLingual')
        };
    }


    function mapRepresentation (node) {
        if ((node === undefined) || (node === null)) return undefined;

        return {
            textFormat: mapTextFormat(node.querySelector('TextFormat')),
            enumeration: mapReference(node.querySelector('Enumeration')),
            enumerationFormat: mapTextFormat(node.querySelector('EnumerationFormat'))
        };
    }


    function mapComponent (node) {
        var comp = mapIdentifiableArtefact(node);
        comp.conceptIdentity = mapItemReference( node.querySelector('ConceptIdentity') );
        comp.localRepresentation = mapRepresentation(node.querySelector('LocalRepresentation'));
        return comp;
    }


    function mapAttributeRelationship (node) {
        var ar = node.querySelector('AttributeRelationship');
        if ((ar === undefined) || (ar === null)) return undefined;

        result = {};

        var dimensions = [].slice.call(ar.querySelectorAll('Dimension'));

        if (0 < dimensions.length) {
            result.dimensions = dimensions.map(function (node) { return mapLocalReference(node); } );
            return result;
        }

        result.primaryMeasure = mapLocalReference(ar.querySelector('PrimaryMeasure'));
        result.group = mapLocalReference(ar.querySelector('Group'));

        return result;
    }


    function mapDataStructures (doc) {
        var dsds = [].slice.call(doc.querySelectorAll('DataStructure'));
        if (dsds.length === 0) return undefined;

        return dsds.map(function (dsdnode)  {
            var dsd = mapMaintainableArtefact(dsdnode);

            var dims = [].slice.call(dsdnode.querySelectorAll(
                'DimensionList > Dimension, DimensionList > TimeDimension, DimensionList > MeasureDimension'
            ));

            dsd.dimensions = dims.map(function (node) {
                var dim = mapComponent(node);
                dim.position = getNumericAttributeValue(node, 'position');
                return dim;
            });

            var groups = [].slice.call(dsdnode.querySelectorAll('Group[id]'));
            dsd.groups = groups.map(function (node) {
                var grp = mapIdentifiableArtefact(node);
                var dims = [].slice.call(node.querySelectorAll('GroupDimension > DimensionReference'));
                grp.dimensions = dims.map(function (node) {
                    return mapLocalReference(node);
                });
                grp.attachmentConstraint = mapReference(node.querySelector('AttachmentConstraint'));
                return grp;
            });

            var attrs = [].slice.call(dsdnode.querySelectorAll('AttributeList > Attribute'));

            dsd.attributes = attrs.map(function (node) {
                var attr = mapComponent(node);
                attr.assignmentStatus = getAttributeValue(node, 'assignmentStatus');
                attr.attributeRelationship = mapAttributeRelationship(node);
                return attr;
            });

            var measures = [].slice.call(dsdnode.querySelectorAll('MeasureList > PrimaryMeasure'));

            dsd.measures = measures.map(function (node) {
                return mapComponent(node);
            });

            return dsd;
        });
    }

//------------------------------------------------------------------------------

    function mapHierarchicalCodelists (doc) {
        var hcls = [].slice.call(doc.querySelectorAll('HierarchicalCodelist'));
        if (hcls.length === 0) return undefined;

        // TODO add levels
        return hcls.map(function (node)  {
            var hcl = mapMaintainableArtefact(node);
            hcl.hierarchies = mapItemSchemes(node, 'Hierarchy', 'HierarchicalCode', 'hierarchicalCodes');
            return hcl;
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
