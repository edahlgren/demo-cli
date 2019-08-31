const path = require('path');


////////////////////////////////////////////////////////////////////////////////


function varsFromDemo(doc_name, demo) {
    if (!vars.hasOwnProperty(doc_name))
        return {
            ok: false,
            error_msg: "unknown doc name"
        };

    return vars[doc_name](demo);
}

const vars = {
    // Have vars
    docs: docs,
    run: run,
    build: build,
    data: data,
    source: source,

    // No vars
    share: novars,
    sync: novars,
    help: novars
};

function novars(demo) {
    return { ok: true };
}

// Variables for the docs help guide
function docs(demo) {
    
    // Find source documentation
    var source_docs = [];
    if (demo.source) {
        // Iterate through repositories
        demo.source.forEach(function(repo) {
            if (!repo.notable.documentation)
                return;
            
            // Add documentation files
            repo.notable.documentation.forEach(function(doc) {
                source_docs.push({
                    file: path.join(repo.directory, doc.path),
                    description: doc.description
                });
            });
        });
    }
    
    // Add a placeholder for none
    if (source_docs.length == 0)
        source_docs.push({
            file: "(none)",
            description: ""
        });
    
    // Find research papers
    var paper_docs = [];
    if (demo.papers) {
        // Add papers
        paper_docs = demo.papers.map(function(paper) {
            return {
                file: paper.path,
                keywords: paper.keywords.join(', ')
            };
        });
    }

    // Add a placeholder for none
    if (paper_docs.length == 0)
        paper_docs.push({
            file: "(none)",
            description: ""
        });
    
    return {
        ok: true,        
        source_docs: source_docs,
        papers: paper_docs
    };
}

// Variables for the run help guide
function run(demo) {

    // Assert things about the demo
    
    if (!demo.run)
        return { ok: false, error_msg: "need a 'run' section" };
    
    if (!demo.run.description)
        return { ok: false, error_msg: "need a 'description' under 'run'" };

    if (!demo.run.configs)
        return { ok: false, error_msg: "need 'configs' under 'run'" };

    if (demo.run.configs.length == 0)
        return { ok: false, error_msg: "need at least 1 config under 'run'" };
    
    for (var i = 0; i < demo.run.configs.length; i++) {
        var config = demo.run.configs[i];

        if (!config.description)
            return { ok: false, error_msg: "need a description for config "
                     + i + 1 +" under 'run'" };
        
        if (!config.name)
            return { ok: false, error_msg: "need a name for config "
                     + i + 1 +" under 'run'" };
        
        if (!config.script)
            return { ok: false, error_msg: "need a script for config "
                     + i + 1 +" under 'run'" };
    }
    
    if (!demo.run.examples)
        return { ok: false, error_msg: "need 'examples' under 'run'" };

    
    //////////////////////////////////////////////////////////////////////////

    
    // Parse the description

    var description = demo.run.description;

    // Parse the run configs

    var configs = demo.run.configs;
    
    // Parse examples

    var examples = demo.run.examples.map(function(example) {
        return {
            description: example.description,
            commandline: example.args.join(' ')
        };
    });
    
    // Parse the input and output files

    var input_files = [];
    var output_files = [];
    
    if (demo.io) {
        if (demo.io.input)
            input_files = demo.io.input;
        if (demo.io.output)
            output_files = demo.io.output;
    }

    if (input_files.length == 0)
        input_files.push({
            format: "(none)",
        });
    
    if (output_files.length == 0)
        input_files.push({
            format: "(none)",
        });
    

    // Parse args

    var args_choose = [];
    var args_any = [];
    if (demo.args) {
        if (demo.args.choose_one)
            args_choose = demo.args.choose_one.map(function(choices) {
                return {
                    description: choices.description,
                    choices: choices.map(function(choice) {
                        return {
                            options: choice.flags.join(', '),
                            default: choice.default,
                            description: choice.description
                        };
                    })
                };
            });
        
        if (demo.args.choose_any)
            args_any = demo.args.choose_any.map(function(choice) {
                return {
                    options: choice.flags.join(', '),
                    default: (choice.default ? choice.default : "(none)"),
                    description: choice.description
                };
            });
    }

    if (args_choose.length == 0)
        args_choose.push({
            description: "(none)"
        });

    if (args_any.length == 0)
        args_any.push({
            options: "(none)"
        });

    
    // Done
    return {
        ok: true,        
        description: description,
        configs: configs,
        examples: examples,
        input_files: input_files,
        output_files: output_files,
        args_choose: args_choose,
        args_any: args_any
    };
}

// Variables for the build help guide
function build(demo) {
    
    // Assert things about the demo
    
    if (!demo.source)
        return { ok: false, error_msg: "need a 'source' section" };

    for (var i = 0; i < demo.source.length; i++) {
        var repo = demo.source[i];
        if (!repo.notable)
            return { ok: false, error_msg: "need a 'notable' section under '"
                     + repo.name + "' section of 'source'" };
    
        if (!repo.notable.build)
            return { ok: false, error_msg: "need a 'notable.build' section under '"
                     + repo.name + "' section of 'source'" };

        if (repo.notable.build.length == 0)
            return { ok: false, error_msg: "need at least 1 notable build file under '"
                     + repo.name + "' section of 'source'" };
    }
    
    if (!demo.build)
        return { ok: false, error_msg: "need a 'build' section" };
        
    if (!demo.build.configs)
        return { ok: false, error_msg: "need 'configs' under 'build'" };
        
    if (demo.build.configs.length == 0)
        return { ok: false, error_msg: "need at least 1 config under 'build'" };
    
    for (var i = 0; i < demo.build.configs.length; i++) {
        var config = demo.build.configs[i];

        if (!config.description)
            return { ok: false, error_msg: "need a description for config "
                     + i + 1 +" under 'build'" };
        
        if (!config.name)
            return { ok: false, error_msg: "need a name for config "
                     + i + 1 +" under 'build'" };
        
        if (!config.script)
            return { ok: false, error_msg: "need a script for config "
                     + i + 1 +" under 'build'" };
    }


    //////////////////////////////////////////////////////////////////////////

    
    // Parse the build files

    var build_files = [];
    demo.source.forEach(function(repo) {
        repo.notable.build.forEach(function(file) {
            build_files.push({
                file: path.join(repo.directory, file.path),
                description: file.description
            });
        });
    });

    // Parse configs
    
    var configs = demo.build.configs;

    // Done
    return {
        ok: true,
        build_files: build_files,
        configs: configs
    };
}


function data(demo) {
    return { ok: false, error_msg: "not implemented" };
}

function source(demo) {
    return { ok: false, error_msg: "not implemented" };
}

////////////////////////////////////////////////////////////////////////////////


module.exports = {
    fromDemo: varsFromDemo
};
