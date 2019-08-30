const demofile = require('../../util/demofile.js');
const docker = require('../../util/docker.js');
const up = require('../../util/up.js');
const cli = require('./cli.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    // This command doesn't work inside a demo shell
    if (demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo down' from within a demo shell");
    }

    
    // Parse the configuration from the command-line arguments
    //
    //   instance:          container name
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    
    // Execute 'demo down'
    var result = execDown(config);
    if (!result.ok)
        exit(1, result.error_msg);
}

function execDown(config) {
    var status = up.containerStatus(config.instance);
    if (!up.isUp(status)) {
        return {
            ok: false,
            error_msg: "Demo isn't up, run 'demo shell' first"
        };
    }

    docker.killContainer({
        containerName: config.instance
    });

    console.log("");
    console.log("Demo is down. Relaunch a fresh container by running 'demo shell'.");
    console.log("");

    return { ok: true };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec
};
