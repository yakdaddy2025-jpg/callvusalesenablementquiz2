/**
 * PREVENT SYNCING: Change all Intro step field values to be completely unique
 * This will prevent CallVu from syncing content from other steps
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 PREVENTING SYNCING by making Intro fields completely unique...\n');

let fixedCount = 0;

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.log('❌ Intro step not found!');
  process.exit(1);
}

// Make EVERY field in Intro step completely unique and different from all other steps
if (introStep.blocks) {
  introStep.blocks.forEach((block, blockIdx) => {
    if (block.rows) {
      block.rows.forEach((row, rowIdx) => {
        if (row.fields) {
          row.fields.forEach((field, fieldIdx) => {
            // Generate completely unique identifiers using timestamp and random
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            
            // Change identifier to be completely unique
            const oldIdentifier = field.identifier;
            field.identifier = `intro_unique_${fieldIdx}${uniqueSuffix}`;
            console.log(`✅ Changed identifier: "${oldIdentifier}" → "${field.identifier}"`);
            fixedCount++;
            
            // Change integrationID to be completely unique (if it exists)
            if (field.integrationID) {
              const oldIntegrationID = field.integrationID;
              field.integrationID = `Intro_Unique_${fieldIdx}${uniqueSuffix}`;
              console.log(`✅ Changed integrationID: "${oldIntegrationID}" → "${field.integrationID}"`);
              fixedCount++;
            } else {
              // Add a unique integrationID if it doesn't exist
              field.integrationID = `Intro_Unique_${fieldIdx}${uniqueSuffix}`;
              console.log(`✅ Added unique integrationID: "${field.integrationID}"`);
              fixedCount++;
            }
            
            // Change the field name to be unique (if it's a paragraph)
            if (field.name && field.name.includes('paragraph')) {
              field.name = `editor.fields.paragraph.intro.${fieldIdx}`;
              console.log(`✅ Changed field name to be unique`);
              fixedCount++;
            }
            
            // Add a unique className to prevent any CSS-based syncing
            if (!field.className || field.className === '') {
              field.className = `intro-field-${fieldIdx}-${Date.now()}`;
            } else {
              field.className = `${field.className} intro-field-${fieldIdx}-${Date.now()}`;
            }
            
            // Add a unique tooltip to make it even more distinct
            field.tooltip = `Intro step field ${fieldIdx} - ${Date.now()}`;
          });
        }
      });
    }
  });
}

// Also change the step identifier to be unique
const oldStepIdentifier = introStep.identifier;
introStep.identifier = `step_intro_unique_${Date.now()}`;
console.log(`✅ Changed step identifier: "${oldStepIdentifier}" → "${introStep.identifier}"`);
fixedCount++;

// Change block identifier
if (introStep.blocks && introStep.blocks[0]) {
  const oldBlockIdentifier = introStep.blocks[0].identifier;
  introStep.blocks[0].identifier = `block_intro_unique_${Date.now()}`;
  console.log(`✅ Changed block identifier: "${oldBlockIdentifier}" → "${introStep.blocks[0].identifier}"`);
  fixedCount++;
}

// Ensure isFirstStep is set
introStep.isFirstStep = true;
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Made ${fixedCount} changes to prevent syncing`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');
console.log('   All Intro fields now have completely unique identifiers.');
console.log('   This should prevent CallVu from syncing content.');

