const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');

const logSymbols = require('log-symbols');
const mustache = require('mustache');

const fileutil = require('../../util/file.js');
const demofile = require('../../util/demofile');
const render = require('./render');


////////////////////////////////////////////////////////////////////////////////


function make_all(config) {

    // Make sure output directories exist
    fsExtra.ensureDirSync(config.commands_out);
    fsExtra.ensureDirSync(config.specs_out);
    
    console.log("");
    console.log(" Making general help ...");
    console.log("");
    
    var toplevel_errors = make_toplevel_guide(config);

    console.log("");
    console.log(" Making command guides ...");
    console.log("");

    var command_errors = make_command_guides(config);
        
    console.log("");
    console.log(" Making configuration guides ...");
    console.log("");
    
    var specs_errors = make_spec_guides(config);

    var errors = toplevel_errors.concat(command_errors, specs_errors);
    if (errors.length > 0) {
        var error_msg = "\nSome issues were encountered while creating docs:\n\n";

        errors.forEach(function(error) {
            error_msg += "  - " + error.guide + ": " + error.error_msg + "\n";
        });
        error_msg += "\n";
        
        return { ok: false, error_msg: error_msg };
    }

    console.log("");
    
    return { ok: true };
}

// Temporarily just make the html guides. It's easier to debug
// them this way

function make_toplevel_guide(config) {
    var demo = demofile.parse(config.demo_file, []);
    if (!demo.ok)
        return demo;

    let template_file = path.join(config.commands_dir, "help.html");
    let template = fileutil.readContent(template_file);
    if (!template.ok)
        return template;
    
    let html = mustache.render(template.content, {
        title: demo.title,
        description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        download_path: "dm/ant-colony-search"
    });

    let html_file = path.join(config.commands_out, "help.html");
    var write_result = fileutil.writeContent(html_file, html);
    if (!write_result.ok)
        return write_result;
    
    if (config.show_progress) {
        var symbol = write_result.ok ? logSymbols.success : logSymbols.error;
        console.log(" ", symbol, "general help");
    }
    
    if (!write_result.ok)
        return [{
            guide: "help",
            error_msg: write_result.error_msg
        }];

    return [];
}

function make_command_guides(config) {
    
    // Keep track of errors
    var errors = [];
    
    // Iterate through the commands
    var commands = fileutil.readdir(config.commands_dir);
    if (!commands.ok) {
        errors.push({
            guide: "general",
            error_msg: commands.error_msg
        });
        return errors;
    }
    
    // Filter for commands that have guides, and warn on commands
    // that are missing a guide
    var has_data_for_guide = commands.paths.filter(function(command) {
        var dir = path.join(config.commands_dir, command);

        if (command === "help.md")
            return false;
        
        if (!has_guide(dir)) {
            console.log(" ", logSymbols.warning, command, "---", "no guide");
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

        if (guide.needs_all_specs) {
            var specs = fileutil.readdir(config.specs_dir);
            if (!specs.ok)
                return specs;
            
            var has_spec = specs.paths.filter(function(spec) {
                var dir = path.join(config.specs_dir, spec);

                // Skip things that aren't specs (constraints.yml)
                var spec_file = path.join(dir, "spec.yml");
                return fs.existsSync(spec_file);
            });

            var spec_files = has_spec.map(function(spec_dir) {
                return path.join(config.specs_dir, spec_dir, "spec.yml");
            });

            return guide.make(spec_files, template, config.commands_out);
        }

        // Make the guide
        return guide.make(config.demo_file, template, config.commands_out);
    }
    
    // Iterate through command guides
    for (var i = 0; i < has_data_for_guide.length; i++) {
        var name = has_data_for_guide[i];
        
        // Find the command dir
        var command_dir = path.join(config.commands_dir, name);

        // Execute the make function above
        var result = make(command_dir);

        // Handle errors
        if (!result.ok)
            errors.push({
                guide: name,
                error_msg: result.error_msg
            });

        if (config.show_progress) {
            var symbol = result.ok ? logSymbols.success : logSymbols.error;
            console.log(" ", symbol, name);
        }
    }

    // Return errors
    return errors;
}

function make_spec_guides(config) {
    
    // Keep track of errors
    var errors = [];
    
    // Iterate through the commands
    var specs = fileutil.readdir(config.specs_dir);
    if (!specs.ok) {
        errors.push({
            guide: "general",
            error_msg: specs.error_msg
        });
        return errors;
    }

    // Filter for commands that have specs and guides, and warn
    // on commands that don't.
    var has_data_for_guide = specs.paths.filter(function(spec) {
        var dir = path.join(config.specs_dir, spec);

        // Skip things that aren't specs (constraints.yml)
        var spec_file = path.join(dir, "spec.yml");
        if (!fs.existsSync(spec_file)) {
            return false;
        }
        
        var example_file = path.join(dir, "example.yml");
        if (!fs.existsSync(example_file)) {
            console.log(" ", logSymbols.warning, spec);
            return false;
        }

        if (!has_guide(dir)) {
            console.log(" ", logSymbols.warning, spec);
            return false;
        }
        
        return true;
    });
    
    // Find the constraints file
    var constraints_file = path.join(config.specs_dir, 'constraints.yml');
    if (!fs.existsSync(constraints_file)) {
        errors.push({
            guide: "general",
            error_msg: "can't find constraint descriptions at spec_dir/constraints.yml"
        });
        return errors;
    }
    
    // Load constraint descriptions
    var constraints_result = load_constraints(constraints_file);
    if (!constraints_result.ok) {
        errors.push({
            guide: "general",            
            error_msg: constraints_result.error_msg
        });
        return errors;
    }
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
                          constraints, template, config.specs_out);
    }

    // Iterate through command guides
    for (var i = 0; i < has_data_for_guide.length; i++) {
        var name = has_data_for_guide[i];
                
        // Find the spec dir
        var dir = path.join(config.specs_dir, name);

        // Execute the make function above
        var result = make(dir);

        // Handle errors
        if (!result.ok)
            errors.push({
                guide: name,
                error_msg: result.error_msg
            });
        
        if (config.show_progress) {
            var symbol = result.ok ? logSymbols.success : logSymbols.error;
            console.log(" ", symbol, name);
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
    var yaml_result = fileutil.readYAML(file);
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
    
    return { ok: true, constraints: map };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    all: make_all
};
