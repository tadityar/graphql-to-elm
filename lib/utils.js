"use strict";
exports.__esModule = true;
var os_1 = require("os");
var fs = require("fs");
var path_1 = require("path");
var mkdirp = require("mkdirp");
exports.readFile = function (path) {
    return fs.promises.readFile(path, "utf8").then(function (data) { return data.toString(); });
};
exports.writeFile = function (dest, data) {
    return writeFileWithDir(dest, exports.fixLineEndings(data));
};
var writeFileWithDir = function (dest, data) {
    return mkdirp(path_1.dirname(dest)).then(function () { return fs.promises.writeFile(dest, data, "utf8"); });
};
exports.fixLineEndings = function (data) {
    return data.replace(/\r?\n|\r/g, os_1.EOL);
};
exports.writeFileIfChanged = function (dest, data) {
    return new Promise(function (resolve, reject) {
        var fileData = exports.fixLineEndings(data);
        isFileChanged(dest, fileData)
            .then(function (changed) {
            return changed
                ? writeFileWithDir(dest, fileData).then(function () { return resolve(true); })
                : resolve(false);
        })["catch"](reject);
    });
};
var isFileChanged = function (dest, newData) {
    return new Promise(function (resolve) {
        return exports.readFile(dest)
            .then(function (currentData) { return resolve(currentData !== newData); })["catch"](function () { return resolve(true); });
    });
};
exports.firstToUpperCase = function (string) {
    return string ? "" + string.charAt(0).toUpperCase() + string.slice(1) : string;
};
exports.firstToLowerCase = function (string) {
    return string ? "" + string.charAt(0).toLowerCase() + string.slice(1) : string;
};
exports.sortString = function (a, b) {
    return a < b ? -1 : b < a ? 1 : 0;
};
exports.withParentheses = function (x) { return "(" + x + ")"; };
exports.removeIndents = function (string) {
    return string.replace(/^[\s]+/gm, "");
};
exports.assertOk = function (a, errorMessage) {
    if (errorMessage === void 0) { errorMessage = "not ok"; }
    if (typeof a === "undefined") {
        throw Error(errorMessage);
    }
    return a;
};
exports.withDefault = function (defaultValue, value) {
    return typeof value !== "undefined" ? value : defaultValue;
};
exports.addOnce = function (value, values) {
    if (!values.includes(value)) {
        values.push(value);
    }
};
exports.cachedValue = function (key, cache, create) {
    if (cache[key]) {
        return cache[key];
    }
    else {
        var value = create();
        cache[key] = value;
        return value;
    }
};
