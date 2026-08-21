import {
  Bot,
  GitBranch,
  History,
  LineChart,
  MessageSquare,
  Plus,
  Settings,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useAgentActions } from '@/hooks/useAgentActions'
import { useGoHome } from '@/hooks/useGoHome'
import { INTEGRATION_CATALOG, mergeIntegrationStatus } from '@/config/integrations'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { IntegrationConnectDialog } from '@/components/integrations/IntegrationConnectDialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { IntegrationInfo } from '@/types'

export function LeftRail() {
  const goHome = useGoHome()
  const {
    workspace,
    agents,
    integrations,
    selectedNodeId,
    setSelectedNodeId,
    setJournalOpen,
    setSettingsOpen,
    setIntegrations,
    integrationDialogId,
    setIntegrationDialogId,
  } = useWorkspaceStore()
  const { fetchIntegrations } = useAgentActions()

  const connectTarget = useMemo(
    () => integrations.find((i) => i.id === integrationDialogId) ?? null,
    [integrations, integrationDialogId],
  )

  useEffect(() => {
    if (!workspace?.idea_id) return
    void fetchIntegrations(workspace.idea_id)
      .then((status) => {
        setIntegrations(mergeIntegrationStatus(INTEGRATION_CATALOG.map((i) => ({ ...i })), status))
      })
      .catch(() => {})
  }, [workspace?.idea_id, fetchIntegrations, setIntegrations])

  const handleIntegrationClick = (integration: IntegrationInfo) => {
    if (integration.id === 'github' || integration.id === 'posthog') {
      setIntegrationDialogId(integration.id)
      return
    }
    // Reddit is automatic research tooling — open settings for context instead of a fake connect dialog.
    if (integration.id === 'reddit') {
      setSettingsOpen(true)
    }
  }

  const orchestrator = agents.find((a) => a.id === 'orchestrator')
  const subAgents = agents.filter((a) => a.parentId === 'orchestrator')

  const agentStatusDot = (status: 'active' | 'idle' | 'offline') =>
    cn(
      'size-1.5 shrink-0 rounded-full',
      status === 'active' && 'bg-status-validated',
      status === 'idle' && 'bg-status-needs-work',
      status === 'offline' && 'bg-muted',
    )

  return (
    <>
      <aside className="shell-panel flex h-full w-[200px] shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-3 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={goHome}
          >
            <Plus className="size-3" />
            New Project
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Agents</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {orchestrator && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className={cn(
                    'flex items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors',
                    selectedNodeId === null
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  <span className="text-xs font-medium">{orchestrator.name}</span>
                  <span className={agentStatusDot(orchestrator.status)} aria-label={orchestrator.status} />
                </button>
              )}
              {subAgents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => agent.node_id && setSelectedNodeId(agent.node_id)}
                  className={cn(
                    'flex items-center justify-between rounded-md py-1.5 pl-5 pr-2 text-left transition-colors',
                    selectedNodeId === agent.node_id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  <span className="text-xs">{agent.name}</span>
                  <span className={agentStatusDot(agent.status)} aria-label={agent.status} />
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="p-3" data-onboarding="integrations">
            <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Integrations
            </p>
            <div className="flex flex-col gap-1.5">
              {integrations.map((int) => (
                <IntegrationRow
                  key={int.id}
                  label={int.label}
                  connected={int.connected}
                  status={int.status}
                  icon={getIntegrationIcon(int.id)}
                  onClick={() => handleIntegrationClick(int)}
                />
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border p-2">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 justify-start gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setJournalOpen(true)}
            >
              <History className="size-3.5" />
              Journal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 justify-start gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-3.5" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      <IntegrationConnectDialog
        integration={connectTarget}
        open={!!integrationDialogId && !!connectTarget}
        onOpenChange={(open) => {
          if (!open) setIntegrationDialogId(null)
        }}
      />
    </>
  )
}

function getIntegrationIcon(id: string) {
  switch (id) {
    case 'github':
      return GitBranch
    case 'posthog':
      return LineChart
    case 'reddit':
      return MessageSquare
    default:
      return GitBranch
  }
}

function IntegrationRow({
  icon: Icon,
  label,
  connected,
  status,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  connected: boolean
  status: IntegrationInfo['status']
  onClick: () => void
}) {
  const isReady = status === 'connected' || label === 'Reddit'
  const statusLabel = label === 'Reddit'
    ? connected
      ? 'Ready'
      : 'Optional'
    : connected
      ? 'Connected'
      : 'Connect'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{statusLabel}</span>
        <span
          className={cn('size-1.5 rounded-full', isReady && connected ? 'bg-status-validated' : 'bg-border')}
          aria-label={statusLabel}
        />
      </div>
    </button>
  )
}
