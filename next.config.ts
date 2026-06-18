import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesPath = "/wattopia-2050";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? githubPagesPath : undefined,
  assetPrefix: isGithubPages ? `${githubPagesPath}/` : undefined,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
