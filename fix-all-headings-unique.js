/**
 * Make ALL heading integrationIDs unique per step
 * This prevents CallVu from syncing "Check 4" across multiple screens
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

let fixedHeadings = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  const stepName = step.stepName;
  
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              // Fix ALL shared integrationIDs - make them unique per step
              if (field.integrationID === 'LargeHeading' && field.type === 'paragraph') {
                // Make integrationID unique per step
                const uniqueId = `LargeHeading_${stepName.replace(/\s+/g, '_')}`;
                field.integrationID = uniqueId;
                
                // Ensure the heading shows the correct title for this step
                if (field.editedParagraph) {
                  let content = field.editedParagraph;
                  
                  // Extract current h1 content
                  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
                  if (h1Match) {
                    const currentTitle = h1Match[1].trim();
                    
                    // Map step names to display titles
                    const titleMap = {
                      'Intro': 'Welcome',
                      'Rep Info': 'Your Information',
                      'Roleplay 1': 'Roleplay 1',
                      'Roleplay 2': 'Roleplay 2',
                      'Roleplay 3': 'Roleplay 3',
                      'Roleplay 4': 'Roleplay 4',
                      'Roleplay 5': 'Roleplay 5',
                      'Roleplay 6': 'Roleplay 6',
                      'Roleplay 7': 'Roleplay 7',
                      'Drill A': 'Drill A',
                      'Drill B': 'Drill B',
                      'Drill C': 'Drill C',
                      'Exercise Set A': 'Exercise Set A',
                      'Scenario 1': 'Scenario 1',
                      'Scenario 2': 'Scenario 2',
                      'Scenario 3': 'Scenario 3',
                      'Scenario 4': 'Scenario 4',
                      'Quiz 1': 'Quiz 1',
                      'Quiz 2': 'Quiz 2',
                      'Check 1': 'Check 1',
                      'Check 2': 'Check 2',
                      'Check 3': 'Check 3',
                      'Check 4': 'Check 4',
                      'Complete': 'Complete'
                    };
                    
                    const correctTitle = titleMap[stepName] || stepName;
                    
                    // If title is wrong, fix it
                    if (currentTitle !== correctTitle) {
                      content = content.replace(
                        /<h1[^>]*>([^<]+)<\/h1>/,
                        `<h1 style="text-align: center; color: #1f2937; font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">${correctTitle}</h1>`
                      );
                      field.editedParagraph = content;
                      fixedHeadings++;
                      console.log(`Fixed heading in "${stepName}": "${currentTitle}" -> "${correctTitle}"`);
                    }
                  } else {
                    // No h1 found, but this should have one - add it
                    const titleMap = {
                      'Intro': 'Welcome',
                      'Rep Info': 'Your Information',
                    };
                    const correctTitle = titleMap[stepName] || stepName;
                    // Don't add h1 if it's Intro or Rep Info (they might have different structure)
                    if (stepName !== 'Intro' && stepName !== 'Rep Info' && stepName !== 'Complete') {
                      // This shouldn't happen, but log it
                      console.log(`Warning: "${stepName}" heading field has no h1 tag`);
                    }
                  }
                }
              }
              
              // Also fix SmallHeading if it's shared
              if (field.integrationID === 'SmallHeading' && field.type === 'paragraph') {
                field.integrationID = `SmallHeading_${stepName.replace(/\s+/g, '_')}`;
              }
            });
          }
        });
      }
    });
  }
});

console.log(`\n✅ Made ${fixedHeadings} heading fields unique and corrected titles`);
console.log('   - Each step now has unique integrationID for headings');
console.log('   - This prevents CallVu from syncing content across steps');

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

