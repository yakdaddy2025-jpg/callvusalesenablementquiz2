/**
 * Create Custom CVUF with only the screens the user specified
 */

const fs = require('fs');
const path = require('path');

const RECORDER_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';

// Helper function to create heading field
function createHeading() {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: "heading",
    integrationID: "Heading",
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
}

// Helper function to create voice recorder iframe
function createVoiceRecorder(questionId, questionTitle) {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: `voice_${questionId}`,
    integrationID: `Voice_${questionId}`,
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
    editedParagraph: `
<div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <iframe 
    src="${RECORDER_URL}?question=${questionId}&title=${encodeURIComponent(questionTitle)}" 
    style="width: 100%; height: 500px; border: none;"
    allow="microphone"
    sandbox="allow-scripts allow-same-origin allow-forms"
    id="voice-recorder-${questionId}"
  ></iframe>
</div>
<p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
  <strong>Note:</strong> Voice input only. Typing is disabled to prevent AI assistance.
</p>
    `.trim(),
    localOnly: true
  };
}

// Helper function to create read-only answer field
function createAnswerField(fieldId, label) {
  return {
    className: "",
    clearable: false,
    hint: "Voice transcription will appear here. This field is read-only - voice input only.",
    identifier: `answer_${fieldId}`,
    integrationID: fieldId,
    isHiddenInRuntime: false,
    label: label || "Your Response",
    maskingViewer: "none",
    name: "editor.fields.longText",
    permission: "both",
    readOnly: true,
    required: true,
    tooltip: "",
    type: "longText",
    validations: [],
    width: "full",
    columnID: 0,
    maxLength: 2000
  };
}

// Helper function to create paragraph field
function createParagraph(content) {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: `para_${Date.now()}`,
    integrationID: "",
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
    editedParagraph: content,
    localOnly: true
  };
}

// Helper function to create multiple choice question
function createMultipleChoice(fieldId, label, items) {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: `mc_${fieldId}`,
    integrationID: fieldId,
    isHiddenInRuntime: false,
    label: label,
    maskingViewer: "none",
    name: "editor.fields.radioinput",
    permission: "both",
    readOnly: false,
    required: true,
    tooltip: "",
    type: "radioInput",
    validations: [],
    width: "full",
    columnID: 0,
    items: items
  };
}

// Create the CVUF structure
const cvuf = {
  form: {
    accessibility: false,
    actions: [],
    approveData: {
      enabled: false,
      forceApproveBeforeShowingDownload: false,
      toCloseForm: false,
      popupObj: {
        errorMsg: "",
        fieldType: "",
        message: "",
        title: ""
      },
      submitIcon: ""
    },
    calculatedFields: [],
    direction: "ltr",
    expirationObj: {},
    formCustomStyle: `
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
    `.trim(),
    formName: "CallVu Sales Enablement Quiz",
    globalVariables: [],
    hintMsgProps: {
      text: "",
      hideOnScroll: false
    },
    isDownloadPDFLink: false,
    isFormReadonly: false,
    isPdfForm: false,
    isSinglePage: false,
    last_update: "",
    logo: "",
    logoAlignment: "center",
    logoName: "",
    logoUrl: "https://callvustudioproduction.s3.us-east-1.amazonaws.com/admin/callvu-icon-black.svg",
    notResizable: true,
    otp: {
      buttonText: "",
      description: "",
      emptyFieldValidation: "",
      invalidFieldValidation: "",
      isActive: false,
      label: "",
      logo: "",
      logoName: "",
      resendText: "",
      serviceUrl: "",
      title: "",
      validResponse: false,
      validateUrl: false,
      redirectAfterSubmit: false,
      redirectLink: "",
      isAuth: false,
      optionalFields: []
    },
    PDF: "",
    permission: "client",
    redirectAfterSubmit: false,
    redirectLink: "",
    stepperType: "Progress",
    steps: [],
    templateType: 3,
    thankYouPageMarkup: "",
    theme: {
      primary: "hsl(210, 100%, 45%)",
      title: "#1c1c1c",
      text: "#3b3b3b",
      background: "hsl(0, 0%, 100%)",
      blockBackground: "#ffffff",
      headerText: "#1c1c1c",
      font: "Inter-Regular",
      headerBackground: "#ffffff",
      secondary: "hsl(210, 80%, 95%)",
      warning: "hsl(40, 97%, 47%)",
      altBackground: "hsl(0, 0%, 97%)",
      danger: "hsl(14, 80%, 50%)",
      link: "hsl(209, 81%, 52%)",
      success: "hsl(145, 94%, 32%)",
      dark: "hsl(0, 0%, 29%)",
      bright: "hsl(54, 100%, 81%)",
      neutral: "hsl(124, 37%, 84%)"
    },
    title: "Sales Enablement Quiz",
    privateMode: false,
    otpTemplateID: "",
    isOTPEnabled: false,
    otpVersion: 2,
    formVersion: "10.4.40",
    lastModified: "",
    newRules: [],
    Timestamp: "",
    TimeModified: "",
    style: "",
    formCSS: {
      ID: "",
      Name: "",
      Description: "",
      CSS: ""
    },
    id: null,
    backgroundUrl: {
      desktop: "",
      mobile: ""
    }
  }
};

// Step 1: Intro
cvuf.form.steps.push({
  stepName: "Intro",
  identifier: "step_intro",
  buttonsConfig: {
    back: { className: "", isHidden: true, text: "" },
    next: { className: "", isHidden: false, text: "Begin Quiz" },
    targetStep: "step_rep_info",
    isFirstNode: true
  },
  blocks: [{
    blockName: "",
    identifier: "block_intro",
    icon: "",
    rows: [{
      fields: [
        createHeading(),
        createParagraph(`
<h2>Welcome to the CallVu Sales Enablement Quiz</h2>
<p>This assessment will test your understanding of CallVu's Mode A and Mode B architecture.</p>
<p><strong>Instructions:</strong></p>
<ul>
  <li>Each question requires a voice response</li>
  <li>Speak clearly and cover all key points</li>
  <li>Your responses will be recorded and reviewed</li>
  <li>You can keep or delete your response to try again</li>
</ul>
<p><em>Time estimate: 20-30 minutes</em></p>
        `)
      ]
    }],
    style: { alignment: "center", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Intro",
  isFirstStep: true,
  isLastStep: false
});

// Step 2: Rep Info (Name/Email)
cvuf.form.steps.push({
  stepName: "Rep Info",
  identifier: "step_rep_info",
  buttonsConfig: {
    back: { className: "", isHidden: true, text: "" },
    next: { className: "", isHidden: false, text: "Continue" },
    targetStep: "step_roleplay1"
  },
  blocks: [{
    blockName: "Your Information",
    identifier: "block_rep_info",
    icon: "",
    rows: [
      { fields: [{
        className: "",
        clearable: false,
        hint: "",
        identifier: "rep_name",
        integrationID: "RepName",
        isHiddenInRuntime: false,
        label: "Your Full Name",
        maskingViewer: "none",
        name: "editor.fields.shortText",
        permission: "both",
        readOnly: false,
        required: true,
        tooltip: "",
        type: "shortText",
        validations: [],
        width: "full",
        columnID: 0
      }]},
      { fields: [{
        className: "",
        clearable: false,
        hint: "",
        identifier: "rep_email",
        integrationID: "RepEmail",
        isHiddenInRuntime: false,
        label: "Email Address",
        maskingViewer: "none",
        name: "editor.fields.emailinput",
        permission: "both",
        readOnly: false,
        required: true,
        tooltip: "",
        type: "emailInput",
        validations: [],
        width: "full",
        columnID: 0,
        icon: "fa-envelope"
      }]}
    ],
    style: { alignment: "center", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Rep Info",
  isLastStep: false
});

// Helper function to create roleplay step
function createRoleplayStep(num, identifier, title, scenario, targetStep) {
  const questionId = `Roleplay${num}`;
  return {
    stepName: `Roleplay ${num}`,
    identifier: identifier,
    buttonsConfig: {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "disabled", isHidden: false, text: "Next" },
      targetStep: targetStep
    },
    blocks: [{
      blockName: title,
      identifier: `block_roleplay${num}`,
      icon: "",
      rows: [
        { fields: [createHeading()] },
        { fields: [createParagraph(`<p><strong>SCENARIO:</strong></p><p>${scenario}</p>`)] },
        { fields: [createParagraph(`<p><strong>YOUR TASK:</strong> Provide your response using the voice recorder below.</p>`)] },
        { fields: [createVoiceRecorder(questionId, title)] },
        { fields: [createAnswerField(`Answer_Roleplay${num}`, "Your Response")] }
      ],
      style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
      type: "regular"
    }],
    style: { alignment: "" },
    hideFooter: false,
    text: `Roleplay ${num}`,
    isLastStep: false
  };
}

// Roleplays 1-7
const roleplayScenarios = [
  "A major bank tells you: \"Our card replacement process varies wildly depending on the agent. Some skip identity steps, others forget disclosures. Fraud loves this.\"",
  "A claims VP says: \"Our FNOL submissions are full of missing info and call center agents improvise the script.\"",
  "A telco sees a spike in fraudulent SIM swaps.",
  "Operations lead complains: \"Service activations are constantly wrong. Wrong dates, missing notices, and billing issues.\"",
  "A servicer says: \"Agents improvise hardship calls. Regulators are hammering us.\"",
  "A provider says: \"Intake data is wrong half the time. Insurance info missing. Consents aren't properly logged.\"",
  "A CIO says: \"We have bots. Why do we need you?\""
];

roleplayScenarios.forEach((scenario, idx) => {
  const num = idx + 1;
  const nextStep = num === 7 ? "step_drill_a" : `step_roleplay${num + 1}`;
  cvuf.form.steps.push(createRoleplayStep(
    num,
    `step_roleplay${num}`,
    `Roleplay ${num}`,
    scenario,
    nextStep
  ));
});

// Drill A (Speech to text)
cvuf.form.steps.push({
  stepName: "Drill A",
  identifier: "step_drill_a",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "disabled", isHidden: false, text: "Next" },
    targetStep: "step_drill_b"
  },
  blocks: [{
    blockName: "Drill A",
    identifier: "block_drill_a",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createParagraph(`<p><strong>DRILL:</strong> Explain the CallVu architecture in 30 seconds.</p><p><strong>You must include:</strong></p><ul><li>Micro-apps</li><li>Orchestration</li><li>Two modes</li><li>Compliance</li></ul>`)] },
      { fields: [createVoiceRecorder("DrillA", "Drill A: Architecture Explanation")] },
      { fields: [createAnswerField("Answer_DrillA", "Your Response")] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Drill A",
  isLastStep: false
});

// Drill B (Speech to text)
cvuf.form.steps.push({
  stepName: "Drill B",
  identifier: "step_drill_b",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "disabled", isHidden: false, text: "Next" },
    targetStep: "step_drill_c"
  },
  blocks: [{
    blockName: "Drill B",
    identifier: "block_drill_b",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createParagraph(`<p><strong>DRILL:</strong> Explain why EACH of these statements is WRONG:</p><ol><li>"CallVu is like a form builder."</li><li>"Mode A is just self-service."</li><li>"Mode B is basically RPA."</li><li>"Bots + CallVu are interchangeable."</li></ol>`)] },
      { fields: [createVoiceRecorder("DrillB", "Drill B: Spot Wrong Analogies")] },
      { fields: [createAnswerField("Answer_DrillB", "Your Response")] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Drill B",
  isLastStep: false
});

// Drill C (Multiple Choice)
cvuf.form.steps.push({
  stepName: "Drill C",
  identifier: "step_drill_c",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "", isHidden: false, text: "Next" },
    targetStep: "step_exercise_a"
  },
  blocks: [{
    blockName: "Drill C",
    identifier: "block_drill_c",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createParagraph(`<p><strong>DRILL:</strong> Select the correct answer.</p>`)] },
      { fields: [createMultipleChoice("MC_DrillC", "What is the primary purpose of Mode A?", [
        { label: "A. Backend automation", value: "A" },
        { label: "B. UI-led compliance and guided interactions", value: "B" },
        { label: "C. AI reasoning", value: "C" },
        { label: "D. Data storage", value: "D" }
      ])] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Drill C",
  isLastStep: false
});

// Exercise Set A (Mode A or Mode B selection)
cvuf.form.steps.push({
  stepName: "Exercise Set A",
  identifier: "step_exercise_a",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "", isHidden: false, text: "Next" },
    targetStep: "step_scenario1"
  },
  blocks: [{
    blockName: "Exercise Set A: Mode Classification",
    identifier: "block_exercise_a",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createParagraph(`<p><strong>EXERCISE:</strong> Classify each use case as Mode A only, Mode B only, or Mode A → Mode B hybrid</p>`)] },
      { fields: [createMultipleChoice("Exercise_1", "1. Customer updates their mailing address", [
        { label: "Mode A only", value: "Mode A" },
        { label: "Mode B only", value: "Mode B" },
        { label: "Mode A → Mode B", value: "Hybrid" }
      ])] },
      { fields: [createMultipleChoice("Exercise_2", "2. AI agent initiates a fee reversal", [
        { label: "Mode A only", value: "Mode A" },
        { label: "Mode B only", value: "Mode B" },
        { label: "Mode A → Mode B", value: "Hybrid" }
      ])] },
      { fields: [createMultipleChoice("Exercise_3", "3. Customer disputes a credit card transaction", [
        { label: "Mode A only", value: "Mode A" },
        { label: "Mode B only", value: "Mode B" },
        { label: "Mode A → Mode B", value: "Hybrid" }
      ])] },
      { fields: [createMultipleChoice("Exercise_4", "4. Mortgage escrow recalculation", [
        { label: "Mode A only", value: "Mode A" },
        { label: "Mode B only", value: "Mode B" },
        { label: "Mode A → Mode B", value: "Hybrid" }
      ])] },
      { fields: [createMultipleChoice("Exercise_5", "5. Patient intake form + insurance card upload", [
        { label: "Mode A only", value: "Mode A" },
        { label: "Mode B only", value: "Mode B" },
        { label: "Mode A → Mode B", value: "Hybrid" }
      ])] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Exercise Set A",
  isLastStep: false
});

// Scenarios 1-4 (Speech to text, no correct answer displayed)
const scenarioQuestions = [
  "An agent accidentally skips a required disclosure step during a claims intake. Would this be possible in Mode A or Mode B?",
  "An AI agent decides to reorder steps in a workflow based on probability. Would CallVu allow this in Mode B?",
  "A customer submits an incomplete KYC step. What mode handles this? What happens?",
  "Backend system fails mid-update. What does Mode B do?"
];

scenarioQuestions.forEach((question, idx) => {
  const num = idx + 1;
  const nextStep = num === 4 ? "step_quiz1" : `step_scenario${num + 1}`;
  cvuf.form.steps.push({
    stepName: `Scenario ${num}`,
    identifier: `step_scenario${num}`,
    buttonsConfig: {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "disabled", isHidden: false, text: "Next" },
      targetStep: nextStep
    },
    blocks: [{
      blockName: `Scenario ${num}`,
      identifier: `block_scenario${num}`,
      icon: "",
      rows: [
        { fields: [createHeading()] },
        { fields: [createParagraph(`<p><strong>SCENARIO:</strong></p><p>${question}</p>`)] },
        { fields: [createVoiceRecorder(`Scenario${num}`, `Scenario ${num}`)] },
        { fields: [createAnswerField(`Answer_Scenario${num}`, "Your Response")] }
      ],
      style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
      type: "regular"
    }],
    style: { alignment: "" },
    hideFooter: false,
    text: `Scenario ${num}`,
    isLastStep: false
  });
});

// Quiz 1 (All 5 questions multiple choice)
cvuf.form.steps.push({
  stepName: "Quiz 1",
  identifier: "step_quiz1",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "", isHidden: false, text: "Next" },
    targetStep: "step_quiz2"
  },
  blocks: [{
    blockName: "Quiz 1: Multiple Choice",
    identifier: "block_quiz1",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createMultipleChoice("Quiz1_Q1", "1. Mode A enforces compliance through:", [
        { label: "A. LLM reasoning", value: "A" },
        { label: "B. UI interactions and micro-app constraints", value: "B" },
        { label: "C. Backend rules", value: "C" },
        { label: "D. Agent training", value: "D" }
      ])] },
      { fields: [createMultipleChoice("Quiz1_Q2", "2. Mode B exists because:", [
        { label: "A. Customers prefer automation", value: "A" },
        { label: "B. Backend execution must be deterministic and safe", value: "B" },
        { label: "C. It reduces UI load", value: "C" },
        { label: "D. It replaces CRM", value: "D" }
      ])] },
      { fields: [createMultipleChoice("Quiz1_Q3", "3. Micro-apps differ from forms because:", [
        { label: "A. They look nicer", value: "A" },
        { label: "B. They enforce logic, compliance, and backend calls", value: "B" },
        { label: "C. They store data in PDFs", value: "C" },
        { label: "D. They run only in digital channels", value: "D" }
      ])] },
      { fields: [createMultipleChoice("Quiz1_Q4", "4. MCP enables:", [
        { label: "A. AI to rewrite business rules", value: "A" },
        { label: "B. AI to safely trigger Mode A or Mode B flows", value: "B" },
        { label: "C. Voice recognition", value: "C" },
        { label: "D. Payment processing", value: "D" }
      ])] },
      { fields: [createMultipleChoice("Quiz1_Q5", "5. In regulated industries, the biggest risk is:", [
        { label: "A. UI design", value: "A" },
        { label: "B. Customers forgetting their passwords", value: "B" },
        { label: "C. Agents deviating from required steps", value: "C" },
        { label: "D. Unpopular branding", value: "D" }
      ])] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Quiz 1",
  isLastStep: false
});

// Quiz 2 (Speech to text only)
cvuf.form.steps.push({
  stepName: "Quiz 2",
  identifier: "step_quiz2",
  buttonsConfig: {
    back: { className: "", isHidden: false, text: "" },
    next: { className: "disabled", isHidden: false, text: "Next" },
    targetStep: "step_check1"
  },
  blocks: [{
    blockName: "Quiz 2",
    identifier: "block_quiz2",
    icon: "",
    rows: [
      { fields: [createHeading()] },
      { fields: [createParagraph(`<p><strong>QUIZ:</strong> Explain CallVu in 20 seconds.</p><p><strong>Your answer should include:</strong></p><ul><li>Completion & compliance layer</li><li>Micro-apps</li><li>Mode A + Mode B</li><li>Works across channels</li><li>Not a bot</li></ul>`)] },
      { fields: [createVoiceRecorder("Quiz2", "Quiz 2: 20-Second Pitch")] },
      { fields: [createAnswerField("Answer_Quiz2", "Your Response")] }
    ],
    style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: false,
  text: "Quiz 2",
  isLastStep: false
});

// Check 1-4 (All speech to text)
const checkQuestions = [
  "Explain Mode A in two sentences.",
  "Explain Mode B in two sentences.",
  "Why can't bots replace CallVu?",
  "What layer contains the deterministic execution engine?"
];

checkQuestions.forEach((question, idx) => {
  const num = idx + 1;
  const nextStep = num === 4 ? "step_complete" : `step_check${num + 1}`;
  cvuf.form.steps.push({
    stepName: `Check ${num}`,
    identifier: `step_check${num}`,
    buttonsConfig: {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "disabled", isHidden: false, text: num === 4 ? "Submit Quiz" : "Next" },
      targetStep: nextStep
    },
    blocks: [{
      blockName: `Check ${num}`,
      identifier: `block_check${num}`,
      icon: "",
      rows: [
        { fields: [createHeading()] },
        { fields: [createParagraph(`<p><strong>CHECK ${num}:</strong></p><p>${question}</p>`)] },
        { fields: [createVoiceRecorder(`Check${num}`, `Check ${num}`)] },
        { fields: [createAnswerField(`Answer_Check${num}`, "Your Response")] }
      ],
      style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
      type: "regular"
    }],
    style: { alignment: "" },
    hideFooter: false,
    text: `Check ${num}`,
    isLastStep: false
  });
});

// Complete step
cvuf.form.steps.push({
  stepName: "Complete",
  identifier: "step_complete",
  buttonsConfig: {
    back: { className: "", isHidden: true, text: "" },
    next: { className: "", isHidden: true, text: "" },
    targetStep: ""
  },
  blocks: [{
    blockName: "",
    identifier: "block_complete",
    icon: "",
    rows: [{
      fields: [createParagraph(`
<h2>🎉 Quiz Complete!</h2>
<p>Thank you for completing the CallVu Sales Enablement Quiz.</p>
<p>Your responses have been recorded and will be reviewed.</p>
      `)]
    }],
    style: { alignment: "center", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
    type: "regular"
  }],
  style: { alignment: "" },
  hideFooter: true,
  text: "Complete",
  isLastStep: true
});

// Update integration script mapping
const integrationScript = `
(function() {
  'use strict';
  
  const RECORDER_URL = 'https://callvusalesenablementquiz2.vercel.app/embed';
  
  let userInfo = { name: '', email: '' };
  
  function getUserInfo() {
    const nameField = document.querySelector('[data-integration-id="RepName"], [name*="RepName"]');
    const emailField = document.querySelector('[data-integration-id="RepEmail"], [name*="RepEmail"], input[type="email"]');
    if (nameField) userInfo.name = nameField.value || '';
    if (emailField) userInfo.email = emailField.value || '';
    return userInfo;
  }
  
  window.addEventListener('message', function(event) {
    if (!event.origin.includes('callvusalesenablementquiz2.vercel.app')) return;
    
    const data = event.data;
    if (data.type === 'VOICE_RESPONSE_READY') {
      const fieldId = getFieldIdForQuestion(data.questionId);
      if (fieldId) {
        const field = document.querySelector(\`[data-integration-id="\${fieldId}"], [name*="\${fieldId}"]\`);
        if (field) {
          field.value = data.transcript;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      enableNextButton();
    }
    if (data.type === 'VOICE_RESPONSE_DELETED') {
      const fieldId = getFieldIdForQuestion(data.questionId);
      if (fieldId) {
        const field = document.querySelector(\`[data-integration-id="\${fieldId}"], [name*="\${fieldId}"]\`);
        if (field) {
          field.value = '';
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      disableNextButton();
    }
  });
  
  function getFieldIdForQuestion(questionId) {
    const mapping = {
      'Roleplay1': 'Answer_Roleplay1', 'Roleplay2': 'Answer_Roleplay2', 'Roleplay3': 'Answer_Roleplay3',
      'Roleplay4': 'Answer_Roleplay4', 'Roleplay5': 'Answer_Roleplay5', 'Roleplay6': 'Answer_Roleplay6',
      'Roleplay7': 'Answer_Roleplay7',
      'DrillA': 'Answer_DrillA', 'DrillB': 'Answer_DrillB',
      'Scenario1': 'Answer_Scenario1', 'Scenario2': 'Answer_Scenario2', 'Scenario3': 'Answer_Scenario3', 'Scenario4': 'Answer_Scenario4',
      'Quiz2': 'Answer_Quiz2',
      'Check1': 'Answer_Check1', 'Check2': 'Answer_Check2', 'Check3': 'Answer_Check3', 'Check4': 'Answer_Check4'
    };
    return mapping[questionId] || '';
  }
  
  function enableNextButton() {
    const nextButton = document.querySelector('button[type="submit"], .next-button, [data-action="next"]');
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.classList.remove('disabled', 'opacity-50');
    }
  }
  
  function disableNextButton() {
    const nextButton = document.querySelector('button[type="submit"], .next-button, [data-action="next"]');
    if (nextButton) {
      nextButton.disabled = true;
      nextButton.classList.add('disabled', 'opacity-50');
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(getUserInfo, 1000);
    });
  } else {
    setTimeout(getUserInfo, 1000);
  }
  
  document.addEventListener('input', function(e) {
    if (e.target.name && (e.target.name.includes('RepName') || e.target.name.includes('name'))) {
      userInfo.name = e.target.value;
    }
    if (e.target.type === 'email' || (e.target.name && e.target.name.includes('RepEmail'))) {
      userInfo.email = e.target.value;
    }
  });
})();
`;

cvuf.form.formCustomStyle = `
<style>
  textarea[data-integration-id^="Answer_"] {
    pointer-events: none;
    background-color: #f9fafb;
    cursor: not-allowed;
  }
  button.disabled, button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  iframe[id^="voice-recorder-"] {
    min-height: 500px;
  }
</style>
<script src="https://callvusalesenablementquiz2.vercel.app/callvu-integration.js"></script>
`;

// Write the CVUF file
const outputPath = path.join(__dirname, 'Sales_Enablement_Quiz_Custom.cvuf');
fs.writeFileSync(outputPath, JSON.stringify(cvuf, null, 2));
console.log('✅ Custom CVUF created successfully!');
console.log(`   File: ${outputPath}`);
console.log(`   Total steps: ${cvuf.form.steps.length}`);
console.log(`   - Intro`);
console.log(`   - Rep Info`);
console.log(`   - Roleplays 1-7 (speech to text)`);
console.log(`   - Drill A & B (speech to text)`);
console.log(`   - Drill C (multiple choice)`);
console.log(`   - Exercise Set A (Mode A/B selection)`);
console.log(`   - Scenarios 1-4 (speech to text)`);
console.log(`   - Quiz 1 (5 multiple choice questions)`);
console.log(`   - Quiz 2 (speech to text)`);
console.log(`   - Check 1-4 (speech to text)`);
console.log(`   - Complete`);

