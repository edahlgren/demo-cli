
const fs = require('fs');
const path = require('path');
const util = require('util');
const proc = require('child_process');

const demo = require('../../util/demo.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'complete', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo sync',
    shortDescription: 'Sync a directory in /shared to the demo',
    examples: [],
    formats: [
        'demo sync',
    ],
    options: [],
    longDescription: ['This is a long description of demo sync'],
    notes: []
};

// TODO: implement dir

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

    var verbose = args.hasOwnProperty('verbose') && args.verbose;
    var allowDelete = args.hasOwnProperty('complete') && args.complete;

    doRsync(process.cwd(), false /* shared */, allowDelete, verbose);
}

function doRsync(dir, shared, verbose, allowDelete, exit) {
    // Parse the source, destination, and uid/gid
    var config = rsyncConfig(dir, shared, exit);

    // Do rsync
    var result = rsync(config.source,
                       config.destinationParent,
                       config.uid,
                       config.gid,
                       verbose,
                       allowDelete);

    // Handle errors
    if (result.error || result.status > 0) {
        exit(1, "Unexpected error syncing '" +
             src + "' to '" + dest + "': " + msgFailure(result));
    }
}

function rsyncConfig(dir, share, exit) {
    // Sync from / to the /shared directory
    if (share) {
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
    exec: exec,
    doRsync: doRsync
};
