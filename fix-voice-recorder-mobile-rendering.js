/**
 * Fix voice recorder not rendering on mobile
 * Issue: CallVu might be stripping script tags or not executing them in paragraph fields
 * Solution: Ensure voice recorder HTML is clean and properly formatted
 * Also remove any duplicate "YOUR TASK" fields
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

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
let removedDuplicates = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        // Track seen content to remove duplicates
        const seenTaskFields = [];
        const seenContent = new Set();
        const cleanedFields = [];
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              // Check for duplicate "YOUR TASK" fields
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Check if this is a "YOUR TASK" field
                if (content.includes('YOUR TASK') || content.includes('YOUR TASK:')) {
                  const contentHash = content.substring(0, 150).replace(/\s+/g, '');
                  if (seenContent.has(contentHash)) {
                    removedDuplicates++;
                    console.log(`Removed duplicate "YOUR TASK" field in "${stepName}"`);
                    return; // Skip this duplicate
                  }
                  seenContent.add(contentHash);
                  seenTaskFields.push(fieldIdx);
                }
              }
              
              cleanedFields.push(field);
            });
          }
        });
        
        // Replace fields with cleaned version
        block.rows.forEach((row) => {
          if (row.fields) {
            // Remove duplicates
            const uniqueFields = [];
            const seen = new Set();
            
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('YOUR TASK')) {
                  const key = content.substring(0, 100).replace(/\s+/g, '');
                  if (seen.has(key)) {
                    return; // Skip duplicate
                  }
                  seen.add(key);
                }
              }
              uniqueFields.push(field);
            });
            
            row.fields = uniqueFields;
          }
        });
        
        // Verify voice recorder exists and is properly formatted
        let hasVoiceRecorder = false;
        let answerFieldId = '';
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('voice-recorder-container') || 
                    content.includes('Voice Response Recorder') ||
                    content.includes('record-btn')) {
                  hasVoiceRecorder = true;
                  
                  // Ensure mobile-responsive styles are present
                  if (!content.includes('width:100%') && !content.includes('width: 100%')) {
                    // Fix mobile styles
                    let fixed = content.replace(
                      /id="voice-recorder-container"[^>]*style="([^"]*)"/,
                      (match, styles) => {
                        return match.replace('style="', 'style="width:100%!important;max-width:100%!important;box-sizing:border-box!important;');
                      }
                    );
                    field.editedParagraph = fixed;
                    console.log(`Fixed mobile styles for voice recorder in "${stepName}"`);
                  }
                }
              }
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
              }
            });
          }
        });
        
        if (hasVoiceRecorder) {
          fixedSteps++;
          console.log(`✅ Voice recorder verified in "${stepName}"`);
        } else if (answerFieldId) {
          console.log(`⚠️  Voice recorder missing in "${stepName}" but answer field exists`);
        }
      }
    });
  }
});

console.log(`\n✅ Processed ${fixedSteps} steps with voice recorders`);
console.log(`✅ Removed ${removedDuplicates} duplicate "YOUR TASK" fields`);

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

