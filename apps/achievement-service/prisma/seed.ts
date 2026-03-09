import { PrismaClient } from '@prisma/client-achievement';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const adapter = new PrismaPg({
  connectionString: process.env.ACHIEVEMENT_DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with basic achievements...');

  const achievements = [
    {
      code: 'first_commit',
      name: 'First Commit',
      description: 'Make your first commit to a repository',
      iconUrl: '/icons/first-commit.png',
      eventType: 'COMMIT_CREATED',
      targetValue: 1,
    },
    {
      code: 'ten_commits',
      name: 'Code Warrior',
      description: 'Make 10 commits',
      iconUrl: '/icons/ten-commits.png',
      eventType: 'COMMIT_CREATED',
      targetValue: 10,
    },
    {
      code: 'hundred_commits',
      name: 'Coding Legend',
      description: 'Make 100 commits',
      iconUrl: '/icons/hundred-commits.png',
      eventType: 'COMMIT_CREATED',
      targetValue: 100,
    },
    {
      code: 'first_repository',
      name: 'Repository Owner',
      description: 'Create your first repository',
      iconUrl: '/icons/first-repo.png',
      eventType: 'REPOSITORY_CREATED',
      targetValue: 1,
    },
    // ========== PROBLEM SOLVING ACHIEVEMENTS ==========
    {
      code: 'first_problem_solved',
      name: 'Algorithm Beginner',
      description: 'Solve your first problem',
      iconUrl: '/icons/first-problem.png',
      eventType: 'SUBMISSION_COMPLETED',
      targetValue: 1,
    },
    {
      code: 'ten_problems_solved',
      name: 'Algorithm Enthusiast',
      description: 'Solve 10 problems',
      iconUrl: '/icons/ten-problems.png',
      eventType: 'SUBMISSION_COMPLETED',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_solved',
      name: 'Algorithm Expert',
      description: 'Solve 50 problems',
      iconUrl: '/icons/fifty-problems.png',
      eventType: 'SUBMISSION_COMPLETED',
      targetValue: 50,
    },
    {
      code: 'hundred_problems_solved',
      name: 'LeetCode Master',
      description: 'Solve 100 problems',
      iconUrl: '/icons/hundred-problems.png',
      eventType: 'SUBMISSION_COMPLETED',
      targetValue: 100,
    },
    // ========== JAVASCRIPT ACHIEVEMENTS ==========
    {
      code: 'first_problem_javascript',
      name: 'JavaScript Starter',
      description: 'Solve your first problem in JavaScript',
      iconUrl: '/icons/js-starter.png',
      eventType: 'SUBMISSION_COMPLETED_JAVASCRIPT',
      targetValue: 1,
    },
    {
      code: 'ten_problems_javascript',
      name: 'JavaScript Developer',
      description: 'Solve 10 problems in JavaScript',
      iconUrl: '/icons/js-dev.png',
      eventType: 'SUBMISSION_COMPLETED_JAVASCRIPT',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_javascript',
      name: 'JavaScript Master',
      description: 'Solve 50 problems in JavaScript',
      iconUrl: '/icons/js-master.png',
      eventType: 'SUBMISSION_COMPLETED_JAVASCRIPT',
      targetValue: 50,
    },
    // ========== PYTHON ACHIEVEMENTS ==========
    {
      code: 'first_problem_python',
      name: 'Python Starter',
      description: 'Solve your first problem in Python',
      iconUrl: '/icons/py-starter.png',
      eventType: 'SUBMISSION_COMPLETED_PYTHON',
      targetValue: 1,
    },
    {
      code: 'ten_problems_python',
      name: 'Python Developer',
      description: 'Solve 10 problems in Python',
      iconUrl: '/icons/py-dev.png',
      eventType: 'SUBMISSION_COMPLETED_PYTHON',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_python',
      name: 'Python Master',
      description: 'Solve 50 problems in Python',
      iconUrl: '/icons/py-master.png',
      eventType: 'SUBMISSION_COMPLETED_PYTHON',
      targetValue: 50,
    },
    // ========== TYPESCRIPT ACHIEVEMENTS ==========
    {
      code: 'first_problem_typescript',
      name: 'TypeScript Starter',
      description: 'Solve your first problem in TypeScript',
      iconUrl: '/icons/ts-starter.png',
      eventType: 'SUBMISSION_COMPLETED_TYPESCRIPT',
      targetValue: 1,
    },
    {
      code: 'ten_problems_typescript',
      name: 'TypeScript Developer',
      description: 'Solve 10 problems in TypeScript',
      iconUrl: '/icons/ts-dev.png',
      eventType: 'SUBMISSION_COMPLETED_TYPESCRIPT',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_typescript',
      name: 'TypeScript Master',
      description: 'Solve 50 problems in TypeScript',
      iconUrl: '/icons/ts-master.png',
      eventType: 'SUBMISSION_COMPLETED_TYPESCRIPT',
      targetValue: 50,
    },
    // ========== JAVA ACHIEVEMENTS ==========
    {
      code: 'first_problem_java',
      name: 'Java Starter',
      description: 'Solve your first problem in Java',
      iconUrl: '/icons/java-starter.png',
      eventType: 'SUBMISSION_COMPLETED_JAVA',
      targetValue: 1,
    },
    {
      code: 'ten_problems_java',
      name: 'Java Developer',
      description: 'Solve 10 problems in Java',
      iconUrl: '/icons/java-dev.png',
      eventType: 'SUBMISSION_COMPLETED_JAVA',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_java',
      name: 'Java Master',
      description: 'Solve 50 problems in Java',
      iconUrl: '/icons/java-master.png',
      eventType: 'SUBMISSION_COMPLETED_JAVA',
      targetValue: 50,
    },
    // ========== C++ ACHIEVEMENTS ==========
    {
      code: 'first_problem_cpp',
      name: 'C++ Starter',
      description: 'Solve your first problem in C++',
      iconUrl: '/icons/cpp-starter.png',
      eventType: 'SUBMISSION_COMPLETED_CPP',
      targetValue: 1,
    },
    {
      code: 'ten_problems_cpp',
      name: 'C++ Developer',
      description: 'Solve 10 problems in C++',
      iconUrl: '/icons/cpp-dev.png',
      eventType: 'SUBMISSION_COMPLETED_CPP',
      targetValue: 10,
    },
    {
      code: 'fifty_problems_cpp',
      name: 'C++ Master',
      description: 'Solve 50 problems in C++',
      iconUrl: '/icons/cpp-master.png',
      eventType: 'SUBMISSION_COMPLETED_CPP',
      targetValue: 50,
    },
    // ========== GO ACHIEVEMENTS ==========
    {
      code: 'first_problem_go',
      name: 'Go Starter',
      description: 'Solve your first problem in Go',
      iconUrl: '/icons/go-starter.png',
      eventType: 'SUBMISSION_COMPLETED_GO',
      targetValue: 1,
    },
    {
      code: 'ten_problems_go',
      name: 'Go Developer',
      description: 'Solve 10 problems in Go',
      iconUrl: '/icons/go-dev.png',
      eventType: 'SUBMISSION_COMPLETED_GO',
      targetValue: 10,
    },
    // ========== DIFFICULTY ACHIEVEMENTS ==========
    {
      code: 'first_easy_solved',
      name: 'Easy Peasy',
      description: 'Solve your first Easy difficulty problem',
      iconUrl: '/icons/easy-problem.png',
      eventType: 'SUBMISSION_COMPLETED_EASY',
      targetValue: 1,
    },
    {
      code: 'first_medium_solved',
      name: 'Medium Challenge',
      description: 'Solve your first Medium difficulty problem',
      iconUrl: '/icons/medium-problem.png',
      eventType: 'SUBMISSION_COMPLETED_MEDIUM',
      targetValue: 1,
    },
    {
      code: 'first_hard_solved',
      name: 'Hard Hitter',
      description: 'Solve your first Hard difficulty problem',
      iconUrl: '/icons/hard-problem.png',
      eventType: 'SUBMISSION_COMPLETED_HARD',
      targetValue: 1,
    },
    {
      code: 'ten_hard_solved',
      name: 'Hard Problem Specialist',
      description: 'Solve 10 Hard difficulty problems',
      iconUrl: '/icons/ten-hard.png',
      eventType: 'SUBMISSION_COMPLETED_HARD',
      targetValue: 10,
    },
    // ========== POLYGLOT ACHIEVEMENTS ==========
    {
      code: 'polyglot_three_languages',
      name: 'Polyglot Programmer',
      description: 'Solve problems in 3 different languages',
      iconUrl: '/icons/polyglot-3.png',
      eventType: 'SUBMISSION_COMPLETED_POLYGLOT',
      targetValue: 3,
    },
    {
      code: 'polyglot_five_languages',
      name: 'Language Master',
      description: 'Solve problems in 5 different languages',
      iconUrl: '/icons/polyglot-5.png',
      eventType: 'SUBMISSION_COMPLETED_POLYGLOT',
      targetValue: 5,
    },
  ];

  for (const achievement of achievements) {
    try {
      const created = await prisma.achievement.upsert({
        where: { code: achievement.code },
        update: achievement,
        create: achievement,
      });
      console.log(`${created.name} (${created.code})`);
    } catch (error) {
      console.error(`Error creating achievement: ${achievement.code}`, error);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
