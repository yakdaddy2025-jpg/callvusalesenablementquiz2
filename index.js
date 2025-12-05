import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ============================================================
// CONFIGURATION - UPDATE THIS WITH YOUR GOOGLE APPS SCRIPT URL
// ============================================================
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
// ============================================================

export default function VoiceRecorder() {
  // Get URL parameters
  const [params, setParams] = useState({
    questionId: '',
    questionTitle: '',
    answerFieldId: '',
    sessionId: '',
    repName: '',
    repEmail: ''
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('Ready to record');
  const [statusType, setStatusType] = useState('info'); // info, success, error, warning
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const newParams = {
      questionId: urlParams.get('questionId') || 'Unknown',
      questionTitle: decodeURIComponent(urlParams.get('questionTitle') || 'Voice Response'),
      answerFieldId: urlParams.get('answerFieldId') || '',
      sessionId: urlParams.get('sessionId') || generateSessionId(),
      repName: urlParams.get('repName') || '',
      repEmail: urlParams.get('repEmail') || ''
    };
    setParams(newParams);
    setSessionCode(newParams.sessionId);

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      setStatusType('error');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Generate unique session ID
  function generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0,O,1,I
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Format time display
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Start recording
  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Speech recognition not available');
      setStatusType('error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsPaused(false);
      setStatus('🎤 Recording... Speak now');
      setStatusType('info');
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }
      
      if (finalText) {
        setTranscript(prev => (prev + finalText).trim());
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatus('No speech detected. Please speak louder.');
        setStatusType('warning');
      } else if (event.error === 'audio-capture') {
        setStatus('No microphone found. Please check your device.');
        setStatusType('error');
      } else if (event.error === 'not-allowed') {
        setStatus('Microphone access denied. Please allow microphone access.');
        setStatusType('error');
      }
    };

    recognition.onend = () => {
      if (isRecording && !isPaused) {
        // Auto-restart if still recording (handles Chrome's auto-stop)
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition ended');
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  // Stop recording
  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimTranscript('');
    
    if (transcript.trim()) {
      setStatus('✓ Recording complete. Review your response below.');
      setStatusType('success');
    } else {
      setStatus('No speech captured. Try again.');
      setStatusType('warning');
    }
  }

  // Clear and restart
  function clearRecording() {
    stopRecording();
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setIsSaved(false);
    setStatus('Ready to record');
    setStatusType('info');
  }

  // Save transcript to Google Sheets
  async function saveTranscript() {
    if (!transcript.trim()) {
      setStatus('Nothing to save. Please record a response first.');
      setStatusType('warning');
      return;
    }

    setStatus('Saving response...');
    setStatusType('info');

    const payload = {
      sessionId: sessionCode,
      answerFieldId: params.answerFieldId,
      questionId: params.questionId,
      questionTitle: params.questionTitle,
      transcript: transcript.trim(),
      repName: params.repName,
      repEmail: params.repEmail,
      recordingDuration: recordingTime,
      wordCount: transcript.trim().split(/\s+/).length,
      responseType: 'Voice',
      submissionTimestamp: new Date().toISOString(),
      recordingStartTime: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : '',
      recordingEndTime: new Date().toISOString()
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // With no-cors, we can't read the response, so we assume success
      setIsSaved(true);
      setStatus(`✓ Response saved! Your code: ${sessionCode}`);
      setStatusType('success');

      // Also try postMessage to parent (in case CallVu supports it)
      try {
        window.parent.postMessage({
          type: 'TRANSCRIPT_READY',
          sessionId: sessionCode,
          transcript: transcript.trim(),
          fieldId: params.answerFieldId,
          questionId: params.questionId
        }, '*');
      } catch (e) {
        console.log('postMessage not available');
      }

    } catch (error) {
      console.error('Save error:', error);
      setStatus('Error saving. Please copy your response manually.');
      setStatusType('error');
    }
  }

  // Copy session code to clipboard
  function copySessionCode() {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    });
  }

  // Copy transcript to clipboard
  function copyTranscript() {
    navigator.clipboard.writeText(transcript).then(() => {
      setStatus('Transcript copied to clipboard!');
      setStatusType('success');
    });
  }

  return (
    <>
      <Head>
        <title>Voice Recorder - {params.questionTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{params.questionTitle}</h2>
          <p style={styles.subtitle}>Record your voice response</p>
        </div>

        {/* Session Code Display */}
        <div style={styles.sessionBox}>
          <span style={styles.sessionLabel}>Session Code:</span>
          <span style={styles.sessionCode}>{sessionCode}</span>
          <button onClick={copySessionCode} style={styles.copyBtn}>
            {showCopySuccess ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Status Bar */}
        <div style={{
          ...styles.statusBar,
          backgroundColor: statusType === 'success' ? '#d4edda' :
                          statusType === 'error' ? '#f8d7da' :
                          statusType === 'warning' ? '#fff3cd' : '#e7f3ff',
          color: statusType === 'success' ? '#155724' :
                 statusType === 'error' ? '#721c24' :
                 statusType === 'warning' ? '#856404' : '#004085'
        }}>
          {status}
        </div>

        {/* Recording Timer */}
        {(isRecording || recordingTime > 0) && (
          <div style={styles.timerBox}>
            <span style={{
              ...styles.timerDot,
              backgroundColor: isRecording ? '#ef4444' : '#9ca3af',
              animation: isRecording ? 'pulse 1s infinite' : 'none'
            }}>●</span>
            <span style={styles.timerText}>{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Control Buttons */}
        <div style={styles.controls}>
          {!isRecording ? (
            <button 
              onClick={startRecording} 
              style={{...styles.btn, ...styles.btnPrimary}}
              disabled={isSaved}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button 
              onClick={stopRecording} 
              style={{...styles.btn, ...styles.btnDanger}}
            >
              ⏹ Stop Recording
            </button>
          )}
          
          {transcript && !isRecording && (
            <>
              <button 
                onClick={clearRecording} 
                style={{...styles.btn, ...styles.btnSecondary}}
              >
                🔄 Re-record
              </button>
              
              {!isSaved && (
                <button 
                  onClick={saveTranscript} 
                  style={{...styles.btn, ...styles.btnSuccess}}
                >
                  ✓ Save Response
                </button>
              )}
            </>
          )}
        </div>

        {/* Transcript Display */}
        <div style={styles.transcriptBox}>
          <div style={styles.transcriptHeader}>
            <span>Your Response:</span>
            {transcript && (
              <button onClick={copyTranscript} style={styles.copyTranscriptBtn}>
                Copy Text
              </button>
            )}
          </div>
          <div style={styles.transcript}>
            {transcript || <span style={styles.placeholder}>Your spoken words will appear here...</span>}
            {interimTranscript && (
              <span style={styles.interim}> {interimTranscript}</span>
            )}
          </div>
          {transcript && (
            <div style={styles.wordCount}>
              {transcript.trim().split(/\s+/).length} words
            </div>
          )}
        </div>

        {/* Success Message */}
        {isSaved && (
          <div style={styles.successBox}>
            <h3 style={styles.successTitle}>✓ Response Saved!</h3>
            <p style={styles.successText}>
              <strong>Your session code is: {sessionCode}</strong>
            </p>
            <p style={styles.successSubtext}>
              Enter this code in the CallVu form to load your response,<br/>
              or your manager can look it up in the response spreadsheet.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div style={styles.instructions}>
          <h4 style={styles.instructionsTitle}>Instructions:</h4>
          <ol style={styles.instructionsList}>
            <li>Click "Start Recording" and speak your response</li>
            <li>Click "Stop Recording" when finished</li>
            <li>Review your transcript and re-record if needed</li>
            <li>Click "Save Response" to submit</li>
            <li>Copy the session code: <strong>{sessionCode}</strong></li>
            <li>Paste the session code into the CallVu form field</li>
          </ol>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '100%',
    padding: '16px',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0'
  },
  sessionBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '2px dashed #3b82f6'
  },
  sessionLabel: {
    fontSize: '14px',
    color: '#374151'
  },
  sessionCode: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: 'monospace',
    letterSpacing: '2px'
  },
  copyBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  statusBar: {
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px'
  },
  timerBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  timerDot: {
    fontSize: '16px'
  },
  timerText: {
    fontSize: '24px',
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#374151'
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  btn: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  btnSecondary: {
    backgroundColor: '#6b7280',
    color: 'white'
  },
  btnSuccess: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  transcriptBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb'
  },
  transcriptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  copyTranscriptBtn: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#e5e7eb',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  transcript: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#1f2937',
    minHeight: '80px',
    whiteSpace: 'pre-wrap'
  },
  placeholder: {
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  interim: {
    color: '#9ca3af'
  },
  wordCount: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right'
  },
  successBox: {
    backgroundColor: '#d1fae5',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '16px',
    border: '2px solid #10b981'
  },
  successTitle: {
    color: '#065f46',
    margin: '0 0 8px 0',
    fontSize: '18px'
  },
  successText: {
    color: '#065f46',
    margin: '0 0 4px 0',
    fontSize: '16px'
  },
  successSubtext: {
    color: '#047857',
    margin: '0',
    fontSize: '13px'
  },
  instructions: {
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #fcd34d'
  },
  instructionsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#92400e'
  },
  instructionsList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#78350f',
    lineHeight: '1.8'
  }
};
