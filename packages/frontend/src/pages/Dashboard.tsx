import { useState, useEffect } from 'react'
import { PenLine } from 'lucide-react'

interface HealthData {
  status: string
  version: string
  database: string
}

export function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)

  useEffect(() => {
    fetch('/api/writing/health')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHealth(data.data)
        }
      })
      .catch(() => setHealth(null))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-6">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Writing Buddy
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your AI-powered 11+ creative writing coach
          </p>
          {health && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm text-gray-500">
              <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              v{health.version} — {health.database}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
