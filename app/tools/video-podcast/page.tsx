"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Video, Download, Play, Pause, Film, ArrowLeft, Sparkles } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function VideoPodcastPage() {
  const router = useRouter();
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async () => {
    if (!script.trim()) {
      alert("Please enter your video podcast script!");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setVideoUrl("https://example.com/sample-video.mp4");
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen" style={{ background: '#130A3B' }}>
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
      <div className="container mx-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Text to Talking Video Podcast</h1>
                <p className="text-gray-400">Generate video podcasts with AI avatars</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Video Script</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your script - AI avatar will speak it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Welcome to our channel! Today we're discussing...&#10;&#10;In this video, I'll cover three main topics...&#10;&#10;First, let's talk about..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[400px] bg-white/5 text-white border-white/20"
                />
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  {isGenerating ? (
                    <>
                      <Film className="w-4 h-4 mr-2 animate-pulse" />
                      Creating Video...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Generate Video Podcast
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Generated Video</CardTitle>
                <CardDescription className="text-gray-300">
                  Your video podcast will appear here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoUrl ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          size="lg"
                        >
                          {isPlaying ? (
                            <Pause className="w-8 h-8" />
                          ) : (
                            <Play className="w-8 h-8" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download Video (MP4)
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video border-2 border-dashed border-white/20 rounded-lg">
                    <div className="text-center">
                      <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60">No video generated yet</p>
                      <p className="text-white/40 text-sm">Enter script and click Generate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <h3 className="text-white font-semibold mb-2">🎭 AI Avatars</h3>
                <p className="text-gray-400 text-sm">Realistic AI avatars with lip sync</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <h3 className="text-white font-semibold mb-2">🎬 Professional</h3>
                <p className="text-gray-400 text-sm">Studio quality video output</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <h3 className="text-white font-semibold mb-2">⚡ Fast Generation</h3>
                <p className="text-gray-400 text-sm">Quick video creation from text</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
