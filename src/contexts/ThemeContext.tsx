import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

// Safe theme context that works even if next-themes fails
interface ThemeContextType {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
});

// Inner component that uses next-themes hook safely
function ThemeProviderInner({ children }: ThemeProviderProps) {
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

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', setTheme: () => {}, resolvedTheme: 'light' }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeProviderInner>{children}</ThemeProviderInner>;
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
