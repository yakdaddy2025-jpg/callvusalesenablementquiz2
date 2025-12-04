/**
 * Aggressively fix mobile text wrapping and block structure
 * Add inline styles directly to paragraph content
 * Ensure mobile view uses same block architecture as desktop
 */

const fs = require('fs');
const path = require('path');

const cvufPath = path.join(__dirname, 'Sales_Enablement_Quiz_EDITABLE.cvuf');
const cvuf = JSON.parse(fs.readFileSync(cvufPath, 'utf8'));

// Ultra-aggressive mobile CSS - force everything to wrap
const mobileCSS = '<style>*{box-sizing:border-box!important}body,html{width:100%!important;max-width:100%!important;overflow-x:hidden!important}p,div,span,h1,h2,h3,h4,h5,h6,li,td,th,label,strong,em{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:auto!important;box-sizing:border-box!important}@media screen and (max-width:768px),@media screen and (max-width:480px){*{max-width:100%!important;box-sizing:border-box!important}body,html{width:100vw!important;max-width:100vw!important;overflow-x:hidden!important;padding:0!important;margin:0!important}p,div,span{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;font-size:14px!important;line-height:1.6!important;padding:0 5px!important;margin:5px 0!important}h1,h2,h3,h4,h5,h6{font-size:16px!important;line-height:1.4!important;word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;max-width:100%!important;padding:0 5px!important;margin:10px 0!important}ul,ol{padding-left:15px!important;margin:5px 0!important;max-width:100%!important}li{word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;margin-bottom:5px!important;max-width:100%!important}[data-field-type=paragraph],[class*=paragraph]{width:100%!important;max-width:100%!important;box-sizing:border-box!important;display:block!important}textarea,input,select{width:100%!important;max-width:100%!important;box-sizing:border-box!important}#voice-recorder-container{width:100%!important;max-width:100%!important;padding:10px!important;box-sizing:border-box!important}[class*=block],[class*=row],[class*=field]{width:100%!important;max-width:100%!important;box-sizing:border-box!important;display:block!important}}textarea[data-integration-id^=Answer_]{pointer-events:none;background-color:#f9fafb;cursor:not-allowed}button.disabled,button[disabled]{opacity:0.5;cursor:not-allowed}</style>';

cvuf.form.formCustomStyle = mobileCSS;

console.log('✅ Added ultra-aggressive mobile CSS');
console.log('   - Forces all text to wrap with word-break');
console.log('   - Prevents horizontal overflow');
console.log('   - Makes all blocks full-width on mobile');

// Now add inline styles directly to paragraph content for extra safety
let fixedCount = 0;
cvuf.form.steps.forEach((step, stepIdx) => {
  if (step.blocks) {
    step.blocks.forEach((block) => {
      if (block.rows) {
        block.rows.forEach((row) => {
          if (row.fields) {
            row.fields.forEach((field) => {
              if (field.type === 'paragraph' && field.editedParagraph) {
                let content = field.editedParagraph;
                
                // Remove Windows line endings
                content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                
                // Add aggressive mobile wrapping to all elements
                // Wrap entire content in a div with mobile styles
                if (!content.includes('mobile-wrap-container')) {
                  content = `<div class="mobile-wrap-container" style="word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;hyphens:auto!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;padding:0 5px!important;">${content}</div>`;
                  field.editedParagraph = content;
                  fixedCount++;
                }
                
                // Also add inline styles to all p, div, span, strong, em tags
                content = content.replace(
                  /<(p|div|span|h1|h2|h3|h4|h5|h6|strong|em|li)([^>]*)>/gi,
                  (match, tag, attrs) => {
                    // Check if style attribute exists
                    if (attrs.includes('style=')) {
                      // Add mobile styles to existing style
                      attrs = attrs.replace(
                        /style="([^"]*)"/gi,
                        (styleMatch, styles) => {
                          if (!styles.includes('word-wrap') && !styles.includes('overflow-wrap')) {
                            return `style="${styles};word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;max-width:100%!important;box-sizing:border-box!important;"`;
                          }
                          return styleMatch;
                        }
                      );
                    } else {
                      // Add new style attribute
                      attrs += ' style="word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-word!important;max-width:100%!important;box-sizing:border-box!important;"';
                    }
                    return `<${tag}${attrs}>`;
                  }
                );
                
                field.editedParagraph = content;
              }
            });
          }
        });
      }
    });
  }
});

console.log(`✅ Added inline mobile styles to ${fixedCount} paragraph fields`);
console.log('   - All text elements now have inline wrapping styles');
console.log('   - This ensures mobile view respects text wrapping');

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
console.log('✅ File updated with aggressive mobile fixes');

