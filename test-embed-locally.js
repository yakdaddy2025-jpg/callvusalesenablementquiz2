/**
 * Test if embed page can be accessed
 * Check Vercel deployment status
 */

console.log('Checking embed page setup...\n');
console.log('Expected URL: https://callvusalesenablementquiz2.vercel.app/embed\n');
console.log('Possible issues:');
console.log('1. Vercel hasn\'t deployed yet (wait 2-3 minutes after git push)');
console.log('2. The embed.js file might not be in pages/ directory');
console.log('3. Next.js routing might not be working');
console.log('4. Vercel build might have failed\n');
console.log('To fix:');
console.log('1. Go to https://vercel.com and check your deployment status');
console.log('2. Make sure the deployment succeeded (green checkmark)');
console.log('3. Try accessing https://callvusalesenablementquiz2.vercel.app/embed directly in browser');
console.log('4. If it still 404s, check Vercel build logs for errors\n');
console.log('Alternative: Use inline voice recorder instead of iframe (no Vercel needed)');

