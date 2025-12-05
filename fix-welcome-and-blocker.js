/**
 * Fix Welcome screen content and make Next button blocker absolutely mandatory
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_FINAL_FIX_1764923134529.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_COMPLETE_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Fixing Welcome screen and Next button blocker...\n');

// Restore welcome screen content
cvuf.form.steps.forEach((step) => {
  if (step.stepName === 'Intro') {
    step.blocks?.forEach((block) => {
      block.rows?.forEach((row) => {
        row.fields?.forEach((field) => {
          // Find the Welcome heading field and add content after it
          if (field.type === 'paragraph' && 
              field.editedParagraph && 
              field.editedParagraph.includes('Welcome')) {
            
            // Add welcome content after the Welcome heading
            const welcomeContent = `<div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">
  <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-top: 16px; text-align: center;">
    This quiz will take approximately <strong>20-30 minutes</strong> to complete.
  </p>
  <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-top: 12px; text-align: center;">
    You'll be asked to provide voice responses to roleplay scenarios, drills, and assessment questions.
  </p>
  <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin-top: 12px; text-align: center;">
    Please ensure you have a quiet environment and a working microphone before beginning.
  </p>
</div>`;
            
            // Insert welcome content as a new field after Welcome heading
            const welcomeFieldIndex = row.fields.indexOf(field);
            if (welcomeFieldIndex >= 0) {
              const welcomeContentField = {
                className: '',
                clearable: false,
                hint: '',
                identifier: `id_intro_welcome_content_${Date.now()}`,
                integrationID: `ID_Intro_Welcome_Content_${Date.now()}`,
                isHiddenInRuntime: false,
                label: '',
                maskingViewer: 'none',
                name: 'editor.fields.paragraph',
                permission: 'both',
                readOnly: false,
                required: false,
                tooltip: '',
                type: 'paragraph',
                validations: [],
                width: 'full',
                columnID: 0,
                editedParagraph: welcomeContent,
                localOnly: true
              };
              
              row.fields.splice(welcomeFieldIndex + 1, 0, welcomeContentField);
              console.log('   ✅ Added welcome content to Intro step');
            }
          }
        });
      });
    });
  }
  
  // Ensure Next button is disabled on ALL steps with voice recorders
  const stepName = step.stepName;
  if (stepName.startsWith('Roleplay') || 
      stepName.startsWith('Drill') || 
      stepName.startsWith('Scenario') ||
      stepName.startsWith('Check') ||
      stepName === 'Quiz 2') {
    
    // Check if this step has a voice recorder
    let hasRecorder = false;
    step.blocks?.forEach((block) => {
      block.rows?.forEach((row) => {
        row.fields?.forEach((field) => {
          if (field.type === 'paragraph' && 
              field.editedParagraph && 
              field.editedParagraph.includes('iframe')) {
            hasRecorder = true;
          }
        });
      });
    });
    
    // Force Next button to be disabled
    if (hasRecorder) {
      if (!step.buttonsConfig) {
        step.buttonsConfig = {};
      }
      if (!step.buttonsConfig.next) {
        step.buttonsConfig.next = {};
      }
      step.buttonsConfig.next.className = 'disabled';
      step.buttonsConfig.next.disabled = true;
      step.buttonsConfig.next.isHidden = false;
      console.log(`   ✅ Force disabled Next button on ${stepName}`);
    }
  }
});

console.log(`\n✅ Welcome content restored`);
console.log(`✅ Next buttons force-disabled on all steps with recorders`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

