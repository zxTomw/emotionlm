import '@testing-library/jest-dom'

// Mock Ollama for tests
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  console.warn = originalConsole.warn
  console.error = originalConsole.error
  vi.restoreAllMocks()
})