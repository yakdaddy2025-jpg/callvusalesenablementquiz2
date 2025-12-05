/**
 * Add CallVu global variable + conditional logic to auto-fill required fields
 * Strategy: 
 * 1. Create global variable that iframe can update via postMessage
 * 2. Use "Update" rules to copy global variable to required fields
 * This avoids CORS issues completely!
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_WITH_CONDITIONAL_LOGIC_1764950872678.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_GLOBAL_VARIABLE_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Adding CallVu global variable + conditional logic...\n');

// Initialize globalVariables if it doesn't exist
if (!cvuf.form.globalVariables) {
  cvuf.form.globalVariables = [];
}

// Create global variable for voice transcript
const globalVariable = {
  "integrationID": "GV_Voice_Transcript",
  "description": "Stores the voice transcript from the iframe voice recorder. Updated when user clicks 'Keep Response'.",
  "localOnly": false, // Can be accessed from iframe
  "value": "", // Initial empty value
  "items": [] // No items needed for a text variable
};

// Check if global variable already exists
const existingGlobalVar = cvuf.form.globalVariables.find(gv => gv.integrationID === "GV_Voice_Transcript");
if (!existingGlobalVar) {
  cvuf.form.globalVariables.push(globalVariable);
  console.log('✅ Added global variable: GV_Voice_Transcript');
} else {
  console.log('⚠️  Global variable already exists, updating...');
  Object.assign(existingGlobalVar, globalVariable);
}

// Initialize dynamicFieldRules if it doesn't exist
if (!cvuf.form.dynamicFieldRules) {
  cvuf.form.dynamicFieldRules = [];
}

let rulesUpdated = 0;

cvuf.form.steps.forEach((step, stepIndex) => {
  const stepName = step.stepName || step.text || '';
  const isRoleplayStep = stepName.toLowerCase().includes('roleplay') ||
                        stepName.toLowerCase().includes('drill') ||
                        stepName.toLowerCase().includes('scenario') ||
                        stepName.toLowerCase().includes('quiz') ||
                        stepName.toLowerCase().includes('check');
  
  if (!isRoleplayStep) return;
  
  step.blocks?.forEach((block) => {
    block.rows?.forEach((row) => {
      // Find the required "*Your Response" field
      const requiredField = row.fields?.find(f => 
        f.type === 'longText' && 
        f.label && 
        f.label.includes('*Your Response') &&
        f.required === true
      );
      
      if (!requiredField) return;
      
      const requiredFieldId = requiredField.integrationID;
      
      // Update or create rule to copy from global variable
      const existingRule = cvuf.form.dynamicFieldRules.find(r => 
        r.stepId === step.identifier && 
        r.ruleType === "update" &&
        r.actions?.[0]?.targetFieldId === requiredFieldId
      );
      
      if (existingRule) {
        // Update existing rule to use global variable
        existingRule.conditions = [
          {
            "fieldId": "GV_Voice_Transcript", // Global variable
            "operator": "isNotEmpty",
            "value": ""
          }
        ];
        existingRule.actions = [
          {
            "actionType": "updateField",
            "targetFieldId": requiredFieldId,
            "sourceFieldId": "GV_Voice_Transcript", // Copy from global variable
            "updateType": "copyValue"
          }
        ];
        existingRule.ruleName = `Auto-fill Response from Global Variable for ${stepName}`;
        rulesUpdated++;
        console.log(`   ✅ Updated rule for ${stepName} to use global variable`);
      } else {
        // Create new rule
        const rule = {
          "ruleName": `Auto-fill Response from Global Variable for ${stepName}`,
          "ruleType": "update",
          "enabled": true,
          "conditions": [
            {
              "fieldId": "GV_Voice_Transcript", // Global variable
              "operator": "isNotEmpty",
              "value": ""
            }
          ],
          "actions": [
            {
              "actionType": "updateField",
              "targetFieldId": requiredFieldId,
              "sourceFieldId": "GV_Voice_Transcript", // Copy from global variable
              "updateType": "copyValue"
            }
          ],
          "stepId": step.identifier,
          "priority": 1
        };
        
        cvuf.form.dynamicFieldRules.push(rule);
        rulesUpdated++;
        console.log(`   ✅ Created rule for ${stepName} using global variable`);
      }
    });
  });
});

console.log(`\n✅ Updated/Created ${rulesUpdated} conditional logic rules to use global variable`);
console.log(`\n📋 Solution Structure:`);
console.log(`   1. Global Variable: GV_Voice_Transcript (updated by iframe via postMessage)`);
console.log(`   2. Update Rules: Copy global variable → required field (per step)`);
console.log(`   3. JavaScript: Updates global variable, CallVu copies to required field`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

