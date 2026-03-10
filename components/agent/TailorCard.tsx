import Link from "next/link"

interface TailorCardProps {
  tailor: any
  onDisable: () => void
}

const TailorCard = ({ tailor, onDisable }: TailorCardProps) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between hover:shadow-xl transition">
      <div>
        <img
          src={tailor.brand_logo || "/placeholder.png"}
          alt={tailor.brand_name}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-lg font-semibold text-center">{tailor.brand_name}</h2>
        <p className="text-sm text-gray-500 text-center">
          {tailor.first_name} {tailor.last_name}
        </p>
        <p className="text-sm text-gray-400 text-center">Role: {tailor.role}</p>
        <p className="text-sm text-gray-400 text-center">Wallet: ${tailor.wallet}</p>
      </div>
      <div className="flex justify-between mt-4">
        <Link
          href={`/tailors/${tailor.uid}`}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          View
        </Link>
        <button
          onClick={onDisable}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Disable
        </button>
      </div>
    </div>
  )
}

export default TailorCard
