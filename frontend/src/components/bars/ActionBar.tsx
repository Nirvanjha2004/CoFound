import { useState } from 'react'
import { Bot, RefreshCw } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAgentActions } from '@/hooks/useAgentActions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ActionBar() {
  const { todayPriority, setTodayPriority, workspace, setExportOpen, setSelectedNodeId } = useWorkspaceStore()
  const { fetchPriority, handoffToOrchestrator } = useAgentActions()
  const { fetchWorkspace } = useWorkspace()
  const [refreshing, setRefreshing] = useState(false)
  const [handingOff, setHandingOff] = useState(false)
  const [handoffError, setHandoffError] = useState<string | null>(null)
  const stageReady = ['revenue', 'product_vision', 'tech_stack'].every(
    (type) => (workspace?.nodes.find((node) => node.type === type)?.confidence ?? 0) >= 70,
  )

  const handleRefreshPriority = async () => {
    if (!workspace?.idea_id) return
    setRefreshing(true)
    try {
      const next = await fetchPriority(workspace.idea_id)
      setTodayPriority(next)
    } finally {
      setRefreshing(false)
    }
  }

  const handleHandoff = async () => {
    if (!workspace?.idea_id) return
    setHandingOff(true)
    setHandoffError(null)
    try {
      await handoffToOrchestrator(workspace.idea_id)
      await fetchWorkspace(workspace.idea_id)
      setSelectedNodeId(null)
    } catch (error) {
      setHandoffError(error instanceof Error ? error.message : 'Failed to hand off to orchestrator')
    } finally {
      setHandingOff(false)
    }
  }

  const targetNode = todayPriority.nodeId
    ? workspace?.nodes.find((node) => node.node_id === todayPriority.nodeId)
    : workspace?.nodes.find((node) => node.type === todayPriority.nodeType)
  const canHandoff = Boolean(
    workspace?.idea_id && targetNode && targetNode.status !== 'locked' && targetNode.active_agents.length === 0,
  )

  return (
    <footer
      className="shell-panel flex min-h-12 shrink-0 items-center justify-between gap-4 border-t border-border bg-card px-4 py-2.5"
      data-onboarding="priority"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Today&apos;s Priority
          {todayPriority.estimatedTime ? (
            <span className="ml-2 font-normal normal-case tracking-normal">
              · ~{todayPriority.estimatedTime}
            </span>
          ) : null}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{todayPriority.action}</p>
        {todayPriority.reason ? (
          <p className="mt-0.5 hidden truncate text-xs text-muted-foreground md:block">{todayPriority.reason}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {handoffError && (
          <span className="hidden max-w-[180px] truncate text-xs text-destructive lg:inline">{handoffError}</span>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void handleRefreshPriority()}
          disabled={refreshing || !workspace}
        >
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing…' : 'Refresh priority'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void handleHandoff()}
          disabled={handingOff || !canHandoff}
        >
          <Bot className="size-3.5" />
          {handingOff ? 'Handing off…' : 'Handoff'}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setExportOpen(true)}
          disabled={!workspace || !stageReady}
          title={
            stageReady
              ? 'Export scaffold package'
              : 'Unlock when revenue, product vision, and tech stack each reach 70% confidence'
          }
        >
          Export
        </Button>
      </div>
    </footer>
  )
}
