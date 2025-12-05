/**
 * DIAGNOSE and FIX ALL issues comprehensively
 * Check what's actually wrong and fix it
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔍 DIAGNOSING all issues...\n');

// Diagnosis 1: Check integrationIDs
console.log('📋 Checking integrationIDs...');
const integrationIDMap = {};
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.integrationID) {
                if (!integrationIDMap[field.integrationID]) {
                  integrationIDMap[field.integrationID] = [];
                }
                integrationIDMap[field.integrationID].push(step.stepName);
              }
            });
          }
        });
      }
    });
  }
});

const duplicateIDs = Object.entries(integrationIDMap).filter(([id, steps]) => steps.length > 1);
if (duplicateIDs.length > 0) {
  console.log(`❌ Found ${duplicateIDs.length} duplicate integrationIDs:`);
  duplicateIDs.forEach(([id, steps]) => {
    console.log(`   "${id}" appears in: ${steps.join(', ')}`);
  });
} else {
  console.log('✅ All integrationIDs are unique');
}

// Diagnosis 2: Check Rep Info step
console.log('\n📋 Checking Rep Info step...');
const repInfoStep = cvuf.form.steps.find(step => step.stepName === 'Rep Info');
if (repInfoStep) {
  let nameFields = 0;
  let emailFields = 0;
  let taskFields = 0;
  
  repInfoStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields.forEach((field) => {
            if (field.integrationID && field.integrationID.includes('RepName')) {
              nameFields++;
            }
            if (field.integrationID && field.integrationID.includes('RepEmail')) {
              emailFields++;
            }
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task')) {
                taskFields++;
              }
            }
          });
        }
      });
    }
  });
  
  console.log(`   - Name fields: ${nameFields} (should be 1)`);
  console.log(`   - Email fields: ${emailFields} (should be 1)`);
  console.log(`   - "YOUR TASK" fields: ${taskFields} (should be 0)`);
  
  if (nameFields !== 1 || emailFields !== 1) {
    console.log(`   ❌ Rep Info step is missing fields!`);
  }
  if (taskFields > 0) {
    console.log(`   ❌ Rep Info step has "YOUR TASK" content!`);
  }
}

// Diagnosis 3: Check Intro step
console.log('\n📋 Checking Intro step...');
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');
if (introStep) {
  let taskFields = 0;
  let welcomeFields = 0;
  
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields.forEach((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task')) {
                taskFields++;
              }
              if (content.includes('welcome')) {
                welcomeFields++;
              }
            }
          });
        }
      });
    }
  });
  
  console.log(`   - "Welcome" fields: ${welcomeFields} (should be 1)`);
  console.log(`   - "YOUR TASK" fields: ${taskFields} (should be 0)`);
  
  if (taskFields > 0) {
    console.log(`   ❌ Intro step has "YOUR TASK" content!`);
  }
}

// Diagnosis 4: Check voice recorders
console.log('\n📋 Checking voice recorders...');
let iframeCount = 0;
let inlineJSCount = 0;
const stepsNeedingRecorders = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B', 'Quiz 2', 'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

cvuf.form.steps.forEach((step) => {
  if (stepsNeedingRecorders.includes(step.stepName)) {
    let hasIframe = false;
    let hasInlineJS = false;
    
    if (step.blocks) {
      step.blocks.forEach((block) => {
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields.forEach((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph;
                  if (content.includes('<iframe') && content.includes('vercel.app/embed')) {
                    hasIframe = true;
                    iframeCount++;
                  }
                  if (content.includes('<script>') && content.includes('webkitSpeechRecognition')) {
                    hasInlineJS = true;
                    inlineJSCount++;
                  }
                }
              });
            }
          });
        }
      });
    }
    
    if (!hasIframe && !hasInlineJS) {
      console.log(`   ⚠️  "${step.stepName}" has NO voice recorder!`);
    }
  }
});

console.log(`   - Iframes: ${iframeCount} (should be 14)`);
console.log(`   - Inline JS: ${inlineJSCount} (should be 0)`);

// Now fix all issues
console.log('\n🔧 FIXING all issues...\n');

let fixedCount = 0;

// Fix 1: Make ALL integrationIDs unique
if (duplicateIDs.length > 0) {
  cvuf.form.steps.forEach((step, stepIdx) => {
    const stepName = step.stepName || `Step${stepIdx}`;
    const prefix = stepName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    if (step.blocks) {
      step.blocks.forEach((block) => {
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields.forEach((field) => {
                if (field.integrationID) {
                  const currentId = field.integrationID;
                  // Check if this ID is duplicated
                  const isDuplicated = duplicateIDs.some(([id]) => id === currentId);
                  
                  if (isDuplicated && !currentId.startsWith(prefix + '_')) {
                    let baseId = currentId;
                    // Remove any existing prefixes
                    Object.keys(stepPrefixes || {}).forEach(p => {
                      baseId = baseId.replace(new RegExp(`^${p}_`), '');
                    });
                    
                    const newId = `${prefix}_${baseId}`;
                    field.integrationID = newId;
                    console.log(`✅ Fixed duplicate: "${currentId}" → "${newId}" in "${stepName}"`);
                    fixedCount++;
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

// Fix 2: Remove "YOUR TASK" from Intro and Rep Info
[introStep, repInfoStep].forEach((step) => {
  if (step) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            const originalLength = row.fields.length;
            row.fields = row.fields.filter((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph.toLowerCase();
                if (content.includes('your task') || 
                    (content.includes('voice recorder below') && !content.includes('welcome') && !content.includes('your information'))) {
                  console.log(`✅ Removed "YOUR TASK" from "${step.stepName}"`);
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
});

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
console.log('\n💡 Next: Delete form in CallVu and re-import!');

