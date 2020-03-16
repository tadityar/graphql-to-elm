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
var path = require("path");
var utils_1 = require("../utils");
var queryIntel_1 = require("./queryIntel");
var elmUtils_1 = require("../elmUtils");
exports.queryToElmIntel = function (queryIntel, options) {
    var relativeSrc;
    var dest;
    var module;
    if (!queryIntel.src) {
        relativeSrc = "";
        dest = "./Query.elm";
        module = "Query";
    }
    else {
        relativeSrc = path.relative(options.src, queryIntel.src);
        var srcInfo = path.parse(relativeSrc);
        var moduleParts = srcInfo.dir
            .split(/[\\/]/)
            .filter(function (x) { return !!x; })
            .concat(srcInfo.name)
            .map(elmUtils_1.validModuleName);
        dest = path.resolve.apply(path, __spreadArrays([options.dest], moduleParts)) + ".elm";
        module = moduleParts.join(".");
    }
    var scope = {
        names: getReservedNames(),
        typesBySignature: {},
        fragmentsByName: {},
        encodersByType: {},
        decodersByType: {}
    };
    var operations = queryIntel.operations.map(function (operation) {
        return getOperation(relativeSrc, operation, scope, options);
    });
    var fragments = getFragments(queryIntel.fragments, scope, options);
    fixFragmentNames(operations, scope);
    var intel = {
        relativeSrc: relativeSrc,
        dest: dest,
        module: module,
        operations: operations,
        fragments: fragments,
        scope: scope
    };
    // console.log("elm scope", JSON.stringify(scope, null, "  "));
    // console.log("elm intel", JSON.stringify(intel, null, "  "));
    return intel;
};
var getReservedNames = function () { return __spreadArrays(reservedNames); };
var reservedNames = ["Int", "Float", "Bool", "String", "List"];
var getOperation = function (relativeSrc, queryOperation, scope, options) {
    var type = getOperationType(queryOperation.type);
    var name = newOperationName(queryOperation.name || queryOperation.type, scope);
    var variables = queryOperation.inputs
        ? getRecordEncoder(queryOperation.inputs, scope, options)
        : undefined;
    var variablesDecoder = queryOperation.inputs
        ? getCompositeDecoder(queryIntel_1.queryObjectInputAsOutput(queryOperation.inputs), scope, options)
        : undefined;
    var data = getCompositeDecoder(queryOperation.outputs, scope, options);
    var errors = options.errorsDecoder;
    var responseTypeName = newOperationResponseTypeName(queryOperation.name || "", scope);
    switch (options.operationKind) {
        case "query":
            return {
                type: getOperationType(queryOperation.type),
                kind: "query",
                name: name,
                query: queryOperation.query,
                fragments: queryOperation.fragmentNames,
                variables: variables,
                variablesDecoder: variablesDecoder,
                data: data,
                errors: errors,
                responseTypeName: responseTypeName
            };
        case "named":
            return {
                type: getOperationType(queryOperation.type),
                kind: "named",
                name: name,
                gqlName: assertOperationName(queryOperation),
                variables: variables,
                variablesDecoder: variablesDecoder,
                data: data,
                errors: errors,
                responseTypeName: responseTypeName
            };
        case "named_prefixed":
            return {
                type: getOperationType(queryOperation.type),
                kind: "named_prefixed",
                name: name,
                gqlName: assertOperationName(queryOperation),
                gqlFilename: relativeSrc.replace(/\\/g, "/"),
                variables: variables,
                variablesDecoder: variablesDecoder,
                data: data,
                errors: errors,
                responseTypeName: responseTypeName
            };
    }
};
var getOperationType = function (type) {
    switch (type) {
        case "query":
            return "Query";
        case "mutation":
            return "Mutation";
        case "subscription":
            return "Subscription";
    }
};
var assertOperationName = function (queryOperation) {
    return utils_1.assertOk(queryOperation.name, "operation for type " + queryOperation.type + " does not have a name");
};
var newOperationName = function (name, scope) {
    return elmUtils_1.newUnusedName("" + elmUtils_1.validVariableName(name), scope.names);
};
var newOperationResponseTypeName = function (name, scope) {
    return elmUtils_1.newUnusedName("" + elmUtils_1.validTypeName(name + "Response"), scope.names);
};
var fixFragmentNames = function (operations, scope) {
    operations.forEach(function (operation) {
        if (operation.kind === "query") {
            operation.fragments = operation.fragments.map(function (name) {
                return utils_1.assertOk(scope.fragmentsByName[name]);
            });
        }
    });
};
var getFragments = function (fragments, scope, options) {
    switch (options.operationKind) {
        case "query":
            return fragments.map(function (fragment) { return getFragment(fragment, scope); });
        case "named":
        case "named_prefixed":
            return [];
    }
};
var getFragment = function (queryFragment, scope) {
    var name = elmUtils_1.newUnusedName(elmUtils_1.validVariableName(queryFragment.name), scope.names);
    scope.fragmentsByName[queryFragment.name] = name;
    return {
        name: name,
        query: queryFragment.query
    };
};
var getEncoder = function (input, scope, options) {
    switch (input.kind) {
        case "object":
            return getRecordEncoder(input, scope, options);
        case "scalar": {
            var scalarEncoder = utils_1.assertOk(options.scalarEncoders[input.typeName], "No encoder defined for scalar type: " + input.typeName + ". Please add one to options.scalarEncoders");
            return __assign(__assign({}, scalarEncoder), { kind: "value-encoder" });
        }
        case "enum": {
            var enumEncoder = utils_1.assertOk(options.enumEncoders[input.typeName], "No encoder defined for enum type: " + input.typeName + ". Please add one to options.enumEncoders");
            return __assign(__assign({}, enumEncoder), { kind: "value-encoder" });
        }
    }
};
var getRecordEncoder = function (input, scope, options) {
    var usedFieldNames = [];
    var fields = input.fields.map(function (field) { return ({
        jsonName: field.name,
        name: elmUtils_1.newUnusedName(elmUtils_1.validFieldName(field.name), usedFieldNames),
        value: getEncoder(field.value, scope, options),
        valueWrapper: field.valueWrapper,
        valueListItemWrapper: field.valueListItemWrapper
    }); });
    var type = getRecordType(input, fields, scope);
    return {
        kind: "record-encoder",
        type: type,
        encoder: getEncoderName(type, scope),
        fields: fields
    };
};
var getEncoderName = function (type, scope) {
    return utils_1.cachedValue(type, scope.encodersByType, function () {
        return elmUtils_1.newUnusedName("encode" + elmUtils_1.validNameUpper(type), scope.names);
    });
};
var getCompositeDecoder = function (output, scope, options) {
    switch (output.kind) {
        case "object":
            return getRecordDecoder(output, scope, options);
        case "fragmented":
            return getUnionDecoder(output, scope, options);
        case "fragmented-on":
            return getUnionOnDecoder(output, scope, options);
    }
};
var getDecoder = function (parentOutput, output, scope, options) {
    switch (output.kind) {
        case "object":
        case "fragmented":
        case "fragmented-on":
            return getCompositeDecoder(output, scope, options);
        case "typename":
            return {
                kind: "constant-string-decoder",
                type: output.typeName,
                value: "\"" + parentOutput.typeName + "\"",
                decoder: "Json.Decode.string"
            };
        case "scalar": {
            var scalarDecoder = utils_1.assertOk(options.scalarDecoders[output.typeName], "No decoder defined for scalar type: " + output.typeName + ". Please add one to options.scalarDecoders");
            return __assign(__assign({}, scalarDecoder), { kind: "value-decoder" });
        }
        case "enum": {
            var enumDecoder = utils_1.assertOk(options.enumDecoders[output.typeName], "No decoder defined for enum type: " + output.typeName + ". Please add one to options.enumDecoders");
            return __assign(__assign({}, enumDecoder), { kind: "value-decoder" });
        }
    }
};
var getRecordDecoder = function (output, scope, options) {
    var usedFieldNames = [];
    var fields = output.fields.map(function (field) { return ({
        jsonName: field.name,
        name: elmUtils_1.newUnusedName(elmUtils_1.validFieldName(field.name), usedFieldNames),
        value: getDecoder(output, field.value, scope, options),
        valueWrapper: field.valueWrapper,
        valueListItemWrapper: field.valueListItemWrapper
    }); });
    var type = getRecordType(output, fields, scope);
    return {
        kind: "record-decoder",
        type: type,
        decoder: getDecoderName(type, scope),
        fields: fields
    };
};
var getUnionDecoder = function (output, scope, options) {
    var decoders = getUnionConstructorDecoders(output, scope, options);
    var type = getUnionType(output, decoders, scope);
    var constructors = getUnionConstructors(type, decoders, scope);
    return {
        kind: "union-decoder",
        type: type,
        decoder: getDecoderName(type, scope),
        constructors: constructors
    };
};
var getUnionOnDecoder = function (output, scope, options) {
    var decoders = getUnionConstructorDecoders(output, scope, options);
    var type = getUnionType(output, decoders, scope);
    var constructors = getUnionConstructors(type, decoders, scope);
    return {
        kind: "union-on-decoder",
        type: type,
        decoder: getDecoderName(type, scope),
        constructors: constructors
    };
};
var getUnionConstructorDecoders = function (output, scope, options) {
    return checkUnionConstructorDecodeSignatures(output.fragments.map(function (fragment) {
        return getUnionConstructorDecoder(fragment, scope, options);
    }));
};
var getUnionConstructorDecoder = function (fragment, scope, options) {
    switch (fragment.kind) {
        case "object-fragment":
            return getRecordDecoder(fragment, scope, options);
        case "fragmented-fragment":
            return getUnionDecoder(fragment, scope, options);
        case "empty-fragment":
            return {
                kind: "empty-decoder",
                type: "Other" + elmUtils_1.validNameUpper(fragment.typeName),
                decoder: "GraphQL.Helpers.Decode.emptyObject"
            };
        case "other-fragment": {
            return {
                kind: "empty-decoder",
                type: "Other" + elmUtils_1.validNameUpper(fragment.typeName),
                decoder: "Json.Decode.succeed"
            };
        }
    }
};
var checkUnionConstructorDecodeSignatures = function (decoders) {
    var signatures = decoders.map(getDecodeSignature);
    signatures.forEach(function (signature, index) {
        if (signatures.indexOf(signature) !== index) {
            throw Error("multiple union constructors with the same decode signature: " + signature);
        }
    });
    return decoders;
};
var getDecodeSignature = function (decoder) {
    switch (decoder.kind) {
        case "constant-string-decoder":
            return decoder.type + " " + decoder.value;
        case "value-decoder":
            return decoder.type;
        case "record-decoder":
            return decoder.fields
                .map(function (field) {
                return field.jsonName + " : " + wrapList(field.valueListItemWrapper, getDecodeSignature(field.value));
            })
                .sort()
                .join(", ");
        case "union-decoder":
        case "union-on-decoder":
            return decoder.type + " : " + decoder.constructors
                .map(function (constructor) { return getDecodeSignature(constructor.decoder); })
                .sort()
                .join(" | ");
        case "empty-decoder":
            return "{}";
    }
};
var wrapList = function (isList, signature) {
    return isList !== false ? "[" + signature + "]" : signature;
};
var getUnionType = function (queryItem, decoders, scope) {
    return utils_1.cachedValue(getUnionSignature(queryItem, decoders), scope.typesBySignature, function () { return elmUtils_1.newUnusedName(elmUtils_1.validTypeName(queryItem.typeName), scope.names); });
};
var getUnionSignature = function (queryItem, decoders) {
    return queryItem.typeName + ": " + decoders.map(function (decoder) { return decoder.type; }).join(" | ");
};
var getUnionConstructors = function (unionType, decoders, scope) {
    return decoders.map(function (decoder) { return ({
        name: getUnionConstructorName(unionType, decoder.type, scope),
        decoder: decoder
    }); });
};
var getUnionConstructorName = function (unionType, constructorType, scope) {
    return utils_1.cachedValue(unionType + " On" + constructorType, scope.typesBySignature, function () {
        return elmUtils_1.newUnusedName(elmUtils_1.validTypeConstructorName("On" + elmUtils_1.validNameUpper(constructorType)), scope.names);
    });
};
var getDecoderName = function (type, scope) {
    return utils_1.cachedValue(type, scope.decodersByType, function () {
        return elmUtils_1.newUnusedName(elmUtils_1.validVariableName(type) + "Decoder", scope.names);
    });
};
var getRecordType = function (queryItem, fields, scope) {
    return utils_1.cachedValue(getRecordSignature(queryItem, fields), scope.typesBySignature, function () { return elmUtils_1.newUnusedName(elmUtils_1.validTypeName(queryItem.typeName), scope.names); });
};
var getRecordSignature = function (queryItem, fields) { return queryItem.typeName + ": " + getRecordFieldsSignature(fields); };
var getRecordFieldsSignature = function (fields) {
    return fields
        .map(function (field) { return field.name + " : " + wrappedTypeSignature(field); })
        .sort()
        .join(", ");
};
var wrappedTypeSignature = function (field) {
    var signature = field.value.type;
    if (field.valueListItemWrapper) {
        signature = "[" + field.valueListItemWrapper + " " + signature + "]";
    }
    if (field.valueWrapper) {
        signature = field.valueWrapper + " " + signature;
    }
    return signature;
};
