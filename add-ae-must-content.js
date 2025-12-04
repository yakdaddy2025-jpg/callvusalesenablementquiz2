/**
 * Replace "YOUR TASK" with "AE must" and add the explanation content
 * Each roleplay has specific content explaining what the AE must do
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// AE must content for each roleplay
const aeMustContent = {
  'Roleplay 1': `What Mode A does here

Why UI-led compliance eliminates agent deviation

Where Mode B would finish the backend steps`,
  
  // Placeholder for others - user will need to provide content
  'Roleplay 2': '[AE must content for Roleplay 2 - to be filled in]',
  'Roleplay 3': '[AE must content for Roleplay 3 - to be filled in]',
  'Roleplay 4': '[AE must content for Roleplay 4 - to be filled in]',
  'Roleplay 5': '[AE must content for Roleplay 5 - to be filled in]',
  'Roleplay 6': '[AE must content for Roleplay 6 - to be filled in]',
  'Roleplay 7': '[AE must content for Roleplay 7 - to be filled in]'
};

const roleplaySteps = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7'
];

let replacedCount = 0;

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
                
                // Check if this field contains "YOUR TASK" or "AE MUST"
                if (htmlContent.includes('YOUR TASK') || htmlContent.includes('AE MUST')) {
                  // Format the content with line breaks
                  const formattedContent = content.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
                  
                  // Replace with "AE must" and the explanation
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
                  replacedCount++;
                  console.log(`✅ Added "AE must explain" content to "${stepName}"`);
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Updated ${replacedCount} roleplay step(s) with "AE must explain" content`);
console.log(`   - Roleplay 1 has the provided content`);
console.log(`   - Other roleplays have placeholders - update in CallVu designer or provide content`);

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

