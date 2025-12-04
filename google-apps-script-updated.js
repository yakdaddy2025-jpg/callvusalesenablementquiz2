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

const SPREADSHEET_ID = '1JcvaZhDq9Hfr8dOSfVdFcCnaxiTL4oK_l70E_TvXqJ0';
const SHEET_NAME = 'Responses';

function getSpreadsheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Set up headers
      const headers = [
        'Timestamp',
        'Rep Name',
        'Rep Email',
        'Question ID',
        'Question Title',
        'Response Transcript',
        'Recording Duration (sec)',
        'Response Type',
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
      sheet.setColumnWidth(8, 120);   // Response Type
      sheet.setColumnWidth(9, 80);    // Score
      sheet.setColumnWidth(10, 300);  // Notes
      
      // Add data validation for Score column
      const scoreRule = SpreadsheetApp.newDataValidation()
        .requireNumberBetween(1, 10)
        .setAllowInvalid(false)
        .setHelpText('Enter a score from 1-10')
        .build();
      sheet.getRange('I2:I10000').setDataValidation(scoreRule);
    }
    
    return ss;
  } catch (error) {
    Logger.log('Error accessing spreadsheet: ' + error.toString());
    throw error;
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Format timestamp
    const timestamp = new Date(data.timestamp || new Date());
    const formattedTime = Utilities.formatDate(
      timestamp, 
      Session.getScriptTimeZone(), 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // Determine response type
    let responseType = 'Voice';
    if (data.responseType) {
      responseType = data.responseType;
    } else if (data.selectedAnswer) {
      responseType = 'Multiple Choice';
    } else if (data.selectedMode) {
      responseType = 'Mode Selection';
    }
    
    // Append row
    const row = [
      formattedTime,
      data.repName || '',
      data.repEmail || '',
      data.questionId || '',
      data.questionTitle || '',
      data.transcript || data.selectedAnswer || data.selectedMode || '',
      data.recordingDuration || 0,
      responseType,
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
  const ss = getSpreadsheet();
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
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Setup complete!');
}

