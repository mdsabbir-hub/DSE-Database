import { formatCell, cellTone } from "@/lib/format";

export default function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0) {
    return <div className="empty-state">No records in this dataset yet.</div>;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  const tone = cellTone(col, row[col]);
                  const toneClass = tone === "gain" ? "cell-gain" : tone === "loss" ? "cell-loss" : "";
                  return (
                    <td key={col} className={toneClass}>
                      {formatCell(col, row[col])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row-count">{rows.length.toLocaleString()} record{rows.length === 1 ? "" : "s"}</div>
    </>
  );
}
