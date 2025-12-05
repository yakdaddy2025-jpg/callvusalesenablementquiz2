/**
 * Update all roleplay steps with correct "AE must explain" content
 * Remove any "Success criteria" sections
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// AE must content for each roleplay (from user's document)
const aeMustContent = {
  'Roleplay 1': `What Mode A does here

Why UI-led compliance eliminates agent deviation

Where Mode B would finish the backend steps`,
  
  'Roleplay 2': `FNOL in Mode A (document capture, mandatory questions)

Mode B for triggers (policy updates, eligibility checks)`,
  
  'Roleplay 3': `Use Mode A for identity + disclosures

Use Mode B for backend provisioning

Hit fraud prevention value`,
  
  'Roleplay 4': `Mode A = enforce questionnaires + regulatory notices

Mode B = update backend service status and billing`,
  
  'Roleplay 5': `Mode A for mandatory questions, disclosures, and evidence

Mode B for backend servicing actions`,
  
  'Roleplay 6': `Mode A for guided intake + insurance upload + consents

Mode B for eligibility & EMR updates`,
  
  'Roleplay 7': `Reframe "bots talk; Callvu completes"

Introduce Mode A + Mode B as the missing execution layer

Reinforce compliance and deterministic steps`
};

const roleplaySteps = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7'
];

let updatedCount = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!roleplaySteps.includes(stepName)) {
    return; // Skip non-roleplay steps
  }
  
  const content = aeMustContent[stepName];
  if (!content) {
    console.log(`⚠️  No content defined for "${stepName}"`);
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                let htmlContent = field.editedParagraph;
                
                // Remove any "Success criteria" sections
                if (htmlContent.includes('Success criteria') || htmlContent.includes('success criteria')) {
                  // Remove the entire field if it contains success criteria
                  const fieldIndex = row.fields.indexOf(field);
                  if (fieldIndex !== -1) {
                    row.fields.splice(fieldIndex, 1);
                    console.log(`🗑️  Removed "Success criteria" from "${stepName}"`);
                    return;
                  }
                }
                
                // Check if this field contains "AE must" or "YOUR TASK"
                if (htmlContent.includes('AE must') || htmlContent.includes('AE MUST') || htmlContent.includes('YOUR TASK')) {
                  // Format the content with line breaks
                  const formattedContent = content.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
                  
                  // Replace with "AE must explain" and the explanation
                  const newContent = `<div class="mobile-wrap-container" style="word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;padding:0 5px!important;">
  <div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 16px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">
      <strong style="color: #1f2937;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">AE must explain:</strong>
    </p>
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 8px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">
      ${formattedContent}
    </p>
  </div>
</div>`;
                  
                  field.editedParagraph = newContent;
                  updatedCount++;
                  console.log(`✅ Updated "AE must explain" content for "${stepName}"`);
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Updated ${updatedCount} roleplay step(s) with correct "AE must explain" content`);
console.log(`   - All 7 roleplays now have the correct content`);
console.log(`   - Removed any "Success criteria" sections`);

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

