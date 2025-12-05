/**
 * Fix invalid field types that CallVu is rejecting
 * emailInput → email
 * radioInput → radio
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Fixing invalid field types...\n');

let fixedCount = 0;

cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Fix emailInput → email
              if (field.type === 'emailInput') {
                console.log(`✅ Fixed emailInput → email in step "${step.stepName}"`);
                field.type = 'email';
                fixedCount++;
              }
              
              // Fix radioInput → radio
              if (field.type === 'radioInput') {
                console.log(`✅ Fixed radioInput → radio in step "${step.stepName}"`);
                field.type = 'radio';
                fixedCount++;
              }
            });
          }
        });
      }
    });
  }
});

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} invalid field type(s)`);
console.log('\n💡 Try saving again in CallVu Studio - should work now!');

