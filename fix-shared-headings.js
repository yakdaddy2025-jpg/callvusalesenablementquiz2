/**
 * Fix issue where "Check 4" appears on multiple screens
 * Problem: Multiple steps share the same integrationID "LargeHeading"
 * Solution: Make each heading field unique per step
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

let fixedHeadings = 0;
let checkedVoiceRecorders = 0;
let missingVoiceRecorders = [];

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Fix shared LargeHeading integrationID - make it unique per step
              if (field.integrationID === 'LargeHeading' && field.type === 'paragraph') {
                // Make integrationID unique per step
                field.integrationID = `LargeHeading_${stepName.replace(/\s+/g, '_')}`;
                
                // Ensure the heading shows the correct title for this step
                if (field.editedParagraph) {
                  let content = field.editedParagraph;
                  
                  // Extract current h1 content
                  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
                  if (h1Match) {
                    const currentTitle = h1Match[1].trim();
                    // If it shows "Check 4" but this isn't Check 4, fix it
                    if (currentTitle === 'Check 4' && stepName !== 'Check 4') {
                      content = content.replace(
                        /<h1[^>]*>([^<]+)<\/h1>/,
                        `<h1 style="text-align: center; color: #1f2937; font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">${stepName}</h1>`
                      );
                      field.editedParagraph = content;
                      fixedHeadings++;
                      console.log(`Fixed heading in "${stepName}": "Check 4" -> "${stepName}"`);
                    } else if (currentTitle !== stepName && stepName !== 'Intro' && stepName !== 'Rep Info' && stepName !== 'Complete') {
                      // Update to show correct step name
                      content = content.replace(
                        /<h1[^>]*>([^<]+)<\/h1>/,
                        `<h1 style="text-align: center; color: #1f2937; font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">${stepName}</h1>`
                      );
                      field.editedParagraph = content;
                      fixedHeadings++;
                      console.log(`Fixed heading in "${stepName}": "${currentTitle}" -> "${stepName}"`);
                    }
                  }
                }
              }
              
              // Check for voice recorder
              if (field.type === 'paragraph' && field.editedParagraph) {
                if (field.editedParagraph.includes('voice-recorder-container') || 
                    field.editedParagraph.includes('Voice Response Recorder')) {
                  checkedVoiceRecorders++;
                }
              }
            });
          }
        });
      }
      
      // Check if this step needs a voice recorder
      const stepsNeedingVoiceRecorder = [
        'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
        'Drill A', 'Drill B',
        'Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4',
        'Quiz 2',
        'Check 1', 'Check 2', 'Check 3', 'Check 4'
      ];
      
      if (stepsNeedingVoiceRecorder.includes(stepName)) {
        let hasVoiceRecorder = false;
        let answerFieldId = '';
        
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
                  answerFieldId = field.integrationID;
                }
              });
            }
          });
        }
        
        if (!hasVoiceRecorder && answerFieldId) {
          missingVoiceRecorders.push({ step: stepName, answerField: answerFieldId });
        }
      }
    });
  }
});

console.log(`\n✅ Fixed ${fixedHeadings} heading issues (unique integrationIDs and correct titles)`);
console.log(`✅ Checked ${checkedVoiceRecorders} voice recorder instances`);
if (missingVoiceRecorders.length > 0) {
  console.log(`⚠️  Missing voice recorders on:`);
  missingVoiceRecorders.forEach(m => {
    console.log(`   - ${m.step} (answer field: ${m.answerField})`);
  });
} else {
  console.log(`✅ All required steps have voice recorders`);
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

