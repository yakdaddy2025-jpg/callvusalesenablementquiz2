/**
 * COMPREHENSIVE FIX for all issues:
 * 1. Remove duplicate "task" content from Step 2 (Rep Info)
 * 2. Ensure voice recorders are properly configured for mobile
 * 3. Remove all duplicate fields
 * 4. Fix content syncing issues
 * 5. Ensure proper step order and configuration
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 COMPREHENSIVE FIX - Addressing all issues...\n');

let totalFixed = 0;

// Fix 1: Ensure Intro is first and correct
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');
if (introStep) {
  const introIndex = cvuf.form.steps.findIndex(step => step.stepName === 'Intro');
  if (introIndex !== 0) {
    cvuf.form.steps.splice(introIndex, 1);
    cvuf.form.steps.unshift(introStep);
    console.log('✅ Moved Intro to first position');
    totalFixed++;
  }
  
  introStep.isFirstStep = true;
  if (introStep.buttonsConfig) {
    introStep.buttonsConfig.isFirstNode = true;
  }
  
  // Remove any "Check 4" or "YOUR TASK" content from Intro
  introStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          const originalLength = row.fields.length;
          row.fields = row.fields.filter((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph;
              if (content.includes('Check 4') || 
                  (content.includes('YOUR TASK') && !content.includes('Welcome'))) {
                return false;
              }
            }
            return true;
          });
          if (row.fields.length !== originalLength) {
            totalFixed++;
          }
        }
      });
    }
  });
}

// Fix 2: Fix Rep Info step (Step 2) - remove duplicate "task" content
const repInfoStep = cvuf.form.steps.find(step => step.stepName === 'Rep Info');
if (repInfoStep) {
  console.log('\n📋 Fixing Rep Info step...');
  
  let duplicateCount = 0;
  repInfoStep.blocks.forEach((block) => {
    if (block.rows) {
      block.rows.forEach((row) => {
        if (row.fields) {
          // Find and remove duplicate "task" fields
          const taskFields = [];
          const otherFields = [];
          
          row.fields.forEach((field) => {
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph.toLowerCase();
              if (content.includes('your task') || content.includes('task:')) {
                taskFields.push(field);
              } else {
                otherFields.push(field);
              }
            } else {
              otherFields.push(field);
            }
          });
          
          // Keep only ONE task field (the first one), remove duplicates
          if (taskFields.length > 1) {
            console.log(`   ⚠️  Found ${taskFields.length} duplicate "task" fields - removing ${taskFields.length - 1}`);
            duplicateCount += taskFields.length - 1;
            // Keep first, remove rest
            row.fields = [taskFields[0], ...otherFields];
            totalFixed++;
          } else {
            row.fields = [...taskFields, ...otherFields];
          }
        }
      });
    }
  });
  
  console.log(`   ✅ Removed ${duplicateCount} duplicate "task" field(s) from Rep Info`);
}

// Fix 3: Ensure all voice recorder iframes are mobile-responsive
console.log('\n📱 Fixing voice recorder iframes for mobile...');
let iframeFixed = 0;

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
                  // Check if it has mobile-responsive styles
                  if (!content.includes('min-height') || !content.includes('width: 100%')) {
                    // Replace with mobile-responsive iframe
                    const iframeMatch = content.match(/<iframe[^>]*src="([^"]*)"[^>]*>/);
                    if (iframeMatch) {
                      const iframeUrl = iframeMatch[1];
                      field.editedParagraph = `<div style="width: 100%; min-height: 500px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; position: relative;">
  <iframe 
    src="${iframeUrl}" 
    style="width: 100%; height: 600px; border: none; display: block; min-height: 500px;"
    allow="microphone"
    title="Voice Response Recorder"
    scrolling="no"
    frameborder="0"
  ></iframe>
</div>
<style>
  @media (max-width: 768px) {
    iframe {
      height: 700px !important;
      min-height: 700px !important;
    }
  }
</style>`;
                      iframeFixed++;
                      totalFixed++;
                    }
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

console.log(`   ✅ Fixed ${iframeFixed} voice recorder iframe(s) for mobile`);

// Fix 4: Remove duplicate fields across all steps
console.log('\n🔍 Checking for duplicate fields...');
let duplicateFieldsRemoved = 0;

cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields && row.fields.length > 1) {
            // Check for duplicate identifiers
            const seenIdentifiers = new Set();
            const uniqueFields = [];
            
            row.fields.forEach((field) => {
              if (field.identifier) {
                if (seenIdentifiers.has(field.identifier)) {
                  duplicateFieldsRemoved++;
                  return; // Skip duplicate
                }
                seenIdentifiers.add(field.identifier);
              }
              uniqueFields.push(field);
            });
            
            if (uniqueFields.length !== row.fields.length) {
              row.fields = uniqueFields;
              totalFixed++;
            }
          }
        });
      }
    });
  }
});

console.log(`   ✅ Removed ${duplicateFieldsRemoved} duplicate field(s)`);

// Fix 5: Ensure all integrationIDs are unique per step
console.log('\n🔑 Making all integrationIDs unique per step...');
let integrationIDsFixed = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  const stepPrefix = stepName.replace(/\s+/g, '_');
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.integrationID && !field.integrationID.startsWith(stepPrefix)) {
                const oldId = field.integrationID;
                field.integrationID = `${stepPrefix}_${field.integrationID}`;
                integrationIDsFixed++;
                totalFixed++;
              }
            });
          }
        });
      }
    });
  }
});

console.log(`   ✅ Made ${integrationIDsFixed} integrationID(s) unique`);

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ COMPREHENSIVE FIX COMPLETE!`);
console.log(`   Total fixes applied: ${totalFixed}`);
console.log(`\n💡 CRITICAL NEXT STEPS:`);
console.log(`   1. DELETE ALL existing forms in CallVu Studio`);
console.log(`   2. Re-import the CVUF file: Sales_Enablement_Quiz_EDITABLE.cvuf`);
console.log(`   3. SAVE the form`);
console.log(`   4. PUBLISH the form`);
console.log(`   5. Clear browser cache COMPLETELY (Ctrl+Shift+Delete)`);
console.log(`   6. Test on BOTH desktop AND mobile`);
console.log(`\n⚠️  IMPORTANT: Delete old forms first to avoid caching issues!`);

