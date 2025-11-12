"use client";
import { useState, useRef } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Link, Upload, Loader2, Download, Sparkles, X, Plus, CheckCircle, AlertCircle, Clock, Volume2, FileDown, Youtube, StopCircle, Play } from "lucide-react";
import { voices as VOICES } from "@/src/data/voices";

interface Source {
  id: string;
  type: 'url' | 'youtube' | 'file' | 'text';
  name: string;
  content?: string;
  file?: File;
}

export default function AISummarizerPage() {
  const { t } = useLanguage();
  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [summary, setSummary] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetWords, setTargetWords] = useState(500);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [filterCategory, setFilterCategory] = useState<"all" | "hindi" | "english">("all");

  const audioRef = useRef<HTMLAudioElement>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioAbortControllerRef = useRef<AbortController | null>(null);

  const filteredVoices = filterCategory === "all" 
    ? VOICES 
    : VOICES.filter(v => v.category === filterCategory);

  const selectedVoiceData = VOICES.find(v => v.id === selectedVoice);
  const estimatedMinutes = (targetWords / 150).toFixed(1);

  const addUrlSource = () => {
    if (!urlInput.trim() || sources.length >= 10) return;
    
    try {
      new URL(urlInput);
      setSources([...sources, {
        id: Date.now().toString(),
        type: 'url',
        name: urlInput,
        content: urlInput,
      }]);
      setUrlInput("");
      setError(null);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  const addYoutubeSource = () => {
    if (!youtubeInput.trim() || sources.length >= 10) return;
    
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (!youtubeRegex.test(youtubeInput)) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    
    setSources([...sources, {
      id: Date.now().toString(),
      type: 'youtube',
      name: youtubeInput,
      content: youtubeInput,
    }]);
    setYoutubeInput("");
    setError(null);
  };

  const addTextSource = () => {
    if (!textInput.trim() || sources.length >= 10) return;
    
    setSources([...sources, {
      id: Date.now().toString(),
      type: 'text',
      name: `Text Input ${sources.filter(s => s.type === 'text').length + 1}`,
      content: textInput,
    }]);
    setTextInput("");
    setError(null);
  };

  const addFileSource = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (sources.length + files.length > 10) {
      setError("Maximum 10 sources allowed");
      return;
    }
    
    const newSources: Source[] = files.map(file => ({
      id: Date.now().toString() + file.name,
      type: 'file',
      name: file.name,
      file: file,
    }));
    
    setSources([...sources, ...newSources]);
    e.target.value = '';
    setError(null);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setError(null);
    
    try {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current.currentTime = 0;
      }

      const voiceData = VOICES.find(v => v.id === selectedVoice);
      const testText = voiceData?.category === 'hindi' 
        ? "नमस्ते, यह आवाज़ परीक्षण है। यह आवाज़ कैसी लग रही है?"
        : "Hello, this is a voice test. How does this voice sound?";

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: selectedVoice,
          modelId: 'eleven_multilingual_v2',
        }),
      });

      if (!response.ok) throw new Error('Failed to test voice');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (testAudioRef.current) {
        testAudioRef.current.src = url;
        testAudioRef.current.play();
      }
      
    } catch (err) {
      setError('Failed to test voice');
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleStopSummary = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setError("Summary generation cancelled");
  };

  const handleGenerateSummary = async () => {
    if (sources.length === 0) {
      setError("Please add at least one source");
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    setError(null);
    setSummary("");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      
      sources.forEach((source, index) => {
        if (source.type === 'url') {
          formData.append(`url_${index}`, source.content || '');
        } else if (source.type === 'youtube') {
          formData.append(`youtube_${index}`, source.content || '');
        } else if (source.type === 'text') {
          formData.append(`text_${index}`, source.content || '');
        } else if (source.type === 'file' && source.file) {
          formData.append(`file_${index}`, source.file);
        }
      });
      
      formData.append('targetWords', targetWords.toString());

      const response = await fetch('/api/ai-summarizer', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Summary generation cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopAudio = () => {
    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
      audioAbortControllerRef.current = null;
    }
    setIsGeneratingAudio(false);
    setError("Audio generation cancelled");
  };

  const handleConvertToAudio = async () => {
    if (!summary) return;

    audioAbortControllerRef.current = new AbortController();
    setIsGeneratingAudio(true);
    setError(null);

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summary,
          voiceId: selectedVoice,
          modelId: 'eleven_multilingual_v2',
        }),
        signal: audioAbortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to generate audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Audio generation cancelled');
      } else {
        setError('Failed to convert summary to audio');
      }
    } finally {
      setIsGeneratingAudio(false);
      audioAbortControllerRef.current = null;
    }
  };

  const downloadAsTxt = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AI Summary</title>
            <style>
              @page { margin: 2cm; }
              body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                padding: 40px; 
                line-height: 1.8; 
                max-width: 800px; 
                margin: 0 auto;
                color: #333;
              }
              h1 { 
                color: #4f46e5; 
                border-bottom: 3px solid #4f46e5; 
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .meta { 
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                color: #666; 
                font-size: 14px;
              }
              .meta strong { color: #333; }
              .summary {
                white-space: pre-wrap;
                line-height: 1.8;
                text-align: justify;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 12px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <h1>🤖 AI Generated Summary</h1>
            <div class="meta">
              <div><strong>📊 Word Count:</strong> ${summary.split(' ').length} words</div>
              <div><strong>🕐 Estimated Reading Time:</strong> ~${Math.ceil(summary.split(' ').length / 200)} minutes</div>
              <div><strong>📅 Generated:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>📝 Sources:</strong> ${sources.length} source(s)</div>
            </div>
            <div class="summary">${summary}</div>
            <div class="footer">
              Generated by Sahaar AI Studio | AI-powered summarization tool
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const getSourceIcon = (type: string) => {
    switch(type) {
      case 'url': return <Link className="h-4 w-4 text-blue-400" />;
      case 'youtube': return <Youtube className="h-4 w-4 text-red-400" />;
      case 'file': return <FileText className="h-4 w-4 text-green-400" />;
      case 'text': return <FileText className="h-4 w-4 text-yellow-400" />;
      default: return <FileText className="h-4 w-4 text-white" />;
    }
  };

  return (
    <ToolLayout
      toolName="AI Summarizer"
      toolDescription="Combine multiple sources and generate intelligent AI summaries"
      toolIcon={<Sparkles className="h-8 w-8 text-white" />}
      category="Text & Content Tools"
    >
      <audio ref={testAudioRef} className="hidden" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolInput title="Add Sources (Max 10)" icon={<FileText className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-4">
            {/* Website URL Input */}
            <div>
              <Label className="text-white mb-2 block">🌐 Website URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && addUrlSource()}
                  disabled={sources.length >= 10}
                />
                <Button
                  onClick={addUrlSource}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!urlInput.trim() || sources.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* YouTube URL Input */}
            <div>
              <Label className="text-white mb-2 block">🎥 YouTube Video</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && addYoutubeSource()}
                  disabled={sources.length >= 10}
                />
                <Button
                  onClick={addYoutubeSource}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!youtubeInput.trim() || sources.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/50 text-xs mt-1">Video must have captions/subtitles</p>
            </div>

            {/* Text Input */}
            <div>
              <Label className="text-white mb-2 block">📝 Paste Text</Label>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your text here... (Max 10,000 characters)"
                maxLength={10000}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                disabled={sources.length >= 10}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-white/50 text-xs">{textInput.length}/10,000 chars</span>
                <Button
                  onClick={addTextSource}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled={!textInput.trim() || sources.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-white mb-2 block">📄 Upload Documents</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/40 transition-colors">
                <Input
                  type="file"
                  onChange={addFileSource}
                  accept=".pdf,.txt,.doc,.docx"
                  multiple
                  className="hidden"
                  id="file-upload-multi"
                  disabled={sources.length >= 10}
                />
                <label htmlFor="file-upload-multi" className={sources.length >= 10 ? "cursor-not-allowed" : "cursor-pointer"}>
                  <Upload className="h-6 w-6 text-white/50 mx-auto mb-1" />
                  <p className="text-white/70 text-sm">PDF, DOCX, TXT (Max 10MB each)</p>
                </label>
              </div>
            </div>

            {/* Sources List */}
            {sources.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Added Sources</Label>
                  <span className="text-white/60 text-sm">{sources.length}/10</span>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getSourceIcon(source.type)}
                        <span className="text-white text-sm truncate">{source.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSource(source.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 my-4"></div>

            {/* Input Box 1: Target Word Count */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-semibold">📝 Summary Length</Label>
                <div className="flex items-center gap-2 bg-purple-600/30 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3 text-purple-300" />
                  <span className="text-purple-200 text-xs font-medium">~{estimatedMinutes} min audio</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <Input
                  type="number"
                  value={targetWords}
                  onChange={(e) => setTargetWords(Math.max(100, Math.min(2000, parseInt(e.target.value) || 500)))}
                  min={100}
                  max={2000}
                  step={50}
                  className="w-32 bg-white/10 border-white/20 text-white text-center font-bold text-lg"
                />
                <span className="text-white font-medium">words</span>
              </div>

              <input
                type="range"
                value={targetWords}
                onChange={(e) => setTargetWords(parseInt(e.target.value))}
                min={100}
                max={2000}
                step={50}
                className="w-full accent-purple-600 h-2 rounded-lg"
              />
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { value: 250, label: 'Brief' },
                  { value: 500, label: 'Standard' },
                  { value: 1000, label: 'Detailed' }
                ].map(preset => (
                  <Button
                    key={preset.value}
                    type="button"
                    onClick={() => setTargetWords(preset.value)}
                    size="sm"
                    className={`${
                      targetWords === preset.value 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-white/5 hover:bg-white/10'
                    } text-white text-xs`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Box 2: Voice Selection with Test Button */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-white/10">
              <Label className="text-white font-semibold mb-3 block">🎤 Voice for Audio</Label>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'hindi', label: 'हिंदी' },
                  { key: 'english', label: 'English' }
                ].map(cat => (
                  <Button
                    key={cat.key}
                    type="button"
                    onClick={() => setFilterCategory(cat.key as any)}
                    size="sm"
                    className={`${
                      filterCategory === cat.key
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-white/5 hover:bg-white/10"
                    } text-white text-xs`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Voice Dropdown with Test Button */}
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  style={{ 
                    color: '#e5e7eb',
                    fontWeight: '400'
                  }}
                >
                  {filteredVoices.map((voice) => (
                    <option 
                      key={voice.id} 
                      value={voice.id} 
                      className="bg-gray-900"
                      style={{ 
                        color: '#e5e7eb',
                        fontWeight: '400'
                      }}
                    >
                      {voice.name} - {voice.gender}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={handleTestVoice}
                  disabled={isTestingVoice}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 flex-shrink-0"
                  title="Test Voice"
                >
                  {isTestingVoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {selectedVoiceData && (
                <p className="text-white/60 text-xs">
                  {selectedVoiceData.description}
                </p>
              )}
            </div>

            {/* Generate/Stop Summary Button */}
            {!isProcessing ? (
              <Button
                onClick={handleGenerateSummary}
                disabled={sources.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Summary
              </Button>
            ) : (
              <Button
                onClick={handleStopSummary}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-6 text-lg shadow-lg"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                Stop Summary
              </Button>
            )}
          </div>
        </ToolInput>

        <ToolOutput title="Generated Summary" icon={<Sparkles className="h-5 w-5 text-green-400" />}>
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

            {summary && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-300 font-medium">Summary Generated!</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <span>{summary.split(' ').length} words</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>~{(summary.split(' ').length / 150).toFixed(1)} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 max-h-[300px] overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-white/20">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{summary}</p>
                  </div>

                  {/* Convert/Stop Audio Button */}
                  {!isGeneratingAudio ? (
                    <Button
                      onClick={handleConvertToAudio}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 mb-3 shadow-lg"
                    >
                      <Volume2 className="h-5 w-5 mr-2" />
                      Convert to Audio
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopAudio}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-4 mb-3 shadow-lg"
                    >
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop Audio
                    </Button>
                  )}

                  {/* Download TXT/PDF Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={downloadAsTxt}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download TXT
                    </Button>
                    <Button
                      onClick={downloadAsPdf}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                {audioUrl && (
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-300 font-medium">Audio Generated!</span>
                    </div>

                    <audio
                      ref={audioRef}
                      controls
                      src={audioUrl}
                      className="w-full mb-4"
                    />

                    <Button
                      asChild
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <a href={audioUrl} download="summary-audio.mp3">
                        <Download className="h-5 w-5 mr-2" />
                        Download Audio
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!summary && !error && !isProcessing && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/50 text-lg mb-2">
                  Ready to summarize
                </p>
                <div className="mt-4 text-white/40 text-sm space-y-1">
                  <p>✓ Add URLs, YouTube videos, files, or text</p>
                  <p>✓ Set target word count (100-2000)</p>
                  <p>✓ Choose voice and test it</p>
                  <p>✓ Generate summary and download</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Loader2 className="h-16 w-16 text-purple-400 animate-spin mb-4" />
                <p className="text-white/70 text-lg">Processing {sources.length} source(s)...</p>
                <p className="text-white/50 text-sm mt-2">Generating {targetWords}-word summary</p>
                <div className="mt-4 text-white/40 text-xs">
                  <p>⏳ This may take 10-30 seconds</p>
                  <p>🤖 AI is analyzing and summarizing...</p>
                </div>
              </div>
            )}
          </div>
        </ToolOutput>
      </div>
    </ToolLayout>
  );
}
