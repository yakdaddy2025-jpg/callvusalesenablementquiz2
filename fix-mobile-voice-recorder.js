/**
 * Fix voice recorder not rendering on mobile
 * Ensure voice recorder HTML is properly formatted and mobile-compatible
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Read the inline voice recorder template
const voiceRecorderPath = path.join(__dirname, 'inline-voice-recorder.html');
let voiceRecorderHTML = '';
if (fs.existsSync(voiceRecorderPath)) {
  voiceRecorderHTML = fs.readFileSync(voiceRecorderPath, 'utf8');
} else {
  console.error('inline-voice-recorder.html not found');
  process.exit(1);
}

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

// Steps that need voice recorders
const stepsNeedingVoiceRecorder = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7',
  'Drill A', 'Drill B',
  'Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4',
  'Quiz 2',
  'Check 1', 'Check 2', 'Check 3', 'Check 4'
];

let fixedRecorders = 0;
let duplicateFieldsRemoved = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!stepsNeedingVoiceRecorder.includes(stepName)) {
    return; // Skip steps that don't need voice recorder
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        // Track fields to remove duplicates
        const seenContent = new Set();
        const fieldsToKeep = [];
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Check for duplicate "YOUR TASK" fields
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('YOUR TASK:') || content.includes('YOUR TASK')) {
                  const contentKey = content.substring(0, 100); // Use first 100 chars as key
                  if (seenContent.has(contentKey)) {
                    duplicateFieldsRemoved++;
                    console.log(`Removed duplicate "YOUR TASK" field in "${stepName}"`);
                    return; // Skip this duplicate field
                  }
                  seenContent.add(contentKey);
                }
              }
              
              fieldsToKeep.push(field);
              
              // Check if this field has voice recorder
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('voice-recorder-container')) {
                  // Ensure voice recorder HTML is properly formatted for mobile
                  // Remove any problematic characters or encoding issues
                  let fixedContent = content;
                  
                  // Ensure script tags are properly closed
                  if (!fixedContent.includes('</script>')) {
                    console.log(`Warning: Voice recorder in "${stepName}" might have unclosed script tag`);
                  }
                  
                  // Ensure mobile-responsive styles are present
                  if (!fixedContent.includes('width:100%') && !fixedContent.includes('width: 100%')) {
                    // Add mobile styles to container
                    fixedContent = fixedContent.replace(
                      /id="voice-recorder-container"[^>]*style="([^"]*)"/,
                      (match, styles) => {
                        if (!styles.includes('width')) {
                          return match.replace('style="', 'style="width:100%!important;max-width:100%!important;box-sizing:border-box!important;');
                        }
                        return match;
                      }
                    );
                    field.editedParagraph = fixedContent;
                    fixedRecorders++;
                    console.log(`Fixed mobile styles for voice recorder in "${stepName}"`);
                  }
                }
              }
            });
            
            // Replace fields array with deduplicated version
            row.fields = fieldsToKeep;
          }
        });
        
        // Verify voice recorder exists, if not add it
        let hasVoiceRecorder = false;
        let answerFieldId = '';
        
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                if (field.editedParagraph.includes('voice-recorder-container')) {
                  hasVoiceRecorder = true;
                }
              }
              if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                answerFieldId = field.integrationID;
              }
            });
          }
        });
        
        // If voice recorder is missing, add it
        if (!hasVoiceRecorder && answerFieldId) {
          const questionId = answerFieldId.replace('Answer_', '');
          const questionTitle = stepName;
          
          // Create voice recorder HTML
          let recorderHTML = voiceRecorderHTML
            .replace(/QUESTION_ID_PLACEHOLDER/g, questionId)
            .replace(/QUESTION_TITLE_PLACEHOLDER/g, questionTitle)
            .replace(/ANSWER_FIELD_ID_PLACEHOLDER/g, answerFieldId)
            .replace(/PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE/g, WEBHOOK_URL);
          
          // Add mobile-responsive wrapper
          recorderHTML = `<div style="width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:20px 0!important;">${recorderHTML}</div>`;
          
          // Find the row with the answer field and insert voice recorder before it
          block.rows.forEach((row) => {
            if (row.fields) {
              const answerFieldIndex = row.fields.findIndex(f => 
                f.integrationID && f.integrationID.startsWith('Answer_')
              );
              
              if (answerFieldIndex >= 0) {
                // Insert voice recorder field before answer field
                row.fields.splice(answerFieldIndex, 0, {
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
                  editedParagraph: recorderHTML,
                  localOnly: false
                });
                fixedRecorders++;
                console.log(`Added missing voice recorder to "${stepName}"`);
              }
            }
          });
        }
      }
    });
  }
});

console.log(`\n✅ Fixed ${fixedRecorders} voice recorder issues`);
console.log(`✅ Removed ${duplicateFieldsRemoved} duplicate fields`);

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
console.log('✅ File updated - voice recorder should now render on mobile');

