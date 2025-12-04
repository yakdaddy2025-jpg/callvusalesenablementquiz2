/**
 * Replace "YOUR TASK" with "AE MUST" in roleplay steps only
 * Remove the separate "AE must" section I added earlier
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Only roleplay steps should have "AE MUST" instead of "YOUR TASK"
const roleplaySteps = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7'
];

let replacedCount = 0;
let removedAEMustSections = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  const isRoleplay = roleplaySteps.includes(stepName);
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Remove the separate "AE must" section I added earlier
                if (content.includes('AE MUST:') && content.includes('[AE must content')) {
                  // This is the placeholder section I added - remove it
                  const rowIndex = block.rows.indexOf(row);
                  if (rowIndex !== -1) {
                    block.rows.splice(rowIndex, 1);
                    removedAEMustSections++;
                    console.log(`🗑️  Removed placeholder "AE must" section from "${stepName}"`);
                    return; // Skip processing this field since we removed the row
                  }
                }
                
                // Replace "YOUR TASK" with "AE MUST" in roleplay steps
                if (isRoleplay && content.includes('YOUR TASK:')) {
                  const newContent = content.replace(
                    /<strong[^>]*>YOUR TASK:<\/strong>/gi,
                    '<strong style="color: #1f2937;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">AE MUST:</strong>'
                  );
                  
                  if (newContent !== content) {
                    field.editedParagraph = newContent;
                    replacedCount++;
                    console.log(`✅ Replaced "YOUR TASK" with "AE MUST" in "${stepName}"`);
                  }
                }
                
                // Keep "YOUR TASK" in non-roleplay steps (drills, scenarios, etc.)
                if (!isRoleplay && content.includes('YOUR TASK:')) {
                  // Leave it as is - this is correct
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Summary:`);
console.log(`   - Replaced "YOUR TASK" with "AE MUST" in ${replacedCount} roleplay steps`);
console.log(`   - Removed ${removedAEMustSections} placeholder "AE must" sections`);
console.log(`   - Non-roleplay steps keep "YOUR TASK" as intended`);

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

