// Architecture specs for the two featured systems. Every node comes from the repositories'
// own READMEs / architecture docs. Coordinates are in a 780 × 540 viewBox.
export interface DNode { id: string; x: number; y: number; w: number; label: string; sub?: string; kind?: 'core' | 'store' | 'ext' | 'mini' }
export interface DEdge { a: string; b: string; kind?: 'dash' | 'fan' | 'loop'; label?: string }
export interface DGroup { x: number; y: number; w: number; h: number; label: string }
export interface DSpec { title: string; groups: DGroup[]; nodes: DNode[]; edges: DEdge[] }

const mini = (ids: string[], x0: number, y: number, w: number, gap: number, labels: string[]): DNode[] =>
  ids.map((id, i) => ({ id, x: x0 + i * (w + gap), y, w, label: labels[i], kind: 'mini' as const }))

export const rentacrowd: DSpec = {
  title: 'RentACrowd architecture: a Next.js portal streams from a FastAPI and LangGraph engine whose supervisor routes six workers, with AWS persistence',
  groups: [
    { x: 8, y: 8, w: 176, h: 222, label: 'PORTAL · NEXT.JS 16' },
    { x: 8, y: 244, w: 176, h: 160, label: 'AWS DATA LAYER' },
    { x: 8, y: 418, w: 176, h: 114, label: 'LOCAL ⇄ PRODUCTION' },
    { x: 198, y: 8, w: 574, h: 350, label: 'ENGINE · FASTAPI + LANGGRAPH STATEGRAPH' },
    { x: 198, y: 372, w: 310, h: 160, label: 'REAL-WORLD EVIDENCE' },
    { x: 522, y: 372, w: 250, h: 160, label: 'MODELS & MEMORY' },
  ],
  nodes: [
    { id: 'auth', x: 20, y: 32, w: 152, label: 'Auth.js', sub: 'login · signup' },
    { id: 'wiz', x: 20, y: 76, w: 152, label: 'Onboarding wizard' },
    { id: 'dash', x: 20, y: 108, w: 152, label: 'Dashboard', sub: 'profiles · studies' },
    { id: 'live', x: 20, y: 152, w: 152, label: 'Live study view', sub: 'SSE stream' },
    { id: 'rep', x: 20, y: 196, w: 152, label: 'Persisted report' },
    { id: 'ddb', x: 20, y: 268, w: 152, label: 'DynamoDB', sub: 'profiles · studies · auth', kind: 'store' },
    { id: 's3', x: 20, y: 312, w: 152, label: 'S3', sub: 'uploaded images', kind: 'store' },
    { id: 'ses', x: 20, y: 356, w: 152, label: 'SES', sub: 'transactional email', kind: 'store' },
    { id: 'floci', x: 20, y: 442, w: 152, label: 'Floci emulator', sub: 'Docker · localhost:4566', kind: 'ext' },
    { id: 'aws', x: 20, y: 486, w: 152, label: 'Real AWS', sub: 'same SDK calls', kind: 'ext' },

    { id: 'api', x: 212, y: 34, w: 124, label: 'POST /api/study', sub: 'brief in · events out' },
    { id: 'bus', x: 212, y: 84, w: 124, label: 'SSE event bus', sub: 'every node emits' },
    { id: 'guard', x: 418, y: 60, w: 140, label: '_forced_move', sub: 'deterministic guardrail' },
    { id: 'sup', x: 418, y: 160, w: 140, label: 'supervisor', sub: 'LLM router over state', kind: 'core' },
    { id: 'intake', x: 222, y: 146, w: 124, label: 'intake', sub: 'stimulus · 4 segments' },
    { id: 'research', x: 222, y: 204, w: 124, label: 'research', sub: 'two parallel passes' },
    { id: 'recruit', x: 222, y: 262, w: 124, label: 'recruit_panel', sub: 'library first, then fill' },
    { id: 'run', x: 636, y: 60, w: 124, label: 'run_panel', sub: 'Send() fan-out' },
    ...mini(['b1', 'b2', 'b3', 'b4'], 632, 124, 28, 6, ['b1', 'b2', 'b3', 'bn']),
    { id: 'mod', x: 636, y: 204, w: 124, label: 'moderator', sub: 'follow-up interviews' },
    { id: 'ana', x: 636, y: 262, w: 124, label: 'analyze', sub: 'stats in Python' },
    { id: 'state', x: 388, y: 304, w: 200, label: 'StudyState', sub: 'shared blackboard · operator.add', kind: 'store' },

    { id: 'app', x: 210, y: 398, w: 92, label: 'App Store', kind: 'ext' },
    { id: 'play', x: 308, y: 398, w: 92, label: 'Google Play', kind: 'ext' },
    { id: 'hn', x: 406, y: 398, w: 92, label: 'Hacker News', kind: 'ext' },
    { id: 'reddit', x: 210, y: 440, w: 92, label: 'Reddit', kind: 'ext' },
    { id: 'tav', x: 308, y: 440, w: 190, label: 'Tavily web search', sub: 'LLM-written queries', kind: 'ext' },
    { id: 'evi', x: 210, y: 490, w: 288, label: 'market_evidence → persona objections' },

    { id: 'nim', x: 534, y: 398, w: 226, label: 'NVIDIA NIM', sub: 'panel · analysis · fast · vision', kind: 'ext' },
    { id: 'lib', x: 534, y: 446, w: 108, label: 'persona_library', sub: 'persistent people', kind: 'store' },
    { id: 'stud', x: 652, y: 446, w: 108, label: 'studies/', sub: 'reports', kind: 'store' },
    { id: 'rpt', x: 534, y: 494, w: 226, label: 'decision-ready report' },
  ],
  edges: [
    { a: 'live', b: 'api', label: 'SSE' }, { a: 'api', b: 'bus' }, { a: 'bus', b: 'live', kind: 'dash' },
    { a: 'api', b: 'sup' }, { a: 'guard', b: 'sup' },
    { a: 'sup', b: 'intake' }, { a: 'sup', b: 'research' }, { a: 'sup', b: 'recruit' },
    { a: 'sup', b: 'run' }, { a: 'sup', b: 'mod' }, { a: 'sup', b: 'ana' },
    { a: 'run', b: 'b1', kind: 'fan' }, { a: 'run', b: 'b2', kind: 'fan' }, { a: 'run', b: 'b3', kind: 'fan' }, { a: 'run', b: 'b4', kind: 'fan' },
    { a: 'b1', b: 'sup', kind: 'dash' }, { a: 'b3', b: 'mod', kind: 'dash' },
    { a: 'sup', b: 'state', kind: 'dash' }, { a: 'recruit', b: 'state', kind: 'dash' }, { a: 'ana', b: 'state', kind: 'dash' },
    { a: 'research', b: 'app' }, { a: 'research', b: 'play' }, { a: 'research', b: 'hn' }, { a: 'research', b: 'reddit' }, { a: 'research', b: 'tav' },
    { a: 'tav', b: 'evi', kind: 'dash' }, { a: 'reddit', b: 'evi', kind: 'dash' },
    { a: 'recruit', b: 'lib' }, { a: 'sup', b: 'nim' }, { a: 'ana', b: 'stud' }, { a: 'stud', b: 'rpt', kind: 'dash' }, { a: 'nim', b: 'lib', kind: 'dash' },
    { a: 'auth', b: 'ddb', kind: 'dash' }, { a: 'dash', b: 'ddb' }, { a: 'wiz', b: 's3', kind: 'dash' }, { a: 'rep', b: 'ddb' },
    { a: 'ses', b: 'floci', kind: 'dash' }, { a: 'floci', b: 'aws', kind: 'loop' },
  ],
}

export const supermaks: DSpec = {
  title: 'Super Maks architecture: an offline voice pipeline feeds a LangGraph supervisor that routes to five specialists over MCP servers, with SQLite-checkpointed memory',
  groups: [
    { x: 8, y: 8, w: 764, h: 76, label: 'VOICE PIPELINE · OFFLINE UNTIL IT SPEAKS' },
    { x: 8, y: 98, w: 764, h: 252, label: 'LANGGRAPH SUPERVISOR' },
    { x: 8, y: 364, w: 500, h: 168, label: 'MCP SERVERS · EVERY TOOL CALL' },
    { x: 522, y: 364, w: 250, h: 168, label: 'STATE & MEMORY' },
  ],
  nodes: [
    { id: 'wake', x: 20, y: 34, w: 124, label: 'Wake word', sub: 'Vosk · offline' },
    { id: 'stt', x: 164, y: 34, w: 136, label: 'Speech-to-text', sub: 'faster-whisper' },
    { id: 'hud', x: 476, y: 34, w: 136, label: 'Jarvis dashboard', sub: 'live event stream' },
    { id: 'tts', x: 630, y: 34, w: 130, label: 'Fish Audio TTS', sub: 'spoken reply' },

    { id: 'start', x: 20, y: 126, w: 112, label: 'start_turn', sub: 'reset delegation' },
    { id: 'emb', x: 20, y: 206, w: 112, label: 'Embedding router', sub: 'cosine similarity' },
    { id: 'cache', x: 20, y: 286, w: 112, label: 'Cached intents', sub: 'confident → no LLM', kind: 'store' },
    { id: 'router', x: 166, y: 166, w: 144, label: 'LLM router', sub: 'Groq · gpt-oss-20b', kind: 'core' },
    { id: 'trim', x: 166, y: 246, w: 144, label: 'pre_model_hook', sub: 'trim to context budget' },
    { id: 'chat', x: 346, y: 122, w: 130, label: 'chit_chat', sub: 'no tools' },
    { id: 'office', x: 346, y: 166, w: 130, label: 'office', sub: 'Gmail · Calendar · Notion' },
    { id: 'coder', x: 346, y: 210, w: 130, label: 'coder', sub: 'Claude Code handoff' },
    { id: 'mac', x: 346, y: 254, w: 130, label: 'mac_control', sub: 'plan → Send → aggregate' },
    { id: 'deep', x: 346, y: 298, w: 130, label: 'deep_research', sub: 'deepagents harness' },
    { id: 'review', x: 506, y: 150, w: 126, label: 'after_specialist', sub: 'review · delegation < 2' },
    { id: 'final', x: 648, y: 150, w: 112, label: 'finalize', sub: 'verbatim relay' },
    { id: 'job', x: 506, y: 234, w: 126, label: 'Background job', sub: 'returns a receipt' },
    ...mini(['a1', 'a2', 'a3'], 650, 240, 32, 6, ['sub', 'sub', 'sub']),
    { id: 'plan', x: 506, y: 298, w: 254, label: 'todo plan · virtual FS · isolated context' },

    { id: 'apic', x: 20, y: 390, w: 150, label: 'api_connectors', sub: 'stdio transport', kind: 'core' },
    ...mini(['gmail', 'cal', 'notion', 'web'], 186, 396, 72, 6, ['Gmail', 'Calendar', 'Notion', 'Web']),
    ...mini(['claude', 'weather'], 186, 430, 111, 6, ['Claude Code', 'Weather']),
    { id: 'macc', x: 20, y: 472, w: 150, label: 'mac companion', sub: 'streamable HTTP · LAN', kind: 'core' },
    ...mini(['browser', 'files', 'spot', 'sys'], 186, 478, 72, 6, ['Browser', 'Files', 'Spotify', 'System']),

    { id: 'sql', x: 534, y: 390, w: 226, label: 'SQLite checkpointer', sub: 'survives process restarts', kind: 'store' },
    { id: 'sticky', x: 534, y: 436, w: 108, label: 'Sticky sessions', sub: 'per agent', kind: 'store' },
    { id: 'reg', x: 652, y: 436, w: 108, label: 'Job registry', sub: 'GET /jobs', kind: 'store' },
    { id: 'hb', x: 534, y: 482, w: 226, label: 'Progress heartbeats', sub: 'spoken every 30s when idle' },
  ],
  edges: [
    { a: 'wake', b: 'stt' }, { a: 'stt', b: 'start' }, { a: 'start', b: 'emb' }, { a: 'emb', b: 'cache', kind: 'dash' },
    { a: 'emb', b: 'router', label: 'unsure' }, { a: 'trim', b: 'router', kind: 'dash' },
    { a: 'cache', b: 'mac', kind: 'fan', label: 'skip LLM' },
    { a: 'router', b: 'chat' }, { a: 'router', b: 'office' }, { a: 'router', b: 'coder' }, { a: 'router', b: 'mac' }, { a: 'router', b: 'deep' },
    { a: 'chat', b: 'review' }, { a: 'office', b: 'review' }, { a: 'coder', b: 'review' }, { a: 'mac', b: 'review' },
    { a: 'review', b: 'router', kind: 'loop' }, { a: 'review', b: 'final' },
    { a: 'final', b: 'tts' }, { a: 'final', b: 'hud', kind: 'dash' },
    { a: 'deep', b: 'job' }, { a: 'job', b: 'a1', kind: 'fan' }, { a: 'job', b: 'a2', kind: 'fan' }, { a: 'job', b: 'a3', kind: 'fan' }, { a: 'deep', b: 'plan', kind: 'dash' },
    { a: 'office', b: 'apic' }, { a: 'coder', b: 'claude', kind: 'dash' }, { a: 'mac', b: 'macc' },
    { a: 'apic', b: 'gmail' }, { a: 'apic', b: 'claude', kind: 'dash' }, { a: 'macc', b: 'browser' },
    { a: 'router', b: 'sql', kind: 'dash' }, { a: 'sql', b: 'sticky', kind: 'dash' }, { a: 'job', b: 'reg' }, { a: 'reg', b: 'hb', kind: 'dash' },
  ],
}
