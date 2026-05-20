import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import qrisImage from "@/assets/Screenshot_20260518-181555.jpg";

const WA_NUMBER = "62895392230445";
const WA_MESSAGE = encodeURIComponent("Min gw mau confirm pembayaran dong");

interface QrisModalProps {
  open: boolean;
  onClose: () => void;
}

export function QrisModal({ open, onClose }: QrisModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`, "_blank");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm glass-strong rounded-2xl p-5 neon-ring animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-bold text-center mb-1">QRIS Payment</h2>
        <p className="text-xs text-muted-foreground text-center mb-4">
          Scan the QR code with your banking or e-wallet app
        </p>

        <div className="flex justify-center">
          <div className="rounded-xl overflow-hidden border-2 border-[var(--neon)]/30 bg-white shadow-lg max-w-[240px] w-full">
            <img
              src={qrisImage}
              alt="QRIS Payment Code"
              className="w-full aspect-square object-contain"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-secondary/40 border border-border/50 p-3">
          <p className="font-semibold text-sm text-center mb-2">Panduan Pembayaran:</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--neon)] min-w-4">1.</span>
              <span>Buka aplikasi bank atau e-wallet</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--neon)] min-w-4">2.</span>
              <span>Pilih fitur "Scan QRIS"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--neon)] min-w-4">3.</span>
              <span>Scan kode QR di atas</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--neon)] min-w-4">4.</span>
              <span>Verifikasi nominal dan bayar</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--neon)] min-w-4">5.</span>
              <span>Klik tombol di bawah untuk konfirmasi</span>
            </li>
          </ol>
        </div>

        <Button
          className="w-full h-11 mt-4 gap-2 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring text-sm font-semibold"
          onClick={handleConfirm}
        >
          <MessageCircle className="h-5 w-5" /> Konfirmasi Pembayaran
        </Button>

        <p className="mt-2 text-[11px] text-muted-foreground text-center leading-relaxed">
          Klik tombol untuk konfirmasi pembayaran via WhatsApp
        </p>
      </div>
    </div>
  );
}
