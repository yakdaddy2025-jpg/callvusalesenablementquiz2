/**
 * Update the polished CVUF with enhanced progress bar styling
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Enhanced styling with grouped progress bar
cvuf.form.formCustomStyle = `<style>
  /* Disable typing in voice response fields */
  textarea[data-integration-id^="Answer_"] {
    pointer-events: none;
    background-color: #f9fafb;
    cursor: not-allowed;
  }
  
  /* Style disabled Next button */
  button.disabled, button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Sophisticated Progress Bar Styling - Grouped Display */
  .callvu-stepper-container,
  [class*="stepper"],
  [class*="progress"] {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  /* Group labels for progress bar */
  .callvu-step-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 24px;
    padding: 6px 12px;
    border-radius: 8px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }
  
  .callvu-group-label {
    font-weight: 600;
    font-size: 11px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-right: 8px;
  }
  
  .callvu-group-items {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
  
  .callvu-step-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: #e2e8f0;
    color: #64748b;
    border: 1px solid #cbd5e1;
  }
  
  .callvu-step-badge.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #2563eb;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    transform: scale(1.05);
  }
  
  .callvu-step-badge.completed {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-color: #059669;
  }
  
  .callvu-step-badge.pending {
    background: #f1f5f9;
    color: #94a3b8;
    border-color: #e2e8f0;
  }
  
  /* Progress number display - show numbers not percentages */
  .callvu-progress-number {
    font-weight: 700;
    font-size: 13px;
    letter-spacing: -0.5px;
    color: #1e293b;
  }
  
  /* Style step text in progress bar */
  [class*="step-text"],
  [class*="step-name"] {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .callvu-stepper-container,
    [class*="stepper"],
    [class*="progress"] {
      padding: 12px 16px;
    }
    
    .callvu-step-group {
      margin-right: 12px;
      margin-bottom: 8px;
      padding: 4px 8px;
    }
    
    .callvu-group-label {
      font-size: 10px;
    }
    
    .callvu-step-badge {
      min-width: 24px;
      height: 24px;
      font-size: 11px;
      padding: 0 6px;
    }
  }
  
  /* Enhanced typography */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Smooth transitions */
  * {
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }
</style>`;

// Write updated CVUF
fs.writeFileSync(cvufPath, JSON.stringify(cvuf, null, 2));
console.log('✅ Enhanced styling applied to polished CVUF!');

