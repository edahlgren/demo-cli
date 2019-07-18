
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const util = require('util');
const demo = require('./demo.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'overwrite', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo share',
    shortDescription: 'Copy a directory to /shared',
    examples: [],
    formats: [
        'demo share .',
    ],
    options: [],
    longDescription: ['This is a long description of demo share'],
    notes: []
};

// TODO: check that everything that needs to be a directory
// is actually a directory

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo share' from outside of a demo shell");
    }

    // Is there even a shared directory in the first place? We put
    // it in a standard place so it's easy to find.
    if (!fs.existsSync('/shared')) {
        exit(1, "Can't run 'demo share' unless a directory is shared with this demo, run 'demo up --help' to learn how to configure this.");
    }
    
    var stats = fs.statSync('/shared');
    var uid = stats.uid;
    var gid = stats.gid;
    
    var overwrite = args.hasOwnProperty('overwrite') && args.overwrite;

    // Just implement sharing the current working directory (no args)
    // TODO: pass a set of directories in to filter what you're sharing

    var cwd = process.cwd();
    console.log(args);
    
    // No dirs given
    var hasDirs = args.hasOwnProperty('dir');
    if (!hasDirs || args.dir.length == 0) {
        // Get all directories under /root
        //
        // Prompt to make sure that the user wants this, because
        // it could be a lot of files.
        dirs = fs.readdirSync('/root');
        if (dirs.length == 0) {
            exit(0, "Nothing to sync, shared directory is empty");
        }
    } else {
        // Check that the given directories exist
        args.dir.forEach(function(dir) {
            var fullpath = path.join('/root', dir);
            if (!fs.existsSync(dir)) {
                exit(1, "Can't share directory '" + dir + "' because it doesn't exist");
            }
        });
        dirs = args.dir;
    }

    // Copy to share
    for (var i = 0; i < dirs.length; i++) {
        var src = path.join('/root', dirs[i]);
        var dest = path.join('/shared', dirs[i]);

        var progress = util.format('[%d/%d] %s -> %s', i+1, dirs.length, src, dest);
        console.log(progress);
                
        copyDir(src, dest, overwrite, uid, gid, exit);
    }

    exit(0);
}

function copyDir(src, dest, overwrite, uid, gid, exit) {
    if (!fs.existsSync(src)) {
        exit(1, "Can't share '" + src + "' because it doesn't exist");
    }

    // Don't copy if would be overwritten. Require an overwrite flag.
    if (!overwrite && fs.existsSync(dest)) {
        exit(1, "'" + dest + "' already exists. Run 'demo share' with '--overwrite' to overwrite it.");
    }

    console.log("src: " + src);
    console.log("dest: " + dest);

    // Find the lowest subdirectory that doesn't yet exist.
    var first = findFirstMissingDir('/shared', dest);
    if (first.length == 0) {
        if (!overwrite) {
            exit(1, "BUG can't find a path doesn't exist, despite confirming that '" + dest + "' doesn't exist");
        }
        // Default to the last dir when overwriting.
        first = dest;
    }
    
    // Make the directory and any parent directories.
    try {
        fs.mkdirSync(dest, { recursive: true });
    } catch (error) {
        // Before exiting, first cleanup any mess we created if we're
        // create directories from scratch.
        if (!overwrite) {
            fsExtra.removeSync(first);
        }
        exit(1, "Failed to create '" + dest + "': " + error.toString());
    }

    // Copy the contents of src into dest (does not copy
    // the src directory itself). Dereference symlinks
    // because they won't work in the bind mount.
    try {
        fsExtra.copySync(src, dest, { deference: true });
    } catch (error) {
        // Same as above
        if (!overwrite) {
            fsExtra.removeSync(first);
        }
        exit(1, "Failed to copy '" + src + "' to '" + dest + "': " + error.toString());
    }

    // Chown the lowest directory that didn't exist
    try {
        chownRecursive(first, uid, gid);
    } catch (error) {
        // Same as above
        if (!overwrite) {
            fsExtra.removeSync(first);
        }
        exit(1, "Failed to change ownership of files in '" + first +
             "' to the bind mount creator (mounter of /shared): " + error.toString());
    }
}

function findFirstMissingDir(parent, relpath) {
    var components = relpath.split(path.sep);
    var exists = parent;

    for (var i = 0; i < components.length; i++) {
        var test = path.join(exists, components[i]);
        if (!fs.existsSync(test)) {
            return path.join(test);
        }
    }
    return '';
}

function chownRecursive(dir, uid, gid) {
    var owner = util.format('%d:%d', uid, gid);
    var result = proc.spawnSync('chown', ['-R', owner, dir]);
    if (result.error) {
        throw result.error;
    }
    if (result.status > 0) {
        throw new Error(result.stderr.toString());
    }
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
