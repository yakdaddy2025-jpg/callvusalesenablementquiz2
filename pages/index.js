import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// Google Apps Script webhook URL - UPDATE THIS AFTER DEPLOYING GOOGLE APPS SCRIPT
// Get the URL from: https://script.google.com → Deploy → Web app → Copy URL
const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzGzk7Zcb9invzxdO5mEVtoNX7bgXu-yWXagtjJ6B30mSNtxkwTsM_nB9B3tY2AdwCz/exec';

const questionMeta = {
  Q1_Banking: { 
    title: 'Banking: Card Replacement Chaos', 
    criteria: 'Must mention identity enforcement, disclosures, signatures (Mode A) and backend card reissue (Mode B). Must NOT call it a bot or IVR fix.',
    scenario: 'A major bank tells you: "Our card replacement process varies wildly depending on the agent. Some skip identity steps, others forget disclosures. Fraud loves this."'
  },
  Q2_Insurance: { 
    title: 'Insurance: Inaccurate FNOL', 
    criteria: 'Must say "Mode A eliminates NIGO errors" and "Mode B runs deterministic policy updates."',
    scenario: 'A claims VP says: "Our FNOL submissions are full of missing info and call center agents improvise the script."'
  },
  Q3_Telco: { 
    title: 'Telco: SIM Swap Fraud', 
    criteria: 'Mentions identity + mandatory checks. NO mention of "fixing IVR" or "building a form."',
    scenario: 'A telco sees a spike in fraudulent SIM swaps.'
  },
  Q4_Utilities: { 
    title: 'Utilities: Move-In/Move-Out Errors', 
    criteria: 'Must clearly state: "Mode A prevents bad inputs; Mode B prevents backend errors."',
    scenario: 'Operations lead complains: "Service activations are constantly wrong. Wrong dates, missing notices, and billing issues."'
  },
  Q5_Mortgage: { 
    title: 'Mortgage: Hardship Script Compliance', 
    criteria: 'Must say "Mode A eliminates agent variability." Must mention CFPB or regulatory enforcement.',
    scenario: 'A servicer says: "Agents improvise hardship calls. Regulators are hammering us."'
  },
  Q6_Healthcare: { 
    title: 'Healthcare: Intake Inaccuracy', 
    criteria: 'Explain Mode A for intake/consents and Mode B for eligibility/EMR updates.',
    scenario: 'A provider says: "Intake data is wrong half the time. Insurance info missing. Consents aren\'t properly logged."'
  },
  Q7_Bots: { 
    title: 'Objection: We Already Have Bots', 
    criteria: 'Never positions CallVu as a bot competitor. Uses "completion layer" language.',
    scenario: 'A CIO says: "We have bots. Why do we need you?"'
  },
  Q8_Architecture: { 
    title: 'Architecture Drill: 30-Second Explanation', 
    criteria: 'Must include: micro-apps, orchestration, two modes, compliance.',
    scenario: 'Explain the CallVu architecture in 30 seconds.'
  },
  Q9_Analogies: { 
    title: 'Drill: Spot Wrong Analogies', 
    criteria: 'Correctly identify why each wrong analogy is incorrect: form builder, self-service, RPA, interchangeable with bots.',
    scenario: 'Explain why these statements are WRONG: 1) CallVu is like a form builder, 2) Mode A is just self-service, 3) Mode B is basically RPA, 4) Bots + CallVu are interchangeable.'
  },
  Q12_Compliance1: { 
    title: 'Compliance: Skipped Disclosure', 
    criteria: 'Mode A: Not possible (UI blocks progression). Mode B: Not applicable.',
    scenario: 'An agent accidentally skips a required disclosure step during a claims intake. Would this be possible in Mode A or Mode B?'
  },
  Q13_Compliance2: { 
    title: 'Compliance: AI Reordering Steps', 
    criteria: 'No. Mode B is deterministic; AI cannot change step order.',
    scenario: 'An AI agent decides to reorder steps in a workflow based on probability. Would CallVu allow this in Mode B?'
  },
  Q14_Compliance3: { 
    title: 'Compliance: Incomplete KYC', 
    criteria: 'Mode A. The UI stops progression until compliance conditions are met.',
    scenario: 'A customer submits an incomplete KYC step. What mode handles this? What happens?'
  },
  Q15_Compliance4: { 
    title: 'Compliance: Backend Failure', 
    criteria: 'Logs failure deterministically, halts safely, prevents partial updates.',
    scenario: 'Backend system fails mid-update. What does Mode B do?'
  },
  Q19_20SecPitch: { 
    title: '20-Second Elevator Pitch', 
    criteria: 'Includes: completion & compliance layer, micro-apps, Mode A + B, cross-channel, not a bot.',
    scenario: 'Explain CallVu in 20 seconds. Include: completion & compliance layer, micro-apps, Mode A + Mode B, works across channels, not a bot.'
  },
  Q20_ModeBSafety: { 
    title: 'Why Mode B is Safe for AI', 
    criteria: 'Includes: deterministic, step-ordered, no hallucination, full audit trail.',
    scenario: 'Explain why Mode B is safe for AI. Include: deterministic, step-ordered, no hallucination possible, full audit trail.'
  }
};

export default function VoiceQuizRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('ready');
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [questionId, setQuestionId] = useState('Unknown');
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  
  const questionInfo = questionMeta[questionId] || { 
    title: questionId.replace(/_/g, ' '), 
    criteria: 'Provide a complete and accurate response.',
    scenario: 'Answer the question thoroughly.'
  };
  
  useEffect(() => {
    // Get question from URL params (client-side only)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setQuestionId(urlParams.get('question') || 'Unknown');
      
      // Load saved name/email from localStorage
      const savedName = localStorage.getItem('quizRepName');
      const savedEmail = localStorage.getItem('quizRepEmail');
      if (savedName) setRepName(savedName);
      if (savedEmail) setRepEmail(savedEmail);
    }
  }, []);
  
  useEffect(() => {
    // Check for Web Speech API support
    if (typeof window === 'undefined') return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false);
      setError('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable microphone permissions and refresh.');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, just restart
      } else {
        setError(`Recognition error: ${event.error}`);
      }
    };
    
    recognitionRef.current.onend = () => {
      // Auto-restart if still recording
      if (isRecording && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already started
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
  }, [isRecording]);
  
  const startRecording = async () => {
    setError('');
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsRecording(true);
      setStatus('recording');
      recognitionRef.current?.start();
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please allow microphone permissions.');
    }
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    setStatus('stopped');
    
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const submitResponse = async () => {
    if (!repName.trim() || !repEmail.trim()) {
      setError('Please enter your name and email');
      return;
    }
    
    if (!transcript.trim()) {
      setError('No response recorded. Please record your answer first.');
      return;
    }
    
    // Save name/email for next time
    localStorage.setItem('quizRepName', repName.trim());
    localStorage.setItem('quizRepEmail', repEmail.trim());
    
    setStatus('submitting');
    setError('');
    
    const payload = {
      timestamp: new Date().toISOString(),
      repName: repName.trim(),
      repEmail: repEmail.trim(),
      questionId: questionId,
      questionTitle: questionInfo.title,
      transcript: transcript.trim(),
      recordingDuration: recordingTime,
      successCriteria: questionInfo.criteria
    };
    
    try {
      // Try to send to Google Sheets (only if webhook URL is set)
      if (SHEET_WEBHOOK_URL && SHEET_WEBHOOK_URL !== '') {
        await fetch(SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.log('Webhook error (expected with no-cors):', err);
    }
    
    // Always save locally as backup
    const stored = JSON.parse(localStorage.getItem('quizResponses') || '[]');
    stored.push(payload);
    localStorage.setItem('quizResponses', JSON.stringify(stored));
    
    setSubmitted(true);
    setStatus('submitted');
  };
  
  if (!browserSupported) {
    return (
      <>
        <Head>
          <title>Browser Not Supported | CallVu Quiz</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Browser Not Supported</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Please open this page in Google Chrome, Microsoft Edge, or Safari.</p>
          </div>
        </div>
      </>
    );
  }
  
  if (submitted) {
    return (
      <>
        <Head>
          <title>Response Submitted | CallVu Quiz</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Response Submitted!</h2>
            <p className="text-gray-600 mb-4">Your voice response for "<strong>{questionInfo.title}</strong>" has been recorded.</p>
            <p className="text-sm text-gray-500 mb-6">You can close this tab and return to the CallVu quiz.</p>
            <button 
              onClick={() => window.close()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Close Window
            </button>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Voice Response | CallVu Sales Quiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Voice Response Recorder</h1>
                <p className="text-sm text-gray-500">CallVu Sales Enablement Quiz</p>
              </div>
            </div>
          </div>
          
          {/* Question Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 className="font-bold text-lg text-gray-800 mb-3">{questionInfo.title}</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700"><strong>Scenario:</strong> {questionInfo.scenario}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800"><strong>Success Criteria:</strong> {questionInfo.criteria}</p>
            </div>
          </div>
          
          {/* Rep Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="john@company.com"
                />
              </div>
            </div>
          </div>
          
          {/* Recording Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div className="flex flex-col items-center">
              {/* Timer */}
              <div className={`text-5xl font-mono mb-6 ${isRecording ? 'text-red-500' : 'text-gray-300'}`}>
                {formatTime(recordingTime)}
              </div>
              
              {/* Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse-recording' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                )}
              </button>
              
              <p className="mt-4 text-gray-500 font-medium">
                {isRecording ? '🔴 Recording... Click to stop' : 'Click to start recording'}
              </p>
            </div>
          </div>
          
          {/* Transcript */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Your Response</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[120px] max-h-64 overflow-y-auto border border-gray-200">
              {transcript || interimTranscript ? (
                <p className="text-gray-700 leading-relaxed">
                  {transcript}
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                </p>
              ) : (
                <p className="text-gray-400 italic">Your transcription will appear here as you speak...</p>
              )}
            </div>
            {transcript && (
              <p className="text-xs text-gray-400 mt-2">{transcript.split(' ').length} words</p>
            )}
          </div>
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
          
          {/* Submit */}
          <button
            onClick={submitResponse}
            disabled={!transcript.trim() || isRecording || status === 'submitting'}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition shadow-lg ${
              !transcript.trim() || isRecording || status === 'submitting'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {status === 'submitting' ? 'Submitting...' : '✓ Submit Response'}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Responses are logged to the quiz spreadsheet for manager review
          </p>
        </div>
      </div>
    </>
  );
}

