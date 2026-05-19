import { useState } from "react";
import { X, ZoomIn, ZoomOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import qrisImage from "@/assets/Screenshot_20260518-181555.jpg";

const WA_CONFIRM_NUMBER = "62895392230445";

interface QrisModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
}

export function QrisModal({ open, onClose, onConfirmPayment }: QrisModalProps) {
  const [zoomed, setZoomed] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirmPayment();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md glass-strong rounded-3xl p-6 neon-ring animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold text-center mb-1">QRIS Payment</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Scan the QR code below with your banking or e-wallet app
        </p>

        <div
          className={`relative mx-auto rounded-2xl overflow-hidden border-4 border-[var(--neon)]/30 bg-white transition-all duration-300 shadow-xl ${
            zoomed ? "max-w-[280px] sm:max-w-[320px]" : "max-w-[220px] sm:max-w-[260px]"
          }`}
        >
          <img
            src={qrisImage}
            alt="QRIS Payment Code - Satu QRIS untuk Semua"
            className={`w-full aspect-square object-contain transition-transform duration-300 cursor-pointer hover:brightness-110 ${
              zoomed ? "scale-125" : "scale-100"
            }`}
            onClick={() => setZoomed(!zoomed)}
          />
          <button
            onClick={() => setZoomed(!zoomed)}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all shadow-lg"
            title={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl bg-gradient-to-br from-[var(--neon)]/10 to-purple-500/10 border border-[var(--neon)]/20 p-4 space-y-2.5">
            <p className="font-bold text-foreground text-center">Panduan Pembayaran:</p>
            <ol className="space-y-2 text-xs text-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--neon)] min-w-6">1.</span>
                <span>Buka aplikasi bank atau e-wallet Anda</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--neon)] min-w-6">2.</span>
                <span>Pilih fitur "Scan QRIS" atau "Pindai QR"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--neon)] min-w-6">3.</span>
                <span>Scan kode QR di atas (klik zoom untuk perbesar)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--neon)] min-w-6">4.</span>
                <span>Verifikasi nominal yang sesuai dan lanjutkan pembayaran</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--neon)] min-w-6">5.</span>
                <span>Klik tombol di bawah untuk konfirmasi pembayaran</span>
              </li>
            </ol>
          </div>
        </div>

        <Button
          className="w-full h-12 mt-6 gap-2 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring text-base font-semibold transition-all"
          onClick={handleConfirm}
        >
          <MessageCircle className="h-5 w-5" /> Konfirmasi Pembayaran
        </Button>

        <p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
          Setelah klik tombol, Anda akan dialihkan ke WhatsApp untuk mengirim bukti pembayaran
        </p>
      </div>
    </div>
  );
}