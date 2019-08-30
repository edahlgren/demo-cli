const docker = require('./docker.js');

// config:
//
//  config.quiet         - Don't log anything
//  config.dryRun        - Return a list of steps instead of executing them
//  config.dockerImage   - Name of docker image to run
//
// Throws errors
function ensurePulled(config) {
    var steps = [];
    
    if (docker.imageExists(config.dockerImage))
        return steps;

    if (config.dryRun) {
        let commandLine = docker.pullImage({
            dryRun: true,
            dockerImage: config.dockerImage
        });
        steps.push([
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
