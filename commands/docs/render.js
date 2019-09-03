const mustache = require('mustache');
const { Remarkable } = require('remarkable');

const fileutil = require('../../util/file.js');
const text = require('./text.js');


////////////////////////////////////////////////////////////////////////////////


function render(config) {

    // Markdown template -> markdown
    var md = renderMarkdown(config.template, config.vars);
    if (!md.ok)
        return md;


    // Markdown -> HTML
    var html = renderHTML(md.md);
    if (!html.ok)
        return html;

    
    // Wrap the html in a "guide" class.
    var wrapped_html = '<div class="guide">' + html.html + '</div>';

    
    // HTML -> file
    var write_result = fileutil.writeContent(config.html, wrapped_html);
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
    write_result = fileutil.writeContent(config.text, rawtext.text);
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
    doc: render
};
