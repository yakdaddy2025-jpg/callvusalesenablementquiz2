/**
 * Fix two issues:
 * 1. "Check 4" appearing on wrong screens - ensure each step has correct title
 * 2. Voice recorder missing on screens - ensure all speech-to-text screens have voice recorder
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Get inline voice recorder HTML
function getInlineVoiceRecorder(questionId, questionTitle, answerFieldId) {
  const htmlPath = path.join(__dirname, 'inline-voice-recorder.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('inline-voice-recorder.html not found');
    return '';
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  return html
    .replace(/QUESTION_ID_PLACEHOLDER/g, questionId)
    .replace(/QUESTION_TITLE_PLACEHOLDER/g, questionTitle)
    .replace(/ANSWER_FIELD_ID_PLACEHOLDER/g, answerFieldId)
    .replace(/PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE/g, 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec');
}

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

let fixedTitles = 0;
let fixedVoiceRecorders = 0;
let missingVoiceRecorders = [];

// Map of step names to their correct titles
const stepTitleMap = {
  'Intro': 'Welcome',
  'Rep Info': 'Your Information',
  'Roleplay 1': 'Roleplay 1',
  'Roleplay 2': 'Roleplay 2',
  'Roleplay 3': 'Roleplay 3',
  'Roleplay 4': 'Roleplay 4',
  'Roleplay 5': 'Roleplay 5',
  'Roleplay 6': 'Roleplay 6',
  'Roleplay 7': 'Roleplay 7',
  'Drill A': 'Drill A',
  'Drill B': 'Drill B',
  'Drill C': 'Drill C',
  'Exercise Set A': 'Exercise Set A',
  'Scenario 1': 'Scenario 1',
  'Scenario 2': 'Scenario 2',
  'Scenario 3': 'Scenario 3',
  'Scenario 4': 'Scenario 4',
  'Quiz 1': 'Quiz 1',
  'Quiz 2': 'Quiz 2',
  'Check 1': 'Check 1',
  'Check 2': 'Check 2',
  'Check 3': 'Check 3',
  'Check 4': 'Check 4',
  'Complete': 'Complete'
};

// Steps that need voice recorders
const stepsNeedingVoiceRecorder = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B',
  'Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4',
  'Quiz 2',
  'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  const correctTitle = stepTitleMap[stepName] || stepName;
  
  // Fix step text property
  if (step.text !== correctTitle) {
    step.text = correctTitle;
    fixedTitles++;
    console.log(`Fixed step text: "${stepName}" -> "${correctTitle}"`);
  }
  
  // Fix titles in paragraph fields (h1 headings)
  if (step.blocks) {
    step.blocks.forEach((block, blockIdx) => {
      if (block.rows) {
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              // Fix heading fields that show "Check 4" incorrectly
              if (field.type === 'paragraph' && field.editedParagraph) {
                let content = field.editedParagraph;
                
                // Check if this is a heading field (h1 tag)
                if (content.includes('<h1') && content.includes('Check 4') && stepName !== 'Check 4') {
                  // Replace "Check 4" with correct title
                  content = content.replace(/Check 4/g, correctTitle);
                  field.editedParagraph = content;
                  fixedTitles++;
                  console.log(`Fixed heading in "${stepName}": replaced "Check 4" with "${correctTitle}"`);
                }
                
                // Also fix if heading shows wrong title
                const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
                if (h1Match && h1Match[1] !== correctTitle && field.integrationID === 'LargeHeading') {
                  content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/, `<h1 style="text-align: center; color: #1f2937; font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">${correctTitle}</h1>`);
                  field.editedParagraph = content;
                  fixedTitles++;
                  console.log(`Fixed heading in "${stepName}": "${h1Match[1]}" -> "${correctTitle}"`);
                }
                
                // Check if this step needs a voice recorder
                if (stepsNeedingVoiceRecorder.includes(stepName)) {
                  // Check if voice recorder is already present
                  if (!content.includes('voice-recorder-container') && !content.includes('Voice Response Recorder')) {
                    // This field doesn't have voice recorder - check if we need to add it
                    // Voice recorder should be in a separate paragraph field, not in the heading
                    // We'll add it after checking all fields
                  }
                }
              }
            });
          }
        });
      }
      
      // Check if this block needs a voice recorder field
      if (stepsNeedingVoiceRecorder.includes(stepName)) {
        let hasVoiceRecorder = false;
        let hasAnswerField = false;
        
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields.forEach((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  if (field.editedParagraph.includes('voice-recorder-container') || 
                      field.editedParagraph.includes('Voice Response Recorder')) {
                    hasVoiceRecorder = true;
                  }
                }
                if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                  hasAnswerField = true;
                }
              });
            }
          });
        }
        
        // If step needs voice recorder but doesn't have it, add it
        if (!hasVoiceRecorder && hasAnswerField) {
          // Find the answer field to get its ID
          let answerFieldId = '';
          if (block.rows) {
            block.rows.forEach((row) => {
              if (row.fields) {
                row.fields.forEach((field) => {
                  if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                    answerFieldId = field.integrationID;
                  }
                });
              }
            });
          }
          
          if (answerFieldId) {
            const questionId = answerFieldId.replace('Answer_', '');
            const questionTitle = stepName;
            const voiceRecorderHTML = getInlineVoiceRecorder(questionId, questionTitle, answerFieldId);
            
            // Add voice recorder as a new field before the answer field
            if (block.rows && block.rows.length > 0) {
              const lastRow = block.rows[block.rows.length - 1];
              if (lastRow.fields) {
                // Insert voice recorder field before answer field
                const answerFieldIndex = lastRow.fields.findIndex(f => f.integrationID && f.integrationID.startsWith('Answer_'));
                if (answerFieldIndex >= 0) {
                  lastRow.fields.splice(answerFieldIndex, 0, {
                    className: "",
                    clearable: false,
                    hint: "",
                    identifier: `voice_${stepName.toLowerCase().replace(/\s+/g, '_')}`,
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
                    editedParagraph: voiceRecorderHTML,
                    localOnly: false
                  });
                  fixedVoiceRecorders++;
                  console.log(`Added voice recorder to "${stepName}"`);
                }
              }
            }
          } else {
            missingVoiceRecorders.push(stepName);
          }
        }
      }
    });
  }
});

console.log(`\n✅ Fixed ${fixedTitles} title issues`);
console.log(`✅ Fixed ${fixedVoiceRecorders} missing voice recorders`);
if (missingVoiceRecorders.length > 0) {
  console.log(`⚠️  Could not add voice recorder to: ${missingVoiceRecorders.join(', ')} (missing answer field)`);
}

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

