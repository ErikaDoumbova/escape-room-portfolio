/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The deploy workflow sets BASE_PATH from the repository name (handoff §15.2):
// "/" for <user>.github.io repos, "/<repo>/" for project repos.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
