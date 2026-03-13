const fs = require('fs');
const path = require('path');

const directoryPaths = [
    path.join(__dirname, '..', 'app'),
    path.join(__dirname, '..', 'components')
];

let modifiedFiles = 0;

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

    // React Native's Text node overrides fontFamily if fontWeight is present (and the font variant doesn't explicitly map it internally)
    // We want to rely purely on fontFamily: Fonts.bold etc.
    // Let's strip out all `fontWeight: "..."` or `fontWeight: '...'` or `fontWeight: 800` lines from stylesheets

    // regex to match `fontWeight: "800",` or `fontWeight: 'bold',` etc, including the trailing comma and optional spaces
    const fontWeightRegex = /fontWeight\s*:\s*(["'][^"']+["']|\d+)\s*,?/g;

    content = content.replace(fontWeightRegex, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Removed fontWeight from: ${path.basename(filePath)}`);
        modifiedFiles++;
    }
}

processDirectory(directoryPaths[0]);
processDirectory(directoryPaths[1]);
console.log(`Complete! Modified ${modifiedFiles} files.`);
