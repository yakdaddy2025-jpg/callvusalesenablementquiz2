/**
 * FIX: Remove tooltips that are showing as labels
 * Also ensure buttons are properly configured
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Fixing tooltips and button configuration...\n');

let fixedCount = 0;

// Process ALL steps
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  
  // Fix button configuration
  if (step.buttonsConfig) {
    // Ensure next button is enabled
    if (step.buttonsConfig.next) {
      if (step.buttonsConfig.next.isHidden === true) {
        step.buttonsConfig.next.isHidden = false;
        console.log(`✅ Enabled next button in "${stepName}"`);
        fixedCount++;
      }
      // Ensure button text is set
      if (!step.buttonsConfig.next.text || step.buttonsConfig.next.text === '') {
        if (stepName === 'Intro') {
          step.buttonsConfig.next.text = 'Begin Quiz';
        } else if (stepName === 'Complete') {
          step.buttonsConfig.next.text = 'Complete';
        } else {
          step.buttonsConfig.next.text = 'Continue';
        }
        console.log(`✅ Set next button text in "${stepName}"`);
        fixedCount++;
      }
    }
  }
  
  // Remove tooltips that might be showing as labels
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Clear tooltip if it contains timestamp (our generated tooltip)
              if (field.tooltip && (field.tooltip.includes('176491') || field.tooltip.includes('field 0') || field.tooltip.includes('field 1') || field.tooltip.includes('field 2'))) {
                field.tooltip = '';
                console.log(`✅ Removed tooltip from field in "${stepName}"`);
                fixedCount++;
              }
              
              // Ensure label is set correctly for input fields
              if (field.type === 'shortText' || field.type === 'email') {
                if (!field.label || field.label === '') {
                  if (field.integrationID && field.integrationID.includes('RepName')) {
                    field.label = 'Your Full Name';
                    console.log(`✅ Set label for name field in "${stepName}"`);
                    fixedCount++;
                  } else if (field.integrationID && field.integrationID.includes('RepEmail')) {
                    field.label = 'Email Address';
                    console.log(`✅ Set label for email field in "${stepName}"`);
                    fixedCount++;
                  }
                }
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

console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
console.log('\n💡 Tooltips removed and buttons configured correctly.');

