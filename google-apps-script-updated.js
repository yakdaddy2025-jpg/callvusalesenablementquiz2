/**
 * Google Apps Script - CallVu Sales Enablement Quiz Response Logger
 * 
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire code
 * 3. Deploy → New deployment → Web app
 * 4. Execute as: Me | Who has access: Anyone
 * 5. Copy the Web app URL
 * 
 * This script writes to your specific Google Sheet:
 * https://docs.google.com/spreadsheets/d/1JcvaZhDq9Hfr8dOSfVdFcCnaxiTL4oK_l70E_TvXqJ0/edit
 */

// NEW SPREADSHEET: https://docs.google.com/spreadsheets/d/e/2PACX-1vQQLzNTy5P-Fx--S6PBBKT_nx2IeZEpDyUK7AQcpCnLpoLsEGuWbxGAEHkcT_mnus3bgOG_OE2ksk6h/pubhtml
// Spreadsheet Name: "Callvu Sales Enablement Quiz - Responses v2"
// NOTE: The script will find the spreadsheet by name if ID doesn't work
// To get the actual ID: Open spreadsheet in edit mode, copy ID from URL between /d/ and /edit
const SPREADSHEET_NAME = 'Callvu Sales Enablement Quiz - Responses v2';
const SPREADSHEET_ID = ''; // Leave empty to use name lookup
const SHEET_NAME = 'Responses';

function getSpreadsheet() {
  try {
    let ss;
    
    // Try to open by ID first (if provided)
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        Logger.log('Opened spreadsheet by ID');
      } catch (e) {
        Logger.log('Could not open by ID, trying by name...');
        // Fall through to name lookup
      }
    }
    
    // If ID didn't work or wasn't provided, find by name
    if (!ss) {
      const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
        Logger.log('Opened spreadsheet by name: ' + SPREADSHEET_NAME);
      } else {
        throw new Error('Spreadsheet not found: ' + SPREADSHEET_NAME + '. Please check the name.');
      }
    }
    
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    
    // ALWAYS set up headers (even if sheet exists, ensure headers are correct)
    const headers = [
      'Submission Timestamp',
      'Recording Start Time',
      'Recording End Time',
      'Rep Name',
      'Rep Email',
      'Question ID',
      'Question Title',
      'Response Transcript',
      'Recording Duration (sec)',
      'Word Count',
      'Response Type',
      'Success Criteria',
      'Score (1-10)',
      'Manager Notes'
    ];
    
    // Check if row 1 has headers
    const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const hasHeaders = existingHeaders[0] && existingHeaders[0].toString().trim() !== '';
    
    if (!hasHeaders) {
      // Set up headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      
      // Set column widths
      sheet.setColumnWidth(1, 180);   // Submission Timestamp
      sheet.setColumnWidth(2, 180);   // Recording Start Time
      sheet.setColumnWidth(3, 180);   // Recording End Time
      sheet.setColumnWidth(4, 150);   // Rep Name
      sheet.setColumnWidth(5, 200);   // Email
      sheet.setColumnWidth(6, 130);   // Question ID
      sheet.setColumnWidth(7, 250);   // Question Title
      sheet.setColumnWidth(8, 500);   // Transcript
      sheet.setColumnWidth(9, 80);    // Duration
      sheet.setColumnWidth(10, 80);    // Word Count
      sheet.setColumnWidth(11, 100);  // Response Type
      sheet.setColumnWidth(12, 350);  // Success Criteria
      sheet.setColumnWidth(13, 80);   // Score
      sheet.setColumnWidth(14, 300);  // Notes
      
      // Add data validation for Score column
      const scoreRule = SpreadsheetApp.newDataValidation()
        .requireNumberBetween(1, 10)
        .setAllowInvalid(false)
        .setHelpText('Enter a score from 1-10')
        .build();
      sheet.getRange('M2:M10000').setDataValidation(scoreRule);
      
      Logger.log('✅ Headers created/updated');
    }
    
    return ss;
  } catch (error) {
    Logger.log('Error accessing spreadsheet: ' + error.toString());
    throw error;
  }
}

function formatTimestamp(timestampStr) {
  if (!timestampStr) return '';
  try {
    const date = new Date(timestampStr);
    return Utilities.formatDate(
      date, 
      Session.getScriptTimeZone(), 
      'yyyy-MM-dd HH:mm:ss'
    );
  } catch (e) {
    return timestampStr; // Return as-is if parsing fails
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    Logger.log('Received data: ' + JSON.stringify(data));
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Format timestamps
    const submissionTime = formatTimestamp(data.submissionTimestamp || data.timestamp);
    const recordingStartTime = formatTimestamp(data.recordingStartTime || '');
    const recordingEndTime = formatTimestamp(data.recordingEndTime || '');
    
    // Determine response type
    let responseType = 'Voice';
    if (data.responseType) {
      responseType = data.responseType;
    } else if (data.selectedAnswer) {
      responseType = 'Multiple Choice';
    } else if (data.selectedMode) {
      responseType = 'Mode Selection';
    }
    
    // Get transcript (could be from voice, multiple choice, or mode selection)
    const transcript = data.transcript || data.selectedAnswer || data.selectedMode || '';
    
    // Append row with all fields
    const row = [
      submissionTime,
      recordingStartTime,
      recordingEndTime,
      data.repName || '',
      data.repEmail || '',
      data.questionId || '',
      data.questionTitle || '',
      transcript,
      data.recordingDuration || 0,
      data.wordCount || 0,
      responseType,
      data.successCriteria || '',
      '',  // Score - manager fills in
      ''   // Notes - manager fills in
    ];
    
    sheet.appendRow(row);
    
    Logger.log('Successfully logged response to row: ' + sheet.getLastRow());
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Response logged successfully',
        spreadsheet: ss.getUrl(),
        row: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = getSpreadsheet();
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'ok', 
        message: 'CallVu Quiz Logger is running',
        spreadsheet: ss.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - run this to verify setup
function testSetup() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Sheet name: ' + SHEET_NAME);
  Logger.log('Current rows: ' + sheet.getLastRow());
  Logger.log('Setup complete!');
}

// Test function to simulate a POST request
function testPost() {
  const testData = {
    submissionTimestamp: new Date().toISOString(),
    recordingStartTime: new Date(Date.now() - 30000).toISOString(),
    recordingEndTime: new Date(Date.now() - 5000).toISOString(),
    repName: 'Test User',
    repEmail: 'test@callvu.com',
    questionId: 'Roleplay_1',
    questionTitle: 'Roleplay 1',
    transcript: 'This is a test response',
    recordingDuration: 25,
    wordCount: 5,
    responseType: 'Voice'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}
