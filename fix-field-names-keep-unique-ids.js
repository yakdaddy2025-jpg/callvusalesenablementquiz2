/**
 * FIX: Revert field names to standard CallVu format
 * Keep unique identifiers and integrationIDs (those are fine)
 * But field.name must be standard CallVu format
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 Fixing field names to standard CallVu format...\n');

let fixedCount = 0;

// Process ALL steps
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Fix field.name - must be standard CallVu format
              if (field.name) {
                const oldName = field.name;
                
                // Revert to standard CallVu field names based on type
                if (field.type === 'paragraph') {
                  field.name = 'editor.fields.paragraph';
                } else if (field.type === 'shortText') {
                  field.name = 'editor.fields.shortText';
                } else if (field.type === 'email') {
                  field.name = 'editor.fields.email';
                } else if (field.type === 'radio') {
                  field.name = 'editor.fields.radio';
                } else if (field.type === 'checkbox') {
                  field.name = 'editor.fields.checkbox';
                } else if (field.type === 'longText') {
                  field.name = 'editor.fields.longText';
                } else if (field.type === 'number') {
                  field.name = 'editor.fields.number';
                } else if (field.type === 'date') {
                  field.name = 'editor.fields.date';
                } else if (field.type === 'select') {
                  field.name = 'editor.fields.select';
                }
                // Keep other types as-is if they're already standard
                
                if (oldName !== field.name) {
                  console.log(`✅ Fixed field name in "${stepName}": "${oldName}" → "${field.name}"`);
                  fixedCount++;
                }
              }
            });
          }
        });
      }
    });
  }
});

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} field name(s)`);
console.log('\n💡 Field names are now standard CallVu format.');
console.log('   Unique identifiers and integrationIDs are kept (those are fine).');
console.log('   This should fix the 400 Bad Request error.');

