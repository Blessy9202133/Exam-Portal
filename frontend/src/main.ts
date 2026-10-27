import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

  fetch('config.json')
  .then((response) => response.json())
  .then((config) => {
    (window as any).runtimeConfig = config;

    // 👇 2. CHANGE THIS LINE to match your component name!
    bootstrapApplication(App, appConfig)
      .catch((err) => console.error(err));
  })
  .catch((err) => {
    console.error('Config fetch failed, using safety development fallback:', err);
    (window as any).runtimeConfig = { apiUrl: 'http://localhost:5050/api/admin' };
    
    // 👇 3. CHANGE THIS LINE to match your component name!
    bootstrapApplication(App, appConfig)
      .catch((bootErr) => console.error(bootErr));
  });