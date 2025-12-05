/**
 * Fix Intro step - make ALL integrationIDs unique to prevent content syncing
 * CallVu syncs content when integrationIDs match across steps
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Making Intro step integrationIDs unique...\n');

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.error('❌ Intro step not found!');
  process.exit(1);
}

let fixedCount = 0;

// Make all integrationIDs in Intro step unique
introStep.blocks.forEach((block) => {
  if (block.rows) {
    block.rows.forEach((row) => {
      if (row.fields) {
        row.fields.forEach((field) => {
          if (field.integrationID) {
            // Make it unique to Intro step
            if (!field.integrationID.startsWith('Intro_')) {
              const oldId = field.integrationID;
              field.integrationID = `Intro_${field.integrationID}`;
              console.log(`✅ Changed integrationID: "${oldId}" → "${field.integrationID}"`);
              fixedCount++;
            }
          }
        });
      }
    });
  }
});

// Also ensure the step itself has unique identifier
if (introStep.identifier !== 'step_intro') {
  introStep.identifier = 'step_intro';
  console.log(`✅ Set step identifier to: step_intro`);
}

// Ensure isFirstStep is set
introStep.isFirstStep = true;
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
}

console.log(`\n✅ Fixed ${fixedCount} integrationID(s)`);
console.log(`✅ Intro step is now isolated from other steps`);

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('\n✅ CVUF file updated');
console.log('\n💡 Next steps:');
console.log('   1. DELETE the current form in CallVu Studio');
console.log('   2. Re-import the CVUF file');
console.log('   3. SAVE the form');
console.log('   4. PUBLISH the form');
console.log('   5. Clear browser cache completely');
console.log('   6. Test - Intro should only show Welcome content');

