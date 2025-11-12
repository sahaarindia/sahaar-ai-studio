'use client';

import { useState, useRef } from 'react';
import { Download, Sparkles, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function ImageToImagePage() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [prompt, setPrompt] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [referenceImagePreviews, setReferenceImagePreviews] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [strength, setStrength] = useState<number>(35);
  const [style, setStyle] = useState<string>('auto');
  const [comparisonSlider, setComparisonSlider] = useState<number>(50);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const referenceImagesInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: 'Image-to-Image Transform',
      subtitle: 'Transform your images with AI-powered style transfer',
      backToDashboard: 'Back to Dashboard',
      mainImageLabel: 'Main Image',
      mainImagePlaceholder: 'Upload the image you want to transform',
      referenceImagesLabel: 'Reference Images',
      referenceImagesPlaceholder: 'Upload reference images for style/background',
      promptLabel: 'Transformation Description',
      promptPlaceholder: 'Remove background, convert to watercolor, anime style...',
      promptHint: 'Describe how you want to transform the image',
      strengthLabel: 'Transformation Strength',
      styleLabel: 'Style Preset',
      tierLabel: 'Tier',
      freeTier: 'FREE (1 reference)',
      premiumTier: 'PREMIUM (3 references)',
      generateButton: 'Transform Image',
      generating: 'Transforming...',
      downloadButton: 'Download Image',
      uploadButton: 'Choose File',
      dragDropText: 'or drag and drop here',
      beforeAfter: 'Before / After Comparison',
      transformedImage: 'Transformed Image',
      examplePrompts: 'Example Transformations',
      examples: [
        'Remove background',
        'Convert to watercolor painting style',
        'Make it look like an anime character',
        'Transform into professional studio photo',
        'Add dramatic sunset lighting'
      ]
    },
    hi: {
      title: 'इमेज-टू-इमेज रूपांतरण',
      subtitle: 'AI-संचालित स्टाइल ट्रांसफर से अपनी छवियों को बदलें',
      backToDashboard: 'डैशबोर्ड पर वापस जाएं',
      mainImageLabel: 'मुख्य छवि',
      mainImagePlaceholder: 'वह छवि अपलोड करें जिसे आप बदलना चाहते हैं',
      referenceImagesLabel: 'संदर्भ छवियां',
      referenceImagesPlaceholder: 'स्टाइल/बैकग्राउंड के लिए संदर्भ छवियां अपलोड करें',
      promptLabel: 'रूपांतरण विवरण',
      promptPlaceholder: 'बैकग्राउंड हटाएं, वॉटरकलर में बदलें, एनीमे स्टाइल...',
      promptHint: 'बताएं कि आप छवि को कैसे बदलना चाहते हैं',
      strengthLabel: 'रूपांतरण की शक्ति',
      styleLabel: 'स्टाइल प्रीसेट',
      tierLabel: 'टियर',
      freeTier: 'FREE (1 संदर्भ)',
      premiumTier: 'PREMIUM (3 संदर्भ)',
      generateButton: 'छवि बदलें',
      generating: 'बदल रहे हैं...',
      downloadButton: 'छवि डाउनलोड करें',
      uploadButton: 'फाइल चुनें',
      dragDropText: 'या यहां खींचें और छोड़ें',
      beforeAfter: 'पहले / बाद तुलना',
      transformedImage: 'रूपांतरित छवि',
      examplePrompts: 'उदाहरण रूपांतरण',
      examples: [
        'बैकग्राउंड हटाएं',
        'वॉटरकलर पेंटिंग स्टाइल में बदलें',
        'इसे एनीमे कैरेक्टर जैसा बनाएं',
        'प्रोफेशनल स्टूडियो फोटो में बदलें',
        'नाटकीय सूर्यास्त लाइटिंग जोड़ें'
      ]
    }
  };

  const handleMainImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(language === 'hi' ? 'कृपया एक वैध छवि फाइल अपलोड करें' : 'Please upload a valid image file');
      return;
    }
    setMainImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleReferenceImagesUpload = (files: FileList) => {
    const maxFiles = tier === 'free' ? 1 : 3;
    const currentCount = referenceImages.length;
    const newFiles = Array.from(files).slice(0, maxFiles - currentCount);

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) return;

      setReferenceImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    setReferenceImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    console.log('🔵 Generate button clicked!');
    console.log('Main Image:', mainImage);
    console.log('Prompt:', prompt);

    if (!mainImage) {
      console.log('❌ No main image');
      setError(language === 'hi' ? 'कृपया मुख्य छवि अपलोड करें' : 'Please upload main image');
      return;
    }

    if (!prompt.trim()) {
      console.log('❌ No prompt');
      setError(language === 'hi' ? 'कृपया रूपांतरण विवरण दर्ज करें' : 'Please enter transformation description');
      return;
    }

    console.log('✅ Validation passed, starting generation...');
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append('mainImage', mainImage);
      formData.append('prompt', prompt.trim());
      formData.append('strength', strength.toString());
      formData.append('style', style);
      formData.append('tier', tier);

      referenceImages.forEach((img, idx) => {
        formData.append(`referenceImage${idx}`, img);
      });

      console.log('📤 Sending request to API...');
      console.log('📋 FormData contents:');
      console.log('  - mainImage:', mainImage.name);
      console.log('  - prompt:', prompt);
      console.log('  - strength:', strength);
      console.log('  - style:', style);
      console.log('  - tier:', tier);

      const response = await fetch('/api/image-to-image', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response received:', response.status, response.statusText);

      // ✅ IMPROVED: Better response handling
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = 'Transformation failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // ✅ Parse the JSON response
      const data = await response.json();
      console.log('📦 Response data:', data);

      // ✅ IMPROVED: Better validation
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response from server');
      }

      if (!data.imageUrl) {
        console.error('❌ No imageUrl in response:', data);
        throw new Error('No image generated. Please try again.');
      }

      // ✅ Validate imageUrl format
      if (typeof data.imageUrl !== 'string' || !data.imageUrl.startsWith('data:image')) {
        console.error('❌ Invalid image URL format:', data.imageUrl);
        throw new Error('Invalid image format received');
      }

      console.log('✅ Image URL received:', data.imageUrl.substring(0, 50) + '...');
      console.log('✅ Provider:', data.provider);
      
      // ✅ Set the generated image
      setGeneratedImage(data.imageUrl);
      setError(null); // ✅ Clear any previous errors
      
      console.log('🎉 Image transformation successful!');
      
    } catch (err: any) {
      console.error('❌ Generation Error:', err);
      const errorMessage = err.message || 'Failed to transform image. Please try again.';
      setError(errorMessage);
      setGeneratedImage(null); // ✅ Clear any previous image on error
    } finally {
      setIsGenerating(false);
      console.log('🏁 Generation process completed');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `sahaar-transformed-${Date.now()}.png`;
    link.click();
  };

  const maxReferenceImages = tier === 'free' ? 1 : 3;

  return (
    <div className="min-h-screen bg-[#001529] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#002140] border-b border-[#003a70] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">{t[language].backToDashboard}</span>
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
{/* Simple Custom Prompt Input */}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t[language].title}</h1>
              <p className="text-sm text-gray-400">{t[language].subtitle}</p>
            </div>
          </div>
        </div>

        {/* Single Column Layout */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Image Upload */}
          <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              🖼️ {t[language].mainImageLabel}
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) {
                  handleMainImageUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-[#003a70] rounded-xl p-6 text-center hover:border-purple-500 transition-all cursor-pointer bg-[#001529]"
              onClick={() => mainImageInputRef.current?.click()}
            >
              {mainImagePreview ? (
                <div className="relative">
                  <img src={mainImagePreview} alt="Main" className="w-full h-64 object-contain rounded-lg" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainImage(null);
                      setMainImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-12">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 mb-2 text-lg">{t[language].uploadButton}</p>
                  <p className="text-sm text-gray-500">{t[language].dragDropText}</p>
                </div>
              )}
            </div>
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleMainImageUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Tier Selection */}
          <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              🎯 {t[language].tierLabel}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTier('free')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tier === 'free'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-[#003a70] bg-[#001529] hover:border-green-500/50'
                }`}
              >
                <div className="text-sm font-semibold text-white mb-1">FREE</div>
                <div className="text-xs text-gray-400">1 Reference Image</div>
              </button>
              <button
                onClick={() => setTier('premium')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tier === 'premium'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-[#003a70] bg-[#001529] hover:border-purple-500/50'
                }`}
              >
                <div className="text-sm font-semibold text-white mb-1">PREMIUM 💎</div>
                <div className="text-xs text-gray-400">3 Reference Images</div>
              </button>
            </div>
          </div>

          {/* Reference Images Upload */}
          <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              🎨 {t[language].referenceImagesLabel} ({referenceImages.length}/{maxReferenceImages})
            </label>
            
            {referenceImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {referenceImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img src={preview} alt={`Ref ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => removeReferenceImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {referenceImages.length < maxReferenceImages && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleReferenceImagesUpload(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-[#003a70] rounded-xl p-6 text-center hover:border-purple-500 transition-all cursor-pointer bg-[#001529]"
                onClick={() => referenceImagesInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">{t[language].uploadButton}</p>
              </div>
            )}
            <input
              ref={referenceImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleReferenceImagesUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Prompt Box */}
          <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              📝 {t[language].promptLabel}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t[language].promptPlaceholder}
              rows={4}
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
            {/* Strength Slider */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                ⚡ {t[language].strengthLabel}
              </label>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                disabled={isGenerating}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>10% (Subtle)</span>
                <span className="font-semibold text-white">{strength}%</span>
                <span>80% (Strong)</span>
              </div>
            </div>

            {/* Style Preset */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                🎭 {t[language].styleLabel}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 bg-[#001529] border border-[#003a70] rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                disabled={isGenerating}
              >
                <option value="auto">🤖 Auto (Smart Selection)</option>
                <option value="realistic">📸 Realistic Photo</option>
                <option value="artistic">🎨 Artistic Painting</option>
                <option value="anime">🌸 Anime Style</option>
                <option value="cartoon">🎬 Cartoon</option>
                <option value="sketch">✏️ Pencil Sketch</option>
                <option value="watercolor">💧 Watercolor</option>
              </select>
            </div>
          </div>

          {/* Error Display - IMPROVED */}
          {error && (
            <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !mainImage || !prompt.trim()}
            className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl font-bold text-xl text-white shadow-xl transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <Sparkles className="w-7 h-7" />
            {isGenerating ? t[language].generating : t[language].generateButton}
          </button>

          {/* Output Section */}
          {generatedImage && (
            <div className="bg-[#002140] rounded-2xl p-6 border border-[#003a70]">
              <h2 className="text-xl font-semibold text-white mb-4">
                🎨 {t[language].beforeAfter}
              </h2>
              
              <div className="space-y-4">
                {/* Before/After Comparison Slider */}
                <div className="relative w-full aspect-video bg-[#001529] rounded-xl overflow-hidden border border-[#003a70]">
                  {/* After (Generated) - Full width */}
                  <img 
                    src={generatedImage} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-contain"
                    onLoad={() => console.log('✅ Generated image loaded successfully')}
                    onError={(e) => {
                      console.error('❌ Failed to load generated image');
                      setError('Failed to display generated image');
                    }}
                  />
                  
                  {/* Before (Original) - Clipped by slider */}
                  {mainImagePreview && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${comparisonSlider}%` }}
                    >
                      <img 
                        src={mainImagePreview} 
                        alt="Before" 
                        className="w-full h-full object-contain"
                        style={{ width: `${10000 / comparisonSlider}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
                    style={{ left: `${comparisonSlider}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-gray-800"></div>
                        <div className="w-0.5 h-4 bg-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slider Control */}
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonSlider}
                    onChange={(e) => setComparisonSlider(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Before</span>
                    <span className="font-semibold text-white">{comparisonSlider}%</span>
                    <span>After</span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-semibold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {t[language].downloadButton}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
