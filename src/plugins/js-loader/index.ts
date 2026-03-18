import path from 'node:path';
import fs from 'node:fs';

import { app, shell } from 'electron';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';
import { injectCSSAsFile } from '@/plugins/utils/main';

export default createPlugin({
  name: () => t('plugins.js-loader.name'),
  description: () => t('plugins.js-loader.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  menu: async () => [
    {
      label: t('plugins.js-loader.menu.open-folder'),
      click() {
        const pluginsPath = path.join(
          app.getPath('userData'),
          'plugins',
          'js-loader',
        );
        if (!fs.existsSync(pluginsPath)) {
          fs.mkdirSync(pluginsPath, { recursive: true });
        }
        shell.openPath(pluginsPath);
      },
    },
  ],
  backend: {
    start({ window }) {
      const pluginsPath = path.join(
        app.getPath('userData'),
        'plugins',
        'js-loader',
      );
      if (!fs.existsSync(pluginsPath)) {
        fs.mkdirSync(pluginsPath, { recursive: true });
      }

      const injectJS = () => {
        const files = fs.readdirSync(pluginsPath);
        for (const file of files) {
          const filePath = path.join(pluginsPath, file);
          if (file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            window.webContents
              .executeJavaScript(content)
              .then(() => {
                console.log(`[JS Loader] Injected script: ${file}`);
              })
              .catch((err) => {
                console.error(`[JS Loader] Error injecting script ${file}:`, err);
              });
          }
        }
      };

      const files = fs.readdirSync(pluginsPath);
      for (const file of files) {
        if (file.endsWith('.css')) {
          const filePath = path.join(pluginsPath, file);
          injectCSSAsFile(window.webContents, filePath);
        }
      }

      window.webContents.on('did-finish-load', () => {
        injectJS();
      });

      // Initial injection if already loaded
      if (!window.webContents.isLoading()) {
        injectJS();
      }
    },
  },
});
