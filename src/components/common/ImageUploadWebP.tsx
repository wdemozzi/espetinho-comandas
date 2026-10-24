import React, { useState, useRef } from 'react';
import { convertFileToWebP, WebPConversionResult } from '../../lib/imageConverter';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Smartphone,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ImageUploadWebPProps {
  currentImageUrl?: string | null;
  onImageConverted: (webpDataUrl: string) => void;
  onImageRemoved: () => void;
}

export const ImageUploadWebP: React.FC<ImageUploadWebPProps> = ({
  currentImageUrl,
  onImageConverted,
  onImageRemoved,
}) => {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionMeta, setConversionMeta] = useState<WebPConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsConverting(true);
      setErrorMsg(null);

      const result = await convertFileToWebP(file, 1000, 1000, 0.82);
      setConversionMeta(result);
      onImageConverted(result.dataUrl);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erro ao converter foto para WebP');
    } finally {
      setIsConverting(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setConversionMeta(null);
    setErrorMsg(null);
    onImageRemoved();
  };

  const formatKB = (bytes: number) => {
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-ember-400" />
          <span>Foto do Produto (Computador ou Celular):</span>
        </label>
        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Auto WebP</span>
        </span>
      </div>

      {currentImageUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-charcoal-800 p-2.5 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-charcoal-900 border border-gray-700 flex-shrink-0 relative">
            <img
              src={currentImageUrl}
              alt="Foto do Produto"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[9px] font-extrabold text-center py-0.5">
              WEBP
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Foto convertida e pronta!</span>
            </div>

            {conversionMeta ? (
              <p className="text-[11px] text-gray-400">
                Otimizada para WebP: <strong className="text-emerald-400 font-mono">{formatKB(conversionMeta.sizeBytes)}</strong>
                {conversionMeta.reductionPercentage > 0 && (
                  <span className="text-gray-500"> ({conversionMeta.reductionPercentage}% mais leve)</span>
                )}
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 font-mono truncate">
                Imagem associada ao cardápio
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-ember-400 hover:text-ember-300 font-semibold flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Trocar foto</span>
              </button>
              <span className="text-gray-600">•</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-ember-500/70 rounded-xl p-4 bg-charcoal-800/60 hover:bg-charcoal-800 transition cursor-pointer text-center space-y-1.5 group"
        >
          {isConverting ? (
            <div className="py-2 flex flex-col items-center justify-center gap-1 text-ember-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-xs font-bold">Convertendo imagem para WebP...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 mx-auto rounded-xl bg-charcoal-900 border border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-ember-400 group-hover:border-ember-500/50 transition">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-200">
                Clique para selecionar do computador ou tirar foto no celular
              </p>
              <p className="text-[11px] text-gray-500">
                PNG, JPG ou HEIC são convertidos automaticamente para <strong className="text-emerald-400">WebP ultraleve</strong>
              </p>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-400 pt-1">{errorMsg}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
