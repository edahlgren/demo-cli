const fs   = require('fs');
const path = require('path');
const traverse = require('traverse');
const yaml = require('js-yaml');

const parse = require('../../commands/configure/parse');
const fileutil = require('../../util/file');
const render = require('./render');


////////////////////////////////////////////////////////////////////////////////


function standard_spec_guide(name, spec_file, example_file, constraints,
                             template, out_dir) {
    
    var vars = spec_guide_vars(spec_file, example_file, constraints);
    if (!vars.ok)
        return vars;

    var text_options = {
        separateTwoColumns: true,
        dotsBetweenColumns: true,
        indentWrapTable: false,
        minColumnPad: 10
    };
    
    return render.render({
        vars: vars,
        template: template,
        html: path.join(out_dir, name + ".html"),
        text: path.join(out_dir, name + ".txt")
    }, text_options);    
}

function spec_guide_vars(spec_file, example_file, constraints) {

    // Read in the spec file
    var spec_result = fileutil.readYAML(spec_file);
    if (!spec_result.ok)
        return spec_result;

    // Read in the example file
    var example_result = fileutil.readYAML(example_file);
    if (!example_result.ok)
        return example_result;

    var spec = spec_result.yaml;
    var example = example_result.yaml;

    // Transform the example so only the first fields remain
    var empty0 = traverse(example).map(function(x) {
        // Remove duplicate sections
        if (this.key > 0) {
            this.delete();
            return;
        }
        if (this.isLeaf)
            this.update("PLACEHOLDER");
    });
    
    var empty = traverse(empty0).map(function(x) {
        if (!x) this.remove();
    });

    // Find the signatures
    var meta = traverse(empty);
    var meta_paths = meta.paths();    
    var end_index = meta_paths.length - 1;
    
    meta_paths = meta_paths.filter(function(path, index, array) {
        // Remove empty paths
        if (path.length == 0)
            return false;

        // Allow anything that's not a number
        var end = path[path.length - 1];
        var isNumber = /\d+/.test(end);
        if (!isNumber)
            return true;

        // Allow anything that's at the very end
        if (index + 1 == end_index)
            return true;

        // Disallow indexed fields that contain objects
        // or arrays
        var value = meta.get(path);
        if (typeof value === 'object' || Array.isArray(value))
            return false;

        return true;
    });
    
    var meta_signatures = meta_paths.map(function(path) {
        return parse.joinPath(path);
    });
    
    // Assert that we can parse the same number of lines.
    var text = yaml.dump(empty).trim();
    var lines = text.replace(new RegExp("PLACEHOLDER", 'g'), "").split("\n");
    if (meta_signatures.length != lines.length) {
        return {
            ok: false,
            error_msg: "Number of signatures don't match number of lines"
        };
    }

    // Find the specs for each line
    var specs = traverse(spec);
    var spec_paths = specs.paths();
    var signatures = new Map();
    
    spec_paths.forEach(function(spec_path) {
        var meta_path = parse.spec2meta(spec_path);
        var meta_signature = parse.joinPath(meta_path);

        if (signatures.has(meta_signature))
            return;
        
        signatures.set(meta_signature, spec_path);
    });

    var error_msgs = [];
    
    var sig2spec = meta_signatures.map(function(signature) {
        var spec_path = signatures.get(signature);
        if (!spec_path) {
            error_msgs.push("Can't find spec for meta field:", signature);
            return {};
        }
        var subspec = specs.get(spec_path);

        var cs = subspec.constraints.map(function(constraint) {
            var desc = constraints.get(constraint);
            if (!desc) {
                error_msgs.push("No description for", "'" + constraint + "'");
                return {};
            }
            return desc;
        });
        
        return {
            field: signature,
            doc: subspec.doc,
            constraints: cs
        };
    });
    
    if (error_msgs.length > 0)
        return { ok: false, error_msg: error_msgs.join(", ") };

    var doc_lines = [];
    lines.forEach(function(line, index, array) {
        var data = sig2spec[index];
        
        doc_lines.push({
            line: line,
            signature: data.signature,
            doc: data.doc,
            constraints: data.constraints
        });
    });
    
    return {
        ok: true,
        name: Object.keys(spec)[0],
        layout: doc_lines,
        example: fs.readFileSync(example_file, 'utf8').trim()
    };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    standard_spec_guide: standard_spec_guide
};
