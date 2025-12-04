/**
 * Analyze CVUF structure to understand where answer fields are
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Analyzing CVUF structure...\n');

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (stepName === 'Roleplay 3' || stepName === 'Drill A') {
    console.log(`\n=== ${stepName} ===`);
    console.log(`Blocks: ${step.blocks ? step.blocks.length : 0}`);
    
    if (step.blocks) {
      step.blocks.forEach((block, blockIdx) => {
        console.log(`\n  Block ${blockIdx}:`);
        console.log(`    Rows: ${block.rows ? block.rows.length : 0}`);
        
        if (block.rows) {
          block.rows.forEach((row, rowIdx) => {
            console.log(`\n    Row ${rowIdx}:`);
            if (row.fields) {
              row.fields.forEach((field, fieldIdx) => {
                const type = field.type || 'unknown';
                const integrationID = field.integrationID || '';
                const hasVoiceRecorder = field.editedParagraph && (
                  field.editedParagraph.includes('<iframe') ||
                  field.editedParagraph.includes('voice-recorder-container') ||
                  field.editedParagraph.includes('Voice Response Recorder')
                );
                
                console.log(`      Field ${fieldIdx}: ${type} | integrationID: ${integrationID} | VoiceRecorder: ${hasVoiceRecorder}`);
                
                if (integrationID.startsWith('Answer_')) {
                  console.log(`        *** ANSWER FIELD FOUND ***`);
                }
              });
            }
          });
        }
      });
    }
  }
});

