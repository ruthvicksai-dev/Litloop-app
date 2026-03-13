const fs = require('fs');
const path = require('path');

const directoryPaths = [
    path.join(__dirname, '..', 'app'),
    path.join(__dirname, '..', 'components')
];

function processDirectory(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    if (!content.includes('StyleSheet.create')) return;

    let modified = false;

    // 1. TextInputs usually have "input" or "searchInput" styles
    const inputStyleNames = ['input', 'searchInput', 'inputText'];
    for (const styleName of inputStyleNames) {
        // match `input: { ... }` up to 15 lines max to avoid catastrophic backtracking
        const styleRegex = new RegExp(`(${styleName}\\s*:\\s*{)([^}]*)}`, 'g');
        content = content.replace(styleRegex, (match, prefix, body) => {
            if (!body.includes('fontFamily')) {
                modified = true;
                return `${prefix}${body}  fontFamily: Fonts.regular,\n    }`;
            }
            return match;
        });
    }

    // 2. Headings typically named "headerTitle", "title", "heading", "screenTitle"
    // often my script swapped fontWeight to fontFamily, let's make sure they got one
    const headerStyleNames = ['headerTitle', 'title', 'heading', 'screenTitle', 'heroTitle'];
    for (const styleName of headerStyleNames) {
        const styleRegex = new RegExp(`(${styleName}\\s*:\\s*{)([^}]*)}`, 'g');
        content = content.replace(styleRegex, (match, prefix, body) => {
            if (!body.includes('fontFamily')) {
                modified = true;
                // headings default to bold
                return `${prefix}${body}  fontFamily: Fonts.bold,\n    }`;
            }
            return match;
        });
    }

    if (modified && content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Inputs/Headings: ${filePath}`);
    }
}

directoryPaths.forEach(processDirectory);
console.log('Done mapping inputs and headings!');
