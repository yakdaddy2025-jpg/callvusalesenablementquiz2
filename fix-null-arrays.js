/**
 * Fix null arrays - CallVu expects arrays, not null
 * Replace all null values that should be arrays with empty arrays
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Properties that must be arrays, not null
const arrayProperties = [
  'actions',
  'calculatedFields',
  'globalVariables',
  'newRules',
  'steps',
  'rows',
  'fields',
  'items',
  'validations',
  'blocks'
];

// Recursively fix null arrays
function fixNullArrays(obj, path = '') {
  if (obj === null) {
    return [];
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return fixNullArrays(item, `${path}[${idx}]`);
      }
      return item;
    });
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const fixed = {};
    for (const key in obj) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      // If this property should be an array and is null, make it an empty array
      if (value === null && arrayProperties.includes(key)) {
        fixed[key] = [];
        console.log(`Fixed: ${currentPath} (null -> [])`);
      } else if (typeof value === 'object' && value !== null) {
        fixed[key] = fixNullArrays(value, currentPath);
      } else {
        fixed[key] = value;
      }
    }
    return fixed;
  }
  
  return obj;
}

console.log('Fixing null arrays in CVUF...');
const fixed = fixNullArrays(cvuf);

// Also ensure specific top-level properties are arrays
if (!Array.isArray(fixed.form.actions)) fixed.form.actions = [];
if (!Array.isArray(fixed.form.calculatedFields)) fixed.form.calculatedFields = [];
if (!Array.isArray(fixed.form.globalVariables)) fixed.form.globalVariables = [];
if (!Array.isArray(fixed.form.newRules)) fixed.form.newRules = [];
if (!Array.isArray(fixed.form.steps)) fixed.form.steps = [];

// Ensure steps have proper structure
fixed.form.steps.forEach((step, stepIdx) => {
  if (!Array.isArray(step.blocks)) {
    console.log(`Fixing step ${stepIdx}: blocks is not array`);
    step.blocks = [];
  }
  
  step.blocks.forEach((block, blockIdx) => {
    if (!Array.isArray(block.rows)) {
      console.log(`Fixing step ${stepIdx}, block ${blockIdx}: rows is not array`);
      block.rows = [];
    }
    
    block.rows.forEach((row, rowIdx) => {
      if (!Array.isArray(row.fields)) {
        console.log(`Fixing step ${stepIdx}, block ${blockIdx}, row ${rowIdx}: fields is not array`);
        row.fields = [];
      }
      
      row.fields.forEach((field, fieldIdx) => {
        if (!Array.isArray(field.validations)) {
          field.validations = [];
        }
        if (field.items && !Array.isArray(field.items)) {
          field.items = [];
        }
      });
    });
  });
});

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
console.log('✅ Fixed all null arrays');
console.log('   - All array properties are now arrays, not null');
console.log('   - File ready to import');

