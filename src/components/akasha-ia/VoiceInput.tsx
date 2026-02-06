import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Square } from "lucide-react";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Visual feedback loop
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      updateLevel();
      
      toast.info("Grabando... Habla claramente");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // For now, we'll use the Web Speech API for transcription
      // In production, you'd use a service like ElevenLabs, Whisper, etc.
      
      // Create a simple browser-based transcription using SpeechRecognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Note: This is a fallback. Real implementation would use ElevenLabs or similar
        toast.info("Procesando audio...");
        
        // For demo purposes, we'll prompt the user to type what they said
        // In production, integrate with ElevenLabs STT or similar
        const text = prompt("La transcripción automática está en desarrollo. Por ahora, escribe lo que dijiste:");
        
        if (text) {
          onTranscription(text);
          
          // Save transcription record
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.functions.invoke("akasha-ia-multimodal", {
              body: {
                action: "transcribe_voice",
                data: {
                  transcription: text,
                  language: "es",
                  duration: audioBlob.size / 16000 // Rough estimate
                }
              }
            });
          }
        }
      } else {
        toast.error("Tu navegador no soporta reconocimiento de voz");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Error al procesar el audio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        disabled={disabled || isProcessing}
        onClick={isRecording ? stopRecording : startRecording}
        className="relative"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="h-4 w-4" />
            {/* Audio level indicator */}
            <span 
              className="absolute inset-0 rounded-md border-2 border-destructive animate-pulse"
              style={{ 
                opacity: audioLevel,
                transform: `scale(${1 + audioLevel * 0.2})`
              }}
            />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isRecording && (
        <span className="text-xs text-destructive animate-pulse">
          Grabando...
        </span>
      )}
    </div>
  );
}
