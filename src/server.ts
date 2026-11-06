import { createApp } from './app.js';
import { env } from './core/config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(
    `[Trạm Dev] Server running at http://localhost:${env.port} (${env.securityMode} mode)`,
  );
});
