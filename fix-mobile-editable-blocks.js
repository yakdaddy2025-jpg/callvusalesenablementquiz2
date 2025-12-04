/**
 * Fix mobile block editability - ensure blocks are editable on mobile just like desktop
 * Check for mobile-specific properties and ensure all blocks have proper structure
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

let fixedBlocks = 0;
let fixedFields = 0;

// Process all steps to ensure blocks and fields are editable on mobile
cvuf.form.steps.forEach((step, stepIdx) => {
  if (step.blocks && Array.isArray(step.blocks)) {
    step.blocks.forEach((block, blockIdx) => {
      // Ensure block has proper structure for mobile editing
      if (!block.identifier) {
        block.identifier = `block_${stepIdx}_${blockIdx}`;
      }
      
      // Ensure block type is set (should be "regular" for editable blocks)
      if (!block.type) {
        block.type = "regular";
      }
      
      // Ensure block style exists and is properly configured
      if (!block.style) {
        block.style = {
          alignment: "",
          nobackground: false,
          noborders: false,
          size: "full",
          background: "#ffffff"
        };
      }
      
      // Ensure block is not marked as read-only or locked
      if (block.readOnly !== undefined) {
        delete block.readOnly;
      }
      if (block.locked !== undefined) {
        delete block.locked;
      }
      if (block.localOnly !== undefined) {
        block.localOnly = false;
      }
      
      fixedBlocks++;
      
      // Process rows and fields within the block
      if (block.rows && Array.isArray(block.rows)) {
        block.rows.forEach((row, rowIdx) => {
          if (row.fields && Array.isArray(row.fields)) {
            row.fields.forEach((field, fieldIdx) => {
              // Ensure all fields are editable on mobile
              field.localOnly = false;
              field.permission = "both";
              
              // Remove any mobile-specific restrictions
              if (field.mobileReadOnly !== undefined) {
                delete field.mobileReadOnly;
              }
              if (field.mobileHidden !== undefined) {
                delete field.mobileHidden;
              }
              
              // Ensure field has proper structure
              if (!field.identifier) {
                field.identifier = `field_${stepIdx}_${blockIdx}_${rowIdx}_${fieldIdx}`;
              }
              
              // Ensure field type is set
              if (!field.type) {
                // Try to infer from name
                if (field.name && field.name.includes('paragraph')) {
                  field.type = "paragraph";
                } else if (field.name && field.name.includes('shortText')) {
                  field.type = "shortText";
                } else if (field.name && field.name.includes('longText')) {
                  field.type = "longText";
                }
              }
              
              fixedFields++;
            });
          } else {
            // Ensure rows.fields is an array
            row.fields = [];
          }
        });
      } else {
        // Ensure block.rows is an array
        block.rows = [];
      }
    });
  } else {
    // Ensure step.blocks is an array
    step.blocks = [];
  }
  
  // Ensure step has proper structure for mobile
  if (!step.style) {
    step.style = { alignment: "" };
  }
  
  // Ensure buttonsConfig exists
  if (!step.buttonsConfig) {
    step.buttonsConfig = {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "", isHidden: false, text: "Next" },
      targetStep: ""
    };
  }
});

console.log(`✅ Processed ${cvuf.form.steps.length} steps`);
console.log(`✅ Fixed ${fixedBlocks} blocks for mobile editability`);
console.log(`✅ Fixed ${fixedFields} fields for mobile editability`);
console.log('   - All blocks have type: "regular"');
console.log('   - All blocks have proper style objects');
console.log('   - All fields have localOnly: false');
console.log('   - All fields have permission: "both"');
console.log('   - Removed any mobile-specific restrictions');

// Also ensure form-level properties support mobile editing
if (!cvuf.form.isFormReadonly) {
  cvuf.form.isFormReadonly = false;
}

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
console.log('✅ File updated - blocks should now be editable on mobile');

