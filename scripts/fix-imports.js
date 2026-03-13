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

    // We only care about files that use Fonts
    if (!content.includes('Fonts.')) return;

    let modified = false;

    // Add Fonts import if missing and Fonts is used
    if (!content.includes('import { Fonts } from "@/constants/fonts"')) {
        // Find the last import statement
        const importRegex = /^import.*$/gm;
        let lastImportMatch = null;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            lastImportMatch = match;
        }

        if (lastImportMatch) {
            const insertPos = lastImportMatch.index + lastImportMatch[0].length;
            content = content.slice(0, insertPos) + '\nimport { Fonts } from "@/constants/fonts";' + content.slice(insertPos);
            modified = true;
        } else {
            content = `import { Fonts } from "@/constants/fonts";\n${content}`;
            modified = true;
        }
    }

    if (modified && content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Imports: ${filePath}`);
    }
}

directoryPaths.forEach(processDirectory);
console.log('Done fixing imports!');
