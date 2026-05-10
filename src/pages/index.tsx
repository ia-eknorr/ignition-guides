import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

const features = [
  {
    title: "Version Control",
    description:
      "Learn Git workflows for Ignition projects: workstation setup, branching strategy, pull requests, and style guidelines.",
  },
  {
    title: "Hands-On Labs",
    description:
      "Follow step-by-step labs that walk through real Ignition workflows. Build muscle memory with practical exercises.",
  },
  {
    title: "Tools & Ecosystem",
    description:
      "Reference pages for community tools built around Ignition: operators, linters, and automation that extend your workflow.",
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
          {features.map((f, idx) => (
            <div key={idx} className={clsx("col col--4")}>
              <div className="feature">
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
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
