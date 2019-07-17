
const fs = require('fs');
const path = require('path');
const util = require('util');
const demo = require('./demo.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'delete', alias: 'd', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo sync',
    shortDescription: 'Rsync changes from /shared to /root',
    examples: [],
    formats: [
        'demo sync',
    ],
    options: [],
    longDescription: ['This is a long description of demo sync'],
    notes: []
};

function exec(args, exit) {
    'use strict';

    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo sync' from outside of a demo shell");
    }

    // Is there even a shared directory in the first place? We put
    // it in a standard place so it's easy to find.
    if (!fs.existsSync('/shared')) {
        exit(0, "Nothing to sync, no shared directory");
    }

    // Directories to sync
    var dirs = [];
    var verbose = args.hasOwnProperty('verbose') && args.verbose;
    var allowDelete = args.hasOwnProperty('delete') && args.delete;

    // No dirs given
    if (args.dirs.length == 0) {
        // Get all directories under /shared
        dirs = fs.readdirSync('/shared');
        if (dirs.length == 0) {
            exit(0, "Nothing to sync, shared directory is empty");
        }
    } else {
        // Check that the given directories exist
        args.dirs.forEach(function(dir) {
            var fullpath = path.join('/shared', dir);
            if (!fs.existsSync(dir)) {
                exit(1, "Can't sync directory '" + dir + "' because it doesn't exist");
            }
        });
        dirs = args.dirs;
    }

    // Run rsync
    for (var i = 0; i < dirs.length; i++) {
        var src = path.join('/shared', dirs[i]);
        var dest = path.join('/root', dirs[i]);
        
        var result = rsync(src, dest, verbose, allowDelete);
        if (result.error || result.status > 0) {
            console.log("Unexpected error syncing '" +
                        src + "' to '" + dest + "': " + msgFailure(result));
            exit(1, "Failed to completely sync");
        }
        
        var progress = util.format('[%d/%d] %s -> %s', i+1, dirs.length, src, dest);
        console.log(progress);
    }
    
    exit(0);
}

function rsync(src, dest, verbose, allowDelete) {
    var args = [];

    // Recursively
    args.push('-a');

    // Verbosely
    if (verbose) {
        args.push('-v');
    }
    
    // Chown files and directories at destination
    // to this owner
    var owner = util.format('%d:%d', uid, gid);
    args.push('--chown=' + owner);

    // Source directory
    args.push(src);

    // Destination directory
    args.push(dest);

    // Delete files in dest that don't exist in src
    if (allowDelete) {
        args.push('--delete');
    }

    // Do rsync
    return proc.spawnSync('rsync', args);
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
