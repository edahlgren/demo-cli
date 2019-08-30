const docker = require('./docker.js');

// config:
//
//  config.quiet         - Don't log anything
//  config.dryRun        - Return a list of steps instead of executing them
//  config.dockerImage   - Name of docker image to run
//
// Throws errors
function ensurePulled(config) {
    var steps = {
        todo: [],
        done: []
    };
    
    if (docker.imageExists(config.dockerImage)) {
        if (config.dryRun) {
            steps.done.push([
                "Downloaded, skipping 'docker pull'"
            ]);
        }
        return steps;
    }

    if (config.dryRun) {
        let commandLine = docker.pullImage({
            dryRun: true,
            dockerImage: config.dockerImage
        });
        steps.todo.push([
            "Run 'docker pull' to download the demo"
        ]);
    } else {    
        docker.pullImage({
            quiet: config.quiet,
            dockerImage: config.dockerImage
        });
    }
    
    return steps;
}

module.exports = {
    ensure: ensurePulled
};
