/**
 * PREVENT SYNCING: Make ALL step fields completely unique
 * This will prevent CallVu from syncing content between any steps
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('🔧 PREVENTING SYNCING by making ALL step fields completely unique...\n');

let totalFixed = 0;

// Process ALL steps
cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName || `Step${stepIdx}`;
  console.log(`\n📋 Processing "${stepName}"...`);
  
  let stepFixed = 0;
  
  // Make step identifier unique
  const oldStepIdentifier = step.identifier;
  const uniqueStepSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  step.identifier = `step_${stepName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_unique${uniqueStepSuffix}`;
  if (oldStepIdentifier !== step.identifier) {
    console.log(`  ✅ Changed step identifier`);
    stepFixed++;
  }
  
  // Process all blocks and fields
  if (step.blocks) {
    step.blocks.forEach((block, blockIdx) => {
      // Make block identifier unique
      if (block.identifier) {
        const oldBlockIdentifier = block.identifier;
        block.identifier = `block_${stepName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${blockIdx}_unique${uniqueStepSuffix}`;
        if (oldBlockIdentifier !== block.identifier) {
          console.log(`  ✅ Changed block identifier`);
          stepFixed++;
        }
      }
      
      if (block.rows) {
        block.rows.forEach((row, rowIdx) => {
          if (row.fields) {
            row.fields.forEach((field, fieldIdx) => {
              // Generate completely unique identifiers using timestamp and random
              const fieldUniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              
              // Change identifier to be completely unique
              const oldIdentifier = field.identifier;
              const stepPrefix = stepName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
              field.identifier = `${stepPrefix}_unique_${fieldIdx}${fieldUniqueSuffix}`;
              if (oldIdentifier !== field.identifier) {
                stepFixed++;
              }
              
              // Change integrationID to be completely unique
              if (field.integrationID) {
                const oldIntegrationID = field.integrationID;
                // Check if it already has a unique suffix (from previous run)
                if (!oldIntegrationID.includes('_unique_') || oldIntegrationID.length < 30) {
                  field.integrationID = `${stepPrefix}_Unique_${fieldIdx}${fieldUniqueSuffix}`;
                  if (oldIntegrationID !== field.integrationID) {
                    stepFixed++;
                  }
                }
              } else {
                // Add a unique integrationID if it doesn't exist
                field.integrationID = `${stepPrefix}_Unique_${fieldIdx}${fieldUniqueSuffix}`;
                stepFixed++;
              }
              
              // Change the field name to be unique (if it's a paragraph)
              if (field.name && field.name.includes('paragraph')) {
                const oldName = field.name;
                field.name = `editor.fields.paragraph.${stepPrefix}.${fieldIdx}`;
                if (oldName !== field.name) {
                  stepFixed++;
                }
              }
              
              // Add a unique className to prevent any CSS-based syncing
              if (!field.className || field.className === '') {
                field.className = `${stepPrefix}-field-${fieldIdx}-${Date.now()}`;
              } else if (!field.className.includes(`${stepPrefix}-field`)) {
                field.className = `${field.className} ${stepPrefix}-field-${fieldIdx}-${Date.now()}`;
                stepFixed++;
              }
              
              // Add a unique tooltip to make it even more distinct
              if (!field.tooltip || field.tooltip === '') {
                field.tooltip = `${stepName} step field ${fieldIdx} - ${Date.now()}`;
                stepFixed++;
              }
            });
          }
        });
      }
    });
  }
  
  console.log(`  ✅ Fixed ${stepFixed} field(s) in "${stepName}"`);
  totalFixed += stepFixed;
});

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Made ${totalFixed} total changes to prevent syncing across ALL steps`);
console.log('\n💡 CRITICAL: Delete form in CallVu and re-import!');
console.log('   All fields in ALL steps now have completely unique identifiers.');
console.log('   This should prevent CallVu from syncing content between any steps.');

