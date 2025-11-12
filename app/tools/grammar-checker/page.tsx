"use client";
import { useState } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Copy, Download, AlertCircle, Sparkles, FileText, AlertTriangle, Info } from "lucide-react";

interface GrammarError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  original: string;
  suggestion: string;
  explanation: string;
  position?: string;
}

interface GrammarResult {
  correctedText: string;
  errors: GrammarError[];
  score: number;
  summary: string;
  originalText: string;
  wordCount: number;
}

const ERROR_TYPE_CONFIG = {
  grammar: { icon: '📝', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
  spelling: { icon: '🔤', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
  punctuation: { icon: '❗', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
  style: { icon: '✨', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
};

export default function GrammarCheckerPage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  const handleCheck = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to check");
      return;
    }

    if (inputText.length > 10000) {
      setError("Text is too long. Maximum 10,000 characters allowed.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/grammar-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check grammar');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || 'Failed to check grammar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
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
    if (!result) return;
    const content = `Original Text:\n${result.originalText}\n\n---\n\nCorrected Text:\n${result.correctedText}\n\n---\n\nIssues Found: ${result.errors.length}\nGrammar Score: ${result.score}/100\n\n${result.summary}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grammar-check-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/50';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <ToolLayout
      toolName="Grammar & Style Checker"
      toolDescription="Find and fix grammar, spelling, punctuation, and style errors in your text"
      toolIcon={<CheckCircle2 className="h-8 w-8 text-white" />}
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
                placeholder="Paste or type your text here to check for grammar, spelling, and style errors... (Max 10,000 characters)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[400px] text-base leading-relaxed"
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

            <Button
              onClick={handleCheck}
              disabled={!inputText.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking Grammar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Check Grammar & Style
                </>
              )}
            </Button>
          </div>
        </ToolInput>

        <ToolOutput title="Analysis Results" icon={<Sparkles className="h-5 w-5 text-green-400" />}>
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

            {result ? (
              <div className="space-y-4">
                <div className={`border rounded-lg p-6 ${getScoreBg(result.score)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </div>
                      <div>
                        <p className="text-white font-semibold">Grammar Score</p>
                        <p className="text-white/60 text-sm">Out of 100</p>
                      </div>
                    </div>
                    <CheckCircle2 className={`h-12 w-12 ${getScoreColor(result.score)}`} />
                  </div>
                  <p className="text-white/80 text-sm">{result.summary}</p>
                </div>

                {result.errors.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      Issues Found ({result.errors.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {result.errors.map((error, idx) => {
                        const config = ERROR_TYPE_CONFIG[error.type];
                        return (
                          <div
                            key={idx}
                            className={`${config.bg} border ${config.border} rounded-lg p-4`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{config.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`${config.color} font-semibold text-sm uppercase`}>
                                    {error.type}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-white/60 text-xs">Original:</span>
                                    <p className="text-red-300 line-through text-sm">{error.original}</p>
                                  </div>
                                  <div>
                                    <span className="text-white/60 text-xs">Suggestion:</span>
                                    <p className="text-green-300 font-medium text-sm">{error.suggestion}</p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-white/70 text-xs">{error.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-300 font-semibold text-lg">Perfect! No Issues Found</p>
                    <p className="text-green-200/70 text-sm mt-1">Your text is grammatically correct!</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-3">✅ Corrected Text</h3>
                  <div className="bg-black/20 rounded-lg p-4 mb-4 max-h-[200px] overflow-y-auto">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCopy(result.correctedText)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
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
                <CheckCircle2 className="h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/50 text-lg mb-2">Ready to check grammar</p>
                <div className="mt-4 text-white/40 text-sm space-y-1">
                  <p>✓ Enter your text in the left panel</p>
                  <p>✓ Click "Check Grammar & Style"</p>
                  <p>✓ Get instant corrections and suggestions</p>
                  <p>✓ View grammar score and download report</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Loader2 className="h-16 w-16 text-green-400 animate-spin mb-4" />
                <p className="text-white/70 text-lg">Analyzing your text...</p>
                <p className="text-white/50 text-sm mt-2">Checking grammar, spelling, and style</p>
              </div>
            )}
          </div>
        </ToolOutput>
      </div>
    </ToolLayout>
  );
}
