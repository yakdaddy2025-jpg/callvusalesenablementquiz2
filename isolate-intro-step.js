/**
 * ISOLATE Intro step completely - remove any possibility of content syncing
 * Add unique identifiers to ALL fields, even those with empty integrationIDs
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 ISOLATING Intro step completely...\n');

let fixedCount = 0;

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.log('❌ Intro step not found!');
  process.exit(1);
}

// Make EVERY field in Intro step completely unique
if (introStep.blocks) {
  introStep.blocks.forEach((block, blockIdx) => {
    if (block.rows) {
      block.rows.forEach((row, rowIdx) => {
        if (row.fields) {
          row.fields.forEach((field, fieldIdx) => {
            // Give EVERY field a unique integrationID, even if it was empty
            if (!field.integrationID || field.integrationID === '') {
              // Create unique ID based on field type and position
              const fieldType = field.type || 'field';
              const uniqueId = `Intro_${fieldType}_${blockIdx}_${rowIdx}_${fieldIdx}_${Date.now()}`;
              field.integrationID = uniqueId;
              console.log(`✅ Added unique integrationID to Intro field: "${uniqueId}"`);
              fixedCount++;
            } else {
              // Ensure existing integrationIDs are prefixed with Intro_
              if (!field.integrationID.startsWith('Intro_')) {
                const newId = `Intro_${field.integrationID}`;
                field.integrationID = newId;
                console.log(`✅ Made Intro integrationID unique: "${field.integrationID}" → "${newId}"`);
                fixedCount++;
              }
            }
            
            // Also make identifier unique if it's generic
            if (field.identifier && (
              field.identifier === 'small_heading' || 
              field.identifier === 'large_heading' ||
              field.identifier.startsWith('para_')
            )) {
              const newIdentifier = `intro_${field.identifier}_${blockIdx}_${rowIdx}_${fieldIdx}`;
              field.identifier = newIdentifier;
              console.log(`✅ Made identifier unique: "${field.identifier}" → "${newIdentifier}"`);
              fixedCount++;
            }
          });
        }
      });
    }
  });
}

// Also ensure isFirstStep is set correctly
introStep.isFirstStep = true;
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
}

// Remove ANY field that contains "YOUR TASK" from Intro
let removedCount = 0;
if (introStep.blocks) {
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          const originalLength = row.fields.length;
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task') || 
                  (content.includes('voice recorder below') && !content.includes('welcome') && !content.includes('assessment'))) {
                console.log(`✅ Removed "YOUR TASK" field from Intro`);
                removedCount++;
                return false;
              }
            }
            return true;
          });
        }
      });
    }
  });
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} field(s)`);
console.log(`✅ Removed ${removedCount} "YOUR TASK" field(s) from Intro`);
console.log('\n💡 CRITICAL:');
console.log('   1. DELETE the form completely in CallVu Studio');
console.log('   2. Close and reopen CallVu Studio (to clear cache)');
console.log('   3. Re-import Sales_Enablement_Quiz_EDITABLE.cvuf');
console.log('   4. Save and publish');
console.log('   5. Clear browser cache (Ctrl+Shift+Delete)');
console.log('   6. Test preview');

