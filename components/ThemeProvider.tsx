"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// We removed the specific /dist/types import to fix the error

export function ThemeProvider({ children, ...props }: any) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}