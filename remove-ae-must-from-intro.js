/**
 * Remove "AE must explain" content from Intro step
 * The Intro step should only have welcome/intro content
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Removing "AE must explain" content from Intro step...\n');

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.error('❌ Intro step not found!');
  process.exit(1);
}

let removedCount = 0;
let fixedCount = 0;

// Go through all fields in Intro step
introStep.blocks.forEach((block, blockIdx) => {
  if (block.rows) {
    block.rows.forEach((row, rowIdx) => {
      if (row.fields) {
        // Filter out any fields containing "AE must explain"
        const fieldsToKeep = [];
        row.fields.forEach((field, fieldIdx) => {
          if (field.type === 'paragraph' && field.editedParagraph) {
            const content = field.editedParagraph;
            
            // Check if this field contains "AE must explain"
            if (content.includes('AE must explain') || 
                content.includes('AE must') ||
                content.includes('FNOL in Mode A')) {
              console.log(`⚠️  Found "AE must explain" content in Intro step - removing field`);
              removedCount++;
              return; // Skip this field
            }
          }
          fieldsToKeep.push(field);
        });
        
        // Replace fields array with cleaned version
        if (fieldsToKeep.length !== row.fields.length) {
          row.fields = fieldsToKeep;
          fixedCount++;
        }
      }
    });
  }
});

// Ensure Intro step has correct content structure
// It should have: small heading, large heading, and intro paragraph
let hasSmallHeading = false;
let hasLargeHeading = false;
let hasIntroText = false;

introStep.blocks.forEach((block) => {
  if (block.rows) {
    block.rows.forEach((row) => {
      if (row.fields) {
        row.fields.forEach((field) => {
          if (field.type === 'paragraph' && field.editedParagraph) {
            const content = field.editedParagraph;
            if (content.includes('Sales Enablement Quiz - Mode A and B')) {
              hasSmallHeading = true;
            }
            if (content.includes('Welcome')) {
              hasLargeHeading = true;
            }
            if (content.includes('This assessment will test') || 
                content.includes('Instructions:')) {
              hasIntroText = true;
            }
          }
        });
      }
    });
  }
});

console.log(`\n✅ Removed ${removedCount} field(s) containing "AE must explain"`);
console.log(`✅ Fixed ${fixedCount} row(s)`);
console.log(`\n📋 Intro step content check:`);
console.log(`   - Small heading: ${hasSmallHeading ? '✅' : '❌'}`);
console.log(`   - Large heading (Welcome): ${hasLargeHeading ? '✅' : '❌'}`);
console.log(`   - Intro text: ${hasIntroText ? '✅' : '❌'}`);

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('\n✅ CVUF file updated');
console.log('\n💡 Next steps:');
console.log('   1. Re-import the CVUF file into CallVu');
console.log('   2. SAVE the form');
console.log('   3. PUBLISH the form again');
console.log('   4. Clear browser cache (Ctrl+Shift+Delete)');
console.log('   5. Test the Intro page - should only show Welcome content');

