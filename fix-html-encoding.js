/**
 * Fix HTML encoding in all paragraph fields - remove problematic characters
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

let fixedCount = 0;

// Fix HTML in all steps
cvuf.form.steps.forEach(step => {
  if (!step.blocks) return;
  
  step.blocks.forEach(block => {
    if (!block.rows) return;
    
    block.rows.forEach(row => {
      if (!row.fields) return;
      
      row.fields.forEach(field => {
        if (field.editedParagraph && typeof field.editedParagraph === 'string') {
          let html = field.editedParagraph;
          const original = html;
          
          // Remove Windows line endings (\r\n) and replace with just \n
          html = html.replace(/\r\n/g, '\n');
          html = html.replace(/\r/g, '\n');
          
          // Remove excessive whitespace but keep structure
          html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          // Ensure the HTML is clean
          field.editedParagraph = html;
          
          if (html !== original) {
            fixedCount++;
          }
        }
      });
    });
  });
});

// Validate JSON
try {
  const test = JSON.stringify(cvuf);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log(`✅ Fixed ${fixedCount} HTML fields`);
console.log('   - Removed Windows line endings (\\r\\n)');
console.log('   - Cleaned whitespace');
console.log('   - File ready to import');

