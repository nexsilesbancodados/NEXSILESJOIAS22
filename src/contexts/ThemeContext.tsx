import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

// Safe useTheme hook that handles errors gracefully
export function useTheme() {
  try {
    return useNextTheme();
  } catch (error) {
    // Fallback when next-themes hook fails
    console.warn('useTheme fallback activated:', error);
    return {
      theme: 'system',
      setTheme: (theme: string) => {
        if (typeof window !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          if (theme !== 'system') {
            document.documentElement.classList.add(theme);
          }
        }
      },
      resolvedTheme: typeof window !== 'undefined' 
        ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
        : 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light' as const,
    };
  }
}
