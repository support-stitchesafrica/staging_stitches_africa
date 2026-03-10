"use client"

import { useState } from "react"

interface TailorFormProps {
  tailor: any
  onSave: (updates: any) => void
}

const TailorForm = ({ tailor, onSave }: TailorFormProps) => {
  const [formData, setFormData] = useState({
    brand_name: tailor.brand_name || "",
    first_name: tailor.first_name || "",
    last_name: tailor.last_name || "",
    email: tailor.email || "",
    wallet: tailor.wallet || 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium">Brand Name</label>
        <input
          type="text"
          name="brand_name"
          value={formData.brand_name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Wallet</label>
        <input
          type="number"
          name="wallet"
          value={formData.wallet}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded p-2"
        />
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Save Changes
      </button>
    </form>
  )
}

export default TailorForm
