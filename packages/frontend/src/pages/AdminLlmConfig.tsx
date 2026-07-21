import { useState, useEffect, useCallback } from 'react'
import { toast } from '../components/toast-store'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../services/api'
import type { LlmConfigData, LlmProvider, LlmCatalogEntry } from '../services/api'
import {
  Cpu,
  Plus,
  Trash2,
  Loader2,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react'

const FEATURE_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  scoring: 'Rubric Scoring',
  apply_suggestions: 'Apply Suggestions',
  category_suggestions: 'Category Suggestions',
  prompt_generation: 'Prompt Generation',
}

export function AdminLlmConfig() {
  const [data, setData] = useState<LlmConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Provider add modal
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedCatalog, setSelectedCatalog] = useState<LlmCatalogEntry | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [adding, setAdding] = useState(false)

  // Custom provider fields
  const [customName, setCustomName] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [customModels, setCustomModels] = useState('')

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<LlmProvider | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Feature config saving
  const [savingConfig, setSavingConfig] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await api.getLlmConfig()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Provider actions ──

  const handleAddProvider = async () => {
    if (!selectedCatalog) return
    setAdding(true)
    try {
      const payload: { catalogId: string; apiKey: string; name?: string; baseUrl?: string; models?: string[] } = {
        catalogId: selectedCatalog.id,
        apiKey: apiKeyInput,
      }
      if (selectedCatalog.id === 'custom') {
        if (!customName || !customBaseUrl || !customModels.trim()) {
          toast('Custom providers need name, base URL, and models', 'error')
          setAdding(false)
          return
        }
        payload.name = customName
        payload.baseUrl = customBaseUrl
        payload.models = customModels.split(',').map(m => m.trim()).filter(Boolean)
      }
      await api.createLlmProvider(payload)
      toast('Provider added!', 'success')
      resetAddForm()
      await fetchData()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add provider', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteProvider = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteLlmProvider(deleteTarget.id)
      toast('Provider removed', 'success')
      setDeleteTarget(null)
      await fetchData()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateConfig = async (configId: string, updates: {
    providerId?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }) => {
    setSavingConfig(configId)
    try {
      await api.updateLlmFeatureConfig(configId, updates)
      toast('Configuration updated!', 'success')
      await fetchData()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error')
    } finally {
      setSavingConfig(null)
    }
  }

  const resetAddForm = () => {
    setShowAddProvider(false)
    setSelectedCatalog(null)
    setApiKeyInput('')
    setShowKey(false)
    setCustomName('')
    setCustomBaseUrl('')
    setCustomModels('')
  }

  // ── Helpers ──

  const getModelsForConfig = (config: api.LlmFeatureConfig): string[] => {
    const provider = data?.providers.find(p => p.id === config.providerId)
    return provider?.models ?? [config.model]
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-warm-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-clay-static p-5 animate-pulse">
              <div className="h-5 bg-warm-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-warm-100 rounded w-full mb-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchData} className="text-red-600 font-semibold hover:underline cursor-pointer">Retry</button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-7 h-7 text-violet" />
          <h1 className="font-display text-3xl text-warm-800 tracking-wider uppercase">LLM Configuration</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddProvider(true)}
          className="btn-manga flex items-center gap-2 h-12 px-5 bg-violet text-white cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Provider
        </button>
      </div>

      {/* Providers Section */}
      <section>
        <h2 className="font-display text-xl text-warm-700 mb-3 tracking-wider uppercase">Providers</h2>
        {data.providers.length === 0 ? (
          <div className="card-clay-static p-6 text-center text-warm-500">
            <p>No providers configured.</p>
            <p className="text-sm mt-1">Add a provider to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.providers.map(provider => (
              <div key={provider.id} className="card-clay-static p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-warm-800 text-lg uppercase tracking-wide">{provider.name}</h3>
                    <span className="badge-manga text-xs bg-violet-50 text-violet mt-1 inline-block">
                      {provider.adapter}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(provider)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-warm-400 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${provider.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-1 text-sm text-warm-500">
                  <p className="truncate">URL: {provider.baseUrl}</p>
                  <p className="flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {provider.apiKeyMasked}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {provider.models.map(m => (
                      <span key={m} className="badge-manga text-xs bg-warm-100 text-warm-600">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Assignment Section */}
      <section>
        <h2 className="font-display text-xl text-warm-700 mb-3 tracking-wider uppercase">Feature Assignment</h2>
        <div className="card-clay-static overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-warm-200 text-left">
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs">Feature</th>
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs">Provider</th>
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs">Model</th>
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs">Temp</th>
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs">Max Tokens</th>
                <th className="py-3 px-4 text-warm-500 font-semibold uppercase text-xs" />
              </tr>
            </thead>
            <tbody>
              {data.configs.map(config => {
                const models = getModelsForConfig(config)
                return (
                  <tr key={config.id} className="border-b border-warm-100">
                    <td className="py-3 px-4 font-semibold text-warm-700">
                      {FEATURE_LABELS[config.feature] ?? config.feature}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={config.providerId}
                        onChange={e => {
                          const newProvider = data.providers.find(p => p.id === e.target.value)
                          const newModels = newProvider?.models ?? []
                          handleUpdateConfig(config.id, {
                            providerId: e.target.value,
                            model: newModels[0] ?? config.model,
                          })
                        }}
                        className="w-full h-10 px-3 rounded-[8px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm cursor-pointer"
                        disabled={savingConfig === config.id}
                      >
                        {data.providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={config.model}
                        onChange={e => handleUpdateConfig(config.id, { model: e.target.value })}
                        className="w-full h-10 px-3 rounded-[8px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm cursor-pointer"
                        disabled={savingConfig === config.id}
                      >
                        {models.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={config.temperature}
                        onChange={e => handleUpdateConfig(config.id, { temperature: parseFloat(e.target.value) || 0 })}
                        className="w-20 h-10 px-2 rounded-[8px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm"
                        min={0}
                        max={2}
                        step={0.1}
                        disabled={savingConfig === config.id}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={e => handleUpdateConfig(config.id, { maxTokens: parseInt(e.target.value) || 100 })}
                        className="w-24 h-10 px-2 rounded-[8px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm"
                        min={1}
                        max={32000}
                        disabled={savingConfig === config.id}
                      />
                    </td>
                    <td className="py-3 px-4">
                      {savingConfig === config.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-violet" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={resetAddForm}>
          <div className="bg-white rounded-[16px] border-3 border-ink shadow-[6px_6px_0_var(--color-ink)] p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl text-warm-800 mb-4 uppercase tracking-wider">Add Provider</h3>

            {/* Catalog picker */}
            <label className="block text-sm font-semibold text-warm-700 mb-1">
              Select Provider
            </label>
            <select
              value={selectedCatalog?.id ?? ''}
              onChange={e => {
                const entry = data.catalog.find(c => c.id === e.target.value)
                setSelectedCatalog(entry ?? null)
                if (entry && entry.id !== 'custom') {
                  setCustomName('')
                  setCustomBaseUrl('')
                  setCustomModels('')
                }
              }}
              className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none cursor-pointer mb-4"
            >
              <option value="">Choose...</option>
              {data.catalog.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {selectedCatalog && selectedCatalog.id !== 'custom' && (
              <div className="space-y-3 mb-4">
                <div className="text-sm text-warm-500">
                  <span className="font-semibold text-warm-600">URL:</span> {selectedCatalog.baseUrl}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedCatalog.models.map(m => (
                    <span key={m} className="badge-manga text-xs bg-violet-50 text-violet">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedCatalog?.id === 'custom' && (
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Provider name (e.g. My Local LLM)"
                  className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm"
                />
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder="Base URL (e.g. https://api.example.com/v1)"
                  className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm"
                />
                <input
                  type="text"
                  value={customModels}
                  onChange={e => setCustomModels(e.target.value)}
                  placeholder="Models (comma-separated)"
                  className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none text-sm"
                />
              </div>
            )}

            {selectedCatalog && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-warm-700 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="w-full h-12 px-4 pr-10 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-violet outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddProvider}
                disabled={adding || !selectedCatalog || !apiKeyInput}
                className="btn-manga flex items-center gap-2 h-12 px-5 bg-violet text-white disabled:opacity-50 cursor-pointer"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                {adding ? 'Adding...' : 'Add Provider'}
              </button>
              <button
                type="button"
                onClick={resetAddForm}
                className="btn-manga h-12 px-5 bg-white text-warm-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this provider?"
        message={`"${deleteTarget?.name}" will be removed. Any features using it will need to be reassigned.`}
        confirmLabel={deleting ? 'Removing...' : 'Remove'}
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleDeleteProvider}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
