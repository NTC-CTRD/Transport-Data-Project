interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-800">
        {title}
      </h1>

      <p className="text-slate-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}