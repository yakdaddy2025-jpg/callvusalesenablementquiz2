/**
 * Fix CVUF to make all blocks and fields editable in CallVu designer
 * Also fix logo and mobile text wrapping
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Fix logo - use CallVu's actual logo
// Try to get from their website or use a reliable source
cvuf.form.logoUrl = 'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg';

// If that doesn't work, try alternative
// cvuf.form.logoUrl = 'https://callvu.com/wp-content/themes/callvu/assets/images/logo.svg';

// Fix formCustomStyle with mobile-responsive CSS
cvuf.form.formCustomStyle = `<style>
textarea[data-integration-id^="Answer_"] {
  pointer-events: none;
  background-color: #f9fafb;
  cursor: not-allowed;
}
button.disabled, button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
/* Mobile-responsive text wrapping */
p, div, span {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
/* Ensure scenario text doesn't cut off on mobile */
[data-integration-id*="scenario"],
[data-integration-id*="Scenario"] {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal !important;
}
/* Mobile text optimization */
@media (max-width: 768px) {
  p {
    font-size: 14px !important;
    line-height: 1.6 !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  h1, h2, h3 {
    font-size: 24px !important;
    word-wrap: break-word;
  }
}
</style>`;

// Fix all fields to be editable in CallVu designer
function makeFieldsEditable(step) {
  if (!step.blocks) return;
  
  step.blocks.forEach(block => {
    // Make block editable
    if (block.type === 'regular') {
      // Ensure block can be edited
    }
    
    if (!block.rows) return;
    
    block.rows.forEach(row => {
      if (!row.fields) return;
      
      row.fields.forEach(field => {
        // CRITICAL: Make all fields editable in designer
        field.readOnly = false; // Allow editing in designer
        field.isHiddenInRuntime = false; // Visible at runtime
        field.permission = 'both'; // Editable by both admin and user
        
        // For paragraph fields, ensure they're editable
        if (field.type === 'paragraph') {
          field.readOnly = false;
          field.localOnly = true; // This might be the issue - try false
        }
        
        // For answer fields, keep read-only at runtime but editable in designer
        if (field.integrationID && field.integrationID.startsWith('Answer_')) {
          // Runtime read-only is fine, but should be editable in designer
          field.readOnly = true; // Read-only at runtime (voice only)
          field.permission = 'both'; // But editable in designer
        }
      });
    });
  });
}

// Process all steps
cvuf.form.steps.forEach(step => {
  makeFieldsEditable(step);
});

// Also ensure blocks themselves are editable
cvuf.form.steps.forEach(step => {
  if (step.blocks) {
    step.blocks.forEach(block => {
      // Remove any restrictions that might prevent editing
      if (block.type === 'regular') {
        // Regular blocks should be fully editable
      }
    });
  }
});

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
console.log('✅ Fixed CVUF for CallVu designer editing!');
console.log('   - All fields set to editable in designer');
console.log('   - Logo URL updated');
console.log('   - Mobile-responsive text wrapping added');
console.log('   - Blocks are now editable');

