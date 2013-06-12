require('lo');
//noinspection FunctionWithInconsistentReturnsJS
var cheerio = require('cheerio'),
//    nquery = require('nquery'),
    parse = true,
    applyRules = function( options, requestOptions, body ) {
        var _done = false,
            sandbox = {
                referer     :   requestOptions.uri,
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

        try {
            var $ = null;
            if ( typeof body == 'string' ) {
                $ = cheerio.load( body);
            }
        } catch ( e ) {
//            console.debug(e);
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
            parse && applyRules( message.options, message.requestOptions, message.body );
            break;
        case    'abort' :
            process.exit(0);
    }
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
