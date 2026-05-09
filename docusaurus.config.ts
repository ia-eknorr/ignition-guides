import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Ignition Guides",
  tagline: "Unofficial guides for Ignition SCADA infrastructure and workflows",
  favicon: "img/logo.png",

  url: "https://ia-eknorr.github.io",
  baseUrl: "/ignition-guides/",

  organizationName: "ia-eknorr",
  projectName: "ignition-guides",

  onBrokenLinks: "throw",

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  themes: [
    "@docusaurus/theme-mermaid",
    [
      "@cmfcmf/docusaurus-search-local",
      { indexBlog: false },
    ],
  ],

  clientModules: ["./src/searchShortcut.js"],

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
          title: "Guides",
          items: [
            { label: "Version Control", to: "/docs/version-control/intro" },
            { label: "Hands-On Lab", to: "/docs/version-control/lab" },
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
  } satisfies Preset.ThemeConfig,
};

export default config;
