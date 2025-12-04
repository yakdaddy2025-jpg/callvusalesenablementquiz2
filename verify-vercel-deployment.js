/**
 * Verify Vercel deployment and check if embed page exists
 * Also check what the correct Vercel URL should be
 */

console.log('Checking Vercel deployment...');
console.log('Expected URL: https://callvusalesenablementquiz2.vercel.app');
console.log('Embed page should be at: https://callvusalesenablementquiz2.vercel.app/embed');
console.log('');
console.log('If you see a 404 error, it means:');
console.log('1. Vercel hasn\'t deployed yet (wait 2-3 minutes after git push)');
console.log('2. The embed.js page might not be in the pages/ directory');
console.log('3. The Vercel project might need to be redeployed');
console.log('');
console.log('To fix:');
console.log('1. Go to https://vercel.com and check your deployment');
console.log('2. Make sure the deployment succeeded');
console.log('3. Try accessing https://callvusalesenablementquiz2.vercel.app/embed directly');
console.log('4. If it works, the iframe should work in CallVu');

