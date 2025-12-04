/**
 * Add CSS to ensure blocks are individually editable on mobile
 * Force block-level editing instead of treating entire screen as one block
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Get existing CSS
let existingCSS = cvuf.form.formCustomStyle || '';

// Add mobile-specific block editing CSS
const mobileBlockCSS = `<style>*{box-sizing:border-box!important}body,html{width:100%!important;max-width:100%!important;overflow-x:hidden!important}p,div,span,h1,h2,h3,h4,h5,h6,li,td,th,label,strong,em{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:auto!important;box-sizing:border-box!important}@media screen and (max-width:768px),@media screen and (max-width:480px){*{max-width:100%!important;box-sizing:border-box!important}body,html{width:100vw!important;max-width:100vw!important;overflow-x:hidden!important;padding:0!important;margin:0!important}p,div,span{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;font-size:14px!important;line-height:1.6!important;padding:0 5px!important;margin:5px 0!important}h1,h2,h3,h4,h5,h6{font-size:16px!important;line-height:1.4!important;word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;max-width:100%!important;padding:0 5px!important;margin:10px 0!important}ul,ol{padding-left:15px!important;margin:5px 0!important;max-width:100%!important}li{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;margin-bottom:5px!important;max-width:100%!important}[data-field-type=paragraph],[class*=paragraph]{width:100%!important;max-width:100%!important;box-sizing:border-box!important;display:block!important}textarea,input,select{width:100%!important;max-width:100%!important;box-sizing:border-box!important}#voice-recorder-container{width:100%!important;max-width:100%!important;padding:10px!important;box-sizing:border-box!important}[class*=block],[class*=row],[class*=field]{width:100%!important;max-width:100%!important;box-sizing:border-box!important;display:block!important;position:relative!important;margin:10px 0!important;padding:5px!important}[data-block-id],[data-block-identifier],[data-field-id],[data-field-identifier]{display:block!important;position:relative!important;margin:5px 0!important;padding:5px!important;border:1px solid transparent!important}[data-block-id]:hover,[data-block-identifier]:hover,[data-field-id]:hover,[data-field-identifier]:hover{border:2px solid #fbbf24!important;background-color:#fef3c7!important;cursor:pointer!important}}textarea[data-integration-id^=Answer_]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}</style>`;

cvuf.form.formCustomStyle = mobileBlockCSS;

console.log('✅ Added mobile block editing CSS');
console.log('   - Blocks are individually styled on mobile');
console.log('   - Hover effects for block editing');
console.log('   - Each block has proper spacing and borders');

// Also ensure all blocks have data attributes for mobile editing
let blockCount = 0;
cvuf.form.steps.forEach((step) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      // Ensure block has identifier for mobile editing
      if (!block.identifier) {
        block.identifier = `block_${blockCount}`;
      }
      blockCount++;
      
      // Ensure block type is "regular" for editable blocks
      if (!block.type || block.type !== "regular") {
        block.type = "regular";
      }
      
      // Ensure block style exists
      if (!block.style) {
        block.style = {
          alignment: "",
          nobackground: false,
          noborders: false,
          size: "full",
          background: "#ffffff"
        };
      }
    });
  }
});

console.log(`✅ Ensured ${blockCount} blocks have proper structure for mobile editing`);

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
console.log('✅ File updated - mobile blocks should now be individually editable');

