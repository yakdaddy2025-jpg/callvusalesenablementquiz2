import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ============================================
// CONFIGURATION - UPDATE THIS URL AFTER DEPLOYING GOOGLE APPS SCRIPT
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_crnW8dIR5aBDzeCg55_4_tndEURDkObLa25fg7vRphF1iO55lo64xMJhuWhjyEer/exec';

export default function VoiceRecorder() {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('ready'); // ready, recording, review, saving, saved
  const [error, setError] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [answerFieldId, setAnswerFieldId] = useState('');
  
  // Refs
  const recognitionRef = useRef(null);
  
  // Get question info from URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setQuestionId(params.get('questionId') || params.get('question') || 'unknown');
      setQuestionTitle(params.get('questionTitle') || params.get('title') || 'Voice Response');
      setAnswerFieldId(params.get('answerFieldId') || params.get('fieldId') || '');
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
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
            setTranscript(prev => prev + finalText);
          }
          setInterimTranscript(interimText);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access and try again.');
          } else if (event.error !== 'aborted') {
            setError(`Recognition error: ${event.error}`);
          }
          setIsRecording(false);
          setStatus('ready');
        };
        
        recognition.onend = () => {
          if (isRecording) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition ended');
            }
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      }
    }
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    setError('');
    setTranscript('');
    setInterimTranscript('');
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        setStatus('recording');
      }
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setInterimTranscript('');
    setStatus('review');
  };

  // Save and send to CallVu parent
  const saveAndSendToCallVu = async () => {
    if (!transcript.trim()) {
      setError('No transcript to save. Please record something first.');
      return;
    }
    
    setStatus('saving');
    setError('');
    
    const finalTranscript = transcript.trim();
    const wordCount = finalTranscript.split(/\s+/).length;
    
    try {
      // 1. Send postMessage to CallVu parent window FIRST (most important)
      if (window.parent && window.parent !== window) {
        const message = {
          type: 'VOICE_TRANSCRIPT_READY',
          transcript: finalTranscript,
          questionId: questionId,
          answerFieldId: answerFieldId,
          wordCount: wordCount,
          timestamp: new Date().toISOString()
        };
        
        console.log('Sending postMessage to parent:', message);
        window.parent.postMessage(message, '*');
      }
      
      // 2. Also save to Google Sheets as backup
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: 'transcript_saved',
            transcript: finalTranscript,
            questionId: questionId,
            questionTitle: questionTitle,
            answerFieldId: answerFieldId,
            wordCount: wordCount,
            sessionId: 'SESSION_' + Date.now()
          })
        });
        console.log('Saved to Google Sheets');
      } catch (sheetError) {
        console.warn('Google Sheets save failed (non-critical):', sheetError);
      }
      
      setStatus('saved');
      
    } catch (err) {
      console.error('Save error:', err);
      setError('There was an issue saving. Please try again.');
      setStatus('review');
    }
  };

  // Reset
  const resetRecording = () => {
    setTranscript('');
    setInterimTranscript('');
    setStatus('ready');
    setError('');
  };

  return (
    <>
      <Head>
        <title>Voice Recorder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>🎤 Voice Response</h2>
          {questionTitle && <p style={styles.subtitle}>{questionTitle}</p>}
        </div>
        
        {/* Error */}
        {error && <div style={styles.error}>⚠️ {error}</div>}
        
        {/* Ready State */}
        {status === 'ready' && (
          <div style={styles.section}>
            <p style={styles.instructions}>
              Click the button below and speak your response clearly. 
              Your words will appear as text in real-time.
            </p>
            <button onClick={startRecording} style={styles.recordButton}>
              🎙️ Start Recording
            </button>
          </div>
        )}
        
        {/* Recording State */}
        {status === 'recording' && (
          <div style={styles.section}>
            <div style={styles.recordingIndicator}>
              <span style={styles.pulse}>●</span> Recording...
            </div>
            
            <div style={styles.transcriptBox}>
              <p style={styles.transcriptText}>
                {transcript}
                <span style={styles.interimText}>{interimTranscript}</span>
              </p>
              {!transcript && !interimTranscript && (
                <p style={styles.placeholder}>Start speaking...</p>
              )}
            </div>
            
            <button onClick={stopRecording} style={styles.stopButton}>
              ⏹️ Stop Recording
            </button>
          </div>
        )}
        
        {/* Review State */}
        {status === 'review' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Review Your Response:</h3>
            
            <div style={styles.transcriptBox}>
              <p style={styles.transcriptText}>{transcript || 'No transcript captured'}</p>
            </div>
            
            <div style={styles.wordCount}>
              Word count: {transcript.trim() ? transcript.trim().split(/\s+/).length : 0}
            </div>
            
            <div style={styles.buttonRow}>
              <button onClick={resetRecording} style={styles.secondaryButton}>
                🔄 Re-record
              </button>
              <button onClick={saveAndSendToCallVu} style={styles.primaryButton}>
                ✅ Submit Response
              </button>
            </div>
          </div>
        )}
        
        {/* Saving State */}
        {status === 'saving' && (
          <div style={styles.section}>
            <div style={styles.spinner}>⏳</div>
            <p style={styles.savingText}>Submitting your response...</p>
          </div>
        )}
        
        {/* Saved State */}
        {status === 'saved' && (
          <div style={styles.section}>
            <div style={styles.successBox}>
              <div style={styles.checkmark}>✅</div>
              <h3 style={styles.successTitle}>Response Submitted!</h3>
              <p style={styles.successText}>
                Your voice response has been recorded and saved.
              </p>
              <button onClick={resetRecording} style={styles.secondaryButton}>
                Record Another Response
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </>
  );
}

// Styles
const styles = {
  container: {
    maxWidth: '100%',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    minHeight: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    margin: '0 0 4px 0',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  instructions: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '16px',
    textAlign: 'center',
  },
  recordButton: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    color: '#e53935',
    marginBottom: '12px',
    fontWeight: '600',
  },
  pulse: {
    animation: 'pulse 1s infinite',
    fontSize: '20px',
  },
  transcriptBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '12px',
    minHeight: '100px',
    maxHeight: '200px',
    overflow: 'auto',
    marginBottom: '12px',
    border: '1px solid #e0e0e0',
  },
  transcriptText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    margin: 0,
  },
  interimText: {
    color: '#888',
    fontStyle: 'italic',
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
    margin: 0,
  },
  stopButton: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '16px',
    backgroundColor: '#e53935',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: '15px',
    marginBottom: '12px',
    color: '#333',
  },
  wordCount: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '12px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    backgroundColor: '#fff',
    color: '#333',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  spinner: {
    textAlign: 'center',
    fontSize: '36px',
    marginBottom: '12px',
  },
  savingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  successBox: {
    textAlign: 'center',
  },
  checkmark: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  successTitle: {
    color: '#4CAF50',
    fontSize: '18px',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px',
  },
};
