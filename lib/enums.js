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
var graphql_1 = require("graphql");
var elmUtils_1 = require("./elmUtils");
exports.getIntel = function (schema, options) {
    var gqlTypes = schema.getTypeMap();
    return Object.keys(gqlTypes).reduce(function (enums, typeName) {
        var gqlType = gqlTypes[typeName];
        if (gqlType instanceof graphql_1.GraphQLEnumType) {
            var typeName_1 = elmUtils_1.validTypeName(gqlType.name);
            var values = gqlType.getValues().map(function (value) { return ({
                gqlValue: value.name,
                value: elmUtils_1.validTypeConstructorName(value.name)
            }); });
            var module_1 = options.enums.baseModule + "." + typeName_1;
            var moduleParts = module_1.split(".");
            var dest = path.resolve.apply(path, __spreadArrays([options.dest], moduleParts)) + ".elm";
            var encoder = {
                type: module_1 + "." + typeName_1,
                encoder: module_1 + ".encode"
            };
            var decoder = {
                type: module_1 + "." + typeName_1,
                decoder: module_1 + ".decoder"
            };
            var intel = {
                gqlType: gqlType,
                module: module_1,
                typeName: typeName_1,
                values: values,
                encoder: encoder,
                decoder: decoder,
                dest: dest
            };
            return __spreadArrays(enums, [intel]);
        }
        return enums;
    }, []);
};
exports.getEncoders = function (enums) {
    return enums.reduce(function (encoders, intel) {
        var _a;
        return (__assign(__assign({}, encoders), (_a = {}, _a[intel.gqlType.name] = intel.encoder, _a)));
    }, {});
};
exports.getDecoders = function (enums) {
    return enums.reduce(function (decoders, intel) {
        var _a;
        return (__assign(__assign({}, decoders), (_a = {}, _a[intel.gqlType.name] = intel.decoder, _a)));
    }, {});
};
exports.generateElm = function (_a) {
    var module = _a.module, typeName = _a.typeName, values = _a.values;
    return "module " + module + " exposing\n    ( " + typeName + "(..)\n    , decoder\n    , encode\n    , fromString\n    , toString\n    )\n\nimport Json.Decode\nimport Json.Encode\n\n\ntype " + typeName + "\n    = " + values.map(function (x) { return x.value; }).join("\n    | ") + "\n\n\nencode : " + typeName + " -> Json.Encode.Value\nencode value =\n    Json.Encode.string (toString value)\n\n\ndecoder : Json.Decode.Decoder " + typeName + "\ndecoder =\n    Json.Decode.string\n        |> Json.Decode.andThen\n            (\\value ->\n                value\n                    |> fromString\n                    |> Maybe.map Json.Decode.succeed\n                    |> Maybe.withDefault\n                        (Json.Decode.fail <| \"unknown " + typeName + " \" ++ value)\n            )\n\n\ntoString : " + typeName + " -> String\ntoString value =\n    case value of\n        " + values
        .map(function (x) { return x.value + " ->\n            \"" + x.gqlValue + "\""; })
        .join("\n\n        ") + "\n\n\nfromString : String -> Maybe " + typeName + "\nfromString value =\n    case value of\n        " + values
        .map(function (x) { return "\"" + x.gqlValue + "\" ->\n            Just " + x.value; })
        .join("\n\n        ") + "\n\n        _ ->\n            Nothing\n";
};
