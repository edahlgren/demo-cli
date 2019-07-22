
const proc = require('child_process');

function spawnFailure(result) {
    if (result.error) {
        return result.error.toString();
    }
    return result.stderr.toString();
}

function dockerImageExists(image) {
    var result = proc.spawnSync("docker", ["images", "-q", image]);
    if (result.error) {
        throw new Error("failed to launch 'docker images'");
    }
    if (result.status > 0) {
        throw new Error("error running 'docker images': "
                        + result.stderr.toString());
    }

    // The image exists if 'docker images' returns an image ID.
    var out = result.stdout.toString();
    return (out.length > 0);
}

function dockerPull(config) {
    // docker pull
    var args = ['pull'];

    // The docker image to pull (in docker ID/repo format)
    args.push(config.dockerImage);

    if (config.dryRun) {
        args.unshift('docker');
        return args.join(' ');
    }

    var stdio = {};
    if (!config.quiet) {
        stdio = { stdio: 'inherit' };
        console.log("\nDownloading the demo ...\n");
    }
    
    // Finally run the command
    var result = proc.spawnSync("docker", args, stdio);
    if (result.error || result.status > 0) {
        throw new Error(spawnFailure(result));
    }
}

const CONTAINER_NOEXIST  = 0;
const CONTAINER_STOPPED  = 1;
const CONTAINER_RUNNING = 2;

function dockerInspect(name) {
    var result = proc.spawnSync("docker", ["inspect", "-f", "'{{.State.Running}}'", name]);
    if (result.error) {
        throw new Error("failed to launch 'docker inspect'");
    }
    
    if (result.status > 0) {
        return CONTAINER_NOEXIST;
    }

    // Check stdout for true or false
    var out = result.stdout.toString();
    
    var falseMatch = "'false'\n";
    if (out === falseMatch) {
        return CONTAINER_STOPPED;
    }
    
    var trueMatch = "'true'\n";
    if (out === trueMatch) {
        return CONTAINER_RUNNING;
    }

    throw new Error("'docker inspect' failed: " + result.stderr.toString());
}

function dockerRemove(config) {
    // docker run
    var args = ['rm'];

    // Remove the container name
    args.push(config.containerName);

    if (config.dryRun) {
        args.unshift('docker');
        return args.join(' ');
    }
    
    if (!config.quiet) {
        console.log("\nRemoving the old, conflicting container ...\n");
    }
    
    // Finally run the command
    var result = proc.spawnSync("docker", args);
    if (result.error || result.status > 0) {
        throw new Error(spawnFailure(result));
    }
}

function dockerRun(config) {    
    // docker run
    var args = ['run'];

    // Pass back a name for the container
    args.push('--name');
    args.push(config.containerName);
    
    // Working dir is /root (home dir)
    args.push('-w');
    args.push('/root');
    
    // Add shared directory if needed.
    if (config.sharedDir.length > 0) {
        args.push('-v');
        args.push(config.sharedDir + ":/shared");
    }
    
    // Run it in detached mode (in the background).
    args.push('-d');

    // Remove it when it's killed.
    args.push('--rm');

    // Add image name
    args.push(config.dockerImage);

    if (config.dryRun) {
        args.unshift('docker');
        return args.join(' ');
    }

    var stdio = {};
    if (!config.quiet) {
        stdio = { stdio: 'inherit' };
        console.log("\nLoading the demo files into a container (ID below) ...\n");
    }
    
    // Finally run the command
    var result = proc.spawnSync("docker", args, stdio);
    if (result.error || result.status > 0) {
        throw new Error(spawnFailure(result));
    }
}

function dockerKill(config) {
    var result =  proc.spawnSync("docker", ["kill", config.containerName]);
    if (result.error || result.status > 0) {
        throw new Error(spawnFailure(result));
    }
}

function dockerExecBash(config) {
    var args = ['exec'];

    // Attach stdin and tty
    args.push('-it');
    
    // Add container name
    args.push(config.containerName);

    // Add bash
    args.push('/bin/bash');

    if (config.dryRun) {
        args.unshift('docker');
        return args.join(' ');
    }    
    
    // Finally run the command
    var result = proc.spawnSync("docker", args, { stdio: 'inherit' });
    if (result.error || result.status > 0) {
        throw new Error(spawnFailure(result));
    }
}

module.exports = {
    imageExists: dockerImageExists,

    containerInspect: dockerInspect,
    CONTAINER_NOEXIST: CONTAINER_NOEXIST,
    CONTAINER_STOPPED: CONTAINER_STOPPED,
    CONTAINER_RUNNING: CONTAINER_RUNNING,

    pullImage: dockerPull,
    runContainer: dockerRun,
    execBash: dockerExecBash,

    removeContainer: dockerRemove,
    killContainer: dockerKill
};
