"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var elmUtils_1 = require("../elmUtils");
var utils_1 = require("../utils");
exports.generateElm = function (intel) { return "module " + intel.module + " exposing\n    ( " + generateExports(intel) + "\n    )\n\n" + generateImports(intel) + "\n\n\n" + generateOperations(intel) + generateFragments(intel) + "\n\n\n" + generateOperationResponses(intel) + "\n\n\n" + generateEncodersAndDecoders(intel) + "\n"; };
//
// EXPORTS
//
var generateExports = function (intel) {
    var types = [];
    var variables = [];
    var addType = function (type) { return utils_1.addOnce(type, types); };
    var addVariable = function (variable) { return utils_1.addOnce(variable, variables); };
    intel.operations.forEach(function (operation) {
        addType(operation.responseTypeName);
        addVariable(operation.name);
        if (operation.variables) {
            visitEncoders(operation.variables, {
                record: function (encoder) {
                    addType(encoder.type);
                    addVariable(encoder.encoder);
                },
                value: function (encoder) { }
            });
        }
        if (operation.variablesDecoder) {
            visitDecoders(operation.variablesDecoder, {
                value: function (decoder) { },
                constantString: function (decoder) { },
                record: function (decoder) {
                    addType(decoder.type);
                    addVariable(decoder.decoder);
                },
                union: function (decoder) { },
                unionOn: function (decoder) { },
                empty: function (decoder) { }
            });
        }
        visitDecoders(operation.data, {
            value: function (decoder) { },
            constantString: function (decoder) { },
            record: function (decoder) {
                addType(decoder.type);
            },
            union: function (decoder) {
                addType(decoder.type + "(..)");
            },
            unionOn: function (decoder) {
                addType(decoder.type + "(..)");
            },
            empty: function (decoder) { }
        });
    });
    types.sort();
    variables.sort();
    return __spreadArrays(types, variables).join("\n    , ");
};
//
// IMPORTS
//
var generateImports = function (intel) {
    var imports = ["Json.Decode"];
    var addImport = function (module) { return utils_1.addOnce(module, imports); };
    var addImportOf = function (x) {
        var module = x && extractModule(x);
        if (module) {
            addImport(module);
        }
    };
    var addWrapperImports = function (_a) {
        var valueWrapper = _a.valueWrapper, valueListItemWrapper = _a.valueListItemWrapper;
        switch (valueWrapper) {
            case "optional":
                addImport("GraphQL.Optional");
                break;
            case "non-null-optional":
                addImport("GraphQL.Optional");
                break;
        }
        switch (valueListItemWrapper) {
            case "optional":
                addImport("GraphQL.Optional");
                break;
        }
    };
    intel.operations.forEach(function (operation) {
        addImport("GraphQL.Operation");
        addImport("GraphQL.Response");
        if (operation.variables) {
            addImport("Json.Encode");
            visitEncoders(operation.variables, {
                record: function (encoder) {
                    encoder.fields.map(addWrapperImports);
                },
                value: function (encoder) {
                    addImportOf(encoder.type);
                    addImportOf(encoder.encoder);
                }
            });
        }
        if (operation.variablesDecoder) {
            visitDecoders(operation.variablesDecoder, {
                value: function (decoder) {
                    addImportOf(decoder.type);
                    addImportOf(decoder.decoder);
                },
                constantString: function (decoder) {
                    addImport("GraphQL.Helpers.Decode");
                },
                record: function (decoder) {
                    decoder.fields.map(addWrapperImports);
                    if (decoder.fields.length > 8) {
                        addImport("GraphQL.Helpers.Decode");
                    }
                },
                union: function (decoder) { },
                unionOn: function (decoder) { },
                empty: function (decoder) {
                    addImportOf(decoder.decoder);
                }
            });
        }
        visitDecoders(operation.data, {
            value: function (decoder) {
                addImportOf(decoder.type);
                addImportOf(decoder.decoder);
            },
            constantString: function (decoder) {
                addImport("GraphQL.Helpers.Decode");
            },
            record: function (decoder) {
                decoder.fields.map(addWrapperImports);
                if (decoder.fields.length > 8) {
                    addImport("GraphQL.Helpers.Decode");
                }
            },
            union: function (decoder) { },
            unionOn: function (decoder) { },
            empty: function (decoder) {
                addImportOf(decoder.decoder);
            }
        });
        addImportOf(operation.errors.type);
        addImportOf(operation.errors.decoder);
    });
    return imports
        .sort()
        .map(function (name) { return "import " + name; })
        .join("\n");
};
var extractModule = function (expression) {
    return expression.substr(0, expression.lastIndexOf("."));
};
//
// OPERATIONS
//
var generateOperations = function (intel) {
    return intel.operations.map(generateOperation).join("\n\n\n");
};
var generateOperation = function (operation) {
    var variables = operation.variables
        ? {
            declaration: " " + operation.variables.type + " ->",
            parameter: " variables",
            value: "(Maybe.Just <| " + operation.variables.encoder + " variables)"
        }
        : {
            declaration: "",
            parameter: "",
            value: "Maybe.Nothing"
        };
    var declaration = operation.name + " :" + variables.declaration + " GraphQL.Operation.Operation GraphQL.Operation." + operation.type + " " + operation.errors.type + " " + operation.data.type;
    switch (operation.kind) {
        case "query":
            return declaration + "\n" + operation.name + variables.parameter + " =\n    GraphQL.Operation.withQuery\n        " + generateQuery(operation) + "\n        " + variables.value + "\n        " + operation.data.decoder + "\n        " + operation.errors.decoder;
        case "named":
            return declaration + "\n" + operation.name + variables.parameter + " =\n    GraphQL.Operation.withName\n        \"" + operation.gqlName + "\"\n        " + variables.value + "\n        " + operation.data.decoder + "\n        " + operation.errors.decoder;
        case "named_prefixed":
            return declaration + "\n" + operation.name + variables.parameter + " =\n    GraphQL.Operation.withName\n        \"" + operation.gqlFilename + ":" + operation.gqlName + "\"\n        " + variables.value + "\n        " + operation.data.decoder + "\n        " + operation.errors.decoder;
    }
};
var generateQuery = function (operation) {
    return wrapQuery(operation, "\"\"\"" + operation.query + "\"\"\"" + operation.fragments
        .map(function (name) { return "\n            ++ " + name; })
        .join(""));
};
var wrapQuery = function (operation, query) {
    return operation.fragments.length > 0 ? "(" + query + "\n        )" : query;
};
var generateFragments = function (intel) {
    return intel.fragments.map(generateFragment).join("");
};
var generateFragment = function (fragment) {
    return "\n\n\n" + fragment.name + " : String\n" + fragment.name + " =\n    \"\"\"" + fragment.query + "\"\"\"";
};
var generateOperationResponses = function (intel) {
    return intel.operations.map(generateOperationResponse).join("\n\n\n");
};
var generateOperationResponse = function (operation) {
    return "type alias " + operation.responseTypeName + " =\n    GraphQL.Response.Response " + operation.errors.type + " " + operation.data.type;
};
//
// ENCODERS AND DECODERS
//
var generateEncodersAndDecoders = function (intel) {
    var generatedTypes = [];
    var generatedItems = [];
    var items = [];
    var newType = function (type, item, createDeclarations, createItems) {
        if (!generatedTypes.includes(type)) {
            generatedTypes.push(type);
            items.push.apply(items, createDeclarations());
        }
        if (!generatedItems.includes(type + item)) {
            generatedItems.push(type + item);
            items.push.apply(items, createItems());
        }
    };
    intel.operations.map(function (operation) {
        if (operation.variables) {
            generateEncoders(operation.variables, newType, intel.scope);
        }
        if (operation.variablesDecoder) {
            generateDecoders(operation.variablesDecoder, newType);
        }
        generateDecoders(operation.data, newType);
    });
    return items.join("\n\n\n");
};
//
// ENCODERS
//
var generateEncoders = function (encoder, newType, scope) {
    visitEncoders(encoder, {
        record: function (encoder) {
            newType(encoder.type, "Encoder", function () { return [generateRecordTypeDeclaration(encoder)]; }, function () { return [generateRecordEncoder(encoder, scope)]; });
        },
        value: function (encoder) { }
    });
};
var generateRecordEncoder = function (encoder, scope) {
    var hasOptionals = encoder.fields.some(function (field) { return field.valueWrapper === "optional"; });
    var objectEncoder = hasOptionals
        ? "GraphQL.Optional.encodeObject"
        : "Json.Encode.object";
    var argumentName = elmUtils_1.findUnusedName("inputs", scope.names);
    var fieldEncoders = encoder.fields
        .map(function (field) {
        return "( \"" + field.jsonName + "\", " + wrapEncoder(field, hasOptionals) + " " + argumentName + "." + field.name + " )";
    })
        .join("\n        , ");
    return encoder.encoder + " : " + encoder.type + " -> Json.Encode.Value\n" + encoder.encoder + " " + argumentName + " =\n    " + objectEncoder + "\n        [ " + fieldEncoders + "\n        ]";
};
var wrapEncoder = function (field, hasOptionalSiblings) {
    var encoder = field.value.encoder;
    var withParenthesesOptional = false;
    var withParenthesesPresent = false;
    var withParenthesesFinal = false;
    if (field.valueListItemWrapper === "optional") {
        encoder = "GraphQL.Optional.encodeList " + encoder;
        withParenthesesOptional = true;
    }
    else if (field.valueListItemWrapper === "non-null") {
        encoder = "Json.Encode.list " + encoder;
        withParenthesesOptional = true;
        withParenthesesFinal = true;
    }
    if (hasOptionalSiblings) {
        if (field.valueWrapper === "optional") {
            if (withParenthesesOptional) {
                encoder = "(" + encoder + ")";
            }
            encoder = "GraphQL.Optional.map " + encoder;
            withParenthesesFinal = false;
        }
        else {
            if (withParenthesesPresent) {
                encoder = "(" + encoder + ")";
            }
            encoder = encoder + " >> GraphQL.Optional.Present";
            withParenthesesFinal = true;
        }
    }
    if (withParenthesesFinal) {
        encoder = "(" + encoder + ")";
    }
    return encoder;
};
//
// DECODERS
//
var generateDecoders = function (decoder, newType) {
    visitDecoders(decoder, {
        value: function (decoder) { },
        constantString: function (decoder) { },
        record: function (decoder) {
            newType(decoder.type, "Decoder", function () { return [generateRecordTypeDeclaration(decoder)]; }, function () { return [generateRecordDecoder(decoder)]; });
        },
        union: function (decoder) {
            newType(decoder.type, "Decoder", function () { return []; }, function () { return generateUnionDecoder(decoder); });
        },
        unionOn: function (decoder) {
            newType(decoder.type, "Decoder", function () { return []; }, function () { return generateUnionDecoder(decoder); });
        },
        empty: function (decoder) { }
    });
};
var generateRecordDecoder = function (decoder) {
    var declaration = decoder.decoder + " : Json.Decode.Decoder " + decoder.type;
    var fields = decoder.fields;
    var map = fields.length > 1 ? Math.min(fields.length, 8) : "";
    var prefix = function (index) {
        return index >= 8 ? "|> GraphQL.Helpers.Decode.andMap " : "";
    };
    var fieldDecoders = fields.map(function (field, index) {
        return field.value.kind === "union-on-decoder"
            ? "        " + field.value.decoder
            : "        " + prefix(index) + "(" + fieldDecoder(field) + " \"" + field.jsonName + "\" " + wrapFieldDecoder(field) + ")";
    });
    return declaration + "\n" + decoder.decoder + " =\n    Json.Decode.map" + map + " " + decoder.type + "\n" + fieldDecoders.join("\n");
};
var fieldDecoder = function (field) {
    switch (field.valueWrapper) {
        case "optional":
            return "GraphQL.Optional.fieldDecoder";
        case "non-null-optional":
            return "GraphQL.Optional.nonNullFieldDecoder";
        default:
            return "Json.Decode.field";
    }
};
var wrapFieldDecoder = function (field) {
    var decoder = field.value.decoder;
    if (field.value.kind === "constant-string-decoder") {
        decoder = "(GraphQL.Helpers.Decode.constantString " + field.value.value + ")";
    }
    if (field.valueListItemWrapper === "nullable") {
        decoder = "(Json.Decode.nullable " + decoder + ")";
    }
    if (field.valueListItemWrapper) {
        decoder = "(Json.Decode.list " + decoder + ")";
    }
    if (field.valueWrapper === "nullable") {
        decoder = "(Json.Decode.nullable " + decoder + ")";
    }
    return decoder;
};
var generateUnionDecoder = function (decoder) {
    var constructors = decoder.constructors.sort(function (a, b) { return numberOfChildren(b) - numberOfChildren(a); });
    var constructorDeclarations = constructors.map(function (constructor) {
        switch (constructor.decoder.kind) {
            case "record-decoder":
            case "union-decoder":
                return constructor.name + " " + constructor.decoder.type;
            case "empty-decoder":
                return constructor.name;
        }
    });
    var typeDeclaration = "type " + decoder.type + "\n    = " + constructorDeclarations.join("\n    | ");
    var decoderDeclaration = decoder.decoder + " : Json.Decode.Decoder " + decoder.type;
    var constructorDecoders = constructors.map(function (constructor) {
        switch (constructor.decoder.kind) {
            case "record-decoder":
            case "union-decoder":
                return "Json.Decode.map " + constructor.name + " " + constructor.decoder.decoder;
            case "empty-decoder":
                return constructor.decoder.decoder + " " + constructor.name;
        }
    });
    var typeDecoder = decoder.decoder + " =\n    Json.Decode.oneOf\n        [ " + constructorDecoders.join("\n        , ") + "\n        ]";
    return [typeDeclaration, decoderDeclaration + "\n" + typeDecoder];
};
var numberOfChildren = function (constructor) {
    switch (constructor.decoder.kind) {
        case "record-decoder":
            return constructor.decoder.fields.length;
        case "union-decoder":
            return constructor.decoder.constructors.length;
        case "empty-decoder":
            return 0;
    }
};
//
// RECORD TYPE DECLARATION
//
var generateRecordTypeDeclaration = function (item) {
    var fields = item.fields;
    var fieldTypes = fields.map(function (field) { return field.name + " : " + wrappedType(field); });
    return "type alias " + item.type + " =\n    { " + fieldTypes.join("\n    , ") + "\n    }";
};
var wrappedType = function (field) {
    var signature = field.value.type;
    var wrap = function (x) { return x; };
    switch (field.valueListItemWrapper) {
        case "nullable":
            signature = "Maybe.Maybe " + signature;
            wrap = utils_1.withParentheses;
            break;
        case "optional":
            signature = "GraphQL.Optional.Optional " + signature;
            wrap = utils_1.withParentheses;
            break;
    }
    if (field.valueListItemWrapper) {
        signature = "List " + wrap(signature);
        wrap = utils_1.withParentheses;
    }
    switch (field.valueWrapper) {
        case "nullable":
        case "non-null-optional":
            signature = "Maybe.Maybe " + wrap(signature);
            break;
        case "optional":
            signature = "GraphQL.Optional.Optional " + wrap(signature);
            break;
    }
    return signature;
};
var visitEncoders = function (encoder, visitor) {
    switch (encoder.kind) {
        case "record-encoder":
            visitor.record(encoder);
            encoder.fields.forEach(function (field) { return visitEncoders(field.value, visitor); });
            break;
        case "value-encoder":
            visitor.value(encoder);
            break;
    }
};
var visitDecoders = function (decoder, visitor) {
    switch (decoder.kind) {
        case "value-decoder":
            visitor.value(decoder);
            break;
        case "constant-string-decoder":
            visitor.constantString(decoder);
            break;
        case "record-decoder":
            visitor.record(decoder);
            decoder.fields.forEach(function (field) { return visitDecoders(field.value, visitor); });
            break;
        case "union-decoder":
            visitor.union(decoder);
            decoder.constructors.forEach(function (constructor) {
                return visitDecoders(constructor.decoder, visitor);
            });
            break;
        case "union-on-decoder":
            visitor.unionOn(decoder);
            decoder.constructors.forEach(function (constructor) {
                return visitDecoders(constructor.decoder, visitor);
            });
            break;
        case "empty-decoder":
            visitor.empty(decoder);
            break;
    }
};
