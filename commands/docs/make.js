const util = require('util');
const fs = require('fs');
const path = require('path');

const logSymbols = require('log-symbols');
const mustache = require('mustache');
const { Remarkable } = require('remarkable');

const demofile = require('../../util/demofile.js');
const fileutil = require('../../util/file.js');

const vars = require('./vars.js');
const text = require('./text.js');


////////////////////////////////////////////////////////////////////////////////
//
// Config
//
//  demofile:       Path to the demofile
//  template_dir:   Path to the directory containing markdown templates
//  out_dir:        Directory to write docs
//  show_progress:  Show success progress


function makeHelpGuides(config) {
    console.log("");
    console.log("Making help guides ...");
    console.log("");
    
    // Parse the demofile
    var demo = demofile.parse(config.demofile, []);
    if (!demo.ok)
        return demo;

    // Read the directory entries of the template dir
    var ts = fileutil.readdir(config.template_dir);
    if (!ts.ok)
        return ts;

    // Filter for paths that end in ".md"
    var mds = ts.paths.filter(function(p) {
        return (path.extname(p) === ".md");
    });

    // Collect errors and to format them into a single
    // error message.
    var errors = [];

    // Handle each template
    for (var i = 0; i < mds.length; i++) {

        // Basename of the markdown template
        var md_basename = mds[i];

        // Name of the doc ('run', 'build', 'share')
        var doc_name = path.parse(md_basename).name;

        // Config to pass to render
        var render_config = {
            // Name of the doc to create
            doc: doc_name,
                
            // Path to the markdown template
            md_template: path.join(config.template_dir, md_basename),

            // Path to the html output file
            html_file: path.join(config.out_dir, doc_name + ".html"),
            
            // Path to the text output file
            text_file: path.join(config.out_dir, doc_name + ".txt")
        };
        
        // Render the docs using the template and data
        var result = render(demo, render_config);

        // Handle errors
        if (!result.ok)
            errors.push({
                doc: doc_name,
                error_msg: result.error_msg                
            });

        // Show progress
        if (config.show_progress) {
            if (result.ok) {
                console.log(" ", logSymbols.success, doc_name);
                console.log("   ", "-", render_config.html_file);
                console.log("   ", "-", render_config.text_file);
                console.log("");
            } else {
                console.log(" ", logSymbols.error, doc_name);
            }
        }
    }

    if (errors.length > 0) {
        var error_msg = "\nSome issues were encountered while creating docs:\n\n";

        errors.forEach(function(error) {
            error_msg += "  - " + error.doc + ": " + error.error_msg + "\n";
        });
        error_msg += "\n";
        
        return { ok: false, error_msg: error_msg };
    }
    
    console.log("");
    console.log(logSymbols.success, "All docs created");
    console.log("");
    
    return { ok: true };
}

function makeConfigureGuides(config) {
}

function render(demo, config) {

    // Parse the data needed by the template
    var variables = vars.fromDemo(config.doc, demo);
    if (!variables.ok)
        return variables;

    
    // Markdown template -> markdown
    var md = renderMarkdown(config.md_template, variables);
    if (!md.ok)
        return md;


    // Markdown -> HTML
    var html = renderHTML(md.md);
    if (!html.ok)
        return html;

    
    // Wrap the html in a "guide" class.
    var wrapped_html = '<div class="guide">' + html.html + '</div>';

    
    // HTML -> file
    var write_result = fileutil.writeContent(config.html_file, html);
    if (!write_result.ok)
        return write_result;


    // HTML -> raw text
    var rawtext = text.fromHTML(wrapped_html, {
        baseElement: 'div.guide',
        wordwrap: 70,
        unorderedListItemPrefix: '+ '
    });
    if (!rawtext.ok)
        return rawtext;

    
    // Text -> file
    write_result = fileutil.writeContent(config.text_file, rawtext.text);
    if (!write_result.ok)
        return write_result;

    
    // Successfully rendered and wrote all docs
    return { ok: true };
}

function renderMarkdown(template_file, data) {
    var template = fileutil.readContent(template_file);
    if (!template.ok)
        return template;

    var md = '';
    try {    
        md = mustache.render(template.content, data);
    } catch (error) {
        return {
            ok: false,
            error_msg: error.toString()
        };
    }

    return { ok: true, md: md };
}

function renderHTML(md) {
    var mdParser = new Remarkable({
        html: true,
        breaks: true
    });
    
    var html = '';
    try {
        html = mdParser.render(md);
    } catch (error) {
        return {
            ok: false,
            error_msg: error.toString()
        };
    }

    return { ok: true, html: html };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    helpGuides: makeHelpGuides,
    configureGuides: makeConfigureGuides
};
