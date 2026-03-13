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

    // We only care about files that have styles
    if (!content.includes('StyleSheet.create')) return;

    // We only care about files that use Text components
    if (!content.includes('<Text') && !content.includes('<TextInput')) return;

    let modified = false;

    // Add Fonts import if missing and Fonts is used
    if (content.includes('Fonts.') && !content.includes('import { Fonts }')) {
        // Try to insert after React Native imports
        if (content.includes('react-native"')) {
            content = content.replace(
                /(import.*['"]react-native['"];?)/,
                match => `${match}\nimport { Fonts } from "@/constants/fonts";`
            );
        } else {
            // fallback to top of file
            content = `import { Fonts } from "@/constants/fonts";\n${content}`;
        }
        modified = true;
    }

    // Try to inject fontFamily: Fonts.regular into basic Text styles
    // Look for common style names for text like "text", "title", "subtitle", "label", "caption", "description"
    const textStyles = ['text', 'title', 'subtitle', 'label', 'caption', 'description', 'heading', 'value', 'price', 'author', 'name', 'statValue', 'statLabel', 'valueText', 'labelText'];

    for (const styleName of textStyles) {
        // Look for:  text: { ... }
        const styleRegex = new RegExp(`(${styleName}\\s*:\\s*{)([^}]*)}`, 'g');
        content = content.replace(styleRegex, (match, prefix, body) => {
            // if it doesn't already have fontFamily or fontWeight
            if (!body.includes('fontFamily') && !body.includes('fontWeight')) {
                modified = true;
                return `${prefix}${body}  fontFamily: Fonts.regular,\n    }`;
            }
            return match;
        });
    }

    if (modified && content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Text Defaults: ${filePath}`);
    }
}

directoryPaths.forEach(processDirectory);
console.log('Done refactoring default fonts!');
