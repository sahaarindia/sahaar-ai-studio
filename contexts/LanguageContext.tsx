"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<string, Record<Language, string>> = {
  // Header
  "back_to_dashboard": {
    en: "Back to Dashboard",
    hi: "डैशबोर्ड पर वापस जाएं"
  },
  "sahaar_ai_studio": {
    en: "Sahaar AI Studio",
    hi: "सहार AI स्टूडियो"
  },
  
  // Text to Speech
  "text_to_speech": {
    en: "Text to Speech",
    hi: "टेक्स्ट टू स्पीच"
  },
  "audio_tool": {
    en: "Audio Tool",
    hi: "ऑडियो टूल"
  },
  "convert_text_description": {
    en: "Convert your text into natural-sounding speech using AI voices",
    hi: "AI आवाजों का उपयोग करके अपने टेक्स्ट को प्राकृतिक-ध्वनि वाले भाषण में बदलें"
  },
  "input_text": {
    en: "Input Text",
    hi: "इनपुट टेक्स्ट"
  },
  "enter_text": {
    en: "Enter Text (English / हिंदी)",
    hi: "टेक्स्ट दर्ज करें (English / हिंदी)"
  },
  "words": {
    en: "words",
    hi: "शब्द"
  },
  "voice_category": {
    en: "Voice Category",
    hi: "वॉइस कैटेगरी"
  },
  "select_voice": {
    en: "Select Voice",
    hi: "वॉइस चुनें"
  },
  "hindi_native": {
    en: "Hindi Native",
    hi: "हिंदी नेटिव"
  },
  "generate_audio": {
    en: "Generate Audio",
    hi: "ऑडियो जेनरेट करें"
  },
  "generated_audio": {
    en: "Generated Audio",
    hi: "जेनरेट ऑडियो"
  },
  "your_audio_here": {
    en: "Your generated audio will appear here",
    hi: "आपका जेनरेट ऑडियो यहां दिखाई देगा"
  },
  "play": {
    en: "Play",
    hi: "प्ले"
  },
  "download": {
    en: "Download",
    hi: "डाउनलोड"
  },
  "audio_success": {
    en: "Audio generated successfully!",
    hi: "ऑडियो सफलतापूर्वक जेनरेट हुआ!"
  },
  
  // Audio Podcast
  "audio_podcast_generator": {
    en: "Audio Podcast Generator",
    hi: "ऑडियो पॉडकास्ट जेनरेटर"
  },
  "create_professional_podcast": {
    en: "AI voices से professional podcast बनाएं",
    hi: "AI voices से professional podcast बनाएं"
  },
  "voice_selection": {
    en: "Voice Selection",
    hi: "वॉइस सिलेक्शन"
  },
  "choose_voices": {
    en: "Choose different AI voices for Host and Guest",
    hi: "Host और Guest के लिए अलग-अलग AI वॉइस चुनें"
  },
  "host_voice": {
    en: "Host Voice",
    hi: "होस्ट वॉइस"
  },
  "guest_voice": {
    en: "Guest Voice",
    hi: "गेस्ट वॉइस"
  },
  "podcast_script": {
    en: "Podcast Script",
    hi: "पॉडकास्ट स्क्रिप्ट"
  },
  "format_name_dialogue": {
    en: "Format: Name: dialogue (किसी भी name और language में)",
    hi: "Format: Name: dialogue (किसी भी name और language में)"
  },
  "auto_generate": {
    en: "Auto Generate",
    hi: "ऑटो जेनरेट"
  },
  "generate_podcast": {
    en: "Generate Podcast",
    hi: "पॉडकास्ट जेनरेट करें"
  },
  "generating_podcast": {
    en: "Generating Podcast...",
    hi: "पॉडकास्ट जेनरेट हो रहा है..."
  },
  "podcast_success": {
    en: "Podcast generated successfully!",
    hi: "पॉडकास्ट सफलतापूर्वक जेनरेट हुआ!"
  },
  "how_to_use": {
    en: "How to use:",
    hi: "कैसे use करें:"
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
