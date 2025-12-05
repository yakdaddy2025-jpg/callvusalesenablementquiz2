/**
 * CRITICAL FIX: Make ALL integrationIDs unique
 * The Intro and Rep Info steps still have duplicate integrationIDs causing content syncing
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Making ALL integrationIDs unique (CRITICAL FIX)...\n');

let fixedCount = 0;

// Make EVERY integrationID unique per step
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  // Create a safe prefix from step name
  const stepPrefix = stepName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^([0-9])/, 'Step_$1'); // If starts with number, prefix with Step_
  
  if (step.blocks) {
    step.blocks.forEach((block, blockIdx) => {
      if (block.rows) {
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              if (field.integrationID) {
                // Check if it's already unique to this step
                const currentId = field.integrationID;
                const expectedPrefix = stepPrefix + '_';
                
                // If it doesn't start with the step prefix, make it unique
                if (!currentId.startsWith(expectedPrefix)) {
                  // Extract the base ID (remove any existing prefixes)
                  let baseId = currentId;
                  // Remove common prefixes if they exist
                  baseId = baseId.replace(/^(Intro_|Rep_Info_|Roleplay_\d+_|Drill_[AB]_|Quiz_\d+_|Check_\d+_|Scenario_\d+_|Exercise_Set_A_)/, '');
                  
                  const newId = `${stepPrefix}_${baseId}`;
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

// Also fix email field name
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.name === 'editor.fields.emailinput') {
                field.name = 'editor.fields.email';
                console.log(`✅ Fixed email field name in "${step.stepName}"`);
                fixedCount++;
              }
              if (field.type === 'emailInput') {
                field.type = 'email';
                console.log(`✅ Fixed email type in "${step.stepName}"`);
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
console.log('\n💡 CRITICAL: Delete the form in CallVu Studio and re-import!');
console.log('   This will fix the content syncing issue.');

