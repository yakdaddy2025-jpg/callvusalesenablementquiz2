/**
 * Remove "Your Response" longText fields from all roleplay steps
 * We'll just log to spreadsheet and enable Next button
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_READY_1764918572567.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_NO_RESPONSE_FIELD_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Removing "Your Response" fields from all roleplay steps...\n');

let removed = 0;

cvuf.form.steps.forEach((step) => {
  const stepName = step.stepName;
  
  if (!stepName.startsWith('Roleplay')) return;
  
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      if (row.fields) {
        // Remove fields that are longText with "response" in label
        row.fields = row.fields.filter(field => {
          const isResponseField = field.type === 'longText' && 
                                 field.label && 
                                 field.label.toLowerCase().includes('response');
          if (isResponseField) {
            removed++;
            console.log(`   ✅ Removed response field from ${stepName}`);
          }
          return !isResponseField;
        });
      }
    });
  });
});

console.log(`\n✅ Removed ${removed} "Your Response" field(s)`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

