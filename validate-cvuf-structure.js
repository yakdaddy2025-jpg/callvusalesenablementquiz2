/**
 * Validate CVUF structure against CallVu requirements
 * Check for common issues and best practices
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Validating CVUF structure...\n');

const issues = [];
const warnings = [];

// Check 1: Form structure
if (!cvuf.form) {
  issues.push('❌ Missing "form" object');
} else {
  console.log('✅ Form object exists');
  
  // Check required form properties
  if (!cvuf.form.formName) warnings.push('⚠️  formName is empty');
  if (!cvuf.form.steps || !Array.isArray(cvuf.form.steps)) {
    issues.push('❌ Missing or invalid "steps" array');
  } else {
    console.log(`✅ Found ${cvuf.form.steps.length} steps`);
  }
}

// Check 2: Step structure
if (cvuf.form && cvuf.form.steps) {
  cvuf.form.steps.forEach((step, idx) => {
    const stepName = step.stepName || `Step ${idx + 1}`;
    
    if (!step.blocks || !Array.isArray(step.blocks)) {
      issues.push(`❌ Step "${stepName}" missing blocks array`);
    } else {
      step.blocks.forEach((block, blockIdx) => {
        if (!block.rows || !Array.isArray(block.rows)) {
          issues.push(`❌ Block ${blockIdx} in "${stepName}" missing rows array`);
        } else {
          block.rows.forEach((row, rowIdx) => {
            if (!row.fields || !Array.isArray(row.fields)) {
              issues.push(`❌ Row ${rowIdx} in block ${blockIdx} of "${stepName}" missing fields array`);
            } else {
              row.fields.forEach((field, fieldIdx) => {
                // Check field properties
                if (!field.type) {
                  issues.push(`❌ Field ${fieldIdx} in row ${rowIdx} of "${stepName}" missing type`);
                }
                if (field.type === 'paragraph' && !field.editedParagraph) {
                  warnings.push(`⚠️  Paragraph field ${fieldIdx} in "${stepName}" has no content`);
                }
                // Check for proper permissions
                if (field.permission !== 'both' && field.permission !== 'client' && field.permission !== 'admin') {
                  if (field.type !== 'button') { // Buttons might not need permission
                    warnings.push(`⚠️  Field ${fieldIdx} in "${stepName}" has unusual permission: ${field.permission}`);
                  }
                }
              });
            }
          });
        }
      });
    }
    
    // Check button config
    if (!step.buttonsConfig) {
      warnings.push(`⚠️  Step "${stepName}" missing buttonsConfig`);
    }
  });
}

// Check 3: Voice recorder fields
let voiceRecorderCount = 0;
let answerFieldCount = 0;

if (cvuf.form && cvuf.form.steps) {
  cvuf.form.steps.forEach((step) => {
    if (step.blocks) {
      step.blocks.forEach((block) => {
        if (block.rows) {
          block.rows.forEach((row) => {
            if (row.fields) {
              row.fields.forEach((field) => {
                if (field.type === 'paragraph' && field.editedParagraph) {
                  const content = field.editedParagraph;
                  if (content.includes('voice-recorder-container') || content.includes('<iframe')) {
                    voiceRecorderCount++;
                  }
                }
                if (field.integrationID && field.integrationID.startsWith('Answer_')) {
                  answerFieldCount++;
                }
              });
            }
          });
        }
      });
    }
  });
}

console.log(`\n📊 Statistics:`);
console.log(`   - Voice recorders found: ${voiceRecorderCount}`);
console.log(`   - Answer fields found: ${answerFieldCount}`);

// Check 4: JSON validity
try {
  JSON.stringify(cvuf);
  console.log('\n✅ JSON is valid');
} catch (e) {
  issues.push(`❌ JSON validation failed: ${e.message}`);
}

// Report issues
console.log('\n📋 Validation Results:');
if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No issues found!');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ Critical Issues (${issues.length}):`);
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
}

// Recommendations
console.log('\n💡 Recommendations:');
console.log('   1. Ensure all fields have proper "permission" set (usually "both" for editable fields)');
console.log('   2. Ensure all fields have "localOnly: false" if they should be editable in designer');
console.log('   3. Check CallVu documentation for paragraph field HTML/JS embedding:');
console.log('      https://callvu.gitbook.io/callvu-studio/forms/fields');
console.log('   4. Verify formCustomStyle is properly formatted if used');
console.log('   5. Test in CallVu Studio designer to ensure all fields are editable');

process.exit(issues.length > 0 ? 1 : 0);

