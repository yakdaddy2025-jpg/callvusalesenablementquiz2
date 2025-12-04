/**
 * Remove duplicate rows from steps
 * Keep only ONE row per step and ensure voice recorder is in the right place
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

let totalRowsRemoved = 0;
let totalRowsKept = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows && block.rows.length > 1) {
        // Find the answer field ID
        let answerFieldId = '';
        let bestRow = null;
        let bestRowIndex = -1;
        
        // Find the row that has the answer field and ideally a voice recorder
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            let hasAnswerField = false;
            let hasVoiceRecorder = false;
            
            row.fields.forEach((field) => {
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
                hasAnswerField = true;
              }
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('<iframe') || 
                    content.includes('voice-recorder-container') ||
                    content.includes('Voice Response Recorder')) {
                  hasVoiceRecorder = true;
                }
              }
            });
            
            // Prefer row with both answer field and voice recorder
            // Otherwise prefer row with answer field
            if (hasAnswerField) {
              if (!bestRow || (hasVoiceRecorder && !bestRow.hasVoiceRecorder)) {
                bestRow = row;
                bestRowIndex = rowIdx;
                bestRow.hasVoiceRecorder = hasVoiceRecorder;
              }
            }
          }
        });
        
        if (bestRow && answerFieldId) {
          const questionId = answerFieldId.replace('Answer_', '');
          const questionTitle = stepName;
          const iframeHTML = createIframeVoiceRecorder(questionId, questionTitle, answerFieldId);
          
          // Remove ALL duplicate rows, keep only bestRow
          const rowsBefore = block.rows.length;
          block.rows = [bestRow]; // Keep only the best row
          totalRowsRemoved += (rowsBefore - 1);
          totalRowsKept++;
          
          console.log(`🔧 "${stepName}": Removed ${rowsBefore - 1} duplicate row(s), kept 1 row`);
          
          // Ensure voice recorder is in the row
          let hasVoiceRecorder = false;
          let answerFieldIndex = -1;
          
          bestRow.fields.forEach((field, fieldIdx) => {
            if (field.integrationID === answerFieldId) {
              answerFieldIndex = fieldIdx;
            }
            if (field.type === 'paragraph' && field.editedParagraph) {
              const content = field.editedParagraph;
              if (content.includes('<iframe') || 
                  content.includes('voice-recorder-container') ||
                  content.includes('Voice Response Recorder')) {
                hasVoiceRecorder = true;
              }
            }
          });
          
          // Remove any existing voice recorders from this row
          bestRow.fields = bestRow.fields.filter((field) => {
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
          answerFieldIndex = bestRow.fields.findIndex(f => f.integrationID === answerFieldId);
          
          // Add voice recorder right before answer field
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
            
            bestRow.fields.splice(answerFieldIndex, 0, voiceRecorderField);
            console.log(`✅ Added voice recorder to "${stepName}"`);
          }
        } else {
          console.log(`⚠️  Could not find answer field in "${stepName}"`);
        }
      } else if (block.rows && block.rows.length === 1) {
        // Only one row - just ensure voice recorder is there
        const row = block.rows[0];
        let answerFieldId = '';
        let answerFieldIndex = -1;
        
        if (row.fields) {
          row.fields.forEach((field, fieldIdx) => {
            if (field.integrationID && field.integrationID.startsWith('Answer_')) {
              answerFieldId = field.integrationID;
              answerFieldIndex = fieldIdx;
            }
          });
          
          if (answerFieldId) {
            const questionId = answerFieldId.replace('Answer_', '');
            const questionTitle = stepName;
            const iframeHTML = createIframeVoiceRecorder(questionId, questionTitle, answerFieldId);
            
            // Remove any existing voice recorders
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
            
            // Re-find answer field index
            answerFieldIndex = row.fields.findIndex(f => f.integrationID === answerFieldId);
            
            // Add voice recorder
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
              console.log(`✅ Added voice recorder to "${stepName}" (single row)`);
            }
          }
        }
      }
    });
  }
});

console.log(`\n✅ Fixed duplicate rows:`);
console.log(`   - Removed ${totalRowsRemoved} duplicate rows`);
console.log(`   - Kept ${totalRowsKept} rows (one per step)`);
console.log(`   - Each step now has exactly ONE row with ONE voice recorder`);

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

