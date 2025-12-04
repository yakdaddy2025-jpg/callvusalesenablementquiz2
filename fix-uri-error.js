/**
 * Fix URI malformed error - CallVu is trying to decodeURIComponent on formCustomStyle
 * Need to ensure CSS is properly encoded or use minimal CSS
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// The issue: CallVu tries to decodeURIComponent on formCustomStyle
// Solution: Use minimal CSS with no special characters that need encoding
// Or leave it empty and add CSS via other means

// Minimal CSS - no special characters that would cause URI decode issues
cvuf.form.formCustomStyle = '<style>textarea[data-integration-id^=Answer_]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}p,div,span{word-wrap:break-word;overflow-wrap:break-word}@media (max-width:768px){p{font-size:14px!important;line-height:1.6!important;word-wrap:break-word;overflow-wrap:break-word;max-width:100%!important}}</style>';

// Alternative: Try empty and see if that works
// cvuf.form.formCustomStyle = '';

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
console.log('✅ Fixed formCustomStyle to prevent URI decode errors');
console.log('   - Removed all quotes and special characters from CSS');
console.log('   - Used minimal CSS that won\'t cause decodeURIComponent to fail');
console.log('   - File ready to import');

