import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "deskside-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = window.localStorage.getItem(storageKey)
    return storedTheme === "dark" ||
      storedTheme === "light" ||
      storedTheme === "system"
      ? storedTheme
      : defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = () => {
      const resolvedTheme =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
      root.style.colorScheme = resolvedTheme
    }

    applyTheme()
    mediaQuery.addEventListener("change", applyTheme)
    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: Theme) => {
        window.localStorage.setItem(storageKey, nextTheme)
        setThemeState(nextTheme)
      },
    }),
    [storageKey, theme],
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
