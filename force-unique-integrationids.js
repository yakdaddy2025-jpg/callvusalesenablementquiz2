/**
 * FORCE all integrationIDs to be unique - directly replace non-unique ones
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 FORCING all integrationIDs to be unique...\n');

let fixedCount = 0;
const stepPrefixes = {};

// First pass: assign unique prefixes to each step
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  let prefix = stepName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  
  // Ensure prefix doesn't start with number
  if (/^[0-9]/.test(prefix)) {
    prefix = 'Step_' + prefix;
  }
  
  stepPrefixes[step.stepName] = prefix;
});

// Second pass: force ALL integrationIDs to be unique
cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  const prefix = stepPrefixes[stepName] || 'Step';
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.integrationID) {
                const currentId = field.integrationID;
                
                // Check if it's already unique to this step
                if (!currentId.startsWith(prefix + '_')) {
                  // Extract base name (remove any existing step prefixes)
                  let baseId = currentId;
                  Object.values(stepPrefixes).forEach(p => {
                    baseId = baseId.replace(new RegExp(`^${p}_`), '');
                  });
                  
                  // Create new unique ID
                  const newId = `${prefix}_${baseId}`;
                  field.integrationID = newId;
                  console.log(`✅ "${stepName}": "${currentId}" → "${newId}"`);
                  fixedCount++;
                }
              }
            });
          }
        });
      }
    });
  }
});

// Also ensure email field is correct
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.name === 'editor.fields.emailinput') {
                field.name = 'editor.fields.email';
                fixedCount++;
              }
              if (field.type === 'emailInput') {
                field.type = 'email';
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

console.log(`\n✅ Fixed ${fixedCount} integrationID(s) and field(s)`);
console.log('\n💡 CRITICAL NEXT STEPS:');
console.log('   1. DELETE the current form in CallVu Studio');
console.log('   2. Re-import Sales_Enablement_Quiz_EDITABLE.cvuf');
console.log('   3. SAVE the form');
console.log('   4. PUBLISH the form');
console.log('   5. Clear browser cache');
console.log('   6. Test - content syncing should be fixed!');

