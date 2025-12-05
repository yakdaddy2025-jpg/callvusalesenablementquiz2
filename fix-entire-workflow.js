/**
 * Fix ENTIRE workflow:
 * 1. Remove ALL "Your Response" fields from ALL steps (not just roleplays)
 * 2. Ensure ALL steps with voice recorders have proper iframes
 * 3. Make sure all voice recorders point to Vercel
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_NO_RESPONSE_FIELD_1764921380467.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_FIXED_ALL_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Fixing ENTIRE workflow...\n');

const VERCEL_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';
let removedFields = 0;
let fixedRecorders = 0;
let stepsWithRecorders = [];

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  let stepHasRecorder = false;
  let answerFieldId = null;
  
  // Find answer field ID for this step (if any)
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        // Remove ALL "Your Response" fields from ALL steps
        if (field.type === 'longText' && 
            field.label && 
            (field.label.toLowerCase().includes('response') || 
             field.label.toLowerCase().includes('your response'))) {
          removedFields++;
          console.log(`   ✅ Removed "Your Response" field from ${stepName}`);
        }
        
        // Track answer field ID if it exists
        if (field.type === 'longText' && field.integrationID) {
          answerFieldId = field.integrationID;
        }
      });
    });
  });
  
  // Remove response fields
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      if (row.fields) {
        row.fields = row.fields.filter(field => {
          return !(field.type === 'longText' && 
                   field.label && 
                   (field.label.toLowerCase().includes('response') || 
                    field.label.toLowerCase().includes('your response')));
        });
      }
    });
  });
  
  // Fix voice recorders - ensure all have iframes
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      row.fields?.forEach((field) => {
        if (field.type === 'paragraph' && field.editedParagraph) {
          // Check if this is a voice recorder field
          const isRecorder = field.editedParagraph.includes('voice') || 
                            field.editedParagraph.includes('recorder') ||
                            field.editedParagraph.includes('recording') ||
                            field.editedParagraph.includes('iframe');
          
          if (isRecorder) {
            stepHasRecorder = true;
            
            // If it doesn't have an iframe, add one
            if (!field.editedParagraph.includes('<iframe')) {
              // Find answer field for this step
              let answerId = answerFieldId;
              if (!answerId) {
                // Generate a unique ID based on step
                answerId = `ID_${stepName.replace(/\s+/g, '_')}_${Date.now()}`;
              }
              
              const questionId = stepName.replace(/\s+/g, '_');
              const questionTitle = stepName;
              const iframeSrc = `${VERCEL_URL}?questionId=${encodeURIComponent(questionId)}&questionTitle=${encodeURIComponent(questionTitle)}&answerFieldId=${encodeURIComponent(answerId)}`;
              
              field.editedParagraph = `<div style="width: 100%; margin: 20px 0;">
  <iframe 
    src="${iframeSrc}"
    style="width: 100%; min-height: 500px; border: 2px solid #e5e7eb; border-radius: 8px;"
    frameborder="0"
    allow="microphone"
    allowfullscreen>
  </iframe>
</div>`;
              
              fixedRecorders++;
              console.log(`   ✅ Fixed voice recorder in ${stepName}`);
            } else {
              // Ensure iframe points to correct URL
              if (!field.editedParagraph.includes('callvusalesenablementquiz2.vercel.app')) {
                const questionId = stepName.replace(/\s+/g, '_');
                const questionTitle = stepName;
                const answerId = answerFieldId || `ID_${stepName.replace(/\s+/g, '_')}_${Date.now()}`;
                const iframeSrc = `${VERCEL_URL}?questionId=${encodeURIComponent(questionId)}&questionTitle=${encodeURIComponent(questionTitle)}&answerFieldId=${encodeURIComponent(answerId)}`;
                
                // Replace iframe src
                field.editedParagraph = field.editedParagraph.replace(
                  /src="[^"]*"/,
                  `src="${iframeSrc}"`
                );
                
                fixedRecorders++;
                console.log(`   ✅ Updated iframe URL in ${stepName}`);
              }
            }
          }
        }
      });
    });
  });
  
  if (stepHasRecorder) {
    stepsWithRecorders.push(stepName);
  }
});

console.log(`\n✅ Removed ${removedFields} "Your Response" field(s) from ALL steps`);
console.log(`✅ Fixed ${fixedRecorders} voice recorder(s)`);
console.log(`✅ Steps with voice recorders: ${stepsWithRecorders.join(', ')}`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

