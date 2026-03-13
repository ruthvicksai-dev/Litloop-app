const fs = require('fs');
const path = require('path');

const directoryPaths = [
    path.join(__dirname, '..', 'app'),
    path.join(__dirname, '..', 'components')
];

let filesWithMissingFonts = [];

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

    if (!content.includes('StyleSheet.create')) return;

    // Look for style definitions that DO NOT have fontFamily
    // A style is defined as `name: { ... }`

    const styleBlockRegex = /StyleSheet\.create\(\{([\s\S]*?)\}\);/;
    const match = styleBlockRegex.exec(content);

    if (match) {
        const stylesBlock = match[1];

        // Find individual styles
        const individualStyleRegex = /([a-zA-Z0-9_]+)\s*:\s*\{([^}]*)\}/g;
        let styleMatch;
        let missingFonts = [];

        while ((styleMatch = individualStyleRegex.exec(stylesBlock)) !== null) {
            const styleName = styleMatch[1];
            const styleBody = styleMatch[2];

            // Heuristic: If it has fontSize or color, it's likely text
            if ((styleBody.includes('fontSize') || styleBody.includes('color: Colors.text')) && !styleBody.includes('fontFamily')) {
                // If it's a container style that just happens to have color, ignore it? 
                // Let's just flag it for manual review
                missingFonts.push(styleName);
            }
        }

        if (missingFonts.length > 0) {
            filesWithMissingFonts.push({
                file: path.relative(path.join(__dirname, '..'), filePath),
                styles: missingFonts
            });
        }
    }
}

directoryPaths.forEach(processDirectory);
console.log(JSON.stringify(filesWithMissingFonts, null, 2));
