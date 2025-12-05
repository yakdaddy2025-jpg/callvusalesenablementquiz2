/**
 * Fix 400 Bad Request error when saving in CallVu Studio
 * Common causes: invalid data, null values, oversized content, encoding issues
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
let cvuf;

try {
  cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));
} catch (e) {
  console.error('❌ JSON parse error:', e.message);
  process.exit(1);
}

console.log('🔧 Fixing issues that prevent saving in CallVu Studio...\n');

let fixedCount = 0;
const issues = [];

// Fix 1: Remove null values that might cause issues
function removeNulls(obj, path = '') {
  if (obj === null || obj === undefined) {
    return {};
  }
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => removeNulls(item, `${path}[${idx}]`));
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null) {
        cleaned[key] = removeNulls(obj[key], `${path}.${key}`);
      } else {
        issues.push(`Removed null value at ${path}.${key}`);
        fixedCount++;
      }
    });
    return cleaned;
  }
  return obj;
}

// Fix 2: Ensure all required arrays exist
if (!cvuf.form.actions || !Array.isArray(cvuf.form.actions)) {
  cvuf.form.actions = [];
  fixedCount++;
}
if (!cvuf.form.calculatedFields || !Array.isArray(cvuf.form.calculatedFields)) {
  cvuf.form.calculatedFields = [];
  fixedCount++;
}
if (!cvuf.form.globalVariables || !Array.isArray(cvuf.form.globalVariables)) {
  cvuf.form.globalVariables = [];
  fixedCount++;
}

// Fix 3: Clean up steps
cvuf.form.steps = cvuf.form.steps.map((step, stepIdx) => {
  // Ensure blocks is an array
  if (!step.blocks || !Array.isArray(step.blocks)) {
    step.blocks = [];
    fixedCount++;
  }
  
  step.blocks = step.blocks.map((block, blockIdx) => {
    // Ensure rows is an array
    if (!block.rows || !Array.isArray(block.rows)) {
      block.rows = [];
      fixedCount++;
    }
    
    block.rows = block.rows.map((row, rowIdx) => {
      // Ensure fields is an array
      if (!row.fields || !Array.isArray(row.fields)) {
        row.fields = [];
        fixedCount++;
      }
      
      // Clean up fields
      row.fields = row.fields.map((field, fieldIdx) => {
        // Remove null values
        Object.keys(field).forEach(key => {
          if (field[key] === null) {
            delete field[key];
            fixedCount++;
          }
        });
        
        // Ensure validations is an array
        if (!field.validations || !Array.isArray(field.validations)) {
          field.validations = [];
        }
        
        // Check for extremely large content (might exceed CallVu limits)
        if (field.editedParagraph && field.editedParagraph.length > 50000) {
          issues.push(`⚠️  Field in step "${step.stepName}" has very large content (${field.editedParagraph.length} chars)`);
        }
        
        // Ensure type exists
        if (!field.type) {
          field.type = 'paragraph';
          fixedCount++;
        }
        
        // Ensure name exists for non-paragraph fields
        if (field.type !== 'paragraph' && !field.name) {
          if (field.type === 'shortText') {
            field.name = 'editor.fields.shortText';
          } else if (field.type === 'longText') {
            field.name = 'editor.fields.longText';
          } else if (field.type === 'email') {
            field.name = 'editor.fields.email';
          }
          fixedCount++;
        }
        
        return field;
      }).filter(field => field !== null && field !== undefined);
      
      return row;
    });
    
    return block;
  });
  
  // Ensure buttonsConfig exists
  if (!step.buttonsConfig) {
    step.buttonsConfig = {
      back: { className: '', isHidden: true, text: '' },
      next: { className: '', isHidden: false, text: 'Continue' },
      targetStep: ''
    };
    fixedCount++;
  }
  
  // Ensure identifier exists
  if (!step.identifier) {
    step.identifier = `step_${stepIdx}`;
    fixedCount++;
  }
  
  return step;
});

// Fix 4: Ensure form-level objects exist
if (!cvuf.form.approveData) {
  cvuf.form.approveData = {
    enabled: false,
    forceApproveBeforeShowingDownload: false,
    toCloseForm: false,
    popupObj: { errorMsg: '', fieldType: '', message: '', title: '' },
    submitIcon: ''
  };
  fixedCount++;
}

if (!cvuf.form.expirationObj) {
  cvuf.form.expirationObj = {};
  fixedCount++;
}

if (!cvuf.form.hintMsgProps) {
  cvuf.form.hintMsgProps = { text: '', hideOnScroll: false };
  fixedCount++;
}

if (!cvuf.form.otp) {
  cvuf.form.otp = {
    buttonText: '',
    description: '',
    emptyFieldValidation: '',
    invalidFieldValidation: '',
    isActive: false,
    label: '',
    logo: '',
    logoName: '',
    resendText: '',
    serviceUrl: '',
    title: '',
    validResponse: false,
    validateUrl: false,
    redirectAfterSubmit: false,
    redirectLink: '',
    isAuth: false,
    optionalFields: []
  };
  fixedCount++;
}

// Fix 5: Ensure empty strings for optional fields
if (cvuf.form.formCustomStyle === null || cvuf.form.formCustomStyle === undefined) {
  cvuf.form.formCustomStyle = '';
  fixedCount++;
}

if (cvuf.form.last_update === null || cvuf.form.last_update === undefined) {
  cvuf.form.last_update = '';
  fixedCount++;
}

// Fix 6: Validate JSON
try {
  const jsonString = JSON.stringify(cvuf);
  if (jsonString.length === 0) {
    console.error('❌ JSON is empty after cleaning!');
    process.exit(1);
  }
  console.log(`✅ JSON is valid (${(jsonString.length / 1024).toFixed(2)} KB)`);
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));

console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
if (issues.length > 0) {
  console.log(`\n⚠️  Warnings:`);
  issues.forEach(issue => console.log(`   ${issue}`));
}

console.log('\n✅ CVUF file cleaned and ready to save');
console.log('\n💡 Try saving again in CallVu Studio');
console.log('   If it still fails, check the browser console for specific error details');

