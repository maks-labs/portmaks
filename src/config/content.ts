// All copy on the site. Sources: Devaansh's CV and the public READMEs / source at
// github.com/maks-labs. Live numbers (stars, push dates) come from the GitHub API.

export const hero = {
  role: 'AI/ML Engineer — generative AI · agentic systems · cloud infrastructure',
  intro:
    'I build end-to-end LLM systems: multi-agent orchestration, retrieval-augmented pipelines, and the low-latency, AWS-backed backends that carry them into production.',
  now: 'AI/ML Engineer at Wittybrains · B.Tech CSE, Manipal University Jaipur',
  focus: [
    { k: 'Agentic systems', v: 'LangGraph supervisors, tool-calling, MCP servers' },
    { k: 'Retrieval & LLM apps', v: 'RAG pipelines, embeddings, vector search' },
    { k: 'Production backends', v: 'FastAPI microservices, Docker, AWS' },
    { k: 'Emerging tech', v: 'Real-time voice agents, autonomous research sub-agents' },
  ],
}

export interface Featured {
  repo: string
  title: string
  kind: string
  summary: string
  points: string[]
  stats: { v: string; k: string }[]
  stack: string[]
}

export const featured: Featured[] = [
  {
    repo: 'RentACrowd',
    title: 'RentACrowd',
    kind: 'Synthetic market-research panel · multi-agent LLM system',
    summary:
      'Describe a product; a persistent panel of synthetic people reacts to it in parallel and hands back a decision-ready readout in minutes instead of a day-long sequential run.',
    points: [
      'Six-agent LangGraph StateGraph: an LLM supervisor over a deterministic guardrail routes intake, research, recruitment, simulation, moderation and analysis from accumulated shared state, not a fixed pipeline.',
      'Panel reactions are sharded into batched concurrent LLM calls through the Send API, with map-reduce aggregation back into the supervisor.',
      'A research agent distils real customer language from app stores, forums and web search into per-persona objection context; personas are built to accept CDP attributes.',
      'Next.js portal persisting through real AWS APIs (DynamoDB, S3, SES), developed against the Floci emulator so production is an endpoint change, not a rewrite.',
    ],
    stats: [
      { v: '6', k: 'agents in the graph' },
      { v: '×n', k: 'parallel Send() batches' },
      { v: '3', k: 'AWS services' },
      { v: '1', k: 'env var: local → prod' },
    ],
    stack: ['LangGraph', 'FastAPI', 'SSE', 'Next.js 16', 'TypeScript', 'DynamoDB', 'S3', 'SES', 'NVIDIA NIM', 'Tavily'],
  },
  {
    repo: 'Super_Maks',
    title: 'Super Maks',
    kind: 'Real-time agentic assistant · multi-agent supervisor',
    summary:
      'A wake-word voice assistant that classifies every request, routes it to a specialist agent, and stays responsive while long jobs run in the background.',
    points: [
      'LangGraph supervisor routing to office (Gmail, Calendar, Notion), system-control, coding and research specialists, with a bounded self-correcting review loop that caps retries.',
      'A cosine-similarity embedding router matches requests against cached intents and resolves confident cases deterministically, skipping the LLM entirely.',
      'Deep-research agent decomposes a query into a plan and spawns isolated-context sub-agents, run as an async background job that notifies on completion.',
      'Conversation and per-agent session state checkpointed to SQLite so context survives restarts; every external tool call goes through MCP servers. Inference on Groq.',
    ],
    stats: [
      { v: '5', k: 'specialist agents' },
      { v: '2', k: 'MCP servers' },
      { v: '0', k: 'LLM calls on confident intents' },
      { v: '≤2', k: 'review-loop delegations' },
    ],
    stack: ['LangGraph', 'MCP', 'Groq', 'Vosk', 'faster-whisper', 'Fish Audio', 'SQLite', 'deepagents', 'Python'],
  },
]

// One-line descriptions for the GitHub list (used when a repo has no description of its own),
// and the fallback order if the GitHub API is unreachable.
export const repoNotes: { repo: string; blurb: string; stack: string[] }[] = [
  { repo: 'RentACrowd', blurb: 'Synthetic market-research panel run by a six-agent LangGraph supervisor, grounded in scraped customer language.', stack: ['LangGraph', 'FastAPI', 'Next.js', 'AWS'] },
  { repo: 'nikki', blurb: 'Voice companion modelled on Nikki from the film Obsession: the same obsessive, volatile traits, achieved with an uncensored local model. Local speech-to-text, intent-based emotion routing and a cloned voice.', stack: ['Faster-Whisper', 'Ollama', 'Fish Audio', 'Python'] },
  { repo: 'Super_Maks', blurb: 'Wake-word, real-time agentic assistant: multi-agent LangGraph supervisor, embedding router, MCP tools and durable memory.', stack: ['LangGraph', 'MCP', 'Groq', 'SQLite'] },
  { repo: 'hermes_mission_control', blurb: 'Voice-first HUD over the Hermes agent runtime, with wake phrases and sentence-by-sentence server-side speech synthesis.', stack: ['Python', 'JavaScript', 'Web Speech API'] },
  { repo: 'Healthcare-Chatbot-SIH', blurb: 'Multilingual (Odia, Hindi, English) healthcare RAG assistant built for Smart India Hackathon: three-agent LangGraph flow over MCP tools.', stack: ['LangGraph', 'MCP', 'Qdrant', 'FastAPI'] },
  { repo: 'Qdrant-vectorDB-FastAPI', blurb: 'Dockerised retrieval API: MinIO ingestion, SentenceTransformers embeddings, Qdrant search and a local Ollama model for answers.', stack: ['FastAPI', 'Qdrant', 'Ollama', 'Docker'] },
  { repo: 'Football-MCP-Server', blurb: 'FastMCP tool server exposing five schema-typed football-data tools to LLM agents, with dual-key access control.', stack: ['FastMCP', 'Docker', 'Python'] },
  { repo: 'Langgraph-demo', blurb: 'Notebook walkthroughs of LangGraph: state, conditional edges, ReAct multi-tool agents, memory, streaming and threads.', stack: ['LangGraph', 'Jupyter'] },
]

export const profile = {
  lines: [
    { cmd: 'whoami', out: 'Devaansh Makhijani — AI/ML Engineer' },
    { cmd: 'cat focus.txt', out: 'generative AI · agentic systems · cloud infrastructure' },
    { cmd: 'cat now.txt', out: 'AI/ML Engineer @ Wittybrains — shipping agentic workflows, retrieval pipelines and MCP tool integrations' },
    { cmd: 'ls certs/', out: 'oci-genai-professional-2025   aws-cloud-foundations   aws-cloud-security-foundations' },
  ],
  ticker: ['LangGraph', 'Multi-agent orchestration', 'RAG', 'MCP', 'FastAPI', 'AWS', 'Docker', 'Qdrant', 'LangChain', 'CrewAI', 'Groq', 'Ollama', 'Next.js', 'Python', 'TypeScript', 'Vector search', 'Voice agents'],
}

export interface Role {
  title: string
  org: string
  period: string
  current?: boolean
  /** successive titles at the same company, newest first (e.g. a promotion) */
  positions?: { title: string; period: string }[]
  points: string[]
}

export const experience: Role[] = [
  {
    title: 'AI/ML Engineer',
    org: 'Wittybrains',
    period: 'Jan 2026 — Present',
    current: true,
    positions: [
      { title: 'AI/ML Engineer', period: 'Jul 2026 — Present' },
      { title: 'AI/ML Engineer (Trainee)', period: 'Jan — Jul 2026' },
    ],
    points: [
      'Build LLM-powered product features — agentic workflows, retrieval pipelines and tool-calling integrations — from prototype to internal release.',
      'Design multi-agent orchestration and structured prompting and evaluation to improve grounding, accuracy and latency; maintain Python microservices (FastAPI, Docker) exposing inference, RAG and MCP tools to downstream applications.',
    ],
  },
  {
    title: 'AI Intern',
    org: 'Wittybrains',
    period: 'Jun — Aug 2025',
    points: [
      'Built the first internal RAG service and a set of MCP tool servers from scratch — ingestion, embedding and retrieval wired into a LangGraph workflow — later extended by other teams into production features.',
    ],
  },
  {
    title: 'Summer Intern',
    org: 'LetsAI',
    period: 'Jun — Aug 2024',
    points: [
      'Optimised Python data pipelines (Pandas, NumPy) and automated analytics reporting, improving processing performance by 25% and cutting operational overhead by 30%.',
    ],
  },
]

export const education = {
  degree: 'B.Tech, Computer Science and Engineering',
  school: 'Manipal University Jaipur',
  period: '2022 — 2026',
}

export const certifications = [
  { name: 'Certified Generative AI Professional', issuer: 'Oracle Cloud Infrastructure · 2025' },
  { name: 'Cloud Foundations', issuer: 'AWS Academy' },
  { name: 'Cloud Security Foundations', issuer: 'AWS' },
]

/** `icon` is a simple-icons export name; without one the tile shows a monogram. */
export interface Skill { name: string; icon?: string; mono?: string }
export interface SkillGroup { label: string; note: string; items: Skill[] }

export const skills: SkillGroup[] = [
  {
    label: 'Languages',
    note: 'Core languages',
    items: [
      { name: 'Python', icon: 'siPython' },
      { name: 'JavaScript', icon: 'siJavascript' },
      { name: 'TypeScript', icon: 'siTypescript' },
      { name: 'HTML', icon: 'siHtml5' },
      { name: 'CSS', icon: 'siCss' },
    ],
  },
  {
    label: 'AI / Machine Learning',
    note: 'Agents, LLM frameworks and data science',
    items: [
      { name: 'LangGraph', icon: 'siLanggraph' },
      { name: 'LangChain', icon: 'siLangchain' },
      { name: 'CrewAI', icon: 'siCrewai' },
      { name: 'Flue Agent', mono: 'FA' },
      { name: 'Scikit-learn', icon: 'siScikitlearn' },
      { name: 'Pandas', icon: 'siPandas' },
      { name: 'NumPy', icon: 'siNumpy' },
      { name: 'Matplotlib', mono: 'Mpl' },
      { name: 'OpenCV', icon: 'siOpencv' },
    ],
  },
  {
    label: 'LLM Tooling',
    note: 'Protocols, SDKs and inference',
    items: [
      { name: 'MCP', icon: 'siModelcontextprotocol' },
      { name: 'Claude SDK', icon: 'siClaude' },
      { name: 'Google ADK', icon: 'siGoogle' },
      { name: 'Ollama', icon: 'siOllama' },
      { name: 'Groq', mono: 'Gq' },
    ],
  },
  {
    label: 'Backend & Frontend',
    note: 'Services and interfaces',
    items: [
      { name: 'FastAPI', icon: 'siFastapi' },
      { name: 'React', icon: 'siReact' },
      { name: 'Next.js', icon: 'siNextdotjs' },
    ],
  },
  {
    label: 'Cloud & Data',
    note: 'Infrastructure and storage',
    items: [
      { name: 'AWS', mono: 'AWS' },
      { name: 'Docker', icon: 'siDocker' },
      { name: 'Qdrant', icon: 'siQdrant' },
      { name: 'AstraDB', icon: 'siDatastax' },
      { name: 'MinIO', icon: 'siMinio' },
      { name: 'SQLite', icon: 'siSqlite' },
    ],
  },
  {
    label: 'Tools',
    note: 'Daily workflow',
    items: [
      { name: 'Git', icon: 'siGit' },
      { name: 'GitHub', icon: 'siGithub' },
    ],
  },
]
