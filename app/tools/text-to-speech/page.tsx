"use client";
import { useState } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mic, Download, Play, Loader2, Volume2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { voices as VOICES } from "@/src/data/voices";
const MULTILINGUAL_MODEL = "eleven_multilingual_v2";


export default function TextToSpeechPage() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("IY8nsD2RIP5N4FFQLaT3"); // Default: Arvinda (Hindi)
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "hindi" | "english">("all");

  const filteredVoices = filterCategory === "all" 
    ? VOICES 
    : VOICES.filter(v => v.category === filterCategory);

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const FREE_LIMIT = 150;
  const isOverLimit = wordCount > FREE_LIMIT;

  const selectedVoiceData = VOICES.find(v => v.id === selectedVoice);
  const isHindiVoice = selectedVoiceData?.category === "hindi";

  const handleTestVoice = async () => {
    setIsTesting(true);
    setError(null);
    const testText = isHindiVoice 
      ? "नमस्ते! यह आवाज़ की जांच है। मैं सहार एआई स्टूडियो हूं।" 
      : "Hello! This is a voice test from Sahaar AI Studio.";
    
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: testText, 
          voiceId: selectedVoice,
          modelId: MULTILINGUAL_MODEL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to test voice");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Test voice error:", err);
      setError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert("Please enter some text");
      return;
    }

    if (isOverLimit) {
      alert(`Free limit is ${FREE_LIMIT} words. Your text has ${wordCount} words.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          voiceId: selectedVoice,
          modelId: MULTILINGUAL_MODEL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "speech.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hindiCount = VOICES.filter(v => v.category === "hindi").length;
  const englishCount = VOICES.filter(v => v.category === "english").length;

  return (
    <ToolLayout
      toolName={t("textToSpeech")}
      toolDescription={t("textToSpeechDesc")}
      toolIcon={<Mic className="h-8 w-8 text-white" />}
      category={t("audioTool")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolInput title={t("inputText")} icon={<Mic className="h-5 w-5" />}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text" className="text-white mb-2 block">
                Enter Text (English / हिंदी)
              </Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your text in English or Hindi... / अपना टेक्स्ट अंग्रेज़ी या हिंदी में लिखें..."
                className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
              <p className={`text-sm mt-2 ${isOverLimit ? 'text-red-400' : 'text-white/60'}`}>
                {wordCount} words {isOverLimit && `(Limit: ${FREE_LIMIT} words for free)`}
              </p>
            </div>

            <div>
              <Label className="text-white mb-2 block">
                Voice Category
              </Label>
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={() => setFilterCategory("all")}
                  size="sm"
                  variant={filterCategory === "all" ? "default" : "outline"}
                  className={filterCategory === "all" ? "bg-purple-600" : "bg-white/5 text-white border-white/20"}
                >
                  All ({VOICES.length})
                </Button>
                <Button
                  onClick={() => setFilterCategory("hindi")}
                  size="sm"
                  variant={filterCategory === "hindi" ? "default" : "outline"}
                  className={filterCategory === "hindi" ? "bg-purple-600" : "bg-white/5 text-white border-white/20"}
                >
                  🇮🇳 Hindi ({hindiCount})
                </Button>
                <Button
                  onClick={() => setFilterCategory("english")}
                  size="sm"
                  variant={filterCategory === "english" ? "default" : "outline"}
                  className={filterCategory === "english" ? "bg-purple-600" : "bg-white/5 text-white border-white/20"}
                >
                  English ({englishCount})
                </Button>
              </div>

              <Label htmlFor="voice" className="text-white mb-2 block">
                Select Voice {isHindiVoice && <span className="text-green-400 text-xs">🇮🇳 (Hindi Native)</span>}
              </Label>
              <div className="flex gap-2">
                <select
                  id="voice"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/20 text-white rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ color: '#fff' }}
                >
                  {filteredVoices.map((voice) => (
                    <option 
                      key={voice.id} 
                      value={voice.id}
                      style={{ background: '#1a1a2e', color: '#fff' }}
                    >
                      {voice.name} - {voice.gender} - {voice.usage} - {voice.country}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={handleTestVoice}
                  disabled={isTesting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  title="Test this voice"
                >
                  {isTesting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-300 flex-shrink-0 mt-0.5" />
                <p className="text-green-300 text-xs">
                  ✅ {isHindiVoice ? "🇮🇳 Hindi Native Voice Selected!" : `Professional ${selectedVoiceData?.name} voice`} - {VOICES.length} total voices
                </p>
              </div>
            </div>
          </div>
        </ToolInput>

        <ToolOutput title="Generated Audio" icon={<Play className="h-5 w-5" />}>
          {audioUrl ? (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/20 rounded-lg p-6">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const audio = document.querySelector('audio');
                    if (audio) audio.play();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  Audio generated successfully!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mic className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">
                Your generated audio will appear here
              </p>
            </div>
          )}
        </ToolOutput>
      </div>

      <div className="mt-8 bg-white/5 border border-white/20 rounded-lg p-6">
        <h3 className="text-white font-semibold text-lg mb-3">How to use:</h3>
        <ol className="text-white/70 space-y-2 list-decimal list-inside">
          <li>Enter your text in English or Hindi (हिंदी)</li>
          <li>Filter by Hindi 🇮🇳 or English voices</li>
          <li>Select a voice and click the speaker icon to test it</li>
          <li>Click "Generate Audio" to create your audio file</li>
          <li>Play or download your MP3 file</li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/60 text-sm">
            <strong className="text-white">🇮🇳 Hindi Voices:</strong> {hindiCount} native Indian voices (Arvinda, Ranbir, Anika, Tripti, Gaurav, Abhi)
            <br />
            <strong className="text-white">English Voices:</strong> {englishCount} professional voices
            <br />
            <strong className="text-white">Model:</strong> {MULTILINGUAL_MODEL}
            <br />
            <strong className="text-white">Total:</strong> {VOICES.length} voices available
            <br />
            <strong className="text-white">Free Limit:</strong> 150 words per generation
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
