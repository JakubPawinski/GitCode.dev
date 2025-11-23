export const DOCKER_EXECUTOR_CONFIG = {
  // Resources for containers
  resources: {
    // RAM for container (512 MB)
    memory: 512 * 1024 * 1024,
    // Limit swap memory (equal RAM - no additional swap)
    memorySwap: 512 * 1024 * 1024,
  },

  // CPU limits
  cpu: {
    period: 100000,
    quota: 50000,
  },

  // Limits for files, and proceses
  ulimits: [
    {
      // Limit number of processes: soft=50, hard=100
      Name: 'nproc',
      Soft: 50,
      Hard: 100,
    },
    {
      // Limit number of open files: soft=128, hard=256
      Name: 'nofile',
      Soft: 128,
      Hard: 256,
    },
    {
      // Limit file size: 1MB
      Name: 'fsize',
      Soft: 1024 * 1024,
      Hard: 1024 * 1024,
    },
  ],

  // Code execution timeout (ms)
  executionTimeout: 30000,

  images: {
    python: 'python:3.11-slim',
    javascript: 'node:20-alpine',
    typescript: 'node:20-alpine',
    java: 'openjdk:21-slim',
  },
};
