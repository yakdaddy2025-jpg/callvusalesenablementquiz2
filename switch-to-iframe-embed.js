/**
 * Replace inline voice recorder HTML/JS with iframes pointing to Vercel embed
 * This fixes the 400 Bad Request errors by removing embedded JavaScript
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

const VERCEL_EMBED_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';

console.log('Replacing inline voice recorders with iframes...\n');

let replacedCount = 0;

// Map of step names to their question IDs and answer field IDs
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

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName || '';
  const config = stepConfig[stepName];
  
  if (!config) return; // Skip steps that don't need voice recorder
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Check if this is a voice recorder paragraph field
              if (field.type === 'paragraph' && 
                  field.editedParagraph && 
                  field.editedParagraph.includes('Voice Recorder') &&
                  field.editedParagraph.includes('<script>')) {
                
                // Build iframe URL with parameters
                const iframeUrl = `${VERCEL_EMBED_URL}?questionId=${encodeURIComponent(config.questionId)}&questionTitle=${encodeURIComponent(stepName)}&answerFieldId=${encodeURIComponent(config.answerFieldId)}`;
                
                // Replace with iframe
                field.editedParagraph = `<div style="width: 100%; min-height: 500px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <iframe 
    src="${iframeUrl}" 
    style="width: 100%; height: 600px; border: none; display: block;"
    allow="microphone"
    title="Voice Response Recorder"
  ></iframe>
</div>`;
                
                replacedCount++;
                console.log(`✅ Replaced voice recorder in "${stepName}"`);
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
console.log(`\n✅ Replaced ${replacedCount} inline voice recorders with iframes`);
console.log(`✅ CVUF file updated - should fix 400 Bad Request errors`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Import the updated CVUF file into CallVu`);
console.log(`   2. Test the preview - should work without 400 errors`);
console.log(`   3. The voice recorder will load from Vercel via iframe`);

