const fs = require('fs');
const path = require('path');
const logSymbols = require('log-symbols');

const fileutil = require('../../util/file.js');


////////////////////////////////////////////////////////////////////////////////


function make_all(config) {

    console.log("");
    console.log("Making docs ...");
    console.log("");
    
    var command_errors = make_command_guides(config.demo_file,
                                             config.commands_dir,
                                             config.commands_out,
                                             config.show_progress);
    
    var specs_errors = make_spec_guides(config.specs_dir,
                                        config.specs_out,
                                        config.show_progress);

    var errors = command_errors.concat(specs_errors);
    
    if (errors.length > 0) {
        var error_msg = "\nSome issues were encountered while creating docs:\n\n";

        errors.forEach(function(error) {
            error_msg += "  - " + error.guide + ": " + error.error_msg + "\n";
        });
        error_msg += "\n";
        
        return { ok: false, error_msg: error_msg };
    }
    
    console.log("");
    console.log(logSymbols.success, "All docs created");
    console.log("");
    
    return { ok: true };
}

function make_command_guides(demo_file, commands_dir,
                             out_dir, show_progress) {
    
    // Iterate through the commands
    var commands = fileutil.readdir(commands_dir);
    if (!commands.ok)
        return commands;
    
    // Filter for commands that have guides, and warn on commands
    // that are missing a guide
    var has_guide = commands.paths.filter(function(command) {
        var dir = path.join(commands_dir, command);
        
        if (!has_guide(dir)) {
            console.log("!!", "skipping", "'" + command + "',",
                        "doesn't have a guide");
            return false;
        }
        
        return true;
    });

    // How to execute the make script in the command dir
    function make(command_dir) {
        // Find the template
        var template = path.join(command_dir, "guide/template.md");
        if (!fs.existsSync(template))
            return { ok: false, error_msg: "" };

        // Find the script
        var script = path.join(command_dir, "guide/make.js");
        if (!fs.existsSync(script))
            return { ok: false, error_msg: "" };

        // Load the script
        var guide = require(script);

        // Make the guide
        return guide.make(demo_file, template, out_dir);
    }
    
    // Keep track of errors
    var errors = [];

    // Iterate through command guides
    for (var i = 0; i < has_guide.length; i++) {
        
        // Find the command dir
        var command_dir = path.join(commands_dir, has_guide[i]);

        // Execute the make function above
        var result = make(command_dir);

        // Handle errors
        if (!result.ok)
            errors.push({
                guide: has_guide[i],
                error_msg: result.error_msg
            });

        if (show_progress) {
            var symbol = result.ok ? logSymbols.success : logSymbols.error;
            console.log(" ", symbol, has_guide[i]);
        }
    }

    // Return errors
    return errors;
}

function make_spec_guides(specs_dir, out_dir, show_progress) {
    
    // Iterate through the commands
    var specs = fileutil.readdir(specs_dir);
    if (!specs.ok)
        return specs;

    // Find the constraints file
    var constraints_file = path.join(specs_dir, 'constraints.yml');
    if (!fs.existsSync(constraints_file))
        return {
            ok: false,
            error_msg: "can't find constraint descriptions at spec_dir/constraints.yml"
        };
    
    // Filter for commands that have specs and guides, and warn
    // on commands that don't.
    var has_data_for_guide = specs.paths.filter(function(spec) {
        var dir = path.join(specs_dir, spec);

        // Skip things that aren't specs (constraints.yml)
        var spec_file = path.join(dir, "spec.yml");
        if (!fs.existsSync(spec_file)) {
            return false;
        }
        
        var example_file = path.join(dir, "example.yml");
        if (!fs.existsSync(example_file)) {
            console.log("!!", "skipping", "'" + spec + "',",
                        "doesn't have an example");
            return false;
        }

        if (!has_guide(dir)) {
            console.log("!!", "skipping", "'" + spec + "',",
                        "doesn't have a guide");
            return false;
        }
        
        return true;
    });

    
    // Load constraint descriptions
    var constraints_result = load_constraints(constraints_file);
    if (!constraints_result.ok)
        return constraints_result;
    
    var constraints = constraints_result.constraints;

    // How to execute the make script in the spec dir
    function make(dir) {

        // Files
        var spec_file = path.join(dir, "spec.yml");
        var example_file = path.join(dir, "example.yml");
        var template = path.join(dir, "guide/template.md");
        var script = path.join(dir, "guide/make.js");
        
        // Load the script
        var guide = require(script);

        // Make the guide
        return guide.make(spec_file, example_file,
                          constraints, template, out_dir);
    }
    
    // Keep track of errors
    var errors = [];

    // Iterate through command guides
    for (var i = 0; i < has_guide.length; i++) {
        
        // Find the spec dir
        var dir = path.join(specs_dir, has_guide[i]);

        // Execute the make function above
        var result = make(dir);

        // Handle errors
        if (!result.ok)
            errors.push({
                guide: has_guide[i],
                error_msg: result.error_msg
            });
        
        if (show_progress) {
            var symbol = result.ok ? logSymbols.success : logSymbols.error;
            console.log(" ", symbol, has_guide[i]);
        }
    }

    // Return errors
    return errors;        
}

function has_guide(dir) {
    var guide = path.join(dir, 'guide');
    if (!fs.existsSync(guide)) {
        return false;
    }

    var template = path.join(guide, 'template.md');
    if (!fs.existsSync(template)) {
        return false;
    }
        
    var script = path.join(guide, 'make.js');
    if (!fs.existsSync(script)) {
        return false;
    }

    return true;
}

function load_constraints(file) {
    var yaml_result = fileutil.readYAML(constraints_file);
    if (!yaml_result.ok)
        return yaml_result;

    var cs = yaml_result.yaml;
    var map = new Map();

    for (var i = 0; i < cs.constraints.length; i++) {
        var constraint = cs.constraints[i];
        var value = map.get(constraint.name);
        if (value) {
            return {
                ok: false,
                error_msg: "Malformed file: constraint " + constraint.name +
                    " listed twice"
            };
        }
        map.set(constraint.name, constraint.description);
    }
    
    return map;
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    all: make_all
};
