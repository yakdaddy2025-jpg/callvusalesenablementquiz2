/**
 * Fix duplicate voice recorders - ensure ONLY ONE per step
 * Remove ALL duplicates and add exactly ONE voice recorder per step
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
        // Find the answer field ID (should be only one per step)
        let answerFieldId = '';
        let answerFieldRow = null;
        let answerFieldIndex = -1;
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
                answerFieldRow = row;
                answerFieldIndex = fieldIdx;
              }
            });
          }
        });
        
        if (!answerFieldId || !answerFieldRow) {
          console.log(`⚠️  No answer field found in "${stepName}"`);
          return;
        }
        
        const questionId = answerFieldId.replace('Answer_', '');
        const questionTitle = stepName;
        const iframeHTML = createIframeVoiceRecorder(questionId, questionTitle, answerFieldId);
        
        // STEP 1: Remove ALL voice recorder fields from ALL rows
        let removedCount = 0;
        block.rows.forEach((row) => {
          if (row.fields) {
            const beforeCount = row.fields.length;
            row.fields = row.fields.filter((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                const isVoiceRecorder = content.includes('<iframe') || 
                                       content.includes('voice-recorder-container') || 
                                       content.includes('Voice Response Recorder') ||
                                       (content.includes('<script>') && content.includes('SpeechRecognition'));
                
                if (isVoiceRecorder) {
                  removedCount++;
                  return false; // Remove this field
                }
              }
              return true; // Keep this field
            });
          }
        });
        
        if (removedCount > 0) {
          console.log(`🔧 Removed ${removedCount} duplicate voice recorder(s) from "${stepName}"`);
          totalRemoved += removedCount;
        }
        
        // STEP 2: Add exactly ONE voice recorder right before the answer field
        // Check if there's already a voice recorder right before the answer field
        let hasVoiceRecorderBefore = false;
        if (answerFieldIndex > 0 && answerFieldRow.fields[answerFieldIndex - 1]) {
          const prevField = answerFieldRow.fields[answerFieldIndex - 1];
          if (prevField.type === 'paragraph' && prevField.editedParagraph) {
            const content = prevField.editedParagraph;
            if (content.includes('<iframe') || content.includes('voice-recorder-container')) {
              hasVoiceRecorderBefore = true;
            }
          }
        }
        
        if (!hasVoiceRecorderBefore) {
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
          
          // Insert right before the answer field
          answerFieldRow.fields.splice(answerFieldIndex, 0, voiceRecorderField);
          totalAdded++;
          console.log(`✅ Added single voice recorder to "${stepName}"`);
        } else {
          // Update existing one to use iframe if needed
          const prevField = answerFieldRow.fields[answerFieldIndex - 1];
          if (prevField.editedParagraph && !prevField.editedParagraph.includes('<iframe')) {
            prevField.editedParagraph = iframeHTML;
            console.log(`✅ Updated existing voice recorder in "${stepName}" to use iframe`);
          }
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

