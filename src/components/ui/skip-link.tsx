import React from "react";

/**
 * Skip link component - renders an anchor that is only visible on keyboard focus.
 * Place at the very top of the page layout, before the Header.
 */
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
  >
    Saltar al contenido
  </a>
);
