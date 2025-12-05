/**
 * Verify Intro step is completely correct and has NO "YOUR TASK" content
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔍 VERIFYING Intro step...\n');

const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.log('❌ Intro step not found!');
  process.exit(1);
}

console.log('✅ Intro step found\n');

// Check all fields
let fieldCount = 0;
let taskFields = 0;
let welcomeFields = 0;

if (introStep.blocks) {
  introStep.blocks.forEach((block, blockIdx) => {
    if (block.rows) {
      block.rows.forEach((row, rowIdx) => {
        if (row.fields) {
          row.fields.forEach((field, fieldIdx) => {
            fieldCount++;
            
            console.log(`\nField ${fieldCount}:`);
            console.log(`  - Type: ${field.type}`);
            console.log(`  - Identifier: ${field.identifier}`);
            console.log(`  - IntegrationID: ${field.integrationID || '(empty)'}`);
            
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph;
              const lowerContent = content.toLowerCase();
              
              if (lowerContent.includes('your task')) {
                taskFields++;
                console.log(`  ❌ CONTAINS "YOUR TASK"!`);
                console.log(`  Content: ${content.substring(0, 100)}...`);
              }
              
              if (lowerContent.includes('welcome')) {
                welcomeFields++;
                console.log(`  ✅ Contains "Welcome"`);
              }
              
              if (lowerContent.includes('voice recorder below') && !lowerContent.includes('welcome')) {
                console.log(`  ⚠️  Contains "voice recorder below" (might be problematic)`);
              }
            }
          });
        }
      });
    }
  });
}

console.log(`\n📊 Summary:`);
console.log(`   - Total fields: ${fieldCount}`);
console.log(`   - "Welcome" fields: ${welcomeFields} (should be 1)`);
console.log(`   - "YOUR TASK" fields: ${taskFields} (should be 0)`);

if (taskFields > 0) {
  console.log(`\n❌ PROBLEM: Intro step contains "YOUR TASK" content!`);
  console.log(`   This needs to be removed.`);
} else {
  console.log(`\n✅ Intro step is correct - no "YOUR TASK" content`);
  console.log(`\n💡 If preview still shows "YOUR TASK", CallVu is syncing from another step.`);
  console.log(`   Solution: Delete form completely and re-import.`);
}

