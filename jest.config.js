module.exports = {
  verbose: true,
  'testMatch': [
      '**/**.test.js'
  ],
  'reporters': [
    'default', 'jest-junit',
    [
      './node_modules/jest-html-reporter',
      {
        'pageTitle': 'Test Report',
        'outputPath': './reports/tests-report.html',
        'includeFailureMsg':true,
        'includeConsoleLog':true
      }
    ]
  ]
};
 