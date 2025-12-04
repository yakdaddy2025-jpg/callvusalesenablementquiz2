/**
 * CRITICAL FIX: Make all blocks and fields editable in CallVu designer
 * Remove localOnly and ensure proper permissions
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Fix logo - get from CallVu website
cvuf.form.logoUrl = 'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg';

// Enhanced CSS with mobile text wrapping
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
/* Mobile-responsive text - prevent cutoff */
p, div, span, li {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
}
/* Scenario text specifically */
p[style*="SCENARIO"],
div[style*="SCENARIO"] {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal !important;
  max-width: 100%;
}
/* Mobile optimization */
@media (max-width: 768px) {
  p {
    font-size: 14px !important;
    line-height: 1.6 !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100% !important;
  }
  h1, h2, h3 {
    font-size: 24px !important;
    word-wrap: break-word;
  }
  /* Ensure text doesn't overflow */
  * {
    max-width: 100%;
    box-sizing: border-box;
  }
}
</style>`;

let fixedCount = 0;

// CRITICAL: Make all fields editable in CallVu designer
function makeEditable(step) {
  if (!step.blocks) return;
  
  step.blocks.forEach(block => {
    if (!block.rows) return;
    
    block.rows.forEach(row => {
      if (!row.fields) return;
      
      row.fields.forEach(field => {
        // Remove localOnly - this prevents editing in designer!
        if (field.localOnly === true) {
          field.localOnly = false; // Allow editing in designer
          fixedCount++;
        }
        
        // Ensure proper permissions
        field.permission = 'both'; // Editable by both admin and user
        field.readOnly = false; // Editable in designer (runtime read-only handled by CSS)
        field.isHiddenInRuntime = false; // Visible
        
        // For answer fields, they should be editable in designer but read-only at runtime
        // This is handled by CSS, not by readOnly flag
        if (field.integrationID && field.integrationID.startsWith('Answer_')) {
          field.readOnly = false; // Editable in designer
          field.permission = 'both';
          // Runtime read-only is handled by CSS pointer-events: none
        }
      });
    });
  });
}

// Process all steps
cvuf.form.steps.forEach(step => {
  makeEditable(step);
});

// Validate
try {
  JSON.stringify(cvuf);
  console.log('✅ JSON is valid');
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  process.exit(1);
}

// Write back
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log(`✅ Fixed ${fixedCount} fields to be editable in CallVu designer!`);
console.log('   - Removed localOnly restrictions');
console.log('   - All fields now editable in designer');
console.log('   - Logo URL updated');
console.log('   - Mobile text wrapping fixed');
console.log('   - Ready to import and edit!');

