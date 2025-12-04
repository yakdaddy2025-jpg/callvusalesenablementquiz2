/**
 * Switch from iframe to inline voice recorder
 * No Vercel needed - works directly in CallVu
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const inlineRecorderPath = path.join(__dirname, 'inline-voice-recorder.html');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));
const inlineRecorderHTML = fs.readFileSync(inlineRecorderPath, 'utf8');

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

// Steps that need voice recorders
const stepsNeedingVoiceRecorder = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B',
  'Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4',
  'Quiz 2',
  'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

// Create inline voice recorder HTML with proper placeholders
function createInlineVoiceRecorder(questionId, questionTitle, answerFieldId) {
  // Replace placeholders in the inline recorder HTML
  let html = inlineRecorderHTML;
  
  // Replace webhook URL
  html = html.replace(
    /const SHEET_WEBHOOK_URL = '[^']*';/,
    `const SHEET_WEBHOOK_URL = '${WEBHOOK_URL}';`
  );
  
  // Replace question placeholders
  html = html.replace(/const QUESTION_ID = '[^']*';/, `const QUESTION_ID = '${questionId}';`);
  html = html.replace(/const QUESTION_TITLE = '[^']*';/, `const QUESTION_TITLE = '${questionTitle}';`);
  html = html.replace(/const ANSWER_FIELD_ID = '[^']*';/, `const ANSWER_FIELD_ID = '${answerFieldId}';`);
  
  // Remove comments and clean up
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  return html;
}

let replacedCount = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            // Find answer field
            let answerFieldId = '';
            let answerFieldIndex = -1;
            
            row.fields.forEach((field, fieldIdx) => {
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
                answerFieldIndex = fieldIdx;
              }
            });
            
            if (answerFieldId) {
              const questionId = answerFieldId.replace('Answer_', '');
              const questionTitle = stepName;
              const inlineHTML = createInlineVoiceRecorder(questionId, questionTitle, answerFieldId);
              
              // Remove any existing voice recorder fields (iframe or inline)
              row.fields = row.fields.filter((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph;
                  const isVoiceRecorder = content.includes('<iframe') || 
                                         content.includes('voice-recorder-container') ||
                                         content.includes('Voice Response Recorder');
                  return !isVoiceRecorder;
                }
                return true;
              });
              
              // Re-find answer field index after filtering
              answerFieldIndex = row.fields.findIndex(f => f.integrationID === answerFieldId);
              
              // Add inline voice recorder right before answer field
              if (answerFieldIndex !== -1) {
                const voiceRecorderField = {
                  className: "",
                  clearable: false,
                  hint: "",
                  identifier: `voice_recorder_${questionId}_${Date.now()}`,
                  integrationID: "",
                  isHiddenInRuntime: false,
                  label: "",
                  maskingViewer: "none",
                  name: "editor.fields.paragraph",
                  permission: "both",
                  readOnly: false,
                  required: false,
                  tooltip: "",
                  type: "paragraph",
                  validations: [],
                  width: "full",
                  columnID: 0,
                  editedParagraph: inlineHTML,
                  localOnly: false
                };
                
                row.fields.splice(answerFieldIndex, 0, voiceRecorderField);
                replacedCount++;
                console.log(`✅ Replaced iframe with inline recorder in "${stepName}"`);
              }
            }
          }
        });
      }
    });
  }
});

console.log(`\n✅ Replaced ${replacedCount} iframe voice recorders with inline recorders`);
console.log('   - No Vercel needed - works directly in CallVu');
console.log('   - Uses browser Web Speech API');
console.log('   - Should work on mobile if CallVu allows script tags');

// Validate JSON
try {
  JSON.stringify(cvuf);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ File updated');

