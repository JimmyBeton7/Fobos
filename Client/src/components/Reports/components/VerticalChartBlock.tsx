import { useEffect, useMemo } from "react";
import { Chart } from "primereact/chart";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { getCurrentMonthRange } from "../helpers/dateHelpers";
import type { TransactionRow, AccountRow } from "../../../../../Electron/types";
import { useReportsState } from "../ReportsStateContext";

type Props = {
  transactions: TransactionRow[];
  accountsById: Record<string, AccountRow>;
};

export default function VerticalChartBlock({
  transactions,
  accountsById,
}: Props) {
  const accounts = useMemo(
    () => Object.values(accountsById) as AccountRow[],
    [accountsById]
  );

  const {
    barDateRange,
    setBarDateRange,
    barSelectedAccountIds,
    setBarSelectedAccountIds,
    barInitialized,
    setBarInitialized,
  } = useReportsState();

  const { start, end } = getCurrentMonthRange();

  useEffect(() => {
    if (!barInitialized && accounts.length) {
      setBarDateRange(barDateRange ?? [start, end]);
      if (!barSelectedAccountIds.length) {
        setBarSelectedAccountIds([String(accounts[0].id)]);
      }
      setBarInitialized(true);
    }
  }, [
    barInitialized,
    accounts,
    barDateRange,
    barSelectedAccountIds.length,
    setBarDateRange,
    setBarSelectedAccountIds,
    setBarInitialized,
    start,
    end,
  ]);

  const dateRange = barDateRange;

  const normalizedSelected = useMemo(
    () =>
      accounts.filter((a) =>
        barSelectedAccountIds.includes(String((a as AccountRow).id))
      ),
    [accounts, barSelectedAccountIds]
  );

  const selectedAccountIds = useMemo(
    () =>
      new Set(
        normalizedSelected.map((a) => String((a as AccountRow).id))
      ),
    [normalizedSelected]
  );

  const { income, expenses } = useMemo(() => {
    let incomeCents = 0;
    let expenseCentsAbs = 0;

    if (!transactions?.length) return { income: 0, expenses: 0 };

    const [rawFrom, rawTo] = dateRange ?? [];
    const from = rawFrom ? new Date(rawFrom) : null;
    const to = rawTo ? new Date(rawTo) : null;

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    if (selectedAccountIds.size === 0) {
      return { income: 0, expenses: 0 };
    }

    for (const t of transactions) {
      const accId = String(
        (t as TransactionRow).account_id
      );
      if (selectedAccountIds.size && !selectedAccountIds.has(accId)) continue;

      const d = new Date(String((t as TransactionRow).date));
      if (from && d < from) continue;
      if (to && d > to) continue;

      const amountCents = Number(
        (t as TransactionRow).amount_cents ?? 0
      );
      const kind: "income" | "expense" | undefined =
        (t as TransactionRow).kind;

      if (kind === "income" || (kind === undefined && amountCents > 0)) {
        incomeCents += Math.max(amountCents, 0);
      } else if (kind === "expense" || (kind === undefined && amountCents < 0)) {
        expenseCentsAbs += Math.abs(amountCents);
      }
    }

    return { income: incomeCents / 100, expenses: expenseCentsAbs / 100 };
  }, [transactions, selectedAccountIds, dateRange]);

  const data = useMemo(
    () => ({
      labels: ["Selected accounts"],
      datasets: [
        {
          label: "Incomes",
          backgroundColor: "#4CAF50",
          data: [Number(income?.toFixed(2))],
        },
        {
          label: "Expenses",
          backgroundColor: "#EF5350",
          data: [Number(expenses?.toFixed(2))],
        },
      ],
    }),
    [income, expenses]
  );

  const options = useMemo(
    () => ({
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#fff" },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              `${ctx.dataset.label}: ${Number(
                ctx.parsed.y ?? ctx.parsed
              ).toLocaleString("pl-PL", {
                style: "currency",
                currency: "PLN",
              })}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    }),
    []
  );

  return (
    <Card title="Incomes vs expenses" className="chart-card">
      <div className="chart-filters2">
        <MultiSelect
          value={normalizedSelected}
          options={accounts}
          onChange={(e) => {
            const arr = Array.isArray(e.value)
              ? e.value
              : e.value
                ? [e.value]
                : [];
            setBarSelectedAccountIds(
              arr.map((a: AccountRow) =>
                String((a as AccountRow).id ?? a.id)
              )
            );
          }}
          optionLabel="name"
          placeholder="Select account(s)"
          className="charts-multiselect"
          display="chip"
          maxSelectedLabels={1}
        />
        <Calendar
          value={dateRange}
          onChange={(e) =>
            setBarDateRange(e.value as Date[] | null)
          }
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          placeholder="Select date range"
          className="charts-calendar"
          dateFormat="dd/mm/yy"
        />
      </div>

      <div className="vertical-container">
        <Chart
          type="bar"
          data={data}
          options={options}
          style={{ height: "100%" }}
        />
      </div>
    </Card>
  );
}
