/**
 * Composition root — the ONE place where concrete implementations are picked.
 *
 * To swap the backend:
 *   1. Write a new repository implementation under
 *      `src/repositories/<your-driver>/` that satisfies the same interfaces.
 *   2. Replace the `createPrismaRepositories(prisma)` call below.
 *
 * Nothing else in the codebase needs to change.
 */

import { prisma } from './config/prisma.js';
import { createPrismaRepositories } from './repositories/prisma/index.js';
import type { Repositories } from './repositories/interfaces.js';
import { createServices, type Services } from './services/index.js';

export interface AppContainer {
  repos: Repositories;
  services: Services;
}

export function createContainer(): AppContainer {
  const repos = createPrismaRepositories(prisma);
  const services = createServices(repos);
  return { repos, services };
}

/** Test helper — supply your own (in-memory) repositories. */
export function createTestContainer(repos: Repositories): AppContainer {
  return { repos, services: createServices(repos) };
}
