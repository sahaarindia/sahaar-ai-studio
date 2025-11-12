"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mic, Download, Play, Pause, ArrowLeft, Sparkles, Loader2, Volume2, AlertCircle, StopCircle } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { voices as VOICES } from "@/src/data/voices";

const MULTILINGUAL_MODEL = "eleven_multilingual_v2";

export default function AudioPodcastPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hostTestAudioRef = useRef<HTMLAudioElement>(null);
  const guestTestAudioRef = useRef<HTMLAudioElement>(null);
  const scriptAbortControllerRef = useRef<AbortController | null>(null);
  const podcastAbortControllerRef = useRef<AbortController | null>(null);
  
  const [script, setScript] = useState("");
  const [lengthInMinutes, setLengthInMinutes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [hostVoiceId, setHostVoiceId] = useState("IY8nsD2RIP5N4FFQLaT3");
  const [guestVoiceId, setGuestVoiceId] = useState("jUjRbhZWoMK4aDciW36V");
  const [filterCategory, setFilterCategory] = useState<"all" | "hindi" | "english">("all");

  const [isTestingHost, setIsTestingHost] = useState(false);
  const [isTestingGuest, setIsTestingGuest] = useState(false);
  const [hostTestUrl, setHostTestUrl] = useState<string | null>(null);
  const [guestTestUrl, setGuestTestUrl] = useState<string | null>(null);

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const filteredVoices = filterCategory === "all" 
    ? VOICES 
    : VOICES.filter(v => v.category === filterCategory);

  useEffect(() => {
    if (filteredVoices.length > 0) {
      const hostVoiceExists = filteredVoices.find(v => v.id === hostVoiceId);
      const guestVoiceExists = filteredVoices.find(v => v.id === guestVoiceId);
      
      if (!hostVoiceExists && filteredVoices[0]) {
        setHostVoiceId(filteredVoices[0].id);
      }
      
      if (!guestVoiceExists && filteredVoices[1]) {
        setGuestVoiceId(filteredVoices[1].id);
      } else if (!guestVoiceExists && filteredVoices[0]) {
        setGuestVoiceId(filteredVoices[0].id);
      }
    }
  }, [filterCategory, filteredVoices, hostVoiceId, guestVoiceId]);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertDialog(true);
  };

  const testVoice = async (voiceId: string, isHost: boolean) => {
    if (isHost) {
      setIsTestingHost(true);
      setHostTestUrl(null);
    } else {
      setIsTestingGuest(true);
      setGuestTestUrl(null);
    }

    const selectedVoice = VOICES.find(v => v.id === voiceId);
    const isHindi = selectedVoice?.category === "hindi";
    const testText = isHindi 
      ? "नमस्ते! यह आवाज़ की जांच है।" 
      : "Hello! This is a voice test.";

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testText,
          voiceId: voiceId,
          modelId: MULTILINGUAL_MODEL
        }),
      });

      if (!response.ok) throw new Error("Failed to test voice");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (isHost) {
        setHostTestUrl(url);
        setTimeout(() => hostTestAudioRef.current?.play(), 100);
      } else {
        setGuestTestUrl(url);
        setTimeout(() => guestTestAudioRef.current?.play(), 100);
      }
    } catch (err: any) {
      console.error("Voice test error:", err);
    } finally {
      if (isHost) setIsTestingHost(false);
      else setIsTestingGuest(false);
    }
  };

  const stopScriptGeneration = () => {
    if (scriptAbortControllerRef.current) {
      scriptAbortControllerRef.current.abort();
      scriptAbortControllerRef.current = null;
    }
    setIsGeneratingScript(false);
    showAlert("Script generation stopped");
  };

  const stopPodcastGeneration = () => {
    if (podcastAbortControllerRef.current) {
      podcastAbortControllerRef.current.abort();
      podcastAbortControllerRef.current = null;
    }
    setIsGenerating(false);
    showAlert("Podcast generation stopped");
  };

  const handleAutoGenerate = () => {
    const trimmedScript = script.trim();
    const trimmedLength = lengthInMinutes.trim();

    // Check if BOTH are empty
    if (!trimmedLength && !trimmedScript) {
      showAlert("कृपया दोनों fields भरें:\n1. Length in Minutes\n2. Script/Topic");
      return;
    }

    // Check length
    if (!trimmedLength) {
      showAlert("कृपया Length in Minutes भरें!");
      return;
    }

    // Validate length
    const minutes = parseInt(trimmedLength);
    if (isNaN(minutes) || minutes <= 0) {
      showAlert("कृपया valid number भरें (1 से ज्यादा)!");
      return;
    }

    if (minutes > 60) {
      showAlert("Maximum 60 minutes allowed!");
      return;
    }

    // Check script/topic
    if (!trimmedScript) {
      showAlert("कृपया Script/Topic भरें!");
      return;
    }

    // If script has substantial content, show confirmation
    if (trimmedScript.length > 100) {
      setShowConfirmDialog(true);
    } else {
      generateWithGPT();
    }
  };

  const handleConfirmDelete = (confirmed: boolean) => {
    setShowConfirmDialog(false);
    
    if (confirmed) {
      // 🛑 STOP any ongoing generation
      if (scriptAbortControllerRef.current) {
        scriptAbortControllerRef.current.abort();
        scriptAbortControllerRef.current = null;
      }
      
      // Stop generation state
      setIsGeneratingScript(false);
      
      // 🔄 REFRESH PAGE
      window.location.reload();
    }
  };

  const convertMinutesToLength = (minutes: number): string => {
    if (minutes <= 1) return "short";
    if (minutes <= 3) return "medium";
    if (minutes <= 5) return "long";
    return "extralong";
  };

  const generateWithGPT = async () => {
    if (isGeneratingScript) {
      console.log("Already generating, skipping...");
      return;
    }

    scriptAbortControllerRef.current = new AbortController();

    setIsGeneratingScript(true);

    try {
      const topic = script.trim() || "";
      const minutes = parseInt(lengthInMinutes);
      
      const lengthCategory = convertMinutesToLength(minutes);
      
      console.log(`Generating script: ${minutes} minutes (${lengthCategory}), topic="${topic}"`);
      
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic,
          length: lengthCategory,
          exactMinutes: minutes
        }),
        signal: scriptAbortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error" }));
        throw new Error(errorData.error || "Failed to generate script");
      }

      const data = await response.json();
      
      if (!data.script) {
        throw new Error("No script returned from API");
      }
      
      setScript(data.script);
      
      console.log(`✓ Script generated successfully for ${minutes} minutes`);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted by user");
        return;
      }
      console.error("GPT generation error:", err);
      showAlert(err.message || "Failed to generate script with GPT");
    } finally {
      setIsGeneratingScript(false);
      scriptAbortControllerRef.current = null;
    }
  };

  const handleGenerate = async () => {
    const trimmedScript = script.trim();
    const trimmedLength = lengthInMinutes.trim();

    // Check if BOTH are empty
    if (!trimmedScript && !trimmedLength) {
      showAlert("कृपया दोनों fields भरें:\n1. Length in Minutes\n2. Script/Topic");
      return;
    }

    // Validate script
    if (!trimmedScript) {
      showAlert("कृपया Script भरें या AI Generate Script का उपयोग करें!");
      return;
    }

    // Validate length
    if (!trimmedLength) {
      showAlert("कृपया Length in Minutes भरें!");
      return;
    }

    const minutes = parseInt(trimmedLength);
    if (isNaN(minutes) || minutes <= 0) {
      showAlert("कृपया valid number भरें!");
      return;
    }

    if (isGenerating) {
      console.log("Already generating podcast, skipping...");
      return;
    }

    podcastAbortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      console.log("Starting podcast generation...");
      
      const response = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          script,
          hostVoiceId,
          guestVoiceId
        }),
        signal: podcastAbortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error" }));
        throw new Error(errorData.error || "Failed to generate podcast");
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error("Empty audio received");
      }
      
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      console.log("✓ Podcast generated successfully");
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Podcast generation aborted by user");
        return;
      }
      console.error("Generation error:", err);
      showAlert(err.message || "Failed to generate podcast");
    } finally {
      setIsGenerating(false);
      podcastAbortControllerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'sahaar-podcast.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const hindiCount = VOICES.filter(v => v.category === "hindi").length;
  const englishCount = VOICES.filter(v => v.category === "english").length;

  return (
    <div className="min-h-screen" style={{ background: '#130A3B' }}>
      {/* Alert Dialog */}
      {showAlertDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-red-900/90 to-orange-900/90 p-8 rounded-2xl border-2 border-red-500/50 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">Alert</h3>
            </div>
            <p className="text-gray-200 mb-6 text-lg whitespace-pre-line">
              {alertMessage}
            </p>
            <Button
              onClick={() => setShowAlertDialog(false)}
              className="w-full bg-white/20 hover:bg-white/30 text-white h-12 text-base font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 p-8 rounded-2xl border-2 border-white/20 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">Confirm Action</h3>
            </div>
            <p className="text-gray-200 mb-6 text-lg">
              Script already exists. Do you want to delete the current script and generate a new one?
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => handleConfirmDelete(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold"
              >
                Yes
              </Button>
              <Button
                onClick={() => handleConfirmDelete(false)}
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30 h-12 text-base font-semibold"
              >
                No, Keep Script
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">Sahaar AI Studio</h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white">Audio Podcast Generator</h1>
              <p className="text-gray-400 text-lg">AI-powered script generation • {VOICES.length} voices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Voice Selection Card */}
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Volume2 className="w-6 h-6" />
                  Voice Selection
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Choose different AI voices for Host and Guest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterCategory("all")}
                    variant="outline"
                    className={`flex-1 h-11 ${
                      filterCategory === "all"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                        : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                    }`}
                  >
                    All ({VOICES.length})
                  </Button>
                  <Button
                    onClick={() => setFilterCategory("hindi")}
                    variant="outline"
                    className={`flex-1 h-11 ${
                      filterCategory === "hindi"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                        : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                    }`}
                  >
                    🇮🇳 Hindi ({hindiCount})
                  </Button>
                  <Button
                    onClick={() => setFilterCategory("english")}
                    variant="outline"
                    className={`flex-1 h-11 ${
                      filterCategory === "english"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                        : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                    }`}
                  >
                    🇬🇧 English ({englishCount})
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-semibold flex items-center gap-2">
                      🎙️ Host Voice
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={hostVoiceId}
                        onChange={(e) => setHostVoiceId(e.target.value)}
                        className="flex-1 h-11 px-3 rounded-md bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{ color: '#fff' }}
                      >
                        {filteredVoices.map((voice) => (
                          <option 
                            key={voice.id} 
                            value={voice.id}
                            style={{ background: '#1a1a2e', color: '#fff' }}
                          >
                            {voice.name} - {voice.gender} - {voice.usage}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => testVoice(hostVoiceId, true)}
                        disabled={isTestingHost}
                        size="icon"
                        className="h-11 w-11 bg-blue-600 hover:bg-blue-700 text-white"
                        title="Test voice"
                      >
                        {isTestingHost ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </div>
                    {hostTestUrl && (
                      <audio ref={hostTestAudioRef} src={hostTestUrl} className="hidden" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-semibold flex items-center gap-2">
                      👤 Guest Voice
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={guestVoiceId}
                        onChange={(e) => setGuestVoiceId(e.target.value)}
                        className="flex-1 h-11 px-3 rounded-md bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{ color: '#fff' }}
                      >
                        {filteredVoices.map((voice) => (
                          <option 
                            key={voice.id} 
                            value={voice.id}
                            style={{ background: '#1a1a2e', color: '#fff' }}
                          >
                            {voice.name} - {voice.gender} - {voice.usage}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => testVoice(guestVoiceId, false)}
                        disabled={isTestingGuest}
                        size="icon"
                        className="h-11 w-11 bg-blue-600 hover:bg-blue-700 text-white"
                        title="Test voice"
                      >
                        {isTestingGuest ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </div>
                    {guestTestUrl && (
                      <audio ref={guestTestAudioRef} src={guestTestUrl} className="hidden" />
                    )}
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    ✓ Showing {filteredVoices.length} voices • 
                    Host: {VOICES.find(v => v.id === hostVoiceId)?.name || 'Not found'} • 
                    Guest: {VOICES.find(v => v.id === guestVoiceId)?.name || 'Not found'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Script Card */}
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6" />
                  AI Podcast Script Generator
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Specify length and topic • GPT generates script
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Length Input - INLINE */}
                <div className="flex items-center gap-3">
                  <label className="text-white font-semibold whitespace-nowrap">
                    ⏱️ Length in Minutes:
                  </label>
                  <Input
                    type="text"
                    placeholder=""
                    value={lengthInMinutes}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setLengthInMinutes(value);
                      }
                    }}
                    className="w-32 h-11 bg-white/5 text-white border-white/20 text-lg text-center focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <Textarea
                  placeholder="Type topic (e.g., Cricket ki popularity)..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[350px] bg-white/5 text-white border-white/20 text-base leading-relaxed"
                />

                <div className="flex gap-3">
                  {isGeneratingScript ? (
                    <Button
                      onClick={stopScriptGeneration}
                      variant="outline"
                      className="flex-1 bg-red-600/20 border-red-500/50 text-white hover:bg-red-600/30 h-11"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop Script Generation
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAutoGenerate}
                      variant="outline"
                      className="flex-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50 text-white hover:bg-green-600/30 h-11"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate Script
                    </Button>
                  )}
                </div>

                {isGenerating ? (
                  <Button
                    onClick={stopPodcastGeneration}
                    variant="outline"
                    className="w-full bg-red-600/20 border-red-500/50 text-white hover:bg-red-600/30 h-14"
                  >
                    <StopCircle className="w-6 h-6 mr-2" />
                    Stop Podcast Generation
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || isGeneratingScript}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 h-14 text-lg font-semibold shadow-lg"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    Generate Podcast
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-6">
                <h3 className="text-white font-bold mb-4 text-lg">📖 How to Use:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>⏱️ <strong>Step 1:</strong> Type length in minutes (required)</li>
                  <li>📝 <strong>Step 2:</strong> Type topic/script (required)</li>
                  <li>🤖 <strong>Step 3:</strong> Click "AI Generate Script"</li>
                  <li>🎙️ <strong>Step 4:</strong> Click "Generate Podcast"</li>
                  <li>🛑 <strong>Stop:</strong> Click stop button anytime</li>
                  <li>⚠️ <strong>Important:</strong> "Yes" will refresh page</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Output */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className={`${audioUrl ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20'} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Volume2 className="w-6 h-6" />
                    Generated Audio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {audioUrl ? (
                    <>
                      <div className="flex items-center justify-center p-8 bg-white/5 rounded-xl">
                        <Button
                          onClick={togglePlay}
                          size="lg"
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl"
                        >
                          {isPlaying ? (
                            <Pause className="w-10 h-10" />
                          ) : (
                            <Play className="w-10 h-10 ml-1" />
                          )}
                        </Button>
                      </div>

                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />

                      <Button 
                        onClick={handleDownload}
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download
                      </Button>

                      <p className="text-center text-green-300 text-sm">
                        ✓ Podcast generated successfully!
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Your generated audio will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
