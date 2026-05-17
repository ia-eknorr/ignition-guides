import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import remarkTokenSubstitution from "./src/plugins/remark-token-substitution";
import { IGNITION_VERSION } from "./src/constants";

const config: Config = {
  title: "Ignition Guides",
  tagline: "Community guides for Ignition SCADA using modern development practices",
  favicon: "img/favicon.ico",

  url: "https://ia-eknorr.github.io",
  baseUrl: "/ignition-guides/",

  organizationName: "ia-eknorr",
  projectName: "ignition-guides",

  future: {
    v4: true,
  },

  onBrokenLinks: "throw",

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
    mdx1Compat: {
      admonitions: true,
    },
  },

  themes: [
    "@docusaurus/theme-mermaid",
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      { hashed: true },
    ],
  ],

  plugins: [
    "@docusaurus/plugin-ideal-image",
    "docusaurus-plugin-image-zoom",
    [
      "@signalwire/docusaurus-plugin-llms-txt",
      {
        siteTitle: "Ignition Guides",
        siteDescription: "Community guides for Ignition SCADA using modern development practices",
        depth: 2,
        content: {
          enableLlmsFullTxt: true,
        },
      },
    ],
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/ia-eknorr/ignition-guides/tree/main/",
          beforeDefaultRemarkPlugins: [
            [remarkTokenSubstitution, { tokens: { IGNITION_VERSION } }],
          ],
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/logo.png",
    navbar: {
      title: "Ignition Guides",
      logo: {
        alt: "Ignition Guides Logo",
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/ia-eknorr/ignition-guides",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting Started", to: "/docs/getting-started" },
            { label: "Guides", to: "/docs/guides/docker/intro" },
            { label: "Labs", to: "/docs/labs/docker-ignition-lab" },
            { label: "Reference", to: "/docs/reference/git-style-guide" },
            { label: "Tools", to: "/docs/tools/overview" },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/ia-eknorr/ignition-guides",
            },
            {
              label: "Stoker Operator",
              href: "https://ia-eknorr.github.io/stoker-operator/",
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Ignition Guides Contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "yaml"],
    },
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    zoom: {
      selector: ".markdown img",
      background: {
        light: "rgb(255, 255, 255)",
        dark: "rgb(50, 50, 50)",
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
