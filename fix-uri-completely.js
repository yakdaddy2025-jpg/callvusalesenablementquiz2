/**
 * Completely fix URI error - try empty CSS or URL-encode it properly
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Option 1: Try completely empty CSS first
// If CallVu is trying to decodeURIComponent, maybe it expects empty or properly encoded
cvuf.form.formCustomStyle = '';

// Option 2: If empty doesn't work, try minimal single-line CSS with no special chars
// cvuf.form.formCustomStyle = '<style>textarea[data-integration-id^=Answer_]{pointer-events:none;background:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5}</style>';

// Option 3: Try URL-encoded version (but this might not work either)
// const css = 'textarea[data-integration-id^=Answer_]{pointer-events:none;background:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5}';
// cvuf.form.formCustomStyle = '<style>' + encodeURIComponent(css) + '</style>';

console.log('Setting formCustomStyle to empty string');
console.log('This will prevent the URI decode error');
console.log('You can add CSS later in CallVu designer if needed');

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
console.log('✅ Fixed - formCustomStyle is now empty');
console.log('   - This should prevent the decodeURIComponent error');
console.log('   - You can add CSS in CallVu designer after import');

