/**
 * Fix CSS to be completely safe for URI decoding
 * Remove all special characters that could cause issues
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Use minimal, safe CSS with no special characters
// All selectors without quotes, no special chars
cvuf.form.formCustomStyle = `<style>
p,div,span,h1,h2,h3,h4,h5,h6{word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%}
@media (max-width:768px){p,div{font-size:14px;line-height:1.6}}
textarea[data-integration-id^=Answer_]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}
button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}
</style>`;

// Also update logo - try CallVu's main website logo
cvuf.form.logoUrl = 'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg';

console.log('✅ Updated formCustomStyle with minimal safe CSS');
console.log('✅ Updated logo URL to CallVu main website');
console.log('   (User can update in CallVu designer if needed)');

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ File updated');

