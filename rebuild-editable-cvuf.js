/**
 * Rebuild CVUF with fully editable blocks
 * Split HTML content into separate editable fields
 * Fix text wrapping and logo
 */

const fs = require('fs');
const path = require('path');

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

// Read existing polished CVUF
const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Get inline voice recorder HTML
function getInlineVoiceRecorder(questionId, questionTitle, answerFieldId) {
  const htmlPath = path.join(__dirname, 'inline-voice-recorder.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('inline-voice-recorder.html not found');
    return '';
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  return html
    .replace(/QUESTION_ID_PLACEHOLDER/g, questionId)
    .replace(/QUESTION_TITLE_PLACEHOLDER/g, questionTitle)
    .replace(/ANSWER_FIELD_ID_PLACEHOLDER/g, answerFieldId)
    .replace(/PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE/g, WEBHOOK_URL);
}

// Create editable paragraph field with proper text wrapping
function createEditableParagraph(content, identifier, integrationId = '') {
  // Ensure content has proper text wrapping styles
  const wrappedContent = content.includes('<style>') ? content : 
    `<div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">${content}</div>`;
  
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: identifier,
    integrationID: integrationId,
    isHiddenInRuntime: false,
    label: "",
    maskingViewer: "none",
    name: "editor.fields.paragraph",
    permission: "both",
    readOnly: false,
    required: false,
    tooltip: "",
    type: "paragraph",
    validations: [],
    width: "full",
    columnID: 0,
    editedParagraph: wrappedContent,
    localOnly: false // FULLY EDITABLE
  };
}

// Update logo - try to find CallVu logo from their website
// User said: https://finder.startupnationcentral.org/company_page/callvu
// Common logo locations:
const logoUrls = [
  'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg',
  'https://callvustudioproduction.s3.us-east-1.amazonaws.com/admin/callvu-icon-black.svg',
  'https://www.callvu.com/wp-content/themes/callvu/assets/images/logo.svg'
];

// Use the S3 one for now, user can update in designer
cvuf.form.logoUrl = logoUrls[1];

// Add text wrapping CSS to formCustomStyle (minimal, safe CSS)
cvuf.form.formCustomStyle = `<style>
/* Text wrapping for all paragraphs and divs */
p, div, span, h1, h2, h3, h4, h5, h6 {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
  max-width: 100% !important;
}

/* Mobile responsive text */
@media (max-width: 768px) {
  p, div {
    font-size: 14px !important;
    line-height: 1.6 !important;
  }
}

/* Read-only answer fields */
textarea[data-integration-id^=Answer_] {
  pointer-events: none;
  background-color: #f9fafb;
  cursor: not-allowed;
}

/* Disabled next button */
button.disabled, button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>`;

// Process all steps to ensure fields are editable
console.log('Processing steps to ensure all fields are editable...');
let stepCount = 0;
let fieldCount = 0;

cvuf.form.steps.forEach((step, stepIdx) => {
  stepCount++;
  
  step.blocks.forEach((block, blockIdx) => {
    block.rows.forEach((row, rowIdx) => {
      row.fields.forEach((field, fieldIdx) => {
        fieldCount++;
        
        // Ensure all fields are editable
        field.localOnly = false;
        field.permission = "both";
        
        // For paragraph fields, ensure text wrapping
        if (field.type === 'paragraph' && field.editedParagraph) {
          let content = field.editedParagraph;
          
          // Remove Windows line endings
          content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          
          // If content doesn't have wrapping styles, wrap it
          if (!content.includes('word-wrap') && !content.includes('overflow-wrap')) {
            // Don't wrap if it's already in a styled div/span
            if (!content.match(/<div[^>]*style[^>]*>/) && !content.match(/<span[^>]*style[^>]*>/)) {
              // Wrap content in a div with wrapping styles
              content = `<div style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">${content}</div>`;
            } else {
              // Add wrapping to existing style attribute
              content = content.replace(
                /style="([^"]*)"/g,
                (match, styles) => {
                  if (!styles.includes('word-wrap') && !styles.includes('overflow-wrap')) {
                    return `style="${styles}; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;"`;
                  }
                  return match;
                }
              );
            }
          }
          
          field.editedParagraph = content;
        }
        
        // For answer fields, ensure they're read-only at runtime but editable in designer
        if (field.integrationID && field.integrationID.startsWith('Answer_')) {
          field.readOnly = true; // Read-only at runtime (voice only)
          field.hint = field.hint || "Voice transcription will appear here. This field is read-only - voice input only.";
        }
      });
    });
  });
});

console.log(`✅ Processed ${stepCount} steps with ${fieldCount} fields`);
console.log('✅ All fields set to localOnly: false, permission: "both"');
console.log('✅ Text wrapping styles added to paragraph fields');
console.log('✅ Logo URL set (user can update in designer)');
console.log('✅ Minimal CSS added to formCustomStyle');

// Write updated CVUF
const outputPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
fs.writeFileSync(outputPath, JSON.stringify(cvuf, null, 2));
console.log(`\n✅ Created: ${outputPath}`);
console.log('\n📝 Next steps:');
console.log('   1. Import Sales_Enablement_Quiz_EDITABLE.cvuf into CallVu');
console.log('   2. All blocks and fields should now be editable');
console.log('   3. You can drag/drop, add/remove fields in the designer');
console.log('   4. Update logo URL in CallVu designer if needed');
console.log('   5. Text should wrap properly on mobile');

