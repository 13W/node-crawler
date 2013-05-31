require( 'lo' );
var      fs = require( 'fs' ),
        url = require( 'url' ),
       zlib = require( 'zlib' ),
       path = require( 'path' ),
      async = require( 'async' ),
     domain = require( 'domain' ),
    request = require( 'request' ),
     Buffer = require( 'buffer' ).Buffer,
      iconv = require( 'iconv-lite' ),
       http = require( 'http' ),
       util = require( 'util' ),
        jar = request.jar(),
         cp = require('child_process');

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

var Crawler = exports.Crawler = function Crawler(_requestOptions, options, callback) {
    if (!_requestOptions.uri) callback(new Error('URI must be specified'));

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
        requestOptions = extend(defaultRequestOptions, _requestOptions),
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
                    error = new Error( response.request.httpModule.STATUS_CODES[ response.statusCode ] );
                    error.statusCode = response.statusCode;
                    return callback(error);
                }

                if ( requestOptions.require == 'binary' ) {
                    return callback( null, response, null );
                }

                decompressPage(response, function(error, body) {
                    if (error) return callback(error);

                    var encoding = getEncoding( response.headers, body.toString('utf-8') );
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

                    return doRequest(arguments.callee);
                }
                console.warn('Request error: %d%s\nUrl: %s', error.statusCode || '', error.message, url.format(requestOptions.uri));
            }
            console.log('Page crawled: %s', url.format(requestOptions.uri));
            callback.apply(this, arguments);
            return void 0;
        });
    };

    tryRequest(callback);
};

exports.CrawlerPool = function CrawlerPool(options, callback) {
    var self = this,
        result = extend(),
        startTime = new Date().getTime(),
        defaultOptions = extend({
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
                                                rulePoint   :   Q.rule || Q.rulePoint
                                            }
                                        });
                                        opts.requestOptions.uri = url.resolve(options.requestOptions.uri, opts.requestOptions.uri);
                                        opts.requestOptions.headers.referer = url.format(options.requestOptions.uri);
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
//                        console.fatal(new Error(arguments[1]));
                        if ( !n.messageRecv ) {
                            console.warn( 'Unexpected conclusion of the process, no data!' );
                            (n.callbackSend |= true) && callback( null );
                        }
                    });
                    return void 0;
                });
            });
        }, defaultOptions.threads);

    http.globalAgent.maxSockets = defaultOptions.httpMaxRequests;

    process.on('SIGINT', function () {
        console.inspect(result);
        process.exit(0);
    });

    queue.drain = function() {
        console.debug('all downloaded in %d seconds', ((new Date().getTime()-startTime)/1000));
        self.callback(result);
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

    this.callback = callback || function() {};
    this.drain = function(callback) {
        if (typeof callback === 'function')
            self.callback = callback;
    };
    this.push = function(options, callback) {
        queue.push({
            options         :   extend(defaultOptions, options.options, {
                ruleFile    :   options.ruleFile,
                ruleGroup   :   options.ruleGroup,
                rulePoint   :   options.rulePoint
            }),
            requestOptions  :   extend(options.requestOptions, {
                uri         :   options.uri || options.startPoint,
                contentType :   options.contentType
            })
        }, callback);
    };
};
