import { readJson, writeJson } from './jsonStore.js';
import type { Playbook, UseCase, UpdatePlaybook } from '@kol/shared';

const FILENAME = 'playbooks.json';

type PlaybookStore = Record<string, Playbook>;

export const playbookRepo = {
  getAll(): PlaybookStore {
    return readJson<PlaybookStore>(FILENAME, {});
  },

  get(useCase: UseCase): Playbook | undefined {
    const store = this.getAll();
    return store[useCase];
  },

  update(useCase: UseCase, updates: UpdatePlaybook): Playbook | undefined {
    const store = this.getAll();
    const existing = store[useCase];
    if (!existing) return undefined;

    store[useCase] = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    writeJson(FILENAME, store);
    return store[useCase];
  },

  create(playbook: Playbook): Playbook {
    const store = this.getAll();
    store[playbook.useCase] = playbook;
    writeJson(FILENAME, store);
    return playbook;
  },

  delete(useCase: UseCase): boolean {
    const store = this.getAll();
    if (!store[useCase]) return false;
    delete store[useCase];
    writeJson(FILENAME, store);
    return true;
  },

  deleteAll(): void {
    writeJson(FILENAME, {});
  },

  seed(playbooks: Playbook[]): void {
    const store: PlaybookStore = {};
    for (const playbook of playbooks) {
      store[playbook.useCase] = playbook;
    }
    writeJson(FILENAME, store);
  },
};

