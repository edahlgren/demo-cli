const path = require('path');


////////////////////////////////////////////////////////////////////////////////


function varsFromDemo(doc_name, demo) {
    if (isUnknown(doc_name))
        return {
            ok: false,
            error_msg: "unknown doc"
        };

    var result = check[doc_name](demo);
    if (!result.ok)
        return result;

    return vars[doc_name](demo);
}

function isUnknown(doc_name) {
    return !check.hasOwnProperty(doc_name) ||
        !vars.hasOwnProperty(doc_name);
}

const check = {
    // Have vars
    docs: noop,
    run: run_check,
    build: build_check,
    data: data_check,
    source: source_check,
    
    // No vars
    share: noop,
    sync: noop,
    help: noop
};

const vars = {
    // Have vars
    docs: docs_vars,
    run: run_vars,
    build: build_vars,
    data: data_vars,
    source: source_vars,

    // No vars
    share: noop,
    sync: noop,
    help: noop
};

function noop(demo) {
    return { ok: true };
}

function docs_vars(demo) {

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

    
    // Done
    return {
        ok: true,        
        source_docs: source_docs,
        papers: paper_docs
    };
}

function run_check(demo) {

    // Check that there's a 'run' section
    if (!demo.run)
        return { ok: false, error_msg: "need a 'run' section" };

    
    // Check for a description
    if (!demo.run.description)
        return { ok: false, error_msg: "need a 'description' under 'run'" };

    
    // Check for at least 1 config
    if (!demo.run.configs)
        return { ok: false, error_msg: "need 'configs' under 'run'" };
    if (demo.run.configs.length == 0)
        return { ok: false, error_msg: "need at least 1 config under 'run'" };

    
    // Check configs for a description, name, and script
    for (var i = 0; i < demo.run.configs.length; i++) {
        var config = demo.run.configs[i];

        if (!config.description)
            return { ok: false, error_msg: "need a description for config "
                     + (i + 1) +" under 'run'" };
        
        if (!config.name)
            return { ok: false, error_msg: "need a name for config "
                     + (i + 1) +" under 'run'" };
        
        if (!config.script)
            return { ok: false, error_msg: "need a script for config "
                     + (i + 1) +" under 'run'" };
    }

    
    // Check that there is at least one example
    if (!demo.run.examples)
        return { ok: false, error_msg: "need 'examples' under 'run'" };
    if (demo.run.examples.length == 0)
        return { ok: false, error_msg: "need at least 1 example under 'run'" };

    
    // Check examples for a description and args
    for (var i = 0; i < demo.run.examples.length; i++) {
        var example = demo.run.examples[i];
        
        if (!example.description)
            return { ok: false, error_msg: "need a description for example "
                     + (i + 1) +" under 'run'" };
        
        if (!example.args)
            return { ok: false, error_msg: "need args for example "
                     + (i + 1) +" under 'run'" };
    }
    
    // OK
    return { ok: true };
}

function run_vars(demo) {
    
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


    // Use a placeholder if we found none
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
                    choices: choices.choices.map(function(choice) {
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


    // Use a placeholder if we found none
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

function build_check(demo) {

    // Check that there's a 'source' section with at least 1 repo
    if (!demo.source)
        return { ok: false, error_msg: "need a 'source' section" };
    if (demo.source.length == 0)
        return { ok: false, error_msg: "need at least one 'source' repository" };

    
    // Check repos for having at least 1 notable build file
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

    
    // Check that there's a 'build' section
    if (!demo.build)
        return { ok: false, error_msg: "need a 'build' section" };

    
    // Check for at least 1 config
    if (!demo.build.configs)
        return { ok: false, error_msg: "need 'configs' under 'build'" };        
    if (demo.build.configs.length == 0)
        return { ok: false, error_msg: "need at least 1 config under 'build'" };
    

    // Check configs for a description, name, and script
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

    // OK
    return { ok: true };
}

function build_vars(demo) {
    
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


function data_check(demo) {

    // Check that there's a 'data' section with at least 1 dataset
    if (!demo.data)
        return { ok: false, error_msg: "need a 'data' section" };
    if (demo.data.length == 0)
        return { ok: false, error_msg: "need at least one 'data' set" };

    
    // Check datasets for having a title, description, source, and
    // at least 1 file
    for (var i = 0; i < demo.data.length; i++) {
        var dataset = demo.data[i];

        if (!dataset.title)
            return { ok: false, error_msg: "need a 'title' for dataset '"
                     + (i + 1) + "' under 'data'" };

        if (!dataset.description)
            return { ok: false, error_msg: "need a 'description' for dataset '"
                     + (i + 1) + "' under 'data'" };

        if (!dataset.source)
            return { ok: false, error_msg: "need a 'source' for dataset '"
                     + (i + 1) + "' under 'data'" };

        if (!dataset.files)
            return { ok: false, error_msg: "need 'files' for dataset '"
                     + (i + 1) + "' under 'data'" };
        
        if (dataset.files.length == 0)
            return { ok: false, error_msg: "need at least 1 file for dataset '"
                     + (i + 1) + "' under 'data'" };

        // Check files for having a path and description
        for (var j = 0; j < dataset.files.length; j++) {
            var file = dataset.files[j];

            if (!file.path)
                return {
                    ok: false,
                    error_msg: "file " + (j + 1) + " needs a 'path' for dataset '"
                        + (i + 1) + "' under 'data'"
                };
            
            if (!file.description)
                return {
                    ok: false,
                    error_msg: "file " + (j + 1) + " needs a 'description' for dataset '"
                        + (i + 1) + "' under 'data'"
                };
        }
    }

    // OK
    return { ok: true };
}

function data_vars(demo) {

    // Parse the datasets
    var sets = demo.data.map(function(dataset) {
        
        // Parse the files
        var files = dataset.files.map(function(file) {

            // Parse the metadata
            var metadata = [];
            metadata.push({
                description: "Description",
                data: file.description
            });
            file.metadata.forEach(function(data) {
                metadata.push(data);
            });
            return {
                file: file.path,
                metadata: metadata
            };
        });

        return {
            title: dataset.title,
            description: dataset.description,
            source: dataset.source,
            url: (dataset.url ? dataset.url : "(none)"),
            files: files
        };
    });

    
    // Done
    return {
        ok: true,
        datasets: sets
    };
}

function source_check(demo) {

    // Check that there's a 'source' section with at least 1 repo
    if (!demo.source)
        return { ok: false, error_msg: "need a 'source' section" };
    if (demo.source.length == 0)
        return { ok: false, error_msg: "need at least one 'source' repo" };

    
    // Check repos for having a name, description, license, version,
    // authors, directory, entrypoint, and at least 1 notable file
    for (var i = 0; i < demo.source.length; i++) {
        var repo = demo.source[i];

        if (!repo.name)
            return { ok: false, error_msg: "need a 'name' for repo '"
                     + (i + 1) + "' under 'source'" };

        if (!repo.description)
            return { ok: false, error_msg: "need a 'description' for repo '"
                     + (i + 1) + "' under 'source'" };

        if (!repo.license)
            return { ok: false, error_msg: "need a 'license' for repo '"
                     + (i + 1) + "' under 'source'" };
        
        if (!repo.version)
            return { ok: false, error_msg: "need a 'version' for repo '"
                     + (i + 1) + "' under 'source'" };

        if (!repo.authors)
            return { ok: false, error_msg: "need a 'authors' for repo '"
                     + (i + 1) + "' under 'source'" };
        
        if (!repo.directory)
            return { ok: false, error_msg: "need a 'directory' for repo '"
                     + (i + 1) + "' under 'source'" };

        if (!repo.entrypoint)
            return { ok: false, error_msg: "need an 'entrypoint' for repo '"
                     + (i + 1) + "' under 'source'" };
        
        if (!repo.notable)
            return { ok: false, error_msg: "need a 'notable' section for repo '"
                     + (i + 1) + "' under 'source'" };

        var nodocs = (!repo.notable.documentation ||
                      repo.notable.documentation.length == 0);
        var nosource = (!repo.notable.source ||
                        repo.notable.source.length == 0);
        var nobuild = (!repo.notable.build ||
                       repo.notable.build.length == 0);
        if (nodocs && nosource && nobuild)
            return { ok: false, error_msg: "need at least 1 'notable' file under repo '"
                     + (i + 1) + "' under 'source'" };
    }

    // OK
    return { ok: true };
}

function source_vars(demo) {

    // Parse the source repositories
    var repos = demo.source.map(function(repo) {

        // Parse the notable files
        var notable = [];

        // Add doc file
        if (repo.notable.documentation)
            repo.notable.documentation.forEach(function(file) {
                notable.push({
                    tag: "doc",
                    file: file.path,
                    description: file.description
                });
            });
        
        // Add source file
        if (repo.notable.source)
            repo.notable.source.forEach(function(file) {
                notable.push({
                    tag: "source",
                    file: file.path,
                    description: file.description
                });
            });

        // Add build file
        if (repo.notable.build)
            repo.notable.build.forEach(function(file) {
                notable.push({
                    tag: "build",
                    file: file.path,
                    description: file.description
                });
            });

        return {
            name: repo.name,
            description: repo.description,
            license: repo.license,
            version: repo.version,
            authors: repo.authors.join(', '),
            directory: repo.directory,
            entrypoint: repo.entrypoint,
            notable: notable
        };
        
    });
    

    // Done
    return {
        ok: true,
        repos: repos
    };
}

////////////////////////////////////////////////////////////////////////////////


module.exports = {
    fromDemo: varsFromDemo
};
