import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ============================================================
// CONFIGURATION - UPDATE THIS WITH YOUR GOOGLE APPS SCRIPT URL
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4xzPbSxU7CzqDoSplgnOah57VG5KRlyk9hg-EL_XwcR7_sX_hXUynk208jy7HnOVJ/exec';
// ============================================================

export default function VoiceRecorder() {
  const [params, setParams] = useState({
    questionId: '', questionTitle: '', sessionId: '', repName: '', repEmail: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('Record your response to continue');
  const [statusType, setStatusType] = useState('warning');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('sessionId') || localStorage.getItem('quizSessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('quizSessionId', sessionId);
    }
    
    const newParams = {
      questionId: urlParams.get('questionId') || 'Unknown',
      questionTitle: decodeURIComponent(urlParams.get('questionTitle') || 'Voice Response'),
      sessionId: sessionId,
      repName: urlParams.get('repName') || localStorage.getItem('repName') || '',
      repEmail: urlParams.get('repEmail') || localStorage.getItem('repEmail') || ''
    };
    setParams(newParams);

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Please use Chrome, Edge, or Safari');
      setStatusType('error');
    }

    const savedKey = `saved_${sessionId}_${newParams.questionId}`;
    if (localStorage.getItem(savedKey) === 'true') {
      setIsSaved(true);
      setStatus('✓ Response saved. You may proceed.');
      setStatusType('success');
      setTranscript(localStorage.getItem(`transcript_${sessionId}_${newParams.questionId}`) || '');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  function generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function logActivity(actionType, extraData = {}) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType, sessionId: params.sessionId, repName: params.repName,
          repEmail: params.repEmail, questionId: params.questionId,
          questionTitle: params.questionTitle, timestamp: new Date().toISOString(), ...extraData
        })
      });
    } catch (e) { console.log('Log failed:', e); }
  }

  function startRecording() {
    if (isSaved) return;
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
      setTranscript('');
      setInterimTranscript('');
      setStatus('🎤 Recording... Speak clearly');
      setStatusType('info');
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      logActivity('recording_start', { attemptNumber });
    };

    recognition.onresult = (event) => {
      let finalText = '', interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript + ' ';
        else interimText += result[0].transcript;
      }
      if (finalText) setTranscript(prev => (prev + finalText).trim());
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') setStatus('No speech detected. Speak louder.');
      else if (event.error === 'not-allowed') setStatus('Microphone access denied.');
      setStatusType('warning');
    };

    recognition.onend = () => {
      if (isRecording) try { recognition.start(); } catch (e) {}
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { setStatus('Error starting. Please refresh.'); }
  }

  function stopRecording() {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    setInterimTranscript('');
    
    logActivity('transcript_attempt', {
      transcript, wordCount: transcript.trim().split(/\s+/).filter(w => w).length,
      recordingDuration: Math.floor((Date.now() - startTimeRef.current) / 1000), attemptNumber
    });
    
    if (transcript.trim()) {
      setStatus('Review below. "Save & Continue" when ready, or "Re-record" to try again.');
      setStatusType('info');
    } else {
      setStatus('No speech captured. Try again.');
      setStatusType('warning');
    }
  }

  function reRecord() {
    if (isSaved) return;
    setAttemptNumber(prev => prev + 1);
    setTranscript('');
    setRecordingTime(0);
    setStatus('Ready to record.');
    setStatusType('warning');
    logActivity('re_record', { attemptNumber: attemptNumber + 1 });
  }

  async function saveTranscript() {
    if (!transcript.trim()) {
      setStatus('Record a response first.');
      setStatusType('warning');
      return;
    }
    setIsSaving(true);
    setStatus('Saving...');

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'transcript_saved', sessionId: params.sessionId,
          repName: params.repName, repEmail: params.repEmail,
          questionId: params.questionId, questionTitle: params.questionTitle,
          transcript: transcript.trim(),
          wordCount: transcript.trim().split(/\s+/).filter(w => w).length,
          recordingDuration: recordingTime, attemptNumber
        })
      });

      localStorage.setItem(`saved_${params.sessionId}_${params.questionId}`, 'true');
      localStorage.setItem(`transcript_${params.sessionId}_${params.questionId}`, transcript.trim());
      setIsSaved(true);
      setIsSaving(false);
      setStatus('✓ Response saved! You may now proceed.');
      setStatusType('success');

      window.parent.postMessage({
        type: 'VOICE_RESPONSE_SAVED', sessionId: params.sessionId,
        questionId: params.questionId, transcript: transcript.trim(), success: true
      }, '*');
    } catch (error) {
      setIsSaving(false);
      setStatus('Error saving. Try again.');
      setStatusType('error');
    }
  }

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', padding: '16px', maxWidth: '100%', background: '#fff', minHeight: '100vh' },
    statusBanner: { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid', backgroundColor: isSaved ? '#d1fae5' : statusType === 'error' ? '#fee2e2' : statusType === 'info' ? '#dbeafe' : '#fef3c7', borderColor: isSaved ? '#10b981' : statusType === 'error' ? '#ef4444' : statusType === 'info' ? '#3b82f6' : '#f59e0b' },
    statusIcon: { fontSize: '18px', fontWeight: 'bold', color: isSaved ? '#059669' : statusType === 'error' ? '#dc2626' : statusType === 'info' ? '#2563eb' : '#d97706' },
    statusText: { fontSize: '14px', fontWeight: '500', color: '#1f2937' },
    recordingArea: { textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '12px', marginBottom: '16px' },
    timerDisplay: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
    timerDot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isRecording ? '#ef4444' : '#d1d5db' },
    timerText: { fontSize: '32px', fontWeight: '600', fontFamily: 'monospace', color: '#374151' },
    btnRecord: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 28px', fontSize: '16px', fontWeight: '600', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' },
    btnStop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 28px', fontSize: '16px', fontWeight: '600', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' },
    transcriptArea: { marginBottom: '16px' },
    transcriptLabel: { fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
    transcriptBox: { padding: '14px', minHeight: '100px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '2px solid', borderColor: isSaved ? '#10b981' : '#e5e7eb', fontSize: '15px', lineHeight: '1.6', color: '#1f2937' },
    placeholder: { color: '#9ca3af', fontStyle: 'italic' },
    interim: { color: '#9ca3af' },
    actionButtons: { display: 'flex', gap: '10px', justifyContent: 'center' },
    btnSecondary: { padding: '12px 20px', fontSize: '14px', fontWeight: '600', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    btnPrimary: { padding: '12px 24px', fontSize: '14px', fontWeight: '600', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    successBox: { textAlign: 'center', padding: '24px', background: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' },
    successIcon: { fontSize: '48px', color: '#059669', marginBottom: '8px' },
    successTitle: { fontSize: '20px', fontWeight: '700', color: '#065f46', marginBottom: '4px' },
    successSubtext: { fontSize: '14px', color: '#047857' }
  };

  return (
    <>
      <Head><title>{params.questionTitle}</title></Head>
      <div style={styles.container}>
        <div style={styles.statusBanner}>
          <span style={styles.statusIcon}>{isSaved ? '✓' : statusType === 'error' ? '✕' : statusType === 'info' ? '●' : '⚠'}</span>
          <span style={styles.statusText}>{status}</span>
        </div>

        {!isSaved && (
          <div style={styles.recordingArea}>
            <div style={styles.timerDisplay}>
              <div style={styles.timerDot} />
              <span style={styles.timerText}>{formatTime(recordingTime)}</span>
            </div>
            <div>
              {!isRecording ? (
                <button onClick={startRecording} style={styles.btnRecord} disabled={isSaving}>
                  🎤 {transcript ? 'Record Again' : 'Start Recording'}
                </button>
              ) : (
                <button onClick={stopRecording} style={styles.btnStop}>⏹ Stop Recording</button>
              )}
            </div>
          </div>
        )}

        <div style={styles.transcriptArea}>
          <div style={styles.transcriptLabel}>
            Your Response {transcript && `(${transcript.trim().split(/\s+/).filter(w=>w).length} words)`}
          </div>
          <div style={styles.transcriptBox}>
            {transcript ? (
              <>{transcript}{interimTranscript && <span style={styles.interim}> {interimTranscript}</span>}</>
            ) : (
              <span style={styles.placeholder}>{isRecording ? 'Listening...' : 'Your words will appear here...'}</span>
            )}
          </div>
        </div>

        {!isSaved && transcript && !isRecording && (
          <div style={styles.actionButtons}>
            <button onClick={reRecord} style={styles.btnSecondary} disabled={isSaving}>🔄 Re-record</button>
            <button onClick={saveTranscript} style={styles.btnPrimary} disabled={isSaving}>
              {isSaving ? '⏳ Saving...' : '✓ Save & Continue'}
            </button>
          </div>
        )}

        {isSaved && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successTitle}>Response Saved!</div>
            <div style={styles.successSubtext}>Click "Next" in the form to continue</div>
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </>
  );
}
