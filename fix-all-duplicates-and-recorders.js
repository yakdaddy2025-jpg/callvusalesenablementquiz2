/**
 * FIX ALL CRITICAL ISSUES:
 * 1. Fix duplicate "SmallHeading" and "LargeHeading" across 21 steps
 * 2. Convert all 14 inline JS voice recorders to iframes
 * 3. Fix email field type
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 FIXING ALL CRITICAL ISSUES...\n');

let fixedCount = 0;

// Fix 1: Make ALL integrationIDs unique (CRITICAL - fixes content syncing)
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  // Create safe prefix
  let prefix = stepName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  
  if (/^[0-9]/.test(prefix)) {
    prefix = 'Step_' + prefix;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.integrationID) {
                const currentId = field.integrationID;
                
                // If it's "SmallHeading" or "LargeHeading" without prefix, make it unique
                if (currentId === 'SmallHeading' || currentId === 'LargeHeading') {
                  const newId = `${prefix}_${currentId}`;
                  field.integrationID = newId;
                  console.log(`✅ "${stepName}": "${currentId}" → "${newId}"`);
                  fixedCount++;
                }
                // If it doesn't start with step prefix, make it unique
                else if (!currentId.startsWith(prefix + '_')) {
                  // Extract base name
                  let baseId = currentId;
                  // Remove any existing step prefixes
                  const commonPrefixes = ['Intro_', 'Rep_Info_', 'Roleplay_', 'Drill_', 'Quiz_', 'Check_', 'Scenario_', 'Exercise_Set_A_'];
                  commonPrefixes.forEach(p => {
                    if (baseId.startsWith(p)) {
                      baseId = baseId.substring(p.length);
                    }
                  });
                  
                  const newId = `${prefix}_${baseId}`;
                  field.integrationID = newId;
                  console.log(`✅ "${stepName}": "${currentId}" → "${newId}"`);
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

// Fix 2: Convert all inline JS voice recorders to iframes
const stepConfig = {
  'Roleplay 1': { questionId: 'Roleplay1', answerFieldId: 'Answer_Roleplay1' },
  'Roleplay 2': { questionId: 'Roleplay2', answerFieldId: 'Answer_Roleplay2' },
  'Roleplay 3': { questionId: 'Roleplay3', answerFieldId: 'Answer_Roleplay3' },
  'Roleplay 4': { questionId: 'Roleplay4', answerFieldId: 'Answer_Roleplay4' },
  'Roleplay 5': { questionId: 'Roleplay5', answerFieldId: 'Answer_Roleplay5' },
  'Roleplay 6': { questionId: 'Roleplay6', answerFieldId: 'Answer_Roleplay6' },
  'Roleplay 7': { questionId: 'Roleplay7', answerFieldId: 'Answer_Roleplay7' },
  'Drill A': { questionId: 'DrillA', answerFieldId: 'Answer_DrillA' },
  'Drill B': { questionId: 'DrillB', answerFieldId: 'Answer_DrillB' },
  'Quiz 2': { questionId: 'Quiz2', answerFieldId: 'Answer_Quiz2' },
  'Check 1': { questionId: 'Check1', answerFieldId: 'Answer_Check1' },
  'Check 2': { questionId: 'Check2', answerFieldId: 'Answer_Check2' },
  'Check 3': { questionId: 'Check3', answerFieldId: 'Answer_Check3' },
  'Check 4': { questionId: 'Check4', answerFieldId: 'Answer_Check4' }
};

const VERCEL_EMBED_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';
let recorderFixed = 0;

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName || '';
  const config = stepConfig[stepName];
  
  if (!config) return;
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Check if it's inline JS (has script tag)
                if (content.includes('<script>') && content.includes('webkitSpeechRecognition')) {
                  // Replace with iframe
                  const iframeUrl = `${VERCEL_EMBED_URL}?questionId=${encodeURIComponent(config.questionId)}&questionTitle=${encodeURIComponent(stepName)}&answerFieldId=${encodeURIComponent(config.answerFieldId)}`;
                  
                  field.editedParagraph = `<div style="width: 100%; min-height: 500px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <iframe 
    src="${iframeUrl}" 
    style="width: 100%; height: 600px; border: none; display: block; min-height: 500px;"
    allow="microphone"
    title="Voice Response Recorder"
    scrolling="no"
    frameborder="0"
  ></iframe>
</div>`;
                  
                  console.log(`✅ Converted voice recorder to iframe in "${stepName}"`);
                  recorderFixed++;
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

// Fix 3: Fix email field type
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'emailInput') {
                field.type = 'email';
                console.log(`✅ Fixed email type in "${step.stepName}"`);
                fixedCount++;
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
console.log(`   - Made integrationIDs unique: ${fixedCount - recorderFixed} fields`);
console.log(`   - Converted voice recorders: ${recorderFixed} iframes`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');
console.log('   This will fix ALL content syncing issues.');

