"use client";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ArrowLeft, Sparkles, Info } from "lucide-react";

interface ToolLayoutProps {
  toolName: string;
  toolDescription: string;
  toolIcon: ReactNode;
  children: ReactNode;
  category: string;
}

export function ToolLayout({ toolName, toolDescription, toolIcon, children, category }: ToolLayoutProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen" style={{background: '#130A3B'}}>
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToDashboard")}
            </Button>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">{t("appName")}</h1>
            </div>
          </div>
          
          <LanguageToggle />
        </div>
      </header>

      {/* Tool Header */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              {toolIcon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{toolName}</h1>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                  {category}
                </span>
              </div>
              <p className="text-white/70 text-lg">{toolDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Credits Info */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 text-white">
            <Info className="h-4 w-4 text-blue-400" />
            <span className="text-sm">{t("credits")}: <strong>10/10</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
