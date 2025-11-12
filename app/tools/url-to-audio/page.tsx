"use client";
import { useState, useRef } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, FileText, Download, Loader2, Volume2, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { voices as VOICES } from "@/src/data/voices";

const MULTILINGUAL_MODEL = "eleven_multilingual_v2";

export default function URLToAudioPage() {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("IY8nsD2RIP5N4FFQLaT3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "hindi" | "english">("all");
  
  const testAudioRef = useRef<HTMLAudioElement>(null);

  const filteredVoices = filterCategory === "all" 
    ? VOICES 
    : VOICES.filter(v => v.category === filterCategory);

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

      if (!response.ok) throw new Error("Voice test failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (testAudioRef.current) {
        testAudioRef.current.src = url;
        testAudioRef.current.play();
      }
    } catch (err) {
      setError("Voice test failed. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!url && !file) {
      setError("Please provide a URL or upload a file");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const formData = new FormData();
      if (url) formData.append("url", url);
      if (file) formData.append("file", file);
      formData.append("voiceId", selectedVoice);
      formData.append("modelId", MULTILINGUAL_MODEL);

      const response = await fetch("/api/url-to-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl("");
    }
  };

  return (
    <ToolLayout
      toolName="URL/Document to Audio"
      toolDescription="Convert web pages, PDFs, or documents into natural speech"
      toolIcon={<Link className="h-8 w-8 text-white" />}
      category="Audio Tools"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolInput title="Input Source" icon={<FileText className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <Label className="text-white mb-2 block">Enter URL</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value) setFile(null);
                }}
                placeholder="https://example.com/article"
                disabled={!!file || isGenerating}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#130A3B] text-white/50">OR</span>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-white mb-2 block">Upload Document</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx"
                  disabled={!!url || isGenerating}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-white/50 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">
                    {file ? file.name : "Click to upload PDF, TXT, or DOCX"}
                  </p>
                  <p className="text-white/50 text-xs mt-1">Max size: 10MB</p>
                </label>
              </div>
            </div>

            {/* Voice Category Filter */}
            <div>
              <Label className="text-white mb-2 block">Voice Category</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  onClick={() => setFilterCategory("all")}
                  className={`${
                    filterCategory === "all"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-white/5 hover:bg-white/10"
                  } text-white border-0`}
                >
                  All ({VOICES.length})
                </Button>
                <Button
                  type="button"
                  onClick={() => setFilterCategory("hindi")}
                  className={`${
                    filterCategory === "hindi"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-white/5 hover:bg-white/10"
                  } text-white border-0`}
                >
                  हिंदी ({VOICES.filter(v => v.category === "hindi").length})
                </Button>
                <Button
                  type="button"
                  onClick={() => setFilterCategory("english")}
                  className={`${
                    filterCategory === "english"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-white/5 hover:bg-white/10"
                  } text-white border-0`}
                >
                  English ({VOICES.filter(v => v.category === "english").length})
                </Button>
              </div>
            </div>

            {/* Voice Selection with Test Button - SIDE BY SIDE */}
            <div>
              <Label className="text-white mb-2 block">
                Select Voice {selectedVoiceData && `(${selectedVoiceData.category === "hindi" ? "Hindi Native" : "English Native"})`}
              </Label>
              
              <div className="flex gap-2 items-center">
                {/* Dropdown - Takes most space */}
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  {filteredVoices.map((voice) => (
                    <option key={voice.id} value={voice.id} className="bg-gray-900 text-white">
                      {voice.name} - {voice.gender} - {voice.description}
                    </option>
                  ))}
                </select>

                {/* Test Button - Compact, side by side */}
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isTesting}
                  className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Test Voice"
                >
                  {isTesting ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>

              {selectedVoiceData && (
                <p className="text-white/60 text-sm mt-2">
                  {selectedVoiceData.description}
                </p>
              )}

              <audio ref={testAudioRef} className="hidden" />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!url && !file)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
        </ToolInput>

        <ToolOutput title="Generated Audio" icon={<Volume2 className="h-5 w-5 text-green-400" />}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 font-medium">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-300 font-medium">Audio Generated Successfully!</span>
                </div>

                <audio
                  controls
                  src={audioUrl}
                  className="w-full mb-4"
                />

                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <a href={audioUrl} download="url-to-audio.mp3">
                    <Download className="h-5 w-5 mr-2" />
                    Download Audio
                  </a>
                </Button>
              </div>
            )}

            {!audioUrl && !error && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Volume2 className="h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/50">
                  Your generated audio will appear here
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-4" />
                <p className="text-white/70">Extracting text and generating audio...</p>
                <p className="text-white/50 text-sm mt-2">This may take a few moments</p>
              </div>
            )}
          </div>
        </ToolOutput>
      </div>
    </ToolLayout>
  );
}
