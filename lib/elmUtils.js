"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
exports.validModuleName = function (name) { return exports.validNameUpper(name); };
exports.validTypeName = function (name) { return exports.validNameUpper(name); };
exports.validTypeConstructorName = function (name) {
    return exports.validNameUpper(name);
};
exports.validVariableName = function (name) { return exports.validNameLower(name); };
exports.validFieldName = function (name) { return exports.validNameLower(name); };
exports.validNameLower = function (name) {
    return exports.validWord(utils_1.firstToLowerCase(exports.validNameUpper(name)));
};
exports.validNameUpper = function (name) {
    var isAllUpperCase = name.match(/[^A-Z0-9_]/) === null;
    var validName = isAllUpperCase
        ? name
            .replace(/_(_*)/g, "-$1-")
            .split(/[^A-Z0-9_]/g)
            .filter(isEmpty)
            .map(function (x) { return x.toLowerCase(); })
            .map(utils_1.firstToUpperCase)
            .join("")
        : name
            .split(/[^A-Za-z0-9_]/g)
            .filter(isEmpty)
            .map(utils_1.firstToUpperCase)
            .join("");
    var startUnderscores = (name.match(/^_+/) || [""])[0];
    return validName.replace(/^_+/, "") + startUnderscores;
};
var isEmpty = function (string) { return !!string; };
// const appendUnderscores = (name: string, originalName: string) => {
//   const matches = originalName.match(/^_+/g);
//   return matches ? name + matches[0] : name;
// };
exports.validWord = function (keyword) {
    return exports.elmKeywords.includes(keyword) ? keyword + "_" : keyword;
};
exports.elmKeywords = [
    "as",
    "case",
    "else",
    "exposing",
    "if",
    "import",
    "in",
    "let",
    "module",
    "of",
    "port",
    "then",
    "type",
    "where"
    // "alias",
    // "command",
    // "effect",
    // "false",
    // "infix",
    // "left",
    // "non",
    // "null",
    // "right",
    // "subscription",
    // "true",
];
exports.findUnusedName = function (name, usedNames) {
    name = exports.validWord(name);
    if (!usedNames.includes(name)) {
        return name;
    }
    else {
        var count = 2;
        while (usedNames.includes(name + count)) {
            count++;
        }
        var name2 = name + count;
        return name2;
    }
};
exports.newUnusedName = function (name, usedNames) {
    var newName = exports.findUnusedName(name, usedNames);
    usedNames.push(newName);
    return newName;
};
