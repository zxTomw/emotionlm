import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmotionSystem } from '../lib/emotionSystem'
import type { EmotionState, EmotionType } from '../types/emotions'

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

  describe('generateResponseWithEmotions', () => {
    let mockLLM: {
      withStructuredOutput: () => { invoke: ReturnType<typeof vi.fn> }
    }

    beforeEach(() => {
      mockLLM = {
        withStructuredOutput: vi.fn().mockReturnValue({
          invoke: vi.fn()
        })
      }
    })

    it('should generate response with emotions using structured output', async () => {
      const mockResult = {
        response: 'Hello! How can I help you today?',
        emotions: EmotionSystem.getBaselineEmotions()
      }
      mockLLM.withStructuredOutput().invoke.mockResolvedValue(mockResult)

      const result = await EmotionSystem.generateResponseWithEmotions('Hello', mockLLM)
      
      expect(result).toEqual(mockResult)
      expect(result.response).toBe('Hello! How can I help you today?')
      expect(result.emotions).toBeDefined()
      expect(mockLLM.withStructuredOutput).toHaveBeenCalled()
    })

    it('should throw error if response is empty', async () => {
      const mockResult = {
        response: '',
        emotions: EmotionSystem.getBaselineEmotions()
      }
      mockLLM.withStructuredOutput().invoke.mockResolvedValue(mockResult)

      await expect(EmotionSystem.generateResponseWithEmotions('Hello', mockLLM))
        .rejects.toThrow('Invalid combined response')
    })

    it('should throw error if emotions are missing', async () => {
      const mockResult = {
        response: 'Hello!',
        emotions: null
      }
      mockLLM.withStructuredOutput().invoke.mockResolvedValue(mockResult)

      await expect(EmotionSystem.generateResponseWithEmotions('Hello', mockLLM))
        .rejects.toThrow('Invalid combined response')
    })

    it('should validate emotion keys and values', async () => {
      const mockResult = {
        response: 'Hello!',
        emotions: {
          curiosity: 0.5,
          // Missing other required emotions
        }
      }
      mockLLM.withStructuredOutput().invoke.mockResolvedValue(mockResult)

      await expect(EmotionSystem.generateResponseWithEmotions('Hello', mockLLM))
        .rejects.toThrow('Missing or invalid emotion key')
    })
  })
})