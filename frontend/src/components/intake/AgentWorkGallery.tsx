// how it works scroll story
// five agents show up around the stage then get pulled into the whole workspace box

import { useRef } from 'react'
import { TrendingUp } from 'lucide-react'
import { CursorLabel, CursorPointerIcon } from '@/components/cursor/CursorLabel'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const AGENTS = [
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    color: '#c96442',
    job: 'Routes the work and keeps context intact.',
    // start out wide then pull into the box basically
    from: { x: 6, y: 12 },
  },
  {
    id: 'researcher',
    label: 'Researcher',
    color: '#4a8eff',
    job: 'Maps market evidence and alternatives.',
    from: { x: 4, y: 42 },
  },
  {
    id: 'validator',
    label: 'Validator',
    color: '#5fb87a',
    job: 'Stress-tests demand and risky assumptions.',
    from: { x: 10, y: 74 },
  },
  {
    id: 'builder',
    label: 'Builder',
    color: '#6366f1',
    job: 'Turns signal into a scoped product plan.',
    from: { x: 78, y: 18 },
  },
  {
    id: 'growth',
    label: 'Growth',
    color: '#22c55e',
    job: 'Pushes experiments toward traction and MRR.',
    from: { x: 82, y: 58 },
  },
] as const

// little labels that tick along as u scrub
const SCENE_LABELS = [
  'Agents appear',
  'Pull together',
  'Workspace wraps',
  'Agents built in',
  'Ready',
] as const

export function AgentWorkGallery({ className = '' }: { className?: string }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const scope = root.current
      if (!scope) return

      const q = gsap.utils.selector(scope)
      const stage = q('[data-how="stage"]')[0] as HTMLElement | undefined
      const frame = q('[data-how="frame"]')[0] as HTMLElement | undefined
      const agents = Array.from(q('[data-how-agent]')) as HTMLElement[]
      const chips = Array.from(q('[data-how-chip]')) as HTMLElement[]
      const progress = q('[data-how-progress]')[0] ?? null
      const mm = gsap.matchMedia()

      // spread parks them around the stage dock drops them onto the chip row
      const placeAgents = (mode: 'spread' | 'dock') => {
        if (!stage || !frame) return
        const stageBox = stage.getBoundingClientRect()
        const frameBox = frame.getBoundingClientRect()

        for (const agent of agents) {
          const spec = AGENTS.find((entry) => entry.id === agent.dataset.howAgent)
          if (!spec) continue

          if (mode === 'spread') {
            const x = (spec.from.x / 100) * stageBox.width
            const y = (spec.from.y / 100) * stageBox.height
            gsap.set(agent, { x, y, scale: 1, autoAlpha: 1 })
            continue
          }

          const chip = q(`[data-how-chip="${spec.id}"]`)[0] as HTMLElement | undefined
          if (!chip) continue
          const chipBox = chip.getBoundingClientRect()
          const x = chipBox.left - stageBox.left - 6
          const y = chipBox.top - stageBox.top - 4
          gsap.set(agent, {
            x,
            y,
            scale: 0.72,
          })
        }

        // keep the frame box around so docking math stays honest after resize
        void frameBox
      }

      // reduced motion just shows the finished workspace and thats there
      const setFinal = () => {
        gsap.set(frame ?? [], { autoAlpha: 1, scale: 1 })
        gsap.set(q('[data-how="shell"]'), { autoAlpha: 1 })
        gsap.set(q('[data-how="content"]'), { autoAlpha: 1 })
        gsap.set(chips, { autoAlpha: 1, y: 0 })
        gsap.set(q('[data-how="glow"]'), { autoAlpha: 0.55 })
        placeAgents('dock')
        gsap.set(agents, { autoAlpha: 0 })
        if (progress) progress.textContent = 'Ready'
      }

      mm.add('(prefers-reduced-motion: reduce)', setFinal)

      // desktop pin scrub appear converge wrap then chips take over
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(frame ?? [], { autoAlpha: 0.12, scale: 0.86 })
        gsap.set(q('[data-how="shell"]'), { autoAlpha: 0.25 })
        gsap.set(q('[data-how="content"]'), { autoAlpha: 0 })
        gsap.set(chips, { autoAlpha: 0, y: 8 })
        gsap.set(q('[data-how="glow"]'), { autoAlpha: 0 })
        gsap.set(agents, { autoAlpha: 0 })
        placeAgents('spread')
        gsap.set(agents, { autoAlpha: 0 })
        if (progress) progress.textContent = SCENE_LABELS[0]

        const pinEl = q('[data-how="pin"]')[0]
        // travel t is how far each agent has slid toward its chip
        const travel = { t: 0 }

        const applyTravel = (t: number) => {
          if (!stage || !frame) return
          const stageBox = stage.getBoundingClientRect()
          const frameBox = frame.getBoundingClientRect()

          for (const agent of agents) {
            const spec = AGENTS.find((entry) => entry.id === agent.dataset.howAgent)
            if (!spec) continue
            const chip = q(`[data-how-chip="${spec.id}"]`)[0] as HTMLElement | undefined
            if (!chip) continue

            const startX = (spec.from.x / 100) * stageBox.width
            const startY = (spec.from.y / 100) * stageBox.height
            const chipBox = chip.getBoundingClientRect()
            const endX = chipBox.left - stageBox.left - 6
            const endY = chipBox.top - stageBox.top - 4

            gsap.set(agent, {
              x: startX + (endX - startX) * t,
              y: startY + (endY - startY) * t,
              scale: 1 - 0.28 * t,
            })
          }

          void frameBox
        }

        const story = gsap.timeline({
          scrollTrigger: {
            trigger: pinEl,
            start: 'top top',
            end: '+=340%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              applyTravel(travel.t)
            },
            onUpdate: (self) => {
              const index = Math.min(
                SCENE_LABELS.length - 1,
                Math.floor(self.progress * SCENE_LABELS.length),
              )
              if (progress) progress.textContent = SCENE_LABELS[index]
            },
          },
        })

        const onResize = () => {
          const p = story.progress()
          applyTravel(travel.t)
          story.progress(p)
        }
        window.addEventListener('resize', onResize)

        story
          .addLabel('appear')
          .to(agents, {
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.07,
            ease: 'power2.out',
          })
          .to({}, { duration: 0.35 })
          .addLabel('converge')
          .to(travel, {
            t: 1,
            duration: 1.15,
            ease: 'power2.inOut',
            onUpdate: () => applyTravel(travel.t),
          })
          .to(
            frame ?? [],
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.85,
              ease: 'power2.out',
            },
            '<.15',
          )
          .to(q('[data-how="shell"]'), { autoAlpha: 1, duration: 0.5 }, '<.25')
          .to(q('[data-how="glow"]'), { autoAlpha: 0.5, duration: 0.55 }, '<')
          .to({}, { duration: 0.12 })
          .addLabel('wrap')
          // flying agents fade and chips inside the box take their place
          .to(agents, { autoAlpha: 0, duration: 0.28 })
          .to(chips, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, '<.05')
          .to({}, { duration: 0.22 })
          .addLabel('built-in')
          .to(q('[data-how="content"]'), { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
          .to({}, { duration: 0.35 })
          .addLabel('ready')
          .to({}, { duration: 0.9 })

        return () => {
          window.removeEventListener('resize', onResize)
          story.scrollTrigger?.kill()
          story.kill()
        }
      })

      // phone skips the flying agents and just fades the finished frame in
      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(agents, { autoAlpha: 0 })
        gsap.set(chips, { autoAlpha: 1, y: 0 })
        gsap.set(frame ?? [], { autoAlpha: 1, scale: 1 })
        gsap.set(q('[data-how="content"]'), { autoAlpha: 1 })
        return gsap
          .timeline({
            scrollTrigger: {
              trigger: q('[data-how="stage"]')[0],
              start: 'top 78%',
              toggleActions: 'play none none reverse',
            },
          })
          .from(frame ?? [], { autoAlpha: 0, y: 18, scale: 0.96, duration: 0.45 })
          .from(chips, { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.05 }, '<.12')
          .from(q('[data-how="content"]'), { autoAlpha: 0, y: 10, duration: 0.35 }, '<.1')
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className={cn('how-works-story', className)}
      aria-labelledby="how-works-title"
    >
      <div className="how-works-rail" data-how="rail">
        <div className="how-works-pin" data-how="pin">
          <div className="how-works-heading">
            <p>How it works</p>
            <h2 id="how-works-title" className="font-display">
              Five agents. One workspace.
            </h2>
            <span>
              Watch specialized agents gather into a single virtual workspace — every capability
              built in, one shared context.
            </span>
            <div className="how-works-cue" aria-live="polite">
              <span />
              <strong data-how-progress>Agents appear</strong>
            </div>
          </div>

          {/* stage holds the flying agents and the workspace that wraps them */}
          <div className="how-works-stage" data-how="stage">
            <div className="how-works-glow" data-how="glow" aria-hidden />

            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="how-works-agent"
                data-how-agent={agent.id}
                aria-hidden
              >
                <div className="how-works-agent-cursor">
                  <CursorPointerIcon color={agent.color} size={18} />
                  <CursorLabel
                    label={agent.label}
                    color={agent.color}
                    className="how-works-cursor-label"
                  />
                </div>
                <div className="how-works-agent-card">
                  <span style={{ backgroundColor: agent.color }} aria-hidden />
                  <div>
                    <strong>{agent.label}</strong>
                    <p>{agent.job}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* this frame scales up like the whole workspace is wrapping around them */}
            <article
              className="how-works-frame"
              data-how="frame"
              aria-label="Virtual CoFound workspace forming"
            >
              <div className="how-works-shell" data-how="shell">
                <header>
                  <div>
                    <i className="how-works-mark" aria-hidden />
                    CoFound Workspace
                  </div>
                  <span>Live</span>
                </header>

                {/* chips are basically the built in versions of the flying agents */}
                <div className="how-works-chip-row" aria-label="Built-in agents">
                  {AGENTS.map((agent) => (
                    <span
                      key={agent.id}
                      className="how-works-chip"
                      data-how-chip={agent.id}
                      style={{ borderColor: `${agent.color}66`, color: agent.color }}
                    >
                      <i style={{ backgroundColor: agent.color }} aria-hidden />
                      {agent.label}
                    </span>
                  ))}
                </div>

                <div className="how-works-content" data-how="content">
                  <div className="how-works-copy">
                    <p>Virtual workspace assembled</p>
                    <strong className="font-display">
                      All five agents, <em>built in.</em>
                    </strong>
                    <span>
                      Research, validation, build, and growth stay in one place — so context never
                      resets between steps.
                    </span>
                  </div>
                  <div className="how-works-result">
                    <span>Outcome</span>
                    <b>$12.4k</b>
                    <small>MRR</small>
                    <p>
                      <TrendingUp className="size-3.5" /> Evidence becomes revenue
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <p className="how-works-footer">Agents gather. Workspace forms. Context stays.</p>
        </div>
      </div>
    </section>
  )
}
