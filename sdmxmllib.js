//   sdmxmllib.js 0.4.1
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {

    var root = typeof exports !== "undefined" && exports !== null ? exports : this;

    var lib = {
        request: {},
        response: {}
    };

    lib.version = '0.4.1';

//==============================================================================

    // Main (only) interface method

    lib.mapSDMXMLResponse = function (doc, url) {
        var resourceClasses = getResourceClasses(url);
        var identifiables = {};

        var response = {
            header: mapHeader(doc.querySelector('Header')),
            resources: [],
            references: {},
            //errors: mapElements(doc.querySelectorAll('ErrorMessage'))
        };

        var structures = doc.querySelector('Structures');
        if (structures === null) return response;

        var children = [].slice.call(structures.children);

        children.forEach(function (c) {
            var elements = [].slice.call(c.children);
            if (elements.length === 0) return undefined;

            elements.forEach(mapElement);
        });

        function mapElement(e) {
            var handler = {
                'Dataflow': mapSimpleMaintainable,
                'Categorisation': mapSimpleMaintainable,
                'CategoryScheme': mapItemScheme,
                'AgencyScheme': mapItemScheme,
                'Codelist': mapItemScheme,
                'ConceptScheme': mapItemScheme,
                'DataStructure': mapDataStructure,
                'HierarchicalCodelist': mapHierarchicalCodelist,
                'ContentConstraint': mapContentConstraint
            }[e.localName];

            if (handler === undefined) {
                console.log('No mapping for ' + e.localName);
                return undefined;
            }

            var artefact = handler(e, identifiables);
            identifiables[artefact.urn] = artefact;

            if (-1 < resourceClasses.indexOf(e.localName)) {
                response.resources.push(artefact);
            } else {
                response.references[artefact.urn] = artefact;
            }
        }

        processResponse(identifiables);

        return response;
    };

//------------------------------------------------------------------------------

    // Set of low level functions for getting element text and attributes

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


    function getBooleanAttributeValue (node, name) {
        var value = getAttributeValue(node, name);
        if (value) return value === 'true';
        return undefined;
    }


    function mapElementsTextToArray (node, name) {
        var elements = [].slice.call(node.querySelector(name));
        if (elements.length === 0) return undefined;

        return elements.map(function (e) {
            return e.textContent;
        });
    }

//------------------------------------------------------------------------------

    // Functions for mapping the header information (only for structure messages)

    function mapHeader (h) {
        if (h === null) return undefined;

        return {
            test: getElementText(h, 'Test') === 'true',
            id: getElementText(h, 'ID'),
            prepared: getElementText(h, 'Prepared'),
            sender: mapParty(h, 'Sender'),
            receiver: mapParty(h, 'Receiver')
        };
    }


    function mapParty (node, name) {
        var partydoc = node.querySelector(name);
        if (partydoc === null) return undefined;

        var party = {};

        party.id = getAttributeValue(partydoc, 'id');
        party.name = getElementText(partydoc, 'Name');

        var contacts = [].slice.call(partydoc.querySelectorAll('Contact'));

        if (0 < contacts.length) {
            party.contacts = contacts.map(function (node) {
                var contact = {};
                contact.name = getElementText(node, 'Name');
                contact.department = getElementText(node, 'Department');
                contact.role = getElementText(node, 'Role');
                contact.telephone = mapElementsTextToArray(node, 'Telephone');
                contact.fax = mapElementsTextToArray(node, 'Fax');
                contact.uri = mapElementsTextToArray(node, 'URI');
                contact.email = mapElementsTextToArray(node, 'Emails');
                return contact;
            });
        }

        return party;
    }


    function mapErrorMessage (e) {
        if (e === null) return undefined;

        return {
            code: getNumericAttributeValue(e, 'code'),
            message: getElementText(e, 'Text')
        };
    }

//------------------------------------------------------------------------------

    // Functions for mapping base artefact (identifiable etc.)

    function mapIdentifiableArtefact (node) {
        return {
            id: getAttributeValue(node, 'id'),
            urn: getAttributeValue(node, 'urn'),
            uri: getAttributeValue(node, 'uri'),
            annotations: mapAnnotations(node)
        };
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

    function mapAnnotations (node) {
        var annotations = [].slice.call(node.querySelectorAll('Annotation'));
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

    // Set of functions for mapping references to artefacts (all map to urns)

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
            return {
                urn: mapBaseReference(ref) +
                    [
                        getAttributeValue(ref, 'maintainableParentID'),
                        '(',
                        getAttributeValue(ref, 'maintainableParentVersion'),
                        ').',
                        getAttributeValue(ref, 'id'),
                    ].join('')
            };
        }

        return undefined;
    }


    function mapReference (node) {
        if ((node === undefined) || (node === null)) return undefined;
        if (node.querySelector('URN')) return node.querySelector('URN').textContent;

        var ref = node.querySelector('Ref');

        if (ref.getAttribute('maintainableParentID')) return mapItemReference(node);

        if (ref) {
            return {
                urn: mapBaseReference(ref) +
                [
                    getAttributeValue(ref, 'id'),
                    '(',
                    getAttributeValue(ref, 'version'),
                    ')'
                ].join('')
            };
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

    // Functions for mapping item scheme like artefacts

    function mapItemScheme (e, identifiables) {
        var itemName = {
            'CategoryScheme': 'Category',
            'Hierarchy': 'HierarchicalCode',
            'Codelist': 'Code',
            'ConceptScheme': 'Concept',
            'AgencyScheme': 'Agency'
        }[e.localName];

        function mapItems (node) {
            var items = [].slice.call(node.querySelectorAll(itemName));
            if (items.length === 0) return undefined;
            // Filter nodes that are belong directly to the parent
            return items.filter(function (i) { return i.parentNode === node; } ).map(mapItem);
        }

        function mapItem (node) {
            var item = mapVersionableArtefact(node); // HierarchicalCode = versionable
            item.parent = mapLocalReference(node.querySelector('parent'));
            item.items = mapItems(node);

            if (node.localName === 'Concept') {
                item.isoConceptReference = mapISOConceptReference(node.querySelector('ISOConceptReference'));
                item.coreRepresentation = mapRepresentation(node.querySelector('CoreRepresentation'));
            }

            if (node.localName === 'HierarchicalCode') {
                item.code = mapItemReference(node.querySelector('Code'));
            }

            identifiables[item.urn] = item;

            return item;
        }

        var itemScheme = mapMaintainableArtefact(e);

        itemScheme.isPartial = getBooleanAttributeValue(e, 'isPartial');
        itemScheme.leveled = getBooleanAttributeValue(e, 'leveled'); // Hierarchy
        itemScheme.items = mapItems(e);

        return itemScheme;
    }

//------------------------------------------------------------------------------

    function mapSimpleMaintainable(node) {
        var artefact = mapMaintainableArtefact(node);

        if (node.localName === 'Dataflow') {
            artefact.structure = mapReference(node.querySelector('Structure'));
        }

        if (node.localName === 'Categorisation') {
            artefact.source = mapReference(node.querySelector('Source'));
            artefact.target = mapReference(node.querySelector('Target'));
        }

        return artefact;
    }

//------------------------------------------------------------------------------

    // Functions for mapping representations

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

//------------------------------------------------------------------------------

    // Functions for mapping DSDs

    function mapComponent (node) {
        var comp = mapIdentifiableArtefact(node);
        comp.conceptIdentity = mapItemReference( node.querySelector('ConceptIdentity') );
        comp.representation = mapRepresentation(node.querySelector('LocalRepresentation'));
        return comp;
    }


    function mapAttributeRelationship (node) {
        var ar = node.querySelector('AttributeRelationship');
        if ((ar === undefined) || (ar === null)) return undefined;

        var result = {};

        var dimensions = [].slice.call(ar.querySelectorAll('Dimension'));

        if (0 < dimensions.length) {
            result.dimensions = dimensions.map(function (node) {
                return mapLocalReference(node);
            });
            return result;
        }

        result.primaryMeasure = mapLocalReference(ar.querySelector('PrimaryMeasure'));
        result.group = mapLocalReference(ar.querySelector('Group'));

        return result;
    }


    function mapDataStructure (e) {
        var dsd = mapMaintainableArtefact(e);

        var dims = [].slice.call(e.querySelectorAll(
            'DimensionList > Dimension, DimensionList > TimeDimension, DimensionList > MeasureDimension'
        ));

        dsd.dimensions = dims.map(function (node) {
            var dim = mapComponent(node);

            //dim.type = node.localName;
            //dim.position = getNumericAttributeValue(node, 'position');

            return dim;
        });

        var groups = [].slice.call(e.querySelectorAll('Group[id]'));

        dsd.groups = groups.map(function (node) {
            var grp = mapIdentifiableArtefact(node);
            var dims = [].slice.call(node.querySelectorAll('GroupDimension > DimensionReference'));

            grp.dimensionReferences = dims.map(function (node) {
                return mapLocalReference(node);
            });
            grp.attachmentConstraint = mapReference(node.querySelector('AttachmentConstraint'));

            return grp;
        });

        var attrs = [].slice.call(e.querySelectorAll('AttributeList > Attribute'));

        dsd.attributes = attrs.map(function (node) {
            var attr = mapComponent(node);

            attr.assignmentStatus = getAttributeValue(node, 'assignmentStatus');
            attr.attributeRelationship = mapAttributeRelationship(node);

            return attr;
        });

        var measures = [].slice.call(e.querySelectorAll('MeasureList > PrimaryMeasure'));

        dsd.measures = measures.map(function (node) {
            var measure = mapComponent(node);
            return measure;
        });

        return dsd;
    }

//------------------------------------------------------------------------------

    function mapHierarchicalCodelist (e, identifiables) {
        // TODO add levels
        var hcl = mapMaintainableArtefact(e);

        var hierarchies = e.querySelectorAll('Hierarchy');
        hcl.items = [].slice.call(hierarchies).map(function (h) {
            console.log(e.localName);
            return mapItemScheme(h, identifiables);
        });

        return hcl;
    }

//------------------------------------------------------------------------------

    // Functions for mapping constraints

    function mapConstraintAttachment (node) {
        if ((node === undefined) || (node === null)) return undefined;

        var result = {};
        // TODO add other attachments
        var dataflows = [].slice.call(node.querySelectorAll('Dataflow'));

        if (0 < dataflows.length) {
            result.dataflows = dataflows.map(function (node) {
                return mapReference(node);
            });
        }

        return result;
    }


    function mapValue (node) {
        return {
            value: node.textContent,
            cascadeValues: getBooleanAttributeValue(node, 'cascadeValues')
        };
    }


    function mapKeyValue (node) {
        var result = {};

        result.id = getAttributeValue(node, 'id');
        result.include = getBooleanAttributeValue(node, 'include');

        var values = [].slice.call(node.querySelectorAll('Value'));
        if (0 < values.length) {
            result.values = values.map(mapValue);
        }

        return result;
    }


    function mapCubeRegion (node) {
        if ((node === undefined) || (node === null)) return undefined;

        var result = {};
        result.include = getBooleanAttributeValue(node, 'include');
        // TODO Add TimeRange and attributes

        var keyValues = [].slice.call(node.querySelectorAll('KeyValue'));
        if (0 < keyValues.length) {
            result.keyValues = keyValues.map(mapKeyValue);
        }

        return result;
    }


    function mapContentConstraint (e) {
        var cc = mapMaintainableArtefact(e);
        cc.type = getAttributeValue(e, 'type');
        cc.constraintAttachment = mapConstraintAttachment(e.querySelector('ConstraintAttachment'));

        // TODO: Add other region types

        var cubeRegions = [].slice.call(e.querySelectorAll('CubeRegion'));

        if (0 < cubeRegions.length) {
            cc.cubeRegions = cubeRegions.map(mapCubeRegion);
        }

        return cc;
    }

//------------------------------------------------------------------------------

    // Functions for pre-processing responses

    function processResponse (identifiables) {
        processCategorisations(identifiables);
    }


    function getResourceClasses (url) {
        var keys = [];

        var resourceMap  = {
            'datastructure': 'DataStructure',
            'metadatastructure': 'MetadataStructure',
            'categoryscheme': 'CategoryScheme',
            'conceptscheme': 'ConceptScheme',
            'codelist': 'Codelist',
            'hierarchicalcodelist': 'HierarchicalCodelist',
            'agencyscheme': 'AgencyScheme',
            'dataproviderscheme': 'DataProviderScheme',
            'dataconsumerscheme': 'DataConsumerScheme',
            'organisationunitscheme': 'OrganisationUnitScheme',
            'dataflow': 'Dataflow',
            'metadataflow': 'Metadataflow',
            'reportingtaxonomy': 'ReportingTaxonomy',
            'provisionagreement': 'ProvisionAgreement',
            'structureset': 'StructureSet',
            'process': 'Process',
            'categorisation': 'Categorisation',
            'contentconstraint': 'ContentConstraint',
            'attachmentconstraint': 'AttachmentConstraint'
        };

        if (0 < url.indexOf('/structure')) {
            keys = Object.keys(resourceMap);
        } else if (0 < url.indexOf('/organisationscheme')) {
            keys = [
                'agencyscheme',
                'dataproviderscheme',
                'dataconsumerscheme',
                'organisationunitscheme'
            ];
        } else {
            keys = Object.keys(resourceMap).filter(function (k) { return 0 < url.indexOf('/' + k); });
        }

        return keys.map(function (k) { return resourceMap[k]; });
    }


    function processCategorisations (identifiables) {
        Object.keys(identifiables).forEach(function (k) {
            var artefact = identifiables[k];

            if (0 < artefact.urn.indexOf('Categorisation')) {
                var category = identifiables[artefact.target.urn];

                if ((category === undefined) || (category === null)) return;
                if (category.references === undefined) category.references = [];

                category.references.push({ urn: artefact.source.urn });
            }
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
