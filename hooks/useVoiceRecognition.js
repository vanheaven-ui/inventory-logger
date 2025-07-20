// /hooks/useVoiceRecognition.js
import { useState, useEffect, useCallback } from "react";
import * as Voice from '@react-native-voice/voice';
import { PermissionsAndroid, Platform, Alert } from "react-native";

const useVoiceRecognition = () => {
  const [recognizedText, setRecognizedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [partialResults, setPartialResults] = useState([]);

  // Event handlers for Voice library
  const onSpeechStart = useCallback(() => {
    setIsListening(true);
    setError("");
    setRecognizedText("");
    setPartialResults([]);
    console.log("Voice Recognition: Speech started");
  }, []);

  const onSpeechEnd = useCallback(() => {
    setIsListening(false);
    console.log("Voice Recognition: Speech ended");
  }, []);

  const onSpeechError = useCallback((e) => {
    setError(e.error.message);
    setIsListening(false);
    console.error("Voice Recognition Error:", e.error.message);
  }, []);

  const onSpeechResults = useCallback((e) => {
    if (e.value && e.value.length > 0) {
      setRecognizedText(e.value[0]); // Most confident result
      console.log("Voice Recognition: Final result:", e.value[0]);
    }
  }, []);

  const onSpeechPartialResults = useCallback((e) => {
    if (e.value && e.value.length > 0) {
      setPartialResults(e.value); // Real-time partial results
    }
  }, []);

  // Function to start listening
  const startListening = useCallback(async (locale = "en-US") => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "Your app needs access to your microphone for voice input.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Denied",
            "Microphone permission is required for voice input."
          );
          return;
        }
      } catch (err) {
        console.warn(err);
        setError("Failed to request microphone permission.");
        return;
      }
    }

    // Initialize Voice engine first
    await Voice.init();
    
    setError("");
    setRecognizedText("");
    setPartialResults([]);
    
    try {
      await Voice.start(locale);
      setIsListening(true);
      console.log("Voice Recognition: Listening started");
    } catch (e) {
      console.error("Voice Recognition Start Error:", e);
      setError("Failed to start voice recognition.");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      console.log("Voice Recognition: Listening stopped");
    } catch (e) {
      console.error("Voice Recognition Stop Error:", e);
      setError("Failed to stop voice recognition.");
      setIsListening(false);
    }
  }, []);

  const cancelListening = useCallback(async () => {
    try {
      await Voice.cancel();
      setIsListening(false);
      setRecognizedText("");
      setPartialResults([]);
      console.log("Voice Recognition: Listening cancelled");
    } catch (e) {
      console.error("Voice Recognition Cancel Error:", e);
      setError("Failed to cancel voice recognition.");
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    // Initialize Voice engine on mount
    let isMounted = true;

    const initializeVoiceEngine = async () => {
      try {
        await Voice.init();
        console.log("Voice Engine initialized successfully");
      } catch (error) {
        console.error("Error initializing Voice Engine:", error);
        if (isMounted) {
          setError("Failed to initialize voice recognition engine.");
        }
      }
    };

    initializeVoiceEngine();

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      isMounted = false;
      Voice.destroy().then(Voice.removeAllListeners);
      setIsListening(false);
    };
  }, [
    onSpeechStart,
    onSpeechEnd,
    onSpeechError,
    onSpeechResults,
    onSpeechPartialResults,
  ]);

  return {
    recognizedText,
    partialResults,
    isListening,
    error,
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText,
  };
};

export default useVoiceRecognition;
