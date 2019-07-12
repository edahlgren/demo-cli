
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

module.exports = {
    checkContainer: dockerInspect,
    CONTAINER_NOEXIST: CONTAINER_NOEXIST,
    CONTAINER_STOPPED: CONTAINER_STOPPED,
    CONTAINER_RUNNING: CONTAINER_RUNNING
};
