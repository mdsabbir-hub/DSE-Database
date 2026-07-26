import { getTableData } from "@/lib/data";
import DataTable from "@/components/DataTable";

export const dynamic = "force-static";

export default function TransactionsPage() {
  const { columns, rows } = getTableData("03-transactions");
  return (
    <>
      <h1 className="page-title">Transactions</h1>
      <p className="page-meta">Buy / sell history</p>
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
