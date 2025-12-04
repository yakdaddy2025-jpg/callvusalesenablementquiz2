/**
 * Fix first step rendering issue - ensure Intro step is properly configured
 * The form is showing "Block 1" instead of the actual content
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Find the Intro step (first step)
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro' || step.identifier === 'step_intro');

if (!introStep) {
  console.error('❌ Intro step not found!');
  process.exit(1);
}

console.log('Found Intro step:', introStep.stepName);

// Ensure Intro step is marked as first step
introStep.isFirstStep = true;
introStep.isLastStep = false;

// Ensure buttonsConfig has isFirstNode
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
} else {
  introStep.buttonsConfig = {
    back: { className: "", isHidden: true, text: "" },
    next: { className: "", isHidden: false, text: "Begin Quiz" },
    targetStep: "step_rep_info",
    isFirstNode: true
  };
}

// Ensure Intro step has blocks
if (!introStep.blocks || !Array.isArray(introStep.blocks) || introStep.blocks.length === 0) {
  console.error('❌ Intro step has no blocks!');
  process.exit(1);
}

// Check first block
const firstBlock = introStep.blocks[0];
console.log('First block:', {
  blockName: firstBlock.blockName,
  identifier: firstBlock.identifier,
  type: firstBlock.type,
  rowsCount: firstBlock.rows ? firstBlock.rows.length : 0
});

// Ensure block has proper structure
if (!firstBlock.identifier) {
  firstBlock.identifier = 'block_intro';
}

if (!firstBlock.type) {
  firstBlock.type = 'regular';
}

// Ensure block has rows with fields
if (!firstBlock.rows || !Array.isArray(firstBlock.rows) || firstBlock.rows.length === 0) {
  console.error('❌ First block has no rows!');
  process.exit(1);
}

// Check if blockName is empty or generic
if (!firstBlock.blockName || firstBlock.blockName === 'Block 1' || firstBlock.blockName.trim() === '') {
  firstBlock.blockName = ''; // Empty is fine, but ensure it's not "Block 1"
  console.log('Fixed blockName (was empty or "Block 1")');
}

// Ensure all other steps are not marked as first
cvuf.form.steps.forEach((step, idx) => {
  if (step.stepName !== 'Intro' && step.identifier !== 'step_intro') {
    step.isFirstStep = false;
    if (step.buttonsConfig) {
      step.buttonsConfig.isFirstNode = false;
    }
  } else if (idx === 0) {
    // Ensure first step in array is Intro
    step.isFirstStep = true;
  }
});

// Ensure form-level properties are correct
cvuf.form.isSinglePage = false;
cvuf.form.isFormReadonly = false;

console.log('\n✅ Fixed Intro step configuration:');
console.log('   - isFirstStep: true');
console.log('   - buttonsConfig.isFirstNode: true');
console.log('   - Block structure verified');
console.log('   - All other steps marked as not first');

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
console.log('✅ File updated');

