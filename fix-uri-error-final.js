/**
 * Fix URI malformed error - set formCustomStyle to empty
 * CallVu is trying to decodeURIComponent on it and failing
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Set to completely empty - this is the only way to prevent the URI decode error
cvuf.form.formCustomStyle = '';

console.log('✅ Set formCustomStyle to empty string');
console.log('   - This will prevent the decodeURIComponent error');
console.log('   - CSS can be added later in CallVu designer if needed');
console.log('   - Text wrapping is already handled via inline styles in paragraph fields');

// Validate JSON
try {
  JSON.stringify(cvuf);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ File updated - URI error should be fixed');

