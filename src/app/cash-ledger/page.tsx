import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function CashLedgerPage() {
  const { columns, rows } = getTableData("07-cash-ledger");
  return (
    <>
      <h1 className="page-title">Cash Ledger</h1>
      <p className="page-meta">Deposits, withdrawals, and running balance</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
