/**
 * Converts any image file from computer or phone camera/gallery into optimized WebP format.
 * Resizes dynamically maintaining aspect ratio and generates a high-efficiency WebP Data URL.
 */

export interface WebPConversionResult {
  dataUrl: string;
  sizeBytes: number;
  originalSizeBytes: number;
  width: number;
  height: number;
  reductionPercentage: number;
}

export function convertFileToWebP(
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 1000,
  quality: number = 0.82
): Promise<WebPConversionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions preserving aspect ratio
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Não foi possível inicializar o canvas de renderização'));
        }

        // High quality smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to WebP
        let webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Fallback check if browser did not produce webp
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate approximate size in bytes from base64
        const base64Length = webpDataUrl.length - (webpDataUrl.indexOf(',') + 1);
        const sizeBytes = Math.round((base64Length * 3) / 4);
        const originalSizeBytes = file.size;
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 100)
        );

        resolve({
          dataUrl: webpDataUrl,
          sizeBytes,
          originalSizeBytes,
          width: targetWidth,
          height: targetHeight,
          reductionPercentage,
        });
      };

      img.onerror = () => {
        reject(new Error('Erro ao processar imagem carregada'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo do computador/celular'));
    };

    reader.readAsDataURL(file);
  });
}
