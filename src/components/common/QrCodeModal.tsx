import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { RestaurantTable } from '../../types/database.types';
import { X, Printer, ExternalLink, QrCode } from 'lucide-react';

interface QrCodeModalProps {
  table: RestaurantTable;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ table, isOpen, onClose }) => {
  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const tableQrUrl = `${origin}/?mesa=${table.qr_token}`;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-charcoal-900 border border-gray-700 rounded-2xl p-6 shadow-2xl text-center space-y-4 my-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-white">{table.label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">QR Code Exclusivo de Atendimento</p>
        </div>

        {/* The QR Code Card */}
        <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-amber-500/20">
          <QRCodeSVG
            value={tableQrUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-300 font-medium">Escaneie com a câmera do celular</p>
          <p className="text-[11px] text-gray-500 break-all font-mono">{tableQrUrl}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-3 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Placa</span>
          </button>

          <a
            href={tableQrUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Testar Cardápio</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
