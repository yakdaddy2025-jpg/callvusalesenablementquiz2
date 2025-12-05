/**
 * CRITICAL: Disable Next buttons in CVUF for all steps with voice recorders
 * This is the proper way - set it in the CVUF structure itself
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_COMPLETE_1764923674682.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_NEXT_DISABLED_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Disabling Next buttons in CVUF for all steps with voice recorders...\n');

let disabledCount = 0;

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  
  // Check if this step has a voice recorder
  let hasRecorder = false;
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        if (field.type === 'paragraph' && 
            field.editedParagraph && 
            field.editedParagraph.includes('iframe') &&
            field.editedParagraph.includes('callvusalesenablementquiz2.vercel.app')) {
          hasRecorder = true;
        }
      });
    });
  });
  
  // If step has recorder, DISABLE Next button in CVUF
  if (hasRecorder) {
    if (!step.buttonsConfig) {
      step.buttonsConfig = {};
    }
    if (!step.buttonsConfig.next) {
      step.buttonsConfig.next = {};
    }
    
    // FORCE disable Next button
    step.buttonsConfig.next.className = 'disabled';
    step.buttonsConfig.next.disabled = true;
    step.buttonsConfig.next.isHidden = false;
    
    // Also ensure it has text
    if (!step.buttonsConfig.next.text) {
      step.buttonsConfig.next.text = 'Next';
    }
    
    disabledCount++;
    console.log(`   ✅ Disabled Next button in CVUF for: ${stepName}`);
  }
});

console.log(`\n✅ Disabled Next buttons in CVUF for ${disabledCount} steps with voice recorders`);
console.log(`\n⚠️  NOTE: The JavaScript blocker is still needed as a backup`);
console.log(`   CallVu may re-enable buttons based on form validation`);
console.log(`   The JavaScript ensures they stay disabled until "Keep Response" is clicked`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

