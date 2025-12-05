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
      
      // Inject script into parent to BLOCK Next button until response is accepted
      if (window.parent && window.parent !== window) {
        try {
          // Check if script already exists
          if (!window.parent.voiceResponseBlockerInjected) {
            const script = window.parent.document.createElement('script');
            script.textContent = `
              (function() {
                // CRITICAL: Track if voice response was accepted for current step
                window.voiceResponseAccepted = false;
                window.voiceResponseTranscript = '';
                window.currentStepHasRecorder = false;
                window.blockerActive = true;
                
                // Reset when step changes
                var lastUrl = window.location.href;
                var resetInterval = setInterval(function() {
                  if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    window.voiceResponseAccepted = false;
                    window.voiceResponseTranscript = '';
                    console.log('🔄 Step changed - resetting voice response flag');
                  }
                }, 200);
                
                // AGGRESSIVE: Continuously disable Next button if recorder present
                function forceDisableNextButton() {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  window.currentStepHasRecorder = !!hasRecorder;
                  
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    // Find ALL possible Next buttons
                    var allButtons = Array.from(document.querySelectorAll('button'));
                    var allClickables = Array.from(document.querySelectorAll('[onclick], [class*="next"], [id*="next"], [role="button"]'));
                    var allElements = allButtons.concat(allClickables);
                    
                    for (var i = 0; i < allElements.length; i++) {
                      var el = allElements[i];
                      var text = (el.textContent || el.innerText || el.value || '').toLowerCase();
                      var className = (el.className || '').toLowerCase();
                      var id = (el.id || '').toLowerCase();
                      
                      if (text.includes('next') || text.includes('continue') || className.includes('next') || id.includes('next')) {
                        // FORCE disable
                        el.disabled = true;
                        el.setAttribute('disabled', 'disabled');
                        el.setAttribute('aria-disabled', 'true');
                        el.classList.add('disabled');
                        el.style.opacity = '0.5';
                        el.style.cursor = 'not-allowed';
                        el.style.pointerEvents = 'none';
                        
                        // Remove onclick handlers
                        el.onclick = function() {
                          alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                          return false;
                        };
                        
                        // Block all events
                        el.addEventListener('click', function(e) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.stopImmediatePropagation();
                          alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                          return false;
                        }, true);
                      }
                    }
                  }
                }
                
                // Run immediately and continuously
                forceDisableNextButton();
                setInterval(forceDisableNextButton, 100);
                
                // Listen for voice response ready
                window.addEventListener('message', function(event) {
                  if (event.data && event.data.type === 'VOICE_RESPONSE_READY') {
                    window.voiceResponseAccepted = true;
                    window.voiceResponseTranscript = event.data.transcript || '';
                    console.log('✅ Voice response accepted - enabling Next button');
                    
                    // Enable Next button
                    var allButtons = Array.from(document.querySelectorAll('button'));
                    for (var i = 0; i < allButtons.length; i++) {
                      var btn = allButtons[i];
                      var btnText = (btn.textContent || '').toLowerCase();
                      if (btnText.includes('next') || btnText.includes('begin quiz') || btnText.includes('continue')) {
                        btn.disabled = false;
                        btn.removeAttribute('disabled');
                        btn.removeAttribute('aria-disabled');
                        btn.classList.remove('disabled');
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                        btn.style.pointerEvents = 'auto';
                      }
                    }
                  }
                });
                
                // MULTIPLE LAYERS OF PROTECTION
                
                // Layer 1: Capture phase - highest priority
                document.addEventListener('click', function(e) {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    var target = e.target;
                    var text = (target.textContent || target.innerText || '').toLowerCase();
                    var className = (target.className || '').toLowerCase();
                    
                    if (text.includes('next') || text.includes('continue') || className.includes('next')) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      e.cancelBubble = true;
                      alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                      return false;
                    }
                  }
                }, true);
                
                // Layer 2: Bubble phase
                document.addEventListener('click', function(e) {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    var target = e.target;
                    var parent = target.closest('button, [onclick], [class*="next"]');
                    if (parent) {
                      var text = (parent.textContent || parent.innerText || '').toLowerCase();
                      if (text.includes('next') || text.includes('continue')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                        return false;
                      }
                    }
                  }
                }, false);
                
                // Layer 3: Intercept all button clicks
                document.addEventListener('mousedown', function(e) {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    var target = e.target;
                    var text = (target.textContent || target.innerText || '').toLowerCase();
                    if (text.includes('next') || text.includes('continue')) {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                      return false;
                    }
                  }
                }, true);
                
                // Layer 4: Intercept form submissions
                document.addEventListener('submit', function(e) {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                    return false;
                  }
                }, true);
                
                // Layer 5: Override button click method
                var originalClick = HTMLElement.prototype.click;
                HTMLElement.prototype.click = function() {
                  var hasRecorder = document.querySelector('iframe[src*="callvusalesenablementquiz2.vercel.app"]');
                  if (hasRecorder && !window.voiceResponseAccepted) {
                    var text = (this.textContent || this.innerText || '').toLowerCase();
                    if (text.includes('next') || text.includes('continue')) {
                      alert('CRITICAL: You must record your response and click "Keep Response" before proceeding.');
                      return false;
                    }
                  }
                  return originalClick.apply(this, arguments);
                };
                
                console.log('🛡️ Next button blocker activated - MULTIPLE LAYERS OF PROTECTION');
              })();
            `;
            window.parent.document.head.appendChild(script);
            window.parent.voiceResponseBlockerInjected = true;
            console.log('✅ Injected Next button blocker script');
          }
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
    
    console.log('✅ Response saved - filling required field and logging to spreadsheet');
    
    // CRITICAL: Fill the required response field so CallVu validation passes
    const fillRequiredField = () => {
      if (!window.parent || window.parent === window) {
        console.error('❌ No parent window');
        return false;
      }
      
      try {
        const doc = window.parent.document;
        const allTextareas = Array.from(doc.querySelectorAll('textarea'));
        
        console.log(`🔍 Searching ${allTextareas.length} textareas for required response field...`);
        
        let requiredField = null;
        
        // Strategy 1: Find by "*Your Response" label (most specific)
        for (const ta of allTextareas) {
          // Check all nearby elements for label
          const parent = ta.parentElement;
          const grandparent = parent?.parentElement;
          const prevSib = ta.previousElementSibling;
          const nextSib = ta.nextElementSibling;
          
          const searchText = [
            prevSib?.textContent || '',
            parent?.textContent || '',
            grandparent?.textContent || '',
            nextSib?.textContent || '',
            ta.getAttribute('placeholder') || '',
            ta.getAttribute('name') || '',
            ta.getAttribute('id') || ''
          ].join(' ').toLowerCase();
          
          if (searchText.includes('*your response') || searchText.includes('your response')) {
            // Check if it's required or empty (likely the one we need)
            if (ta.hasAttribute('required') || 
                ta.getAttribute('aria-required') === 'true' ||
                ta.value === '' || 
                ta.readOnly) {
              requiredField = ta;
              console.log('✅ Found by label text');
              break;
            }
          }
        }
        
        // Strategy 2: Find by integrationID pattern
        if (!requiredField) {
          const urlParams = new URLSearchParams(window.location.search);
          const answerFieldId = urlParams.get('answerFieldId') || '';
          
          if (answerFieldId) {
            const selectors = [
              `textarea[data-integration-id*="Response"]`,
              `textarea[data-integration-id*="response"]`,
              `textarea[name*="response"]`,
              `textarea[id*="response"]`
            ];
            
            for (const selector of selectors) {
              try {
                const field = doc.querySelector(selector);
                if (field && field.tagName === 'TEXTAREA') {
                  requiredField = field;
                  console.log('✅ Found by integrationID pattern:', selector);
                  break;
                }
              } catch (e) {}
            }
          }
        }
        
        // Strategy 3: Find any required textarea
        if (!requiredField) {
          for (const ta of allTextareas) {
            if (ta.hasAttribute('required') || ta.getAttribute('aria-required') === 'true') {
              requiredField = ta;
              console.log('✅ Found by required attribute');
              break;
            }
          }
        }
        
        // Strategy 4: Find empty readonly textarea near "Required" text
        if (!requiredField) {
          for (const ta of allTextareas) {
            if (ta.readOnly && ta.value === '') {
              const nearbyText = (ta.parentElement?.textContent || '').toLowerCase();
              if (nearbyText.includes('required')) {
                requiredField = ta;
                console.log('✅ Found by readonly + required text');
                break;
              }
            }
          }
        }
        
        // Strategy 5: Find first empty textarea (last resort)
        if (!requiredField) {
          for (const ta of allTextareas) {
            if (ta.value === '' && ta.offsetParent !== null) {
              requiredField = ta;
              console.log('✅ Found first empty visible textarea (fallback)');
              break;
            }
          }
        }
        
        if (requiredField) {
          console.log('🔧 Filling required field:', {
            readOnly: requiredField.readOnly,
            disabled: requiredField.disabled,
            required: requiredField.hasAttribute('required'),
            currentValue: requiredField.value,
            newValue: transcriptToSend
          });
          
          // FORCE remove readonly/disabled
          requiredField.removeAttribute('readonly');
          requiredField.removeAttribute('disabled');
          requiredField.readOnly = false;
          requiredField.disabled = false;
          
          // Set value using multiple methods
          requiredField.value = transcriptToSend;
          
          // Try native setter
          try {
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
            nativeSetter.call(requiredField, transcriptToSend);
          } catch (e) {}
          
          // Trigger ALL events
          ['focus', 'input', 'change', 'blur', 'keyup', 'keydown'].forEach(type => {
            const event = new Event(type, { bubbles: true, cancelable: true });
            requiredField.dispatchEvent(event);
          });
          
          // Also try InputEvent
          try {
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              data: transcriptToSend,
              inputType: 'insertText'
            });
            requiredField.dispatchEvent(inputEvent);
          } catch (e) {}
          
          // Focus and blur to trigger validation
          requiredField.focus();
          setTimeout(() => {
            requiredField.blur();
            requiredField.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Verify
            if (requiredField.value === transcriptToSend) {
              console.log('✅✅✅ Required field successfully filled and verified!');
            } else {
              console.warn('⚠️ Field value mismatch:', requiredField.value, 'vs', transcriptToSend);
            }
          }, 200);
          
          return true;
        } else {
          console.error('❌ Could not find required response field!');
          console.error('   Searched', allTextareas.length, 'textareas');
          return false;
        }
      } catch (e) {
        console.error('❌ Error filling required field:', e);
        return false;
      }
    };
    
    // Fill immediately and retry multiple times
    let filled = fillRequiredField();
    if (!filled) {
      setTimeout(() => { filled = fillRequiredField(); }, 200);
    }
    if (!filled) {
      setTimeout(() => { filled = fillRequiredField(); }, 500);
    }
    if (!filled) {
      setTimeout(() => { filled = fillRequiredField(); }, 1000);
    }
    if (!filled) {
      setTimeout(() => { filled = fillRequiredField(); }, 2000);
    }
    
    // Log to spreadsheet IMMEDIATELY
    logToSpreadsheet(finalTranscript);
    
    // Set flag for JavaScript blocker
    if (window.parent && window.parent !== window) {
      try {
        window.parent.voiceResponseAccepted = true;
        window.parent.voiceResponseTranscript = transcriptToSend;
      } catch (e) {}
      
      // Send postMessage
      window.parent.postMessage({
        type: 'VOICE_RESPONSE_READY',
        transcript: transcriptToSend,
        questionId: questionId,
        questionTitle: questionTitle,
        enableNext: true,
        responseAccepted: true
      }, '*');
    }
    
    setError('');
    setStatus('saved');
    setHasResponse(true);
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
    
    // CRITICAL: Ensure questionId and questionTitle are always included
    const finalQuestionId = questionId || 'UNKNOWN_QUESTION';
    const finalQuestionTitle = questionTitle || 'Unknown Question';
    
    // Log warning if question info is missing
    if (!questionId || !questionTitle) {
      console.warn('⚠️ WARNING: Question ID or Title missing!');
      console.warn('   Question ID:', questionId);
      console.warn('   Question Title:', questionTitle);
      console.warn('   URL params:', window.location.search);
    }
    
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
      // Question info - CRITICAL: These identify which question this response is for
      questionId: finalQuestionId,
      questionTitle: finalQuestionTitle,
      // Response info
      transcript: transcriptToLog,
      recordingDuration: recordingTime, // Duration in seconds
      wordCount: transcriptToLog.split(/\s+/).filter(w => w.length > 0).length,
      // Response type
      responseType: 'Voice'
    };
    
    console.log('📊 ===== LOGGING TO SPREADSHEET =====');
    console.log('📊 Webhook URL:', SHEET_WEBHOOK_URL);
    console.log('📊 Payload:', JSON.stringify(payload, null, 2));
    
    if (!SHEET_WEBHOOK_URL || SHEET_WEBHOOK_URL === '') {
      console.error('❌ ERROR: No webhook URL configured!');
      console.error('❌ Please update SHEET_WEBHOOK_URL in pages/embed.js with your new deployment URL');
      return;
    }
    
    try {
      // Use fetch with error handling
      const response = await fetch(SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Note: With no-cors mode, we can't read the response
      // But we can check if the request was sent
      console.log('✅ POST request sent to webhook');
      console.log('✅ Request completed (check Google Apps Script execution log for details)');
      
      // Also try with a small delay to ensure it's processed
      setTimeout(() => {
        console.log('📊 If data is not appearing in spreadsheet:');
        console.log('   1. Check Google Apps Script execution log');
        console.log('   2. Verify webhook URL is correct');
        console.log('   3. Verify spreadsheet name: "Callvu Sales Enablement Quiz - Responses v2"');
        console.log('   4. Run testSetup() function in Google Apps Script');
      }, 1000);
      
    } catch (err) {
      console.error('❌ Webhook error:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
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

