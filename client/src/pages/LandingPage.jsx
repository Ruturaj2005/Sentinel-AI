import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS, ROLE_NAVIGATION } from '../utils/constants';

const capabilities = [
  {
    icon: '◉',
    title: 'Behavioral Baselines',
    detail: 'Continuously compares current activity against each employee\'s normal access profile.',
    impact: 'Risk Context'
  },
  {
    icon: '△',
    title: 'Anomaly Signals',
    detail: 'Correlates off-hours activity, unusual systems, and reconnaissance-like navigation patterns.',
    impact: 'Early Warning'
  },
  {
    icon: '↻',
    title: 'Smart Ticket Routing',
    detail: 'Uses risk and context to route to employee action, manager review, or investigator escalation.',
    impact: 'Faster Triage'
  },
  {
    icon: '▣',
    title: 'Role-Specific Views',
    detail: 'Employee, Manager, and CVU Investigator journeys with dedicated dashboards and tools.',
    impact: 'Focused Workspaces'
  }
];

const workflow = [
  { step: '01', title: 'Ingest Activity', detail: 'Access events and behavior metadata are ingested in near-real-time.' },
  { step: '02', title: 'Score Risk', detail: 'Pattern engine calculates changing risk posture per employee and team.' },
  { step: '03', title: 'Generate Alerts', detail: 'Signals are grouped into actionable alerts with severity and status.' },
  { step: '04', title: 'Resolve With Controls', detail: 'Teams investigate, approve, reject, or escalate with full traceability.' }
];

const pulseMetrics = [
  { label: 'Signals Correlated', value: '38,420/day' },
  { label: 'Active Baselines', value: '20 Employees' },
  { label: 'Avg. Triage Time', value: '3m 14s' }
];

const footerLinks = {
  product: ['Risk Monitoring', 'Alert Workflows', 'Ticket Routing', 'Pattern Analysis'],
  useCases: ['Employee Oversight', 'Manager Operations', 'Investigator Command', 'Compliance Reviews'],
  company: ['About Sentinel', 'Security Posture', 'Release Notes', 'Support']
};

export default function LandingPage() {
  const [startingDemo, setStartingDemo] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.EMPLOYEE);
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMetricIndex((prev) => (prev + 1) % pulseMetrics.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const handleDemoAccess = async () => {
    try {
      setError('');
      setStartingDemo(true);
      await switchRole(selectedRole);
      navigate(`/${selectedRole}/dashboard`, { replace: true });
    } catch (err) {
      setError('Unable to start demo right now. Please ensure the API server is running.');
    } finally {
      setStartingDemo(false);
    }
  };

  const selectedNavigation = (ROLE_NAVIGATION[selectedRole] || []).filter((item) => !item.type);

  const selectedRoleHighlights = {
    [ROLES.EMPLOYEE]: [
      'Monitor personal risk progression and recent alerts.',
      'Review flagged access events and ticket history.'
    ],
    [ROLES.MANAGER]: [
      'Track team-level alert distribution and review queue.',
      'Approve, reject, or escalate decisions with audit context.'
    ],
    [ROLES.INVESTIGATOR]: [
      'Analyze high-risk employees and active reconnaissance patterns.',
      'Use investigation tools and system-level reporting views.'
    ]
  };

  const roleCards = [
    {
      key: ROLES.EMPLOYEE,
      title: ROLE_LABELS[ROLES.EMPLOYEE],
      description: 'Monitor personal alerts, ticket outcomes, and behavioral drift in daily workflows.'
    },
    {
      key: ROLES.MANAGER,
      title: ROLE_LABELS[ROLES.MANAGER],
      description: 'See team-level risk, review pending decisions, and resolve incidents with context.'
    },
    {
      key: ROLES.INVESTIGATOR,
      title: ROLE_LABELS[ROLES.INVESTIGATOR],
      description: 'Investigate critical signals, analyze patterns, and manage escalated events across the system.'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-800">
      <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-500 text-lg font-semibold text-white shadow-sm">
              S
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-primary-700">SENTINEL</p>
              <p className="text-xs text-slate-500">Insider Fraud Detection Platform</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs text-slate-600 md:flex">
            <a href="#features" className="hover:text-primary-700">Features</a>
            <a href="#workflow" className="hover:text-primary-700">Workflow</a>
            <a href="#roles" className="hover:text-primary-700">Roles</a>
            <a href="#footer" className="hover:text-primary-700">Contact</a>
          </nav>
        </header>

        <main className="space-y-16 pb-10">
          <section className="space-y-8 pt-4 text-center md:pt-8">
            <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs tracking-[0.12em] text-cyan-700">
              Security Intelligence Platform
            </p>

            <div className="space-y-4">
              <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl" style={{ fontFamily: 'Space Grotesk, ui-sans-serif, system-ui' }}>
                Detect insider risk early. Investigate faster. Operate with confidence.
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Sentinel gives banking teams one connected system for behavioral anomaly detection, alert triage,
                and role-based investigation workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={startingDemo}
                className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {startingDemo ? 'Launching Platform...' : `Launch Platform as ${ROLE_LABELS[selectedRole]}`}
              </button>
              <a href="#features" className="text-sm font-medium text-primary-700 hover:text-primary-800">
                Explore Features
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.INVESTIGATOR].map((roleKey) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    selectedRole === roleKey
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700'
                  ].join(' ')}
                >
                  {ROLE_LABELS[roleKey]}
                </button>
              ))}
            </div>

            {error && (
              <p className="mx-auto max-w-md rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}

            <div className="mx-auto grid w-full max-w-4xl gap-4 border-y border-slate-200 py-5 md:grid-cols-3">
              {pulseMetrics.map((metric, idx) => (
                <article key={metric.label} className="text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p
                    className={[
                      'mt-1 text-base font-semibold transition',
                      idx === activeMetricIndex ? 'text-primary-700' : 'text-slate-700'
                    ].join(' ')}
                  >
                    {metric.value}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section id="features" className="mx-auto w-full max-w-5xl space-y-5">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Core Features</p>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Everything needed to manage insider fraud risk</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {capabilities.map((item, index) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">
                        {item.icon}
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Feature {index + 1}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                      {item.impact}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="workflow" className="mx-auto w-full max-w-4xl space-y-5">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Platform Workflow</p>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">From access activity to controlled resolution</h2>
            </div>

            <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {workflow.slice(0, 2).map((item) => (
                  <article key={item.step} className="flex gap-4 border-l-2 border-slate-200 pl-4 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[10px] font-semibold text-accent-700">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-sm leading-7 text-slate-600">{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="space-y-4">
                {workflow.slice(2, 4).map((item) => (
                  <article key={item.step} className="flex gap-4 border-l-2 border-slate-200 pl-4 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[10px] font-semibold text-accent-700">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-sm leading-7 text-slate-600">{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="roles" className="space-y-5">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Role Experiences</p>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Purpose-built views for every function</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roleCards.map((roleCard) => (
                <article
                  key={roleCard.key}
                  className={[
                    'rounded-xl border p-4 transition',
                    selectedRole === roleCard.key
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-white'
                  ].join(' ')}
                >
                  <h3 className="text-center text-sm font-semibold text-slate-900">{roleCard.title}</h3>
                  <p className="mt-2 text-center text-sm leading-6 text-slate-600">{roleCard.description}</p>
                  <p className="mt-3 text-center text-[11px] text-primary-700">
                    {selectedRole === roleCard.key ? 'Currently selected for launch' : 'Tap role above to select'}
                  </p>
                </article>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Included in {ROLE_LABELS[selectedRole]}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedNavigation.map((item) => (
                  <span key={item.path} className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] text-primary-700">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-primary-600 px-6 py-8 text-center text-white md:px-8">
            <h2 className="text-2xl font-semibold md:text-3xl">Ready to experience Sentinel?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-primary-100">
              Launch directly into the platform with your selected role and explore end-to-end insider-risk workflows.
            </p>
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={startingDemo}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {startingDemo ? 'Launching Platform...' : `Launch ${ROLE_LABELS[selectedRole]} View`}
            </button>
          </section>
        </main>

        <footer id="footer" className="mt-8 border-t border-slate-200 pt-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white">S</div>
                <span className="text-sm font-semibold tracking-wide text-slate-800">Sentinel</span>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                AI-powered insider fraud detection platform designed for banking operations.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {footerLinks.product.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Use Cases</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {footerLinks.useCases.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {footerLinks.company.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
            © 2026 Sentinel. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}