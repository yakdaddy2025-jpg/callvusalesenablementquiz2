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
      
      // CRITICAL: Try to capture name/email from parent form immediately
      // This captures the name from page 2 (Rep Info step) before user records
      if (window.parent && window.parent !== window) {
        setTimeout(() => {
          try {
            const parentDoc = window.parent.document;
            
            // Look for name field - try multiple strategies
            if (!name) {
              const nameField = parentDoc.querySelector('input[data-integration-id*="Full_Name"]') ||
                               parentDoc.querySelector('input[data-integration-id*="Name"]') ||
                               Array.from(parentDoc.querySelectorAll('input[type="text"]')).find(input => {
                                 const label = input.closest('label')?.textContent || 
                                              input.parentElement?.textContent || 
                                              input.getAttribute('aria-label') || '';
                                 return label.toLowerCase().includes('name') && input.value && input.value.trim();
                               });
              
              if (nameField && nameField.value && nameField.value.trim()) {
                setRepName(nameField.value.trim());
                console.log('✅✅✅ Captured name from form on load:', nameField.value.trim());
              }
            }
            
            // Look for email field
            if (!email) {
              const emailField = parentDoc.querySelector('input[type="email"]') ||
                               parentDoc.querySelector('input[data-integration-id*="Email"]');
              if (emailField && emailField.value && emailField.value.trim()) {
                setRepEmail(emailField.value.trim());
                console.log('✅✅✅ Captured email from form on load:', emailField.value.trim());
              }
            }
          } catch (e) {
            console.log('Could not access parent form on load (CORS):', e.message);
          }
        }, 500); // Wait 500ms for form to load
      }
      
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
    console.log('📨 Received message from CallVu:', event.data);
    
    if (event.data && event.data.type === 'USER_INFO') {
      if (event.data.name) {
        setRepName(event.data.name);
        console.log('✅✅✅ Received name from CallVu:', event.data.name);
      }
      if (event.data.email) {
        setRepEmail(event.data.email);
        console.log('✅✅✅ Received email from CallVu:', event.data.email);
      }
    }
    
    // Also listen for field values if CallVu sends them
    if (event.data && event.data.type === 'FIELD_VALUE') {
      if (event.data.fieldId && event.data.fieldId.includes('Name') && event.data.value) {
        setRepName(event.data.value);
        console.log('✅✅✅ Received name from field value:', event.data.value);
      }
      if (event.data.fieldId && event.data.fieldId.includes('Email') && event.data.value) {
        setRepEmail(event.data.value);
        console.log('✅✅✅ Received email from field value:', event.data.value);
      }
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
    // notifyCallVuResponseReady handles logging internally - don't call logToSpreadsheet separately
    notifyCallVuResponseReady(finalTranscript);
  };
  
  const deleteResponse = () => {
    setTranscript('');
    setInterimTranscript('');
    setHasResponse(false);
    setStatus('ready');
    setRecordingTime(0);
    notifyCallVuResponseDeleted();
  };
  
  // NEW: Fetch transcript from database and fill field
  const fetchTranscriptAndFillField = async (uniqueResponseId, answerFieldId, questionId) => {
    console.log('🔍🔍🔍 FETCHING TRANSCRIPT FROM DATABASE');
    console.log('🔍 Unique Response ID:', uniqueResponseId);
    console.log('🔍 Answer Field ID:', answerFieldId);
    console.log('🔍 Question ID:', questionId);
    
    if (!uniqueResponseId || !answerFieldId) {
      console.error('❌❌❌ Cannot fetch - missing uniqueResponseId or answerFieldId!');
      console.error('   uniqueResponseId:', uniqueResponseId);
      console.error('   answerFieldId:', answerFieldId);
      return;
    }
    
    try {
      // Fetch from Google Apps Script GET endpoint
      const fetchUrl = `${SHEET_WEBHOOK_URL}?uniqueResponseId=${encodeURIComponent(uniqueResponseId)}&answerFieldId=${encodeURIComponent(answerFieldId)}&questionId=${encodeURIComponent(questionId)}`;
      
      console.log('🔍 Fetching from:', fetchUrl);
      
      // Try CORS first, fallback to no-cors
      let response;
      try {
        response = await fetch(fetchUrl, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅✅✅ FETCHED FROM DATABASE:', data);
          
          if (data.success && data.transcript) {
            // Now fill the field with the transcript from database
            fillRequiredFieldFromDatabase(data.transcript, answerFieldId);
          } else {
            console.error('❌ No transcript in response:', data);
            // Fallback: Try to fill directly with the transcript we just saved
            console.log('⚠️ Trying direct fill as fallback...');
            fillRequiredFieldFromDatabase(transcript.trim(), answerFieldId);
          }
        } else {
          console.error('❌ Fetch failed:', response.status, response.statusText);
          // Fallback: Try to fill directly
          console.log('⚠️ Trying direct fill as fallback...');
          fillRequiredFieldFromDatabase(transcript.trim(), answerFieldId);
        }
      } catch (corsError) {
        console.warn('⚠️ CORS fetch failed, trying direct fill:', corsError.message);
        // Fallback: Try to fill directly
        fillRequiredFieldFromDatabase(transcript.trim(), answerFieldId);
      }
    } catch (err) {
      console.error('❌ Error fetching from database:', err);
      // Last resort: Try to fill directly
      console.log('⚠️ Trying direct fill as last resort...');
      fillRequiredFieldFromDatabase(transcript.trim(), answerFieldId);
    }
  };
  
  // Fill field using transcript from database
  const fillRequiredFieldFromDatabase = (transcriptFromDb, answerFieldId) => {
    console.log('🔍🔍🔍 FILLING FIELD FROM DATABASE TRANSCRIPT');
    console.log('🔍 Transcript:', transcriptFromDb);
    console.log('🔍 Answer Field ID:', answerFieldId);
    
    if (!window.parent || window.parent === window) {
      console.error('❌ No parent window');
      return false;
    }
    
    try {
      const doc = window.parent.document;
      
      // Try every possible selector
      const selectors = [
        `[data-integration-id="${answerFieldId}"]`,
        `textarea[data-integration-id="${answerFieldId}"]`,
        `input[data-integration-id="${answerFieldId}"]`,
        `#${answerFieldId}`,
        `[name="${answerFieldId}"]`,
        `textarea[data-integration-id*="Response_Required"]`,
        `textarea[required]`
      ];
      
      let foundField = null;
      for (const selector of selectors) {
        try {
          const field = doc.querySelector(selector);
          if (field && (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT')) {
            const label = field.parentElement?.textContent || '';
            if (label.includes('Your Response') || field.hasAttribute('required')) {
              foundField = field;
              console.log(`✅✅✅ FOUND FIELD WITH SELECTOR: ${selector}`);
              break;
            }
          }
        } catch (e) {}
      }
      
      if (foundField) {
        // Remove readonly/disabled
        foundField.removeAttribute('readonly');
        foundField.removeAttribute('disabled');
        foundField.readOnly = false;
        foundField.disabled = false;
        
        // Set value
        foundField.value = transcriptFromDb;
        
        // Trigger events
        ['focus', 'input', 'change', 'blur'].forEach(type => {
          foundField.dispatchEvent(new Event(type, { bubbles: true }));
        });
        
        foundField.focus();
        setTimeout(() => {
          foundField.blur();
          foundField.dispatchEvent(new Event('change', { bubbles: true }));
          
          if (foundField.value === transcriptFromDb) {
            console.log('✅✅✅✅✅ FIELD FILLED FROM DATABASE SUCCESSFULLY!');
          } else {
            console.error('❌ Field value mismatch');
          }
        }, 200);
        
        return true;
      } else {
        console.error('❌ Could not find field to fill');
        return false;
      }
    } catch (e) {
      console.error('❌ Error filling field:', e);
      return false;
    }
  };
  
  const notifyCallVuResponseReady = (finalTranscript) => {
    const transcriptToSend = finalTranscript || transcript.trim();
    
    console.log('✅✅✅ KEEP RESPONSE CLICKED - FILLING FIELD');
    console.log('📝 Transcript to fill:', transcriptToSend);
    
    // CRITICAL: Fill the required response field so CallVu validation passes
    const fillRequiredField = () => {
      if (!window.parent || window.parent === window) {
        console.error('❌ No parent window');
        return false;
      }
      
      // CRITICAL: Fill the REQUIRED field DIRECTLY
      // No hidden fields, no conditional logic - just fill it directly
      const urlParams = new URLSearchParams(window.location.search);
      const answerFieldId = urlParams.get('answerFieldId') || '';
      
      console.log('🔍🔍🔍 FILLING REQUIRED FIELD DIRECTLY');
      console.log('🔍 Required Field ID:', answerFieldId);
      console.log('🔍 Transcript:', transcriptToSend);
      
      // Try EVERY possible way to fill the required field
      const fillField = (field) => {
        if (!field) return false;
        
        console.log('🔧 Filling field:', {
          tagName: field.tagName,
          id: field.id,
          name: field.name,
          integrationId: field.getAttribute('data-integration-id'),
          readOnly: field.readOnly,
          disabled: field.disabled
        });
        
        // FORCE remove readonly/disabled
        field.removeAttribute('readonly');
        field.removeAttribute('disabled');
        field.readOnly = false;
        field.disabled = false;
        
        // Try to override readonly via property descriptor
        try {
          Object.defineProperty(field, 'readOnly', {
            value: false,
            writable: true,
            configurable: true
          });
        } catch (e) {}
        
        // Set value using EVERY method
        field.value = transcriptToSend;
        
        // Try native setter
        try {
          const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
          if (descriptor && descriptor.set) {
            descriptor.set.call(field, transcriptToSend);
          }
        } catch (e) {}
        
        // Trigger ALL events
        ['focus', 'input', 'change', 'blur', 'keyup'].forEach(type => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          field.dispatchEvent(event);
        });
        
        // Also try InputEvent
        try {
          const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: transcriptToSend,
            inputType: 'insertText'
          });
          field.dispatchEvent(inputEvent);
        } catch (e) {}
        
        // Focus and blur
        field.focus();
        setTimeout(() => {
          field.blur();
          field.dispatchEvent(new Event('change', { bubbles: true }));
          
          const actualValue = field.value || '';
          console.log('🔍 Verification:', {
            expected: transcriptToSend.substring(0, 50),
            actual: actualValue.substring(0, 50),
            match: actualValue === transcriptToSend || actualValue.includes(transcriptToSend.substring(0, 10))
          });
          
          if (actualValue === transcriptToSend || actualValue.includes(transcriptToSend.substring(0, 10))) {
            console.log('✅✅✅✅✅ FIELD FILLED SUCCESSFULLY!');
            return true;
          } else {
            console.error('❌ Field value mismatch!');
            return false;
          }
        }, 200);
        
        return true;
      };
      
      // Try direct DOM access
      try {
        const doc = window.parent.document;
        
        // Try every possible selector
        const selectors = [
          `[data-integration-id="${answerFieldId}"]`,
          `textarea[data-integration-id="${answerFieldId}"]`,
          `input[data-integration-id="${answerFieldId}"]`,
          `#${answerFieldId}`,
          `[name="${answerFieldId}"]`,
          `[id*="${answerFieldId}"]`,
          `textarea[data-integration-id*="Response_Required"]`,
          `textarea[required]`
        ];
        
        let foundField = null;
        for (const selector of selectors) {
          try {
            const field = doc.querySelector(selector);
            if (field && (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT')) {
              // Check if it's the right field
              const label = field.parentElement?.textContent || '';
              if (label.includes('Your Response') || field.hasAttribute('required')) {
                foundField = field;
                console.log(`✅ Found field with selector: ${selector}`);
                break;
              }
            }
          } catch (e) {}
        }
        
        if (foundField) {
          fillField(foundField);
          return true;
        } else {
          console.error('❌ Could not find required field with any selector');
        }
      } catch (e) {
        console.error('❌ Direct DOM access failed (CORS):', e);
      }
      
      // Fallback: postMessage to parent
      try {
        window.parent.postMessage({
          type: 'CALLVU_FILL_FIELD',
          fieldId: answerFieldId,
          value: transcriptToSend,
          integrationId: answerFieldId
        }, '*');
        console.log('✅ PostMessage sent for required field');
      } catch (e) {
        console.error('❌ PostMessage failed:', e);
      }
      
      // Also try direct DOM access (may fail due to CORS)
      try {
        const doc = window.parent.document;
        const urlParams = new URLSearchParams(window.location.search);
        const answerFieldId = urlParams.get('answerFieldId') || '';
        
        console.log('🔍 AnswerFieldId from URL:', answerFieldId);
        
        // Get ALL possible form elements
        const allTextareas = Array.from(doc.querySelectorAll('textarea'));
        const allInputs = Array.from(doc.querySelectorAll('input'));
        const allContentEditable = Array.from(doc.querySelectorAll('[contenteditable="true"]'));
        const allFields = [...allTextareas, ...allInputs, ...allContentEditable];
        
        console.log(`🔍 Found ${allTextareas.length} textareas, ${allInputs.length} inputs, ${allContentEditable.length} contentEditable`);
        
        // Log ALL textareas for debugging
        console.log('📋 All textareas found:');
        allTextareas.forEach((ta, idx) => {
          console.log(`   ${idx + 1}. id="${ta.id}", name="${ta.name}", value="${ta.value}", readonly=${ta.readOnly}, required=${ta.hasAttribute('required')}`);
          console.log(`      data-integration-id="${ta.getAttribute('data-integration-id')}"`);
          console.log(`      parent text: "${(ta.parentElement?.textContent || '').substring(0, 100)}"`);
        });
        
        let requiredField = null;
        let foundBy = '';
        
        // Strategy 1: Find HIDDEN field (CallVu conditional logic will copy to required field)
        const hiddenFieldId = answerFieldId.replace('_Response_Required_', '_Hidden_Transcript_');
        console.log(`🔍 Strategy 1: Searching for HIDDEN field integrationID="${hiddenFieldId}"`);
        
        if (hiddenFieldId && hiddenFieldId !== answerFieldId) {
          // Try exact match for hidden field first
          const hiddenMatch = doc.querySelector(`[data-integration-id="${hiddenFieldId}"]`);
          if (hiddenMatch && (hiddenMatch.tagName === 'INPUT' || hiddenMatch.tagName === 'TEXTAREA')) {
            requiredField = hiddenMatch; // Fill hidden field - CallVu will copy it
            foundBy = `hidden field (exact): ${hiddenFieldId}`;
            console.log('✅✅✅ FOUND HIDDEN FIELD BY EXACT MATCH!', foundBy);
          }
          
          // Try partial match for hidden field
          if (!requiredField) {
            const hiddenPartial = doc.querySelector(`[data-integration-id*="${hiddenFieldId}"]`);
            if (hiddenPartial && (hiddenPartial.tagName === 'INPUT' || hiddenPartial.tagName === 'TEXTAREA')) {
              requiredField = hiddenPartial;
              foundBy = `hidden field (partial): ${hiddenFieldId}`;
              console.log('✅✅✅ FOUND HIDDEN FIELD BY PARTIAL MATCH!', foundBy);
            }
          }
        }
        
        // Strategy 2: Fallback to required field if hidden field not found
        if (!requiredField && answerFieldId) {
          console.log(`🔍 Strategy 2: Searching for required field integrationID="${answerFieldId}"`);
          
          // Try exact match first
          const exactMatch = doc.querySelector(`[data-integration-id="${answerFieldId}"]`);
          if (exactMatch && (exactMatch.tagName === 'TEXTAREA' || exactMatch.tagName === 'INPUT')) {
            requiredField = exactMatch;
            foundBy = `exact integrationID: ${answerFieldId}`;
            console.log('✅✅✅ FOUND BY EXACT MATCH!', foundBy);
          }
          
          // Try partial match
          if (!requiredField) {
            const partialMatch = doc.querySelector(`[data-integration-id*="${answerFieldId}"]`);
            if (partialMatch && (partialMatch.tagName === 'TEXTAREA' || partialMatch.tagName === 'INPUT')) {
              requiredField = partialMatch;
              foundBy = `partial integrationID: ${answerFieldId}`;
              console.log('✅✅✅ FOUND BY PARTIAL MATCH!', foundBy);
            }
          }
        }
        
        // Strategy 2: Find by "*Your Response" label text (search more thoroughly)
        if (!requiredField) {
          console.log('🔍 Strategy 2: Searching by "*Your Response" label');
          for (const field of allFields) {
            // Search in all parent elements up to 10 levels
            let current = field;
            let searchDepth = 0;
            while (current && searchDepth < 10) {
              const text = (current.textContent || '').toLowerCase();
              const ariaLabel = (current.getAttribute('aria-label') || '').toLowerCase();
              const placeholder = (current.getAttribute('placeholder') || '').toLowerCase();
              const label = current.querySelector('label')?.textContent?.toLowerCase() || '';
              
              if (text.includes('*your response') || 
                  text.includes('your response') ||
                  ariaLabel.includes('your response') ||
                  placeholder.includes('your response') ||
                  label.includes('your response')) {
                // Check if it's required or readonly
                if (field.hasAttribute('required') || 
                    field.getAttribute('aria-required') === 'true' ||
                    field.readOnly ||
                    field.value === '') {
                  requiredField = field;
                  foundBy = 'label text "*Your Response"';
                  console.log('✅✅✅ FOUND BY LABEL!', foundBy);
                  break;
                }
              }
              current = current.parentElement;
              searchDepth++;
            }
            if (requiredField) break;
          }
        }
        
        // Strategy 3: Find readonly + required textarea
        if (!requiredField) {
          console.log('🔍 Strategy 3: Searching for readonly + required');
          for (const field of allFields) {
            if (field.readOnly && 
                (field.hasAttribute('required') || field.getAttribute('aria-required') === 'true')) {
              requiredField = field;
              foundBy = 'readonly + required';
              console.log('✅✅✅ FOUND BY READONLY+REQUIRED!', foundBy);
              break;
            }
          }
        }
        
        // Strategy 4: Find any required empty field
        if (!requiredField) {
          console.log('🔍 Strategy 4: Searching for required + empty');
          for (const field of allFields) {
            if ((field.hasAttribute('required') || field.getAttribute('aria-required') === 'true') &&
                (field.value === '' || !field.value)) {
              requiredField = field;
              foundBy = 'required + empty';
              console.log('✅✅✅ FOUND BY REQUIRED+EMPTY!', foundBy);
              break;
            }
          }
        }
        
        // Strategy 5: Find first empty textarea (last resort)
        if (!requiredField) {
          console.log('🔍 Strategy 5: Searching for first empty textarea');
          for (const field of allTextareas) {
            if ((field.value === '' || !field.value) && field.offsetParent !== null) {
              requiredField = field;
              foundBy = 'first empty textarea';
              console.log('✅✅✅ FOUND BY FIRST EMPTY!', foundBy);
              break;
            }
          }
        }
        
        if (requiredField) {
          console.log('🔧🔧🔧 FILLING FIELD FOUND BY:', foundBy);
          console.log('🔧 Field details:', {
            tagName: requiredField.tagName,
            readOnly: requiredField.readOnly,
            disabled: requiredField.disabled,
            required: requiredField.hasAttribute('required'),
            ariaRequired: requiredField.getAttribute('aria-required'),
            currentValue: requiredField.value,
            id: requiredField.id,
            name: requiredField.name,
            className: requiredField.className,
            dataIntegrationId: requiredField.getAttribute('data-integration-id')
          });
          
          // FORCE remove readonly/disabled - use multiple methods
          requiredField.removeAttribute('readonly');
          requiredField.removeAttribute('disabled');
          requiredField.readOnly = false;
          requiredField.disabled = false;
          
          // Try to remove readonly via property descriptor
          try {
            Object.defineProperty(requiredField, 'readOnly', {
              value: false,
              writable: true,
              configurable: true
            });
          } catch (e) {
            console.log('Property descriptor failed:', e);
          }
          
          // Set value using EVERY possible method
          requiredField.value = transcriptToSend;
          if (requiredField.textContent !== undefined) {
            requiredField.textContent = transcriptToSend;
          }
          if (requiredField.innerText !== undefined) {
            requiredField.innerText = transcriptToSend;
          }
          
          // Try native setter
          try {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
            if (descriptor && descriptor.set) {
              descriptor.set.call(requiredField, transcriptToSend);
            }
          } catch (e) {
            console.log('Native setter failed:', e);
          }
          
          // Also try setAttribute
          try {
            requiredField.setAttribute('value', transcriptToSend);
          } catch (e) {}
          
          // Trigger ALL possible events in sequence
          const events = ['focus', 'input', 'change', 'blur', 'keyup', 'keydown', 'keypress'];
          events.forEach((type, index) => {
            setTimeout(() => {
              try {
                const event = new Event(type, { bubbles: true, cancelable: true });
                requiredField.dispatchEvent(event);
              } catch (e) {}
            }, index * 10);
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
          
          // Focus, wait, blur, verify
          requiredField.focus();
          setTimeout(() => {
            requiredField.blur();
            requiredField.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Verify value was set
            const actualValue = requiredField.value || requiredField.textContent || requiredField.innerText || '';
            console.log('🔍🔍🔍 VERIFICATION:', {
              expected: transcriptToSend,
              actual: actualValue,
              match: actualValue === transcriptToSend || actualValue.includes(transcriptToSend.substring(0, 10))
            });
            
            if (actualValue === transcriptToSend || actualValue.includes(transcriptToSend.substring(0, 10))) {
              console.log('✅✅✅✅✅ REQUIRED FIELD SUCCESSFULLY FILLED! ✅✅✅✅✅');
            } else {
              console.error('❌❌❌ FIELD VALUE NOT SET! Expected:', transcriptToSend, 'Got:', actualValue);
              console.error('   Trying one more time...');
              // One more aggressive attempt
              requiredField.value = transcriptToSend;
              requiredField.dispatchEvent(new Event('input', { bubbles: true }));
              requiredField.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, 300);
          
          return true;
        } else {
          console.error('❌❌❌ COULD NOT FIND REQUIRED RESPONSE FIELD!');
          console.error('   Searched', allFields.length, 'fields');
          console.error('   AnswerFieldId:', answerFieldId);
          console.error('   All textareas logged above - check console');
          return false;
        }
      } catch (e) {
        console.error('❌ Error filling required field:', e);
        console.error('Stack:', e.stack);
        // Don't return false here - postMessage might still work
      }
      
      // Return true if we at least sent postMessage
      return true;
    };
    
    // Fill immediately and retry aggressively - CONTINUOUS RETRIES
    console.log('🚀🚀🚀 STARTING CONTINUOUS FIELD FILL ATTEMPTS...');
    console.log('🚀 Will retry every 200ms until field is filled');
    
    let filled = false;
    let attemptCount = 0;
    const maxAttempts = 50; // Try for 10 seconds
    
    const tryFill = () => {
      attemptCount++;
      console.log(`🔄 Attempt ${attemptCount}/${maxAttempts}`);
      filled = fillRequiredField();
      
      if (!filled && attemptCount < maxAttempts) {
        setTimeout(tryFill, 200);
      } else if (filled) {
        console.log('✅✅✅ FIELD FILLED SUCCESSFULLY AFTER', attemptCount, 'ATTEMPTS!');
      } else {
        console.error('❌❌❌ FAILED TO FILL FIELD AFTER', attemptCount, 'ATTEMPTS');
      }
    };
    
    // CRITICAL: Save to database FIRST with unique ID, then fetch and fill
    // This is the database-driven approach - avoids all CORS issues
    const uniqueResponseId = `${questionId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const answerFieldId = new URLSearchParams(window.location.search).get('answerFieldId') || '';
    
    console.log('💾💾💾 SAVING TO DATABASE WITH UNIQUE ID:', uniqueResponseId);
    console.log('💾 Answer Field ID:', answerFieldId);
    console.log('💾 Transcript to save:', transcriptToSend);
    console.log('💾 After save, will fetch transcript and fill field');
    
    // CRITICAL: Also try to fill field directly FIRST (before database save)
    // This is a fallback in case database fetch fails due to CORS
    console.log('🔧🔧🔧 ATTEMPTING DIRECT FIELD FILL FIRST (fallback)...');
    fillRequiredFieldFromDatabase(transcriptToSend, answerFieldId);
    
    // CRITICAL: Pass uniqueResponseId and answerFieldId to logToSpreadsheet
    // Save to database, then fetch and fill
    logToSpreadsheet(finalTranscript, uniqueResponseId, answerFieldId).then(() => {
      // After saving, fetch the transcript and fill the field
      setTimeout(() => {
        console.log('🔍🔍🔍 FETCHING FROM DATABASE AFTER SAVE...');
        fetchTranscriptAndFillField(uniqueResponseId, answerFieldId, questionId || '');
      }, 1000); // Wait 1 second for database to save
    }).catch(err => {
      console.error('❌ Error saving to spreadsheet:', err);
      // Even if save fails, try to fill the field directly
      console.log('⚠️ Save failed, but trying direct fill anyway...');
      fillRequiredFieldFromDatabase(transcriptToSend, answerFieldId);
    });
    
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
  
  const logToSpreadsheet = async (finalTranscript, uniqueResponseId = null, answerFieldId = null) => {
    // Generate unique ID if not provided
    if (!uniqueResponseId) {
      uniqueResponseId = `${questionId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    if (!answerFieldId) {
      answerFieldId = new URLSearchParams(window.location.search).get('answerFieldId') || '';
    }
    
    // Try to get name/email from CallVu form if not set
    let nameToUse = repName.trim();
    let emailToUse = repEmail.trim();
    
    // If missing, try to get from parent window using multiple strategies
    if (!nameToUse || !emailToUse) {
      try {
        if (window.parent && window.parent !== window) {
          const parentDoc = window.parent.document;
          
          // Strategy 1: Look for specific CallVu field patterns
          // Name field - try multiple selectors
          if (!nameToUse) {
            const nameSelectors = [
              'input[data-integration-id*="Full_Name"]',
              'input[data-integration-id*="Name"]',
              'input[id*="name" i]',
              'input[name*="name" i]',
              'input[placeholder*="name" i]',
              'input[placeholder*="Full Name" i]',
              'input[type="text"]'
            ];
            
            // Also try to find by label text
            const allInputs = Array.from(parentDoc.querySelectorAll('input[type="text"]'));
            for (const input of allInputs) {
              try {
                // Check if label contains "name" or "full name"
                const label = input.closest('label')?.textContent || 
                             input.parentElement?.textContent || 
                             input.getAttribute('aria-label') || '';
                if (label.toLowerCase().includes('name') && input.value && input.value.trim()) {
                  nameToUse = input.value.trim();
                  console.log('✅ Found name by label text:', label, '=', nameToUse);
                  break;
                }
              } catch (e) {}
            }
            
            // If still not found, try selectors
            if (!nameToUse) {
              for (const selector of nameSelectors) {
                try {
                  const field = parentDoc.querySelector(selector);
                  if (field && field.value && field.value.trim()) {
                    nameToUse = field.value.trim();
                    console.log('✅ Found name from form using selector:', selector, '=', nameToUse);
                    break;
                  }
                } catch (e) {}
              }
            }
          }
          
          // Email field - try multiple selectors
          if (!emailToUse) {
            const emailSelectors = [
              'input[type="email"]',
              'input[data-integration-id*="Email"]',
              'input[id*="email" i]',
              'input[name*="email" i]',
              'input[placeholder*="email" i]'
            ];
            
            for (const selector of emailSelectors) {
              try {
                const field = parentDoc.querySelector(selector);
                if (field && field.value && field.value.trim()) {
                  emailToUse = field.value.trim();
                  console.log('✅ Found email from form using selector:', selector, '=', emailToUse);
                  break;
                }
              } catch (e) {}
            }
          }
          
          // Strategy 2: Try postMessage to request user info
          if ((!nameToUse || !emailToUse) && window.parent.postMessage) {
            try {
              window.parent.postMessage({ type: 'REQUEST_USER_INFO' }, '*');
              console.log('📤 Sent postMessage to request user info');
            } catch (e) {
              console.log('Could not send postMessage:', e);
            }
          }
        }
      } catch (e) {
        console.log('Could not access parent form (CORS):', e.message);
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
      // CRITICAL: Unique identifier for database lookup and field filling
      uniqueResponseId: uniqueResponseId,
      answerFieldId: answerFieldId,
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
    console.log('📊 Unique Response ID:', uniqueResponseId);
    console.log('📊 Answer Field ID:', answerFieldId);
    console.log('📊 Rep Name:', nameToUse);
    console.log('📊 Rep Email:', emailToUse);
    console.log('📊 Transcript length:', transcriptToLog.length);
    
    // CRITICAL: Verify unique IDs are in payload BEFORE logging
    if (!payload.uniqueResponseId || !payload.answerFieldId) {
      console.error('❌❌❌ CRITICAL ERROR: uniqueResponseId or answerFieldId missing from payload!');
      console.error('   uniqueResponseId in payload:', payload.uniqueResponseId);
      console.error('   answerFieldId in payload:', payload.answerFieldId);
      console.error('   Expected uniqueResponseId:', uniqueResponseId);
      console.error('   Expected answerFieldId:', answerFieldId);
      // Force add them if missing
      payload.uniqueResponseId = uniqueResponseId;
      payload.answerFieldId = answerFieldId;
      console.log('✅✅✅ Fixed payload - added missing IDs');
    }
    
    console.log('📊 Full Payload:', JSON.stringify(payload, null, 2));
    
    // CRITICAL: Verify unique IDs are in payload
    if (!payload.uniqueResponseId || !payload.answerFieldId) {
      console.error('❌❌❌ CRITICAL ERROR: uniqueResponseId or answerFieldId missing from payload!');
      console.error('   uniqueResponseId:', payload.uniqueResponseId);
      console.error('   answerFieldId:', payload.answerFieldId);
      console.error('   This will cause database lookup to fail!');
    }
    
    if (!SHEET_WEBHOOK_URL || SHEET_WEBHOOK_URL === '') {
      console.error('❌ ERROR: No webhook URL configured!');
      console.error('❌ Please update SHEET_WEBHOOK_URL in pages/embed.js with your new deployment URL');
      return;
    }
    
    try {
      // CRITICAL: Try CORS first to see response, fallback to no-cors if it fails
      console.log('📤 Sending POST request to:', SHEET_WEBHOOK_URL);
      console.log('📤 Payload size:', JSON.stringify(payload).length, 'bytes');
      console.log('📤 Payload preview:', {
        uniqueResponseId: payload.uniqueResponseId,
        repName: payload.repName,
        questionId: payload.questionId,
        transcriptLength: payload.transcript?.length || 0
      });
      
      let response;
      let responseData = null;
      
      // Try CORS mode first (to see response)
      try {
        response = await fetch(SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        console.log('✅ Response status:', response.status);
        console.log('✅ Response text:', responseText);
        
        if (response.ok) {
          try {
            responseData = JSON.parse(responseText);
            console.log('✅ Response data:', responseData);
            if (responseData.success) {
              console.log('✅✅✅ SUCCESSFULLY LOGGED TO SPREADSHEET!');
              console.log('✅ Row number:', responseData.rowNumber);
            } else {
              console.error('❌ Server returned success=false:', responseData.error);
            }
          } catch (e) {
            console.log('⚠️ Response is not JSON, but status is OK');
          }
        } else {
          console.error('❌ HTTP Error:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (corsError) {
        console.warn('⚠️ CORS mode failed, trying no-cors mode:', corsError.message);
        
        // Fallback to no-cors mode (Google Apps Script works with this)
        try {
          await fetch(SHEET_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script accepts this
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          
          console.log('✅ POST request sent (no-cors mode)');
          console.log('✅ Check Google Apps Script execution log to verify data was received');
          console.log('✅ Check spreadsheet to see if row was added');
        } catch (noCorsError) {
          console.error('❌❌❌ Both CORS and no-cors modes failed!');
          console.error('❌ CORS error:', corsError.message);
          console.error('❌ no-cors error:', noCorsError.message);
          throw noCorsError;
        }
      }
      
      // Return the unique IDs so caller can fetch and fill
      return { uniqueResponseId, answerFieldId };
      
    } catch (err) {
      console.error('❌❌❌ FETCH ERROR - Request failed completely!');
      console.error('❌ Error:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ This means the request never reached the server!');
      console.error('❌ Check:');
      console.error('   1. Is SHEET_WEBHOOK_URL correct?');
      console.error('   2. Is the Google Apps Script deployed?');
      console.error('   3. Is "Who has access" set to "Anyone"?');
      console.error('   4. Check browser network tab for the failed request');
      // Don't throw - we still want to try to fill the field even if logging fails
      return { uniqueResponseId, answerFieldId };
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

