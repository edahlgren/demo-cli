const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const demofile = require('../../util/demofile.js');
const cli = require('./cli.js');
const make = require('./make.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';    
    
    // Parse the configuration from the command-line arguments
    //
    //   make:              Whether to re-make the docs 
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    if (cli.help(args) && config.make)
        exit(1, "Use either '--help' or '--make', not both at once");

    // Make the docs
    if (config.make) {
        var result = make.all({
            // Print success or failure for each doc
            show_progress: true,

            // Path to the current configuration
            demo_file: config.demofile,

            // Path to the commands this CLI supports
            commands_dir: path.resolve(__dirname, '../'),
            commands_out: config.commands_out,

            // Paths to the specs sections of the demo file
            specs_dir: path.resolve(__dirname, '../../specs'),
            specs_out: config.specs_out
        });
        
        if (!result.ok)
            exit(1, result.error_msg);
        
        exit(0);
    }

    // Showing docs doesn't work inside a demo shell
    if (!demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo docs' from outside of a demo shell");
    }
    
    // Does the guide exist?
    var guide = guide_path({ name: "docs", command: true });
    if (!guide.ok)
        exit(1, guide.error_msg);
    
    // Show the high-level docs guide
    asyncLess(guide.path, exit);
}


////////////////////////////////////////////////////////////////////////////////


function guide_path(config) {
    if (config.command) {
        let p = path.join(command_guides_dir, config.name + ".txt");
        if (!fs.existsSync(p)) {
            return {
                ok: false,
                error_msg: "guide for command '" + config.name + "' doesn't exist"
            };
        }
        return { ok: true, path: p };
    }
    if (config.spec) {
        let p = path.join(spec_guides_dir, config.name + ".txt");
        if (!fs.existsSync(p)) {
            return {
                ok: false,
                error_msg: "guide for configuration section '" + config.name + "' doesn't exist"
            };
        }
        return { ok: true, path: p };
    }
    return {
        ok: false,
        error_msg: "need to specify either a command or spec guide"
    };
}

function asyncLess(file, exit) {
    if (!fs.existsSync(file))
        exit(1, "docs error: '" + file + "' doesn't exist. Run 'demo docs --make'");
    
    var p = proc.spawn('less', [file], {
        stdio: ['pipe', process.stdout, 'pipe']
    });

    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to run less: " + error.toString());
    });

    // Buffer stderr in case of an abnormal exit.
    var stderr = "";
    p.stderr.on('data', (data) => {
        stderr += data.toString();
    });
    
    // Handle exit.
    p.on('exit', (code) => {
        process.exitCode = (code > 0 ? 1 : 0);
    });

    // Handle before exit
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        if (code > 0)
            exit(1, "docs error: less failed: " + stderr.toString());
    });
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec,
    path: guide_path,
    asyncLess: asyncLess
};
