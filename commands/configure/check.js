const fsPath = require('path');
const logSymbols = require('log-symbols');
const util = require('util');
const parse = require('./parse');

const EXTRA_METADATA = 0;
const REQUIRED_METADATA = 1;
const CHECKED_VALUE = 2;

function check(data, verbose) {
    var totalChecks =
            data.meta.unbound.length +
            data.spec.unbound.length +
            data.meta.bound.size;
    
    var issues = [];
    
    // Check unbound data for issues first.
    var check_result = checkUnbound(data);
    if (!check_result.ok)
        return { ok: false, error_msg: check_result.error_msg };

    issues = issues.concat(check_result.issues);

    // Check each of the bound fields
    data.meta.bound.forEach(function(value, key, map) {

        // Lookup the metadata object
        var lookup_result_m = parse.lookup(data.meta.obj, key,
                                           false /* has constraints */);
        if (!lookup_result_m.ok)
            throw new Error("BUG: " + lookup_result_m.error_msg);

        // Lookup the spec object
        var lookup_result_s = parse.lookup(data.spec.obj, value,
                                           true /* has constraints */);
        if (!lookup_result_s.ok)
            throw new Error("BUG: " + lookup_result_s.error_msg);

        var meta = lookup_result_m.value;
        var spec = lookup_result_s.value;
        
        var result = checkValue(key, meta, spec.constraints, verbose);
        if (!result.ok)
            throw new Error("BUG: " + result.error_msg);

        issues = issues.concat(result.issues);
    });

    if (verbose) {
        if (issues.length > 0)
            console.log("   ", logSymbols.error, issues.length + "/" + totalChecks
                        + " checks failed");
        else
            console.log("   ", logSymbols.success, totalChecks + "/" + totalChecks
                        + " checks succeeded");
    }
        
    return { ok: true, issues: issues };
}

function checkUnbound(data) {
    var issues = [];
    
    // Check for unbound metadata. It might be OK to have the extra
    // data but warn the user in case they intended it to be used.
    if (data.meta.unbound.length > 0) {
        // msg: "Some of your metadata won't be used",
        var extra_meta = [];
        data.meta.unbound.forEach(function(path) {
            extra_meta.push(parse.joinPath(path));
        });
        issues.push({
            warn: true,
            type: EXTRA_METADATA,
            paths: extra_meta
        });
    }

    // Check for unused specs. These are only OK if the spec itself
    // says that the metadata field can be empty.
    if (data.spec.unbound.length > 0) {

        var required = data.spec.unbound.filter(function(path) {
            var lookup_result = parse.lookup(data.spec.obj, path,
                                             true /* has constraints */);
            if (!lookup_result.ok)
                throw new Error("BUG: " + lookup_result.error_msg);

            var spec = lookup_result.value;            
            return spec.constraints.includes("non-empty");
        });

        if (required.length > 0) {
            var required_meta = [];
            required.forEach(function(spec_path) {
                required_meta.push(parse.joinPath(parse.spec2meta(spec_path)));
            });
            issues.push({
                warn: false,
                type: REQUIRED_METADATA,
                paths: required_meta
            });
        }
    }
    
    return { ok: true, issues: issues };
}

function checkValue(path, value, constraints, verbose) {
    var issues = [];
    
    constraints.forEach(function(constraint) {
        switch (constraint) {
        case "String":
            if (!isString(value))
                issues.push("Must be a string");
            break;
        case "Array":
            if (!isArray(value))
                issues.push("Must be an array");
            break;
        case "non-empty":
            if (!notEmpty(value))
                issues.push("Can't be empty (e.g. \"\", [], {})");
            break;
        case "absolute-path":
            if (!isAbsolutePath(value))
                issues.push("Must be an absolute file path");
            break;
        default:
            return {
                ok: false,
                error_msg: "unknown constraint '" + constraint
                    + "'. Avoid modifying the spec file"
            };
        }
    });

    if (verbose && issues.length > 0)
        console.log("   ", logSymbols.error, parse.joinPath(path));

    var out = [];
    if (issues.length > 0)
        out = [{
            warn: false,
            type: CHECKED_VALUE,
            path: parse.joinPath(path),
            value: util.inspect(value, false, 0),
            issues: issues
        }];
    
    return { ok: true, issues: out };
}

function isString(value) {
    return (typeof value === 'string' || value instanceof String);
}

function isArray(value) {
    return Array.isArray(value);
}

function isObject(value) {
    return typeof value === 'object';
}

function notEmpty(value) {
    if (isString(value)) {
        return value !== "";
    }
    if (isArray(value)) {
        return value.length > 0;
    }
    if (isObject(value)) {
        if (value === null) {
            return false;
        }
        for (var prop in value) {
            if (value.hasOwnProperty(prop))
                return true;
        }
        return false;
    }

    // For other types that can be represented as YAML,
    // like numbers, we don't have a sense of emptiness,
    // so just say that the value is not empty.
    return true;
}

function isAbsolutePath(value) {
    try {
        return fsPath.isAbsolute(value);
    } catch (e) {
        return false;
    }
}

module.exports = {
    do_check: check,
    ISSUE_EXTRA_METADATA: EXTRA_METADATA,
    ISSUE_REQUIRED_METADATA: REQUIRED_METADATA,
    ISSUE_CHECKED_VALUE: CHECKED_VALUE
};
