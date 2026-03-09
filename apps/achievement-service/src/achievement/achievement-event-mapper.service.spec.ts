import { Test, TestingModule } from '@nestjs/testing';
import { AchievementEventMapperService } from './achievement-event-mapper.service';

describe('AchievementEventMapperService', () => {
  let service: AchievementEventMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AchievementEventMapperService],
    }).compile();

    service = module.get<AchievementEventMapperService>(
      AchievementEventMapperService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEventTypesForSubmission', () => {
    // ========== LANGUAGE MAPPING TESTS ==========

    describe('language mapping', () => {
      it('should map javascript language', () => {
        const result = service.getAllEventTypesForSubmission('javascript');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
      });

      it('should map python language', () => {
        const result = service.getAllEventTypesForSubmission('python');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_PYTHON');
      });

      it('should map typescript language', () => {
        const result = service.getAllEventTypesForSubmission('typescript');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_TYPESCRIPT');
      });

      it('should map java language', () => {
        const result = service.getAllEventTypesForSubmission('java');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVA');
      });

      it('should map cpp language', () => {
        const result = service.getAllEventTypesForSubmission('cpp');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_CPP');
      });

      it('should map c++ language', () => {
        const result = service.getAllEventTypesForSubmission('c++');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_CPP');
      });

      it('should map go language', () => {
        const result = service.getAllEventTypesForSubmission('go');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_GO');
      });

      it('should map rust language', () => {
        const result = service.getAllEventTypesForSubmission('rust');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_RUST');
      });

      it('should handle unknown language', () => {
        const result = service.getAllEventTypesForSubmission('cobol');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_UNKNOWN');
        expect(result.length).toBe(2);
      });

      it('should be case insensitive for language', () => {
        const resultLowercase =
          service.getAllEventTypesForSubmission('JAVASCRIPT');
        const resultUppercase =
          service.getAllEventTypesForSubmission('JavaScript');
        const resultMixed = service.getAllEventTypesForSubmission('JaVaScRiPt');

        expect(resultLowercase).toEqual(resultUppercase);
        expect(resultLowercase).toEqual(resultMixed);
      });

      it('should trim whitespace from language', () => {
        const resultWithSpaces =
          service.getAllEventTypesForSubmission('  javascript  ');
        const resultClean = service.getAllEventTypesForSubmission('javascript');

        expect(resultWithSpaces).toEqual(resultClean);
      });

      it('should handle language with tabs and newlines', () => {
        const resultWithWhitespace =
          service.getAllEventTypesForSubmission('\t\njavascript\n\t');
        const resultClean = service.getAllEventTypesForSubmission('javascript');

        expect(resultWithWhitespace).toEqual(resultClean);
      });
    });

    // ========== DIFFICULTY MAPPING TESTS ==========

    describe('difficulty mapping', () => {
      it('should map EASY difficulty', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
        expect(result).toContain('SUBMISSION_COMPLETED_EASY');
      });

      it('should map MEDIUM difficulty', () => {
        const result = service.getAllEventTypesForSubmission(
          'python',
          'MEDIUM',
        );

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_PYTHON');
        expect(result).toContain('SUBMISSION_COMPLETED_MEDIUM');
      });

      it('should map HARD difficulty', () => {
        const result = service.getAllEventTypesForSubmission('java', 'HARD');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVA');
        expect(result).toContain('SUBMISSION_COMPLETED_HARD');
      });

      it('should not include difficulty event when difficulty is undefined', () => {
        const result = service.getAllEventTypesForSubmission('javascript');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
        expect(result).not.toContain('SUBMISSION_COMPLETED_EASY');
        expect(result).not.toContain('SUBMISSION_COMPLETED_MEDIUM');
        expect(result).not.toContain('SUBMISSION_COMPLETED_HARD');
      });

      it('should not include difficulty event when difficulty is null', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          null as any,
        );

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
        expect(result.length).toBe(2);
      });

      it('should not include difficulty event when difficulty is empty string', () => {
        const result = service.getAllEventTypesForSubmission('javascript', '');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
        expect(result.length).toBe(2);
      });

      it('should include UNKNOWN difficulty when difficulty is not recognized', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          'UNKNOWN_LEVEL',
        );

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_JAVASCRIPT');
        // UNKNOWN difficulty maps to SUBMISSION_COMPLETED_UNKNOWN, which should NOT be included
      });

      it('should be case insensitive for difficulty', () => {
        const resultUppercase = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );
        const resultLowercase = service.getAllEventTypesForSubmission(
          'javascript',
          'easy',
        );
        const resultMixed = service.getAllEventTypesForSubmission(
          'javascript',
          'Easy',
        );

        expect(resultUppercase).toEqual(resultLowercase);
        expect(resultUppercase).toEqual(resultMixed);
      });

      it('should handle whitespace in difficulty', () => {
        const resultWithSpaces = service.getAllEventTypesForSubmission(
          'javascript',
          '  EASY  ',
        );
        const resultClean = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );

        expect(resultWithSpaces).toEqual(resultClean);
      });
    });

    // ========== COMBINATION TESTS ==========

    describe('language and difficulty combinations', () => {
      it('should combine javascript + EASY', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );

        expect(result).toEqual([
          'SUBMISSION_COMPLETED',
          'SUBMISSION_COMPLETED_JAVASCRIPT',
          'SUBMISSION_COMPLETED_EASY',
        ]);
        expect(result.length).toBe(3);
      });

      it('should combine python + MEDIUM', () => {
        const result = service.getAllEventTypesForSubmission(
          'python',
          'MEDIUM',
        );

        expect(result).toEqual([
          'SUBMISSION_COMPLETED',
          'SUBMISSION_COMPLETED_PYTHON',
          'SUBMISSION_COMPLETED_MEDIUM',
        ]);
        expect(result.length).toBe(3);
      });

      it('should combine java + HARD', () => {
        const result = service.getAllEventTypesForSubmission('java', 'HARD');

        expect(result).toEqual([
          'SUBMISSION_COMPLETED',
          'SUBMISSION_COMPLETED_JAVA',
          'SUBMISSION_COMPLETED_HARD',
        ]);
        expect(result.length).toBe(3);
      });

      it('should combine all supported languages with all difficulties', () => {
        const languages = [
          'javascript',
          'python',
          'typescript',
          'java',
          'cpp',
          'go',
          'rust',
        ];
        const difficulties = ['EASY', 'MEDIUM', 'HARD'];

        for (const language of languages) {
          for (const difficulty of difficulties) {
            const result = service.getAllEventTypesForSubmission(
              language,
              difficulty,
            );

            expect(result).toContain('SUBMISSION_COMPLETED');
            expect(result.length).toBe(3);
            expect(result[1]).toContain('SUBMISSION_COMPLETED_');
            expect(result[2]).toContain('SUBMISSION_COMPLETED_');
          }
        }
      });
    });

    // ========== EDGE CASES ==========

    describe('edge cases', () => {
      it('should handle empty string language', () => {
        const result = service.getAllEventTypesForSubmission('');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_UNKNOWN');
      });

      it('should return base event type always', () => {
        const result1 = service.getAllEventTypesForSubmission('unknown');
        const result2 = service.getAllEventTypesForSubmission('javascript');
        const result3 = service.getAllEventTypesForSubmission('python', 'EASY');

        expect(result1).toContain('SUBMISSION_COMPLETED');
        expect(result2).toContain('SUBMISSION_COMPLETED');
        expect(result3).toContain('SUBMISSION_COMPLETED');
      });

      it('should always include base event type at index 0', () => {
        const result1 = service.getAllEventTypesForSubmission('javascript');
        const result2 = service.getAllEventTypesForSubmission('python', 'HARD');

        expect(result1[0]).toBe('SUBMISSION_COMPLETED');
        expect(result2[0]).toBe('SUBMISSION_COMPLETED');
      });

      it('should return array with at least 2 elements', () => {
        const result1 = service.getAllEventTypesForSubmission('unknown');
        const result2 = service.getAllEventTypesForSubmission('javascript');

        expect(result1.length).toBeGreaterThanOrEqual(2);
        expect(result2.length).toBeGreaterThanOrEqual(2);
      });

      it('should return array with max 3 elements when difficulty is provided', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );

        expect(result.length).toBeLessThanOrEqual(3);
      });

      it('should not have duplicate events', () => {
        const result = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );
        const uniqueEvents = new Set(result);

        expect(result.length).toBe(uniqueEvents.size);
      });

      it('should handle special characters in language', () => {
        const result = service.getAllEventTypesForSubmission('java@script!');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_UNKNOWN');
      });

      it('should handle numbers in language', () => {
        const result = service.getAllEventTypesForSubmission('python3');

        expect(result).toContain('SUBMISSION_COMPLETED');
        expect(result).toContain('SUBMISSION_COMPLETED_UNKNOWN');
      });

      it('should handle c++ consistently with cpp', () => {
        const resultCpp = service.getAllEventTypesForSubmission('cpp');
        const resultCPlus = service.getAllEventTypesForSubmission('c++');

        expect(resultCpp).toEqual(resultCPlus);
      });
    });

    // ========== RETURN VALUE TESTS ==========

    describe('return values', () => {
      it('should return an array', () => {
        const result = service.getAllEventTypesForSubmission('javascript');

        expect(Array.isArray(result)).toBe(true);
      });

      it('should return array of strings', () => {
        const result = service.getAllEventTypesForSubmission(
          'python',
          'MEDIUM',
        );

        expect(Array.isArray(result)).toBe(true);
        result.forEach((event) => {
          expect(typeof event).toBe('string');
        });
      });

      it('should return non-empty array', () => {
        const result = service.getAllEventTypesForSubmission('unknown');

        expect(result.length).toBeGreaterThan(0);
      });

      it('should return events in consistent order', () => {
        const result1 = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );
        const result2 = service.getAllEventTypesForSubmission(
          'javascript',
          'EASY',
        );

        expect(result1).toEqual(result2);
      });
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have getAllEventTypesForSubmission method', () => {
      expect(service.getAllEventTypesForSubmission).toBeDefined();
      expect(typeof service.getAllEventTypesForSubmission).toBe('function');
    });
  });
});
