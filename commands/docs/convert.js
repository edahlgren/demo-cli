const fs = require('fs');

const mustache = require('mustache');
const remarkable = require('remarkable');
const htmlToText = require('html-to-text');

const compact = require('lodash/compact');
const zip = require('lodash/zip');
const max = require('lodash/max');
const padEnd = require('lodash/padEnd');
const get = require('lodash/get');

const wrap = require('word-wrap');

// vars for template.md
// template.md
// template.html
// out.md
// out.html
// out.text

function makeDocs(config) {
    // Create the markdown
    var md = renderMarkdown(config);
    fs.writeFileSync(config.out.md, md);
    console.log("Wrote", config.out.md);

    // Create the html body
    var innerHtml = renderInnerHtml(md);
    
    // Create the full html file
    var html = renderHtml(config, innerHtml);
    fs.writeFileSync(config.out.html, html);
    console.log("Wrote", config.out.html);

    // Create the text file
    var text = renderText(innerHtml);
    fs.writeFileSync(config.out.text, text);
    console.log("Wrote", config.out.text);
}

function renderMarkdown(config) {
    var md = '';
    try {
        md = fs.readFileSync(config.template.md, 'utf8');
    } catch (error) {
        throw error;
    }

    try {    
        md = mustache.render(md, config.vars);
    } catch (error) {
        throw error;
    }

    return md;
}

function renderInnerHtml(md) {
    var htmlTemplate = '<div class="guide">{{&content}}</div>';
    var mdParser = new remarkable({ html: true, breaks: true });
    
    var inner = '';
    try {
        inner = mdParser.render(md);
    } catch (error) {
        throw error;
    }

    var html = '';
    try {
        html = mustache.render(htmlTemplate, { content: inner });
    } catch (error) {
        throw error;
    }

    return html;
}

function renderHtml(config, innerHtml) {
    var html = '';
    try {
        html = fs.readFileSync(config.template.html, 'utf8');
    } catch (error) {
        throw error;
    }

    try {
        html = mustache.render(html, { guide: innerHtml });
    } catch (error) {
        throw error;
    }

    return html;
}

function renderText(html) {
    var buffer = '';

    // Write heading
    var empty = " ";
    buffer += empty.repeat(60) + "type 'q' to exit\n";
    buffer += empty.repeat(60) + "scroll to view all\n";

    try {
        buffer += __renderText(html);
    } catch (error) {
        throw error;
    }

    return buffer;
}

function __renderText(html) {
    var buffer = '';
    
    // Only parses headings, paragraphs, and tables. Code is
    // handled in paragraphs
    htmlToText.fromString(html, {
        baseElement: "div.guide",
        
        // Parse all tables
        tables: true,

        // Don't uppercase headings as they're parsed
        uppercaseHeadings: false,

        // Won't have any images so doesn't matter
        ignoreImage: true,
        
        // This doesn't seem to work properly
        wordwrap: 70,

        unorderedListItemPrefix: '- ',
        
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
            table: function(elem, fn, options) {
                let text = formatTable(elem, fn, options);
                buffer += text;
                return text;
            },
            lineBreak: function(elem, fn, options) {
                let text = fn(elem.children, options);
                console.log("Warning: didn't write line break: " +
                            elem.name + ": " + text);
                return text;
            },
            anchor: function(elem, fn, options) {
                let text = fn(elem.children, options);
                console.log("Warning: didn't write anchor: " +
                            elem.name + ": " + text);
                return text;
            },
            orderedList: function(elem, fn, options) {
                let text = fn(elem.children, options);
                console.log("Warning didn't write ordered list: " +
                            elem.name + ": " + text);
                return text;
            },
            unorderedList: function(elem, fn, options) {
                let text = formatUnorderedList(elem, fn, options);
                buffer += text;
                return text;                
            },
            listItem: function(elem, fn, options) {
                let text = fn(elem.children, options);
                console.log("Warning didn't write list item: " +
                            elem.name + ": " + text);
                return text;
            },
            horizontalLine: function(elem, fn, options) {
                let text = fn(elem.children, options);
                console.log("Warning didn't write horizontal line: " +
                            elem.name + ": " + text);
                return text;
            }
        }
    });

    return buffer;
}

var header = '';
function formatIndent(isHeader) {
    if (isHeader) {
        switch (header) {
        case 'h1':
            return '  ';
        case 'h2':
            return '  ';
        case 'h3':
            return '    ';
        case 'h4':
            return '      ';
        default:
            return '  ';
        }
    }
    
    switch (header) {
    case 'h1':
        return '  ';
    case 'h2':
        return '    ';
    case 'h3':
        return '      ';
    case 'h4':
        return '        ';
    default:
        return '  ';
    }
}

function formatHeading(elem, fn, options) {
    header = elem.name;            

    let text = '';
    switch (header) {
    case 'h1':
    case 'h2':
        text = '\n';
        break;
    }
        
    let orig = fn(elem.children, options);    
    text += formatIndent(true) + orig + '\n';

    switch (header) {
    case 'h1':
        text += '\n';
        break;
    case 'h2':
        text += formatIndent(true) +  ("=").repeat(orig.length) + '\n';
        break;
    }
    
    text += '\n';
    
    return text;
}

function formatParagraph(elem, fn, options) {
    let text = fn(elem.children, options);
    let lines = text.split('\n');
    let _indent = formatIndent(false);
    
    if (isCode(elem, options))
        _indent += '  ';

    text = '';
    lines.forEach(function(line) {
        text += _indent + line + '\n';
    });
    
    if (!isCode(elem, options))
        text += '\n';
    
    return text;
}

function isCode(elem, options) {
    return (options.isInPre &&
            elem.children.length == 1 &&
            elem.children[0].name == 'code');
}

function formatBareHeading(elem, fn, options) {
    var heading = fn(elem.children, options);
    if (options.uppercaseHeadings) {
        heading = heading.toUpperCase();
    }
    return heading + '\n';
}

function formatTable(elem, fn, options) {
    var table = [];
    function tryParseRows(elem) {
        if (elem.type !== 'tag') {
            return;
        }
        switch (elem.name.toLowerCase()) {
        case "thead":
        case "tbody":
        case "tfoot":
        case "center":
            elem.children.forEach(tryParseRows);
            return;            
        case 'tr':
            var row = [];
            elem.children.forEach(function(elem) {
                let newOptions = JSON.parse(JSON.stringify(options));
                newOptions.wordwrap = 1000;
                if (elem.type === 'tag') {
                    switch (elem.name.toLowerCase()) {
                    case 'th':
                        let rawHeading = formatBareHeading(elem, fn, newOptions);
                        row.push(rawHeading);
                        break;
                        
                    case 'td':
                        let rawText = fn(elem.children, newOptions);
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
    elem.children.forEach(tryParseRows);

    let lines = tableToString(table, options).split('\n');

    let text = '';
    lines.forEach(function(line) {
        text += formatIndent(false) + line + '\n';
    });

    return text;    
}

function tableToString(table, options) {
    // Find heading rows and remove them
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
    // Convert all rows to lengths
    var widths = table.map(function(row) {
        return row.map(function(col) {
            if (col.startsWith('___'))
                return 0;
            return col.length;
        });
    });
    
    // Invert rows with colums
    widths = zip.apply(null, widths);
    // Determine the max values for each column
    widths = widths.map(function(col) {
        return max(col);
    });

    // Build the table
    var text = '';
    var lastRow = table.length - 1;
    for (let r = 0; r < table.length; r++) {
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

        // Handle row
        for (var j = 0; j < row.length; j++) {
            let col = row[j];            
            let width = widths[j];

            if (j < last) {
                // Handle columns before last
                let fmt = padEnd(col, width, ' ') + '   ';
                t += fmt;
                firstLen += fmt.length;
                continue;
            }
            
            // Handle the last column specially
            let max = options.wordwrap - firstLen;
            if (max < 45)
                max = 45;

            // Handle simple case (no word wrap necessary)
            if (col.length <= max) {
                t += col;
                break;
            }

            // Get wrapped lines
            let lines = wrap(col, { width: max, indent: '' }).split('\n');
            
            // Handle the first
            t += lines[0];
            if (lines.length > 1) {
                for (let l = 1; l < lines.length; l++) {
                    t += '\n' + (' ').repeat(firstLen + 2) + lines[l];
                }
            }
            break;
        }

        // Skip empty rows
        if (t.trim().length == 0)
            continue;

        // Create inner table headings
        if (hasHeadings)
            text += '  ' + t + '\n';
        else
            text += t + '\n';
    }
    
    return text;
}

var whiteSpaceRegex = /^\s*$/;

function formatUnorderedList(elem, fn, options) {
    // if this list is a child of a list-item,
    // ensure that an additional line break is inserted
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
    // Replace all line breaks with line break + prefix spacing.
    text = text.replace(/\n/g, '\n' + ' '.repeat(prefix.length));
    // Add first prefix and line break at the end.
    return formatIndent(false) + prefix + text + '\n';
}

module.exports = {
    makeDocs: makeDocs
};
