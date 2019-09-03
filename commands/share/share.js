const fs = require('fs');

const docs = require('../docs/docs');
const demofile = require('../../util/demofile.js');
const sync = require('../sync/sync.js');
const cli = require('../sync/cli.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo share' from outside of a demo shell");
    }

    
    // Check that there's a shared directory to share files with.
    if (!fs.existsSync('/shared')) {
        exit(0, "Nothing to share, no shared directory");
    }

    // Handle help
    if (cli.help(args)) {

        // Does the guide exist?
        var guide = docs.path({ name: "share", command: true });
        if (!guide.ok)
            exit(1, guide.error_msg);
        
        docs.asyncLess(guide.path, exit);
    }
    
    // Handle the command
    else {
        
        // Parse the configuration from the command-line arguments
        //
        //   verbose:           Whether to show rsync logs
        //   allowDelete:       Whether to remove files at the destination
        //   directory:         The directory to share
        //
        var config = cli.parse(args, exit);
        if (!config.ok)
            exit(1, config.error_msg);
        
        
        // Rsync the directory to /shared
        var result = sync.rsync(config, true /* shared */);
        if (!result.ok)
            exit(1, result.error_msg);
        
    }
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: sync.spec,
    exec: exec
};
