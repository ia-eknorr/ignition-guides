import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

const GitBranchIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

type Feature = {
  title: string;
  Icon: () => JSX.Element;
  description: string;
  to: string;
  cta: string;
};

const features: Feature[] = [
  {
    title: "Version Control",
    Icon: GitBranchIcon,
    description: "Git workflows for Ignition projects: branching strategy, pull requests, and commit conventions.",
    to: "/docs/guides/version-control/intro",
    cta: "Read the guide",
  },
  {
    title: "Hands-On Lab",
    Icon: TerminalIcon,
    description: "Set up a Docker-based Ignition project with version control end to end, from fork to merged pull request.",
    to: "/docs/labs/git-ignition-lab",
    cta: "Start the lab",
  },
  {
    title: "Tools & Ecosystem",
    Icon: WrenchIcon,
    description: "Community tools built around Ignition: operators, linters, and automation that extend your workflow.",
    to: "/docs/tools/overview",
    cta: "Browse tools",
  },
];

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero hero--primary">
      <div className="container">
        <img
          src="img/logo.png"
          alt="Ignition Guides logo"
          width="140"
          style={{ marginBottom: "1rem" }}
        />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div style={{ marginTop: "1.5rem" }}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className="features">
      <div className="container">
        <div className="row">
          {features.map(({ title, Icon, description, to, cta }, idx) => (
            <div key={idx} className={clsx("col col--4")}>
              <Link to={to} className="feature">
                <div className="feature__icon">
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature__cta">{cta} →</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
      </main>
    </Layout>
  );
}
