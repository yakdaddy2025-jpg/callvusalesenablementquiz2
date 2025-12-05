/**
 * Fix 400 Bad Request error - check for invalid data in CVUF
 * Common causes: null values, empty required fields, invalid field configurations
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Checking for data that could cause 400 Bad Request errors...\n');

let fixedCount = 0;
const issues = [];

// Fix 1: Ensure all arrays are arrays (not null)
function ensureArray(obj, path = '') {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (!Array.isArray(obj)) {
    issues.push(`⚠️  ${path} was not an array, fixed`);
    return [];
  }
  return obj;
}

// Fix 2: Ensure all objects are objects (not null)
function ensureObject(obj, path = '') {
  if (obj === null || obj === undefined) {
    issues.push(`⚠️  ${path} was null, fixed`);
    return {};
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  return obj;
}

// Fix form-level arrays
cvuf.form.actions = ensureArray(cvuf.form.actions, 'form.actions');
cvuf.form.calculatedFields = ensureArray(cvuf.form.calculatedFields, 'form.calculatedFields');
cvuf.form.globalVariables = ensureArray(cvuf.form.globalVariables, 'form.globalVariables');
cvuf.form.steps = ensureArray(cvuf.form.steps, 'form.steps');

// Fix step-level arrays and objects
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step ${stepIdx + 1}`;
  
  // Ensure blocks is an array
  step.blocks = ensureArray(step.blocks, `step "${stepName}".blocks`);
  
  step.blocks.forEach((block, blockIdx) => {
    // Ensure rows is an array
    block.rows = ensureArray(block.rows, `block ${blockIdx} in "${stepName}".rows`);
    
    block.rows.forEach((row, rowIdx) => {
      // Ensure fields is an array
      row.fields = ensureArray(row.fields, `row ${rowIdx} in block ${blockIdx} of "${stepName}".fields`);
      
      row.fields.forEach((field, fieldIdx) => {
        // Ensure validations is an array
        field.validations = ensureArray(field.validations, `field ${fieldIdx} in "${stepName}".validations`);
        
        // Ensure required fields have proper values
        if (field.type === undefined || field.type === null) {
          issues.push(`❌ Field ${fieldIdx} in "${stepName}" missing type`);
          field.type = 'paragraph'; // Default fallback
          fixedCount++;
        }
        
        // Ensure name field exists
        if (!field.name && field.type) {
          // Set default name based on type
          if (field.type === 'paragraph') {
            field.name = 'editor.fields.paragraph';
          } else if (field.type === 'longText') {
            field.name = 'editor.fields.longText';
          } else if (field.type === 'text') {
            field.name = 'editor.fields.text';
          }
          fixedCount++;
        }
        
        // Remove any null or undefined values that might cause issues
        Object.keys(field).forEach(key => {
          if (field[key] === null) {
            delete field[key];
            fixedCount++;
          }
        });
      });
    });
    
    // Ensure block.style is an object
    block.style = ensureObject(block.style, `block ${blockIdx} in "${stepName}".style`);
  });
  
  // Ensure buttonsConfig is an object
  step.buttonsConfig = ensureObject(step.buttonsConfig, `step "${stepName}".buttonsConfig`);
  
  // Ensure step.style is an object
  step.style = ensureObject(step.style, `step "${stepName}".style`);
});

// Fix form-level objects
cvuf.form.approveData = ensureObject(cvuf.form.approveData, 'form.approveData');
cvuf.form.approveData.popupObj = ensureObject(cvuf.form.approveData.popupObj, 'form.approveData.popupObj');
cvuf.form.expirationObj = ensureObject(cvuf.form.expirationObj, 'form.expirationObj');
cvuf.form.hintMsgProps = ensureObject(cvuf.form.hintMsgProps, 'form.hintMsgProps');
cvuf.form.otp = ensureObject(cvuf.form.otp, 'form.otp');
cvuf.form.otp.optionalFields = ensureArray(cvuf.form.otp.optionalFields, 'form.otp.optionalFields');

// Ensure empty strings for optional fields (not null)
if (cvuf.form.formCustomStyle === null || cvuf.form.formCustomStyle === undefined) {
  cvuf.form.formCustomStyle = '';
  fixedCount++;
}

if (cvuf.form.last_update === null || cvuf.form.last_update === undefined) {
  cvuf.form.last_update = '';
  fixedCount++;
}

console.log(`\n✅ Fixed ${fixedCount} potential issues`);
if (issues.length > 0) {
  console.log(`\n⚠️  Issues found and fixed:`);
  issues.forEach(issue => console.log(`   ${issue}`));
}

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
console.log('✅ File updated - should fix 400 Bad Request errors');

