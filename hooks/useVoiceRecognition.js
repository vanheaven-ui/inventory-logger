// /hooks/useVoiceRecognition.js
import { useState, useEffect, useCallback, useRef } from "react";
import * as Voice from "@react-native-voice/voice";
import { PermissionsAndroid, Platform, Alert } from "react-native";

const useVoiceRecognition = () => {
  const [recognizedText, setRecognizedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null); // Initialize with null for clearer "no error" state
  const [partialResults, setPartialResults] = useState([]);

  const isMounted = useRef(true); // To prevent state updates on unmounted component
  const voiceEngineInitialized = useRef(false); // Track successful init

  // Helper to safely call Voice methods
  const safeCallVoiceMethod = useCallback(async (methodName, ...args) => {
    if (!Voice || typeof Voice[methodName] !== "function") {
      console.warn(
        `Voice module method '${methodName}' is not available or not a function.`
      );
      // Optionally set an internal error related to module availability if this is critical
      // setError(`Voice system error: ${methodName} not available.`);
      return false; // Indicate failure
    }
    try {
      await Voice[methodName](...args);
      return true; // Indicate success
    } catch (e) {
      const errorMessage =
        e?.message || `Failed to execute Voice.${methodName}.`;
      console.error(`Voice.${methodName} Error:`, errorMessage, e);
      // Set a general error, but avoid breaking the app
      if (isMounted.current) {
        setError(`Voice operation failed: ${errorMessage}`);
      }
      return false; // Indicate failure
    }
  }, []);

  // --- Event handlers for Voice library ---
  const onSpeechStart = useCallback(() => {
    if (!isMounted.current) return;
    setIsListening(true);
    setError(null); // Clear previous errors on start
    setRecognizedText("");
    setPartialResults([]);
    console.log("Voice Recognition: Speech started");
  }, []);

  const onSpeechEnd = useCallback(() => {
    if (!isMounted.current) return;
    setIsListening(false);
    console.log("Voice Recognition: Speech ended");
  }, []);

  const onSpeechError = useCallback((e) => {
    if (!isMounted.current) return;
    const errorMessage =
      e?.error?.message || "An unknown voice error occurred.";
    setError(errorMessage);
    setIsListening(false); // Stop listening on error
    console.error("Voice Recognition Error:", errorMessage, e);
  }, []);

  const onSpeechResults = useCallback((e) => {
    if (!isMounted.current) return;
    if (e.value && e.value.length > 0) {
      setRecognizedText(e.value[0]); // Most confident result
      console.log("Voice Recognition: Final result:", e.value[0]);
    }
  }, []);

  const onSpeechPartialResults = useCallback((e) => {
    if (!isMounted.current) return;
    if (e.value && e.value.length > 0) {
      setPartialResults(e.value); // Real-time partial results
    }
  }, []);

  // Function to initialize the Voice engine
  const initializeVoiceEngine = useCallback(async () => {
    if (voiceEngineInitialized.current) {
      console.log("Voice Engine already initialized.");
      return true;
    }

    // Attempt a graceful destroy/cleanup before (re)initializing
    // This is defensive against previous failed states or hot reloads
    await safeCallVoiceMethod("destroy"); // Try to destroy, ignore its specific success/fail
    // Only attempt to remove listeners if the method exists
    if (Voice && typeof Voice.removeAllListeners === "function") {
      Voice.removeAllListeners();
    } else {
      console.warn(
        "Voice.removeAllListeners is not available. This might lead to listener leaks."
      );
    }

    const initSuccess = await safeCallVoiceMethod("init");
    if (initSuccess) {
      voiceEngineInitialized.current = true;
      setError(null); // Clear any previous errors on successful init
      console.log("Voice Engine initialized successfully.");
    } else {
      voiceEngineInitialized.current = false;
      // Error will be set by safeCallVoiceMethod
    }
    return initSuccess;
  }, [safeCallVoiceMethod]);

  // Function to start listening
  const startListening = useCallback(
    async (locale = "en-US") => {
      if (!isMounted.current) return;

      const initSuccess = await initializeVoiceEngine();
      if (!initSuccess) {
        // Error was already set by initializeVoiceEngine or safeCallVoiceMethod
        return;
      }

      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: "Microphone Permission",
              message:
                "The app needs access to your microphone for voice input.",
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
            setError("Microphone permission denied.");
            return;
          }
        } catch (err) {
          console.warn("Microphone Permission Request Error:", err);
          setError("Failed to request microphone permission.");
          return;
        }
      }

      // Reset states before starting
      setError(null);
      setRecognizedText("");
      setPartialResults([]);

      const startSuccess = await safeCallVoiceMethod("start", locale);
      if (startSuccess) {
        setIsListening(true);
        console.log("Voice Recognition: Listening started");
      } else {
        // Error was already set by safeCallVoiceMethod
        setIsListening(false);
        // Aggressive cleanup on start failure
        await safeCallVoiceMethod("destroy");
        if (Voice && typeof Voice.removeAllListeners === "function") {
          Voice.removeAllListeners();
        }
        voiceEngineInitialized.current = false;
      }
    },
    [initializeVoiceEngine, safeCallVoiceMethod]
  );

  const stopListening = useCallback(async () => {
    if (!isMounted.current) return;
    if (!isListening) {
      console.log("Voice Recognition: Not listening, no need to stop.");
      setError(null); // Clear error if trying to stop already stopped
      return;
    }

    const stopSuccess = await safeCallVoiceMethod("stop");
    if (stopSuccess) {
      setIsListening(false);
      setError(null); // Clear error on successful stop
      console.log("Voice Recognition: Listening stopped");
    } else {
      // Error was already set by safeCallVoiceMethod
      setIsListening(false); // Force state even if stop fails
      // Aggressive cleanup on stop error
      await safeCallVoiceMethod("destroy");
      if (Voice && typeof Voice.removeAllListeners === "function") {
        Voice.removeAllListeners();
      }
      voiceEngineInitialized.current = false;
    }
  }, [isListening, safeCallVoiceMethod]);

  const cancelListening = useCallback(async () => {
    if (!isMounted.current) return;
    if (!isListening) {
      console.log("Voice Recognition: Not listening, no need to cancel.");
      setError(null); // Clear error if trying to cancel already stopped
      return;
    }

    const cancelSuccess = await safeCallVoiceMethod("cancel");
    if (cancelSuccess) {
      setIsListening(false);
      setRecognizedText("");
      setPartialResults([]);
      setError(null); // Clear error on successful cancel
      console.log("Voice Recognition: Listening cancelled");
    } else {
      // Error was already set by safeCallVoiceMethod
      setIsListening(false); // Force state even if cancel fails
      // Aggressive cleanup on cancel error
      await safeCallVoiceMethod("destroy");
      if (Voice && typeof Voice.removeAllListeners === "function") {
        Voice.removeAllListeners();
      }
      voiceEngineInitialized.current = false;
    }
  }, [isListening, safeCallVoiceMethod]);

  // Main Effect for setting up and tearing down listeners
  useEffect(() => {
    isMounted.current = true;

    // Initial setup for event listeners.
    // We assume Voice is available at this point due to module import.
    // However, if the underlying native bridge isn't ready or if there's a serious
    // issue with the Voice import itself, these assignments could potentially fail
    // silently or lead to issues if Voice is not the expected object.
    // This is generally how react-native native modules are consumed.
    if (Voice) {
      // Defensive check for the Voice import itself
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
    } else {
      console.error(
        "Voice module is not available at useEffect setup. Voice recognition will not work."
      );
      if (isMounted.current) {
        setError(
          "Voice recognition module not loaded. Please restart the app."
        );
      }
    }

    // Ensure the engine is initialized only once on mount
    if (!voiceEngineInitialized.current) {
      initializeVoiceEngine();
    }

    return () => {
      isMounted.current = false; // Mark as unmounted

      // Cleanup on unmount. Be EXTREMELY defensive here.
      // Use safeCallVoiceMethod for destroy.
      // Explicitly check for removeAllListeners.
      console.log("useVoiceRecognition: Running cleanup...");

      // Attempt to destroy the engine
      safeCallVoiceMethod("destroy")
        .then(() => {
          // Then attempt to remove listeners IF the method exists
          if (Voice && typeof Voice.removeAllListeners === "function") {
            console.log("Voice.removeAllListeners called during cleanup.");
            Voice.removeAllListeners();
          } else {
            console.warn(
              "Voice.removeAllListeners is not available during cleanup, cannot remove listeners."
            );
          }
        })
        .catch((e) => {
          console.error(
            "useVoiceRecognition: Error during Voice.destroy in cleanup:",
            e
          );
        })
        .finally(() => {
          voiceEngineInitialized.current = false; // Always reset init status
          setIsListening(false); // Force state to false
        });
    };
  }, [
    onSpeechStart,
    onSpeechEnd,
    onSpeechError,
    onSpeechResults,
    onSpeechPartialResults,
    initializeVoiceEngine,
    safeCallVoiceMethod, // Add safeCallVoiceMethod as a dependency
  ]);

  const resetVoiceRecognition = useCallback(() => {
    setRecognizedText("");
    setPartialResults([]);
    setIsListening(false);
    setError(null);
    // Do NOT call destroy here, rely on unmount or explicit re-init by startListening
  }, []);

  return {
    recognizedText,
    partialResults,
    isListening,
    error,
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText,
    resetVoiceRecognition,
  };
};

export default useVoiceRecognition;
