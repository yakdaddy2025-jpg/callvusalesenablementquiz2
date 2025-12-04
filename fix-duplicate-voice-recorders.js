/**
 * Fix duplicate voice recorders - keep only ONE per step
 * Remove all duplicates and ensure each step has exactly one voice recorder iframe
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

const VERCEL_URL = 'https://callvusalesenablementquiz2.vercel.app';
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

// Steps that need voice recorders
const stepsNeedingVoiceRecorder = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B',
  'Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4',
  'Quiz 2',
  'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

// Create iframe-based voice recorder HTML
function createIframeVoiceRecorder(questionId, questionTitle, answerFieldId) {
  const iframeId = `voice-recorder-${questionId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  const embedUrl = `${VERCEL_URL}/embed?questionId=${encodeURIComponent(questionId)}&questionTitle=${encodeURIComponent(questionTitle)}&answerFieldId=${encodeURIComponent(answerFieldId)}&webhookUrl=${encodeURIComponent(WEBHOOK_URL)}`;
  
  return `<div style="width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:20px 0!important;padding:10px!important;">
  <div style="border:2px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f9fafb;width:100%!important;max-width:100%!important;">
    <iframe 
      id="${iframeId}"
      src="${embedUrl}"
      style="width:100%!important;max-width:100%!important;min-height:500px!important;border:none!important;display:block!important;box-sizing:border-box!important;"
      allow="microphone"
      title="Voice Response Recorder">
    </iframe>
  </div>
  <p style="margin-top:10px;font-size:12px;color:#6b7280;text-align:center;">If the voice recorder doesn't load, please refresh the page.</p>
</div>`;
}

let totalRemoved = 0;
let totalAdded = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        // First, find the answer field ID
        let answerFieldId = '';
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
              }
            });
          }
        });
        
        if (!answerFieldId) {
          console.log(`⚠️  No answer field found in "${stepName}"`);
          return;
        }
        
        const questionId = answerFieldId.replace('Answer_', '');
        const questionTitle = stepName;
        const iframeHTML = createIframeVoiceRecorder(questionId, questionTitle, answerFieldId);
        
        // Count how many voice recorder fields exist
        let voiceRecorderCount = 0;
        let firstVoiceRecorderField = null;
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Check if this is a voice recorder field (iframe or old inline)
                if (content.includes('<iframe') || 
                    content.includes('voice-recorder-container') || 
                    content.includes('Voice Response Recorder') ||
                    (content.includes('<script>') && content.includes('SpeechRecognition'))) {
                  
                  voiceRecorderCount++;
                  
                  // Keep track of the first one
                  if (!firstVoiceRecorderField) {
                    firstVoiceRecorderField = { row, field };
                  }
                }
              }
            });
          }
        });
        
        // If there are multiple voice recorders, remove all and add one
        if (voiceRecorderCount > 1) {
          console.log(`🔧 Found ${voiceRecorderCount} voice recorders in "${stepName}" - removing duplicates`);
          
          // Remove ALL voice recorder fields
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields = row.fields.filter((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph;
                  const isVoiceRecorder = content.includes('<iframe') || 
                                         content.includes('voice-recorder-container') || 
                                         content.includes('Voice Response Recorder') ||
                                         (content.includes('<script>') && content.includes('SpeechRecognition'));
                  
                  if (isVoiceRecorder) {
                    totalRemoved++;
                    return false; // Remove this field
                  }
                }
                return true; // Keep this field
              });
            }
          });
          
          // Add ONE voice recorder field right before the answer field
          block.rows.forEach((row) => {
            if (row.fields) {
              const answerFieldIndex = row.fields.findIndex(f => f.integrationID === answerFieldId);
              if (answerFieldIndex !== -1) {
                // Insert voice recorder field right before the answer field
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
                  editedParagraph: iframeHTML,
                  localOnly: false
                };
                
                row.fields.splice(answerFieldIndex, 0, voiceRecorderField);
                totalAdded++;
                console.log(`✅ Added single voice recorder to "${stepName}"`);
              }
            }
          });
        } else if (voiceRecorderCount === 1 && firstVoiceRecorderField) {
          // Update the existing one to use iframe if it's not already
          const content = firstVoiceRecorderField.field.editedParagraph;
          if (!content.includes('<iframe')) {
            firstVoiceRecorderField.field.editedParagraph = iframeHTML;
            console.log(`✅ Updated existing voice recorder in "${stepName}" to use iframe`);
          }
        } else if (voiceRecorderCount === 0) {
          // No voice recorder found - add one
          block.rows.forEach((row) => {
            if (row.fields) {
              const answerFieldIndex = row.fields.findIndex(f => f.integrationID === answerFieldId);
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
                  editedParagraph: iframeHTML,
                  localOnly: false
                };
                
                row.fields.splice(answerFieldIndex, 0, voiceRecorderField);
                totalAdded++;
                console.log(`✅ Added voice recorder to "${stepName}"`);
              }
            }
          });
        }
      }
    });
  }
});

console.log(`\n✅ Fixed duplicates:`);
console.log(`   - Removed ${totalRemoved} duplicate voice recorders`);
console.log(`   - Added ${totalAdded} single voice recorders`);
console.log(`   - Each step now has exactly ONE voice recorder`);

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

