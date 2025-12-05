/**
 * Check for common CVUF errors that prevent viewer from loading
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Checking for CVUF errors that prevent viewer from loading...\n');

const errors = [];
const warnings = [];

// Check 1: First step configuration
if (cvuf.form && cvuf.form.steps && cvuf.form.steps.length > 0) {
  const firstStep = cvuf.form.steps[0];
  
  if (firstStep.stepName !== 'Intro') {
    warnings.push(`⚠️  First step is "${firstStep.stepName}" - expected "Intro"`);
  }
  
  if (!firstStep.isFirstStep) {
    errors.push(`❌ First step missing "isFirstStep: true"`);
  } else {
    console.log('✅ First step has isFirstStep: true');
  }
  
  if (!firstStep.buttonsConfig || !firstStep.buttonsConfig.isFirstNode) {
    errors.push(`❌ First step buttonsConfig missing "isFirstNode: true"`);
  } else {
    console.log('✅ First step has isFirstNode: true');
  }
  
  if (!firstStep.identifier) {
    errors.push(`❌ First step missing identifier`);
  } else {
    console.log(`✅ First step identifier: ${firstStep.identifier}`);
  }
}

// Check 2: Step identifiers are unique
const identifiers = new Set();
cvuf.form.steps.forEach((step, idx) => {
  if (step.identifier) {
    if (identifiers.has(step.identifier)) {
      errors.push(`❌ Duplicate step identifier: ${step.identifier}`);
    } else {
      identifiers.add(step.identifier);
    }
  } else {
    errors.push(`❌ Step ${idx + 1} (${step.stepName}) missing identifier`);
  }
});

// Check 3: targetStep references are valid
const stepIdentifiers = new Set(cvuf.form.steps.map(s => s.identifier).filter(Boolean));
cvuf.form.steps.forEach((step) => {
  if (step.buttonsConfig && step.buttonsConfig.targetStep) {
    if (!stepIdentifiers.has(step.buttonsConfig.targetStep)) {
      errors.push(`❌ Step "${step.stepName}" has invalid targetStep: ${step.buttonsConfig.targetStep}`);
    }
  }
});

// Check 4: Blocks and rows structure
cvuf.form.steps.forEach((step, stepIdx) => {
  if (!step.blocks || !Array.isArray(step.blocks) || step.blocks.length === 0) {
    errors.push(`❌ Step "${step.stepName}" has no blocks`);
  } else {
    step.blocks.forEach((block, blockIdx) => {
      if (!block.rows || !Array.isArray(block.rows) || block.rows.length === 0) {
        errors.push(`❌ Block ${blockIdx} in "${step.stepName}" has no rows`);
      }
    });
  }
});

// Check 5: JSON validity
try {
  const jsonString = JSON.stringify(cvuf);
  if (jsonString.length === 0) {
    errors.push('❌ CVUF file is empty');
  }
} catch (e) {
  errors.push(`❌ JSON is invalid: ${e.message}`);
}

// Report
console.log('\n📋 Results:');
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ No critical errors found');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ Critical Errors (${errors.length}):`);
    errors.forEach(err => console.log(`   ${err}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warn => console.log(`   ${warn}`));
  }
}

if (errors.length > 0) {
  console.log('\n💡 These errors will prevent the form from loading in CallVu viewer');
  process.exit(1);
} else {
  console.log('\n✅ CVUF structure looks good - issue might be in CallVu platform');
  console.log('   - Try re-importing the CVUF file');
  console.log('   - Check CallVu Studio for any error messages');
  console.log('   - Verify the form is published/activated');
}

