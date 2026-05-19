import { useState } from "react";
import { X, ZoomIn, ZoomOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold text-center mb-1">QRIS Payment</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Scan the QR code below to pay
        </p>

        <div
          className={`relative mx-auto rounded-2xl overflow-hidden border border-border/50 bg-white transition-transform duration-300 ${
            zoomed ? "max-w-[320px] sm:max-w-[360px]" : "max-w-[240px] sm:max-w-[260px]"
          }`}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_payment_code_-_example.png"
            alt="QRIS Payment Code"
            className={`w-full aspect-square object-contain transition-transform duration-300 cursor-pointer ${
              zoomed ? "scale-110" : "scale-100"
            }`}
            onClick={() => setZoomed(!zoomed)}
          />
          <button
            onClick={() => setZoomed(!zoomed)}
            className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl bg-secondary/50 p-3 space-y-1.5">
            <p className="font-medium text-foreground">Payment Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Open your banking or e-wallet app</li>
              <li>Scan the QR code above</li>
              <li>Enter the exact amount shown in your order</li>
              <li>Complete the payment</li>
              <li>Click "Confirm Payment" below</li>
            </ol>
          </div>
        </div>

        <Button
          className="w-full h-12 mt-5 gap-2 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring text-base font-semibold"
          onClick={handleConfirm}
        >
          <MessageCircle className="h-5 w-5" /> Confirm Payment
        </Button>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          After clicking, you will be redirected to WhatsApp to send payment proof.
        </p>
      </div>
    </div>
  );
}
