import { useEffect, useMemo } from "react";
import { Chart } from "primereact/chart";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { getCurrentMonthRange } from "../helpers/dateHelpers";
import type {
  TransactionRow,
  AccountRow,
  CategoryRow,
} from "../../../../../Electron/types";
import { useReportsState } from "../ReportsStateContext";

type Props = {
  transactions: TransactionRow[];
  accountsById: Record<string, AccountRow>;
  categoriesById: Record<string, CategoryRow>;
};

export default function PieChartBlock({
  transactions,
  accountsById,
  categoriesById,
}: Props) {
  const accounts = useMemo(
    () => Object.values(accountsById) as AccountRow[],
    [accountsById]
  );

  const {
    pieDateRange,
    setPieDateRange,
    pieSelectedAccountIds,
    setPieSelectedAccountIds,
    pieInitialized,
    setPieInitialized,
  } = useReportsState();

  const { start, end } = getCurrentMonthRange();

  useEffect(() => {
    if (!pieInitialized && accounts.length) {
      setPieDateRange(pieDateRange ?? [start, end]);
      if (!pieSelectedAccountIds.length) {
        setPieSelectedAccountIds([String(accounts[0].id)]);
      }
      setPieInitialized(true);
    }
  }, [
    pieInitialized,
    accounts,
    pieDateRange,
    pieSelectedAccountIds.length,
    setPieDateRange,
    setPieSelectedAccountIds,
    setPieInitialized,
    start,
    end,
  ]);

  const dateRange = pieDateRange;

  const normalizedSelected = useMemo(
    () =>
      accounts.filter((a) =>
        pieSelectedAccountIds.includes(String((a as AccountRow).id ?? a.id))
      ),
    [accounts, pieSelectedAccountIds]
  );

  const selectedAccountIds = useMemo(
    () =>
      new Set(
        normalizedSelected.map((a) => String((a as AccountRow).id ?? a.id))
      ),
    [normalizedSelected]
  );

  const { labels, amounts, colors } = useMemo(() => {
    if (!transactions?.length) {
      return { labels: [], amounts: [], colors: [] };
    }

    const [rawFrom, rawTo] = dateRange ?? [];
    const from = rawFrom ? new Date(rawFrom) : null;
    const to = rawTo ? new Date(rawTo) : null;

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    const sums = new Map<string, number>();

    if (selectedAccountIds.size === 0) {
      return { labels: [], amounts: [], colors: [] };
    }

    for (const t of transactions) {
      const accId = String(
        (t as TransactionRow).account_id
      );
      const catId = String(
        (t as TransactionRow).own_category_id
      );
      const amountCents = Number(
        (t as TransactionRow).amount_cents ?? 0
      );
      const type = (t as TransactionRow).kind;
      const dateVal = new Date(String((t as TransactionRow).date));

      if (selectedAccountIds.size && !selectedAccountIds.has(accId)) continue;
      if (from && dateVal < from) continue;
      if (to && dateVal > to) continue;
      if (type !== "expense") continue;

      const val = amountCents / 100;
      sums.set(catId, (sums.get(catId) ?? 0) + val);
    }

    const outLabels: string[] = [];
    const outAmounts: number[] = [];
    const outColors: string[] = [];

    for (const [catId, sum] of sums.entries()) {
      const cat = categoriesById[catId];
      if (!cat) continue;
      const name = (cat as CategoryRow).name ?? `Category ${catId}`;
      const color = (cat as CategoryRow).color_hex ?? "#888888";

      outLabels.push(name);
      outAmounts.push(Number(sum.toFixed(2)));
      outColors.push(color);
    }

    return { labels: outLabels, amounts: outAmounts, colors: outColors };
  }, [transactions, selectedAccountIds, dateRange, categoriesById]);

  const data = useMemo(() => {
    if (!labels.length || !amounts.length) {
      return {
        labels: ["No data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#555555"],
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
        },
      ],
    };
  }, [labels, amounts, colors]);

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#fff" },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const label = ctx.label ?? "";
              const val = ctx.parsed ?? 0;
              return `${label}: ${val.toLocaleString("pl-PL", {
                style: "currency",
                currency: "PLN",
              })}`;
            },
          },
        },
      },
    }),
    []
  );

  return (
    <Card title="Expenses by categories" className="chart-card">
      <div className="chart-filters">
        <MultiSelect
          value={normalizedSelected}
          options={accounts}
          onChange={(e) => {
            const arr = Array.isArray(e.value)
              ? e.value
              : e.value
                ? [e.value]
                : [];
            setPieSelectedAccountIds(
              arr.map((a: AccountRow) =>
                String((a as any).id ?? a.id)
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
            setPieDateRange(e.value as Date[] | null)
          }
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          placeholder="Select date range"
          dateFormat="dd/mm/yy"
          className="charts-calendar"
        />
      </div>

      <div className="pie-container">
        <Chart
          type="pie"
          data={data}
          options={options}
          style={{ height: "100%" }}
        />
      </div>
    </Card>
  );
}
