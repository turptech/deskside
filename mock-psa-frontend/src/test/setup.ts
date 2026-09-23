import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import { mockTicketApiFetch } from "@/test/mock-ticket-api"

afterEach(() => cleanup())

Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  writable: true,
  value: mockTicketApiFetch,
})

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

Object.defineProperties(Element.prototype, {
  hasPointerCapture: {
    value: () => false,
  },
  setPointerCapture: {
    value: () => undefined,
  },
  releasePointerCapture: {
    value: () => undefined,
  },
  scrollIntoView: {
    value: () => undefined,
  },
})
