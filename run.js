
const fs = require('fs');
const proc = require('child_process');
const readline = require('readline');
const lineReader = require('line-reader');

const demo = require('./demo.js');
const toml = require('./toml.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'config', defaultOption: true },
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

    // Parse the internal Demofile
    var data = toml.parse('/demo/Demofile.run', exit);
    assertHasDataForRun(data, exit);

    // Choose a configuration to use
    var name = getConfigName(args, data, exit);
    var isDefault = (name == data.run.default);
    var config = data.run.preconfigured[name];
    
    // TODO: implement --help
    // TODO: implement interactively choose a run

    // Spawn the run script asynchronously to stream stdout.
    demofileRun(name, config, isDefault, exit);
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

function getConfigName(args, data, exit) {
    var hasConfig = args.hasOwnProperty('config');
    if (hasConfig) {
        var configIsDefined = false;
        var keys = [];
        for (key in data.run.preconfigured) {
            keys.push(key);
        }
        if (!keys.includes(args.config)) {
            exit(1, "Can't run demo with undefined preconfiguration '" +
                 args.config + "' use one of [" + keys + "]"); 
        }
        return args.config;
    }

    // Use the default config by default.
    return data.run.default;
}

function demofileRun(name, config, isDefault, exit) {
    try {
        doDemofileRun(name, config, isDefault, exit);
    } catch (error) {
        exit(1, 'demo run exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileRun(name, config, isDefault, exit) {

    console.log("");
    console.log("---------------------------------------------------------------------");
    console.log("| Running demo with the '" + name + "' configuration " + defaultStr(isDefault));
    console.log("---------------------------------------------------------------------");
    console.log("");
    
    // Show script
    console.log('[Command line]\n');
    console.log(readScript(config.script, exit));
    
    console.log('[Logs]\n');
    
    // Run the demo
    var p = proc.spawn('/bin/bash', [config.script], {
        stdio: ['pipe', process.stdout, 'pipe']
    });
    
    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to run demo: " + error.toString());
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

    // Unfortunately can't call exit directly here (if successful)
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        if (code > 0) {
            exit(1, 'Demo exited unexpectedly: ' + stderr);
        }
        
        console.log("[Output files]\n");
        config.output_files.forEach(function(output) {
            console.log("- " + output);
        });
        
        console.log("");
        console.log("---------------------------------------------------------------------");
        console.log("| Run 'demo run --help' to learn more");
        console.log("---------------------------------------------------------------------");
        console.log("");
    });
}

function defaultStr(isDefault) {
    if (isDefault) {
        return "(default)";
    }
    return "";
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
