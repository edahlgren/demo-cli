const fs = require('fs');

const demofile = require('../../util/demofile.js');
const sync = require('../sync/sync.js');


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

    
    // Parse the configuration from the command-line arguments
    //
    //   verbose:           Whether to show rsync logs
    //   allowDelete:       Whether to remove files at the destination
    //   directory:         The directory to share
    //
    var config = sync.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    
    // Rsync the directory to /shared
    var result = sync.rsync(config, true /* shared */);
    if (!result.ok)
        exit(1, result.error_msg);        
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: sync.spec,
    exec: exec
};
