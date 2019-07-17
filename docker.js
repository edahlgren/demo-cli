
const proc = require('child_process');

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

function dockerRun(config) {    
    // docker run
    var args = ['run'];

    // Run it in detached mode (in the background).
    args.push('-d');

    // Remove it when it's killed.
    args.push('--rm');
    
    // Pass back a name for the container
    args.push('--name');
    args.push(config.name);
    
    // Working dir is /root (home dir)
    args.push('-w');
    args.push('/root');

    // Add shared directory if needed.
    if (config.hasShared) {
        args.push('-v');
        args.push(config.sharedDirectory + ":/shared");
    }

    // Expose port if needed.
    if (config.hasPort) {
        args.push('-p');
        args.push(config.httpPort + ":4444");
    }

    // Attach stdin and tty
    args.push('-it');

    // Add image name
    args.push(config.image);

    console.log('docker ' + args);
    
    // Finally run the command
    return proc.spawnSync("docker", args, { stdio: 'inherit' });
}

function dockerKill(config) {
    return proc.spawnSync("docker", ["kill", config.name]);
}

function dockerExecBash(config) {
    var args = ['exec'];

    // Attach stdin and tty
    args.push('-it');
    
    // Add container name
    args.push(config.name);

    // Add bash
    args.push('/bin/bash');
    
    // Finally run the command
    return proc.spawnSync("docker", args, { stdio: 'inherit' });
}

module.exports = {
    inspect: dockerInspect,
    CONTAINER_NOEXIST: CONTAINER_NOEXIST,
    CONTAINER_STOPPED: CONTAINER_STOPPED,
    CONTAINER_RUNNING: CONTAINER_RUNNING,

    run: dockerRun,
    kill: dockerKill,
    execBash: dockerExecBash
};
