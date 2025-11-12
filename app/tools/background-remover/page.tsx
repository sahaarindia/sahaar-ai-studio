"use client";
import { useState, useRef } from "react";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { ToolInput } from "@/components/tool/ToolInput";
import { ToolOutput } from "@/components/tool/ToolOutput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Download, CheckCircle, AlertCircle, Image as ImageIcon, Sparkles, X } from "lucide-react";
import Image from "next/image";

export default function BackgroundRemoverPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    setError(null);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setProcessedImage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove background');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);

    } catch (err: any) {
      console.error('Background removal error:', err);
      setError(err.message || 'Failed to remove background. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `no-bg-${fileName || 'image.png'}`;
    link.click();
  };

  const handleClear = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFileName("");
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ToolLayout
      toolName="Background Remover"
      toolDescription="Remove background from images automatically using AI"
      toolIcon={<ImageIcon className="h-8 w-8 text-white" />}
      category="Image Tools"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolInput title="Upload Image" icon={<Upload className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">📸 Select Image</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors bg-white/5">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-white/50 mx-auto mb-3" />
                  <p className="text-white/70 text-sm mb-1">Click to upload image</p>
                  <p className="text-white/50 text-xs">PNG, JPG, WEBP (Max 10MB)</p>
                </label>
              </div>
              {fileName && (
                <div className="mt-2 text-white/60 text-sm flex items-center justify-between">
                  <span>📄 {fileName}</span>
                  <Button
                    onClick={handleClear}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {originalImage && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <Label className="text-white mb-2 block">📷 Original Image</Label>
                <div className="relative aspect-video bg-white/10 rounded-lg overflow-hidden">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleRemoveBackground}
              disabled={!selectedFile || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Removing Background...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Remove Background
                </>
              )}
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-400" />
                Features
              </h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>✓ AI-powered background removal</li>
                <li>✓ Transparent PNG output</li>
                <li>✓ High-quality results</li>
                <li>✓ Server-side processing</li>
                <li>✓ Supports all image formats</li>
              </ul>
            </div>
          </div>
        </ToolInput>

        <ToolOutput title="Result" icon={<Sparkles className="h-5 w-5 text-green-400" />}>
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

            {processedImage ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-300 font-medium">Background Removed Successfully!</span>
                  </div>

                  <div className="relative aspect-video bg-white rounded-lg overflow-hidden mb-4">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      backgroundColor: '#ffffff'
                    }}></div>
                    <div className="relative w-full h-full">
                      <Image
                        src={processedImage}
                        alt="No background"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PNG
                  </Button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">💡 Tips</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Downloaded image has transparent background</li>
                    <li>• Use in design software or presentations</li>
                    <li>• Works best with clear subject separation</li>
                  </ul>
                </div>
              </div>
            ) : !isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <ImageIcon className="h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/50 text-lg mb-2">Ready to remove background</p>
                <div className="mt-4 text-white/40 text-sm space-y-1">
                  <p>✓ Upload an image</p>
                  <p>✓ Click "Remove Background"</p>
                  <p>✓ Download transparent PNG</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-4" />
                <p className="text-white/70 text-lg">Processing image...</p>
                <p className="text-white/50 text-sm mt-2">Server is removing the background</p>
                <p className="text-white/50 text-xs mt-1">This may take 5-15 seconds</p>
              </div>
            )}
          </div>
        </ToolOutput>
      </div>
    </ToolLayout>
  );
}
