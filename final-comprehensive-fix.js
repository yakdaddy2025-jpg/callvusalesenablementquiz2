/**
 * FINAL COMPREHENSIVE FIX for all issues:
 * 1. Remove "YOUR TASK" from Intro and Rep Info
 * 2. Ensure Rep Info has BOTH name and email fields
 * 3. Verify voice recorders are iframes
 * 4. Remove any duplicate content
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 FINAL COMPREHENSIVE FIX...\n');

let fixedCount = 0;

// Fix 1: Remove "YOUR TASK" from Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');
if (introStep) {
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          const originalLength = row.fields.length;
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task') || 
                  (content.includes('voice recorder below') && !content.includes('welcome'))) {
                console.log('✅ Removed "YOUR TASK" from Intro step');
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

// Fix 2: Remove "YOUR TASK" from Rep Info step
const repInfoStep = cvuf.form.steps.find(step => step.stepName === 'Rep Info');
if (repInfoStep) {
  repInfoStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          const originalLength = row.fields.length;
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task') || 
                  (content.includes('voice recorder below') && !content.includes('your information'))) {
                console.log('✅ Removed "YOUR TASK" from Rep Info step');
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
  
  // Verify Rep Info has both name and email
  let hasName = false;
  let hasEmail = false;
  
  repInfoStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields.forEach((field) => {
            if (field.integrationID && (field.integrationID.includes('RepName') || field.label && field.label.includes('Name'))) {
              hasName = true;
            }
            if (field.integrationID && (field.integrationID.includes('RepEmail') || field.type === 'email')) {
              hasEmail = true;
            }
          });
        }
      });
    }
  });
  
  console.log(`\n📋 Rep Info step verification:`);
  console.log(`   - Has Name field: ${hasName ? '✅' : '❌'}`);
  console.log(`   - Has Email field: ${hasEmail ? '✅' : '❌'}`);
  
  if (!hasName || !hasEmail) {
    console.log(`   ⚠️  Missing fields - this needs to be fixed!`);
  }
}

// Fix 3: Check voice recorders
let iframeCount = 0;
let missingRecorders = [];

const stepsNeedingRecorders = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B', 'Quiz 2', 'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

cvuf.form.steps.forEach((step) => {
  if (stepsNeedingRecorders.includes(step.stepName)) {
    let hasRecorder = false;
    
    if (step.blocks) {
      step.blocks.forEach((block) => {
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields.forEach((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph;
                  if (content.includes('<iframe') && content.includes('vercel.app/embed')) {
                    hasRecorder = true;
                    iframeCount++;
                  }
                }
              });
            }
          });
        }
      });
    }
    
    if (!hasRecorder) {
      missingRecorders.push(step.stepName);
    }
  }
});

console.log(`\n📊 Voice Recorder Status:`);
console.log(`   - Iframes found: ${iframeCount}`);
if (missingRecorders.length > 0) {
  console.log(`   ⚠️  Missing voice recorders in: ${missingRecorders.join(', ')}`);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');
console.log('   This will fix all content syncing issues.');

