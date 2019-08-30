const fs = require('fs');
const proc = require('child_process');

const demo = require('../../util/demo.js');
const fileutil = require('../../util/file.js');
const cli = require('./cli.js');


////////////////////////////////////////////////////////////////////////////////
//
// This is almost identical to the implementation of run. It would be better if
// there were some common code shared between them, like the async spawning,
// with a couple callbacks passed in.
//
// TODO: implement --help
// TODO: implement interactively choose a build


function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo bulid' from outside of a demo shell");
    }
    
    // Parse the configuration from the command-line arguments
    //
    //   needsClean:        Whether to clean first
    //   cleanScript:       The clean script
    //   name:              Name of the configuration
    //   isDefault:         Whether this is the default configuration
    //   script:            Script to execute
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    
    // Clean if necessary
    if (config.needsClean) {
        var clean = spawnSync(config.cleanScript);
        if (!clean.ok)
            exit(1, "Failed to clean before build: " + clean.error_msg);
    }

    // Spawn script asynchronously, otherwise we can't stream out stdout
    // quickly. Because we execute the script asynchronously, we also need
    // to pass exit through to be called when the process exits.
    asyncBuild(config, exit);
}


////////////////////////////////////////////////////////////////////////////////


function spawnSync(script) {
    var result = proc.spawnSync('/bin/bash', [script]);
    if (result.error)
        return {
            ok: false,
            error_msg: result.error.toString()
        };
    
    if (result.status > 0)
        return {
            ok: false,
            error_msg: result.stderr.toString()
        };

    return { ok: true };
}

function asyncBuild(config, exit) {
    var status = printHeader(config);
    if (!status.ok)
        exit(1, status.error_msg);
    
    // Build the demo
    console.log('[Logs]\n');
    
    var p = proc.spawn('/bin/bash', [config.script], {
        stdio: ['pipe', process.stdout, process.stderr]
    });
    
    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to build demo: " + error.toString());
    });

    // Handle exit.
    p.on('exit', (code) => {
        process.exitCode = (code > 0 ? 1 : 0);
    });

    // Unfortunately can't call exit directly here (if successful)
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        printFooter(code > 0);
    });
}

function printHeader(config) {
    var result = fileutil.readContent(config.script);
    if (!result.ok)
        return result;
    
    console.log("");
    console.log("---------------------------------------------------------------------");
    console.log("|");    
    console.log("| Building demo with the '" + config.name + "' configuration");
    console.log("|");    
    console.log("---------------------------------------------------------------------");
    console.log("");

    // Show script
    console.log('[Command line]\n');
    console.log(result.contents);

    return { ok: true };
}

function printFooter(error) {
    if (error) {
        console.log("");
        console.log("----------------------------------------------------------------------");
        console.log("|");
        console.log("| Build exited unexpectedly");
        console.log("|");
        console.log("| To debug see the logs above or build.log");
        console.log("|");
        console.log("----------------------------------------------------------------------");
    } else {
        console.log("");
        console.log("----------------------------------------------------------------------");
        console.log("|");
        console.log("| Build exited successfully. Next:");
        console.log("|");
        console.log("| - Run 'demo run' to run the demo");
        console.log("| - Run 'demo build --help' to learn about more ways to build");
        console.log("|");
        console.log("----------------------------------------------------------------------");
        console.log("");
    }
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec
};
