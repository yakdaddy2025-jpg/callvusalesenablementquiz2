/**
 * Fix Intro step and ensure Next button is blocked until response saved
 * 1. Remove voice recorder from Intro step
 * 2. Ensure Next button blocker works on all steps
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_FIXED_ALL_1764921950565.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_FINAL_FIX_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Fixing Intro step and Next button blocking...\n');

let removedFromIntro = 0;

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  
  // Remove voice recorder from Intro step
  if (stepName === 'Intro') {
    step.blocks?.forEach((block) => {
      block.rows?.forEach((row) => {
        if (row.fields) {
          const beforeCount = row.fields.length;
          row.fields = row.fields.filter(field => {
            // Remove voice recorder iframes
            if (field.type === 'paragraph' && 
                field.editedParagraph && 
                (field.editedParagraph.includes('iframe') || 
                 field.editedParagraph.includes('voice') ||
                 field.editedParagraph.includes('recorder'))) {
              removedFromIntro++;
              return false;
            }
            return true;
          });
        }
      });
    });
  }
  
  // Ensure Next button is disabled by default on steps with voice recorders
  if (stepName.startsWith('Roleplay') || 
      stepName.startsWith('Drill') || 
      stepName.startsWith('Scenario') ||
      stepName.startsWith('Check') ||
      stepName === 'Quiz 2') {
    
    // Check if this step has a voice recorder
    let hasRecorder = false;
    step.blocks?.forEach((block) => {
      block.rows?.forEach((row) => {
        row.fields?.forEach((field) => {
          if (field.type === 'paragraph' && 
              field.editedParagraph && 
              field.editedParagraph.includes('iframe')) {
            hasRecorder = true;
          }
        });
      });
    });
    
    // If it has a recorder, ensure Next button is disabled
    if (hasRecorder && step.buttonsConfig?.next) {
      step.buttonsConfig.next.className = 'disabled';
      step.buttonsConfig.next.isHidden = false;
      console.log(`   ✅ Disabled Next button on ${stepName}`);
    }
  }
});

console.log(`\n✅ Removed ${removedFromIntro} voice recorder(s) from Intro step`);
console.log(`✅ Next buttons disabled on steps with voice recorders`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

