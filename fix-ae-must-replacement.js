/**
 * Fix "YOUR TASK" to "AE MUST" replacement in roleplay steps
 * Check the exact format and replace it properly
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

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  const isRoleplay = roleplaySteps.includes(stepName);
  
  if (!isRoleplay) {
    return; // Skip non-roleplay steps
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                let content = field.editedParagraph;
                const originalContent = content;
                
                // Try multiple replacement patterns
                // Pattern 1: <strong>YOUR TASK:</strong>
                content = content.replace(
                  /<strong[^>]*>YOUR TASK:<\/strong>/gi,
                  '<strong style="color: #1f2937;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">AE MUST:</strong>'
                );
                
                // Pattern 2: YOUR TASK: (without strong tags, but in the text)
                content = content.replace(
                  /YOUR TASK:/gi,
                  'AE MUST:'
                );
                
                // Pattern 3: "YOUR TASK:" in any context
                if (content.includes('YOUR TASK') || content.includes('Your Task')) {
                  content = content.replace(
                    /(YOUR TASK|Your Task)/gi,
                    'AE MUST'
                  );
                }
                
                if (content !== originalContent) {
                  field.editedParagraph = content;
                  replacedCount++;
                  console.log(`✅ Replaced "YOUR TASK" with "AE MUST" in "${stepName}"`);
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Replaced "YOUR TASK" with "AE MUST" in ${replacedCount} roleplay step(s)`);
console.log(`   - Only roleplay steps (1-7) have "AE MUST"`);
console.log(`   - Other steps (drills, scenarios, etc.) keep "YOUR TASK"`);

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

