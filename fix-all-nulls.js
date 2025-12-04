/**
 * Comprehensive fix for all null values that should be arrays or objects
 * CallVu's filter() calls expect arrays, not null
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Properties that must be arrays
const arrayProps = ['actions', 'calculatedFields', 'globalVariables', 'newRules', 'steps', 
                   'rows', 'fields', 'items', 'validations', 'blocks', 'optionalFields'];

// Properties that must be objects
const objectProps = ['approveData', 'popupObj', 'expirationObj', 'hintMsgProps', 'otp', 
                    'theme', 'backgroundUrl', 'formCSS', 'buttonsConfig', 'style'];

let fixedCount = 0;

function fixNulls(obj, path = 'form') {
  if (obj === null || obj === undefined) {
    return {};
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return fixNulls(item, `${path}[${idx}]`);
      }
      return item;
    });
  }
  
  if (typeof obj === 'object') {
    const fixed = {};
    for (const key in obj) {
      const value = obj[key];
      const currentPath = `${path}.${key}`;
      
      if (value === null) {
        if (arrayProps.includes(key)) {
          fixed[key] = [];
          fixedCount++;
          console.log(`Fixed array: ${currentPath} (null -> [])`);
        } else if (objectProps.includes(key)) {
          fixed[key] = {};
          fixedCount++;
          console.log(`Fixed object: ${currentPath} (null -> {})`);
        } else {
          // For other nulls, keep as null or convert to empty string based on context
          if (key === 'id') {
            fixed[key] = null; // id can be null
          } else if (typeof obj[key] === 'string' || key.includes('Url') || key.includes('Link')) {
            fixed[key] = '';
          } else {
            fixed[key] = null;
          }
        }
      } else if (typeof value === 'object') {
        fixed[key] = fixNulls(value, currentPath);
      } else {
        fixed[key] = value;
      }
    }
    return fixed;
  }
  
  return obj;
}

console.log('Fixing all null arrays and objects...');
const fixed = fixNulls(cvuf);

// Ensure top-level form properties are correct
if (!Array.isArray(fixed.form.actions)) fixed.form.actions = [];
if (!Array.isArray(fixed.form.calculatedFields)) fixed.form.calculatedFields = [];
if (!Array.isArray(fixed.form.globalVariables)) fixed.form.globalVariables = [];
if (!Array.isArray(fixed.form.newRules)) fixed.form.newRules = [];
if (!Array.isArray(fixed.form.steps)) fixed.form.steps = [];

// Ensure steps structure
fixed.form.steps.forEach((step, stepIdx) => {
  if (!step.blocks || !Array.isArray(step.blocks)) {
    step.blocks = [];
  }
  
  step.blocks.forEach((block, blockIdx) => {
    if (!block.rows || !Array.isArray(block.rows)) {
      block.rows = [];
    }
    
    block.rows.forEach((row, rowIdx) => {
      if (!row.fields || !Array.isArray(row.fields)) {
        row.fields = [];
      }
      
      row.fields.forEach((field) => {
        if (!field.validations || !Array.isArray(field.validations)) {
          field.validations = [];
        }
        if (field.items !== undefined && !Array.isArray(field.items)) {
          field.items = [];
        }
      });
    });
  });
  
  // Ensure buttonsConfig exists
  if (!step.buttonsConfig) {
    step.buttonsConfig = {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "", isHidden: false, text: "Next" },
      targetStep: ""
    };
  }
  
  // Ensure style exists
  if (!step.style) {
    step.style = { alignment: "" };
  }
});

console.log(`\n✅ Fixed ${fixedCount} null values`);
console.log('✅ All arrays and objects are properly initialized');

// Validate JSON
try {
  JSON.stringify(fixed);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(fixed, null, 2));
console.log('✅ File updated and ready to import');

