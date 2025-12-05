/**
 * Add CallVu conditional logic rules to auto-fill required response field
 * Strategy: Create hidden field that iframe can fill, then use "Update" rule to copy to required field
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Sales_Enablement_Quiz_FILLABLE_FIELD_1764950514219.cvuf');
const timestamp = Date.now();
const newFileName = `Sales_Enablement_Quiz_WITH_CONDITIONAL_LOGIC_${timestamp}.cvuf`;
const newPath = path.join(__dirname, newFileName);

let cvuf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Adding CallVu conditional logic rules to auto-fill required fields...\n');

// Initialize dynamicFieldRules if it doesn't exist
if (!cvuf.form.dynamicFieldRules) {
  cvuf.form.dynamicFieldRules = [];
}

let rulesAdded = 0;
let hiddenFieldsAdded = 0;

cvuf.form.steps.forEach((step, stepIndex) => {
  // Find steps with voice recorders (roleplay, drill, scenario, quiz, check steps)
  const stepName = step.stepName || step.text || '';
  const isRoleplayStep = stepName.toLowerCase().includes('roleplay') ||
                        stepName.toLowerCase().includes('drill') ||
                        stepName.toLowerCase().includes('scenario') ||
                        stepName.toLowerCase().includes('quiz') ||
                        stepName.toLowerCase().includes('check');
  
  if (!isRoleplayStep) return;
  
  step.blocks?.forEach((block, blockIndex) => {
    block.rows?.forEach((row, rowIndex) => {
      // Find the required "*Your Response" field
      const requiredField = row.fields?.find(f => 
        f.type === 'longText' && 
        f.label && 
        f.label.includes('*Your Response') &&
        f.required === true
      );
      
      if (!requiredField) return;
      
      const requiredFieldId = requiredField.integrationID;
      console.log(`   Found required field in ${stepName}: ${requiredFieldId}`);
      
      // Check if hidden field already exists in this row
      const existingHiddenField = row.fields?.find(f => 
        f.type === 'textInput' && 
        f.integrationID && 
        f.integrationID.includes('_Hidden_Transcript_')
      );
      
      let hiddenFieldId;
      
      if (!existingHiddenField) {
        // Create a hidden text input field that the iframe can fill
        const hiddenField = {
          "className": "",
          "clearable": false,
          "hint": "",
          "identifier": `id_${stepName.toLowerCase().replace(/\s+/g, '_')}_hidden_transcript_${timestamp}`,
          "integrationID": `ID_${stepName.replace(/\s+/g, '_')}_Hidden_Transcript_${timestamp}`,
          "isHiddenInRuntime": true, // Hidden from user
          "label": "Hidden Transcript Field",
          "maskingViewer": "none",
          "name": "editor.fields.textInput",
          "permission": "both",
          "readOnly": false,
          "required": false,
          "tooltip": "",
          "type": "textInput",
          "validations": [],
          "width": "full",
          "columnID": 0,
          "maxLength": 5000
        };
        
        // Add hidden field to the row (before the required field)
        const requiredFieldIndex = row.fields.findIndex(f => f.integrationID === requiredFieldId);
        row.fields.splice(requiredFieldIndex, 0, hiddenField);
        hiddenFieldId = hiddenField.integrationID;
        hiddenFieldsAdded++;
        console.log(`   ✅ Added hidden field: ${hiddenFieldId}`);
      } else {
        hiddenFieldId = existingHiddenField.integrationID;
        console.log(`   Using existing hidden field: ${hiddenFieldId}`);
      }
      
      // Create "Update" rule: When hidden field changes, update required field
      const rule = {
        "ruleName": `Auto-fill Response for ${stepName}`,
        "ruleType": "update", // Update rule type
        "enabled": true,
        "conditions": [
          {
            "fieldId": hiddenFieldId,
            "operator": "isNotEmpty", // Trigger when hidden field has value
            "value": ""
          }
        ],
        "actions": [
          {
            "actionType": "updateField",
            "targetFieldId": requiredFieldId,
            "sourceFieldId": hiddenFieldId, // Copy from hidden field to required field
            "updateType": "copyValue" // Copy the value
          }
        ],
        "stepId": step.identifier,
        "priority": 1
      };
      
      // Check if rule already exists
      const existingRule = cvuf.form.dynamicFieldRules.find(r => 
        r.stepId === step.identifier && 
        r.ruleType === "update" &&
        r.actions?.[0]?.targetFieldId === requiredFieldId
      );
      
      if (!existingRule) {
        cvuf.form.dynamicFieldRules.push(rule);
        rulesAdded++;
        console.log(`   ✅ Added Update rule for ${stepName}`);
      } else {
        console.log(`   Rule already exists for ${stepName}`);
      }
    });
  });
});

console.log(`\n✅ Added ${hiddenFieldsAdded} hidden fields`);
console.log(`✅ Added ${rulesAdded} conditional logic rules`);
console.log(`\n📋 Rule Structure:`);
console.log(`   - Hidden field: Filled by iframe (no CORS issues)`);
console.log(`   - Update rule: Copies hidden field → required field`);
console.log(`   - Required field: Gets filled automatically by CallVu`);

// Save
fs.writeFileSync(newPath, JSON.stringify(cvuf, null, 2), 'utf8');
console.log(`\n💾 Saved to: ${newFileName}`);

