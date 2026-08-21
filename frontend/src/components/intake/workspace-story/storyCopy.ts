// all the words for the whole idea to mrr story live here
// keeps the preview from getting noisy with hard coded strings

export const STORY_COPY = {
  prompt: 'AI tools for indie founders',
  agents: [
    { id: 'researcher', title: 'Researcher', working: 'Mapping market evidence and alternatives...', complete: 'Contributed market map' },
    { id: 'validator', title: 'Validator', working: 'Testing the demand behind the idea...', complete: 'Validated high-intent segment' },
    { id: 'builder', title: 'Builder', working: 'Shaping the first release plan...', complete: 'Prepared build scope' },
  ],
  // fake numbers but believable enough for the end frame
  validation: 78,
  build: 64,
  mrr: '$12.4k',
  mrrValue: 12.4,
  // plan stays copper then growth flips the same card to mint
  outcome: {
    plan: { kicker: 'A clearer way forward', title: 'Your startup,', emphasis: 'one step closer.', footer: 'Evidence becomes a plan.' },
    growth: { kicker: 'Traction', title: 'Your startup,', emphasis: 'earning.', footer: 'Plan becomes revenue.' },
  },
} as const
