
const fs = require('fs');
const proc = require('child_process');
const demo = require('./demo.js');
const toml = require('./toml.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'config', defaultOption: true },
    { name: 'clean', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo bulid',
    shortDescription: 'Run a demo',
    examples: [],
    formats: [
        'demo build',
        'demo bulid --help'
    ],
    options: [],
    longDescription: ['This is a long description of demo bulid'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo bulid' from outside of a demo shell");
    }

    if (!fs.existsSync('/demo/Demofile.build')) {
        exit(1, "Can't run 'demo build' without /demo/Demofile.build");
    }
    
    // Parse the internal Demofile
    var data = toml.parse('/demo/Demofile.build', exit);
    assertHasDataForBuild(data, exit);

    // Choose a configuration to use
    var name = getConfigName(args, data, exit);
    var isDefault = (name == data.build.default);
    var config = data.build.preconfigured[name];

    // Clean before running build
    var shouldClean = args.hasOwnProperty('clean') && args.clean;
    if (shouldClean) {        
        runClean(data.build.clean, exit);
    }
    
    // TODO: implement --help
    // TODO: implement interactively choose a build

    demofileBuild(name, config, isDefault, exit);
}

function assertHasDataForBuild(data, exit) {
    if (!data.build) {
        exit(1, "Malformed Demofile: needs a [build] section");
    }
    if (!data.build.default) {
        exit(1, "Malformed Demofile: needs a 'default' field under [build] section");
    }
    if (!data.build.clean) {
        exit(1, "Malformed Demofile: needs a 'clean' field under [build] section");
    }
    if (!fs.existsSync(data.build.clean)) {
        exit(1, "Malformed Demofile: 'clean' must be a script file that exists");
    }
    if (!data.build.preconfigured) {
        exit(1, "Malformed Demofile: needs a 'preconfigured' field under [build] section");
    }
    
    // TODO: iterate through the preconfigured builds
    // and make sure they have all the needed data.
}

function runClean(script, exit) {
    var result = proc.spawnSync('/bin/bash', [script]);
    if (result.error) {
        exit(1, "Failed to run clean script before build: " + result.error.toString());
    }
    if (result.status > 0) {
        exit(1, "Failed to clean before building: " + result.stderr.toString());
    }
}

function getConfigName(args, data, exit) {
    var hasConfig = args.hasOwnProperty('config');
    if (hasConfig) {
        var configIsDefined = false;
        var keys = [];
        for (key in data.build.preconfigured) {
            keys.push(key);
        }
        if (!keys.includes(args.config)) {
            exit(1, "Can't run demo with undefined preconfiguration '" +
                 args.config + "' use one of [" + keys + "]"); 
        }
        return args.config;
    }

    // Use the default config by default.
    return data.build.default;
}

function demofileBuild(name, config, isDefault, exit) {
    try {
        doDemofileBuild(name, config, isDefault, exit);
    } catch (error) {
        exit(1, 'demo bulid exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileBuild(name, config, isDefault, exit) {
    
    console.log("");
    console.log("---------------------------------------------------------------------");
    console.log("| Building demo with the '" + name + "' configuration:");
    console.log("|");
    console.log("|   " + config.description);
    console.log("---------------------------------------------------------------------");
    console.log("");

    // Show script
    console.log('[Command line]\n');
    console.log(readScript(config.script, exit));

    console.log('[Logs]\n');

    // Run the demo
    var p = proc.spawn('/bin/bash', [config.script], {
        stdio: ['pipe', process.stdout, process.stderr]
    });
    
    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to run demo: " + error.toString());
    });

    // Handle exit.
    p.on('exit', (code) => {
        process.exitCode = (code > 0 ? 1 : 0);
    });

    // Unfortunately can't call exit directly here (if successful)
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        if (code > 0) {
            console.log("");
            console.log("|---------------------------------------------------------------------");
            console.log("| Build failed");
            console.log("|");
            console.log("| To debug see the logs above or build.log");
            console.log("|---------------------------------------------------------------------");
            exit(1);
        }
        
        console.log("");
        console.log("|---------------------------------------------------------------------");
        console.log("| Build succeeded");
        console.log("|");
        console.log("| Run 'demo run' to run the demo, or 'demo build --help' for more ways");
        console.log("| to build the demo.");
        console.log("| ---------------------------------------------------------------------");
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

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
