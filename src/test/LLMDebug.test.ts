import { describe, it, expect, vi } from 'vitest'
import { ChatOllama } from '@langchain/ollama'

describe('LLM Integration Debug', () => {
  it('should create ChatOllama instance', () => {
    const llm = new ChatOllama({
      model: 'llama3.2',
      temperature: 0.7,
      maxRetries: 2,
    })
    
    expect(llm).toBeDefined()
    expect(llm.model).toBe('llama3.2')
  })

  it('should have withStructuredOutput method', () => {
    const llm = new ChatOllama({
      model: 'llama3.2'
    })
    
    expect(llm.withStructuredOutput).toBeDefined()
    expect(typeof llm.withStructuredOutput).toBe('function')
  })

  it('should test basic LLM response structure', async () => {
    // Mock the actual LLM call for testing
    const mockLLM = {
      invoke: vi.fn(),
      withStructuredOutput: vi.fn()
    }

    // Test normal response
    mockLLM.invoke.mockResolvedValue({
      content: 'Hello! How can I help you today?'
    })

    const response = await mockLLM.invoke('Hello')
    
    expect(response).toHaveProperty('content')
    expect(typeof response.content).toBe('string')
    expect(response.content.length).toBeGreaterThan(0)
  })

  it('should test empty response handling', async () => {
    const mockLLM = {
      invoke: vi.fn(),
      withStructuredOutput: vi.fn()
    }

    // Test empty response scenarios
    const emptyResponses = [
      { content: '' },
      { content: null },
      { content: undefined },
      {},
      null,
      undefined,
      ''
    ]

    for (const emptyResponse of emptyResponses) {
      mockLLM.invoke.mockResolvedValue(emptyResponse)
      
      const response = await mockLLM.invoke('test')
      
      // Check if response would cause issues
      const content = response?.content
      const isEmpty = !content || content.trim() === ''
      
      if (isEmpty) {
        console.log('Empty response detected:', emptyResponse)
      }
    }
  })

  it('should test structured output error conditions', async () => {
    const mockLLM = {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: vi.fn()
      })
    }

    // Test various error conditions
    const errorConditions = [
      new Error('Connection refused'),
      new Error('Model not found'),
      new Error('Timeout'),
      { error: 'Unknown error' },
      ''
    ]

    for (const error of errorConditions) {
      mockLLM.withStructuredOutput().invoke.mockRejectedValue(error)
      
      try {
        await mockLLM.withStructuredOutput().invoke('test')
      } catch (caught) {
        expect(caught).toBeDefined()
        console.log('Error condition tested:', error)
      }
    }
  })
})