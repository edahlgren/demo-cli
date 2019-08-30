const util = require('util');
const fs = require('fs');
const path = require('path');

const logSymbols = require('log-symbols');
const mustache = require('mustache');
const remarkable = require('remarkable');

const demofile = require('../../util/demofile.js');
const fileutil = require('../../util/fileutil.js');

const parse = require('./parse.js');
const text = require('./text.js');


////////////////////////////////////////////////////////////////////////////////
//
// Config
//
//  demofile:       Path to the demofile
//  template_dir:   Path to the directory containing markdown templates
//  out_text_dir:   Directory to write text docs
//  out_html_dir:   Directory to write html docs
//  show_progress:  Show success progress


function makeDocs(config) {
    // Parse the demofile
    var demo = demofile.parse(config.demofile, []);
    if (!demo.ok)
        return demo;

    // Read the directory entries of the template dir
    var ts = fileutil.readdir(config.templateDir);
    if (!ts.ok)
        return ts;

    // Filter for paths that end in ".md"
    var mds = ts.filter(function(p) {
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

        // Render the docs using the template and data
        var result = render(demo, {
            // Name of the doc to create
            doc: doc_name,
                
            // Path to the markdown template
            md_template: path.join(config.templateDir, md_basename),

            // Path to the html output file
            html_output: path.join(config.outHtmlDir, name + ".html"),
            
            // Path to the text output file
            text_output: path.join(config.outTextDir, name + ".txt")
        });

        // Save errors
        if (!result.ok)
            errors.push({
                doc: doc_name,
                error_msg: result.error_msg                
            });

        // Show progress
        if (config.showProgress) {
            var symbol = (result.ok ? logSymbols.success : logSymbols.error);
            console.log("", symbol, doc_name);
        }
    }

    if (errors.length > 0) {
        // Format the errors into an actual error message
    }
    
    return { ok: true };
}

function render(demo, config) {
    
    // Parse the data needed by the template
    var data = parse.dataFromDemo(config.doc, demo);
    if (!data.ok)
        return data;

    
    // Markdown template -> markdown
    var md = renderMarkdown(config.md_template, data);
    if (!md)
        return md;

    
    // Markdown -> HTML
    var html = renderHTML(md);
    if (!html)
        return html;

    
    // HTML -> file
    var write_result = fileutil.writeContent(config.html_file, html);
    if (!write_result)
        return write_result;

    
    // HTML -> raw text
    var rawtext = text.fromHTML(html, {
        // fill in options
    });
    if (!rawtext)
        return rawtext;

    
    // Text -> file
    write_result = fileutil.writeContent(config.text_file, rawtext);
    if (!write_result)
        return write_result;

    
    // Successfully rendered and wrote all docs
    return { ok: true };
}

function renderMarkdown(template_file, data) {
    var template = fileutil.readContent(template_file);
    if (!template)
        return template;

    var md = '';
    try {    
        md = mustache.render(template, data);
    } catch (error) {
        return {
            ok: false,
            error_msg: error.toString()
        };
    }

    return { ok: true, md: md };
}

function renderHTML(md) {
    var mdParser = new remarkable({
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


module.exports = makeDocs;
