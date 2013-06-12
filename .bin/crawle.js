var fs   = require('fs'),
    path = require('path'),
    argv = require('optimist')
        .describe('start-point','Start Point')
        .describe('rule-config','Rules Configuration File')
        .describe('rule-group', 'Rules Group')
        .describe('rule-index', 'Rules Start Point')
        .describe('rule-cb',    'Rule for callback after crawling')
        .argv,
    C = require('../'),
    configPath = path.resolve(process.cwd(), argv['rule-config']),
    config = fs.existsSync(configPath) && require(configPath),
    callback = argv['rule-cb'] && config[argv['rule-group']] && config[argv['rule-group']][argv['rule-cb']];

if (argv.help) {
    console.__unset;
    require('optimist').showHelp();
    process.exit(0);
}

var Crawler = new C.CrawlerPool({
    ruleFile        :   argv['rule-config'],
    ruleGroup       :   argv['rule-group'],
    rulePoint       :   argv['rule-index'],
    threads         :   argv['threads'],
    httpMaxRequests :   argv['http-max-requests']
}, function(error, response) {
//    console.debug(configPath, config);
    console.debug('Crawling complete');
    if (typeof callback === 'function') callback.apply(this, arguments);
});

Crawler.push({
    uri      :   argv['start-point']
});
