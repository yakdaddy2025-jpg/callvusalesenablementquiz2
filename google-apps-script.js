/**
 * Google Apps Script - CallVu Sales Enablement Quiz Response Logger
 * 
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire code
 * 3. Deploy → New deployment → Web app
 * 4. Execute as: Me | Who has access: Anyone
 * 5. Copy the Web app URL
 */

const SPREADSHEET_NAME = 'CallVu Quiz Responses';
const SHEET_NAME = 'Responses';

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Create new spreadsheet
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  
  // Set up headers
  const headers = [
    'Timestamp',
    'Rep Name',
    'Rep Email',
    'Question ID',
    'Question Title',
    'Response Transcript',
    'Recording Duration (sec)',
    'Success Criteria',
    'Score (1-10)',
    'Manager Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);   // Timestamp
  sheet.setColumnWidth(2, 150);   // Rep Name
  sheet.setColumnWidth(3, 200);   // Email
  sheet.setColumnWidth(4, 130);   // Question ID
  sheet.setColumnWidth(5, 250);   // Question Title
  sheet.setColumnWidth(6, 500);   // Transcript
  sheet.setColumnWidth(7, 80);    // Duration
  sheet.setColumnWidth(8, 350);   // Criteria
  sheet.setColumnWidth(9, 80);    // Score
  sheet.setColumnWidth(10, 300);  // Notes
  
  // Add data validation for Score column
  const scoreRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 10)
    .setAllowInvalid(false)
    .setHelpText('Enter a score from 1-10')
    .build();
  sheet.getRange('I2:I1000').setDataValidation(scoreRule);
  
  Logger.log('Created new spreadsheet: ' + ss.getUrl());
  return ss;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Format timestamp
    const timestamp = new Date(data.timestamp || new Date());
    const formattedTime = Utilities.formatDate(
      timestamp, 
      Session.getScriptTimeZone(), 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // Append row
    const row = [
      formattedTime,
      data.repName || '',
      data.repEmail || '',
      data.questionId || '',
      data.questionTitle || '',
      data.transcript || '',
      data.recordingDuration || 0,
      data.successCriteria || '',
      '',  // Score - manager fills in
      ''   // Notes - manager fills in
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Response logged successfully',
        spreadsheet: ss.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const ss = getOrCreateSpreadsheet();
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'CallVu Quiz Logger is running',
      spreadsheet: ss.getUrl()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function - run this to verify setup
function testSetup() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Setup complete!');
}

