interface MetricCardProps {
  title: string
  value: string | number
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </h2>
    </div>
  )
}

export default MetricCard
