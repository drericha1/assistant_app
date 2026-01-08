import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer, decodeAudioData } from "../utils/audioUtils";
import { toolsDef, executeTool } from "./tools";

interface LiveManagerConfig {
  apiKey: string;
  onAudioData: (volume: number) => void;
  // Updated callback: text, isUser, isFinal (turn complete)
  onTranscript: (text: string, isUser: boolean, isFinal: boolean) => void; 
  onToolCall: (name: string, args: any) => void;
  systemInstruction?: string;
  toolContext: {
    setBackground: (c: string) => void;
    searchHistory: (q: string) => string;
  };
}

export class LiveManager {
  private client: GoogleGenAI;
  private config: LiveManagerConfig;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private isConnected = false;

  // Text accumulation
  private currentInputTranscript = '';
  private currentOutputTranscript = '';

  constructor(config: LiveManagerConfig) {
    this.config = config;
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async connect() {
    if (this.isConnected) return;

    try {
      // 1. Initialize Audio Contexts
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 2. Ensure Contexts are Running
      if (this.inputContext.state === 'suspended') {
        await this.inputContext.resume();
      }
      if (this.outputContext.state === 'suspended') {
        await this.outputContext.resume();
      }

      // 3. Get User Media
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 4. Connect to Gemini Live
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: toolsDef }],
          systemInstruction: this.config.systemInstruction || "You are a helpful AI assistant.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            this.isConnected = true;
            this.startAudioInput(sessionPromise);
          },
          onmessage: (msg: LiveServerMessage) => this.handleMessage(msg, sessionPromise),
          onclose: () => {
            console.log("Gemini Live Closed");
            this.isConnected = false;
            this.stop();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
          }
        }
      });
      
      sessionPromise.catch(err => {
          console.error("Session connection failed:", err);
          this.stop();
      });

    } catch (error) {
      console.error("Failed to initialize LiveManager:", error);
      this.stop();
      throw error;
    }
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputContext || !this.stream) return;

    this.source = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate RMS for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      
      // Provide volume feedback - if we're not connected, we still show the mic is working
      this.config.onAudioData(rms);

      if (!this.isConnected) return;
      
      const pcm16 = floatTo16BitPCM(inputData);
      const base64 = arrayBufferToBase64(pcm16);

      sessionPromise.then(session => {
        session.sendRealtimeInput({
            media: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64
            },
        });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    // 1. Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputContext) {
        // Visual feedback for model speaking - we use a slightly randomized high value to simulate speech
        this.config.onAudioData(0.3 + Math.random() * 0.4); 
        
        try {
            const arrayBuffer = base64ToArrayBuffer(audioData);
            const audioBuffer = await decodeAudioData(arrayBuffer, this.outputContext, 24000);
            
            const source = this.outputContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputContext.destination);
            
            const now = this.outputContext.currentTime;
            this.nextStartTime = Math.max(this.nextStartTime, now);
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;

            // When audio ends, reset volume feedback if no more is queued
            source.onended = () => {
              if (this.outputContext && this.outputContext.currentTime >= this.nextStartTime - 0.1) {
                this.config.onAudioData(0);
              }
            };
        } catch (e) {
            console.error("Error decoding/playing audio:", e);
        }
    }

    // 2. Transcriptions
    if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        if (text) {
            this.currentInputTranscript += text;
            this.config.onTranscript(this.currentInputTranscript, true, false);
        }
    }

    if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        if (text) {
            this.currentOutputTranscript += text;
            this.config.onTranscript(this.currentOutputTranscript, false, false);
        }
    }

    if (message.serverContent?.turnComplete) {
        if (this.currentOutputTranscript) {
             this.config.onTranscript(this.currentOutputTranscript, false, true);
             this.currentOutputTranscript = '';
        } else {
             this.config.onTranscript("", false, true);
        }

        if (this.currentInputTranscript) {
             this.config.onTranscript(this.currentInputTranscript, true, true);
             this.currentInputTranscript = '';
        }
    }

    // 3. Tool Calls
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        this.config.onToolCall(fc.name, fc.args);
        try {
            const result = await executeTool(fc.name, fc.args, this.config.toolContext);
            sessionPromise.then(session => {
                session.sendToolResponse({
                    functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result }
                    }
                });
            });
        } catch (e) {
            console.error("Tool execution error", e);
        }
      }
    }
  }

  async stop() {
    this.isConnected = false;
    this.currentInputTranscript = '';
    this.currentOutputTranscript = '';
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    
    if (this.inputContext && this.inputContext.state !== 'closed') {
      await this.inputContext.close();
      this.inputContext = null;
    }
    if (this.outputContext && this.outputContext.state !== 'closed') {
      await this.outputContext.close();
      this.outputContext = null;
    }
  }
}