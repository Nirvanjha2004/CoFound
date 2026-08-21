import type { IntegrationInfo } from '@/types'

/** Only ship integrations that are actually connectable in-product. */
export const INTEGRATION_CATALOG: IntegrationInfo[] = [
  {
    id: 'github',
    label: 'GitHub',
    connected: false,
    status: 'available',
    description: 'Connect your repository so agents can track commits and unlock the Build node.',
    unlocks: 'Build node',
  },
  {
    id: 'posthog',
    label: 'PostHog',
    connected: false,
    status: 'available',
    description: 'Connect analytics to monitor funnel drops and unlock the Observe node.',
    unlocks: 'Observe node',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    connected: false,
    status: 'available',
    description: 'Community research runs automatically when a node needs Reddit evidence. No OAuth setup required.',
  },
]

export function mergeIntegrationStatus(
  catalog: IntegrationInfo[],
  status: { github: boolean; posthog: boolean; reddit: boolean },
): IntegrationInfo[] {
  return catalog.map((item) => {
    if (item.id === 'github') {
      return { ...item, connected: status.github, status: status.github ? 'connected' : 'available' }
    }
    if (item.id === 'posthog') {
      return { ...item, connected: status.posthog, status: status.posthog ? 'connected' : 'available' }
    }
    if (item.id === 'reddit') {
      // Reddit is a research tool, not a user OAuth connection — show as ready when backend reports it.
      return {
        ...item,
        connected: status.reddit,
        status: status.reddit ? 'connected' : 'available',
      }
    }
    return item
  })
}
