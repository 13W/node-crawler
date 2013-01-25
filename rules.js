require( 'lo' );
var crypto = require('crypto'),
    path = require( 'path' ),
    url = require( 'url' ),
    fs = require( 'fs'),
    tmpPath = '/spool/mediastorage/tmp/',
    imagePath = '/spool/mediastorage/images/original/',
//    Fish = require('./').Crawler,
//    MongoDB = require('/usr/local/lib/node_modules/mongoskin'),
//    config = require('../config').default,
//    db = MongoDB.db(config.mongodb.connect, config.mongodb.options),
    async = require('async');
//    mkdirp = require('mkdirp');

//db.bind('offers');

if ( !fs.existsSync ) {
    fs.existsSync = path.existsSync;
    fs.exists = path.exists;
}

// TODO: http://slando.ua/nedvizhimost/?all_categories=all&search%5Bprivate_business%5D=private&search%5Bphotos%5D=1
// TODO: парсить: http://www.krim.etag.com.ua/c_356.html?&dnum=500&ajaxedtable&rndm=12240
// TODO: & http://ntn-ua.com/poisk-nedvizhimosti/?r=1&s_objecttype=a-n-y&s_type=rent&s_city=a-n-y&s_street=a-n-y&s_price_from=%D0%BE%D1%82&s_price_to=%D0%B4%D0%BE&s_squ_from=%D0%BE%D1%82&s_squ_to=%D0%B4%D0%BE&s_rooms_from=%D0%BE%D1%82&s_rooms_to=%D0%B4%D0%BE&s_floor=a-n-y&s_sort=date&s_order=asc&s_foto_only=on
// TODO: & http://ua.ners.ru/ajax/?module=notes_list&type=all_notes&notes_type_id=9&deal_type_id=1&have_metro=&have_township=&city_have_quarter=&township_have_quarter=&region_id=0&asmSelect0=0&asmSelect1=0&time_before=0&time_type_id=0&rooms=0&total_area_min=&total_area_max=&living_area_min=&living_area_max=&kitchen_area_min=&kitchen_area_max=&floor_min=&floor_max=&floors_total_min=&floors_total_max=&is_flat_in_new_building_choices=2&house_type_id=0&condition_id=0&lavatory_id=0&balcony_loggia_id=0&rooms_type_id=0&price_min=&price_max=&currency_id=1&type_price=total&firm_id=0&db_importer_id=0&per_page=10000&sf=post_date&so=1
// TODO: & http://blagovist.ua/realtysearch/salehouse.lisp?p_RuType=2&p_nonKiev=1&p_StDistr=&p_TownCode=&p_Price1=&p_Price2=&p_readypercent=0&p_SqrLand1=&p_SqrLand2=&p_SqrTotal1=&p_SqrTotal2=&p_Date1=&p_Date2=&p_SortOrder=price_by&code=&p_NFloors1=&p_NFloors2=&p_materialType=0&p_isdacha=0&p_Scope=0&&printversion=1
// TODO: & http://address.ua/dom/sdajut/kiev/?nobroker=True
// TODO: & http://real-estate.212.ua/ru/apartments-rooms/all/ukraina/owner/media-yes/order-price-asc
// TODO: & http://www.prostodom.ua/catalog/?obj%5Bdeal_type_id%5D=1&obj%5Bregion_id%5D=&obj%5Bobject_type_id%5D=1&obj%5Broom_count%5D%5B%5D=1&obj%5Broom_count%5D%5B%5D=2&obj%5Broom_count%5D%5B%5D=3&obj%5Bprice_from%5D=&obj%5Bprice_to%5D=&obj%5Bcurrency_id%5D=1&obj%5Bwith_photo%5D=1&obj%5Bid%5D=
// TODO: & http://arendaua.com.ua/rooms/search/true/city/
// TODO: & http://www.dom2000.com/ru/realty/search/pos/8/act/search/tbl/ad/is_ext/1/submit/1/v_obj_type/1/v_op_type/1/v_geo/2/v_price_per_m_units/1/v_role_1/on/v_sort/1
// TODO: список источников http://centerdom.com.ua/index.php?page=68
// TODO: & http://www.realt5000.com.ua/rate/site/

exports['consultant.hexagone.ua'] = {
    index           :   function( self, $, body ) {
        $("ul.day li:not(.disabled) a").each( function(id, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'parseQuestion'
            });
        });

        self.Done();
    },
    parseQuestion   :   function( self, $, body ) {

        var day         = $('div.day').text().trim(),
            question    = $('div.question:eq(0)').text().trim(),
            answer      = $('div.question:eq(1)').text().trim();

        self.result.days = {};
        if ( question ) self.result.days[ day ] = {
            question    :   question,
            answer      :   answer
        };

        self.Done();
    },
    callback        :   function( result ) {
        var r = result.days,
            out = [];
        for ( var d in r ) {
            out.push( '"'+ r[d].question +'", "' +r[d].answer+ '"' );
        }

        fs.writeFileSync( './consultant.hexagone.ua.json', JSON.stringify( result ), 'utf-8' );
        fs.writeFileSync( './consultant.hexagone.ua.csv', out.join("\n"), 'utf-8' );
        process.exit(0);
    }
};

exports[ 'krim.etag.com.ua' ] = {
    index   :   function( self, $, body ) {
        function gu( t ) {
            return 'http://www.etag.com.ua/search.html?s&t=' + t + '&page=2&dnum=1000&ajaxedtable&rndm='+Math.random().toString().slice( 2, 8 );
        }
//        var uri =
    }
};

exports.Rules = {
    index   :   function( self, $, body ) {
        self.variables.uri = [];
        $("a").each( function( id, e ) {
            if ( self.variables.uri.length > 2 ) return;

            $(e).attr( 'href' ) && self.Queue.push({
                uri     :   $(e).attr( 'href' ),
                rule    :   'nextIndex'
            }) && self.variables.uri.push( $(e).attr( 'href' ) );
        });

        self.Done();
    },
    nextIndex   :   function( self, $, body ) {
        self.variables.len = body.length;
        self.Done();
    },

    'dom.ria.ua'    :   function( self, $, body ) {
        var pages = parseInt( $("div.pager div.numbers a:last").text() ) || 1;
            pages = pages > 200 && 200 || pages;
        self.result.pages = pages;

        for ( var i = 1; i <= pages; i++ ) {
            self.Queue.push({
                uri     :   'http://dom.ria.ua/ru/search?period=per_day&limit=100&category=0&with_photo=1&json=1&page=' + i,
//                uri     :   'http://dom.ria.ua/ru/search?limit=100&category=0&with_photo=1&json=1&page=' + i,
                rule    :   'getAdverts',
                contentType:    'json'
            });
        }
        self.Done();
    },
    getAdverts      :   function( self, $, body ) {
        var json;

        self.result[process.pid] = json = body;

        json.forEach( function( offer ) {
            if ( offer.agency_id ) return;

            for ( var id in offer.photos ) {
                // dom/photo/1039/103963/10396345/10396345f.jpg
                var photo = offer.photos[ id ].file;
                var photoPath = url.resolve(
                    'http://cdn.img.ria.ua/photos/',
                    path.resolve( '/',
                        path.dirname( photo ),
                        path.basename( photo ).slice(0, -1*path.extname( photo ).length ) + 'f' + path.extname( photo )
                    ).slice(1)
                );

                if ( !fs.existsSync( path.resolve( '/spool/mediastorage/tmp/', path.basename( photo ) ) ) )
                self.Queue.push({
                    uri     : photoPath,
                    dirname : '/spool/mediastorage/tmp/',
                    filename: path.basename( photo ),
                    contentType: 'binary'
                });
            }
        });

        self.Done();
    },
    downloadStreets   :   function( self, $, body ) {                             // http://dom.ria.ua/ajax/getstreets/?city_id=21
        var M = require( 'mongolian' ),
            S = new M,
            db = S.db('location'),
            c = db.collection( 'cities' ),
            s = db.collection( 'streets' );
        c.find({}, {cityid:1}).sort({cityid:1}).toArray( function( error, values ) {
            if ( error ) {
                console.error( error );
            }
            values.forEach( function( el ) {
                var id = el.cityid;
                self.Queue.push({
                    uri     :   'http://dom.ria.ua/ajax/getstreets/?city_id='+id,
//                    dirname :   '/spool/crawledPages/',
//                    filename:   'streets-'+id+'.json',
//                    contentType:    'json'
                    rule    :   'gstreets',
                    id      :   id
                });
            });
            self.Done();
        });
    },
    gstreets        :   function( self, $, body ) {
//        self.result.str = {};
        console.log( self.options.referer );
        var id = self.options.referer;
        self.result.str = {};
        self.result.str[ id ] = JSON.parse( body );
        self.Done();
    }
};

//exports['krim.etag.com.ua'] = {
//    index =
//}
/**
 * http://dom.ria.ua/ru/realty-5109586.html?json=1 - удаленное сообщение
 *
 *
 */

process.setMaxListeners(0);

var DomRiaUa = exports['dom.ria.ua'] = {
    index           :   function( self, $, body ) {
        var pages = parseInt( $("div.pager a").last().text() ) || 1;
//        console.log($("div.pager div.numbers").html());
        pages = pages > 2 && 2 || pages;
//        pages = pages > 2 && 1 || pages;
        self.result.pages = pages;

        for ( var i = 1; i <= pages; i++ ) {
            self.Queue.push({
                uri     :   'http://dom.ria.ua/ru/search?period=per_day&limit=100&category=0&with_photo=1&json=1&page=' + i,
                rule    :   'getAdverts',
                contentType:    'json'
            });
        }

        self.Done();

    },
    getAdverts      :   function( self, $, body ) {
        var result = self.result.adverts = {};

        body.forEach( function( advert ) {
            if ( advert.agency_id ) return;

            result[ advert.realty_id ] = advert;
        });

        self.Done();
    },
    _checkImages    :   function( advert, result, callback ) {
        var queue = async.queue(function( o, callback) {
            var photo = o.photo,
                advert = o.advert,
                p = o.p;

            new Fish({
                    uri :   url.parse(url.resolve(
                        'http://cdn.img.ria.ua/photos/',
                        path.resolve( '/',
                            path.dirname( photo ),
                            path.basename( photo ).slice(0, -1*path.extname( photo ).length ) + 'f' + path.extname( photo )
                        ).slice(1)
                    ))
                }, {
                    dirname : tmpPath,
                    filename: path.basename( photo ),
                    contentType: 'binary'
                }, function( error, options, response, body ) {
                    if ( error ) {
                        delete advert.photos[ p ];
                        return callback();
                    }
//                    console.inspect( response.body );

                    var photo = options.dirname + options.filename,
                        extName = path.extname(photo),
                        md5name = crypto.createHash('md5').update( response.body ).digest('hex').slice(0, 32),
                        md5fileName = md5name + extName,
                        minor = md5name[0],
                        major = md5name.slice(0, 2),
                        md5photo = imagePath + minor + '/' + major + '/' + md5fileName;

                    if ( !fs.existsSync( md5photo ) ) {
                        mkdirp.sync( path.dirname( md5photo ) );
                        var inFile = fs.readFileSync(photo);
                        fs.writeFileSync( md5photo, inFile );
                    }

                    if ( advert.photos[ p ].is_main ) {
                        advert.main_photo = md5fileName;
                    }

                    advert.photos[ p ] = md5fileName;
                    callback();
                }
            );
        }, 100);

        var notQueue = true;
        for ( var p in advert.photos ) {
            if ( !result || result && !( p in result.photos ) ) {
                notQueue = false;
                queue.push({
                    photo   :   advert.photos[ p ].file,
                    advert  :   advert,
                    p       :   p
                });
            }
//            if ( typeof result[ p ] != 'string' ) {
//                delete
//            }
        }

        var _callback = function(  ) {
            typeof _callback.cb == 'function' && _callback.cb( advert );
        };

        _callback.cb = callback;

        queue.drain = _callback;

        if ( notQueue && typeof _callback.cb == 'function' ) {
            _callback.cb( advert );
        }

        return function( callback ) {
            _callback.cb = callback;
            if ( notQueue && typeof _callback.cb == 'function' ) {
                _callback.cb( advert );
            }
        }
    },
    _Callback       :   function( result ) {
        var self = this,
            queue = async.queue(function(advert, callback) {
                advert.site = 'dom.ria.ua';

//                var json = JSON.stringify(advert);
//                json = json.replace(/\n/g, '\\n').replace(/[ \t]+/g, ' ').replace(/\r/g, '');

                db.eval("function(){return addAdvert.apply(this, arguments)}", advert, function( error, value ) {
                    if ( error ) {
                        console.error( error );
                        console.inspect( advert );
                    }else
                    if ( value.error != 'ok' ) {
                        console.inspect( arguments );
                    }
                    callback();
                });
            }, 10);

        db.bind('offers');

        var adverts = result.adverts,
            offersQueue = async.queue(function(advert, callback) {
                db.offers.findOne({id: advert.realty_id}, function( error, result ) {
                    console.fatal( error );

                    delete advert._id;
//                    if ( !result ) {
//                        return queue.push( advert, callback );
//                    }
//
//                    advert._id = result._id;

                    DomRiaUa._checkImages( advert, result )( function() {
                        queue.push( advert, callback );
                    });
                });
            }, 10);

        for ( var id in adverts ) {
            offersQueue.push(adverts[id]);
        }
        queue.drain = function(  ) {
            console.log( 'Объявление записано!!!' );
        };
        offersQueue.drain = function() {
            console.log( 'Все объявления залиты!!!' );
            setTimeout(process.exit, 4000);
        };
    },

    checkAdverts    :   function( Fisher, options, _callback ) {
        var cOffers = db.collection('offers'),
            result = {},
            dd = new Date().getTime(),
            del = async.queue(function(id, callback){
  		  		db.offers.update({site:'dom.ria.ua', id:parseInt(id)}, {$set: {deleted: 1, delete_date: dd}}, false, function(e) {
          	        console.fatal(e);
          	        console.log( 'Объявление %d удалено', id );
          	        callback();
  		  		})
            }, 10),
            queue = async.queue(function(id, callback) {
                new Fish({
                    uri    :   'http://dom.ria.ua/ru/realty-' + id + '.html?json=1'
                },{
                    contentType: 'json'
                }, function( error, options, response, body ) {
                    console.fatal( error );

                    if ( body.is_delete ) {
                  		del.push( body.realty_id );
//                        result[ body.realty_id ] = true;
                    }
                    callback();
                })
            }, 100);
//        cOffers.count( console.inspect );

        queue.drain = function() {
//            DomRiaUa.Exit( result );
  			del.drain = function() {
  				console.log('Exit....');
  				setTimeout(process.exit, 4000);
  			};
        };

//        queue.push( 5109586 );

        db.offers.find({site:'dom.ria.ua', deleted: {$ne: 1}},{id:1}).toArray(function(error, result) {
            console.fatal( error );

            result.forEach(function( e ) {
                queue.push(e.id);
            });
        });
        

    },
    checkResult     :   function( self, $, body ) {
  		self.result.ids = {};
        if ( body.is_delete ) {
      		self.result.ids[ body.realty_id ] = true;
        }
        self.Done();
    },
    _exit			:	function( result ) {
  		setTimeout(process.exit, 4000);
    },
    Exit			:	function( result ) {

        var dd = new Date().getTime(),
  			queue = async.queue(function(id, callback) {
  			db.offers.update({site:'dom.ria.ua', id:parseInt(id)}, {$set: {deleted: 1, delete_date: dd}}, false, function(e) {
                console.fatal(e);
                console.log( 'Объявление %d удалено', id );
                callback();
  			})
  		}, 10);
        for ( var n in result ) {
  			queue.push(n)
  		}
  		
  		queue.drain = function() {
  			console.log('Exit....');
  			setTimeout(process.exit, 4000);
  		}
    } 
};

// var script = document.createElement('script');script.async=true;script.src='http://realtrm.com/shared/js/jquery-1.3.2.min.js';document.body.appendChild(script);
