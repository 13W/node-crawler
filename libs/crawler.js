require( 'lo' );
// TODO: Где-то дважды запускается callback[ -1 ]
var      fs = require( 'fs' ),
        url = require( 'url' ),
       zlib = require( 'zlib' ),
       path = require( 'path' ),
      async = require( 'async' ),
     domain = require( 'domain' ),
    cluster = require( 'cluster' ),
    request = require( 'request' ),
     Buffer = require( 'buffer' ).Buffer,
      iconv = require( 'iconv-lite' ),
       http = require( 'http' ),
       util = require( 'util' ),
        jar = request.jar(),
         cp = require('child_process');

/*
(function () {
    "use strict";

    function concat(bufs) {
        var buffer, length = 0, index = 0;

        if (!Array.isArray(bufs)) {
            bufs = Array.prototype.slice.call(arguments);
        }
        for (var i = 0, l = bufs.length; i < l; i++) {
            buffer = bufs[i];
            if (!Buffer.isBuffer(buffer)) {
                buffer = bufs[i] = new Buffer(buffer);
            }
            length += buffer.length;
        }
        buffer = new Buffer(length);

        bufs.forEach(function (buf, i) {
            buf = bufs[i];
            buf.copy(buffer, index, 0, buf.length);
            index += buf.length;
            delete bufs[i];
        });

        return buffer;
    }

    Buffer.concat = concat;

}());
*/

var extend = function Extend() {
    var object = Object.create(Object.prototype, {
        extend  :   {
            writeable   :   false,
            configurable:   false,
            enumerable  :   false,
            value       :   function(o, dst) {
                dst = dst || this;
                var set = function(key, value) {
                    if (Array.isArray(object)) {
                        dst.push(value || o[key]);
                    } else {
                        if ((value||o[key]) === undefined) return;
                        dst[key] = value || o[key];
                    }
                };

                for( var k in o ) {
                    if (!o.hasOwnProperty(k)) {
                        if (o[k] && o[k].bind)
                            dst[k] = o[k].bind(o);
                        else dst[k] = o[k];
                        continue;
                    }

                    var type = {
                        '[object Object]'   :   {},
                        '[object Array]'    :   []
                    }[toString.call(o[k])];
                    if (!dst[k]) set(k, type);
                    if (type) {
                        set(k, extend(dst[k], o[k]));
                    } else {
                        set(k, o[k]);
                    }
                }
            }
        }
    });

    Array.prototype.slice.call(arguments).forEach(function(e) {
        object.extend(e);
    });
    return object;
};

var Crawler = exports.Crawler = function Crawler(requestOptions, options, callback) {
    if (!requestOptions.uri) callback(new Error('URI must be specified'));

    var self = this,
        defaultRequestOptions = {
            followAllRedirects   :  true,
            encoding             :  null,
            proxy                :  null,
            timeout              :  60000,
            method               :  'GET',
            body                 :  '',
            headers              :  {
                'Accept-Charset' :  'utf-8,windows-1251;q=0.7,*;q=0.3',
                'Accept-Encoding':  'gzip,deflate',
                'Accept-Language':  'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
                'Accept'         :  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent'     :  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.121 Safari/535.2'
            },
            jar                  :  jar,
            fails                :  0
        },
        requestOptions = extend(defaultRequestOptions, requestOptions),
        defaultOptions = extend({
            retries              :  3,
            retryTimeout         :  30000,
            requestTimeout       :  0
        }, options);

    if (requestOptions.method === 'POST') {
        requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        requestOptions.headers['Content-Length'] = requestOptions.body.length;
    }
    if (Array.isArray(requestOptions.cookie)) {
        requestOptions.cookie.forEach( function( cookie ) {
            jar.add( request.cookie( cookie ) );
        });
    }
    if (typeof requestOptions.uri === 'string') {
        requestOptions.uri = url.parse(requestOptions.uri);
    }

    function getEncoding( headers, body ) {
        var encoding = /<meta.*charset=['"]?([^"']+).*>/gi.exec( body )
            || /.*charset=(.*)/.exec( headers[ 'content-type' ] );

        return encoding && !/utf-?8/i.test( encoding[1] ) ? encoding[1] : false;
    }
    function decompressPage( response, callback ) {
        ({
            'gzip'      :   zlib.gunzip,
            'deflate'   :   zlib.inflate
        }[response.headers['content-encoding']] || function(body, callback){callback(null, body)})(response.body, function(error, body) {
            response.body = body;
            callback(error, body);
        });
    }

    var doRequest = function(callback) {
        setTimeout(function() {
            var _request = request(requestOptions, function(error, response, body) {
                if (error) {
                    return callback(error);
                }

                if (!response
                    || (response && !response.body)
                    || (response && response.body && !response.body.length)
                    || (body && !body.length)) {

                    return callback(new Error('Response is Empty'));
                }

                if (response && response.statusCode != 200) {
                    var error = new Error( response.request.httpModule.STATUS_CODES[ response.statusCode ] );
                    error.statusCode = response.statusCode;
                    return callback(error);
                }

                if ( requestOptions.require == 'binary' ) {
                    return callback( null, response, null );
                }

                decompressPage(response, function(error, body) {
                    if (error) return callback(error);

                    var encoding = getEncoding( response.headers, body.toString('utf-8') );
//                    requestOptions.encoding = encoding;
//                        console.warn( encoding, url.format(bait.uri) );

                    try {
                        body = iconv.fromEncoding( response.body, encoding );
                        if (requestOptions.contentType === 'json') {
                            body = JSON.parse(response.body);
                        }
                        else
                            body = body.replace( new RegExp( encoding, 'gi' ), 'utf-8' );

                    } catch(error) {
                        console.error(error);
                    }

//                    options.referer = url.format( bait.uri );
//                        console.debug( encoding, options.referer, body.toString().slice(0,400) );

//                        console.log( options.contentType, typeof body, url.format( bait.uri ), body===body+""&&body.slice(0,1000) );
                    return callback( error, response, body );

                });
            });
            _request.on( 'error', callback);

            if ( requestOptions.require == 'binary' ) {
                var stream = fs.createWriteStream(requestOptions.filename);
                _request.pipe(stream);
            }

        }, defaultOptions.requestTimeout);

    };
    var tryRequest = function(callback) {
        doRequest(function(error, response, body) {
            if (error instanceof Error) {
                if (requestOptions.fails < defaultOptions.maxRetries) {
                    requestOptions.fails++;
                    console.warn('Request error: %s\nNext request(%d/%d) for "%s" after "%d" seconds.',
                        error.message,
                        requestOptions.fails, defaultOptions.maxRetries,
                        url.format(self.bait.uri),
                        defaultOptions.retryTimeout/1000
                    );

                    defaultOptions.requestTimeout = defaultOptions.retryTimeout;

                    return doRequest(callback);
                }
                console.warn('Request error: %d%s\nUrl: %s', error.statusCode, error.message, url.format(requestOptions.uri));
            }
            console.log('Page crawled: %s', url.format(requestOptions.uri));
            callback.apply(this, arguments);
        });
    };

    tryRequest(callback);
};

var CrawlerPool = exports.CrawlerPool = function CrawlerPool(options, callback) {
    var result = extend(),
        startTime = new Date().getTime(),
        defaultOptions = extend({
            startPoint      :   null,
            ruleFile        :   'rules.js',
            ruleGroup       :   'default',
            rulePoint       :   'index',
            threads         :   30,
            httpMaxRequests :   1000
        }, options),
        queue = async.queue(function(options, callback) {
            process.nextTick(function() {
                var crawlerOptions = extend(defaultOptions, options.options);
                Crawler(options.requestOptions, crawlerOptions, function(error, response, body) {
                    if (error) return callback(error);
                    var n = cp.fork(__dirname + '/parser.js');

                    n.send({
                        cmd             :   'parse',
                        requestOptions  :   options.requestOptions,
                        options         :   crawlerOptions,
                        body            :   body
                    });

                    n.messageRecv = false;
                    n.on( 'message', function( message ) {
                        var callbackResult = null;
                        switch( message.cmd ) {
                            case    'done'  :
                                if ( message.result.Queue.length ) {
                                    var Queue = message.result.Queue.map(function(Q) {
                                        var opts = extend({}, {
                                            requestOptions  :   {
                                                headers     :   {}
                                            }
                                        },{
                                            requestOptions  :   options.requestOptions,
                                            options         :   crawlerOptions
                                        }, {
                                            requestOptions  :   {
                                                uri         :   Q.uri,
                                                contentType :   Q.contentType
                                            },
                                            options         :   {
                                                rulePoint   :   Q.rule
                                            }
                                        });
                                        opts.requestOptions.headers.referer = url.format(opts.requestOptions.uri);
//                                        opts.extend(Q);
                                        return opts;
                                    });
                                    queue.push(Queue, console.fatal);
                                }
                                result.extend(message.result.result);
                                break;
                            case    'error' :
                                var error = new Error();
                                error.message = 'Error from: ['+(n.pid||n.process.pid)+'] parser: ' +message.error;
                                error.stack = message.stack;
                                console.error( error );
                                break;
                            default			:
                                console.warn( 'Received unknown command:\n', message );
                                break;
                        }

                        n.messageRecv = true;
                        (n.callbackSend |= true) && callback( callbackResult );
                        n.send({cmd: 'abort'});
                    });

                    n.on( 'exit', function(  ) {
                        if ( !n.messageRecv ) {
                            console.warn( 'Unexpected conclusion of the process, no data!' );
                            (n.callbackSend |= true) && callback( null );
                        }
                    });

                });
            });
        }, defaultOptions.threads);
    console.inspect(options);
    http.globalAgent.maxSockets = defaultOptions.httpMaxRequests;


    queue.drain = function() {
        console.debug('all downloaded in %d seconds', ((new Date().getTime()-startTime)/1000));
//        callback(result);
    };

    defaultOptions.ruleFile = path.resolve(process.cwd(), defaultOptions.ruleFile);

    if ( defaultOptions.startPoint ) {
        console.log(defaultOptions);
        queue.push({
            requestOptions: {
                uri     :   defaultOptions.startPoint
            },
            options :   defaultOptions
        });
    }

};

/*
var Fish = exports.Fish =function Fish( bait, options, fishCallback ) {

    var self = this;
    var defaultOptions = extend({
        referer :   '',
        proxy   :   null,
        timeout :   60000,
        maxRetries: 3,
        retryTimeout    :   30000
    });

    options = options || defaultOptions;

    if ( !bait ) {
        fishCallback( new Error('Пустой запрос'), null, null, null );
        console.warn( '!No Water, Пиздец какой-то!' );
        return;
    }

    if ( !bait.uri ) {
        fishCallback( new Error('Не задан адрес'), null, null, null );
        console.warn( 'Дохлый червяк!' );
        return;
    }

    if ( Array.isArray( options.cookie ) ) {
        options.cookie.forEach( function( cookie ) {
            jar.add( request.cookie( cookie ) );
        });
    }

    this.bait = {
        uri     :   options.referer && url.resolve( options.referer, bait.uri ) || url.parse( bait.uri ),
        method  :   bait.method || options.method || 'GET',
        body    :   (bait.method || options.method) != 'GET' && (bait.body || options.body) || '',
        headers :   bait.headers || {
            'Accept-Charset' :   'utf-8,windows-1251;q=0.7,*;q=0.3',
            'Accept-Encoding':   'gzip,deflate',
            'Accept-Language':   'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
//           'User-Agent'     :   'Mozilla/5.0 (compatible; InfinityBot/1.0; +http://www.cetku.net/crawler/)'
            'User-Agent'     :   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.121 Safari/535.2'
        },
        ruleFile:   bait.ruleFile || options.ruleFile,
        timeout :   options.timeout || null,
        retries :   0,
        proxy   :   bait.proxy || options.proxy || null,
        jar     :   jar
    };

    if ( this.bait.method == 'POST' ) {
        this.bait.headers = this.bait.headers || {};
        this.bait.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        this.bait.headers['Content-Length'] = this.bait.body.length;
    }

    if ( options.referer ) this.bait.headers.referer = options.referer;

    this.options = options;
    this.error = null;

    function getEncoding( headers, body ) {
        var encoding = /<meta.*charset=['"]?([^"']+).*>/gi.exec( body )
            || /.*charset=(.*)/.exec( headers[ 'content-type' ] );

        return encoding && !/utf-?8/i.test( encoding[1] ) ? encoding[1] : false;
    }

    function decompressPage( response, callback ) {
        switch( response.headers['content-encoding'] ) {
            case    'gzip'      :
                zlib.gunzip( response.body, function( error, body ) {
                    console.fatal( error );
                    response.body = body;
                    callback( error );
                })
                break;
            case    'deflate'   :
                zlib.inflate( response.body, function( error, body ) {
                    console.fatal( error );
                    response.body = body;
                    callback( error );
                })
                break;
            default             :
                callback();
        }
    }


    this.queue = async.queue(function( bait, callback ) {
        setTimeout( function() {
            try {

                bait.uri = url.parse( bait.uri );

//                console.inspect( bait );

                var rq = request( bait,{
                    url         :   url.format( bait.uri ),
                    encoding    :   null
                }, function( error, response, body ) {
                    if ( error ) {
                        error.errno = 204
                        return callback( error, response, body );
                    }

                    if ( !response
                        || (response && !response.body)
                        || (response && response.body && !response.body.length)
                        || (body && !body.length)) {

                        error = new Error( 'Пустой ответ' );
                        error.errno = 204;
                        return callback( error, response, body );
                    }

                    if ( response && response.statusCode != 200 ) {
                        var error = new Error( response.request.httpModule.STATUS_CODES[ response.statusCode ] );
                        error.errno = response.statusCode;
                        error.response = response;
                        return callback( error, response, body );
                    }

                    decompressPage( response, function( error ) {
                        if ( error ) {
                            return callback( error, response, body );
                        }

                        if ( options.contentType == 'binary' ) {
                            return callback( null, response, null );
                        }

                        var encoding = getEncoding( response.headers, body.toString('utf-8') );
                        options.encoding = encoding;
//                        console.warn( encoding, url.format(bait.uri) );

                        try {
                            body = iconv.fromEncoding( response.body, encoding );

//                            console.debug( encoding, options.referer, body.toString().slice(0,400) );
                            if ( options.contentType && options.contentType != 'json' ) {
                                body = body.toString().replace( new RegExp( encoding, 'gi' ), 'utf-8' );
                            }
                            else
                            if ( options.contentType == 'json' ) {
//                                console.log( options.contentType, typeof body, url.format( bait.uri ) );
                                body = JSON.parse( response.body );
                            }
                            else
                                body = body.replace( new RegExp( encoding, 'gi' ), 'utf-8' );

                        } catch( e ) {
                            console.error( e );
                        }

                        options.referer = url.format( bait.uri );
//                        console.debug( encoding, options.referer, body.toString().slice(0,400) );

//                        console.log( options.contentType, typeof body, url.format( bait.uri ), body===body+""&&body.slice(0,1000) );
                        return callback( error, response, body );
                    });
                });

                rq.on( 'error', function( error ) {
                    error.errno = 502;
                    callback( error );
                });

                if ( options.contentType == 'binary' ) {
                    var stream = fs.createWriteStream( path.resolve( options.dirname, options.filename ) );
                    rq.pipe( stream );
                }
            } catch( error ) {
                console.debug( bait, options );
                console.fatal( error );
            }
        }, options.setTimeout || 0);

        options.setTimeout = 0;

    }, 1);

    this.throwRod = function( callback ) {
        self.queue.push( self.bait, function( error, response, body ) {


            if ( error instanceof Error ) {
                if ( self.bait.retries < ( options.maxRetries || defaultOptions.maxRetries ) ) {
                    self.bait.retries++;
                    console.warn( '[%d]Следующая попытка закачки "%s" через %d секунд, Ошибка: %s',
                        self.bait.retries,
                        url.format( self.bait.uri ),
                        ( self.options.retryTimeout || defaultOptions.retryTimeout)/1000,
                        error.message );

                    options.setTimeout = options.retryTimeout || defaultOptions.retryTimeout;

                    return self.throwRod( callback );
                }

                console.warn( 'Url: %s: получена ошибка: [%d] %s', url.format( self.bait.uri ), error.errno || 0, error.message );
            }

            callback( error, response, body );
        });
    };

    var callback = function( error, response, body ) {
        self.error = error;
        self.response = response;
        self.body = body;
    };

    this.queue.drain = function(  ) {
        if ( !self.error ) console.debug( '[%d] get %s', process.pid, url.format( self.bait.uri ) );

        fishCallback( self.error, self.options, self.response, self.body );
    };

    this.throwRod( callback );

    return this;
};

var Fisher = exports.Fisher = function Fisher( bait, options, Callback ) {
    var self = this;
    this.length = 0;
    this.stoped = 0;
    this.options = options;
    this.bait = bait;
    this.result = extend();
    this.forceResult = [];
    this.errorRules = [];
    this.startTime = new Date();
    this.childrens = {};

    var selfCallback = function( vars ) {
        self.stoped++;
        if ( vars && Object.keys( vars ).length ) {
            self.forceResult.push( vars );
        }
    };

    function wormOnHook( Q, options ) {
//        if ( !Q.uri || !Q.rule ) return false;
        return {
            bait    :   {
                uri     :   typeof Q.uri == 'string' ? url.parse( Q.uri ) : Q.uri,
                headers :   Q.headers   ||  self.bait.headers || null,
                method  :   Q.method || bait.method || 'GET',
                body    :   ( Q.method || bait.method ) != 'GET' && ( Q.body || bait.body || '' ) || null
            },

            options :   {
                ruleFile:   options.ruleFile || path.resolve( process.cwd(), './rules.js' ),
                rules   :   options.rules || self.options.rules,
                referer :   options.referer,
                timeout :   options.timeout || self.options.timeout || null,
                proxy   :   options.proxy || self.options.proxy  || null,
                rule    :   Q.rule || null,
                contentType:    Q.contentType || 'text',
                dirname :   Q.dirname || null,
                filename:   Q.filename || null
            }
        }
    }

    this.throwRod = function( opts ) {
        var Opts = wormOnHook( opts, options );
        self.queue.push(Opts,Opts.options, selfCallback );
        return this;
    }

    this.queue = async.queue( function( o, callback ) {
        if ( !o ) return callback( null );
        self.length++;
        new Fish( o.bait, o.options, function( error, options, response, body ) {
            // response.body = is the buffer!!!!
            // body - is the text!!!
            if ( error ) {
                self.errorRules = self.errorRules.concat( error );
                return callback( null );
            }

            if ( !options || !options.rule ) return callback( null );

            if ( !response ) return callback( null );

            var n = cp.fork(__dirname + '/parser.js');

            n.send({
                cmd     :   'parse',
                options :   options,
                body    :   body
            });

//            console.log( typeof body, url.format( options.referer ) )
            n.message = false;

            n.on( 'message', function( message ) {
                var callbackResult = null;
                switch( message.cmd ) {
                    case    'done'  :
                        if ( message.result.Queue.length ) {
                            message.result.Queue.forEach( function( Q ) {
                                self.queue.push(wormOnHook( Q, options ), selfCallback);
                            });
                        }
                        self.result.extend( message.result.result );
                        callbackResult = message.result.variables;
                        break;
                    case    'error' :
                        var error = new Error();
                        error.message = 'Error from: ['+(n.pid||n.process.pid)+'] parser: ' +message.error;
                        error.stack = message.stack;
                        console.error( error );
                        break;
                    default			:
                        console.warn( 'Получено неизвестная команда:\n', message );
                        callbackResult = null;
                        break;
                }

                n.message = true;
                !n.callbackSend && ( n.callbackSend = true) && callback( callbackResult );
                n.send({cmd: 'abort'});
            });

            n.on( 'exit', function(  ) {
                if ( !n.message ) {
                    console.warn( 'Неожиданное завершение процесса, без передачи данных!' );
                    !n.callbackSend && ( n.callbackSend = true) && callback( null );
                }
            });
        });
    }, options.maxRequests );
    http.globalAgent.maxSockets = options.maxRequests;


    this.queue.drain = function(  ) {
        console.debug( 'Все скачано за %s секунд', ( (new Date().getTime()-self.startTime.getTime())/1000 ) );
        Callback( self.result, self.forceResult );
    };

    this.queue.empty = function(  ) {
        console.warn( 'empty' );
    };

    this.queue.saturated = function(  ) {
        console.warn( 'saturated' );
    }
    if ( this.bait && this.bait.uri ) {
        this.queue.push({
            bait    :   this.bait,
            options :   this.options
        }, selfCallback);
    }

//    setInterval( function( ) {
//        console.log( self.queue.tasks.length, self.queue.workers );
//    },5000);

//    var i1 = setInterval(function() {
//        console.debug( '[%d/%d/%d] %d % lost',
//            self.queue.tasks.length, self.queue.running(), self.queue.length()
//            ((self.stoped*100)/self.length) )
////        console.debug( 'Length: %d\nRunning: %d\nProcess: %s\nTasks: %d',
////            self.queue.length(), self.queue.running(), self.queue.concurrency, self.queue.tasks.length );
//    }, 1000);

//    var i2 = setInterval( function() {
//        fs.writeFile( './dump-' + (new Date().getTime()) + '.json', JSON.stringify( self.result ), 'utf-8' );
//    }, 60000);

    return this;
};*/
