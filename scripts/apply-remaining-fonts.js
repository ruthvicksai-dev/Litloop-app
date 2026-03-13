const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

const targets = [
    {
        "file": "app\\(admin)\\books.tsx",
        "styles": [
            "coverEmoji",
            "bookAuthor",
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(admin)\\dashboard.tsx",
        "styles": [
            "quickActionIcon",
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(admin)\\schedule-delivery.tsx",
        "styles": [
            "infoSub"
        ]
    },
    {
        "file": "app\\(admin)\\verify-payment.tsx",
        "styles": [
            "detailSub",
            "paymentSub",
            "paymentUtr",
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(auth)\\sign-up.tsx",
        "styles": [
            "formHint"
        ]
    },
    {
        "file": "app\\(tabs)\\history.tsx",
        "styles": [
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(tabs)\\index.tsx",
        "styles": [
            "greeting",
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(tabs)\\my-rentals.tsx",
        "styles": [
            "emptyIcon",
            "emptyText"
        ]
    },
    {
        "file": "app\\(tabs)\\profile.tsx",
        "styles": [
            "email",
            "phone"
        ]
    },
    {
        "file": "app\\rental\\payment.tsx",
        "styles": [
            "amountLabel",
            "amountValue",
            "qrNote",
            "uploadText",
            "cashDesc"
        ]
    },
    {
        "file": "app\\rental\\request.tsx",
        "styles": [
            "bookInfo"
        ]
    },
    {
        "file": "app\\rental\\schedule-return.tsx",
        "styles": [
            "infoLabel",
            "estimateLabel"
        ]
    },
    {
        "file": "components\\admin\\AdminDashboardStats.tsx",
        "styles": [
            "statNumber"
        ]
    },
    {
        "file": "components\\admin\\AdminRentalCard.tsx",
        "styles": [
            "rentalUser",
            "rentalLocation"
        ]
    },
    {
        "file": "components\\auth\\AuthHeader.tsx",
        "styles": [
            "logo"
        ]
    },
    {
        "file": "components\\books\\BookImageCarousel.tsx",
        "styles": [
            "placeholderText"
        ]
    },
    {
        "file": "components\\books\\CoverGalleryField.tsx",
        "styles": [
            "coverIcon",
            "coverText"
        ]
    },
    {
        "file": "components\\shared\\SearchInput.tsx",
        "styles": [
            "icon"
        ]
    },
    {
        "file": "components\\ui\\BookCard.tsx",
        "styles": [
            "placeholderText"
        ]
    },
    {
        "file": "components\\ui\\DatePickerField.tsx",
        "styles": [
            "placeholderText",
            "errorText"
        ]
    },
    {
        "file": "components\\ui\\InputField.tsx",
        "styles": [
            "errorText"
        ]
    },
    {
        "file": "components\\ui\\RentalCard.tsx",
        "styles": [
            "detailLabel"
        ]
    },
    {
        "file": "components\\ui\\TimePickerField.tsx",
        "styles": [
            "placeholderText",
            "errorText"
        ]
    }
];

function run() {
    for (const target of targets) {
        const fullPath = path.join(projectRoot, target.file);
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;

        // Ensure Fonts import exists
        if (!content.includes('import { Fonts } from "@/constants/fonts"')) {
            const importRegex = /^import.*$/gm;
            let lastImportMatch = null;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                lastImportMatch = match;
            }

            if (lastImportMatch) {
                const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                content = content.slice(0, insertPos) + '\nimport { Fonts } from "@/constants/fonts";' + content.slice(insertPos);
            } else {
                content = `import { Fonts } from "@/constants/fonts";\n${content}`;
            }
        }

        // Apply styles
        for (const styleName of target.styles) {
            // don't apply fonts to icons to prevent breaking Ionicons rendering
            if (styleName.toLowerCase().includes('icon') || styleName === 'logo' || styleName === 'coverEmoji') {
                continue;
            }

            const styleRegex = new RegExp(`(${styleName}\\s*:\\s*{)([^}]*)}`, 'g');
            content = content.replace(styleRegex, (match, prefix, body) => {
                if (!body.includes('fontFamily')) {
                    // if it's an amount/stat/value, default to bold otherwise regular
                    const isBold = styleName.toLowerCase().includes('amount') || styleName.toLowerCase().includes('number');
                    const fontStyle = isBold ? 'Fonts.bold' : 'Fonts.regular';
                    return `${prefix}${body}  fontFamily: ${fontStyle},\n    }`;
                }
                return match;
            });
        }

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated styles in: ${target.file}`);
        }
    }
}

run();
console.log('Complete!');
