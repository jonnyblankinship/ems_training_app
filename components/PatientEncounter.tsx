'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Mic,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Square,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

type RecordingState = 'idle' | 'recording' | 'processing';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function PatientEncounter() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [soapExpanded, setSoapExpanded] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTextRef = useRef('');

  const startRecording = useCallback(() => {
    setError('');
    setTranscript('');
    setInterimTranscript('');
    setAnalysis('');
    finalTextRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        'Live speech recognition is not supported in this browser. Please use the text input below, or try Chrome/Edge on desktop.'
      );
      setShowManualInput(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTextRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      setError('Speech recognition error. Please check microphone permissions and try again, or use text input.');
      recognitionRef.current = null;
      setRecordingState('idle');
    };

    recognition.onend = () => {
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setRecordingState('recording');
    } catch {
      setError('Could not start microphone. Please check permissions.');
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterimTranscript('');
    setRecordingState('idle');
  }, []);

  async function analyzeEncounter(text: string) {
    if (!text.trim()) {
      setError('No transcript to analyze. Please record or enter encounter details.');
      return;
    }

    setRecordingState('processing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('transcript', text);

      const res = await fetch('/api/analyze-encounter', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis);
        setSoapExpanded(true);
      }
    } catch {
      setError('Failed to analyze encounter. Check your connection and try again.');
    } finally {
      setRecordingState('idle');
    }
  }

  async function handleStopAndAnalyze() {
    stopRecording();
    const capturedText = finalTextRef.current.trim() || transcript.trim();
    await analyzeEncounter(capturedText);
  }

  async function handleManualSubmit() {
    if (!manualInput.trim()) return;
    setTranscript(manualInput);
    await analyzeEncounter(manualInput);
  }

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Patient Encounter</h2>
          <p className="text-sm text-slate-500 mt-1">
            Record your simulated encounter — get a differential, treatment plan, and SOAP report
          </p>
        </div>

        {/* Record Button */}
        {!isProcessing && (
          <div className="flex flex-col items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-24 h-24 bg-red-500 hover:bg-red-600 active:scale-95 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            ) : (
              <button
                onClick={handleStopAndAnalyze}
                className="w-24 h-24 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </button>
            )}
            <p className="text-sm text-slate-500">
              {isRecording ? 'Recording... tap to stop & analyze' : 'Tap to start recording'}
            </p>
            {isRecording && (
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
            <p className="text-sm text-slate-500">Analyzing encounter...</p>
          </div>
        )}

        {/* Live Transcript */}
        {(transcript || interimTranscript) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Live Transcript
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {transcript}
              {interimTranscript && (
                <span className="text-slate-400 italic">{interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* Manual text input toggle */}
        {!isRecording && !isProcessing && (
          <div className="space-y-2">
            {!isRecording && transcript && (
              <button
                onClick={() => analyzeEncounter(transcript)}
                className="w-full bg-red-600 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all"
              >
                Re-analyze Transcript
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <button
              onClick={() => setShowManualInput((v) => !v)}
              className="w-full flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
            >
              <FileText className="w-5 h-5 text-slate-400" />
              Enter encounter text manually
              {showManualInput ? (
                <ChevronUp className="w-4 h-4 ml-auto text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
              )}
            </button>

            {showManualInput && (
              <div className="space-y-2">
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={`Describe the encounter. For example:\n\n"Dispatch: 45 y/o male, chest pain. On arrival patient is pale and diaphoretic. He reports crushing chest pain 8/10 radiating to his left arm, started 20 min ago. No relief with rest. History of hypertension. Takes lisinopril. Last meal 2 hours ago. BP 148/92, HR 102, RR 18, SpO2 96%."`}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="w-full bg-red-600 text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-red-700 active:scale-95 transition-all"
                >
                  Analyze Encounter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setSoapExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-900 text-sm">Encounter Analysis & SOAP Report</span>
              </div>
              {soapExpanded ? (
                <ChevronUp className="w-4 h-4 text-red-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-red-600" />
              )}
            </button>
            {soapExpanded && (
              <div className="px-4 py-4">
                <MarkdownRenderer content={analysis} />
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
