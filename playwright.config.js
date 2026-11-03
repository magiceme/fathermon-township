const { defineConfig } = require('playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 60000, workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {baseURL:'http://127.0.0.1:8000', headless:true,
    launchOptions:{executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  },
  webServer: {command:'npm run dev', url:'http://127.0.0.1:8000', reuseExistingServer:true}
});
