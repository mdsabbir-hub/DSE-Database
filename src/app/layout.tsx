import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { getDataset, getManifest } from "@/lib/data";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ForthPoint Terminal",
  description: "Portfolio, watchlist, and market data terminal.",
};

const NAV = [
  { index: "01", label: "Dashboard", href: "/" },
  { index: "02", label: "Portfolio", href: "/portfolio" },
  { index: "03", label: "Transactions", href: "/transactions" },
  { index: "04", label: "Database", href: "/database" },
  { index: "05", label: "Watchlist", href: "/watchlist" },
  { index: "06", label: "Dividends", href: "/dividends" },
  { index: "07", label: "Cash Ledger", href: "/cash-ledger" },
];

function TickerStrip() {
  let holdings: Record<string, unknown>[] = [];
  try {
    holdings = getDataset("02-portfolio");
  } catch {
    holdings = [];
  }

  if (holdings.length === 0) return null;

  // Duplicate the list so the CSS marquee loops seamlessly.
  const doubled = [...holdings, ...holdings];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((row, i) => {
          const gainPct = Number(row["Gain %"] ?? 0);
          const tone = gainPct > 0 ? "ticker-gain" : gainPct < 0 ? "ticker-loss" : "";
          const arrow = gainPct > 0 ? "▲" : gainPct < 0 ? "▼" : "•";
          return (
            <span className="ticker-item" key={i}>
              <span className="ticker-symbol">{String(row["Symbol"] ?? "")}</span>
              <span className={tone}>
                {arrow} {Math.abs(gainPct).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let generatedAt = "";
  try {
    generatedAt = getManifest().generatedAt;
  } catch {
    generatedAt = "";
  }

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">
                Forth<span>Point</span>
              </div>
              <div className="brand-sub">
                {generatedAt ? `SYNCED ${new Date(generatedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}` : "TERMINAL"}
              </div>
            </div>
            <ul className="nav-list">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link">
                    <span className="nav-index">{item.index}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          <div className="main">
            <TickerStrip />
            <div className="content">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
