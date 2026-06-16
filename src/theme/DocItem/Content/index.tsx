import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import AppliesTo from "@site/src/components/AppliesTo";

type Props = WrapperProps<typeof ContentType>;

// Wraps the original doc body to auto-render `applies_to` badges from front matter
// at the top of every page. AppliesTo returns null when the field is absent, so
// pages that don't declare a deployment context are unaffected.
export default function ContentWrapper(props: Props): JSX.Element {
  const { frontMatter } = useDoc();
  const platforms = (frontMatter as { applies_to?: unknown }).applies_to;

  return (
    <>
      <AppliesTo platforms={platforms} />
      <Content {...props} />
    </>
  );
}
