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
var assert = require("assert");
var utils_1 = require("./utils");
var defaultEnumOptions = {
    baseModule: "GraphQL.Enum"
};
var defaultScalarEncoders = {
    Int: {
        type: "Int",
        encoder: "Json.Encode.int"
    },
    Float: {
        type: "Float",
        encoder: "Json.Encode.float"
    },
    Boolean: {
        type: "Bool",
        encoder: "Json.Encode.bool"
    },
    String: {
        type: "String",
        encoder: "Json.Encode.string"
    },
    ID: {
        type: "String",
        encoder: "Json.Encode.string"
    }
};
var defaultScalarDecoders = {
    Int: {
        type: "Int",
        decoder: "Json.Decode.int"
    },
    Float: {
        type: "Float",
        decoder: "Json.Decode.float"
    },
    Boolean: {
        type: "Bool",
        decoder: "Json.Decode.bool"
    },
    String: {
        type: "String",
        decoder: "Json.Decode.string"
    },
    ID: {
        type: "String",
        decoder: "Json.Decode.string"
    }
};
var defaultErrorsDecoder = {
    type: "GraphQL.Errors.Errors",
    decoder: "GraphQL.Errors.decoder"
};
exports.finalizeOptions = function (options) {
    validateOptions(options);
    var schema = options.schema, queries = options.queries;
    var enums = __assign(__assign({}, defaultEnumOptions), utils_1.withDefault({}, options.enums));
    var scalarEncoders = __assign(__assign({}, defaultScalarEncoders), utils_1.withDefault({}, options.scalarEncoders));
    var enumEncoders = utils_1.withDefault({}, options.enumEncoders);
    var scalarDecoders = __assign(__assign({}, defaultScalarDecoders), utils_1.withDefault({}, options.scalarDecoders));
    var enumDecoders = utils_1.withDefault({}, options.enumDecoders);
    var errorsDecoder = utils_1.withDefault(defaultErrorsDecoder, options.errorsDecoder);
    var src = utils_1.withDefault(".", options.src);
    var dest = utils_1.withDefault(src, options.dest);
    var operationKind = utils_1.withDefault("query", options.operationKind);
    var log = typeof options.log !== "undefined"
        ? options.log || (function (x) { })
        : function (message) { return console.log(message); };
    return {
        schema: schema,
        enums: enums,
        queries: queries,
        scalarEncoders: scalarEncoders,
        enumEncoders: enumEncoders,
        scalarDecoders: scalarDecoders,
        enumDecoders: enumDecoders,
        errorsDecoder: errorsDecoder,
        src: src,
        dest: dest,
        operationKind: operationKind,
        log: log
    };
};
var validateOptions = function (options) {
    assert.strictEqual(typeof options, "object", "options must be an object");
    validateSchema(options.schema);
    validateEnums(options.enums);
    validateQueries(options.queries);
    validateTypeEncoders("scalarEncoders", options.scalarEncoders);
    validateTypeEncoders("enumEncoders", options.enumEncoders);
    validateTypeDecoders("scalarDecoders", options.scalarDecoders);
    validateTypeDecoders("enumDecoders", options.enumDecoders);
    validateErrorsDecoder(options.errorsDecoder);
    validateSrc(options.src);
    validateDest(options.dest);
    validateOperationKind(options.operationKind);
    validateLog(options.log);
};
var validateSchema = function (schema) {
    if (typeof schema === "string") {
        // ok
        return;
    }
    if (typeof schema === "object" && schema !== null) {
        if (typeof schema.string === "string") {
            //ok
            return;
        }
    }
    assert.fail("options.schema must be a string or and object of type SchemaString, but found: " + schema);
};
var validateEnums = function (enums) {
    if (typeof enums === "undefined") {
        return;
    }
    assert.strictEqual(enums && typeof enums, "object", "options.enums must be an object, but found: " + enums);
    if (typeof enums.baseModule !== "undefined") {
        assert.strictEqual(typeof enums.baseModule, "string", "options.enums.baseModule must be a string, but found: " + enums.baseModule);
    }
};
var validateQueries = function (queries) {
    assert.strictEqual(Array.isArray(queries), true, "options.queries must be an array, but found: " + queries);
    queries.forEach(function (query) {
        return assert.strictEqual(typeof query, "string", "options.queries must only contain strings, but found: " + query);
    });
};
var validateTypeEncoders = function (name, typeEncoders) {
    if (typeof typeEncoders === "undefined") {
        return;
    }
    assert.strictEqual(typeEncoders && typeof typeEncoders, "object", "options." + name + " must be an object, but found: " + typeEncoders);
    Object.keys(typeEncoders).forEach(function (key) {
        return validateTypeEncoder(name, typeEncoders[key]);
    });
};
var validateTypeEncoder = function (name, typeEncoder) {
    var message = "options." + name + " must contain fields of TypeEncoder: {type: string, encoder: string} , but found: " + typeEncoder;
    assert.strictEqual(typeEncoder && typeof typeEncoder, "object", message);
    assert.strictEqual(typeof typeEncoder.type, "string", message);
    assert.strictEqual(typeof typeEncoder.encoder, "string", message);
};
var validateTypeDecoders = function (name, typeDecoders) {
    if (typeof typeDecoders === "undefined") {
        return;
    }
    assert.strictEqual(typeDecoders && typeof typeDecoders, "object", "options." + name + " must be an object, but found: " + typeDecoders);
    Object.keys(typeDecoders).forEach(function (key) {
        return validateTypeDecoder(name, typeDecoders[key]);
    });
};
var validateTypeDecoder = function (name, typeDecoder) {
    var message = "options." + name + " must contain fields of TypeDecoder: {type: string, decoder: string} , but found: " + typeDecoder;
    assert.strictEqual(typeDecoder && typeof typeDecoder, "object", message);
    assert.strictEqual(typeof typeDecoder.type, "string", message);
    assert.strictEqual(typeof typeDecoder.decoder, "string", message);
};
var validateErrorsDecoder = function (typeDecoder) {
    if (typeof typeDecoder === "undefined") {
        return;
    }
    var message = "options.errorsDecoder must be a TypeDecoder: {type: string, decoder: string} , but found: " + typeDecoder;
    assert.strictEqual(typeDecoder && typeof typeDecoder, "object", message);
    assert.strictEqual(typeof typeDecoder.type, "string", message);
    assert.strictEqual(typeof typeDecoder.decoder, "string", message);
};
var validateSrc = function (src) {
    if (typeof src === "undefined") {
        return;
    }
    assert.strictEqual(typeof src, "string", "options.src must be a string, but found: " + src);
};
var validateDest = function (dest) {
    if (typeof dest === "undefined") {
        return;
    }
    assert.strictEqual(typeof dest, "string", "options.dest must be a string, but found: " + dest);
};
var validateOperationKind = function (operationKind) {
    if (typeof operationKind === "undefined") {
        return;
    }
    assert.strictEqual(operationKind === "query" ||
        operationKind === "named" ||
        operationKind === "named_prefixed", true, "options.operationKind must be \"query\", \"named\" or \"named_prefixed\", but found: " + operationKind);
};
var validateLog = function (log) {
    if (typeof log === "undefined") {
        return;
    }
    assert.strictEqual(log === null || typeof log === "function", true, "options.log must be \"null\" or a function, but found: " + log);
};
