"use strict";
exports.__esModule = true;
var graphql_1 = require("graphql");
var utils_1 = require("./utils");
exports.getSchemaString = function (_a) {
    var schema = _a.schema, log = _a.log;
    if (typeof schema === "string") {
        log && log("reading schema " + schema);
        return utils_1.readFile(schema);
    }
    else {
        log && log("schema from string");
        return Promise.resolve(schema.string);
    }
};
exports.processSchemaString = function (schemaString) {
    try {
        return graphql_1.buildSchema(schemaString);
    }
    catch (error) {
        throw new Error("processing schema\n" + error.toString());
    }
};
