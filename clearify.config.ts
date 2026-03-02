import { defineConfig } from 'clearify';

export default defineConfig({
  name: 'Brain Core',
  hubProject: {
    hubUrl: 'https://docs.cloud.lumitra.co',
    hubName: 'Lumitra Cloud',
    description: 'Shared infrastructure: auth, crypto, errors, types',
    status: 'active',
    icon: '🧠',
    tags: ['infrastructure', 'shared'],
    group: 'Lumitra Infrastructure',
  },
});
