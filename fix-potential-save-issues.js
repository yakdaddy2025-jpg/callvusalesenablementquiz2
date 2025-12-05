/**
 * Fix potential issues that could cause 400 error when saving
 * Since iframes aren't the issue, check for other problems
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Checking for issues that could prevent saving...\n');

let fixedCount = 0;
const issues = [];

// Check 1: Ensure all integrationIDs are valid (no special characters that might break)
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Check for invalid characters in integrationID
              if (field.integrationID) {
                // IntegrationIDs should not have spaces or special chars that might break
                const invalidChars = /[^a-zA-Z0-9_]/g;
                if (invalidChars.test(field.integrationID)) {
                  const oldId = field.integrationID;
                  field.integrationID = field.integrationID.replace(invalidChars, '_');
                  issues.push(`Fixed integrationID: "${oldId}" → "${field.integrationID}"`);
                  fixedCount++;
                }
              }
              
              // Check for invalid characters in identifier
              if (field.identifier) {
                const invalidChars = /[^a-zA-Z0-9_]/g;
                if (invalidChars.test(field.identifier)) {
                  const oldId = field.identifier;
                  field.identifier = field.identifier.replace(invalidChars, '_');
                  issues.push(`Fixed identifier: "${oldId}" → "${field.identifier}"`);
                  fixedCount++;
                }
              }
              
              // Ensure type is valid
              const validTypes = ['paragraph', 'shortText', 'longText', 'email', 'number', 'date', 'select', 'checkbox', 'radio'];
              if (field.type && !validTypes.includes(field.type)) {
                issues.push(`⚠️  Invalid field type: "${field.type}" in step "${step.stepName}"`);
              }
            });
          }
        });
      }
    });
  }
  
  // Check step identifier
  if (step.identifier) {
    const invalidChars = /[^a-zA-Z0-9_]/g;
    if (invalidChars.test(step.identifier)) {
      const oldId = step.identifier;
      step.identifier = step.identifier.replace(invalidChars, '_');
      issues.push(`Fixed step identifier: "${oldId}" → "${step.identifier}"`);
      fixedCount++;
    }
  }
});

// Check 2: Ensure targetStep references are valid
const stepIdentifiers = new Set(cvuf.form.steps.map(s => s.identifier).filter(Boolean));
cvuf.form.steps.forEach((step) => {
  if (step.buttonsConfig && step.buttonsConfig.targetStep) {
    if (!stepIdentifiers.has(step.buttonsConfig.targetStep)) {
      issues.push(`⚠️  Step "${step.stepName}" has invalid targetStep: "${step.buttonsConfig.targetStep}"`);
      // Don't fix automatically - might be intentional
    }
  }
});

// Check 3: Ensure no extremely long content
let longContentCount = 0;
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.editedParagraph && field.editedParagraph.length > 100000) {
                longContentCount++;
                issues.push(`⚠️  Very long content in step "${step.stepName}" (${field.editedParagraph.length} chars)`);
              }
            });
          }
        });
      }
    });
  }
});

// Check 4: Ensure all required step properties exist
cvuf.form.steps.forEach((step) => {
  if (!step.stepName) {
    issues.push(`❌ Step missing stepName`);
    step.stepName = `Step_${cvuf.form.steps.indexOf(step)}`;
    fixedCount++;
  }
  if (!step.identifier) {
    issues.push(`❌ Step "${step.stepName}" missing identifier`);
    step.identifier = `step_${step.stepName.toLowerCase().replace(/\s+/g, '_')}`;
    fixedCount++;
  }
});

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`✅ Fixed ${fixedCount} issue(s)`);
if (issues.length > 0) {
  console.log(`\n⚠️  Issues found:`);
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log(`\n✅ No obvious issues found`);
}

console.log('\n💡 The 400 error might be due to:');
console.log('   1. CallVu validation rules we don\'t know about');
console.log('   2. A specific field configuration CallVu doesn\'t accept');
console.log('   3. File size limits (though 154 KB seems reasonable)');
console.log('\n💡 Please check the Network tab Response body for the exact error!');

