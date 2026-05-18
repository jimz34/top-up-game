import { MessageCircle } from "lucide-react";

const WA_NUMBER = "62895392230443";

export function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=Hi%20NeonTop%2C%20I%20need%20help%20with%20my%20top-up`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[oklch(0.7_0.18_155)] px-4 py-3 text-sm font-medium text-[oklch(0.12_0.04_160)] shadow-lg animate-pulse-neon hover-glow"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp Support</span>
    </a>
  );
}
