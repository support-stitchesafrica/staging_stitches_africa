export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application settings and preferences</p>
      </div>

      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Settings Coming Soon</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced settings and configuration options will be available here.
        </p>
      </div>
    </div>
  )
}
