/**
 * Replace ALL inline voice recorders with iframe approach
 * The previous script didn't work - let's do it properly
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

let replacedCount = 0;
let stepsProcessed = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return;
  }
  
  stepsProcessed++;
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        // Find answer field ID first
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
        
        // Replace any field that contains voice-recorder-container or script tags
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Check if this is a voice recorder field
                if (content.includes('voice-recorder-container') || 
                    content.includes('Voice Response Recorder') ||
                    (content.includes('<script>') && content.includes('SpeechRecognition'))) {
                  
                  // Replace with iframe
                  field.editedParagraph = iframeHTML;
                  replacedCount++;
                  console.log(`✅ Replaced voice recorder in "${stepName}" with iframe`);
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Processed ${stepsProcessed} steps`);
console.log(`✅ Replaced ${replacedCount} inline voice recorders with iframe`);
console.log(`   - Voice recorder now loads from: ${VERCEL_URL}/embed`);
console.log(`   - This should work on mobile even if CallVu strips script tags`);

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

