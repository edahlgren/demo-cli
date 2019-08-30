const fs = require('fs');
const path = require('path');
const util = require('util');
const proc = require('child_process');

const demofile = require('../../util/demofile.js');
const cli = require('./cli.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    // This command doesn't work outside of a demo shell
    if (!demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo sync' from outside of a demo shell");
    }

    
    // Check that there's a shared directory to share files with.
    if (!fs.existsSync('/shared')) {
        exit(0, "Nothing to sync, no shared directory");
    }

    
    // Parse the configuration from the command-line arguments
    //
    //   verbose:           Whether to show rsync logs
    //   allowDelete:       Whether to remove files at the destination
    //   directory:         The directory to share
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);


    // Rsync a directory from /shared to config.directory
    var result = rsync(config, false /* shared */);
    if (!result.ok)
        exit(1, result.error_msg);        
}


////////////////////////////////////////////////////////////////////////////////


function rsync(config, toShared) {
    // Parse the source, destination, and uid/gid
    var rconfig = getConfig(config.directory, toShared);
    if (!rconfig.ok)
        return rconfig;
    
    // Spawn the rsync process
    return spawnRsync(rconfig.source, rconfig.destParent,
                      rconfig.uid, rconfig.gid,
                      config.verbose, config.allowDelete);
    
}

function getConfig(dir, toShared) {
    // Sync from dir to /shared
    if (toShared) {
        var stats = fs.statSync('/shared');
        return {
            ok: true,
            
            // From /{dir} to /shared/{dir}
            source: dir,
            destParent: path.join('/shared', path.dirname(dir)),

            // Use the UID/GID of the mounted directory at /shared
            // so someone outside of the demo can access and delete
            // the files freely
            uid: stats.uid,
            gid: stats.gid
        };
    }

    // Can't sync from a directory that doesn't exist. Consider failing
    // gracefully instead of with an error
    var src = path.join('/shared', dir);
    if (!fs.existsSync(src)) {
        return {
            ok: false,
            error_msg: "Cannot sync from '" + src + "' because it doesn't exist"
        };
    }
    
    // Sync from /shared to dir
    return {
        ok: true,

        // From /shared/{dir} to /{dir}
        source: src,
        destParent: path.dirname(dir),

        // Use the root UID/GID to match the user inside the demo
        uid: 0,
        gid: 0
    };
}

function spawnRsync(src, dest, uid, gid, verbose, allowDelete) {
    var args = [];

    // Recursively
    args.push('-a');

    // Verbosely
    if (verbose)
        args.push('-v');
    
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
    var result = proc.spawnSync('rsync', args);
    if (result.error)
        return { ok: false, error_msg: result.error.toString() };
    if (result.status > 0)
        return { ok: false, error_msg: result.stderr.toString() };

    // Print stdout if verbose
    if (verbose)
        console.log(result.stdout.toString());
        
    return { ok: true };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    parse: cli.parse,
    exec: exec,
    rsync: rsync
};
