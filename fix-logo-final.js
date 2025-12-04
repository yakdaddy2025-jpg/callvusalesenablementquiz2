/**
 * Fix logo URL - try multiple sources to find working one
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Try the S3 URL that was in original - this might be the one CallVu uses
cvuf.form.logoUrl = 'https://callvustudioproduction.s3.us-east-1.amazonaws.com/admin/callvu-icon-black.svg';

// Alternative options if above doesn't work:
// cvuf.form.logoUrl = 'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg';
// cvuf.form.logoUrl = 'https://callvu.com/wp-content/themes/callvu/assets/images/logo.svg';

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ Logo URL updated to CallVu S3 bucket');
console.log('   If this doesn\'t work, you can update it in CallVu designer');

