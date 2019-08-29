const stdin = require('readline-sync');
const fs = require('fs');


////////////////////////////////////////////////////////////////////////////////


function confirmSteps(config) {
    console.log("Executing dry run ...");
    console.log("");
    doDryRun(config);
            
    if (!stdin.keyInYN("Do you want to continue?")) {
        return true;
    }
    
    console.log("\n---------");
    return false;
}

function doDryRun(config) {
    var steps = [];
    var done = [];

    //
    // Find steps to be done
    //

    [pullSteps, upSteps, execSteps].forEach(function(stepFn) {
        var _steps = stepFn(config);
        if (_steps.length == 0)
            done.push(_steps.done_msg);
        else
            steps = steps.concat(_steps.steps);
    });

    //
    // Print things that are already done
    //
    
    var shared_directory = up.makeAbsolute(config.shared_directory);
    if (fs.existsSync(shared_directory)) {
        printDirExists(shared_directory);
    }
    
    if (done.length > 0) {
        console.log("The demo is already:");
        console.log("");
        done.forEach(function(status) {
            console.log("  - " + status);
        });
        console.log("");
    }

    //
    // Print the steps that need to happen
    //
    
    console.log("This command will:");
    console.log("");
    steps.forEach(function(group) {
        for (let i = 0; i < group.length; i++) {
            let indent = "  - ";
            if (i > 0)
                indent = "    - ";
            
            console.log(indent + group[i]);
        }
    });
    console.log("");
}

function pullSteps(config) {
    var steps = pull.ensure({
        dryRun: true,
        dockerImage: config.image
    });

    return {
        steps: steps,
        done_msg: "Downloaded, skipping 'docker pull'"
    };
}

function upSteps(config) {
    var steps = up.ensure({
        dryRun: true,
        dockerImage: config.image,
        containerName: config.instance,
        sharedDir: config.shared_directory
    });

    return {
        steps: steps,
        done_msg: "Up, skipping 'docker run'"
    };
}

function execSteps(config) {
    return {
        steps: [["Run 'docker exec' to attach this terminal to the demo"]],
        done_msg: ""
    };
}

function printDirExists(dir) {
    console.log("The directory '" + dir + "':");
    console.log("");
    console.log("  - Already exists and its contents will be visible inside the demo");
    console.log("");
}



////////////////////////////////////////////////////////////////////////////////


module.exports = {
    confirm: confirmSteps
};
