import { describe, it, expect, vi } from 'vitest';
import { predictCraving } from './gemini';

// Mock the Gemini SDK exactly to simulate API resolution
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            cravingType: 'Sweet craving',
            reason: 'You had a highly active day, suggesting a low blood sugar reaction.',
            healthyAlternative: 'Frozen grapes',
            nudgeMessage: 'Grab some grapes!',
            contextScore: 85
          })
        })
      }
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY'
    }
  };
});

describe('Gemini AI Services Integration', () => {
  it('should return properly structured Craving prediction object', async () => {
    const prediction = await predictCraving({
      currentHour: 14,
      dayOfWeek: 'Tuesday',
      lastMealHoursAgo: 4,
      activityLevel: 'high',
      todayMoodEmoji: '🏃'
    });

    // Validating it passes output mapping logic unharmed
    expect(prediction).toBeDefined();
    expect(prediction.cravingType).toBe('Sweet craving');
    expect(prediction.healthyAlternative).toBe('Frozen grapes');
  });
});
