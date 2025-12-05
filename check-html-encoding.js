/**
 * Check if HTML/JS in paragraph fields might be causing 400 errors
 * CallVu might be rejecting malformed HTML or script tags
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

console.log('Checking HTML/JS in paragraph fields for potential issues...\n');

const issues = [];
let scriptTagCount = 0;
let onclickCount = 0;

cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                const content = field.editedParagraph;
                
                // Count script tags
                const scriptMatches = content.match(/<script[^>]*>/gi);
                if (scriptMatches) {
                  scriptTagCount += scriptMatches.length;
                }
                
                // Count onclick handlers
                const onclickMatches = content.match(/onclick\s*=/gi);
                if (onclickMatches) {
                  onclickCount += onclickMatches.length;
                }
                
                // Check for unclosed tags
                const openDivs = (content.match(/<div/gi) || []).length;
                const closeDivs = (content.match(/<\/div>/gi) || []).length;
                if (openDivs !== closeDivs) {
                  issues.push(`⚠️  Unclosed div tags in "${step.stepName}" (${openDivs} open, ${closeDivs} close)`);
                }
                
                // Check for unclosed script tags
                const openScripts = (content.match(/<script/gi) || []).length;
                const closeScripts = (content.match(/<\/script>/gi) || []).length;
                if (openScripts !== closeScripts) {
                  issues.push(`❌ Unclosed script tags in "${step.stepName}" (${openScripts} open, ${closeScripts} close)`);
                }
                
                // Check for invalid characters that might break JSON
                if (content.includes('\n') && !content.includes('\\n')) {
                  // Newlines should be escaped in JSON strings
                  // But since we're storing in JSON, they should be fine
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`📊 Statistics:`);
console.log(`   - Script tags found: ${scriptTagCount}`);
console.log(`   - onclick handlers found: ${onclickCount}`);

if (issues.length > 0) {
  console.log(`\n⚠️  Issues found:`);
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('\n✅ No obvious HTML structure issues found');
}

console.log('\n💡 The 400 error might be caused by:');
console.log('   1. CallVu rejecting script tags in paragraph fields');
console.log('   2. CallVu backend validation failing on the form structure');
console.log('   3. Invalid field configurations that CallVu doesn\'t accept');
console.log('\n💡 Try:');
console.log('   1. Re-import the CVUF file in CallVu Studio');
console.log('   2. Check if CallVu has any error messages in the Studio');
console.log('   3. Try removing one voice recorder field and test if form loads');
console.log('   4. Contact CallVu support with the 400 error details');

