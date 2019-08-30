const stdin = require('readline-sync');
const fs = require('fs');

const pull = require('../../util/pull.js');
const up = require('../../util/up.js');

////////////////////////////////////////////////////////////////////////////////


function confirmSteps(config) {
    console.log("");
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
    var dirStatus = [];
    var todo = [];
    var done = [];

    //
    // Find steps to be done
    //

    [pullSteps, upSteps, execSteps].forEach(function(stepFn) {
        var _steps = stepFn(config);
        if (_steps.hasOwnProperty("dirStatus"))
            dirStatus.push(_steps.dirStatus);

        todo = todo.concat(_steps.todo);
        done = done.concat(_steps.done);
    });

    //
    // Assert that we got the minimum info we need
    //
    
    if (dirStatus.length == 0 || todo.length == 0) {
        console.log("BUG!!");
        process.exit(1);
    }
    
    //
    // Print the steps that are already done
    //
    
    if (done.length > 0) {
        console.log("  The demo is already:");
        console.log("");
        done.forEach(function(status) {
            console.log("    - " + status);
        });
        console.log("");
    }

    //
    // Print the status of the shared directory
    //
    
    var absolute_dir = up.makeAbsolute(config.shared_directory);
    console.log("  The directory '" + absolute_dir + "':");
    console.log("");
    dirStatus.forEach(function(status) {
        console.log("    - " + status);
    });
    console.log("");
    
    //
    // Print the steps that need to happen
    //
    
    console.log("  This command will:");
    console.log("");
    todo.forEach(function(group) {
        for (let i = 0; i < group.length; i++) {
            let indent = "    - ";
            if (i > 0)
                indent = "      - ";
            
            console.log(indent + group[i]);
        }
    });
    console.log("");
}

function pullSteps(config) {
    return pull.ensure({
        dryRun: true,
        dockerImage: config.image
    });
}

function upSteps(config) {
    return up.ensure({
        dryRun: true,
        dockerImage: config.image,
        containerName: config.instance,
        sharedDir: config.shared_directory
    });
}

function execSteps(config) {
    var absolute_dir = up.makeAbsolute(config.shared_directory);
    return {
        todo: [
            ["Run 'docker exec' to attach this terminal to the demo"]
        ],
        done: []
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
