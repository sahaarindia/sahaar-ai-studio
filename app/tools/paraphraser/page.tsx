"use client";
import { useState } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Copy, Download, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

const STYLES = [
  { value: 'professional', label: 'Professional', icon: '💼', desc: 'Business-appropriate tone' },
  { value: 'casual', label: 'Casual', icon: '😊', desc: 'Friendly and relaxed' },
  { value: 'academic', label: 'Academic', icon: '🎓', desc: 'Scholarly and formal' },
  { value: 'creative', label: 'Creative', icon: '🎨', desc: 'Engaging and vivid' },
  { value: 'simple', label: 'Simple', icon: '📖', desc: 'Easy to understand' },
  { value: 'formal', label: 'Formal', icon: '🎩', desc: 'Sophisticated language' },
];

export default function ParaphraserPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const outputWordCount = outputText.trim().split(/\s+/).filter(Boolean).length;

  const handleParaphrase = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to paraphrase");
      return;
    }

    if (inputText.length > 10000) {
      setError("Text is too long. Maximum 10,000 characters allowed.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOutputText("");

    try {
      const response = await fetch('/api/paraphraser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          style: selectedStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to paraphrase text');
      }

      const data = await response.json();
      setOutputText(data.paraphrased);
      
    } catch (err: any) {
      setError(err.message || 'Failed to paraphrase text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = outputText;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy text");
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paraphrased-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInputText("");
    setOutputText("");
    setError(null);
  };

  return (
    <ToolLayout
      toolName="AI Paraphraser"
      toolDescription="Rewrite your text in different styles while maintaining the original meaning"
      toolIcon={<FileText className="h-8 w-8 text-white" />}
      category="Text & Content Tools"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolInput title="Input Text" icon={<FileText className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">📝 Enter Your Text</Label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your text here... (Max 10,000 characters)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[300px] text-base leading-relaxed"
                maxLength={10000}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/60 text-sm">
                  {wordCount} words • {inputText.length}/10,000 characters
                </span>
                {inputText && (
                  <Button
                    onClick={handleClear}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-white mb-3 block">🎨 Select Writing Style</Label>
              <div className="grid grid-cols-2 gap-3">
                {STYLES.map((style) => (
                  <Button
                    key={style.value}
                    type="button"
                    onClick={() => setSelectedStyle(style.value)}
                    className={`${
                      selectedStyle === style.value
                        ? 'bg-purple-600 hover:bg-purple-700 border-purple-400'
                        : 'bg-white/5 hover:bg-white/10 border-white/20'
                    } border-2 h-auto py-3 flex flex-col items-start text-left transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{style.icon}</span>
                      <span className="font-semibold text-white">{style.label}</span>
                    </div>
                    <span className="text-xs text-white/60">{style.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleParaphrase}
              disabled={!inputText.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Paraphrasing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Paraphrase Text
                </>
              )}
            </Button>
          </div>
        </ToolInput>

        <ToolOutput title="Paraphrased Text" icon={<Sparkles className="h-5 w-5 text-green-400" />}>
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

            {outputText ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-300 font-medium">Paraphrased Successfully!</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <span>{outputWordCount} words</span>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 mb-4 max-h-[400px] overflow-y-auto">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">{outputText}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleCopy}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Text
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ) : !isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Sparkles className="h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/50 text-lg mb-2">Ready to paraphrase</p>
                <div className="mt-4 text-white/40 text-sm space-y-1">
                  <p>✓ Enter your text in the left panel</p>
                  <p>✓ Choose a writing style</p>
                  <p>✓ Click "Paraphrase Text" button</p>
                  <p>✓ Get instant results!</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Loader2 className="h-16 w-16 text-purple-400 animate-spin mb-4" />
                <p className="text-white/70 text-lg">Paraphrasing your text...</p>
                <p className="text-white/50 text-sm mt-2">Using {STYLES.find(s => s.value === selectedStyle)?.label} style</p>
              </div>
            )}
          </div>
        </ToolOutput>
      </div>
    </ToolLayout>
  );
}
