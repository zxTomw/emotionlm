import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '../components/ChatInterface'

// Mock the useChat hook
vi.mock('../hooks/useChat', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
    isLoading: false,
    error: null
  }))
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render welcome message when no messages', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('Welcome to EmotionLM!')).toBeInTheDocument()
    expect(screen.getByText('This AI assistant experiences emotions while chatting with you.')).toBeInTheDocument()
  })

  it('should render header with controls', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('🤖 EmotionLM Chat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show emotion details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument()
  })

  it('should have chat input form', () => {
    render(<ChatInterface />)
    
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /📤/i })).toBeInTheDocument()
  })

  it('should toggle emotion details panel', async () => {
    const user = userEvent.setup()
    render(<ChatInterface />)
    
    const toggleButton = screen.getByRole('button', { name: /show emotion details/i })
    
    await user.click(toggleButton)
    expect(screen.getByRole('button', { name: /hide emotion details/i })).toBeInTheDocument()
  })

  it('should disable send button when input is empty', () => {
    render(<ChatInterface />)
    
    const sendButton = screen.getByRole('button', { name: /📤/i })
    expect(sendButton).toBeDisabled()
  })

  it('should enable send button when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message here...')
    const sendButton = screen.getByRole('button', { name: /📤/i })
    
    await user.type(input, 'Hello!')
    expect(sendButton).not.toBeDisabled()
  })
})