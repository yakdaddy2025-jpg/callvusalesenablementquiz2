/**
 * Fix Intro step showing wrong content (Check 4 content appearing)
 * Ensure Intro is properly configured as first step
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Fixing Intro step to ensure it shows correct content...\n');

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');
const check4Step = cvuf.form.steps.find(step => step.stepName === 'Check 4');

if (!introStep) {
  console.error('❌ Intro step not found!');
  process.exit(1);
}

// Ensure Intro is the FIRST step in the array
const introIndex = cvuf.form.steps.findIndex(step => step.stepName === 'Intro');
if (introIndex !== 0) {
  console.log(`⚠️  Intro step is at index ${introIndex}, moving to index 0...`);
  // Remove from current position
  cvuf.form.steps.splice(introIndex, 1);
  // Add to beginning
  cvuf.form.steps.unshift(introStep);
  console.log('✅ Moved Intro step to first position');
}

// Ensure Intro step configuration
introStep.isFirstStep = true;
introStep.isLastStep = false;

if (!introStep.buttonsConfig) {
  introStep.buttonsConfig = {};
}
introStep.buttonsConfig.isFirstNode = true;

// Ensure Intro step has correct identifier
introStep.identifier = 'step_intro';

// Make sure NO other step has isFirstStep = true
cvuf.form.steps.forEach((step, idx) => {
  if (step.stepName !== 'Intro' && step.isFirstStep) {
    console.log(`⚠️  Step "${step.stepName}" also has isFirstStep=true - removing`);
    step.isFirstStep = false;
  }
  if (step.stepName !== 'Intro' && step.buttonsConfig && step.buttonsConfig.isFirstNode) {
    console.log(`⚠️  Step "${step.stepName}" also has isFirstNode=true - removing`);
    step.buttonsConfig.isFirstNode = false;
  }
});

// Verify Intro step content
console.log('\n📋 Intro step content check:');
let hasWelcome = false;
let hasCheck4 = false;

introStep.blocks.forEach((block) => {
  if (block.rows) {
    block.rows.forEach((row) => {
      if (row.fields) {
        row.fields.forEach((field) => {
          if (field.type === 'paragraph' && field.editedParagraph) {
            const content = field.editedParagraph;
            if (content.includes('Welcome')) {
              hasWelcome = true;
            }
            if (content.includes('Check 4') || content.includes('YOUR TASK')) {
              hasCheck4 = true;
              console.log(`❌ Found "Check 4" or "YOUR TASK" content in Intro step!`);
            }
          }
        });
      }
    });
  }
});

console.log(`   - Has Welcome: ${hasWelcome ? '✅' : '❌'}`);
console.log(`   - Has Check 4 content: ${hasCheck4 ? '❌ REMOVE THIS' : '✅'}`);

if (hasCheck4) {
  console.log('\n⚠️  Removing Check 4 content from Intro step...');
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph;
              if (content.includes('Check 4') || 
                  (content.includes('YOUR TASK') && !content.includes('Welcome'))) {
                console.log('   - Removed field with Check 4/YOUR TASK content');
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
console.log('\n✅ CVUF file updated');
console.log('\n💡 Next steps:');
console.log('   1. DELETE the current form in CallVu Studio');
console.log('   2. Re-import the CVUF file');
console.log('   3. SAVE the form');
console.log('   4. PUBLISH the form');
console.log('   5. Clear browser cache completely');
console.log('   6. Test - Intro should show Welcome content, not Check 4');

