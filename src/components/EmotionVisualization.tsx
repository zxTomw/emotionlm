import React from 'react';
import type { EmotionState, EmotionType } from '../types/emotions';
import { EMOTION_COLORS, EMOTION_CATEGORIES } from '../types/emotions';
import { EmotionSystem } from '../lib/emotionSystem';

interface EmotionVisualizationProps {
  emotions: EmotionState;
  primaryEmotion: EmotionType;
  className?: string;
}

export const EmotionVisualization: React.FC<EmotionVisualizationProps> = ({
  emotions,
  primaryEmotion,
  className = ''
}) => {
  const topEmotions = Object.entries(emotions)
    .filter(([, value]) => value > 0.1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className={`emotion-visualization ${className}`}>
      <div className="primary-emotion">
        <span className="emotion-label">
          {EmotionSystem.formatEmotionForDisplay(primaryEmotion)}
        </span>
      </div>
      
      {topEmotions.length > 0 && (
        <div className="emotion-breakdown">
          {topEmotions.map(([emotion, value]) => (
            <div key={emotion} className="emotion-bar">
              <div className="emotion-info">
                <span className="emotion-name">{emotion}</span>
                <span className="emotion-value">{Math.round(value * 100)}%</span>
              </div>
              <div className="emotion-bar-container">
                <div 
                  className="emotion-bar-fill"
                  style={{
                    width: `${value * 100}%`,
                    backgroundColor: EMOTION_COLORS[emotion as EmotionType]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface EmotionCategoriesProps {
  emotions: EmotionState;
}

export const EmotionCategories: React.FC<EmotionCategoriesProps> = ({ emotions }) => {
  const categoryAverages = Object.entries(EMOTION_CATEGORIES).map(([category, emotionList]) => {
    const categorySum = emotionList.reduce((sum, emotion) => sum + emotions[emotion], 0);
    const average = categorySum / emotionList.length;
    return { category, average };
  });

  return (
    <div className="emotion-categories">
      <h4>Emotion Categories</h4>
      {categoryAverages.map(({ category, average }) => (
        <div key={category} className="category-item">
          <span className="category-name">{category}</span>
          <div className="category-bar">
            <div 
              className="category-fill"
              style={{ width: `${average * 100}%` }}
            />
          </div>
          <span className="category-value">{Math.round(average * 100)}%</span>
        </div>
      ))}
    </div>
  );
};