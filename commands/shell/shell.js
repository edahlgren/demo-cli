const path = require('path');

const demofile = require('../../util/demofile.js');
const docker = require('../../util/docker.js');
const pull = require('../../util/pull.js');
const up = require('../../util/up.js');

const cli = require('./cli.js');
const dry_run = require('./dry-run.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    
    // This command doesn't work inside a demo shell
    if (demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo shell' from within a demo shell");
    }

    
    // Parse the configuration from the command-line arguments
    //
    //   image:             docker image
    //   instance:          container name
    //   shared_directory:  local directory to share
    //   skip_confirmation: don't prompt for confirmation
    //   quiet:             supress logs and confirmation
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    
    // Execute 'demo shell'
    var result = execShell(config);
    if (!result.ok)
        exit(1, result.error_msg);
}


////////////////////////////////////////////////////////////////////////////////


function execShell(config) {
    // Do a dry run if necessary
    if (!config.skipConfirmation) {
        var stop = dry_run.confirm(config);
        if (stop)
            return { ok: true };
    }

    // Ensure that the docker image is pulled down
    try {
        pull.ensure({
            quiet: config.quiet,
            dockerImage: config.image
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to download the demo: " + e.toString()
        };
    }

    // Ensure that the demo is up and running in the background
    try {
        up.ensure({
            quiet: config.quiet,
            dockerImage: config.image,
            containerName: config.instance,
            sharedDir: config.shared_directory
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to launch the demo: " + e.toString()
        };
    }

    // Enter the shell
    try {
        enterShell({
            quiet: config.quiet,
            containerName: config.instance
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to attach to the demo: " + e.toString()
        };
    }

    return { ok: true };
}

function enterShell(config) {
    if (!config.quiet)
        console.log("\nEntering shell ...");

    // Create some whitespace space to make shell prompt stand out
    console.log("");
    
    docker.execBash({containerName: config.containerName});
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec
};
