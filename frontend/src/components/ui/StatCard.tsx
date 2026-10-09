interface StatCardProps {
  title: string;
  value: number | string;
}

export default function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <p className="text-slate-500 text-sm">{title}</p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>
    </div>
  );
}