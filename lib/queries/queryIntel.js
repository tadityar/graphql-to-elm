"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var graphql_1 = require("graphql");
var utils_1 = require("../utils");
exports.readQueryIntel = function (src, schema, options) {
    return utils_1.readFile(src)
        .then(function (query) {
        options.log("processing query " + src);
        query = query.trim().replace(/\r\n/g, "\n");
        return __assign(__assign({}, exports.getQueryIntel(query, schema)), { src: src });
    })["catch"](function (error) {
        throw new Error("processing query " + src + "\n" + error.toString());
    });
};
exports.getQueryIntel = function (query, schema) {
    var _a = getOperationsInfo(query, schema), operationsInfo = _a.operationsInfo, fragments = _a.fragments;
    var operations = operationsInfo.map(getOperation(schema));
    var intel = {
        src: "",
        query: query,
        fragments: fragments,
        operations: operations
    };
    // console.log("query intel", JSON.stringify(intel, null, "  "));
    return intel;
};
var getOperationsInfo = function (query, schema) {
    var queryDocument = parseAndValidate(query, schema);
    var fragmentNodes = {};
    var fragments = [];
    graphql_1.visit(queryDocument, {
        FragmentDefinition: function (node) {
            var location = assertLocation(node.loc);
            fragmentNodes[node.name.value] = node;
            fragments.push({
                name: node.name.value,
                query: utils_1.removeIndents(query.substring(location.start, location.end))
            });
        }
    });
    var operationsInfo = [];
    graphql_1.visit(queryDocument, {
        OperationDefinition: function (node) {
            var location = assertLocation(node.loc);
            operationsInfo.push({
                query: utils_1.removeIndents(query.substring(location.start, location.end)),
                node: node,
                fragmentNames: []
            });
        }
    });
    operationsInfo.forEach(function (info) {
        info.node = graphql_1.visit(info.node, {
            FragmentSpread: function (node) {
                utils_1.addOnce(node.name.value, info.fragmentNames);
                var fragmentNode = fragmentNodes[node.name.value];
                return {
                    kind: graphql_1.Kind.INLINE_FRAGMENT,
                    typeCondition: fragmentNode.typeCondition,
                    directives: fragmentNode.directives,
                    selectionSet: fragmentNode.selectionSet,
                    loc: fragmentNode.loc
                };
            }
        });
    });
    var findFragmentByName = function (name) {
        return utils_1.assertOk(fragments.find(function (fragment) { return fragment.name === name; }));
    };
    operationsInfo.forEach(function (info) {
        var fragmentQueries = info.fragmentNames
            .map(findFragmentByName)
            .map(function (fragment) { return fragment.query; });
        var query = "" + info.query + fragmentQueries.join("");
        parseAndValidate(query, schema);
    });
    return { operationsInfo: operationsInfo, fragments: fragments };
};
var getOperation = function (schema) { return function (info) { return ({
    type: info.node.operation,
    name: info.node.name ? info.node.name.value : undefined,
    query: info.query,
    fragmentNames: info.fragmentNames,
    inputs: getInputs(info.node, schema),
    outputs: getOutputs(info.node, schema)
}); }; };
var assertLocation = function (location) {
    return utils_1.assertOk(location, "no query location");
};
var parseAndValidate = function (query, schema) {
    var document = graphql_1.parse(query);
    var errors = graphql_1.validate(schema, document);
    if (errors.length > 0) {
        throw errors[0];
    }
    return document;
};
var getInputs = function (node, schema) {
    return node.variableDefinitions && node.variableDefinitions.length > 0
        ? {
            typeName: (node.name ? node.name.value : "") + "Variables",
            kind: "object",
            fields: node.variableDefinitions.map(function (node) {
                return nodeToInputField(node, schema);
            })
        }
        : undefined;
};
var nodeToInputField = function (node, schema) {
    return mapInputField({
        name: node.variable.name.value,
        type: getInputType(node, schema),
        extensions: null
    }, schema);
};
var mapInputField = function (field, schema) {
    var namedType = graphql_1.getNamedType(field.type);
    var nullableType = graphql_1.getNullableType(field.type);
    var typeName = namedType.name;
    var value = undefined;
    if (namedType instanceof graphql_1.GraphQLInputObjectType) {
        var fields_1 = namedType.getFields();
        value = {
            kind: "object",
            typeName: typeName,
            fields: Object.keys(fields_1).map(function (key) { return mapInputField(fields_1[key], schema); })
        };
    }
    else if (namedType instanceof graphql_1.GraphQLScalarType) {
        value = {
            kind: "scalar",
            typeName: typeName
        };
    }
    else if (namedType instanceof graphql_1.GraphQLEnumType) {
        value = {
            kind: "enum",
            typeName: typeName
        };
    }
    return {
        name: field.name,
        value: utils_1.assertOk(value, "unhandled query input of type " + field.type),
        valueWrapper: field.type instanceof graphql_1.GraphQLNonNull ? false : "optional",
        valueListItemWrapper: nullableType instanceof graphql_1.GraphQLList
            ? nullableType.ofType instanceof graphql_1.GraphQLNonNull
                ? "non-null"
                : "optional"
            : false
    };
};
var getInputType = function (node, schema) {
    return graphql_1.assertInputType(graphql_1.typeFromAST(schema, 
    // @ts-ignore
    node.type));
};
exports.isFragmentOutput = function (output) {
    switch (output.kind) {
        case "object":
        case "fragmented":
        case "fragmented-on":
        case "scalar":
        case "enum":
        case "typename":
            return false;
        case "object-fragment":
        case "fragmented-fragment":
        case "empty-fragment":
        case "other-fragment":
            return true;
    }
};
exports.isNonFragmentOutput = function (output) { return !exports.isFragmentOutput(output); };
exports.isTypenameOutput = function (output) { return output.kind === "typename"; };
exports.isObjectFragmentOutput = function (output) { return output.kind === "object-fragment"; };
exports.assertNonFragmentOutput = function (output) {
    if (!exports.isNonFragmentOutput(output)) {
        throw Error("not a QueryNonFragmentOutput");
    }
    return output;
};
exports.assertObjectFragmentOutput = function (output) {
    if (!exports.isObjectFragmentOutput(output)) {
        throw Error("not a QueryObjectFragmentOutput");
    }
    return output;
};
var getOutputs = function (node, schema) {
    var rootOutput = undefined;
    var nodeInfoStack = [];
    var getNodeInfo = function () { return nodeInfoStack[nodeInfoStack.length - 1]; };
    var addFieldToParent = function (node, name, type, output) {
        var parentNodeInfo = getNodeInfo();
        if (!parentNodeInfo) {
            throw Error("can not add output field to parent");
        }
        var nullableType = graphql_1.getNullableType(type);
        var hasDirective = node.directives ? node.directives.length > 0 : false;
        var field = {
            name: name,
            value: output,
            valueWrapper: type instanceof graphql_1.GraphQLNonNull
                ? hasDirective
                    ? "non-null-optional"
                    : false
                : hasDirective
                    ? "optional"
                    : "nullable",
            valueListItemWrapper: nullableType instanceof graphql_1.GraphQLList
                ? nullableType.ofType instanceof graphql_1.GraphQLNonNull
                    ? "non-null"
                    : "nullable"
                : false
        };
        parentNodeInfo.fields.push(field);
    };
    var addFragmentToParent = function (output) {
        var parentNodeInfo = getNodeInfo();
        if (!parentNodeInfo) {
            throw Error("can not add output fragment to parent");
        }
        parentNodeInfo.fragments.push(output);
    };
    var typeInfo = new graphql_1.TypeInfo(schema);
    var pushNodeInfo = function () {
        nodeInfoStack.push({
            fields: [],
            fragments: []
        });
    };
    var popNodeInfo = function () { return utils_1.assertOk(nodeInfoStack.pop()); };
    var visitor = {
        enter: {
            OperationDefinition: function () {
                pushNodeInfo();
            },
            Field: function () {
                pushNodeInfo();
            },
            InlineFragment: function () {
                pushNodeInfo();
            }
        },
        leave: {
            OperationDefinition: function (node) {
                var nodeInfo = popNodeInfo();
                var name = "";
                var type = graphql_1.assertCompositeType(typeInfo.getType());
                rootOutput = getCompositeOutput(name, type, nodeInfo.fields, nodeInfo.fragments, schema);
                rootOutput.typeName = "" + (node.name ? node.name.value : "") + utils_1.firstToUpperCase(rootOutput.typeName);
            },
            Field: function (node) {
                var nodeInfo = popNodeInfo();
                var name = node.alias ? node.alias.value : node.name.value;
                var type = graphql_1.assertType(typeInfo.getType());
                var output = getOutput(name, type, nodeInfo.fields, nodeInfo.fragments, schema);
                addFieldToParent(node, name, type, output);
            },
            InlineFragment: function () {
                var nodeInfo = popNodeInfo();
                var type = graphql_1.assertCompositeType(typeInfo.getType());
                var typeName = type.name;
                var result = getFieldsOrFragments(schema, type, nodeInfo.fields, nodeInfo.fragments);
                if ("fields" in result) {
                    addFragmentToParent({
                        kind: "object-fragment",
                        type: type,
                        typeName: typeName,
                        fields: result.fields
                    });
                }
                else {
                    addFragmentToParent({
                        kind: "fragmented-fragment",
                        type: type,
                        typeName: typeName,
                        fragments: result.fragments
                    });
                }
            }
        }
    };
    graphql_1.visit(node, graphql_1.visitWithTypeInfo(typeInfo, visitor));
    return utils_1.assertOk(rootOutput, "no root output");
};
var getOutput = function (name, type, fields, fragments, schema) {
    var namedType = graphql_1.getNamedType(type);
    var typeName = namedType.name;
    if (graphql_1.isCompositeType(namedType)) {
        return getCompositeOutput(name, namedType, fields, fragments, schema);
    }
    else if (namedType instanceof graphql_1.GraphQLScalarType) {
        if (name === "__typename") {
            return {
                typeName: typeName,
                kind: "typename"
            };
        }
        else {
            return {
                typeName: typeName,
                kind: "scalar"
            };
        }
    }
    else if (namedType instanceof graphql_1.GraphQLEnumType) {
        return {
            typeName: typeName,
            kind: "enum"
        };
    }
    throw Error("unhandled query output of type " + type);
};
var getCompositeOutput = function (name, type, fields, fragments, schema) {
    var typeName = type.name;
    var result = getFieldsOrFragments(schema, type, fields, fragments);
    if ("fields" in result) {
        return {
            kind: "object",
            typeName: typeName,
            fields: result.fields
        };
    }
    else {
        return {
            kind: "fragmented",
            typeName: typeName,
            fragments: result.fragments
        };
    }
};
var getFragment = function (type, fields, fragments, schema) {
    var namedType = graphql_1.getNamedType(type);
    var typeName = namedType.name;
    var result = getFieldsOrFragments(schema, type, fields, fragments);
    if ("fields" in result) {
        return {
            kind: "object-fragment",
            type: type,
            typeName: typeName,
            fields: result.fields
        };
    }
    else {
        return {
            kind: "fragmented-fragment",
            type: type,
            typeName: typeName,
            fragments: result.fragments
        };
    }
};
var getFieldsOrFragments = function (schema, type, fields, inFragments) {
    var typeName = type.name;
    var typenameFields = fields.filter(function (field) {
        return exports.isTypenameOutput(field.value);
    });
    var possibleFragmentTypes = graphql_1.isAbstractType(type)
        ? schema.getPossibleTypes(type)
        : [];
    if (typenameFields.length > 0) {
        if (possibleFragmentTypes.length > 0) {
            var fragmentTypeNames_1 = getAllIncludedFragmentTypes(inFragments, schema).map(function (type) { return type.name; });
            var missingFragmentTypes = possibleFragmentTypes.filter(function (type) { return !fragmentTypeNames_1.includes(type.name); });
            missingFragmentTypes.forEach(function (type) {
                return inFragments.push({
                    kind: "object-fragment",
                    type: type,
                    typeName: type.name,
                    fields: []
                });
            });
        }
        if (inFragments.length > 0) {
            fields = fields.filter(function (field) { return !typenameFields.includes(field); });
            inFragments.forEach(function (fragment) {
                var _a;
                if (fragment.kind === "object-fragment") {
                    (_a = fragment.fields).push.apply(_a, typenameFields);
                }
            });
        }
    }
    var includedFragmentTypes = getAllIncludedFragmentTypes(inFragments, schema);
    var hasAllPossibleTypes = possibleFragmentTypes.every(function (type) {
        return includedFragmentTypes.includes(type);
    });
    if (inFragments.length === 1 && hasAllPossibleTypes) {
        var fragment = inFragments[0];
        if (fragment.kind === "object-fragment") {
            fields = __spreadArrays(fields, fragment.fields);
            inFragments = [];
        }
    }
    var fragments = inFragments;
    if (fields.length === 0 && fragments.length > 0) {
        if (!hasAllPossibleTypes) {
            fragments.push({
                kind: "empty-fragment",
                typeName: typeName
            });
        }
    }
    if (fields.length > 0 && fragments.length > 0) {
        if (!hasAllPossibleTypes) {
            fragments.push({
                kind: "other-fragment",
                typeName: typeName
            });
        }
        var onField = {
            name: "on",
            value: {
                kind: "fragmented-on",
                typeName: "On" + typeName,
                fragments: fragments
            },
            valueWrapper: false,
            valueListItemWrapper: false
        };
        fields = __spreadArrays(fields, [onField]);
        fragments = [];
    }
    if (fields.length > 0 && fragments.length === 0) {
        return { fields: fields };
    }
    if (fields.length === 0 && fragments.length > 0) {
        return { fragments: fragments };
    }
    throw Error("no fields or fragments");
};
var getAllIncludedFragmentTypes = function (fragments, schema) {
    return getAllIncludedTypes(fragments.map(function (fragment) { return fragment.type; }), schema);
};
var getAllIncludedTypes = function (types, schema) {
    var helper = function (collected, type) {
        return graphql_1.isAbstractType(type)
            ? schema.getPossibleTypes(type).reduce(helper, __spreadArrays(collected, [type]))
            : __spreadArrays(collected, [type]);
    };
    return types.reduce(helper, []);
};
// Convert Input types as compatible Output types
var inputValueListItemWrapperAsOutput = function (inputWrapper) {
    switch (inputWrapper) {
        case "optional":
            return "nullable";
        case "non-null":
            return "non-null";
        case false:
            return false;
    }
};
var queryInputFieldAsOutput = function (inputField) {
    switch (inputField.value.kind) {
        case "scalar":
        case "enum":
            return {
                name: inputField.name,
                value: queryInputAsOutput(inputField.value),
                valueWrapper: inputField.valueWrapper,
                valueListItemWrapper: inputValueListItemWrapperAsOutput(inputField.valueListItemWrapper)
            };
            break;
        case "object":
            return {
                name: inputField.name,
                value: queryInputAsOutput(inputField.value),
                valueWrapper: inputField.valueWrapper,
                valueListItemWrapper: inputValueListItemWrapperAsOutput(inputField.valueListItemWrapper)
            };
            break;
    }
};
var queryInputAsOutput = function (input) {
    switch (input.kind) {
        case "object":
            return exports.queryObjectInputAsOutput(input);
        default:
            return {
                kind: input.kind,
                typeName: input.typeName
            };
    }
};
exports.queryObjectInputAsOutput = function (input) {
    return {
        kind: "object",
        typeName: input.typeName,
        fields: input.fields.map(queryInputFieldAsOutput)
    };
};
