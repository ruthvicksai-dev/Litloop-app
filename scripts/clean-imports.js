const fs = require('fs');
const files = [
    'components/admin/AdminRentalCard.tsx',
    'components/books/CoverGalleryField.tsx',
    'components/ui/BookCard.tsx',
    'components/ui/Button.tsx',
    'components/ui/DatePickerField.tsx',
    'components/ui/InputField.tsx',
    'components/ui/TimePickerField.tsx'
];
for (const file of files) {
    let c = fs.readFileSync(file, 'utf8');
    // Remove the injected string (including following spaces/newlines)
    c = c.replace(/import \{ Fonts \} from "@\/constants\/fonts";\r?\n\s+/g, '');
    // Prepend it correctly
    c = `import { Fonts } from "@/constants/fonts";\n` + c;
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
}
