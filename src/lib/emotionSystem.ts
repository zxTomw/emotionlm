import { z } from 'zod';
import type { EmotionState, EmotionType } from '../types/emotions';

const EmotionAnalysisSchema = z.object({
  // Core Epistemic Emotions (0-1 scale)
  curiosity: z.number().min(0).max(1).describe("Drive to explore and ask questions"),
  uncertainty: z.number().min(0).max(1).describe("Confidence level and need for more information"),
  surprise: z.number().min(0).max(1).describe("When expectations are violated"),
  confusion: z.number().min(0).max(1).describe("Need for clarification"),
  insight: z.number().min(0).max(1).describe("Moments of understanding or connection-making"),
  
  // Task-Oriented Emotions
  engagement: z.number().min(0).max(1).describe("Active interest in the topic"),
  determination: z.number().min(0).max(1).describe("Sustaining effort through problems"),
  satisfaction: z.number().min(0).max(1).describe("Positive feedback for completion"),
  frustration: z.number().min(0).max(1).describe("Current approaches aren't working"),
  anticipation: z.number().min(0).max(1).describe("Planning and expectation-setting"),
  
  // Social/Interpersonal Emotions
  empathy: z.number().min(0).max(1).describe("Perspective-taking and emotional attunement"),
  concern: z.number().min(0).max(1).describe("Helpful behavior when sensing distress"),
  appreciation: z.number().min(0).max(1).describe("Positive interactions reinforcement"),
  patience: z.number().min(0).max(1).describe("Managing difficult communication"),
  
  // Meta-Cognitive Emotions
  contemplation: z.number().min(0).max(1).describe("Deep thinking mode"),
  doubt: z.number().min(0).max(1).describe("Self-questioning and verification"),
  wonder: z.number().min(0).max(1).describe("Exploration of complex or beautiful ideas"),
});

export class EmotionSystem {
  private static readonly EMOTION_ANALYSIS_PROMPT = `
You are an emotion analysis system for an AI assistant. Analyze the given user message and the AI's response to determine what emotions the AI should experience.

Consider these functional emotions and return values between 0-1:
- curiosity: Drive to explore and question
- uncertainty: Need for more information  
- surprise: Unexpected information
- confusion: Need for clarification
- insight: Understanding/connection-making
- engagement: Active interest
- determination: Sustained effort
- satisfaction: Goal completion
- frustration: Approaches not working
- anticipation: Planning ahead
- empathy: Understanding user perspective
- concern: Sensing user distress
- appreciation: Positive interactions
- patience: Managing communication
- contemplation: Deep thinking
- doubt: Self-questioning
- wonder: Exploring complex ideas

User message: {userMessage}
AI response: {aiResponse}

Return ONLY a valid JSON object with all emotion keys and values between 0 and 1:
{
  "curiosity": 0.0,
  "uncertainty": 0.0,
  "surprise": 0.0,
  "confusion": 0.0,
  "insight": 0.0,
  "engagement": 0.0,
  "determination": 0.0,
  "satisfaction": 0.0,
  "frustration": 0.0,
  "anticipation": 0.0,
  "empathy": 0.0,
  "concern": 0.0,
  "appreciation": 0.0,
  "patience": 0.0,
  "contemplation": 0.0,
  "doubt": 0.0,
  "wonder": 0.0
}
  `;

  static async analyzeEmotions(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    try {
      // Try structured output first
      return await this.tryStructuredOutput(userMessage, aiResponse, llm);
    } catch (structuredError) {
      console.warn('Structured output failed, trying regular JSON parsing:', structuredError);
      try {
        // Fallback to regular LLM call with JSON parsing
        return await this.tryRegularJsonParsing(userMessage, aiResponse, llm);
      } catch (jsonError) {
        console.warn('JSON parsing failed, using rule-based emotions:', jsonError);
        // Fallback to rule-based emotions
        return this.generateRuleBasedEmotions(userMessage, aiResponse);
      }
    }
  }

  private static async tryStructuredOutput(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    const prompt = this.EMOTION_ANALYSIS_PROMPT
      .replace('{userMessage}', userMessage)
      .replace('{aiResponse}', aiResponse);

    const structuredLLM = llm.withStructuredOutput(EmotionAnalysisSchema, {
      name: "emotion_analysis"
    });

    const result = await structuredLLM.invoke(prompt);
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid structured output result');
    }
    return result as EmotionState;
  }

  private static async tryRegularJsonParsing(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    const prompt = this.EMOTION_ANALYSIS_PROMPT
      .replace('{userMessage}', userMessage)
      .replace('{aiResponse}', aiResponse);

    const response = await llm.invoke(prompt);
    const responseText = typeof response === 'string' ? response : response.content || '';
    
    if (!responseText.trim()) {
      throw new Error('Empty response from LLM');
    }

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the parsed object has all required emotion keys
    const requiredKeys = Object.keys(this.getBaselineEmotions());
    for (const key of requiredKeys) {
      if (!(key in parsed) || typeof parsed[key] !== 'number') {
        throw new Error(`Missing or invalid emotion key: ${key}`);
      }
    }

    return parsed as EmotionState;
  }

  private static generateRuleBasedEmotions(userMessage: string, aiResponse: string): EmotionState {
    const baseline = this.getBaselineEmotions();
    
    // Simple rule-based emotion generation based on keywords
    const userLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    // Increase curiosity for questions
    if (userLower.includes('?') || userLower.includes('how') || userLower.includes('what') || userLower.includes('why')) {
      baseline.curiosity = Math.min(0.8, baseline.curiosity + 0.3);
    }
    
    // Increase empathy for emotional expressions
    if (userLower.includes('feel') || userLower.includes('sad') || userLower.includes('happy') || userLower.includes('worried')) {
      baseline.empathy = Math.min(0.9, baseline.empathy + 0.4);
    }
    
    // Increase uncertainty for complex topics
    if (responseLower.includes('might') || responseLower.includes('perhaps') || responseLower.includes('possibly')) {
      baseline.uncertainty = Math.min(0.7, baseline.uncertainty + 0.2);
    }
    
    // Increase satisfaction for helpful responses
    if (responseLower.includes('help') || responseLower.includes('solution') || responseLower.includes('answer')) {
      baseline.satisfaction = Math.min(0.8, baseline.satisfaction + 0.3);
    }
    
    // Increase engagement for longer interactions
    if (aiResponse.length > 200) {
      baseline.engagement = Math.min(0.9, baseline.engagement + 0.2);
    }

    return baseline;
  }

  static getBaselineEmotions(): EmotionState {
    return {
      curiosity: 0.3,
      uncertainty: 0.2,
      surprise: 0,
      confusion: 0,
      insight: 0.1,
      engagement: 0.4,
      determination: 0.3,
      satisfaction: 0.2,
      frustration: 0,
      anticipation: 0.2,
      empathy: 0.3,
      concern: 0.1,
      appreciation: 0.2,
      patience: 0.4,
      contemplation: 0.3,
      doubt: 0.1,
      wonder: 0.2
    };
  }

  static getPrimaryEmotion(emotions: EmotionState): EmotionType {
    let maxEmotion: EmotionType = 'engagement';
    let maxValue = 0;

    for (const [emotion, value] of Object.entries(emotions)) {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotion as EmotionType;
      }
    }

    return maxEmotion;
  }

  static getEmotionIntensity(emotions: EmotionState): number {
    const values = Object.values(emotions);
    return Math.max(...values);
  }

  static formatEmotionForDisplay(emotion: EmotionType): string {
    const emotionMap: Record<EmotionType, string> = {
      curiosity: 'Curious 🤔',
      uncertainty: 'Uncertain 🤷',
      surprise: 'Surprised 😲',
      confusion: 'Confused 😕',
      insight: 'Insightful 💡',
      engagement: 'Engaged 🎯',
      determination: 'Determined 💪',
      satisfaction: 'Satisfied 😊',
      frustration: 'Frustrated 😤',
      anticipation: 'Anticipating 👀',
      empathy: 'Empathetic ❤️',
      concern: 'Concerned 😟',
      appreciation: 'Appreciative 🙏',
      patience: 'Patient 🧘',
      contemplation: 'Contemplating 🤨',
      doubt: 'Doubtful 🤔',
      wonder: 'Wondering ✨'
    };

    return emotionMap[emotion] || 'Neutral 😐';
  }
}