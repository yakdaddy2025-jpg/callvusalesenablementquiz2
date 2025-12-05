/**
 * COMPLETELY ISOLATE Intro step structure
 * Make it structurally different from all other steps to prevent ANY syncing
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Completely isolating Intro step structure...\n');

let fixedCount = 0;

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.log('❌ Intro step not found!');
  process.exit(1);
}

// Make Intro step structure completely unique
// 1. Change all field identifiers to be completely different
if (introStep.blocks) {
  introStep.blocks.forEach((block, blockIdx) => {
    if (block.rows) {
      block.rows.forEach((row, rowIdx) => {
        if (row.fields) {
          row.fields.forEach((field, fieldIdx) => {
            // Make identifier completely unique with timestamp
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            field.identifier = `intro_isolated_${timestamp}_${random}_${fieldIdx}`;
            
            // Make integrationID completely unique
            if (field.integrationID) {
              field.integrationID = `Intro_Isolated_${timestamp}_${random}_${fieldIdx}`;
            } else {
              field.integrationID = `Intro_Isolated_${timestamp}_${random}_${fieldIdx}`;
            }
            
            // Add unique className
            field.className = `intro-isolated-${timestamp}-${fieldIdx}`;
            
            fixedCount++;
          });
        }
      });
    }
    
    // Make block identifier unique
    const timestamp = Date.now();
    block.identifier = `block_intro_isolated_${timestamp}`;
    fixedCount++;
  });
}

// 2. Make step identifier completely unique
const timestamp = Date.now();
introStep.identifier = `step_intro_isolated_${timestamp}`;
fixedCount++;

// 3. Ensure isFirstStep is set
introStep.isFirstStep = true;
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
}

// 4. Verify Intro has NO "YOUR TASK" content
if (introStep.blocks) {
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task') || 
                  (content.includes('voice recorder below') && !content.includes('welcome') && !content.includes('assessment'))) {
                console.log('✅ Removed "YOUR TASK" from Intro');
                fixedCount++;
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

console.log(`\n✅ Made ${fixedCount} changes to completely isolate Intro step`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');
console.log('   Intro step is now completely isolated with unique structure.');

