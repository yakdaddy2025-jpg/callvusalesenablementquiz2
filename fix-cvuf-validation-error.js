/**
 * Fix CVUF validation structure error
 * Remove invalid validations array format
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_REQUIRED_FIELD_1764924585072.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_FIXED_VALIDATION_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Fixing CVUF validation structure...\n');

let fixedCount = 0;

cvuf.form.steps.forEach((step) => {
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        // Fix validations array - should be empty array, not array with objects
        if (field.validations && Array.isArray(field.validations)) {
          // Check if validations has invalid structure
          const hasInvalidValidation = field.validations.some(v => 
            v && typeof v === 'object' && v.type
          );
          
          if (hasInvalidValidation) {
            // Replace with empty array - CallVu uses 'required' property, not validations array
            field.validations = [];
            fixedCount++;
            console.log(`   ✅ Fixed validations for field: ${field.label || field.integrationID}`);
          }
        }
        
        // Ensure required field is set correctly
        if (field.type === 'longText' && 
            field.label && 
            field.label.toLowerCase().includes('response')) {
          // Make sure required is boolean, not validation object
          if (field.required !== true) {
            field.required = true;
          }
        }
      });
    });
  });
});

console.log(`\n✅ Fixed ${fixedCount} validation structures`);
console.log(`✅ Using 'required: true' property instead of validations array`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

