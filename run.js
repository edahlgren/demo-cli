
const fs = require('fs');
const proc = require('child_process');
const readline = require('readline');
const lineReader = require('line-reader');

const demo = require('./demo.js');
const toml = require('./toml.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'help', alias: 'h', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo run',
    shortDescription: 'Run a demo',
    examples: [],
    formats: [
        'demo run',
        'demo run --help'
    ],
    options: [],
    longDescription: ['This is a long description of demo run'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo run' from outside of a demo shell");
    }

    if (!fs.existsSync('/demo/Demofile.run')) {
        exit(1, "Can't run 'demo run' without /demo/Demofile.run");
    }
    
    // TODO: implement --help
    // TODO: implement interactively choose a run
    // TODO: implement run by name to avoid interactive prompt

    // Spawn the run script asynchronously to stream stdout.
    demofileRun('/demo/Demofile.run', exit);
}

function demofileRun(file, exit) {
    try {
        doDemofileRun(file, exit);
    } catch (error) {
        exit(1, 'demo run exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileRun(file, exit) {
    // Parse the internal Demofile
    var data = toml.parse(file, exit);
    assertHasDataForRun(data, exit);

    // Get the default config
    var config = data.run.preconfigured[data.run.default];

    console.log("");
    console.log("  ---------------------------------------------------------------------");
    console.log("  | Running demo with the '" + data.run.default + "' configuration");                                        
    console.log("  |");
    console.log("  | For more pre-configured ways to run this demo, run 'demo run --help'");
    console.log("  ---------------------------------------------------------------------");
    console.log("");
    
    // Create a regexp if only_log is present
    var re;
    if (config.only_log && config.only_log.length > 0) {
        re = new RegExp(config.only_log);
    }
    
    // Show script
    console.log('  [Command]\n');
    var scriptContents = readScript(config.script, exit);
    scriptContents.split('\n').forEach(function(line) {
        console.log("  " + line);
    });
    
    // Run the demo
    var p = proc.spawn('/bin/bash', [config.script]);

    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to run demo: " + error.toString());
    });

    // Print progress
    var first = true;
    function log(line) {
        if (first) {
            console.log('  [Progress logs]\n');
            first = false;
        }
        if (re && !re.test(line)) {
            // Skip lines that don't match regex
            return;
        }
        //readline.cursorTo(process.stdout, 0);
        process.stdout.write("  " + line + '\n');
    }
    lineReader.eachLine(p.stdout, log);
    
    // Buffer stderr in case of an abnormal exit.
    var stderr = "";
    p.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    // Handle exit.
    p.on('exit', (code) => {
        process.exitCode = (code > 0 ? 1 : 0);
    });

    // Unfortunately can't call exit directly here (if successful)
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        if (code > 0) {
            exit(1, 'Demo exited unexpectedly: ' + stderr);
        }
        
        console.log("");
        console.log("  ---------------------------------------------------------------------");
        console.log("  | For all data logged to stdout, see 'run.log'");
        console.log("  ---------------------------------------------------------------------");
        console.log("");
        
        console.log("  [Output files]\n");
        config.output_files.forEach(function(output) {
            console.log("  - " + output);
        });
        
        console.log("");
        console.log("  ---------------------------------------------------------------------");
        console.log("  | To learn more about the command-line options, test data,");
        console.log("  | and output files, run 'demo run --help'");
        console.log("  ---------------------------------------------------------------------");
        console.log("");
    });
}

function assertHasDataForRun(data, exit) {
    if (!data.run) {
        exit(1, "Malformed Demofile: needs a [run] section");
    }
    if (!data.run.default) {
        exit(1, "Malformed Demofile: needs a 'default' field under [run] section");
    }
    if (!data.run.preconfigured) {
        exit(1, "Malformed Demofile: needs a 'preconfigured' field under [run] section");
    }
}

function readScript(file, exit) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (error) {
        exit(1, "Couldn't read script '" + file + "': " + error.toString());
    }
}

function printRun(config, script) {
    console.log("");
    console.log("Running demo with:");
    console.log("");
    console.log(script);
}

function msgFailure(result) {
    if (result.error) {
        return result.error.toString();
    }
    return result.stderr.toString();
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
