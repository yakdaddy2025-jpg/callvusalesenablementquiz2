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
 * NEW SPREADSHEET: "Callvu Sales Enablement Quiz - Responses v2"
 */

var SPREADSHEET_NAME = 'Callvu Sales Enablement Quiz - Responses v2';
var SPREADSHEET_ID = ''; // Leave empty to use name lookup
var SHEET_NAME = 'Responses';

function getSpreadsheet() {
  try {
    var ss;
    
    // Try to open by ID first (if provided)
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
      try {
        ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        Logger.log('Opened spreadsheet by ID');
      } catch (e) {
        Logger.log('Could not open by ID, trying by name...');
      }
    }
    
    // If ID didn't work or wasn't provided, find by name
    if (!ss) {
      var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
        Logger.log('Opened spreadsheet by name: ' + SPREADSHEET_NAME);
      } else {
        throw new Error('Spreadsheet not found: ' + SPREADSHEET_NAME + '. Please check the name.');
      }
    }
    
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    
    // ALWAYS set up headers (even if sheet exists, ensure headers are correct)
    var headers = [
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
    var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var hasHeaders = existingHeaders[0] && existingHeaders[0].toString().trim() !== '';
    
    if (!hasHeaders) {
      // Set up headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      
      // Set column widths
      sheet.setColumnWidth(1, 180);
      sheet.setColumnWidth(2, 180);
      sheet.setColumnWidth(3, 180);
      sheet.setColumnWidth(4, 150);
      sheet.setColumnWidth(5, 200);
      sheet.setColumnWidth(6, 130);
      sheet.setColumnWidth(7, 250);
      sheet.setColumnWidth(8, 500);
      sheet.setColumnWidth(9, 80);
      sheet.setColumnWidth(10, 80);
      sheet.setColumnWidth(11, 100);
      sheet.setColumnWidth(12, 350);
      sheet.setColumnWidth(13, 80);
      sheet.setColumnWidth(14, 300);
      
      // Add data validation for Score column
      var scoreRule = SpreadsheetApp.newDataValidation()
        .requireNumberBetween(1, 10)
        .setAllowInvalid(false)
        .setHelpText('Enter a score from 1-10')
        .build();
      sheet.getRange('M2:M10000').setDataValidation(scoreRule);
      
      Logger.log('Headers created/updated');
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
    var date = new Date(timestampStr);
    return Utilities.formatDate(
      date, 
      Session.getScriptTimeZone(), 
      'yyyy-MM-dd HH:mm:ss'
    );
  } catch (e) {
    return timestampStr;
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    Logger.log('Received data: ' + JSON.stringify(data));
    
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Format timestamps
    var submissionTime = formatTimestamp(data.submissionTimestamp || data.timestamp);
    var recordingStartTime = formatTimestamp(data.recordingStartTime || '');
    var recordingEndTime = formatTimestamp(data.recordingEndTime || '');
    
    // Determine response type
    var responseType = 'Voice';
    if (data.responseType) {
      responseType = data.responseType;
    } else if (data.selectedAnswer) {
      responseType = 'Multiple Choice';
    } else if (data.selectedMode) {
      responseType = 'Mode Selection';
    }
    
    // Get transcript
    var transcript = data.transcript || data.selectedAnswer || data.selectedMode || '';
    
    // Append row with all fields
    var row = [
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
      '',
      ''
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
    var ss = getSpreadsheet();
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

function testSetup() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Sheet name: ' + SHEET_NAME);
  Logger.log('Current rows: ' + sheet.getLastRow());
  Logger.log('Setup complete!');
}

function testPost() {
  var testData = {
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
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

