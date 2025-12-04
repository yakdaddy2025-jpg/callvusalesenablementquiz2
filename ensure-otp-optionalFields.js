/**
 * Ensure otp.optionalFields is an array (not null)
 * This might be what's causing the filter() error
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Ensure otp.optionalFields is an array
if (!cvuf.form.otp.optionalFields || !Array.isArray(cvuf.form.otp.optionalFields)) {
  cvuf.form.otp.optionalFields = [];
  console.log('✅ Fixed otp.optionalFields (set to empty array)');
} else {
  console.log('✅ otp.optionalFields is already an array');
}

// Also ensure all other array properties are arrays
const checks = [
  { path: 'form.actions', value: cvuf.form.actions },
  { path: 'form.calculatedFields', value: cvuf.form.calculatedFields },
  { path: 'form.globalVariables', value: cvuf.form.globalVariables },
  { path: 'form.newRules', value: cvuf.form.newRules },
  { path: 'form.steps', value: cvuf.form.steps },
  { path: 'form.otp.optionalFields', value: cvuf.form.otp.optionalFields }
];

checks.forEach(check => {
  if (!Array.isArray(check.value)) {
    console.log(`⚠️  ${check.path} is not an array:`, typeof check.value, check.value);
  }
});

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
console.log('✅ File updated');

