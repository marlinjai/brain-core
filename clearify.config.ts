import { defineConfig } from 'clearify';

export default defineConfig({
  name: 'Brain Core',
  hubProject: {
    hubUrl: 'https://docs.lumitra.co',
    hubName: 'ERP Suite',
    description: 'Shared infrastructure: auth, crypto, errors, types',
    status: 'active',
    icon: '🧠',
    tags: ['infrastructure', 'shared'],
    group: 'Lumitra Infrastructure',
  },
});
