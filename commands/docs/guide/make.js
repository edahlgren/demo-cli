const path = require('path');

const render = require('../../docs/render');
const demofile = require('../../../util/demofile');


////////////////////////////////////////////////////////////////////////////////


function make(demo_file, template, out_dir) {
    
    // Parse the demofile
    var demo = demofile.parse(demo_file, []);
    if (!demo.ok)
        return demo;

    var variables = {
        source_docs: [],
        papers: []
    };
    
    // Find source documentation
    if (demo.source) {
        // Iterate through repositories
        demo.source.forEach(function(repo) {
            if (!repo.notable.documentation)
                return;
            
            // Add documentation files
            repo.notable.documentation.forEach(function(doc) {
                variables.source_docs.push({
                    file: path.join(repo.directory, doc.path),
                    description: doc.description
                });
            });
        });
    }
    
    // Add a placeholder for none
    if (variables.source_docs.length == 0)
        variables.source_docs.push({
            file: "(none)",
            description: ""
        });
    
    // Find research papers
    if (demo.papers) {
        // Add papers
        variables.paper_docs = demo.papers.map(function(paper) {
            return {
                file: paper.path,
                keywords: paper.keywords.join(', ')
            };
        });
    }

    // Add a placeholder for none
    if (variables.paper_docs.length == 0)
        variables.paper_docs.push({
            file: "(none)",
            description: ""
        });
        
    return render.render({
        vars: variables,
        template: template,
        html: path.join(out_dir, "docs.html"),
        text: path.join(out_dir, "docs.txt")
    });        
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make
};
