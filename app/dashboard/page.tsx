"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mic, Image, Video, Smile, FileText, LogOut, CreditCard, Zap, TrendingUp } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#130A3B'}}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleToolClick = (toolName: string) => {
    const slug = toolName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/tools/${slug}`);
  };

  const tools = [
    {
      category: t("audioTools") || "Audio Tools",
      icon: Mic,
      color: "from-purple-500 to-pink-500",
      tools: ["Text to Speech", "Audio Podcast", "Audio Editor", "Voice Cloner", "Music Generator", "Audio Enhancer", "Voice Separator", "Audio Joiner", "Format Converter"]
    },
    {
      category: t("imageTools") || "Image Tools",
      icon: Image,
      color: "from-blue-500 to-cyan-500",
      tools: ["AI Image Generator", "Background Remover", "Image Upscaler", "Face Swap", "Image to Image", "Sketch to Image", "Object Remover", "Image Enhancer"]
    },
    {
      category: t("videoTools") || "Video Tools",
      icon: Video,
      color: "from-red-500 to-orange-500",
      tools: ["Video Podcast", "Text to Video", "Image to Video", "Video Animator", "Lip Sync", "Faceless Video", "Avatar Video", "Video Enhancer", "Video Editor"]
    },
    {
      category: t("faceAvatar") || "Face & Avatar",
      icon: Smile,
      color: "from-green-500 to-teal-500",
      tools: ["Talking Photo", "Face Animation", "Avatar Creator", "Expression Transfer"]
    },
    {
      category: t("textTools") || "Text Tools",
      icon: FileText,
      color: "from-yellow-500 to-orange-500",
      tools: ["Paraphraser", "AI Summarizer", "Grammar Checker", "Ad Copy Generator"]
    }
  ];

  return (
    <div className="min-h-screen" style={{background: '#130A3B'}}>
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">Sahaar AI Studio</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white/80">Welcome, {session?.user?.name || session?.user?.email}</span>
              <LanguageToggle />
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credits Card */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Credits Balance</p>
                  <p className="text-3xl font-bold text-white">1,250</p>
                  <p className="text-white/60 text-xs mt-1">Available credits</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/30">
                  <CreditCard className="w-8 h-8 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Usage Card */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">API Usage</p>
                  <p className="text-3xl font-bold text-white">342</p>
                  <p className="text-white/60 text-xs mt-1">Requests this month</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/30">
                  <Zap className="w-8 h-8 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Card */}
          <Card className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Projects</p>
                  <p className="text-3xl font-bold text-white">28</p>
                  <p className="text-white/60 text-xs mt-1">Total generated</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/30">
                  <TrendingUp className="w-8 h-8 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">AI Tools Dashboard</h2>
          <p className="text-white/60">Choose from our powerful AI tools below</p>
        </div>

        <div className="space-y-8">
          {tools.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color}`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{category.category}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool, toolIdx) => (
                  <Card
                    key={toolIdx}
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={() => handleToolClick(tool)}
                  >
                    <CardContent className="p-6">
                      <h4 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                        {tool}
                      </h4>
                      <p className="text-white/60 text-sm">Click to use</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
