import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// Google Apps Script webhook URL - UPDATE THIS AFTER DEPLOYING GOOGLE APPS SCRIPT
const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

export default function EmbeddedVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('ready');
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [hasResponse, setHasResponse] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [questionId, setQuestionId] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const processedResultsRef = useRef(new Set()); // Track processed results to prevent duplicates
  const recordingStartTimeRef = useRef(null); // Track when recording started
  const recordingEndTimeRef = useRef(null); // Track when recording ended
  
  useEffect(() => {
    // Get data from URL params or parent window (CallVu)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      // Support both old and new parameter names
      const qId = urlParams.get('questionId') || urlParams.get('question') || '';
      const qTitle = urlParams.get('questionTitle') || urlParams.get('title') || 'Question';
      const answerFieldId = urlParams.get('answerFieldId') || '';
      const webhookUrl = urlParams.get('webhookUrl') || '';
      const name = urlParams.get('name') || '';
      const email = urlParams.get('email') || '';
      
      setQuestionId(qId);
      setQuestionTitle(qTitle);
      if (name) setRepName(name);
      if (email) setRepEmail(email);
      
      // Listen for messages from CallVu parent window
      window.addEventListener('message', handleCallVuMessage);
      
      // Request name/email from parent if not in URL
      if (!name || !email) {
        window.parent.postMessage({ type: 'REQUEST_USER_INFO' }, '*');
      }
      
      // Inject script into parent to help with field updates (if same origin)
      if (window.parent && window.parent !== window) {
        try {
          const script = window.parent.document.createElement('script');
          script.textContent = `
            (function() {
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'VOICE_RESPONSE_READY') {
                  const transcript = event.data.transcript;
                  const answerFieldId = event.data.answerFieldId;
                  
                  // Try to find and update the field
                  let field = null;
                  
                  // Try by ID first
                  if (answerFieldId) {
                    field = document.querySelector('[data-integration-id="' + answerFieldId + '"]') ||
                            document.querySelector('[name*="' + answerFieldId + '"]');
                  }
                  
                  // Try by label text
                  if (!field) {
                    const labels = document.querySelectorAll('label');
                    for (const label of labels) {
                      if (label.textContent.includes('Your Response') || label.textContent.includes('Response')) {
                        const forAttr = label.getAttribute('for');
                        if (forAttr) {
                          field = document.getElementById(forAttr);
                        } else {
                          field = label.nextElementSibling;
                        }
                        if (field && field.tagName === 'TEXTAREA' && !field.readOnly) break;
                      }
                    }
                  }
                  
                  // Try all textareas
                  if (!field) {
                    const textareas = document.querySelectorAll('textarea');
                    for (const ta of textareas) {
                      if (!ta.readOnly && !ta.disabled && ta.offsetParent !== null) {
                        const nearbyText = (ta.previousElementSibling?.textContent || ta.parentElement?.textContent || '').toLowerCase();
                        if (nearbyText.includes('response') || nearbyText.includes('answer')) {
                          field = ta;
                          break;
                        }
                      }
                    }
                  }
                  
                  if (field && field.tagName === 'TEXTAREA') {
                    field.value = transcript;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.focus();
                    setTimeout(() => field.blur(), 100);
                    console.log('✅ CallVu field updated via injected script');
                  }
                }
              });
            })();
          `;
          window.parent.document.head.appendChild(script);
          console.log('✅ Injected helper script into parent');
        } catch (e) {
          console.log('Could not inject script (cross-origin):', e);
        }
      }
    }
    
    return () => {
      window.removeEventListener('message', handleCallVuMessage);
    };
  }, []);
  
  const handleCallVuMessage = (event) => {
    // Accept messages from any origin (CallVu domain)
    if (event.data && event.data.type === 'USER_INFO') {
      if (event.data.name) setRepName(event.data.name);
      if (event.data.email) setRepEmail(event.data.email);
    }
  };
  
  useEffect(() => {
    // Check for Web Speech API support
    if (typeof window === 'undefined') return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false);
      setError('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    // Initialize speech recognition ONCE on mount
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event) => {
      let interim = '';
      
      // Process only NEW results (from resultIndex onwards)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript.trim();
        
        if (result.isFinal && transcriptText) {
          // Create a unique key based on the text content itself
          const textKey = transcriptText.toLowerCase().replace(/[^\w\s]/g, '');
          
          // Only add if we haven't seen this exact text before
          if (!processedResultsRef.current.has(textKey)) {
            processedResultsRef.current.add(textKey);
            
            // Add to transcript - but check for duplicates first
            setTranscript(prev => {
              const prevLower = prev.toLowerCase();
              const newLower = transcriptText.toLowerCase();
              
              // If the new text is already in the transcript, skip it completely
              if (prevLower.includes(newLower) && prev.length > 0) {
                console.log('Skipping duplicate text:', transcriptText);
                return prev;
              }
              
              // If the transcript contains the new text, skip it
              if (prevLower.length > 0 && newLower.length > 0) {
                // Check if new text is a substring of existing text
                if (prevLower.includes(newLower) || newLower.includes(prevLower)) {
                  // Keep the longer version
                  return prev.length > transcriptText.length ? prev : transcriptText;
                }
              }
              
              return prev + (prev ? ' ' : '') + transcriptText;
            });
          }
        } else {
          interim += transcriptText + ' ';
        }
      }
      
      setInterimTranscript(interim);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable microphone permissions.');
        setIsRecording(false);
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors
      } else {
        setError(`Recognition error: ${event.error}`);
        setIsRecording(false);
      }
    };
    
    recognitionRef.current.onend = () => {
      // Only restart if we're still recording (use ref to avoid stale closure)
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition restart error:', e);
        }
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Initialize once on mount, not when isRecording changes
  
  const startRecording = async () => {
    setError('');
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setHasResponse(false);
    processedResultsRef.current.clear(); // Clear processed results when starting new recording
    recordingStartTimeRef.current = null; // Reset timestamps
    recordingEndTimeRef.current = null;
    
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      // Start recording state
      isRecordingRef.current = true;
      recordingStartTimeRef.current = new Date().toISOString(); // Record start timestamp
      recordingEndTimeRef.current = null; // Reset end time
      setIsRecording(true);
      setStatus('recording');
      
      // Start timer immediately
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('Speech recognition started');
        } catch (e) {
          console.error('Failed to start recognition:', e);
          setError('Failed to start speech recognition. Please try again.');
          isRecordingRef.current = false;
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      } else {
        setError('Speech recognition not initialized. Please refresh the page.');
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please allow microphone permissions and try again.');
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    isRecordingRef.current = false;
    recordingEndTimeRef.current = new Date().toISOString(); // Record end timestamp
    setIsRecording(false);
    setStatus('stopped');
    
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.log('Stop recognition error:', e);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Note: We don't auto-enable Next button here - user must click "Keep Response"
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const keepResponse = () => {
    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setError('No response to keep. Please record your answer first.');
      return;
    }
    
    setHasResponse(true);
    setStatus('saved');
    notifyCallVuResponseReady(finalTranscript);
    logToSpreadsheet(finalTranscript);
  };
  
  const deleteResponse = () => {
    setTranscript('');
    setInterimTranscript('');
    setHasResponse(false);
    setStatus('ready');
    setRecordingTime(0);
    notifyCallVuResponseDeleted();
  };
  
  const notifyCallVuResponseReady = (finalTranscript) => {
    const transcriptToSend = finalTranscript || transcript.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const answerFieldId = urlParams.get('answerFieldId') || '';
    
    console.log('🔵 Filling response field:', transcriptToSend);
    console.log('🔵 Answer Field ID:', answerFieldId);
    
    // AGGRESSIVE field finding - try everything
    const fillField = () => {
      if (!window.parent || window.parent === window) {
        console.error('❌ No parent window');
        return false;
      }
      
      try {
        const doc = window.parent.document;
        const allTextareas = Array.from(doc.querySelectorAll('textarea'));
        console.log(`🔍 Found ${allTextareas.length} textareas total`);
        
        // Log all textareas for debugging
        allTextareas.forEach((ta, i) => {
          const label = ta.previousElementSibling?.textContent || 
                       ta.parentElement?.querySelector('label')?.textContent || '';
          console.log(`Textarea ${i}:`, {
            readOnly: ta.readOnly,
            disabled: ta.disabled,
            value: ta.value,
            label: label,
            visible: ta.offsetParent !== null,
            id: ta.id,
            name: ta.name
          });
        });
        
        let field = null;
        
        // Method 1: Find by answerFieldId
        if (answerFieldId) {
          const selectors = [
            `[data-integration-id="${answerFieldId}"]`,
            `textarea[data-integration-id="${answerFieldId}"]`,
            `textarea[name*="${answerFieldId}"]`,
            `textarea[id*="${answerFieldId}"]`,
            `[name*="${answerFieldId}"]`,
            `[id*="${answerFieldId}"]`
          ];
          
          for (const selector of selectors) {
            try {
              const found = doc.querySelector(selector);
              if (found) {
                if (found.tagName === 'TEXTAREA') {
                  field = found;
                  console.log('✅ Found by answerFieldId:', selector);
                  break;
                } else if (found.querySelector) {
                  const ta = found.querySelector('textarea');
                  if (ta) {
                    field = ta;
                    console.log('✅ Found textarea inside element:', selector);
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }
        
        // Method 2: Find by "*Your Response" label - check ALL textareas
        if (!field) {
          for (const ta of allTextareas) {
            // Check previous sibling
            const prevSib = ta.previousElementSibling;
            if (prevSib) {
              const text = prevSib.textContent?.toLowerCase() || '';
              if (text.includes('your response') || text.includes('*your response')) {
                field = ta;
                console.log('✅ Found by previous sibling label');
                break;
              }
            }
            
            // Check parent for label
            const parent = ta.parentElement;
            if (parent) {
              const label = parent.querySelector('label');
              if (label) {
                const text = label.textContent?.toLowerCase() || '';
                if (text.includes('your response') || text.includes('*your response')) {
                  field = ta;
                  console.log('✅ Found by parent label');
                  break;
                }
              }
              
              // Check parent text content
              const parentText = parent.textContent?.toLowerCase() || '';
              if (parentText.includes('*your response') && parentText.includes('required')) {
                field = ta;
                console.log('✅ Found by parent text with "required"');
                break;
              }
            }
            
            // Check grandparent
            const grandparent = parent?.parentElement;
            if (grandparent) {
              const text = grandparent.textContent?.toLowerCase() || '';
              if (text.includes('*your response')) {
                field = ta;
                console.log('✅ Found by grandparent text');
                break;
              }
            }
          }
        }
        
        // Method 3: Find ANY visible textarea that's empty or readonly (last resort)
        if (!field) {
          for (const ta of allTextareas) {
            if (ta.offsetParent !== null && 
                ta.style.display !== 'none' && 
                ta.style.visibility !== 'hidden') {
              // Prefer empty or readonly fields (those are likely the response field)
              if (ta.value === '' || ta.readOnly) {
                field = ta;
                console.log('✅ Found visible empty/readonly textarea');
                break;
              }
            }
          }
        }
        
        // Method 4: Just get the first visible textarea
        if (!field) {
          for (const ta of allTextareas) {
            if (ta.offsetParent !== null) {
              field = ta;
              console.log('✅ Found first visible textarea (fallback)');
              break;
            }
          }
        }
        
        if (field) {
          console.log('🔧 Updating field:', {
            readOnly: field.readOnly,
            disabled: field.disabled,
            currentValue: field.value,
            newValue: transcriptToSend
          });
          
          // FORCE remove readonly/disabled
          field.removeAttribute('readonly');
          field.removeAttribute('disabled');
          field.readOnly = false;
          field.disabled = false;
          
          // Set value
          field.value = transcriptToSend;
          
          // Also try setting via native setter
          try {
            Object.defineProperty(field, 'value', {
              value: transcriptToSend,
              writable: true,
              configurable: true
            });
          } catch (e) {}
          
          // Trigger ALL events
          ['focus', 'input', 'change', 'blur'].forEach(type => {
            const event = new Event(type, { bubbles: true, cancelable: true });
            field.dispatchEvent(event);
          });
          
          // Focus and blur
          field.focus();
          setTimeout(() => {
            field.blur();
            field.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Verify
            if (field.value === transcriptToSend) {
              console.log('✅✅✅ Field successfully filled!');
            } else {
              console.warn('⚠️ Field value mismatch:', field.value, 'vs', transcriptToSend);
            }
          }, 150);
          
          return true;
        } else {
          console.error('❌ No field found!');
          return false;
        }
      } catch (e) {
        console.error('❌ Error:', e);
        return false;
      }
    };
    
    // Try multiple times with delays
    let success = fillField();
    if (!success) {
      setTimeout(() => { success = fillField(); }, 200);
    }
    if (!success) {
      setTimeout(() => { success = fillField(); }, 500);
    }
    if (!success) {
      setTimeout(() => { success = fillField(); }, 1000);
    }
    
    // Always log to spreadsheet
    logToSpreadsheet(finalTranscript);
    
    if (success) {
      setError('');
      setStatus('saved');
    } else {
      setError('Field not found. Check console for details.');
    }
  };
  
  const notifyCallVuResponseDeleted = () => {
    // Notify CallVu parent that response was deleted
    window.parent.postMessage({
      type: 'VOICE_RESPONSE_DELETED',
      questionId: questionId
    }, '*');
  };
  
  const logToSpreadsheet = async (finalTranscript) => {
    // Try to get name/email from CallVu form if not set
    let nameToUse = repName.trim();
    let emailToUse = repEmail.trim();
    
    // If missing, try to get from parent window
    if (!nameToUse || !emailToUse) {
      try {
        if (window.parent && window.parent !== window) {
          const parentDoc = window.parent.document;
          // Look for name/email fields in the form
          const nameField = parentDoc.querySelector('input[name*="name"], input[id*="name"], input[type="text"]');
          const emailField = parentDoc.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
          
          if (nameField && !nameToUse) {
            nameToUse = nameField.value?.trim() || '';
            console.log('Found name from form:', nameToUse);
          }
          if (emailField && !emailToUse) {
            emailToUse = emailField.value?.trim() || '';
            console.log('Found email from form:', emailToUse);
          }
        }
      } catch (e) {
        console.log('Could not access parent form:', e);
      }
    }
    
    // Still log even if name/email missing (use placeholders)
    if (!nameToUse) {
      console.warn('⚠️ Missing rep name - using placeholder');
      nameToUse = 'Unknown User';
    }
    if (!emailToUse) {
      console.warn('⚠️ Missing rep email - using placeholder');
      emailToUse = 'unknown@callvu.com';
    }
    
    const transcriptToLog = finalTranscript || transcript.trim();
    const submissionTimestamp = new Date().toISOString();
    
    const payload = {
      // Submission timestamp (when "Keep Response" was clicked)
      submissionTimestamp: submissionTimestamp,
      // Recording timestamps
      recordingStartTime: recordingStartTimeRef.current || '',
      recordingEndTime: recordingEndTimeRef.current || '',
      // Legacy timestamp (for backward compatibility)
      timestamp: submissionTimestamp,
      // User info
      repName: nameToUse,
      repEmail: emailToUse,
      // Question info
      questionId: questionId || 'Unknown',
      questionTitle: questionTitle || 'Unknown Question',
      // Response info
      transcript: transcriptToLog,
      recordingDuration: recordingTime, // Duration in seconds
      wordCount: transcriptToLog.split(/\s+/).filter(w => w.length > 0).length,
      // Response type
      responseType: 'Voice'
    };
    
    console.log('📊 Logging to spreadsheet:', payload);
    console.log('📊 Webhook URL:', SHEET_WEBHOOK_URL);
    
    try {
      if (SHEET_WEBHOOK_URL && SHEET_WEBHOOK_URL !== '') {
        const response = await fetch(SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Note: With no-cors mode, we can't read the response, but we can log the attempt
        console.log('✅ POST request sent to webhook');
        console.log('✅ Payload sent:', JSON.stringify(payload, null, 2));
      } else {
        console.error('❌ No webhook URL configured');
      }
    } catch (err) {
      console.error('❌ Webhook error:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
    }
  };
  
  if (!browserSupported) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-sm text-red-600 mt-2">Please use Chrome, Edge, or Safari.</p>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Voice Recorder | CallVu Quiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Voice Response Recorder</h3>
              <p className="text-xs text-gray-500">Voice-only input (no typing allowed)</p>
            </div>
          </div>
        </div>
        
        {/* Recording Controls */}
        <div className="mb-4">
          <div className="flex flex-col items-center mb-4">
            {/* Timer */}
            <div className={`text-3xl font-mono mb-4 ${isRecording ? 'text-red-500' : 'text-gray-300'}`}>
              {formatTime(recordingTime)}
            </div>
            
            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              )}
            </button>
            
            <p className="mt-2 text-sm text-gray-500">
              {isRecording ? '🔴 Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>
        </div>
        
        {/* Transcript Display (Read-Only) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response (Voice Transcription - Read Only)
          </label>
          <div 
            className="bg-gray-50 rounded-lg p-4 min-h-[100px] max-h-48 overflow-y-auto border border-gray-200"
            contentEditable={false}
            suppressContentEditableWarning={true}
          >
            {transcript || interimTranscript ? (
              <p className="text-gray-700 leading-relaxed">
                {transcript}
                <span className="text-gray-400 italic">{interimTranscript}</span>
              </p>
            ) : (
              <p className="text-gray-400 italic text-sm">
                Your transcription will appear here as you speak...
              </p>
            )}
          </div>
          {transcript && (
            <p className="text-xs text-gray-400 mt-1">{transcript.split(' ').length} words</p>
          )}
        </div>
        
        {/* Keep/Delete Buttons */}
        {transcript.trim() && !isRecording && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={keepResponse}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Keep Response
            </button>
            <button
              onClick={deleteResponse}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              ✗ Delete & Try Again
            </button>
          </div>
        )}
        
        {/* Status Indicator */}
        {hasResponse && status === 'saved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm font-medium">
              ✓ Response saved! You can proceed to the next question.
            </p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}
        
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-700 text-xs">
            <strong>Note:</strong> This field accepts voice input only. Typing is disabled to ensure authentic responses.
          </p>
        </div>
      </div>
    </>
  );
}

