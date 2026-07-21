import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import { LlmConfigStore } from '../services/llm/llm-config-store.js'
import { PROVIDER_CATALOG } from '../services/llm/llm-provider-catalog.js'
import { logger } from '../services/logger.js'

const createProviderSchema = z.object({
  catalogId: z.string().min(1),
  apiKey: z.string().min(1),
  name: z.string().optional(),
  baseUrl: z.string().optional(),
  models: z.array(z.string()).optional(),
})

const updateProviderSchema = z.object({
  apiKey: z.string().min(1).optional(),
})

const updateConfigSchema = z.object({
  providerId: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
})

export function createAdminLlmConfigRouter(store: LlmConfigStore): Router {
  const router = Router()

  // All routes are admin-only
  router.use(requireAdmin)

  // GET / — list catalog, providers, and configs
  router.get('/', (_req: Request, res: Response) => {
    try {
      const providers = store.listProviders()
      const configs = store.listConfigs()

      res.json({
        success: true,
        data: {
          catalog: PROVIDER_CATALOG.map((entry) => ({
            id: entry.id,
            name: entry.name,
            adapter: entry.adapter,
            baseUrl: entry.baseUrl,
            models: entry.models,
          })),
          providers,
          configs,
        },
      })
    } catch (error) {
      logger.error('Failed to list LLM config', { error: String(error) })
      res.status(500).json({ success: false, error: 'Failed to load LLM configuration' })
    }
  })

  // POST /providers — add a provider from catalog
  router.post('/providers', (req: Request, res: Response) => {
    try {
      const parsed = createProviderSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const { catalogId, apiKey, name, baseUrl, models } = parsed.data

      // If custom provider, name/baseUrl/models are required
      if (catalogId === 'custom') {
        if (!name || !baseUrl) {
          res.status(400).json({
            success: false,
            error: 'Custom providers require name and baseUrl',
          })
          return
        }
      }

      // For catalog providers, get details from catalog
      const catalogEntry = PROVIDER_CATALOG.find((e) => e.id === catalogId)
      const providerName = name ?? catalogEntry?.name ?? catalogId
      const providerUrl = baseUrl ?? catalogEntry?.baseUrl ?? ''
      const adapter = catalogEntry?.adapter ?? 'openai-compatible'

      const provider = store.createProvider({
        catalogId,
        name: providerName,
        adapter,
        baseUrl: providerUrl,
        apiKey,
        customModels: catalogId === 'custom' ? models : undefined,
      })

      logger.info('LLM provider added', { action: 'llm_provider_added', catalogId, providerId: provider.id })

      res.status(201).json({ success: true, data: provider })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add provider'
      logger.error('Failed to add LLM provider', { error: message })
      res.status(500).json({ success: false, error: message })
    }
  })

  // PUT /providers/:id — update provider (API key)
  router.put('/providers/:id', (req: Request, res: Response) => {
    try {
      const parsed = updateProviderSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const provider = store.updateProvider(req.params.id as string, parsed.data)
      if (!provider) {
        res.status(404).json({ success: false, error: 'Provider not found' })
        return
      }

      res.json({ success: true, data: provider })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update provider'
      logger.error('Failed to update LLM provider', { error: message })
      res.status(500).json({ success: false, error: message })
    }
  })

  // DELETE /providers/:id — remove provider
  router.delete('/providers/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteProvider(req.params.id as string)
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Provider not found' })
        return
      }
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete provider'
      logger.error('Failed to delete LLM provider', { error: message })

      if (message.includes('still used by features')) {
        res.status(409).json({ success: false, error: message })
        return
      }

      res.status(500).json({ success: false, error: message })
    }
  })

  // PUT /configs/:id — update feature config
  router.put('/configs/:id', (req: Request, res: Response) => {
    try {
      const parsed = updateConfigSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const config = store.updateFeatureConfig(req.params.id as string, parsed.data)
      if (!config) {
        res.status(404).json({ success: false, error: 'Config not found' })
        return
      }

      res.json({ success: true, data: config })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update config'
      logger.error('Failed to update LLM feature config', { error: message })
      res.status(500).json({ success: false, error: message })
    }
  })

  return router
}
