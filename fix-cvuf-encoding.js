/**
 * Fix CVUF encoding issues - properly escape CSS for JSON
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Simplified, properly escaped CSS
const cleanCSS = `<style>
textarea[data-integration-id^="Answer_"] {
  pointer-events: none;
  background-color: #f9fafb;
  cursor: not-allowed;
}
button.disabled, button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>`;

// Update formCustomStyle with properly escaped CSS
cvuf.form.formCustomStyle = cleanCSS;

// Also check and fix any other potential encoding issues in paragraph fields
function fixParagraphEncoding(step) {
  if (step.blocks) {
    step.blocks.forEach(block => {
      if (block.rows) {
        block.rows.forEach(row => {
          if (row.fields) {
            row.fields.forEach(field => {
              if (field.editedParagraph && typeof field.editedParagraph === 'string') {
                // Ensure proper HTML encoding
                field.editedParagraph = field.editedParagraph
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
              }
            });
          }
        });
      }
    });
  }
}

// Actually, wait - HTML should NOT be encoded in editedParagraph, it should be raw HTML
// The issue is likely with the CSS string itself. Let me revert that and just fix the CSS.

// Re-read and fix properly
const cvuf2 = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Use a minimal, safe CSS that won't cause encoding issues
cvuf2.form.formCustomStyle = '<style>textarea[data-integration-id^="Answer_"]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf2, null, 2));
console.log('✅ Fixed CVUF encoding issues!');
console.log('   - Simplified CSS to avoid encoding problems');
console.log('   - Removed problematic characters');

