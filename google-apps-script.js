/**
 * Google Apps Script - CallVu Sales Enablement Quiz Response Logger
 * 
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire code
 * 3. Deploy → New deployment → Web app
 * 4. Execute as: Me | Who has access: Anyone
 * 5. Copy the Web app URL
 * 6. Update the URL in pages/embed.js (line 5)
 */

var SPREADSHEET_NAME = 'Callvu Sales Enablement Quiz - Responses v2';
var SHEET_NAME = 'Responses';

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Create new spreadsheet
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  
  // Set up headers - MUST MATCH THE ORDER IN embed.js
  var headers = [
    'Unique Response ID',
    'Answer Field ID',
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
    'Response Type'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 200);   // Unique Response ID
  sheet.setColumnWidth(2, 200);   // Answer Field ID
  sheet.setColumnWidth(3, 180);   // Submission Timestamp
  sheet.setColumnWidth(4, 180);   // Recording Start Time
  sheet.setColumnWidth(5, 180);   // Recording End Time
  sheet.setColumnWidth(6, 150);   // Rep Name
  sheet.setColumnWidth(7, 200);   // Email
  sheet.setColumnWidth(8, 130);   // Question ID
  sheet.setColumnWidth(9, 250);   // Question Title
  sheet.setColumnWidth(10, 500);   // Transcript
  sheet.setColumnWidth(11, 80);    // Duration
  sheet.setColumnWidth(12, 80);   // Word Count
  sheet.setColumnWidth(13, 100);   // Response Type
  
  Logger.log('Created new spreadsheet: ' + ss.getUrl());
  return ss;
}

function doPost(e) {
  try {
    // Log that we received a request
    Logger.log('=== POST REQUEST RECEIVED ===');
    Logger.log('PostData exists: ' + (e.postData ? 'yes' : 'no'));
    
    if (!e.postData || !e.postData.contents) {
      Logger.log('ERROR: No postData.contents');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No data received' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Parse the JSON data
    var data;
    try {
      data = JSON.parse(e.postData.contents);
      Logger.log('Data parsed successfully');
      Logger.log('Data keys: ' + Object.keys(data).join(', '));
    } catch (parseError) {
      Logger.log('ERROR parsing JSON: ' + parseError.toString());
      Logger.log('Raw data: ' + e.postData.contents);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON: ' + parseError.toString() 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get or create spreadsheet
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('ERROR: Sheet not found');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Sheet not found' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // CRITICAL: Check if headers exist and match expected format
    // If headers don't match, recreate them
    var currentHeaders = [];
    if (sheet.getLastRow() > 0) {
      try {
        currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      } catch (e) {
        Logger.log('Error reading headers: ' + e.toString());
      }
    }
    
    var expectedHeaders = [
      'Unique Response ID',
      'Answer Field ID',
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
      'Response Type'
    ];
    
    // Check if headers need to be created or updated
    var headersMatch = currentHeaders.length === expectedHeaders.length;
    if (headersMatch) {
      for (var i = 0; i < expectedHeaders.length; i++) {
        if (currentHeaders[i] !== expectedHeaders[i]) {
          headersMatch = false;
          break;
        }
      }
    }
    
    if (sheet.getLastRow() === 0 || !headersMatch) {
      Logger.log('Creating/updating headers...');
      Logger.log('Current headers: ' + JSON.stringify(currentHeaders));
      Logger.log('Expected headers: ' + JSON.stringify(expectedHeaders));
      
      // Clear existing headers if they don't match
      if (sheet.getLastRow() > 0 && !headersMatch) {
        Logger.log('Headers don\'t match - clearing row 1 and recreating...');
        sheet.deleteRow(1);
      }
      
      // Create new headers
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, expectedHeaders.length).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, expectedHeaders.length).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      Logger.log('Headers created/updated successfully');
    }
    
    // Format timestamps
    var formatTimestamp = function(timestampStr) {
      if (!timestampStr) return '';
      try {
        var date = new Date(timestampStr);
        return Utilities.formatDate(
          date, 
          Session.getScriptTimeZone(), 
          'yyyy-MM-dd HH:mm:ss'
        );
      } catch (e) {
        return timestampStr; // Return as-is if parsing fails
      }
    };
    
    // Prepare row data - ORDER MUST MATCH HEADERS
    var row = [
      data.uniqueResponseId || '',
      data.answerFieldId || '',
      formatTimestamp(data.submissionTimestamp || data.timestamp || new Date().toISOString()),
      formatTimestamp(data.recordingStartTime || ''),
      formatTimestamp(data.recordingEndTime || ''),
      data.repName || '',
      data.repEmail || '',
      data.questionId || '',
      data.questionTitle || '',
      data.transcript || '',
      data.recordingDuration || 0,
      data.wordCount || 0,
      data.responseType || 'Voice'
    ];
    
    // Log what we're about to append
    Logger.log('Appending row with:');
    Logger.log('  Unique Response ID: ' + row[0]);
    Logger.log('  Rep Name: ' + row[5]);
    Logger.log('  Question ID: ' + row[7]);
    Logger.log('  Transcript length: ' + (row[9] ? row[9].length : 0));
    
    // Append the row
    sheet.appendRow(row);
    
    // Log success
    Logger.log('Row appended successfully. Total rows: ' + sheet.getLastRow());
    
    // Return the unique ID and transcript so CallVu can use it
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Response logged successfully',
        uniqueResponseId: data.uniqueResponseId,
        transcript: data.transcript,
        answerFieldId: data.answerFieldId,
        rowNumber: sheet.getLastRow(),
        spreadsheet: ss.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR IN doPost ===');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// NEW: GET endpoint to fetch transcript by uniqueResponseId or answerFieldId
function doGet(e) {
  try {
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Get query parameters
    var uniqueResponseId = e.parameter.uniqueResponseId || '';
    var answerFieldId = e.parameter.answerFieldId || '';
    var questionId = e.parameter.questionId || '';
    
    // If no parameters, return status
    if (!uniqueResponseId && !answerFieldId && !questionId) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: 'ok', 
          message: 'CallVu Quiz Logger is running',
          spreadsheet: ss.getUrl()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find the most recent row matching the criteria
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: 'No responses found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Search from bottom to top (most recent first)
    var foundRow = null;
    for (var row = lastRow; row >= 2; row--) {
      var rowData = sheet.getRange(row, 1, 1, 13).getValues()[0];
      var rowUniqueId = rowData[0] || '';
      var rowAnswerFieldId = rowData[1] || '';
      var rowQuestionId = rowData[7] || '';
      var rowTranscript = rowData[9] || '';
      
      // Match by uniqueResponseId (most specific)
      if (uniqueResponseId && rowUniqueId === uniqueResponseId) {
        foundRow = rowData;
        break;
      }
      
      // Match by answerFieldId (get most recent for this field)
      if (answerFieldId && rowAnswerFieldId === answerFieldId && !foundRow) {
        foundRow = rowData;
      }
      
      // Match by questionId (get most recent for this question)
      if (questionId && rowQuestionId === questionId && !foundRow) {
        foundRow = rowData;
      }
    }
    
    if (foundRow) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true,
          transcript: foundRow[9] || '', // Transcript column (index 9)
          uniqueResponseId: foundRow[0] || '',
          answerFieldId: foundRow[1] || '',
          questionId: foundRow[7] || ''
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: 'Response not found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
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

// Test function - run this to verify setup
function testSetup() {
  var ss = getOrCreateSpreadsheet();
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Setup complete!');
}
