'use client';

import { useState } from 'react';
import { Download, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TextToImagePage() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string>('auto');
  const [size, setSize] = useState<string>('1024x1024');
  const [quality, setQuality] = useState<string>('standard');
  const [style, setStyle] = useState<string>('vivid');
  const [distance, setDistance] = useState<number>(2.5);
  const [consistent, setConsistent] = useState<boolean>(true);

  const t = {
    en: {
      title: 'Text-to-Image Generator',
      subtitle: 'Create stunning AI-generated images from text descriptions',
      promptLabel: 'Describe Your Image',
      promptPlaceholder: 'A serene landscape with mountains and sunset...',
      promptHint: 'Be descriptive for best results',
      modelLabel: 'AI Model',
      sizeLabel: 'Image Size',
      generateButton: 'Generate Image',
      generating: 'Generating...',
      downloadButton: 'Download Image',
      examplePrompts: 'Example Prompts',
      examples: [
        'A serene landscape with mountains and sunset',
        'A futuristic cityscape at night with neon lights',
        'A cute robot in a garden with flowers',
        'An ancient temple in a misty jungle',
        'A cozy coffee shop interior with warm lighting'
      ]
    },
    hi: {
      title: 'टेक्स्ट-टू-इमेज जेनरेटर',
      subtitle: 'टेक्स्ट विवरण से शानदार AI-जनित छवियां बनाएं',
      promptLabel: 'अपनी छवि का वर्णन करें',
      promptPlaceholder: 'पहाड़ों और सूर्यास्त के साथ एक शांत परिदृश्य...',
      promptHint: 'सर्वोत्तम परिणामों के लिए विस्तृत विवरण दें',
      modelLabel: 'AI मॉडल',
      sizeLabel: 'छवि का आकार',
      generateButton: 'छवि बनाएं',
      generating: 'बना रहे हैं...',
      downloadButton: 'छवि डाउनलोड करें',
      examplePrompts: 'उदाहरण प्रॉम्प्ट',
      examples: [
        'पहाड़ों और सूर्यास्त के साथ एक शांत परिदृश्य',
        'नियॉन लाइट्स के साथ रात में एक भविष्यवादी शहर',
        'फूलों के साथ बगीचे में एक प्यारा रोबोट',
        'धुंधले जंगल में एक प्राचीन मंदिर',
        'गर्म रोशनी के साथ एक आरामदायक कॉफी शॉप का इंटीरियर'
      ]
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(language === 'hi' ? 'कृपया एक विवरण दर्ज करें' : 'Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          size,
          quality,
          style,
          distance,
          consistent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `sahaar-ai-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#001529] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#002140] border-b border-[#003a70] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">backToDashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Sahaar AI Studio</span>
            </div>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
          >
            {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{language === 'en' ? 'textToImage' : 'टेक्स्ट-टू-इमेज'}</h1>
              <p className="text-sm text-gray-400">{language === 'en' ? 'imageTool' : 'इमेज टूल'}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Prompt Box */}
            <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                📝 {t[language].promptLabel}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t[language].promptPlaceholder}
                rows={5}
                className="w-full px-4 py-3 bg-[#001529] border border-[#003a70] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-500"
                disabled={isGenerating}
              />
              <p className="mt-2 text-xs text-gray-400">{t[language].promptHint}</p>
            </div>

            {/* Example Prompts */}
            <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
              <h3 className="text-lg font-semibold text-white mb-4">{t[language].examplePrompts}</h3>
              <div className="space-y-2">
                {t[language].examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left px-4 py-3 bg-[#001529] hover:bg-[#003a70] rounded-xl transition-all text-sm text-gray-300 hover:text-white border border-[#003a70]"
                    disabled={isGenerating}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70] space-y-4">
              {/* Model */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  🤖 {t[language].modelLabel}
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2 bg-[#001529] border border-[#003a70] rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                  disabled={isGenerating}
                >
                  <option value="auto">🤖 Auto (Smart Selection)</option>
                  <option value="stable-diffusion">⚡ Stable Diffusion (Free)</option>
                  <option value="dall-e-3">💎 DALL-E 3 (Premium)</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  📐 {t[language].sizeLabel}
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-2 bg-[#001529] border border-[#003a70] rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                  disabled={isGenerating}
                >
                  <optgroup label="⬛ Square (1:1)">
                    <option value="512x512">512×512 (Small)</option>
                    <option value="768x768">768×768 (Medium)</option>
                    <option value="1024x1024">1024×1024 (Large)</option>
                  </optgroup>
                  <optgroup label="📺 Landscape (16:9)">
                    <option value="1344x768">1344×768 (HD)</option>
                    <option value="1920x1080">1920×1080 (Full HD)</option>
                  </optgroup>
                  <optgroup label="📱 Portrait (9:16)">
                    <option value="768x1344">768×1344 (HD)</option>
                    <option value="1080x1920">1080×1920 (Full HD)</option>
                  </optgroup>
                </select>
              </div>

              {/* Camera Distance */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  📸 {language === 'hi' ? 'कैमरा दूरी' : 'Camera Distance'}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0.5m</span>
                  <span className="font-semibold text-white">{distance}m</span>
                  <span>10m</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {distance <= 1 && '📸 Close-up: Detailed view'}
                  {distance > 1 && distance <= 3 && '📸 Medium: Balanced framing'}
                  {distance > 3 && distance <= 5 && '📸 Wide: Full scene'}
                  {distance > 5 && '📸 Very wide: Expansive view'}
                </p>
              </div>

              {/* Consistent Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consistent}
                    onChange={(e) => setConsistent(e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer accent-purple-500"
                    disabled={isGenerating}
                  />
                  <span className="text-sm font-medium text-gray-300">
                    {language === 'hi' ? '🎯 एक जैसी छवि' : '🎯 Consistent Results'}
                  </span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-7">
                  {consistent
                    ? (language === 'hi' ? 'एक ही prompt से same image' : 'Same prompt = Same image')
                    : (language === 'hi' ? 'हर बार अलग variations' : 'Random variations')
                  }
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl font-bold text-lg text-white shadow-xl transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              {isGenerating ? t[language].generating : t[language].generateButton}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
            <h2 className="text-xl font-semibold text-white mb-4">🎨 Generated Image</h2>
            <div className="aspect-square bg-[#001529] rounded-xl overflow-hidden flex items-center justify-center border border-[#003a70]">
              {generatedImage ? (
                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Sparkles className="w-20 h-20 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">Your generated image will appear here</p>
                </div>
              )}
            </div>
            {generatedImage && (
              <button
                onClick={handleDownload}
                className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t[language].downloadButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
