"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="gap-2 bg-white/90 hover:bg-white text-blue-600 border-blue-300 font-semibold"
    >
      <Languages className="h-4 w-4" />
      {language === "en" ? "हिंदी" : "English"}
    </Button>
  );
}
