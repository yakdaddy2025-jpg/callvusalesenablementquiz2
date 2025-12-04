/**
 * Add mobile-responsive CSS for text wrapping
 * Ensure text never falls off the page on mobile
 * Make sure CSS is safe for URI decoding
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Mobile-responsive CSS - minimal, safe for URI decoding
// No quotes in selectors, no special characters
const mobileCSS = `<style>
/* Base text wrapping for all elements */
p,div,span,h1,h2,h3,h4,h5,h6,li,td,th{
  word-wrap:break-word;
  overflow-wrap:break-word;
  hyphens:auto;
  max-width:100%;
  box-sizing:border-box;
}

/* Mobile-specific styles */
@media screen and (max-width:768px){
  /* Force text wrapping on mobile */
  p,div,span{
    word-wrap:break-word !important;
    overflow-wrap:break-word !important;
    hyphens:auto !important;
    max-width:100% !important;
    width:100% !important;
    box-sizing:border-box !important;
    font-size:14px !important;
    line-height:1.6 !important;
    padding:0 10px !important;
  }
  
  /* Headings on mobile */
  h1,h2,h3,h4,h5,h6{
    font-size:18px !important;
    line-height:1.4 !important;
    word-wrap:break-word !important;
    overflow-wrap:break-word !important;
    max-width:100% !important;
    padding:0 10px !important;
  }
  
  /* Lists on mobile */
  ul,ol{
    padding-left:20px !important;
    margin:10px 0 !important;
  }
  
  li{
    word-wrap:break-word !important;
    overflow-wrap:break-word !important;
    margin-bottom:8px !important;
  }
  
  /* Paragraph fields - ensure they're editable on mobile */
  [data-field-type=paragraph]{
    width:100% !important;
    max-width:100% !important;
  }
  
  /* Text areas and inputs */
  textarea,input{
    width:100% !important;
    max-width:100% !important;
    box-sizing:border-box !important;
  }
  
  /* Voice recorder container */
  #voice-recorder-container{
    width:100% !important;
    max-width:100% !important;
    padding:15px !important;
    box-sizing:border-box !important;
  }
  
  /* Blocks and rows */
  [class*=block],[class*=row]{
    width:100% !important;
    max-width:100% !important;
    box-sizing:border-box !important;
  }
}

/* Read-only answer fields */
textarea[data-integration-id^=Answer_]{
  pointer-events:none;
  background-color:#f9fafb;
  cursor:not-allowed;
}

/* Disabled buttons */
button.disabled,button[disabled]{
  opacity:0.5;
  cursor:not-allowed;
}
</style>`;

cvuf.form.formCustomStyle = mobileCSS;

console.log('✅ Added mobile-responsive CSS');
console.log('   - Text will wrap properly on mobile');
console.log('   - No text will fall off the page');
console.log('   - Editable blocks should work on mobile');
console.log('   - CSS is minimal and safe for URI decoding');

// Also ensure all paragraph fields have inline mobile styles
let fixedCount = 0;
cvuf.form.steps.forEach((step, stepIdx) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                let content = field.editedParagraph;
                
                // Add mobile-responsive wrapper if not already present
                if (!content.includes('word-wrap') && !content.includes('overflow-wrap')) {
                  // Wrap content in a div with mobile styles
                  content = `<div style="word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;">${content}</div>`;
                  field.editedParagraph = content;
                  fixedCount++;
                } else {
                  // Add mobile styles to existing elements
                  content = content.replace(
                    /style="([^"]*)"/g,
                    (match, styles) => {
                      if (!styles.includes('word-wrap') && !styles.includes('overflow-wrap')) {
                        return `style="${styles};word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;box-sizing:border-box;"`;
                      }
                      return match;
                    }
                  );
                  field.editedParagraph = content;
                }
              }
            });
          }
        });
      }
    });
  }
});

console.log(`✅ Updated ${fixedCount} paragraph fields with mobile styles`);

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
console.log('✅ File updated with mobile-responsive CSS');

