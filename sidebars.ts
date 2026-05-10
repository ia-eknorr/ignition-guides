import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    { type: "doc", id: "index", label: "Home" },
    {
      type: "category",
      label: "Getting Started",
      link: { type: "doc", id: "getting-started/index" },
      items: [
        "getting-started/workstation-setup",
        "getting-started/traefik",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        {
          type: "category",
          label: "Version Control",
          link: { type: "doc", id: "guides/version-control/intro" },
          items: [
            "guides/version-control/wsl-setup",
            "guides/version-control/initialize-repository",
            "guides/version-control/branching-strategy",
            "guides/version-control/create-a-branch",
            "guides/version-control/create-a-pull-request",
            "guides/version-control/merge-a-pull-request",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Labs",
      items: ["labs/git-ignition-lab"],
    },
    {
      type: "category",
      label: "Reference",
      items: ["reference/git-style-guide"],
    },
    {
      type: "category",
      label: "Tools",
      items: [
        "tools/overview",
        "tools/stoker-operator",
        "tools/ignition-lint",
      ],
    },
  ],
};

export default sidebars;
