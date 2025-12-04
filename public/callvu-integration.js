/**
 * CallVu Integration Script
 * Add this to your CallVu form to enable voice recorder integration
 * 
 * This script:
 * - Listens for voice responses from embedded recorder
 * - Updates CallVu form fields with transcripts
 * - Enables/disables Next button based on response completion
 * - Passes name/email to embedded recorder
 */

(function() {
  'use strict';
  
  // Configuration
  const RECORDER_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';
  
  // State
  let userInfo = {
    name: '',
    email: ''
  };
  
  // Get user info from form fields (called once at beginning)
  function getUserInfo() {
    // Try to get from form fields by integration ID
    const nameField = document.querySelector('[data-integration-id="RepName"], [name*="RepName"], input[name*="name"]');
    const emailField = document.querySelector('[data-integration-id="RepEmail"], [name*="RepEmail"], input[type="email"]');
    
    if (nameField) userInfo.name = nameField.value || '';
    if (emailField) userInfo.email = emailField.value || '';
    
    return userInfo;
  }
  
  // Listen for messages from embedded voice recorder
  window.addEventListener('message', function(event) {
    // Accept messages from Vercel domain
    if (!event.origin.includes('callvusalesenablementquiz2.vercel.app')) {
      return;
    }
    
    const data = event.data;
    
    if (data.type === 'VOICE_RESPONSE_READY') {
      // Update the corresponding CallVu field with transcript
      const fieldId = getFieldIdForQuestion(data.questionId);
      if (fieldId) {
        const field = document.querySelector(`[data-integration-id="${fieldId}"], [name*="${fieldId}"]`);
        if (field) {
          field.value = data.transcript;
          // Trigger change event so CallVu knows field is updated
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Enable Next button
      enableNextButton();
      
      // Log to console for debugging
      console.log('Voice response received:', data);
    }
    
    if (data.type === 'VOICE_RESPONSE_DELETED') {
      // Clear the field
      const fieldId = getFieldIdForQuestion(data.questionId);
      if (fieldId) {
        const field = document.querySelector(`[data-integration-id="${fieldId}"], [name*="${fieldId}"]`);
        if (field) {
          field.value = '';
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Disable Next button
      disableNextButton();
    }
  });
  
  // Map question IDs to CallVu field integration IDs
  function getFieldIdForQuestion(questionId) {
    const mapping = {
      // Roleplays
      'Roleplay1': 'Answer_Roleplay1',
      'Roleplay2': 'Answer_Roleplay2',
      'Roleplay3': 'Answer_Roleplay3',
      'Roleplay4': 'Answer_Roleplay4',
      'Roleplay5': 'Answer_Roleplay5',
      'Roleplay6': 'Answer_Roleplay6',
      'Roleplay7': 'Answer_Roleplay7',
      // Drills
      'DrillA': 'Answer_DrillA',
      'DrillB': 'Answer_DrillB',
      // Scenarios
      'Scenario1': 'Answer_Scenario1',
      'Scenario2': 'Answer_Scenario2',
      'Scenario3': 'Answer_Scenario3',
      'Scenario4': 'Answer_Scenario4',
      // Quiz 2
      'Quiz2': 'Answer_Quiz2',
      // Checks
      'Check1': 'Answer_Check1',
      'Check2': 'Answer_Check2',
      'Check3': 'Answer_Check3',
      'Check4': 'Answer_Check4',
      // Legacy mappings (for backwards compatibility)
      'Q1_Banking': 'Answer_Q1_Banking',
      'Q2_Insurance': 'Answer_Q2_Insurance',
      'Q3_Telco': 'Answer_Q3_Telco',
      'Q4_Utilities': 'Answer_Q4_Utilities',
      'Q5_Mortgage': 'Answer_Q5_Mortgage',
      'Q6_Healthcare': 'Answer_Q6_Healthcare',
      'Q7_Bots': 'Answer_Q7_Bots',
      'Q8_Architecture': 'Answer_Q8_Architecture',
      'Q9_Analogies': 'Answer_Q9_Analogies',
      'Q12_Compliance1': 'Answer_Q12_Compliance1',
      'Q13_Compliance2': 'Answer_Q13_Compliance2',
      'Q14_Compliance3': 'Answer_Q14_Compliance3',
      'Q15_Compliance4': 'Answer_Q15_Compliance4',
      'Q19_20SecPitch': 'Answer_Q19_20SecPitch',
      'Q20_ModeBSafety': 'Answer_Q20_ModeBSafety'
    };
    return mapping[questionId] || '';
  }
  
  // Enable Next button
  function enableNextButton() {
    const nextButton = document.querySelector('button[type="submit"], .next-button, [data-action="next"]');
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.classList.remove('disabled', 'opacity-50');
    }
  }
  
  // Disable Next button
  function disableNextButton() {
    const nextButton = document.querySelector('button[type="submit"], .next-button, [data-action="next"]');
    if (nextButton) {
      nextButton.disabled = true;
      nextButton.classList.add('disabled', 'opacity-50');
    }
  }
  
  // Initialize: Get user info when form loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(getUserInfo, 1000); // Wait for CallVu to render fields
    });
  } else {
    setTimeout(getUserInfo, 1000);
  }
  
  // Listen for user info changes
  document.addEventListener('input', function(e) {
    if (e.target.name && (e.target.name.includes('RepName') || e.target.name.includes('name'))) {
      userInfo.name = e.target.value;
    }
    if (e.target.type === 'email' || (e.target.name && e.target.name.includes('RepEmail'))) {
      userInfo.email = e.target.value;
    }
  });
  
  // Provide function to create iframe embed
  window.createVoiceRecorderEmbed = function(questionId, questionTitle) {
    const userInfo = getUserInfo();
    const iframe = document.createElement('iframe');
    iframe.src = `${RECORDER_URL}?question=${questionId}&title=${encodeURIComponent(questionTitle)}&name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email)}`;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.allow = 'microphone';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    return iframe;
  };
  
  console.log('CallVu Voice Recorder Integration loaded');
})();

