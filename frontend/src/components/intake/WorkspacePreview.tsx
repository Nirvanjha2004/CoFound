// the whole idea to mrr scroll story
// prompt then agents then workspace then plan then mint traction

import { useRef } from 'react'
import { CheckCircle2, ChevronRight, Compass, Lightbulb, Search, Trophy, TrendingUp } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { STORY_COPY } from '@/components/intake/workspace-story/storyCopy'

const icons = {
  researcher: Search,
  validator: Lightbulb,
  builder: Compass,
} as const

const sceneNames = ['Your idea', 'Agents', 'Evidence', 'Plan', 'Growth'] as const

// tiny helper so gsap can count validation build and mrr up
function countProxy(target: Element | null, format: (value: number) => string) {
  const proxy = {
    value: 0,
    update() {
      if (target) target.textContent = format(proxy.value)
    },
  }
  return proxy
}

export function WorkspacePreview() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const scope = root.current
      if (!scope) return

      const q = gsap.utils.selector(scope)
      const chartEl = q('[data-story-chart]')[0]
      const chart = chartEl instanceof SVGGeometryElement ? chartEl : null
      const chartLength = chart?.getTotalLength() ?? 0
      const validation = q('[data-metric="validation"]')[0] ?? null
      const build = q('[data-metric="build"]')[0] ?? null
      const mrr = q('[data-metric="mrr"]')[0] ?? null
      const progress = q('[data-story-progress]')[0] ?? null
      const navItems = Array.from(q('[data-workspace-nav]')) as HTMLElement[]
      const agentCopy = Array.from(q('[data-agent-copy]')) as HTMLElement[]
      const connectPaths = Array.from(q('[data-connect]')) as unknown as SVGPathElement[]
      const stageEl = q('[data-story="stage"]')[0] as HTMLElement | undefined
      const workspaceEl = q('[data-story="workspace"]')[0] as HTMLElement | undefined
      const mm = gsap.matchMedia()

      // draw the bezier lines from each agent into the workspace hub
      const layoutConnectors = () => {
        if (!stageEl || !workspaceEl || connectPaths.length === 0) return
        const stageBox = stageEl.getBoundingClientRect()
        const workspaceBox = workspaceEl.getBoundingClientRect()
        const endX = workspaceBox.left - stageBox.left + 2
        const endY = workspaceBox.top - stageBox.top + workspaceBox.height * 0.5
        const hub = q('[data-connect-hub]')[0] as unknown as SVGCircleElement | undefined
        if (hub) {
          hub.setAttribute('cx', `${endX}`)
          hub.setAttribute('cy', `${endY}`)
        }

        for (const path of connectPaths) {
          const agent = q(`[data-agent="${path.dataset.connect}"]`)[0] as HTMLElement | undefined
          if (!agent) continue
          const agentBox = agent.getBoundingClientRect()
          const startX = agentBox.right - stageBox.left
          const startY = agentBox.top - stageBox.top + agentBox.height * 0.5
          const bend = Math.max(28, (endX - startX) * 0.42)
          path.setAttribute(
            'd',
            `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
          )
        }
      }

      // dashoffset hide until the scrub draws them in
      const prepConnectors = (drawn = false) => {
        layoutConnectors()
        for (const path of connectPaths) {
          const length = path.getTotalLength() || 1
          gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: drawn ? 0 : length,
          })
          if (drawn) path.dataset.drawn = '1'
          else delete path.dataset.drawn
        }
      }

      const setNav = (id: 'overview' | 'research' | 'growth') => {
        for (const item of navItems) {
          item.classList.toggle('is-selected', item.dataset.workspaceNav === id)
        }
      }

      // swap working copy for the done line and settle the pulse
      const setAgentsComplete = (complete: boolean) => {
        for (const el of agentCopy) {
          const agent = STORY_COPY.agents.find((entry) => entry.id === el.dataset.agentCopy)
          if (!agent) continue
          el.textContent = complete ? agent.complete : agent.working
        }
        for (const note of q('[data-agent]')) {
          note.classList.toggle('is-complete', complete)
        }
      }

      // flips the right card copy and tint without stacking a second box again
      const setOutcome = (mode: 'plan' | 'growth') => {
        const copy = STORY_COPY.outcome[mode]
        const card = q('[data-outcome]')[0] as HTMLElement | undefined
        const kicker = q('[data-outcome-kicker]')[0]
        const title = q('[data-outcome-title]')[0]
        const emphasis = q('[data-outcome-emphasis]')[0]
        const footer = q('[data-outcome-footer]')[0]
        if (card) card.dataset.outcomeMode = mode
        if (kicker) kicker.textContent = copy.kicker
        if (title) title.textContent = copy.title
        if (emphasis) emphasis.textContent = copy.emphasis
        if (footer) footer.textContent = copy.footer
        gsap.set(q('[data-outcome-icon="plan"]'), { autoAlpha: mode === 'plan' ? 1 : 0 })
        gsap.set(q('[data-outcome-icon="growth"]'), { autoAlpha: mode === 'growth' ? 1 : 0 })
      }

      // reduced motion jumps straight to the growth end frame and thats there
      const setFinalFrame = () => {
        gsap.set(q('[data-story="prompt"]'), { autoAlpha: 1, y: 0 })
        gsap.set(q('[data-agent]'), { autoAlpha: 1, y: 0 })
        gsap.set(q('[data-story="workspace"]'), { autoAlpha: 1, scale: 1 })
        gsap.set(q('[data-workspace-panel="build"]'), { autoAlpha: 0 })
        gsap.set(q('[data-workspace-panel="growth"]'), { autoAlpha: 1 })
        gsap.set(q('[data-outcome]'), { autoAlpha: 1, x: 0 })
        setOutcome('growth')
        gsap.set(q('[data-story="flow"]'), { autoAlpha: 1, x: 0 })
        gsap.set(q('[data-build-progress]'), { width: `${STORY_COPY.build}%` })
        gsap.set(q('[data-check="first"]'), { autoAlpha: 1 })
        if (validation) validation.textContent = `${STORY_COPY.validation}%`
        if (build) build.textContent = `${STORY_COPY.build}%`
        if (mrr) mrr.textContent = STORY_COPY.mrr
        if (progress) progress.textContent = 'Growth'
        setNav('growth')
        setAgentsComplete(true)
        prepConnectors(true)
        gsap.set(connectPaths, { autoAlpha: 1 })
        gsap.set(q('[data-connect-hub]'), { autoAlpha: 1, scale: 1 })
      }

      mm.add('(prefers-reduced-motion: reduce)', setFinalFrame)

      // desktop pinned scrub through the whole idea to mrr beat
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        prepConnectors(false)
        gsap.set(q('[data-agent]'), { autoAlpha: 0, y: 24 })
        gsap.set(q('[data-story="workspace"]'), { autoAlpha: 0.2, scale: 0.96 })
        gsap.set(q('[data-outcome]'), { autoAlpha: 0, x: 28 })
        gsap.set(q('[data-story="flow"]'), { autoAlpha: 0, x: -10 })
        gsap.set(q('[data-workspace-panel="build"]'), { autoAlpha: 1 })
        gsap.set(q('[data-workspace-panel="growth"]'), { autoAlpha: 0 })
        setOutcome('plan')
        gsap.set(q('[data-build-progress]'), { width: '0%' })
        gsap.set(q('[data-check="first"]'), { autoAlpha: 0 })
        gsap.set(connectPaths, { autoAlpha: 0 })
        gsap.set(q('[data-connect-hub]'), { autoAlpha: 0, scale: 0.6 })
        if (chart) gsap.set(chart, { strokeDasharray: chartLength, strokeDashoffset: chartLength })
        if (validation) validation.textContent = '0%'
        if (build) build.textContent = '0%'
        if (mrr) mrr.textContent = '$0'
        if (progress) progress.textContent = sceneNames[0]
        setNav('overview')
        setAgentsComplete(false)

        const validationProxy = countProxy(validation, (value) => `${Math.round(value)}%`)
        const buildProxy = countProxy(build, (value) => `${Math.round(value)}%`)
        const mrrProxy = countProxy(mrr, (value) => `$${value.toFixed(1)}k`)

        const pinEl = q('[data-story="pin"]')[0]
        const story = gsap.timeline({
          scrollTrigger: {
            trigger: pinEl,
            start: 'top top',
            end: '+=360%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              layoutConnectors()
              for (const path of connectPaths) {
                const length = path.getTotalLength() || 1
                gsap.set(path, { strokeDasharray: length })
              }
            },
            onUpdate: (self) => {
              const index = Math.min(
                sceneNames.length - 1,
                Math.floor(self.progress * sceneNames.length),
              )
              if (progress) progress.textContent = sceneNames[index]

              if (self.progress >= 0.78) setNav('growth')
              else if (self.progress >= 0.28) setNav('research')
              else setNav('overview')

              setAgentsComplete(self.progress >= 0.42)
            },
          },
        })

        const onResize = () => {
          const progressNow = story.progress()
          layoutConnectors()
          for (const path of connectPaths) {
            const length = path.getTotalLength() || 1
            gsap.set(path, { strokeDasharray: length })
          }
          story.progress(progressNow)
        }
        window.addEventListener('resize', onResize)

        story
          .addLabel('prompt')
          .fromTo(
            q('[data-story="prompt"]'),
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
          )
          .to({}, { duration: 0.55 })
          .addLabel('agents-arrive')
          .to(q('[data-agent]'), {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.16,
            ease: 'power2.out',
          })
          .to(connectPaths, { autoAlpha: 1, duration: 0.2 }, '<.2')
          .to({}, { duration: 0.28 })
          .addLabel('workspace-forms')
          .to(q('[data-story="workspace"]'), {
            autoAlpha: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
          })
          .to(
            connectPaths,
            {
              strokeDashoffset: 0,
              duration: 0.85,
              stagger: 0.1,
              ease: 'power1.inOut',
            },
            '<',
          )
          .to(
            q('[data-connect-hub]'),
            { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' },
            '<.45',
          )
          .to(
            chart ?? {},
            { strokeDashoffset: 0, duration: 0.72, ease: 'power1.inOut' },
            '<.12',
          )
          .to({}, { duration: 0.32 })
          .addLabel('evidence-builds')
          .to(validationProxy, {
            value: STORY_COPY.validation,
            duration: 0.55,
            ease: 'none',
            onUpdate: validationProxy.update,
          })
          .to(
            buildProxy,
            {
              value: STORY_COPY.build,
              duration: 0.55,
              ease: 'none',
              onUpdate: buildProxy.update,
            },
            '<',
          )
          .to(
            q('[data-build-progress]'),
            { width: `${STORY_COPY.build}%`, duration: 0.55, ease: 'none' },
            '<',
          )
          .to(q('[data-check="first"]'), { autoAlpha: 1, duration: 0.25 }, '<.28')
          .to({}, { duration: 0.42 })
          .addLabel('plan-forward')
          .to(q('[data-outcome]'), {
            autoAlpha: 1,
            x: 0,
            duration: 0.55,
            ease: 'power2.out',
          })
          .to(q('[data-story="flow"]'), { autoAlpha: 1, x: 0, duration: 0.3 }, '<.16')
          .to({}, { duration: 0.5 })
          .addLabel('profit-mrr')
          .to(q('[data-workspace-panel="build"]'), { autoAlpha: 0, duration: 0.4 })
          .to(q('[data-workspace-panel="growth"]'), { autoAlpha: 1, duration: 0.4 }, '<.08')
          .to(q('[data-outcome]'), { autoAlpha: 0.35, duration: 0.18 }, '<')
          .add(() => setOutcome('growth'))
          .to(q('[data-outcome]'), { autoAlpha: 1, duration: 0.28 })
          .fromTo(
            mrrProxy,
            { value: 0 },
            {
              value: STORY_COPY.mrrValue,
              duration: 0.7,
              ease: 'power1.out',
              onUpdate: mrrProxy.update,
            },
            '<.05',
          )
          .to({}, { duration: 1.05 })

        return () => {
          window.removeEventListener('resize', onResize)
          story.scrollTrigger?.kill()
          story.kill()
        }
      })

      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(q('[data-workspace-panel="build"]'), { autoAlpha: 1 })
        gsap.set(q('[data-workspace-panel="growth"]'), { autoAlpha: 0 })
        setOutcome('plan')
        gsap.set(q('[data-build-progress]'), { width: `${STORY_COPY.build}%` })
        gsap.set(q('[data-check="first"]'), { autoAlpha: 1 })
        if (validation) validation.textContent = `${STORY_COPY.validation}%`
        if (build) build.textContent = `${STORY_COPY.build}%`
        if (mrr) mrr.textContent = STORY_COPY.mrr
        setNav('overview')
        setAgentsComplete(false)

        const mobile = gsap.timeline({
          scrollTrigger: {
            trigger: q('[data-story="stage"]')[0],
            start: 'top 78%',
            end: 'bottom 35%',
            toggleActions: 'play none none reverse',
          },
        })

        mobile
          .from(q('[data-story="prompt"]'), { autoAlpha: 0, y: 12, duration: 0.35 })
          .from(q('[data-agent]'), { autoAlpha: 0, y: 16, duration: 0.35, stagger: 0.1 }, '<.12')
          .from(
            q('[data-story="workspace"]'),
            { autoAlpha: 0, scale: 0.97, duration: 0.45 },
            '<.1',
          )
          .add(() => {
            setNav('research')
            setAgentsComplete(true)
          })
          .from(q('[data-outcome]'), { autoAlpha: 0, y: 14, duration: 0.35 }, '<.18')
          .to(q('[data-workspace-panel="build"]'), { autoAlpha: 0, duration: 0.3 }, '+=0.35')
          .to(q('[data-workspace-panel="growth"]'), { autoAlpha: 1, duration: 0.3 }, '<')
          .add(() => setOutcome('growth'))
          .add(() => {
            setNav('growth')
            if (progress) progress.textContent = 'Growth'
          })

        return () => {
          mobile.scrollTrigger?.kill()
          mobile.kill()
        }
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className="workspace-preview workspace-story"
      aria-labelledby="workspace-preview-title"
    >
      <div className="workspace-story-rail" data-story="rail">
        {/* pin spacer lives around this so the scrub can breathe */}
        <div className="workspace-story-pin" data-story="pin">
          <div className="workspace-preview-heading">
            <h2 id="workspace-preview-title" className="font-display">
              See how your idea comes to life.
            </h2>
            <span>
              Each agent contributes to one workspace, so context stays intact as your startup takes
              shape.
            </span>
            <div className="workspace-story-cue" aria-live="polite">
              <span />
              <strong data-story-progress>Your idea</strong>
            </div>
          </div>

          {/* fake prompt that kicks the whole story off */}
          <div className="workspace-prompt" data-story="prompt">
            <span>Starting point</span>
            <strong>{STORY_COPY.prompt}</strong>
            <b>↵</b>
          </div>

          {/* agents left workspace middle outcome right */}
          <div className="workspace-preview-stage" data-story="stage">
            {/* colored paths get their d from the connector layout helper */}
            <svg className="workspace-connect-map" data-story="connectors" aria-hidden>
              <path data-connect="researcher" />
              <path data-connect="validator" />
              <path data-connect="builder" />
              <circle data-connect-hub className="workspace-connect-hub" r="3.5" />
            </svg>

            <div className="workspace-agent-stack">
              {STORY_COPY.agents.map((agent) => {
                const Icon = icons[agent.id]
                return (
                  <article key={agent.id} data-agent={agent.id} className="workspace-agent-note">
                    <span className="workspace-agent-icon">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <strong>{agent.title}</strong>
                      <p data-agent-copy={agent.id}>{agent.working}</p>
                    </div>
                    <span className="workspace-agent-pulse" aria-hidden />
                  </article>
                )
              })}
            </div>

            {/* mock product chrome build panel flips to growth mrr */}
            <article
              className="workspace-card"
              data-story="workspace"
              aria-label="Illustrative CoFound workspace"
            >
              <header>
                <div className="workspace-brand">
                  <span className="workspace-brand-mark" />
                  CoFound Workspace
                </div>
                <span className="workspace-status">Live</span>
              </header>
              <div className="workspace-shell">
                <aside>
                  <span data-workspace-nav="overview" className="is-selected">
                    Overview
                  </span>
                  <span data-workspace-nav="research">Research</span>
                  <span>Validation</span>
                  <span>Build</span>
                  <span data-workspace-nav="growth">Growth</span>
                </aside>
                <div className="workspace-content">
                  <div className="workspace-build-panel" data-workspace-panel="build">
                    <div className="workspace-chart">
                      <span>Market opportunity</span>
                      <svg viewBox="0 0 260 82" preserveAspectRatio="none" aria-hidden>
                        <path
                          data-story-chart
                          d="M2 58 C 22 40, 37 69, 58 56 S 91 45, 110 54 S 143 67, 164 44 S 202 47, 222 21 S 246 22, 258 8"
                        />
                      </svg>
                    </div>
                    <div className="workspace-metrics">
                      <div>
                        <span>Validation score</span>
                        <strong data-metric="validation">0%</strong>
                      </div>
                      <div>
                        <span>Build progress</span>
                        <b>
                          <i data-build-progress />
                        </b>
                        <strong data-metric="build">0%</strong>
                      </div>
                    </div>
                    <div className="workspace-next">
                      <span>Next decision</span>
                      <p>
                        <CheckCircle2 data-check="first" className="size-3.5" /> Confirm the
                        highest-intent user segment
                      </p>
                      <p>
                        <span className="workspace-empty-circle" /> Review the competitor pricing
                        pattern
                      </p>
                    </div>
                  </div>
                  <div className="workspace-growth-panel" data-workspace-panel="growth">
                    <div className="workspace-growth-top">
                      <span>Growth</span>
                    </div>
                    <strong data-metric="mrr">{STORY_COPY.mrr}</strong>
                    <b>MRR</b>
                    <div className="workspace-growth-spark">
                      <TrendingUp className="size-4" />
                      <svg viewBox="0 0 190 50" preserveAspectRatio="none" aria-hidden>
                        <path d="M3 42 C 20 38, 31 43, 48 35 S 76 32, 92 28 S 116 36, 131 21 S 158 25, 187 6" />
                      </svg>
                    </div>
                    <p>
                      <span>+18.6%</span> from the last 30 days
                    </p>
                    <div className="workspace-growth-chip">47 paying customers</div>
                  </div>
                </div>
              </div>
            </article>

            {/* one card two moods so we dont get that double frame glitch again */}
            <article className="workspace-outcome" data-outcome data-outcome-mode="plan">
              <div className="workspace-outcome-kicker" data-outcome-kicker>
                {STORY_COPY.outcome.plan.kicker}
              </div>
              <p className="font-display">
                <span data-outcome-title>{STORY_COPY.outcome.plan.title}</span>
                <br />
                <em data-outcome-emphasis>{STORY_COPY.outcome.plan.emphasis}</em>
              </p>
              <div className="workspace-outcome-icons" aria-hidden>
                <Trophy data-outcome-icon="plan" />
                <TrendingUp data-outcome-icon="growth" />
              </div>
              <span data-outcome-footer>{STORY_COPY.outcome.plan.footer}</span>
            </article>
            <ChevronRight className="workspace-flow-arrow" data-story="flow" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
