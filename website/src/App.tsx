import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Check,
  CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock3, Code2,
  Cpu, Database, ExternalLink, GitBranch, GitMerge, Layers3, LockKeyhole,
  Menu, MessageSquare, Network, Play, Radio, Shield, ShieldCheck,
  Sparkles, Terminal, Workflow, X, Zap
} from "lucide-react";

type Status = "Live & Verified" | "In Active Development" | "Planned Roadmap";
type PreviewView = "agents" | "pipeline";

const capabilities: { name: string; status: Status; detail: string; evidence: string }[] = [
  { name: "Public source and review workflow", status: "Live & Verified", detail: "The public repository and its review-based development workflow are available.", evidence: "Repository and pull-request metadata" },
  { name: "Workspace interface and navigation", status: "In Active Development", detail: "The application shell, core routes and responsive navigation are being developed.", evidence: "Unmerged frontend feature branch" },
  { name: "Agent activity simulation", status: "In Active Development", detail: "A deterministic visual simulation demonstrates agent states; it is not live agent execution.", evidence: "Swarm engine tests and demo disclosure" },
  { name: "Convex backend foundation", status: "In Active Development", detail: "Backend schema, data functions and security tests exist on a separate development branch.", evidence: "Unmerged backend foundation branch" },
  { name: "Production agent execution", status: "Planned Roadmap", detail: "Real background execution and production tool orchestration are not advertised as available.", evidence: "Not released" },
  { name: "Verified production security controls", status: "Planned Roadmap", detail: "Security guarantees will be published only after implementation and independent evidence.", evidence: "No production security claim made" },
  { name: "Android application package", status: "Planned Roadmap", detail: "A downloadable Android build is not currently offered.", evidence: "No verified APK release" },
];

const securityManifest = {
  manifestVersion: "illustrative-0.1",
  purpose: "Documentation example only — not an active enforcement policy",
  execution: {
    sandbox: "not_claimed",
    humanApproval: "required_for_sensitive_actions",
    productionAccess: "not_connected",
  },
  network: {
    defaultEgress: "deny_by_default_proposed",
    allowlist: [],
    enforcementStatus: "not_verified",
  },
  data: {
    retention: "not_specified",
    zeroDataRetention: false,
  },
};

const features = [
  { icon: MessageSquare, title: "AI-assisted conversations", text: "A focused place to work through engineering questions and project context. Live model connectivity is not represented by this website preview." },
  { icon: Bot, title: "Agent workspace", text: "Explore agent roles, states and orchestration concepts through a clearly labelled interactive simulation." },
  { icon: Layers3, title: "Project boundaries", text: "Keep work grouped by project, with room for separate context, tasks and activity." },
  { icon: CheckCircle2, title: "Sub-task pipelines", text: "See how work can be organised into queued, active and completed stages." },
  { icon: Workflow, title: "Deterministic workflows", text: "A direction for repeatable, inspectable workflows with explicit state transitions and review points." },
];

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Status | "All">("All");
  const [previewView, setPreviewView] = useState<PreviewView>("agents");
  const [manifestOpen, setManifestOpen] = useState(false);

  const visibleCapabilities = useMemo(
    () => activeFilter === "All" ? capabilities : capabilities.filter((item) => item.status === activeFilter),
    [activeFilter],
  );

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    ["Features", "features"],
    ["Architecture", "architecture"],
    ["Security", "security"],
    ["Roadmap", "roadmap"],
  ];

  return (
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NEXUS-AI home" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark"><Cpu size={19} /></span>
          <span>NEXUS<span className="accent">-AI</span><i /></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)}>{label}</button>)}
        </nav>
        <div className="top-actions">
          <button className="button button-small button-primary" onClick={() => scrollTo("workspace-preview")}>
            Explore preview <ArrowUpRight size={15} />
          </button>
          <button className="menu-toggle" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navItems.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)}>{label}<ChevronRight size={16} /></button>)}
            <button className="mobile-nav-cta" onClick={() => scrollTo("workspace-preview")}>Explore preview <ArrowUpRight size={16} /></button>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> ENGINEERING WORKSPACE <span className="eyebrow-divider" /> IN DEVELOPMENT</div>
            <h1>One workspace.<br /><span>Multiple intelligent agents.</span></h1>
            <p className="hero-lede">A developing workspace for AI-assisted projects, tasks, conversations and agent orchestration — designed to make complex engineering work easier to understand and coordinate.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo("features")}>Explore capabilities <ArrowRight size={17} /></button>
              <button className="button button-quiet" onClick={() => scrollTo("architecture")}><Terminal size={17} /> View architecture</button>
            </div>
            <div className="hero-footnote"><span className="status-pulse" /> Public development preview <span className="footnote-separator">/</span> Not a production release</div>
          </div>
          <div className="hero-art" aria-label="Abstract network illustration">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <div className="orbit-node node-a"><Bot size={17} /></div>
            <div className="orbit-node node-b"><Database size={17} /></div>
            <div className="orbit-node node-c"><Workflow size={17} /></div>
            <div className="core-node"><Cpu size={38} /><span>NEXUS CORE</span></div>
            <div className="orbit-caption caption-a">CONTEXT</div>
            <div className="orbit-caption caption-b">ORCHESTRATION</div>
          </div>
        </section>

        <section className="preview-section section-wrap" id="workspace-preview">
          <div className="section-heading section-heading-row">
            <div><div className="section-kicker">INTERACTIVE PRODUCT CONCEPT</div><h2>See the workspace take shape.</h2></div>
            <span className="demo-label"><CircleDot size={12} /> SIMULATED DATA</span>
          </div>
          <div className="preview-window">
            <div className="window-bar">
              <div className="window-dots"><i /><i /><i /></div>
              <span className="window-title">nexus-ai / workspace-preview</span>
              <div className="preview-switch" role="group" aria-label="Choose preview view">
                <button className={previewView === "agents" ? "selected" : ""} onClick={() => setPreviewView("agents")}>Agent console</button>
                <button className={previewView === "pipeline" ? "selected" : ""} onClick={() => setPreviewView("pipeline")}>Task pipeline</button>
              </div>
            </div>
            {previewView === "agents" ? (
              <div className="preview-body agent-view">
                <aside className="agent-list">
                  <div className="panel-label">AGENT ACTIVITY <span>DEMO</span></div>
                  <div className="agent-card agent-active"><div className="agent-card-top"><Bot size={16} /><strong>Agent Alpha</strong><span className="live-tag">WORKING</span></div><p>Reviewing a sample project task…</p><div className="progress-track"><i style={{ width: "68%" }} /></div></div>
                  <div className="agent-card"><div className="agent-card-top"><ShieldCheck size={16} /><strong>Review Agent</strong><span className="idle-tag">IDLE</span></div><p>Waiting for a review request.</p></div>
                  <div className="agent-card"><div className="agent-card-top"><Database size={16} /><strong>Context Indexer</strong><span className="queue-tag">QUEUED</span></div><p>Sample context sync is queued.</p></div>
                </aside>
                <div className="terminal-panel">
                  <div className="terminal-heading"><span>ACTIVITY STREAM</span><span className="terminal-safe"><LockKeyhole size={12} /> DEMO ENVIRONMENT</span></div>
                  <div className="log-line"><time>09:41:02</time><b>[SYSTEM]</b> Preview session initialised.</div>
                  <div className="log-line"><time>09:41:04</time><b className="blue">[TASK]</b> Sample task assigned to Agent Alpha.</div>
                  <div className="log-line"><time>09:41:08</time><b>[STATE]</b> Agent state changed to <strong>Working</strong>.</div>
                  <div className="log-highlight"><ArrowDownRight size={14} /> Demonstration event: task context prepared for review.</div>
                  <div className="log-line muted"><time>09:41:12</time><b className="yellow">[WAIT]</b> Human review step shown as a concept.</div>
                  <div className="terminal-input"><span>›</span><code>Preview only — no command is executed</code><span className="readonly-tag">READ ONLY</span></div>
                </div>
              </div>
            ) : (
              <div className="preview-body pipeline-view">
                <div className="pipeline-column"><div className="pipeline-title">QUEUED <span>02</span></div><div className="task-chip">Review API boundaries<small>Sample task · Unassigned</small></div><div className="task-chip">Update project notes<small>Sample task · Unassigned</small></div></div>
                <div className="pipeline-column active-column"><div className="pipeline-title">IN PROGRESS <span>01</span></div><div className="task-chip active-task">Map agent state transitions<small>Demo agent · Step 2 of 3</small><div className="progress-track"><i style={{ width: "58%" }} /></div></div></div>
                <div className="pipeline-column"><div className="pipeline-title">COMPLETED <span>01</span></div><div className="task-chip done-task"><Check size={14} /> Define task categories<small>Sample task · Demonstration</small></div></div>
                <div className="pipeline-note"><Activity size={15} /> All tasks and activity shown here are illustrative sample data.</div>
              </div>
            )}
          </div>
          <p className="preview-disclaimer"><InfoIcon /> This interactive simulator runs locally in your browser. It is not connected to live agents, user accounts, project data or production services.</p>
        </section>

        <section className="features-section section-wrap" id="features">
          <div className="section-heading"><div className="section-kicker">CAPABILITIES IN DEVELOPMENT</div><h2>Designed around the work.<br /><span>Not just the model.</span></h2><p>Five connected areas shape the product direction. Availability is described honestly in the architecture status below.</p></div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }, index) => <article className="feature-card" key={title}><div className="feature-icon"><Icon size={19} /></div><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p><div className="feature-line" /></article>)}
          </div>
        </section>

        <section className="architecture-section section-wrap" id="architecture">
          <div className="section-heading section-heading-row">
            <div><div className="section-kicker">TRANSPARENT DELIVERY STATUS</div><h2>What exists. What is next.</h2><p>Filter the capability register to see the current development boundary.</p></div>
            <div className="architecture-mark"><GitBranch size={17} /><span>Evidence-led status</span></div>
          </div>
          <div className="filter-row" role="group" aria-label="Filter capability status">
            {(["All", "Live & Verified", "In Active Development", "Planned Roadmap"] as const).map((filter) => <button key={filter} className={activeFilter === filter ? "filter-active" : ""} onClick={() => setActiveFilter(filter)}>{filter === "All" ? "All capabilities" : filter}</button>)}
          </div>
          <div className="capability-list">
            {visibleCapabilities.map((item) => <article className="capability-row" key={item.name}><div className="capability-main"><div className="capability-title">{item.name}<StatusBadge status={item.status} /></div><p>{item.detail}</p><small>Evidence: {item.evidence}</small></div><ChevronRight className="capability-arrow" size={18} /></article>)}
          </div>
          <div className="status-note"><ShieldCheck size={17} /><span>No production agent execution, production security enforcement, or released Android package is claimed as available.</span></div>
        </section>

        <section className="security-section section-wrap" id="security">
          <div className="security-copy">
            <div className="section-kicker">SECURITY & TRUST</div>
            <h2>Trust starts with<br /><span>clear boundaries.</span></h2>
            <p>Security is treated as an engineering requirement, not a marketing adjective. The example manifest below documents intended safeguards without pretending that a displayed policy is an enforced control.</p>
            <div className="security-points">
              <div><Shield size={17} /><span><b>Explicit approval boundaries</b><small>Sensitive actions should require an authorised human decision.</small></span></div>
              <div><Network size={17} /><span><b>Network policy transparency</b><small>Proposed egress rules are not represented as active enforcement.</small></span></div>
              <div><Database size={17} /><span><b>Honest data handling</b><small>No zero-retention promise is made without verifiable implementation.</small></span></div>
            </div>
          </div>
          <div className="manifest-card">
            <div className="manifest-top"><div><span className="manifest-dot" /> POLICY MANIFEST</div><button onClick={() => setManifestOpen((value) => !value)} aria-expanded={manifestOpen}>{manifestOpen ? "Collapse" : "Inspect JSON"} <ChevronDown size={14} /></button></div>
            <div className="manifest-status"><span>EXAMPLE / NOT ENFORCED</span><LockKeyhole size={14} /></div>
            <pre className="manifest-code"><code>{JSON.stringify(securityManifest, null, 2)}</code></pre>
            <div className="manifest-foot"><span><CircleDot size={11} /> Illustrative documentation</span><span>v0.1</span></div>
            {manifestOpen && <div className="manifest-explainer">This manifest is static sample content included to explain the proposed policy shape. It is not loaded by an agent runtime, firewall, sandbox or retention service.</div>}
          </div>
        </section>

        <section className="roadmap-section section-wrap" id="roadmap">
          <div className="section-heading"><div className="section-kicker">BUILD IN THE OPEN</div><h2>A measured path to release.</h2><p>Milestones move forward when implementation and verification evidence are available.</p></div>
          <div className="roadmap-track">
            <div className="roadmap-item roadmap-done"><div className="roadmap-marker"><Check size={15} /></div><div><span className="roadmap-state">BASELINE</span><h3>Public project foundation</h3><p>Repository, source review and verification workflow.</p></div></div>
            <div className="roadmap-item roadmap-current"><div className="roadmap-marker"><Radio size={15} /></div><div><span className="roadmap-state">IN DEVELOPMENT</span><h3>Workspace experience</h3><p>Application shell, navigation, conversations and project workflows.</p></div></div>
            <div className="roadmap-item"><div className="roadmap-marker"><Clock3 size={15} /></div><div><span className="roadmap-state">PLANNED</span><h3>Connected orchestration</h3><p>Verified backend integration, agent execution and approval flows.</p></div></div>
            <div className="roadmap-item"><div className="roadmap-marker"><LockKeyhole size={15} /></div><div><span className="roadmap-state">PLANNED</span><h3>Release and platform readiness</h3><p>Security validation, release documentation and Android evaluation.</p></div></div>
          </div>
        </section>

        <section className="closing-cta section-wrap">
          <div className="closing-orb"><Sparkles size={22} /></div>
          <div><div className="section-kicker">NEXUS-AI / ENGINEERING PREVIEW</div><h2>Build with clarity.<br /><span>Ship with evidence.</span></h2><p>Follow the project as the workspace moves from concept to verified release.</p></div>
          <a className="button button-primary" href="https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC" target="_blank" rel="noreferrer">View public repository <ExternalLink size={16} /></a>
        </section>
      </main>

      <footer className="footer section-wrap"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Cpu size={17} /></span><span>NEXUS<span className="accent">-AI</span></span></a><span>Independent project · Public development preview</span><a href="https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a><small>© {new Date().getFullYear()} NEXUS-AI. Product capabilities are subject to change during development.</small></footer>
      <div className="mobile-bottom-note">Development preview · No production service connected</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const className = status === "Live & Verified" ? "badge-verified" : status === "In Active Development" ? "badge-progress" : "badge-planned";
  return <span className={"status-badge " + className}>{status}</span>;
}

function InfoIcon() {
  return <span className="info-icon" aria-hidden="true">i</span>;
}

export default App;
