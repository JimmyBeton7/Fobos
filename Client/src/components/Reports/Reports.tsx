import React, { useEffect, useMemo, useState } from "react";
import PieChartBlock from "./components/PieChartBlock";
import VerticalChartBlock from "./components/VerticalChartBlock";
import YearlyVerticalChartBlock from "./components/YearlyVerticalChartBlock";
import "./Reports.styles.css";
import { api } from "../../api";
import type { AccountRow, CategoryRow, TransactionRow } from '../../../../Electron/types';
import { ProgressSpinner } from "primereact/progressspinner";

export default function Reports() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [acc, cat, trx] = await Promise.all([
          api.accounts.list(),
          api.categories.list(),
          api.transactions.listAll(),
        ]);
        if (!mounted) return;
        setAccounts(acc);
        setCategories(cat);
        setTransactions(trx);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load reports data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const accountsById = useMemo(() => {
    const m: Record<string, AccountRow> = {};
    for (const a of accounts) m[String((a as AccountRow).id ?? a.id)] = a;
    return m;
  }, [accounts]);

  const categoriesById = useMemo(() => {
    const m: Record<string, CategoryRow> = {};
    for (const c of categories) m[String((c as CategoryRow).id ?? c.id)] = c;
    return m;
  }, [categories]);

  if (loading) {
    return <div className="charts-page"><div><ProgressSpinner aria-label="Loading" /></div></div>;
  }
  if (error) {
    return <div className="charts-page"><div style={{ color: "tomato" }}>{error}</div></div>;
  }

  return (
    <div className="charts-page">
      <PieChartBlock
        transactions={transactions}
        accountsById={accountsById}
        categoriesById={categoriesById}
      />
      <VerticalChartBlock
        transactions={transactions}
        accountsById={accountsById}
      />
      <YearlyVerticalChartBlock
        transactions={transactions}
        categoriesById={categoriesById}
      />
    </div>
  );
}
