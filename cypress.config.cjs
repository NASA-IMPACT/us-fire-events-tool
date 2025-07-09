const { defineConfig } = require('cypress');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const createEsbuildPlugin = require('@badeball/cypress-cucumber-preprocessor/esbuild').createEsbuildPlugin;

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173/',
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: false,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        require('@cypress/webpack-preprocessor')({
          webpackOptions: {
            module: {
              rules: [
                {
                  test: /\.feature$/,
                  use: [
                    {
                      loader: '@badeball/cypress-cucumber-preprocessor/webpack',
                      options: config,
                    },
                  ],
                },
              ],
            },
          },
        })
      );
      on(
        'dev-server:start',
        (options) => {
          options.plugins = options.plugins || [];
          options.plugins.push(createEsbuildPlugin(config));
          return options;
        }
      );
      return config;
    },
  },
}); 