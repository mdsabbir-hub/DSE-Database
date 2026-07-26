import { getDataset, getManifest } from "@/lib/data";

export const dynamic = "force-static";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  let holdings: Record<string, unknown>[] = [];
  let generatedAt = "";
  try {
    holdings = getDataset("02-portfolio");
    generatedAt = getManifest().generatedAt;
  } catch {
    holdings = [];
  }

  const totalValue = holdings.reduce((sum, r) => sum + num(r["Market Value"]), 0);
  const totalCost = holdings.reduce((sum, r) => sum + num(r["Cost"]), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost !== 0 ? (totalGain / totalCost) * 100 : 0;
  const todaysGain = holdings.reduce((sum, r) => sum + num(r["Today's Gain"]), 0);

  const bySector = new Map<string, number>();
  for (const r of holdings) {
    const sector = String(r["Sector"] ?? "Unclassified");
    bySector.set(sector, (bySector.get(sector) ?? 0) + num(r["Market Value"]));
  }
  const allocation = [...bySector.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sector, value]) => ({
      sector,
      value,
      pct: totalValue !== 0 ? (value / totalValue) * 100 : 0,
    }));

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-meta">
        Computed live from Portfolio · {holdings.length} open position{holdings.length === 1 ? "" : "s"}
        {generatedAt ? ` · data synced ${new Date(generatedAt).toLocaleString("en-US")}` : ""}
      </p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value">{money(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost Basis</div>
          <div className="stat-value">{money(totalCost)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized Gain</div>
          <div className={`stat-value ${totalGain >= 0 ? "gain" : "loss"}`}>
            {totalGain >= 0 ? "+" : ""}
            {money(totalGain)} ({totalGainPct >= 0 ? "+" : ""}
            {totalGainPct.toFixed(2)}%)
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today&apos;s Gain</div>
          <div className={`stat-value ${todaysGain >= 0 ? "gain" : "loss"}`}>
            {todaysGain >= 0 ? "+" : ""}
            {money(todaysGain)}
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h2>Allocation by Sector</h2>
        {allocation.length === 0 ? (
          <div className="empty-state">No holdings yet.</div>
        ) : (
          allocation.map((a) => (
            <div className="alloc-row" key={a.sector}>
              <div className="alloc-name">{a.sector}</div>
              <div className="alloc-bar-track">
                <div className="alloc-bar-fill" style={{ width: `${Math.max(a.pct, 2)}%` }} />
              </div>
              <div className="alloc-value">{a.pct.toFixed(1)}%</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
