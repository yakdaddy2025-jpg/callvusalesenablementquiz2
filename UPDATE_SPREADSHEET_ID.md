# Update Spreadsheet ID

## New Spreadsheet
**Published URL:** https://docs.google.com/spreadsheets/d/e/2PACX-1vQQLzNTy5P-Fx--S6PBBKT_nx2IeZEpDyUK7AQcpCnLpoLsEGuWbxGAEHkcT_mnus3bgOG_OE2ksk6h/pubhtml

## To Get the Actual Spreadsheet ID:

1. Open the spreadsheet in edit mode (not the published view)
2. Look at the URL - it should be like:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
3. Copy the ID between `/d/` and `/edit`

## Update Google Apps Script:

1. Go to https://script.google.com
2. Open your script
3. Find this line:
   ```javascript
   const SPREADSHEET_ID = '2PACX-1vQQLzNTy5P-Fx--S6PBBKT_nx2IeZEpDyUK7AQcpCnLpoLsEGuWbxGAEHkcT_mnus3bgOG_OE2ksk6h';
   ```
4. Replace with the actual spreadsheet ID from the edit URL
5. Save and redeploy

## Alternative: Use Spreadsheet Name

The script will also try to find the spreadsheet by name "Callvu Sales Enablement Quiz - Responses v2" if the ID doesn't work.

