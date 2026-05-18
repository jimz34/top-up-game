import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold neon-text">NeonTop</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Premium gaming top-up. Instant delivery, secure payments, 24/7 support.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/games" className="hover:text-foreground">All games</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <p className="text-sm text-muted-foreground">WhatsApp: +62 895-3922-30443</p>
          <p className="text-sm text-muted-foreground mt-1">24/7 customer service</p>
        </div>
      </div>
      <div className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NeonTop. All rights reserved.
      </div>
    </footer>
  );
}
