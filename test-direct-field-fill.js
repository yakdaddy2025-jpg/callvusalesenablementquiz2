/**
 * TEST: Try to directly fill the required field using every possible method
 * Bypass hidden field and conditional logic - just fill it directly
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_WORKING_1764951868355.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_DIRECT_FILL_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Making required fields directly fillable (no readonly, no conditional logic needed)...\n');

let fieldsFixed = 0;

cvuf.form.steps.forEach((step) => {
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        // Find required "*Your Response" fields
        if (field.type === 'longText' && 
            field.label && 
            field.label.includes('*Your Response') &&
            field.required === true) {
          
          // Make it directly fillable - remove readonly
          field.readOnly = false;
          delete field.readonly;
          
          // Remove disabled state
          field.disabled = false;
          
          // Make sure it's not hidden
          field.isHiddenInRuntime = false;
          
          fieldsFixed++;
          console.log(`   ✅ Made directly fillable: ${step.text || step.stepName} - ${field.label}`);
        }
      });
    });
  });
});

// Remove all conditional logic rules - we'll fill directly
console.log(`\n⚠️  Removing conditional logic rules - using direct fill instead`);
cvuf.form.dynamicFieldRules = [];

console.log(`\n✅ Made ${fieldsFixed} fields directly fillable`);
console.log(`\n📋 New Approach:`);
console.log(`   - Required fields: readOnly=false (can be filled directly)`);
console.log(`   - JavaScript: Fills required field directly via DOM/postMessage`);
console.log(`   - No conditional logic needed`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

