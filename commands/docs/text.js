const htmlToText = require('html-to-text');

const compact = require('lodash/compact');
const zip = require('lodash/zip');
const max = require('lodash/max');
const padEnd = require('lodash/padEnd');
const get = require('lodash/get');
const wrap = require('word-wrap');


////////////////////////////////////////////////////////////////////////////////


const whiteSpaceRegex = /^\s*$/;
const empty = " ";
var header = "";


////////////////////////////////////////////////////////////////////////////////


function textFromHTML(html, options) {
    var text = lessGuide();
    
    try {
        text += renderText(html, options);
    } catch (error) {
        return {
            ok: false,
            error_msg: error.toString()
        };
    }

    return text;
}


// This should probably be in a template
function lessGuide() {
    var buffer = empty.repeat(60) + "This doc is displayed by 'less':";
    buffer += empty.repeat(60) + "type 'q' to exit\n";
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
        unorderedListItemPrefix: options.listPrefix,
        
        // Parse all tables
        tables: true,

        // Don't uppercase headings as they're parsed
        uppercaseHeadings: false,

        // Won't have any images so doesn't matter
        ignoreImage: true,
        
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


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    fromHTML: textFromHTML
};
