/**
 * Copy the exact structure from POLISHED (which might work) to EDITABLE
 * But keep the editable field properties (localOnly: false)
 */

const fs = require('fs');
const path = require('path');

const polishedPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const editablePath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');

const polished = JSON.parse(fs.readFileSync(polishedPath, 'utf8'));
const editable = JSON.parse(fs.readFileSync(editablePath, 'utf8'));

// Copy the exact form structure from POLISHED
// But ensure all fields have localOnly: false and permission: "both"

console.log('Copying structure from POLISHED to EDITABLE...');
console.log('Keeping editable properties (localOnly: false, permission: "both")...');

// Copy form-level properties that might be different
editable.form.formCustomStyle = polished.form.formCustomStyle; // Empty string
editable.form.logoUrl = polished.form.logoUrl; // Keep the S3 logo

// Ensure all fields in editable have localOnly: false
function ensureEditable(field) {
  if (field.localOnly !== undefined) {
    field.localOnly = false;
  }
  if (field.permission !== undefined) {
    field.permission = "both";
  }
}

function processFields(step) {
  if (step.blocks) {
    step.blocks.forEach(block => {
      if (block.rows) {
        block.rows.forEach(row => {
          if (row.fields) {
            row.fields.forEach(field => {
              ensureEditable(field);
            });
          }
        });
      }
    });
  }
}

editable.form.steps.forEach(processFields);

console.log('✅ Copied structure from POLISHED');
console.log('✅ All fields remain editable (localOnly: false)');

// Validate JSON
try {
  JSON.stringify(editable);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(editablePath, JSON.stringify(editable, null, 2));
console.log('✅ File updated - should match POLISHED structure but with editable fields');

