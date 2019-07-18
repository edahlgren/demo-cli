
const fs = require('fs');
const path = require('path');
const util = require('util');
const proc = require('child_process');

const demo = require('./demo.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'shared', type: Boolean },
    { name: 'complete', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean },
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
    var verbose = args.hasOwnProperty('verbose') && args.verbose;
    var allowDelete = args.hasOwnProperty('complete') && args.complete;
    var shared = args.hasOwnProperty('shared') && args.shared;

    var dir = process.cwd();
    var config = rsyncPaths(dir, shared, exit);

    // Do the rsync
    var result = rsync(config.source,
                       config.destinationParent,
                       config.uid,
                       config.gid,
                       verbose,
                       allowDelete);
    
    console.log(result);
    
    if (result.error || result.status > 0) {
        exit(1, "Unexpected error syncing '" +
             src + "' to '" + dest + "': " + msgFailure(result));
    }
    
    exit(0);
}

function rsyncPaths(dir, toShared, exit) {
    // Sync from / to the /shared directory
    if (toShared) {
        var stats = fs.statSync('/shared');
        return {
            source: dir,
            destinationParent: path.join('/shared', path.dirname(dir)),
            uid: stats.uid,
            gid: stats.gid
        };
    }

    // Sync from /shared back to /
    var src = path.join('/shared', dir);
    if (!fs.existsSync(src)) {
        exit(1, "Cannot sync from '" + src + "' because it doesn't exist");
    }
    return {
        source: src,
        destinationParent: path.dirname(dir),
        uid: 0,
        gid: 0
    };
}

function rsync(src, dest, uid, gid, verbose, allowDelete) {
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

    console.log("rsync " + args.join(' '));

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
