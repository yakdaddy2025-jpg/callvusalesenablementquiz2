/**
 * REMOVE ALL duplicates and wrong content:
 * 1. Remove "YOUR TASK" from Intro step completely
 * 2. Remove duplicate "Your Information" from Rep Info
 * 3. Remove "Check 4" content from Roleplay 1
 * 4. Remove duplicate "YOUR TASK" fields
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Removing ALL duplicates and wrong content...\n');

let removedCount = 0;

// Fix 1: Remove "YOUR TASK" from Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');
if (introStep) {
  console.log('📋 Fixing Intro step...');
  if (introStep.blocks) {
    introStep.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            const originalLength = row.fields.length;
            row.fields = row.fields.filter((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph.toLowerCase();
                if (content.includes('your task') || 
                    (content.includes('voice recorder below') && !content.includes('welcome') && !content.includes('assessment'))) {
                  console.log('  ✅ Removed "YOUR TASK" from Intro');
                  removedCount++;
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
}

// Fix 2: Remove duplicate "Your Information" from Rep Info
const repInfoStep = cvuf.form.steps.find(step => step.stepName === 'Rep Info');
if (repInfoStep) {
  console.log('📋 Fixing Rep Info step...');
  let headingCount = 0;
  if (repInfoStep.blocks) {
    repInfoStep.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields = row.fields.filter((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph.toLowerCase();
                // Count "Your Information" headings
                if (content.includes('your information') && content.includes('h1')) {
                  headingCount++;
                  // Keep only the first one
                  if (headingCount > 1) {
                    console.log('  ✅ Removed duplicate "Your Information" heading');
                    removedCount++;
                    return false;
                  }
                }
                // Remove "YOUR TASK" from Rep Info
                if (content.includes('your task') || 
                    (content.includes('voice recorder below') && !content.includes('your information'))) {
                  console.log('  ✅ Removed "YOUR TASK" from Rep Info');
                  removedCount++;
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
}

// Fix 3: Remove "Check 4" content and duplicate "YOUR TASK" from Roleplay 1
const roleplay1Step = cvuf.form.steps.find(step => step.stepName === 'Roleplay 1');
if (roleplay1Step) {
  console.log('📋 Fixing Roleplay 1 step...');
  let taskCount = 0;
  if (roleplay1Step.blocks) {
    roleplay1Step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields = row.fields.filter((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph.toLowerCase();
                // Remove "Check 4" content
                if (content.includes('check 4')) {
                  console.log('  ✅ Removed "Check 4" content from Roleplay 1');
                  removedCount++;
                  return false;
                }
                // Count "YOUR TASK" fields - keep only one
                if (content.includes('your task') && content.includes('voice recorder below')) {
                  taskCount++;
                  if (taskCount > 1) {
                    console.log('  ✅ Removed duplicate "YOUR TASK" from Roleplay 1');
                    removedCount++;
                    return false;
                  }
                }
              }
              return true;
            });
          }
        });
      }
    });
  }
}

// Fix 4: Remove duplicate "YOUR TASK" from ALL roleplay steps
for (let i = 1; i <= 7; i++) {
  const roleplayStep = cvuf.form.steps.find(step => step.stepName === `Roleplay ${i}`);
  if (roleplayStep) {
    let taskCount = 0;
    if (roleplayStep.blocks) {
      roleplayStep.blocks.forEach((block) => {
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields = row.fields.filter((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph.toLowerCase();
                  if (content.includes('your task') && content.includes('voice recorder below')) {
                    taskCount++;
                    if (taskCount > 1) {
                      removedCount++;
                      return false;
                    }
                  }
                }
                return true;
              });
            }
          });
        }
      });
    }
  }
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Removed ${removedCount} duplicate/wrong field(s)`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');

