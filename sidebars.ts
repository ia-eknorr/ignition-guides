import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "Version Control",
      items: [
        "version-control/intro",
        "version-control/workstation-setup",
        "version-control/wsl-setup",
        "version-control/initialize-repository",
        "version-control/branching-strategy",
        "version-control/create-a-branch",
        "version-control/create-a-pull-request",
        "version-control/merge-a-pull-request",
        "version-control/style-guide",
        "version-control/lab",
      ],
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
