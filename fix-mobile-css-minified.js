/**
 * Create minified mobile CSS without newlines or comments
 * This prevents URI encoding issues
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Minified CSS - no newlines, no comments, safe for URI decoding
const mobileCSS = '<style>p,div,span,h1,h2,h3,h4,h5,h6,li,td,th{word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box}@media screen and (max-width:768px){p,div,span{word-wrap:break-word!important;overflow-wrap:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;font-size:14px!important;line-height:1.6!important;padding:0 10px!important}h1,h2,h3,h4,h5,h6{font-size:18px!important;line-height:1.4!important;word-wrap:break-word!important;overflow-wrap:break-word!important;max-width:100%!important;padding:0 10px!important}ul,ol{padding-left:20px!important;margin:10px 0!important}li{word-wrap:break-word!important;overflow-wrap:break-word!important;margin-bottom:8px!important}[data-field-type=paragraph]{width:100%!important;max-width:100%!important}textarea,input{width:100%!important;max-width:100%!important;box-sizing:border-box!important}#voice-recorder-container{width:100%!important;max-width:100%!important;padding:15px!important;box-sizing:border-box!important}[class*=block],[class*=row]{width:100%!important;max-width:100%!important;box-sizing:border-box!important}}textarea[data-integration-id^=Answer_]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}</style>';

cvuf.form.formCustomStyle = mobileCSS;

console.log('✅ Added minified mobile-responsive CSS');
console.log('   - No newlines or comments (safe for URI decoding)');
console.log('   - Text will wrap properly on mobile');
console.log('   - Editable blocks should work on mobile');

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
console.log('✅ File updated with minified mobile CSS');

