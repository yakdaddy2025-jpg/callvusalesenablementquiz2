/**
 * Replace inline voice recorder with iframe approach
 * This will work even if CallVu strips script tags
 * Uses the existing Vercel deployment
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

let fixedSteps = 0;

// Create iframe-based voice recorder HTML
function createIframeVoiceRecorder(questionId, questionTitle, answerFieldId) {
  // Use iframe to embed the voice recorder from Vercel
  // This bypasses CallVu's script tag restrictions
  const iframeId = `voice-recorder-${questionId.toLowerCase().replace(/\s+/g, '-')}`;
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
            row.fields.forEach((field) => {
              // Replace inline voice recorder with iframe
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Check if this field has the inline voice recorder
                if (content.includes('voice-recorder-container') && 
                    content.includes('<script>')) {
                  
                  // Find the answer field ID
                  let answerFieldId = '';
                  block.rows.forEach((r) => {
                    if (r.fields) {
                      r.fields.forEach((f) => {
                        if (f.integrationID && f.integrationID.startsWith('Answer_')) {
                          answerFieldId = f.integrationID;
                        }
                      });
                    }
                  });
                  
                  if (answerFieldId) {
                    const questionId = answerFieldId.replace('Answer_', '');
                    const questionTitle = stepName;
                    const iframeHTML = createIframeVoiceRecorder(questionId, questionTitle, answerFieldId);
                    
                    // Replace the entire content with iframe
                    field.editedParagraph = iframeHTML;
                    fixedSteps++;
                    console.log(`Replaced inline voice recorder with iframe in "${stepName}"`);
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

console.log(`\n✅ Replaced ${fixedSteps} inline voice recorders with iframe approach`);
console.log('   - Voice recorder now loads from Vercel via iframe');
console.log('   - This bypasses CallVu script tag restrictions');
console.log('   - Should work on both desktop and mobile');

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

