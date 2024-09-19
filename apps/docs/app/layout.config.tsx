import { type HomeLayoutProps } from "fumadocs-ui/home-layout";

/**
 * Shared layout configuration
 *
 * you cna configure layouts individually from:
 * Home Layout:
 */
export const baseOptions: HomeLayoutProps = {
  nav: {
    title: "SafeFn",
  },
  links: [
    {
      url: "/docs",
      text: "Docs",
    },
  ],
  githubUrl: "https://github.com/janglad/safe-fn",
};
