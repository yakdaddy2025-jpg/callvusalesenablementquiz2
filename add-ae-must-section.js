/**
 * Add "AE must" section to roleplay steps
 * This section should appear after SCENARIO and before YOUR TASK
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Roleplay steps that need the "AE must" section
const roleplaySteps = [
  'Roleplay 1', 'Roleplay 2', 'Roleplay 3', 'Roleplay 4', 'Roleplay 5', 'Roleplay 6', 'Roleplay 7'
];

// Template for "AE must" section
// Note: The actual content should be customized per roleplay, but this is a placeholder structure
function createAEMustSection() {
  return `<div class="mobile-wrap-container" style="word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;padding:0 5px!important;">
  <div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 16px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">
      <strong style="color: #1f2937;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">AE MUST:</strong>
    </p>
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 8px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">
      [AE must content - to be filled in by user in CallVu designer]
    </p>
  </div>
</div>`;
}

let addedCount = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (!roleplaySteps.includes(stepName)) {
    return;
  }
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        // Find the row with "YOUR TASK" - we'll insert "AE must" before it
        let yourTaskRowIndex = -1;
        let scenarioRowIndex = -1;
        
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('YOUR TASK:')) {
                  yourTaskRowIndex = rowIdx;
                }
                if (content.includes('SCENARIO:')) {
                  scenarioRowIndex = rowIdx;
                }
              }
            });
          }
        });
        
        // Check if "AE must" section already exists
        let hasAEMust = false;
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                if (content.includes('AE MUST:') || content.includes('AE must:')) {
                  hasAEMust = true;
                }
              }
            });
          }
        });
        
        // Add "AE must" section if it doesn't exist
        if (!hasAEMust && yourTaskRowIndex !== -1) {
          const aeMustRow = {
            fields: [
              {
                className: "",
                clearable: false,
                hint: "",
                identifier: `ae_must_${stepName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
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
                editedParagraph: createAEMustSection(),
                localOnly: false
              }
            ]
          };
          
          // Insert before "YOUR TASK" row
          block.rows.splice(yourTaskRowIndex, 0, aeMustRow);
          addedCount++;
          console.log(`✅ Added "AE must" section to "${stepName}"`);
        } else if (hasAEMust) {
          console.log(`ℹ️  "${stepName}" already has "AE must" section`);
        } else {
          console.log(`⚠️  Could not find "YOUR TASK" row in "${stepName}"`);
        }
      }
    });
  }
});

console.log(`\n✅ Added ${addedCount} "AE must" sections to roleplay steps`);
console.log('   - Section appears after SCENARIO and before YOUR TASK');
console.log('   - Content can be edited in CallVu designer');

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

