//   sdmxmllib.js 0.4.0
//   http://github.com/airosa/sdmxmllib
//   (c) 2014 Sami Airo
//   sdmxmllib.js may be freely distributed under the MIT license

(function () {

    var root = typeof exports !== "undefined" && exports !== null ? exports : this;

    var lib = {
        request: {},
        response: {}
    };

    lib.version = '0.3.0';

//==============================================================================

    // Main (only) interface method
    lib.mapSDMXMLResponse = function (doc, url) {
        var identifiables = {};

        var rawResponse = {
            header: mapHeader(doc),

            codelists: mapItemSchemes(doc, identifiables, 'Codelist', 'Code', 'codes'),
            conceptSchemes: mapItemSchemes(doc, identifiables, 'ConceptScheme', 'Concept', 'concepts'),
            agencySchemes: mapItemSchemes(doc, identifiables, 'AgencyScheme', 'Agency', 'agencies'),
            categorySchemes: mapItemSchemes(doc, identifiables, 'CategoryScheme', 'Category', 'categories'),

            dataflows: mapSimpleMaintainables(doc, identifiables, 'Dataflows', 'Dataflow'),
            categorisations: mapSimpleMaintainables(doc, identifiables, 'Categorisations', 'Categorisation'),

            dataStructures: mapDataStructures(doc, identifiables),
            hierarchicalCodelists: mapHierarchicalCodelists(doc, identifiables),
            contentConstraints: mapContentConstraints(doc, identifiables),

            errors: mapErrors(doc)
        };

        return processResponse(rawResponse, identifiables, url);
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

    function mapHeader (doc) {
        var h = doc.querySelector('Header');
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


    function mapErrors (doc) {
        var errors = [].slice.call(doc.querySelectorAll('ErrorMessage'));
        if (errors.length === 0) return undefined;

        return errors.map(function (node) {
            return {
                code: getNumericAttributeValue(node, 'code'),
                message: getElementText(node, 'Text')
            };
        });
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

    function mapItemSchemes (doc, identifiables, schemeNameXML, itemNameXML, itemArrayName) {
        function mapItems (node) {
            var items = [].slice.call(node.querySelectorAll(itemNameXML));
            if (items.length === 0) return undefined;
            // Filter nodes that are belong directly to the parent
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

            identifiables[item.urn] = item;

            return { urn: item.urn };
        }

        var itemSchemes = [].slice.call(doc.querySelectorAll(schemeNameXML));
        if (itemSchemes.length === 0) return undefined;

        return itemSchemes.map(function (schemenode) {
            var itemScheme = mapMaintainableArtefact(schemenode);

            itemScheme.isPartial = getBooleanAttributeValue(schemenode, 'isPartial');
            itemScheme.leveled = getBooleanAttributeValue(schemenode, 'leveled'); // Hierarchy
            itemScheme[itemArrayName] = mapItems(schemenode);

            identifiables[itemScheme.urn] = itemScheme;

            return itemScheme;
        });
    }

//------------------------------------------------------------------------------

    function mapSimpleMaintainables(doc, identifiables, parentNameXML, nameXML) {
        var node = doc.querySelector(parentNameXML);
        if ((node === undefined) || (node === null)) return undefined;

        var artefacts = [].slice.call(node.querySelectorAll(nameXML));
        if (artefacts.length === 0) return undefined;

        return artefacts.map(function (node) {
            var artefact = mapMaintainableArtefact(node);

            if (nameXML === 'Dataflow') {
                artefact.structure = mapReference(node.querySelector('Structure'));
            }

            if (nameXML === 'Categorisation') {
                artefact.source = mapReference(node.querySelector('Source'));
                artefact.target = mapReference(node.querySelector('Target'));
            }

            identifiables[artefact.urn] = artefact;

            return artefact;
        });
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


    function mapDataStructures (doc, identifiables) {
        var dsds = [].slice.call(doc.querySelectorAll('DataStructure'));
        if (dsds.length === 0) return undefined;

        return dsds.map(function (dsdnode)  {
            var dsd = mapMaintainableArtefact(dsdnode);

            var dims = [].slice.call(dsdnode.querySelectorAll(
                'DimensionList > Dimension, DimensionList > TimeDimension, DimensionList > MeasureDimension'
            ));

            dsd.dimensions = dims.map(function (node) {
                var dim = mapComponent(node);

                dim.type = node.localName;
                dim.position = getNumericAttributeValue(node, 'position');
                identifiables[dim.urn] = dim;

                return { urn: dim.urn };
            });

            var groups = [].slice.call(dsdnode.querySelectorAll('Group[id]'));

            dsd.groups = groups.map(function (node) {
                var grp = mapIdentifiableArtefact(node);
                var dims = [].slice.call(node.querySelectorAll('GroupDimension > DimensionReference'));

                grp.dimensionReferences = dims.map(function (node) {
                    return mapLocalReference(node);
                });
                grp.attachmentConstraint = mapReference(node.querySelector('AttachmentConstraint'));
                identifiables[grp.urn] = grp;

                return { urn: grp.urn };
            });

            var attrs = [].slice.call(dsdnode.querySelectorAll('AttributeList > Attribute'));

            dsd.attributes = attrs.map(function (node) {
                var attr = mapComponent(node);

                attr.assignmentStatus = getAttributeValue(node, 'assignmentStatus');
                attr.attributeRelationship = mapAttributeRelationship(node);
                identifiables[attr.urn] = attr;

                return { urn: attr.urn };
            });

            var measures = [].slice.call(dsdnode.querySelectorAll('MeasureList > PrimaryMeasure'));

            dsd.measures = measures.map(function (node) {
                var measure = mapComponent(node);
                identifiables[measure.urn] = measure;
                return { urn: measure.urn };
            });

            identifiables[dsd.urn] = dsd;

            return dsd;
        });
    }

//------------------------------------------------------------------------------

    function mapHierarchicalCodelists (doc, identifiables) {
        var hcls = [].slice.call(doc.querySelectorAll('HierarchicalCodelist'));
        if (hcls.length === 0) return undefined;

        // TODO add levels
        return hcls.map(function (node)  {
            var hcl = mapMaintainableArtefact(node);
            var hierarchies = mapItemSchemes(node, identifiables, 'Hierarchy', 'HierarchicalCode', 'hierarchicalCodes');

            hcl.hierarchies = hierarchies.map(function (h) { return { urn: h.urn}; });
            hierarchies.forEach(function (h) { identifiables[h.urn] = h; });

            identifiables[hcl.urn] = hcl;

            return hcl;
        });
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


    function mapContentConstraints (doc, identifiables) {
        var node = doc.querySelector('Constraints');
        if ((node === undefined) || (node === null)) return undefined;

        var ccs = [].slice.call(node.querySelectorAll('ContentConstraint'));
        if (ccs.length === 0) return undefined;

        return ccs.map(function (node) {
            var cc = mapMaintainableArtefact(node);
            cc.type = getAttributeValue(node, 'type');
            cc.constraintAttachment = mapConstraintAttachment(node.querySelector('ConstraintAttachment'));

            // TODO: Add other region types

            var cubeRegions = [].slice.call(node.querySelectorAll('CubeRegion'));

            if (0 < cubeRegions.length) {
                cc.cubeRegions = cubeRegions.map(mapCubeRegion);
            }

            identifiables[cc.urn] = cc;

            return { urn: cc.urn };
        });
    }

//------------------------------------------------------------------------------

    // Functions for pre-processing responses

    function processResponse (resp, identifiables, url) {
        var resources = {};
        var filteredIdentifiables = {};
        var resourceClasses = getResourceClasses(url);
        var resourceClassCount = resourceClasses.length;

        processCategorisations(resp.categorisations, identifiables);

        resourceClasses.forEach(function (c) {
            filterObjectProperties(identifiables, resources, function (k) { return 0 < k.indexOf(c); });
        });

        filterObjectProperties(identifiables, filteredIdentifiables, function (k) {
            for (var i = 0; i < resourceClassCount; i++) {
                if (0 < k.indexOf(resourceClasses[i])) return false;
            }
            return true;
        });

        return {
            resources: resources,
            references: filteredIdentifiables
        };
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


    function filterObjectProperties (source, target, f) {
        Object.keys(source).filter(f).forEach(function (k) { target[k] = source[k]; });
    }


    function processCategorisations (categorisations, identifiables) {
        if ((categorisations === undefined) || (categorisations === null)) return;

        categorisations.forEach(function (c) {
            var category = identifiables[c.target.urn];

            if ((category === undefined) || (category === null)) return;
            if (category.categorisations === undefined) category.categorisations = [];

            category.categorisations.push({ urn: c.source.urn });
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
