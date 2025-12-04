/**
 * Create polished CVUF with proper branding, hierarchy, and grouped progress bar
 */

const fs = require('fs');
const path = require('path');

// CallVu branding - using main logo from website
const CALLVU_LOGO_URL = 'https://www.callvu.com/wp-content/uploads/2024/01/callvu-logo.svg'; // Main CallVu logo
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

// Helper functions
function createSmallHeading() {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: "small_heading",
    integrationID: "SmallHeading",
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
    editedParagraph: `<p style="text-align: center; color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Sales Enablement Quiz - Mode A and B</p>`,
    localOnly: true
  };
}

function createLargeHeading(title) {
  return {
    className: "",
    clearable: false,
    hint: "",
    identifier: "large_heading",
    integrationID: "LargeHeading",
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
    editedParagraph: `<h1 style="text-align: center; color: #1f2937; font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">${title}</h1>`,
    localOnly: true
  };
}

function getInlineVoiceRecorder(questionId, questionTitle, answerFieldId) {
  const html = fs.readFileSync(path.join(__dirname, 'inline-voice-recorder.html'), 'utf8');
  return html
    .replace(/QUESTION_ID_PLACEHOLDER/g, questionId)
    .replace(/QUESTION_TITLE_PLACEHOLDER/g, questionTitle)
    .replace(/ANSWER_FIELD_ID_PLACEHOLDER/g, answerFieldId)
    .replace(/PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE/g, WEBHOOK_URL);
}

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

// Create CVUF with grouped steps
const cvuf = {
  form: {
    accessibility: false,
    actions: [],
    approveData: {
      enabled: false,
      forceApproveBeforeShowingDownload: false,
      toCloseForm: false,
      popupObj: { errorMsg: "", fieldType: "", message: "", title: "" },
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
  button.disabled, button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Sophisticated progress bar styling */
  .callvu-stepper {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }
  
  .callvu-stepper-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    background: #f8fafc;
    margin: 4px 0;
  }
  
  .callvu-stepper-group-label {
    font-weight: 600;
    font-size: 13px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 100px;
  }
  
  .callvu-stepper-items {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .callvu-stepper-item {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    background: #e2e8f0;
    color: #475569;
    transition: all 0.2s;
  }
  
  .callvu-stepper-item.active {
    background: #3b82f6;
    color: white;
  }
  
  .callvu-stepper-item.completed {
    background: #10b981;
    color: white;
  }
  
  .callvu-progress-number {
    font-weight: 700;
    font-size: 14px;
    color: #1e293b;
  }
</style>
    `.trim(),
    formName: "CallVu Sales Enablement Quiz",
    globalVariables: [],
    hintMsgProps: { text: "", hideOnScroll: false },
    isDownloadPDFLink: false,
    isFormReadonly: false,
    isPdfForm: false,
    isSinglePage: false,
    last_update: "",
    logo: "",
    logoAlignment: "center",
    logoName: "",
    logoUrl: CALLVU_LOGO_URL, // Main CallVu logo from website
    notResizable: true,
    otp: {
      buttonText: "", description: "", emptyFieldValidation: "", invalidFieldValidation: "",
      isActive: false, label: "", logo: "", logoName: "", resendText: "", serviceUrl: "",
      title: "", validResponse: false, validateUrl: false, redirectAfterSubmit: false,
      redirectLink: "", isAuth: false, optionalFields: []
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
      primary: "hsl(210, 100%, 45%)", // CallVu blue
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
    formCSS: { ID: "", Name: "", Description: "", CSS: "" },
    id: null,
    backgroundUrl: { desktop: "", mobile: "" }
  }
};

// Intro
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
        createSmallHeading(),
        createLargeHeading("Welcome"),
        createParagraph(`
<p style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0 auto;">
This assessment will test your understanding of CallVu's Mode A and Mode B architecture.
</p>
<p style="margin-top: 24px; color: #6b7280; font-size: 14px;"><strong>Instructions:</strong></p>
<ul style="color: #4b5563; font-size: 14px; line-height: 1.8;">
  <li>Each question requires a voice response</li>
  <li>Speak clearly and cover all key points</li>
  <li>Your responses will be recorded and reviewed</li>
  <li>You can keep or delete your response to try again</li>
</ul>
<p style="margin-top: 16px; color: #9ca3af; font-size: 13px; font-style: italic;">Time estimate: 20-30 minutes</p>
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

// Rep Info
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Your Information")] },
      { fields: [{
        className: "", clearable: false, hint: "", identifier: "rep_name",
        integrationID: "RepName", isHiddenInRuntime: false, label: "Your Full Name",
        maskingViewer: "none", name: "editor.fields.shortText", permission: "both",
        readOnly: false, required: true, tooltip: "", type: "shortText",
        validations: [], width: "full", columnID: 0
      }]},
      { fields: [{
        className: "", clearable: false, hint: "", identifier: "rep_email",
        integrationID: "RepEmail", isHiddenInRuntime: false, label: "Email Address",
        maskingViewer: "none", name: "editor.fields.emailinput", permission: "both",
        readOnly: false, required: true, tooltip: "", type: "emailInput",
        validations: [], width: "full", columnID: 0, icon: "fa-envelope"
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
  const questionId = `Roleplay${num}`;
  const answerFieldId = `Answer_Roleplay${num}`;
  const nextStep = num === 7 ? "step_drill_a" : `step_roleplay${num + 1}`;
  
  cvuf.form.steps.push({
    stepName: `Roleplay ${num}`,
    identifier: `step_roleplay${num}`,
    buttonsConfig: {
      back: { className: "", isHidden: false, text: "" },
      next: { className: "disabled", isHidden: false, text: "Next" },
      targetStep: nextStep
    },
    blocks: [{
      blockName: `Roleplay ${num}`,
      identifier: `block_roleplay${num}`,
      icon: "",
      rows: [
        { fields: [createSmallHeading()] },
        { fields: [createLargeHeading(`Roleplay ${num}`)] },
        { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">SCENARIO:</strong></p><p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 8px;">${scenario}</p>`)] },
        { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 16px;"><strong style="color: #1f2937;">YOUR TASK:</strong> Provide your response using the voice recorder below.</p>`)] },
        { fields: [createParagraph(getInlineVoiceRecorder(questionId, `Roleplay ${num}`, answerFieldId))] },
        { fields: [createAnswerField(answerFieldId, "Your Response")] }
      ],
      style: { alignment: "", nobackground: false, noborders: false, size: "full", background: "#ffffff" },
      type: "regular"
    }],
    style: { alignment: "" },
    hideFooter: false,
    text: `Roleplay ${num}`,
    isLastStep: false
  });
});

// Drill A
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Drill A")] },
      { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">DRILL:</strong> Explain the CallVu architecture in 30 seconds.</p><p style="color: #4b5563; font-size: 15px; margin-top: 12px;"><strong>You must include:</strong></p><ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin-top: 8px;"><li>Micro-apps</li><li>Orchestration</li><li>Two modes</li><li>Compliance</li></ul>`)] },
      { fields: [createParagraph(getInlineVoiceRecorder("DrillA", "Drill A: Architecture Explanation", "Answer_DrillA"))] },
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

// Drill B
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Drill B")] },
      { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">DRILL:</strong> Explain why EACH of these statements is WRONG:</p><ol style="color: #4b5563; font-size: 15px; line-height: 1.8; margin-top: 12px;"><li>"CallVu is like a form builder."</li><li>"Mode A is just self-service."</li><li>"Mode B is basically RPA."</li><li>"Bots + CallVu are interchangeable."</li></ol>`)] },
      { fields: [createParagraph(getInlineVoiceRecorder("DrillB", "Drill B: Spot Wrong Analogies", "Answer_DrillB"))] },
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Drill C")] },
      { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">DRILL:</strong> Select the correct answer.</p>`)] },
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

// Exercise Set A
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Exercise Set A")] },
      { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">EXERCISE:</strong> Classify each use case as Mode A only, Mode B only, or Mode A → Mode B hybrid</p>`)] },
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

// Scenarios 1-4
const scenarioQuestions = [
  "An agent accidentally skips a required disclosure step during a claims intake. Would this be possible in Mode A or Mode B?",
  "An AI agent decides to reorder steps in a workflow based on probability. Would CallVu allow this in Mode B?",
  "A customer submits an incomplete KYC step. What mode handles this? What happens?",
  "Backend system fails mid-update. What does Mode B do?"
];

scenarioQuestions.forEach((question, idx) => {
  const num = idx + 1;
  const questionId = `Scenario${num}`;
  const answerFieldId = `Answer_Scenario${num}`;
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
        { fields: [createSmallHeading()] },
        { fields: [createLargeHeading(`Scenario ${num}`)] },
        { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">SCENARIO:</strong></p><p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 8px;">${question}</p>`)] },
        { fields: [createParagraph(getInlineVoiceRecorder(questionId, `Scenario ${num}`, answerFieldId))] },
        { fields: [createAnswerField(answerFieldId, "Your Response")] }
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

// Quiz 1 (Multiple Choice)
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Quiz 1")] },
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

// Quiz 2
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
      { fields: [createSmallHeading()] },
      { fields: [createLargeHeading("Quiz 2")] },
      { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">QUIZ:</strong> Explain CallVu in 20 seconds.</p><p style="color: #4b5563; font-size: 15px; margin-top: 12px;"><strong>Your answer should include:</strong></p><ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin-top: 8px;"><li>Completion & compliance layer</li><li>Micro-apps</li><li>Mode A + Mode B</li><li>Works across channels</li><li>Not a bot</li></ul>`)] },
      { fields: [createParagraph(getInlineVoiceRecorder("Quiz2", "Quiz 2: 20-Second Pitch", "Answer_Quiz2"))] },
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

// Check 1-4
const checkQuestions = [
  "Explain Mode A in two sentences.",
  "Explain Mode B in two sentences.",
  "Why can't bots replace CallVu?",
  "What layer contains the deterministic execution engine?"
];

checkQuestions.forEach((question, idx) => {
  const num = idx + 1;
  const questionId = `Check${num}`;
  const answerFieldId = `Answer_Check${num}`;
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
        { fields: [createSmallHeading()] },
        { fields: [createLargeHeading(`Check ${num}`)] },
        { fields: [createParagraph(`<p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong style="color: #1f2937;">CHECK ${num}:</strong></p><p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 8px;">${question}</p>`)] },
        { fields: [createParagraph(getInlineVoiceRecorder(questionId, `Check ${num}`, answerFieldId))] },
        { fields: [createAnswerField(answerFieldId, "Your Response")] }
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

// Complete
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
<h2 style="text-align: center; color: #1f2937; font-size: 28px; font-weight: 700; margin-bottom: 16px;">🎉 Quiz Complete!</h2>
<p style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6;">Thank you for completing the CallVu Sales Enablement Quiz.</p>
<p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 8px;">Your responses have been recorded and will be reviewed.</p>
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

// Write CVUF
const outputPath = path.join(__dirname, 'Sales_Enablement_Quiz_POLISHED.cvuf');
fs.writeFileSync(outputPath, JSON.stringify(cvuf, null, 2));
console.log('✅ Polished CVUF created!');
console.log(`   File: ${outputPath}`);
console.log(`   ✅ CallVu main logo from website`);
console.log(`   ✅ Fixed heading hierarchy (large question title, small quiz name)`);
console.log(`   ✅ Sophisticated styling aligned with CallVu branding`);
console.log(`   ✅ All responses go to your Google Sheet`);

