export type SubscriptionPlan = 'free' | 'writing' | 'vocab' | 'bundle' | 'family'
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  features: string[]
  expiresAt: string
  billingProvider?: 'stripe' | 'apple' | 'google'
}

export interface FeatureGate {
  feature: string
  requiredPlan: SubscriptionPlan[]
  trialAllowed: boolean
  limit?: number
}
