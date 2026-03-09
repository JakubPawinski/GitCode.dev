import { Injectable } from '@nestjs/common';

interface EventMappingConfig {
  baseEventType: string;
  languageEventType: string;
  difficultyEventType: string;
}

@Injectable()
export class AchievementEventMapperService {
  private readonly languageMap: Record<string, string> = {
    javascript: 'SUBMISSION_COMPLETED_JAVASCRIPT',
    python: 'SUBMISSION_COMPLETED_PYTHON',
    typescript: 'SUBMISSION_COMPLETED_TYPESCRIPT',
    java: 'SUBMISSION_COMPLETED_JAVA',
    cpp: 'SUBMISSION_COMPLETED_CPP',
    'c++': 'SUBMISSION_COMPLETED_CPP',
    go: 'SUBMISSION_COMPLETED_GO',
    rust: 'SUBMISSION_COMPLETED_RUST',
  };

  private readonly difficultyMap: Record<string, string> = {
    EASY: 'SUBMISSION_COMPLETED_EASY',
    MEDIUM: 'SUBMISSION_COMPLETED_MEDIUM',
    HARD: 'SUBMISSION_COMPLETED_HARD',
  };

  private mapSubmissionToAchievementEvents(
    language: string,
    difficulty?: string,
  ): EventMappingConfig {
    const normalizedLanguage = language.toLowerCase().trim();

    return {
      baseEventType: 'SUBMISSION_COMPLETED',
      languageEventType:
        this.languageMap[normalizedLanguage] || 'SUBMISSION_COMPLETED_UNKNOWN',
      difficultyEventType: difficulty
        ? this.difficultyMap[difficulty.toUpperCase()] ||
          'SUBMISSION_COMPLETED_UNKNOWN'
        : 'SUBMISSION_COMPLETED_UNKNOWN',
    };
  }

  public getAllEventTypesForSubmission(
    language: string,
    difficulty?: string,
  ): string[] {
    const mapping = this.mapSubmissionToAchievementEvents(language, difficulty);
    const events = [mapping.baseEventType, mapping.languageEventType];

    if (
      difficulty &&
      mapping.difficultyEventType !== 'SUBMISSION_COMPLETED_UNKNOWN'
    ) {
      events.push(mapping.difficultyEventType);
    }

    return events;
  }
}
