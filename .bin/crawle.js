var argv = require('optimist')
        .describe('start-point','Start Point')
        .describe('rule-config','Rules Configuration File')
        .describe('rule-group', 'Rules Group')
        .describe('rule-index', 'Rules Start Point')
        .describe('rule-cb',    'Rule for callback after crawling')
        .argv,
    C = require('../');

if (argv.help) {
    console.__unset;
    require('optimist').showHelp();
    process.exit(0);
}

C.CrawlerPool({
    startPoint      :   argv['start-point'],
    ruleFile        :   argv['rule-config'],
    ruleGroup       :   argv['rule-group'],
    rulePoint       :   argv['rule-index'],
    threads         :   argv['threads'],
    httpMaxRequests :   argv['http-max-requests']
}, console.warn);