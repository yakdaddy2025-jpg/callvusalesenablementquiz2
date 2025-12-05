/**
 * Fix Intro step - ensure it has correct content and no "AE must explain" content
 * Also ensure integrationIDs are unique to prevent content syncing
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Fixing Intro step...\n');

// Find Intro step
const introStep = cvuf.form.steps.find(step => step.stepName === 'Intro');

if (!introStep) {
  console.error('❌ Intro step not found!');
  process.exit(1);
}

// Make sure integrationIDs are unique for Intro step
let fieldCount = 0;
introStep.blocks.forEach((block) => {
  if (block.rows) {
    block.rows.forEach((row) => {
      if (row.fields) {
        row.fields.forEach((field) => {
          // Make integrationIDs unique per field
          if (field.type === 'paragraph') {
            if (field.integrationID === 'SmallHeading' || field.integrationID === 'LargeHeading') {
              field.integrationID = `Intro_${field.integrationID}`;
              console.log(`✅ Made integrationID unique: ${field.integrationID}`);
            }
            
            // Remove any "AE must explain" content from Intro step
            if (field.editedParagraph && field.editedParagraph.includes('AE must explain')) {
              console.log('⚠️  Found "AE must explain" in Intro step - removing');
              // Replace with proper intro content
              field.editedParagraph = `<div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">
<p style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0 auto;">
This assessment will test your understanding of CallVu's Mode A and Mode B architecture.
</p>
<p style="margin-top: 24px; color: #6b7280; font-size: 14px;"><strong>Instructions:</strong></p>
<ul style="color: #4b5563; font-size: 14px; line-height: 1.8;">
  <li>Each question requires a voice response</li>
  <li>Speak clearly and cover all key points</li>
  <li>Your responses will be recorded and reviewed</li>
  <li>You can keep or delete your response to try again</li>
</ul>
<p style="margin-top: 16px; color: #9ca3af; font-size: 13px; font-style: italic;">Time estimate: 20-30 minutes</p>
</div>`;
            }
          }
          fieldCount++;
        });
      }
    });
  }
});

// Ensure isFirstStep and isFirstNode are correct
introStep.isFirstStep = true;
if (introStep.buttonsConfig) {
  introStep.buttonsConfig.isFirstNode = true;
}

console.log(`✅ Fixed Intro step (${fieldCount} fields checked)`);
console.log(`✅ Ensured isFirstStep: true and isFirstNode: true`);

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('\n✅ CVUF file updated');
console.log('\n💡 Next steps:');
console.log('   1. Re-import the CVUF file into CallVu');
console.log('   2. Make sure to SAVE the form in CallVu Studio');
console.log('   3. PUBLISH the form (not just save)');
console.log('   4. Use the published form URL (not the studio URL)');
console.log('   5. Clear browser cache if you still see old content');

