const fs = require('fs');
const proc = require('child_process');

const demofile = require('../../util/demofile.js');
const fileutil = require('../../util/file.js');
const cli = require('./cli.js');


////////////////////////////////////////////////////////////////////////////////
//
// This is almost identical to the implementation of run. It would be better if
// there were some common code shared between them, like the async spawning,
// with a couple callbacks passed in.
//
// TODO: implement --help
// TODO: implement interactively choose a run


function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo run' from outside of a demo shell");
    }

    // Parse the configuration from the command-line arguments
    //
    //   name:              Name of the configuration
    //   isDefault:         Whether this is the default configuration
    //   script:            Script to execute
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);
    
    // Spawn script asynchronously, otherwise we can't stream out stdout
    // quickly. Because we execute the script asynchronously, we also need
    // to pass exit through to be called when the process exits.
    asyncRun(config, exit);
}


////////////////////////////////////////////////////////////////////////////////


function asyncRun(config, exit) {
    var status = printHeader(config);
    if (!status.ok)
        exit(1, status.error_msg);
    
    // Run the demo
    console.log('[Logs]\n');

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
    console.log("| Running demo with the '" + config.name + "' configuration ");
    console.log("|");    
    console.log("---------------------------------------------------------------------");
    console.log("");

    console.log('[Command line]\n');
    console.log(result.content);
    
    return { ok: true };
}

function printFooter(error) {
    if (error) {
        console.log("");
        console.log("----------------------------------------------------------------------");
        console.log("|");
        console.log("| Run exited unexpectedly");
        console.log("|");
        console.log("| To debug see the logs above or run.log");
        console.log("|");
        console.log("----------------------------------------------------------------------");
    } else {
        console.log("");
        console.log("---------------------------------------------------------------------");
        console.log("|");
        console.log("| Run exited successfully. Next:");
        console.log("|");
        console.log("| - Run 'demo inspect source' to find the source code");
        console.log("| - Run 'demo run --help' to learn about more ways to run");
        console.log("|");
        console.log("---------------------------------------------------------------------");
        console.log("");
    }
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec
};
