const fs = require('fs');
const path = require('path');

const docker = require('./docker.js');

// config:
//
//  config.containerName - Name of docker container to run
//  config.dockerImage   - Name of docker image to run
//  config.sharedDir     - Absolute path to host path to bind mount to /shared
//  config.dryRun        - Return a list of steps instead of executing them
//
// Throws errors
function ensureUp(config) {

    // Ensure that the shared directory is an absolute path.
    config.sharedDir = makeAbsolute(config.sharedDir);

    // Get the operations that would need to happen.
    var ops = opsForUp(config);
    var steps = {
        dirStatus: [],
        todo: [],
        done: []
    };

    // Deal with creating shared directory.
    if (ops.sharedNeedsCreate) {
        if (config.dryRun) {
            steps.dirStatus = "Doesn't exist yet";
            steps.todo.push([
                "Create '" + config.sharedDir + "' to share with the demo"
            ]);
        } else {
            if (!config.quiet)
                console.log("\nCreating shared directory ...\n");
            
            makeSharedDir(config.sharedDir);
        }
    } else {
        if (config.dryRun) {
            steps.dirStatus =
                "Already exists. Its contents will be visible in the demo at /shared";
        }
    }

    // Deal with removing stopped / exited container that was never
    // removed. This shouldn't happen unless there's a problem with
    // the docker daemon. The code here is just in case.
    if (ops.containerNeedsRemove) {
        if (config.dryRun) {
            let commandLine = docker.removeContainer({
                dryRun: true,
                containerName: config.containerName
            });
            steps.todo.push([
                "Run 'docker rm' to enable running the demo again"
            ]);
        } else {
            docker.removeContainer({
                quiet: config.quiet,
                containerName: config.containerName
            });
        }
    }

    // Deal with running the container for the first time.
    if (ops.containerNeedsUp) {
        if (config.dryRun) {
            let commandLine = docker.runContainer({
                dryRun: true,
                sharedDir: config.sharedDir,
                containerName: config.containerName,
                dockerImage: config.dockerImage
            });
            steps.todo.push([
                "Run 'docker run' to load the demo files into an idle container"
            ]);
            steps.todo.push([
                "Make '" + config.sharedDir + "' visible inside the container at /shared"
            ]);
        } else {
            docker.runContainer({
                quiet: config.quiet,
                sharedDir: config.sharedDir,
                containerName: config.containerName,
                dockerImage: config.dockerImage
            });
        }
    } else {
        if (config.dryRun) {
            steps.done.push([
                "Up, skipping 'docker run'"
            ]);
        }
    }

    return steps;
}

function makeAbsolute(filepath) {
    if (filepath.length > 0 && !path.isAbsolute(filepath))
        return path.join(process.cwd(), filepath);
    return filepath;
}

function opsForUp(config) {
    var hasShared = (config.sharedDir.length > 0);
    var status = containerStatus(config.containerName);
    
    return {
        sharedNeedsCreate: hasShared && !fs.existsSync(config.sharedDir),
        containerNeedsRemove: isStopped(status),
        containerNeedsUp: !isStopped(status) && !isUp(status)
    };
}
    
function containerStatus(containerName) {
    try {
        return docker.containerInspect(containerName);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to use 'docker inspect' to run pre-checks, run with 'demo up --force' to skip pre-checks");
    }
}

function isStopped(inspectResult) {
    return (inspectResult == docker.CONTAINER_STOPPED);
}

function isUp(inspectResult) {
    return (inspectResult == docker.CONTAINER_RUNNING);
}

function makeSharedDir(name) {
    try {
        fs.mkdirSync(name, { recursive: true });
    } catch (error) {
        throw new Error("Failed to create the shared directory: " + error.toString());
    }
}

module.exports = {
    makeAbsolute: makeAbsolute,
    containerStatus: containerStatus,
    isUp: isUp,
    
    ensure: ensureUp
};
