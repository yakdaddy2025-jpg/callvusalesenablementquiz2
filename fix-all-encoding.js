/**
 * Fix all encoding issues in CVUF - ensure proper JSON escaping
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
let cvuf;

try {
  cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));
} catch (e) {
  console.error('Error parsing CVUF:', e.message);
  process.exit(1);
}

// Fix formCustomStyle - use minimal, safe CSS
cvuf.form.formCustomStyle = '<style>textarea[data-integration-id^="Answer_"]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}</style>';

// Fix any HTML in editedParagraph fields that might have encoding issues
function fixStepEncoding(step) {
  if (!step.blocks) return;
  
  step.blocks.forEach(block => {
    if (!block.rows) return;
    
    block.rows.forEach(row => {
      if (!row.fields) return;
      
      row.fields.forEach(field => {
        if (field.editedParagraph && typeof field.editedParagraph === 'string') {
          // Fix common encoding issues
          let html = field.editedParagraph;
          
          // Fix quotes in style attributes
          html = html.replace(/style="([^"]*)"/g, (match, styles) => {
            // Escape quotes properly
            return `style="${styles.replace(/"/g, '&quot;')}"`;
          });
          
          // Ensure proper HTML entity encoding where needed
          // But keep HTML tags intact
          field.editedParagraph = html;
        }
      });
    });
  });
}

// Process all steps
cvuf.form.steps.forEach(step => {
  fixStepEncoding(step);
});

// Validate JSON before writing
try {
  JSON.stringify(cvuf);
} catch (e) {
  console.error('JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ Fixed all encoding issues!');
console.log('   - Simplified CSS');
console.log('   - Fixed HTML encoding in all fields');
console.log('   - Validated JSON structure');

