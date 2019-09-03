const mustache = require('mustache');
const { Remarkable } = require('remarkable');
const htmlToText = require('html-to-text');

const compact = require('lodash/compact');
const zip = require('lodash/zip');
const max = require('lodash/max');
const padEnd = require('lodash/padEnd');
const get = require('lodash/get');
const wrap = require('word-wrap');

const fileutil = require('../../util/file.js');


////////////////////////////////////////////////////////////////////////////////


const whiteSpaceRegex = /^\s*$/;
const empty = " ";
var header = "";


////////////////////////////////////////////////////////////////////////////////

const default_text_options = {
    wordwrap: 80,
    unorderedListItemPrefix: '+ ',
    separateTwoColumns: false,
    dotsBetweenColumns: false,
    indentWrapTable: true,
    minColumnPad: 2
};

function render(config, text_options) {

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


    // Copy default so we don't screw up the original
    var defaults = Object.assign({}, default_text_options);
    
    // Merge text rendering options with defaults
    var options = Object.assign(defaults,
                                (text_options ? text_options : {}),
                                { baseElement: 'div.guide' });
    
    // HTML -> raw text
    var rawtext = textFromHTML(wrapped_html, options);
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

function textFromHTML(html, options) {
    
    var text = lessGuide();    
    try {
        text += renderText(html, options);
    } catch (error) {
        return {
            ok: false,
            error_msg: error.toString() + "\n" + error.stack
        };
    }

    return { ok: true, text: text };
}


// FIXME: put in a template
function lessGuide() {
    var buffer = empty.repeat(60) + "type 'q' to exit\n";
    buffer += empty.repeat(60) + "type '/' to search\n";
    buffer += empty.repeat(60) + "Type down arrow to scroll\n";
    return buffer;
}


function renderText(html, options) {
    var buffer = "";
    var warnings = [];
    header = "";
    
    htmlToText.fromString(html, {
                
        baseElement: options.baseElement,
        wordwrap: options.wordwrap,
        unorderedListItemPrefix: options.unorderedListItemPrefix,
        
        tables: true,
        uppercaseHeadings: false,
        ignoreImage: true,
        
        spaceTwo: options.separateTwoColumns,
        drawDots: options.dotsBetweenColumns,
        indentWrapTable: options.indentWrapTable,
        minColumnPad: options.minColumnPad,
        
        format: {
            heading: function(elem, fn, options) {
                let text = formatHeading(elem, fn, options);
                buffer += text;
                return text;
            },
            paragraph: function(elem, fn, options) {
                let text = formatParagraph(elem, fn, options);
                buffer += text;
                return text;
            },
            unorderedList: function(elem, fn, options) {
                let text = formatUnorderedList(elem, fn, options);
                buffer += text;
                return text;                
            },
            table: function(elem, fn, options) {
                let text = formatTable(elem, fn, options);
                buffer += text;
                return text;
            },
            lineBreak: function(elem, fn, options) {
                let text = fn(elem.children, options);
                warnings.push("didn't write line break");
                return text;
            },
            anchor: function(elem, fn, options) {
                let text = fn(elem.children, options);
                warnings.push("didn't write anchor");
                return text;
            },
            orderedList: function(elem, fn, options) {
                let text = fn(elem.children, options);
                warnings.push("didn't write ordered list");
                return text;
            },
            listItem: function(elem, fn, options) {
                let text = fn(elem.children, options);
                warnings.push("didn't write list item");
                return text;
            },
            horizontalLine: function(elem, fn, options) {
                let text = fn(elem.children, options);
                warnings.push("didn't write horizontal line");
                return text;
            }
        }
    });

    return buffer;
}


function indentSpaces(currentHeader, isHeader) {
    switch (currentHeader) {
    case 'h1':
        return 2;
    case 'h2':
        return (isHeader ? 2 : 3);
    case 'h3':
        return (isHeader ? 3 : 5);
    case 'h4':
        return (isHeader ? 5 : 8);
    default:
        return 2;
    }    
}


function formatHeading(elem, fn, options) {
    // Keep track of the new header
    header = elem.name;
    
    // Format the original heading
    let orig = fn(elem.children, options);

    // Calculate the indent
    let indent = empty.repeat(indentSpaces(header, true));

    // Add an extra line break to separate heading.
    let text = '';
    if (header === "h1" || header === "h2")
        text = '\n';

    // Add the heading.
    text += indent + orig + '\n';

    // If a subheading, then add an underline
    if (header === "h2")
        text += indent +  ("=").repeat(orig.length) + '\n';

    // Add more space between heading and content
    text += '\n';
    
    return text;
}


function isCode(elem, options) {
    return (options.isInPre &&
            elem.children.length == 1 &&
            elem.children[0].name == 'code');
}

function is_header(elem) {
    if (elem.type !== "tag")
        return false;
    
    switch(elem.name.toLowerCase()) {
    case 'h1', 'h2', 'h3', 'h4', 'h5', 'h6':
        return true;
    default:
        return false;
    }
}

function formatParagraph(elem, fn, options) {
    let prev = elem.prev;
    while (prev) {
        if (prev.type === "text" &&
            prev.data.trim().length == 0) {
            prev = prev.prev;
            continue;
        }
        break;
    }
    let firstAfterHeader = prev && is_header(prev);
    
    // Is this a block of code?
    let code = isCode(elem, options);
    
    // Format the original paragraph
    let orig = fn(elem.children, options);

    // Get the lines
    let lines = orig.split('\n');
    
    // Calculate the indent
    let indent = empty.repeat(indentSpaces(header, false));

    // Add an extra two spaces for code that's not directly
    // under a header
    if (!firstAfterHeader && code)
        indent += '  ';

    // Indent each of the lines
    var text = "";
    lines.forEach(function(line) {
        text += indent + line + '\n';
    });
    
    // Add an extra newline if _not_ code
    if (!code)
        text += '\n';
    
    return text;
}


// Taken directly from html-to-text/lib/formatter.js, apparently
// just overriding the formatListItem callback doesn't work.
function formatUnorderedList(elem, fn, options) {
    var parentName = get(elem, 'parent.name');
    var result = parentName === 'li' ? '\n' : '';
    var prefix = options.unorderedListItemPrefix;
    var nonWhiteSpaceChildren = (elem.children || []).filter(function(child) {
        return child.type !== 'text' || !whiteSpaceRegex.test(child.data);
    });
    nonWhiteSpaceChildren.forEach(function(elem) {
        result += formatListItem(prefix, elem, fn, options);
    });
    return result + '\n';
}


function formatListItem(prefix, elem, fn, options) {
    options = Object.assign({}, options);
    
    // Reduce the wordwrap for sub elements.
    if (options.wordwrap) {
        options.wordwrap -= prefix.length;
    }

    // Process sub elements.
    var text = fn(elem.children, options);

    // Calculate the indent
    let indent = empty.repeat(indentSpaces(header, false));
    
    // Replace all line breaks with line break + prefix spacing.
    text = text.replace(/\n/g, '\n' + indent + ' '.repeat(prefix.length));
    
    // Add indent, first prefix, and line break at the end.
    return indent + prefix + text + '\n\n';
}


function formatTable(elem, fn, options) {

    // Fill in the table by calling tryParseRows on
    // each child of the table.
    var table = [];
    
    function parseRows(elem) {
        if (elem.type !== 'tag') {
            return;
        }
        switch (elem.name.toLowerCase()) {
        case "thead":
        case "tbody":
        case "tfoot":
        case "center":
            elem.children.forEach(parseRows);
            return;            
        case 'tr':
            var row = [];
            elem.children.forEach(function(elem) {
                
                let newOptions = JSON.parse(JSON.stringify(options));                
                newOptions.wordwrap = 1000;
                
                if (elem.type === 'tag') {
                    switch (elem.name.toLowerCase()) {
                    case 'th':
                        var rawHeading = fn(elem.children, newOptions);
                        rawHeading += '\n';
                        row.push(rawHeading);
                        break;
                        
                    case 'td':
                        var isPre = (elem.children.length == 1 &&
                                     elem.children[0].name === 'pre');
                        var isList = (elem.children.length == 1 &&
                                      elem.children[0].name === 'ul');
                        var isHr = (elem.children.length == 1 &&
                                      elem.children[0].name === 'hr');
                        let rawText = fn(elem.children, newOptions);

                        if (isPre || isList)
                            rawText = rawText.trimRight();
                        
                        if (isList)
                            rawText = rawText.split('\n').map(function(item) {
                                return '  ' + item;
                            }).join('\n');
                        
                        if (isHr)
                            rawText = "<hr>";

                        row.push(rawText);
                        break;
                    }
                }
            });
            
            row = row.map(function(col) {
                return col || '';
            });
            
            table.push(row);
            break;
        }
    }    
    elem.children.forEach(parseRows);

    // Convert the rows to lines
    let lines = tableToLines(table, options);

    // Calculate the indent
    let indent = empty.repeat(indentSpaces(header, false));

    // Indent each of the lines
    let text = '';
    lines.forEach(function(line) {
        text += indent + line + '\n';
    });

    return text;    
}


function tableToLines(table, options) {
    
    // Find special rows containing '___', these are inline
    // headers that organize groups of rows.
    var headings = {};
    var hasHeadings = false;
    for (let r = 0; r < table.length; r++) {
        let firstCol = table[r][0];
        if (firstCol.startsWith('___')) {
            hasHeadings = true;
            headings[r] = firstCol.replace("___", "").trim();
        } else {
            headings[r] = "";
        }
    }
    
    // Determine space width per column
    var widths = table.map(function(row) {
        return row.map(function(col) {
            if (col.startsWith('___'))
                return 0;
            
            let lines = col.split('\n').map(function(line) {
                return line.length;
            });
            
            return max(lines);
        });
    });
    
    // Invert rows with colums
    widths = zip.apply(null, widths);
    
    // Determine the max values for each column
    widths = widths.map(function(col) {
        return max(col);
    });

    // Fill out remaining space
    var onlyTwo = (widths.length == 2);
    if (options.spaceTwo && onlyTwo) {
        let maxwrap = options.wordwrap + 10;
        if ((widths[0] + widths[1]) < maxwrap)
            widths[0] = maxwrap - widths[1];
    }
    
    // The table content
    var text = "";

    // The last row index
    var lastRow = table.length - 1;

    // Format the table
    for (let r = 0; r < table.length; r++) {

        // Handle a heading
        if (hasHeadings && headings[r].length > 0) {
            if (r > 1)
                text += '\n';
            text += headings[r] + '\n\n';
            continue;
        }
        
        var t = '';
        let row = table[r];

        // Manually wrap around the last column
        let firstLen = 0;        
        let last = row.length - 1;

        // Check for embedded <hr> line breaks
        var hasBreak = false;
        
        // Create extra padding
        const extraPadEnd = ' '.repeat(options.minColumnPad);
        
        // Handle row
        for (var j = 0; j < row.length; j++) {
            let col = row[j];            
            let width = widths[j];

            // Is this a row with a break?
            var isBreak = (col === "<hr>");
            if (isBreak)
                col = " ";
            hasBreak = hasBreak | isBreak;
            
            // Handle columns before last
            if (j < last) {

                // Default case, no dots
                let fmt = padEnd(col, width, ' ') + extraPadEnd;

                // Add dots if necessary
                if (options.drawDots && col.trim().length > 0)
                    fmt = padEnd(col, width + extraPadEnd.length - 1, ' .') + ' ';

                t += fmt;
                firstLen += fmt.length;
                continue;
            }
            
            // Handle the last column specially
            let max = options.wordwrap - firstLen;
            if (max < 45)
                max = 45;

            let prelines = col.split('\n');
            let hasLines = prelines.length > 1;
            
            // Handle simple case (no word wrap necessary)
            if (!hasLines && col.length <= max) {
                t += col;
                break;
            }

            let lines = [];
            prelines.forEach(function(line) {
                let sublines = wrap(line, { width: max, indent: '' }).split('\n');
                sublines.forEach(function(subline) {
                    lines.push(subline);
                });
            });
            
            // Handle the first
            t += lines[0];
            if (lines.length > 1) {
                let indentNum = firstLen;
                if (options.indentWrapTable)
                    indentNum += 4;
                
                for (let l = 1; l < lines.length; l++) {
                    t += '\n' + (' ').repeat(indentNum) + lines[l];
                }
            }
            break;
        }

        // Skip empty rows
        if (!hasBreak && t.trim().length == 0)
            continue;

        // Create inner table headings
        if (hasHeadings)
            text += '  ' + t + '\n';
        else
            text += t + '\n';
    }
    
    return text.split('\n');
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    render: render
};
