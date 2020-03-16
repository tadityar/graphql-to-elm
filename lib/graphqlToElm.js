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
exports.__esModule = true;
var options_1 = require("./options");
var schema_1 = require("./schema");
var enums = require("./enums");
var queryIntel_1 = require("./queries/queryIntel");
var elmIntel_1 = require("./queries/elmIntel");
var generateElm_1 = require("./queries/generateElm");
var utils_1 = require("./utils");
exports.graphqlToElm = function (options) {
    return exports.getGraphqlToElm(options)
        .then(exports.writeResult)
        .then(function () { });
};
exports.getGraphqlToElm = function (userOptions) {
    var options = options_1.finalizeOptions(userOptions);
    return schema_1.getSchemaString(options).then(function (schemaString) {
        options.log("processing schema");
        var schema = schema_1.processSchemaString(schemaString);
        options.log("processing enums");
        var enumsIntel = enums.getIntel(schema, options);
        options = __assign(__assign({}, options), { enumEncoders: __assign(__assign({}, enums.getEncoders(enumsIntel)), options.enumEncoders), enumDecoders: __assign(__assign({}, enums.getDecoders(enumsIntel)), options.enumDecoders) });
        return Promise.all(options.queries.map(function (src) {
            return queryIntel_1.readQueryIntel(src, schema, options).then(function (queryIntel) { return ({
                queryIntel: queryIntel,
                elmIntel: elmIntel_1.queryToElmIntel(queryIntel, options)
            }); });
        })).then(function (queriesResults) { return ({
            enums: enumsIntel,
            queries: queriesResults,
            options: options
        }); });
    });
};
exports.writeResult = function (result) {
    var writeEnums = Promise.all(result.enums.map(function (enumIntel) {
        return utils_1.writeFileIfChanged(enumIntel.dest, enums.generateElm(enumIntel)).then(logWrite(result.options, "enum", enumIntel.dest));
    }));
    var writeQueries = Promise.all(result.queries.map(function (_a) {
        var elmIntel = _a.elmIntel;
        return utils_1.writeFileIfChanged(elmIntel.dest, generateElm_1.generateElm(elmIntel)).then(logWrite(result.options, "query", elmIntel.dest));
    }));
    return Promise.all([writeEnums, writeQueries])
        .then(function () { return result.options.log("done"); })
        .then(function () { return result; });
};
var logWrite = function (options, label, dest) { return function (changed) {
    if (changed) {
        options.log(label + " file written: " + dest);
    }
}; };
