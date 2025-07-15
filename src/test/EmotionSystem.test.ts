import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmotionSystem } from '../lib/emotionSystem'
import type { EmotionState } from '../types/emotions'

describe('EmotionSystem', () => {
  describe('getBaselineEmotions', () => {
    it('should return valid baseline emotions', () => {
      const emotions = EmotionSystem.getBaselineEmotions()
      
      expect(emotions).toBeDefined()
      expect(typeof emotions).toBe('object')
      
      // Check all required emotion keys exist
      const requiredKeys = [
        'curiosity', 'uncertainty', 'surprise', 'confusion', 'insight',
        'engagement', 'determination', 'satisfaction', 'frustration', 'anticipation',
        'empathy', 'concern', 'appreciation', 'patience',
        'contemplation', 'doubt', 'wonder'
      ]
      
      requiredKeys.forEach(key => {
        expect(emotions).toHaveProperty(key)
        expect(typeof emotions[key as keyof EmotionState]).toBe('number')
        expect(emotions[key as keyof EmotionState]).toBeGreaterThanOrEqual(0)
        expect(emotions[key as keyof EmotionState]).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('getPrimaryEmotion', () => {
    it('should return the emotion with highest value', () => {
      const emotions: EmotionState = {
        ...EmotionSystem.getBaselineEmotions(),
        curiosity: 0.9,
        engagement: 0.1
      }
      
      const primary = EmotionSystem.getPrimaryEmotion(emotions)
      expect(primary).toBe('curiosity')
    })

    it('should handle tie by returning the first found', () => {
      const emotions: EmotionState = {
        ...EmotionSystem.getBaselineEmotions(),
        curiosity: 0.5,
        engagement: 0.5
      }
      
      const primary = EmotionSystem.getPrimaryEmotion(emotions)
      expect(['curiosity', 'engagement']).toContain(primary)
    })
  })

  describe('getEmotionIntensity', () => {
    it('should return the maximum emotion value', () => {
      const emotions: EmotionState = {
        ...EmotionSystem.getBaselineEmotions(),
        curiosity: 0.9,
        engagement: 0.3
      }
      
      const intensity = EmotionSystem.getEmotionIntensity(emotions)
      expect(intensity).toBe(0.9)
    })
  })

  describe('formatEmotionForDisplay', () => {
    it('should format emotions with emojis', () => {
      const formatted = EmotionSystem.formatEmotionForDisplay('curiosity')
      expect(formatted).toContain('Curious')
      expect(formatted).toContain('🤔')
    })

    it('should handle unknown emotions', () => {
      const formatted = EmotionSystem.formatEmotionForDisplay('unknown' as EmotionType)
      expect(formatted).toBe('Neutral 😐')
    })
  })

  describe('analyzeEmotions', () => {
    let mockLLM: {
      withStructuredOutput: () => { invoke: ReturnType<typeof vi.fn> }
      invoke: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
      mockLLM = {
        withStructuredOutput: vi.fn().mockReturnValue({
          invoke: vi.fn()
        }),
        invoke: vi.fn()
      }
    })

    it('should handle successful structured output', async () => {
      const mockResult = EmotionSystem.getBaselineEmotions()
      mockLLM.withStructuredOutput().invoke.mockResolvedValue(mockResult)

      const result = await EmotionSystem.analyzeEmotions('Hello', 'Hi there!', mockLLM)
      
      expect(result).toEqual(mockResult)
      expect(mockLLM.withStructuredOutput).toHaveBeenCalled()
    })

    it('should fallback to JSON parsing when structured output fails', async () => {
      const mockEmotions = EmotionSystem.getBaselineEmotions()
      
      // First call (structured) fails
      mockLLM.withStructuredOutput().invoke.mockRejectedValue(new Error('Structured output failed'))
      
      // Second call (regular) succeeds with JSON
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify(mockEmotions)
      })

      const result = await EmotionSystem.analyzeEmotions('Hello', 'Hi there!', mockLLM)
      
      expect(result).toEqual(mockEmotions)
      expect(mockLLM.invoke).toHaveBeenCalled()
    })

    it('should fallback to rule-based emotions when all LLM calls fail', async () => {
      // Both structured and regular calls fail
      mockLLM.withStructuredOutput().invoke.mockRejectedValue(new Error('Structured failed'))
      mockLLM.invoke.mockRejectedValue(new Error('Regular failed'))

      const result = await EmotionSystem.analyzeEmotions('How are you?', 'I am doing well!', mockLLM)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      
      // Should have enhanced curiosity due to question
      expect(result.curiosity).toBeGreaterThan(EmotionSystem.getBaselineEmotions().curiosity)
    })

    it('should handle empty LLM responses', async () => {
      mockLLM.withStructuredOutput().invoke.mockRejectedValue(new Error('Empty response'))
      mockLLM.invoke.mockResolvedValue({ content: '' })

      const result = await EmotionSystem.analyzeEmotions('Test', 'Test response', mockLLM)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should enhance emotions based on rule patterns', async () => {
      // Force fallback to rule-based
      mockLLM.withStructuredOutput().invoke.mockRejectedValue(new Error('Failed'))
      mockLLM.invoke.mockRejectedValue(new Error('Failed'))

      const result = await EmotionSystem.analyzeEmotions(
        'I feel very sad about this situation',
        'I can help you find a solution to this problem',
        mockLLM
      )
      
      // Should have enhanced empathy (emotional language) and satisfaction (helpful response)
      const baseline = EmotionSystem.getBaselineEmotions()
      expect(result.empathy).toBeGreaterThan(baseline.empathy)
      expect(result.satisfaction).toBeGreaterThan(baseline.satisfaction)
    })
  })
})