const fs = require('fs');
const path = require('path');
const logSymbols = require('log-symbols');

const fileutil = require('../../util/file.js');
const demofile = require('../../util/demofile.js');

const parse = require('./parse.js');
const check = require('./check.js');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'section', defaultOption: true },
    { name: 'check', type: Boolean },
    
    { name: 'demofile' },
    { name: 'specdir' },
    
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    // Can run inside or outside demo, at least for now
    
    // Parse the configuration from the command-line arguments
    //
    //   name:              Name of the configuration
    //   isDefault:         Whether this is the default configuration
    //   script:            Script to execute
    //
    var config = parseArgs(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    if (config.check) {
        var check_result = execCheck(config);
        if (!check_result.ok)
            exit(1, check_result.error_msg);
        
        exit(0);
    }

    console.log("not implemented");
    exit(1);
}


////////////////////////////////////////////////////////////////////////////////


function parseArgs(args) {

    // Parse simple options first
    var needsCheck = (args.hasOwnProperty('check') && args.check);
    var hasSection = args.hasOwnProperty('section');
    var verbose = args.hasOwnProperty('verbose');

    
    // Doesn't need check so just pass on the section (if given)
    // to display the help guide for
    if (!needsCheck) {
        if (!hasSection)
            return { ok: true };
        
        return {
            ok: true,
            section: args.section
        };
    }

    
    // Needs check, so find a demo file
    var demo_file = (args.hasOwnProperty('demofile') ? args.demofile
                    : demofile.default());
    if (!fs.existsSync(demo_file))
        return {
            ok: false,
            error_msg: "demo file '" + demo_file + "' doesn't exist"
        };

    
    // Needs check, so find at least 1 spec
    var spec_dir = (args.hasOwnProperty('specdir') ? args.specdir
                    : (demofile.isInsideDemo() ? "/demo/specs" : ""));
    if (!fs.existsSync(spec_dir))
        return {
            ok: false,
            error_msg: "spec directory '" + spec_dir + "' doesn't exist"
        };
                   
    var readdir_result = fileutil.readdir(spec_dir);
    if (!readdir_result.ok)
        return readdir_result;
    
    if (readdir_result.paths.length == 0)
        return {
            ok: false,
            error_msg: "spec directory has no files"
        };

    var spec_files = readdir_result.paths.filter(function(p) {
        return path.extname(p) === '.yml';
    });
    if (spec_files.length == 0)
        return {
            ok: false,
            error_msg: "spec directory has no specs"
        };
    
    spec_files = spec_files.map(function(file) {
        return path.join(spec_dir, file);
    });


    // Make sure there's a spec file that refers the section
    if (hasSection) {
        var single_file = spec_files.filter(function(p) {
            return path.parse(p).name === args.section;
        });
        
        if (single_file.length == 0) {
            var options = spec_files.map(function(file) {
                return path.parse(file).name;
            });

            var error_msg = "Can't find spec for '" + args.section + "'. "
                    + "Available specs:\n";
            options.forEach(function(option) {
                error_msg += "  - " + option + "\n";
            });
            
            return {
                ok: false,
                error_msg: error_msg
            };
        }
        
        spec_files = [ single_file[0] ];
    }

    return {
        ok: true,
        check: true,
        demofile: demo_file,
        specs: spec_files,
        verbose: verbose
    };
}

function execCheck(config) {

    // Read in the demofile
    var demo = demofile.parse(config.demofile, []);
    if (!demo.ok)
        return demo;


    // Load the spec files
    var specs_result = load_specs(config.specs);
    if (!specs_result.ok)
        return specs_result;
    var specs = specs_result.specs;
    

    // Check for specs that would be unused, warn but don't abort
    var unused_specs = find_unused_specs(demo, specs);
    unused_specs.forEach(function(spec) {
        console.log(logSymbols.warning, "skipping spec", "'" + spec.section + "'",
                    "('" + spec.file + "'):", "'" + spec.section + "'",
                    "is not in", "'" + config.demofile + "'");
        specs.delete(spec.section);
    });

    if (specs.size == 0)
        return {
            ok: false,
            error_msg: "no specs match demo file data, nothing to do"
        };

    var keys = Array.from(specs.keys());
    console.log("\nChecking:", keys.join(', '), "\n");

    
    // Iterate through each of the remaining specs, checking that
    // the demo data fullfills the spec.
    var errors = [];

    var first = true;
    specs.forEach(function(value, key, map) {

        // The spec to use
        var spec = value.spec;

        // Create an object to mirror the one in the spec
        var demo_section = {};
        demo_section[key] = demo[key];

        // Print progress
        if (config.verbose) {
            var prefix = (first ? "" : "\n");
            console.log(prefix + "  checking", "'" + key + "'");
        }

        // Try to match parts of the spec with parts of the section
        var parse_result = parse.do_parse(demo_section, spec,
                                          config.verbose);
        if (!parse_result.ok) {

            console.log(" ", logSymbols.error, demo_section);
            errors.push({
                section: key,
                error_msgs: [ "Unexpected error: " + parse_result.error_msg ]
            });
            return;
        }

        // Run checks
        var check_result = check.do_check(parse_result.data,
                                          config.verbose);
        if (!check_result.ok) {
            console.log(" ", logSymbols.error, key);
            errors.push({
                section: key,
                error_msgs: [ "Unexpected error: " + check_result.error_msg ]
            });
            return;
        }
            
        var error_msgs = check_result.issues.map(function(issue) {

            var msg = "";
            switch (issue.type) {
            case check.ISSUE_EXTRA_METADATA:
                msg = "This data isn't recognized and won't be used:\n";
                issue.paths.forEach(function(path) {
                    msg += "    - " + path + "\n";
                });
                return msg;
                
            case check.ISSUE_REQUIRED_METADATA:
                msg = "These fields are required but weren't found:\n";
                issue.paths.forEach(function(path) {
                    msg += "    - " + path + "\n";
                });
                return msg;
                
            case check.ISSUE_CHECKED_VALUE:
                msg = issue.path +  "\n";
                msg += "     value: " + issue.value + "\n";
                msg += "     issues:\n";
                
                issue.issues.forEach(function(subissue) {
                    msg += "        - " + subissue + "\n";
                });
                return msg;
                
            default:
                throw new Error("BUG");
            }
            
        });
        
        if (error_msgs.length > 0) {
            errors.push({
                section: key,
                error_msgs: error_msgs
            });
            console.log(" ", logSymbols.error, key);
        } else {
            console.log(" ", logSymbols.success, key);
        }
            
        first = false;
    });


    // Parse errors into a single message
    if (errors.length > 0) {
        var error_msg = "Some checks failed. Details:\n";
        errors.forEach(function(error) {
            error_msg += "  - [" + error.section + "]:\n\n";
            error.error_msgs.forEach(function(msg) {
                var lines = msg.split('\n');
                lines.forEach(function(line) {
                    error_msg += "    " + line + "\n";
                });
            });
        });
        return {
            ok: false,
            error_msg: error_msg
        };
    }


    // Success
    console.log("\n" + logSymbols.success, "All checks succeeded\n");
    return { ok: true };
}

function load_specs(files) {
    var specs = new Map();
    var errors = [];

    // Try to parse each of the files
    files.forEach(function(file) {

        // Try to parse the spec as YAML
        var read_result = fileutil.readYAML(file);
        if (!read_result.ok) {
            errors.push({
                file: file,
                error_msg: read_result.error_msg
            });
            return;
        }

        // Parse out the high-level specs
        var yaml = read_result.yaml;

        var new_error = false;
        for (var toplevel in yaml) {
            if (!yaml.hasOwnProperty(toplevel))
                continue;

            // Check if there's already a spec
            // for this top-level section
            var alreadyExists = specs.get(toplevel);
            if (alreadyExists)
                errors.push({
                    file: file,
                    error_msg: "top-level spec '" + toplevel
                        + "' is already in file '" + alreadyExists.file 
                        + "', can't use both"
                });

            specs.set(toplevel, {
                file: file,
                spec: yaml
            });
        }
    });

    if (errors.length > 0) {
        var error_msg = "there were some issues loading the spec files:\n";
        errors.forEach(function(error) {
            error_msg += "  - " + error.file + ": " + error.error_msg + "\n";
        });
        error_msg += "\n";
        
        return {
            ok: false,
            error_msg: error_msg
        };
    }

    return { ok: true, specs: specs };
}

function find_unused_specs(demo, specs) {
    var unused = [];
    specs.forEach(function(value, key, map) {
        if (!demo.hasOwnProperty(key))
            unused.push({
                section: key,
                file: value.file
            });
    });
    return unused;
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    exec: exec
};
