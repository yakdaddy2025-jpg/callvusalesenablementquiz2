/**
 * Script to update CVUF file with embedded voice recorder
 * Run: node update-cvuf.js
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz.cvuf');
const cvufContent = fs.readFileSync(cvufPath, 'utf8');
const cvuf = JSON.parse(cvufContent);

const RECORDER_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';

// Question mappings
const questionMappings = {
  'step_q1': { id: 'Q1_Banking', title: 'Banking: Card Replacement Chaos', fieldId: 'Answer_Q1_Banking' },
  'step_q2': { id: 'Q2_Insurance', title: 'Insurance: Inaccurate FNOL', fieldId: 'Answer_Q2_Insurance' },
  'step_q3': { id: 'Q3_Telco', title: 'Telco: SIM Swap Fraud', fieldId: 'Answer_Q3_Telco' },
  'step_q4': { id: 'Q4_Utilities', title: 'Utilities: Move-In/Move-Out Errors', fieldId: 'Answer_Q4_Utilities' },
  'step_q5': { id: 'Q5_Mortgage', title: 'Mortgage: Hardship Script Compliance', fieldId: 'Answer_Q5_Mortgage' },
  'step_q6': { id: 'Q6_Healthcare', title: 'Healthcare: Intake Inaccuracy', fieldId: 'Answer_Q6_Healthcare' },
  'step_q7': { id: 'Q7_Bots', title: 'Objection: We Already Have Bots', fieldId: 'Answer_Q7_Bots' },
  'step_q8': { id: 'Q8_Architecture', title: 'Architecture Drill: 30-Second Explanation', fieldId: 'Answer_Q8_Architecture' },
  'step_q9': { id: 'Q9_Analogies', title: 'Drill: Spot Wrong Analogies', fieldId: 'Answer_Q9_Analogies' },
  'step_q12': { id: 'Q12_Compliance1', title: 'Compliance: Skipped Disclosure', fieldId: 'Answer_Q12_Compliance1' },
  'step_q13': { id: 'Q13_Compliance2', title: 'Compliance: AI Reordering Steps', fieldId: 'Answer_Q13_Compliance2' },
  'step_q14': { id: 'Q14_Compliance3', title: 'Compliance: Incomplete KYC', fieldId: 'Answer_Q14_Compliance3' },
  'step_q15': { id: 'Q15_Compliance4', title: 'Compliance: Backend Failure', fieldId: 'Answer_Q15_Compliance4' },
  'step_q19': { id: 'Q19_20SecPitch', title: '20-Second Elevator Pitch', fieldId: 'Answer_Q19_20SecPitch' },
  'step_q20': { id: 'Q20_ModeBSafety', title: 'Why Mode B is Safe for AI', fieldId: 'Answer_Q20_ModeBSafety' }
};

// Process each step
cvuf.form.steps.forEach(step => {
  const mapping = questionMappings[step.identifier];
  
  if (mapping) {
    // Add heading at the top of the first block
    const firstBlock = step.blocks[0];
    if (firstBlock && firstBlock.rows) {
      // Insert heading as first row
      const headingField = {
        className: "",
        clearable: false,
        hint: "",
        identifier: `heading_${step.identifier}`,
        integrationID: `Heading_${step.identifier}`,
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
        editedParagraph: `<h1 style="text-align: center; margin-bottom: 20px;">Sales Enablement Quiz - Mode A and B</h1>`,
        localOnly: true
      };
      
      firstBlock.rows.unshift({ fields: [headingField] });
    }
    
    // Update answer field to be read-only and voice-only
    step.blocks.forEach(block => {
      block.rows.forEach(row => {
        row.fields.forEach(field => {
          if (field.integrationID === mapping.fieldId) {
            // Make it read-only and update hint
            field.readOnly = true;
            field.hint = "Voice transcription will appear here. This field is read-only - voice input only.";
            field.editedParagraph = field.editedParagraph || '';
          }
          
          // Replace voice link paragraph with iframe embed
          if (field.identifier && field.identifier.includes('_voice') && field.type === 'paragraph') {
            const iframeHtml = `
<div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <iframe 
    src="${RECORDER_URL}?question=${mapping.id}&title=${encodeURIComponent(mapping.title)}" 
    style="width: 100%; height: 500px; border: none;"
    allow="microphone"
    sandbox="allow-scripts allow-same-origin allow-forms"
    id="voice-recorder-${mapping.id}"
  ></iframe>
</div>
<p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
  <strong>Note:</strong> Voice input only. Typing is disabled to prevent AI assistance.
</p>
            `.trim();
            
            field.editedParagraph = iframeHtml;
          }
        });
      });
    });
    
    // Disable Next button initially (will be enabled by JS when response is ready)
    if (step.buttonsConfig && step.buttonsConfig.next) {
      step.buttonsConfig.next.className = step.buttonsConfig.next.className || '';
      if (!step.buttonsConfig.next.className.includes('disabled')) {
        step.buttonsConfig.next.className += ' disabled';
      }
    }
  }
});

// Add custom CSS and JS to form
cvuf.form.formCustomStyle = `
<style>
  /* Disable typing in voice response fields */
  textarea[data-integration-id^="Answer_"] {
    pointer-events: none;
    background-color: #f9fafb;
    cursor: not-allowed;
  }
  
  /* Style disabled Next button */
  button.disabled,
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Voice recorder iframe styling */
  iframe[id^="voice-recorder-"] {
    min-height: 500px;
  }
</style>
<script src="https://callvusalesenablementquiz2.vercel.app/callvu-integration.js"></script>
`;

// Write updated CVUF
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ CVUF updated successfully!');
console.log(`   - Added headings to ${Object.keys(questionMappings).length} question screens`);
console.log('   - Embedded voice recorders in question screens');
console.log('   - Made answer fields read-only (voice-only input)');
console.log('   - Added integration script');

