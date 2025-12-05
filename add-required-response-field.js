/**
 * CRITICAL: Add required response field to all steps with voice recorders
 * This makes CallVu validate that a response exists before allowing Next
 * Similar to how Drill C requires a selection
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_NEXT_DISABLED_1764924331491.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_REQUIRED_FIELD_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Adding required response fields to all steps with voice recorders...\n');

let addedCount = 0;

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  
  // Check if this step has a voice recorder
  let hasRecorder = false;
  let recorderField = null;
  
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        if (field.type === 'paragraph' && 
            field.editedParagraph && 
            field.editedParagraph.includes('iframe') &&
            field.editedParagraph.includes('callvusalesenablementquiz2.vercel.app')) {
          hasRecorder = true;
          recorderField = field;
        }
      });
    });
  });
  
  // If step has recorder, add a REQUIRED hidden response field
  if (hasRecorder) {
    // Find the row with the recorder
    let recorderRow = null;
    step.blocks?.forEach((block) => {
      block.rows?.forEach((row) => {
        row.fields?.forEach((field) => {
          if (field === recorderField) {
            recorderRow = row;
          }
        });
      });
    });
    
    if (recorderRow) {
      // Check if required field already exists
      const hasRequiredField = recorderRow.fields.some(f => 
        f.type === 'longText' && 
        f.label && 
        f.label.toLowerCase().includes('response') &&
        f.required === true
      );
      
      if (!hasRequiredField) {
        // Create a REQUIRED hidden response field
        const requiredField = {
          className: '',
          clearable: false,
          hint: 'Voice response is required. Click "Keep Response" after recording.',
          identifier: `id_${stepName.replace(/\s+/g, '_').toLowerCase()}_response_required_${Date.now()}`,
          integrationID: `ID_${stepName.replace(/\s+/g, '_')}_Response_Required_${Date.now()}`,
          isHiddenInRuntime: false,
          label: '*Your Response',
          maskingViewer: 'none',
          name: 'editor.fields.longText',
          permission: 'both',
          readOnly: true, // Read-only so users can't type
          required: true, // REQUIRED - CallVu will validate this
          tooltip: 'This field is filled automatically when you click "Keep Response"',
          type: 'longText',
          validations: [
            {
              type: 'required',
              message: 'Please record your response and click "Keep Response" before proceeding.'
            }
          ],
          width: 'full',
          columnID: 0,
          maxLength: 5000,
          localOnly: true
        };
        
        // Add field after the recorder iframe
        const recorderIndex = recorderRow.fields.indexOf(recorderField);
        if (recorderIndex >= 0) {
          recorderRow.fields.splice(recorderIndex + 1, 0, requiredField);
          addedCount++;
          console.log(`   ✅ Added required response field to: ${stepName}`);
        }
      }
    }
  }
});

console.log(`\n✅ Added ${addedCount} required response fields`);
console.log(`\n⚠️  IMPORTANT: The voice recorder must fill this field when "Keep Response" is clicked`);
console.log(`   CallVu will validate this field is not empty before allowing Next`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

