'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API 래퍼 훅.
 * - window.SpeechRecognition || window.webkitSpeechRecognition
 * - listen() 은 한 번 듣고 결과를 Promise 로 돌려준다: { transcript, alternatives, error }
 * - 미지원 브라우저면 supported = false → 호출부에서 수동 입력 폴백
 */
export default function useSpeechRecognition({ lang = 'en-US' } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const resolveRef = useRef(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return undefined;
    }
    setSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    const settle = (payload) => {
      const resolve = resolveRef.current;
      resolveRef.current = null;
      setListening(false);
      if (resolve) resolve(payload);
    };

    recognition.onresult = (event) => {
      const result = event.results[0];
      const alternatives = [];
      for (let i = 0; i < result.length; i += 1) {
        alternatives.push((result[i].transcript || '').trim());
      }
      settle({ transcript: alternatives[0] || '', alternatives, error: null });
    };
    recognition.onerror = (event) => {
      settle({ transcript: '', alternatives: [], error: event.error || 'recognition_error' });
    };
    recognition.onend = () => {
      // 결과 없이 끝난 경우(무음 등)도 정리
      if (resolveRef.current) settle({ transcript: '', alternatives: [], error: 'no_speech' });
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
      resolveRef.current = null;
    };
  }, [lang]);

  const listen = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return Promise.resolve({ transcript: '', alternatives: [], error: 'unsupported' });
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      try {
        setListening(true);
        recognition.start();
      } catch {
        resolveRef.current = null;
        setListening(false);
        resolve({ transcript: '', alternatives: [], error: 'start_failed' });
      }
    });
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  return { supported, listening, listen, stop };
}
