require('lo');
var cheerio = require('cheerio'),
    parse = true,
    applyRules = function( options, body ) {
        var _done = false,
            sandbox = {
                referer     :   options.referer,
                Queue       :   [],
                variables   :   {},
                options     :   options,
                result      :   {},
                Done        :   function(  ) {
                    _done = true;

                    process.send({
                        cmd     :   'done',
                        result  :   sandbox
                    });
                }
            },
            Rules = require( options.ruleFile ),
            rules = Rules && Rules[ options.ruleGroup ] || null;
        if ( !rules ) {
            console.warn( 'Rules not found!' );
            return sandbox.Done();
        }
//        console.inspect(body);
        try {
            if ( typeof body == 'string' ) {
                var $ = cheerio.load( body, {
                    ignoreWhitespace: true,
                    xmlMode: true,
                    lowerCaseTags: true
                });
            } else
                var $ = null;
        } catch ( e ) {
            console.error(e);
            throw e;
        }

        rules[ options.rulePoint ]
            && typeof rules[ options.rulePoint ] == 'function'
            && !rules[ options.rulePoint ]( sandbox, $, body )
        || !console.error( 'Rule ' + options.ruleGroup + '::' + options.rulePoint + ' not found!' ) && sandbox.Done();

        if ( !_done ) console.fatal( new Error('Lost self.Done() in ' + options.rules + '::' + options.rule) );
    };

process.on( 'message', function( message ) {
    switch( message.cmd ) {
        case    'parse' :
//            console.log( message.body );
            parse && applyRules( message.options, message.body );
            break;
        case    'abort' :
            process.exit(0);
    };
});

process.on( 'uncaughtException', function( error ) {
    console.error(error);
    parse = false;
    process.send({
        cmd     :   'error',
        error   :   error.message,
        stack   :   error.stack
    });
});
