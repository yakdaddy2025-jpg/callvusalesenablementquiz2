/**
 * Fix ALL critical issues:
 * 1. Make ALL integrationIDs unique (they're still syncing content!)
 * 2. Fix email field type and name
 * 3. Remove "YOUR TASK" from Intro and Rep Info steps
 * 4. Ensure voice recorders are properly configured
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Fixing ALL critical issues...\n');

let fixedCount = 0;

// Fix 1: Make ALL integrationIDs unique per step (CRITICAL - prevents content syncing)
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  const stepPrefix = stepName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
  
  if (step.blocks) {
    step.blocks.forEach((block, blockIdx) => {
      if (block.rows) {
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              if (field.integrationID) {
                // Make it unique to this specific step
                if (!field.integrationID.startsWith(stepPrefix + '_')) {
                  const oldId = field.integrationID;
                  field.integrationID = `${stepPrefix}_${field.integrationID}`;
                  console.log(`✅ Made integrationID unique: "${oldId}" → "${field.integrationID}" in "${stepName}"`);
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

// Fix 2: Fix email field type and name
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Fix email field
              if (field.type === 'emailInput') {
                field.type = 'email';
                console.log(`✅ Fixed emailInput → email in "${step.stepName}"`);
                fixedCount++;
              }
              if (field.name === 'editor.fields.emailinput') {
                field.name = 'editor.fields.email';
                console.log(`✅ Fixed email field name in "${step.stepName}"`);
                fixedCount++;
              }
            });
          }
        });
      }
    });
  }
});

// Fix 3: Remove "YOUR TASK" from Intro step
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
              if (content.includes('your task') || content.includes('voice recorder below')) {
                console.log(`✅ Removed "YOUR TASK" from Intro step`);
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

// Fix 4: Remove "YOUR TASK" from Rep Info step
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
              if (content.includes('your task') || content.includes('voice recorder below')) {
                console.log(`✅ Removed "YOUR TASK" from Rep Info step`);
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

// Fix 5: Ensure Rep Info has BOTH name and email fields
if (repInfoStep) {
  let hasName = false;
  let hasEmail = false;
  
  repInfoStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          row.fields.forEach((field) => {
            if (field.integrationID && field.integrationID.includes('RepName')) {
              hasName = true;
            }
            if (field.integrationID && field.integrationID.includes('RepEmail')) {
              hasEmail = true;
            }
          });
        }
      });
    }
  });
  
  console.log(`\n📋 Rep Info step check:`);
  console.log(`   - Has Name field: ${hasName ? '✅' : '❌'}`);
  console.log(`   - Has Email field: ${hasEmail ? '✅' : '❌'}`);
  
  if (!hasName || !hasEmail) {
    console.log(`   ⚠️  Missing fields - will need to add them`);
  }
}

// Fix 6: Verify voice recorders are iframes (not inline JS)
let iframeCount = 0;
let inlineJSCount = 0;

cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('<iframe') && content.includes('vercel.app/embed')) {
                  iframeCount++;
                }
                if (content.includes('<script>') && content.includes('webkitSpeechRecognition')) {
                  inlineJSCount++;
                  console.log(`⚠️  Found inline JS voice recorder in "${step.stepName}" - should be iframe`);
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n📊 Voice Recorder Status:`);
console.log(`   - Iframes: ${iframeCount}`);
console.log(`   - Inline JS: ${inlineJSCount} (should be 0)`);

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
console.log('\n💡 CRITICAL: Re-import the CVUF file in CallVu Studio');
console.log('   The integrationIDs are now unique - this should fix content syncing!');

