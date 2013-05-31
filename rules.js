require( 'lo' );
var path = require( 'path' ),
    url = require( 'url' ),
    fs = require( 'fs' );

if ( !fs.existsSync ) {
    fs.existsSync = path.existsSync;
    fs.exists = path.exists;
}
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

var Tools = {
    resultToObject  :   function( result, cols, Result ) {
        var Result = Result || {};
        for( var z in result ) {
            if ( Array.isArray( result[ z ] ) ) {
                for ( var i in result[ z ] ) {
                    if ( !cols[ i ] ) cols[ i ] = 'col-' + i;
                    if ( !Result[ cols[ i ] ] ) Result[ cols[ i ] ] = {};
                    if ( !Result[ cols[ i ] ][ z ] ) Result[ cols[ i ] ][ z ] = {};
                    Result[ cols[ i ] ][ z ] = result[ z ][ i ];
                }
            } else {
                for ( var x in result[ z ] ) {
                    if ( Array.isArray( result[ z ][ x ] ) ) {
                        for ( var i in result[ z ][ x ] ) {
                            if ( !cols[ i ] ) cols[ i ] = 'col-' + i;
                            if ( !Result[ cols[ i ] ] ) Result[ cols[ i ] ] = {};
                            if ( !Result[ cols[ i ] ][ z ] ) Result[ cols[ i ] ][ z ] = {};
                            Result[ cols[ i ] ][ z ][ x ] = result[ z ][ x ][ i ];
                        }
                    } else {
                        for ( var c in result[ z ][ x ] ) {
                            for ( var i in result[ z ][ x ][ c ] ) {
                                if ( !cols[ i ] ) cols[ i ] = 'col-' + i;
                                if ( !Result[ cols[ i ] ] ) Result[ cols[ i ] ] = {};
                                if ( !Result[ cols[ i ] ][ z ] ) Result[ cols[ i ] ][ z ] = {};
                                Result[ cols[ i ] ][ z ][ x ] = result[ z ][ x ][ i ];
                            }
                        }
                    }
                }
            }
        }
        return Result;
    }
}

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

                if ( offer.realty_id == '4776802' ) {
                    console.log( photo, !fs.existsSync( path.resolve( '/spool/crawledPages/photos/', path.basename( photo ) ) ) );
                }
                if ( !fs.existsSync( path.resolve( '/spool/crawledPages/photos/', path.basename( photo ) ) ) )
                self.Queue.push({
                    uri     : photoPath,
                    dirname : '/spool/crawledPages/photos/',
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

exports.autoMailRu = {
    index           :   function( self, $, body ) {                         // http://auto.mail.ru/catalogue/
        self.result.carsCount = $("table.firmsList div a").length;
        self.result.models = {};
        self.result.generations = {};
        self.result.modificationPropLength = {};

        $("table.firmsList div a").each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr('href'),
                rule    :   'carModels'
            });
        });

        self.Done();
    },
    carModels       :   function( self, $, body ) {                         // http://auto.mail.ru/catalogue/lexus/
        var model = $("table#firmInfo h1:eq(0)").text();
        self.result.models = {};
        self.result.models[ model ] = $("table.othersList ul li,ul.modelsList li").length;

        $("table.othersList ul li a,ul.modelsList li a").each( function( id, a ) {
            if ( ! $(a).attr('href').length ) return;
            self.Queue.push({
                uri     :   $(a).attr('href'),
                rule    :   'carGeneration'
            })
        });

        self.Done();
    },
    carGeneration   :   function( self, $, body ) {                         // http://auto.mail.ru/catalogue/lexus/is/
        var model = $("h1.title").text();
        self.result.modelss = {};
        self.result.modelss[ model ] = {
            images      :   $("div.fotosList img").length,
            generations_count:   $("td.title div").length
        };

        $('div.generation').each( function( id, g ) {
            var name = $("table td.title div", g).text();
            self.result.generations = {};
            self.result.generations[ name ] = $("tr[id^='modif_'] td.title a.modif", g).length;

            $("tr[id^='modif_'] td.title a.modif", g).each( function( id, a ) {
                self.Queue.push({
                    uri     :   $(a).attr('href'),
                    rule    :   'carProperties'
                });
            });
        });

        self.Done();
    },
    carProperties   :   function( self, $, body ) {                         // http://auto.mail.ru/catalogue/lexus/is/ii/220d_at/
        var modifyName = $("div.modifname h1").text()+' - '+$("a.compare-on[id^='compare_']").attr('id').replace(/compare_/g, '');
        self.result.modificationPropLength = {};
        self.result.modificationPropLength[ modifyName ] = $("table.tech tr:not(.group) td:not(:empty)").length;

        self.Done();
    }
};
exports.catalogAutoRu = {
    index   :   function( self, $, body ) {                                 // http://catalog.auto.ru/
        self.result.carLength = $('table.list a').length;

        $('table.list a').each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr('href'),
                rule    :   'carModels'
            })
        });

        self.Done();
    },
    'carModels' :   function( self, $, body ) {                             // http://catalog.auto.ru/catalog/cars/kia/
        self.result.models = {};
        var name = $('div.content.navigate-menu').text();
        self.result.models[ name ] = $('table.list a').length;

        $('table.list a').each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr('href'),
                rule    :   'carGeneration'
            })
        });

        self.Done();

    },
    'carGeneration' :   function( self, $, body ) {                         // http://catalog.auto.ru/catalog/cars/kia/sorento/
        self.result.generationsLength = {};
        self.result.generationsModificationLength = {};
        var name = $('div.content.navigate-menu').text();

        var table = $('div.block.content div.block:not(.not-print) table').get();

        self.result.generationsLength[ name ] = table.length/3;

        for ( var n=0; n <= table.length/3+1; n++ ) {
            var ts = table.splice(0,3);
            var modname = $('tr:eq(0) b', ts[0]).text();
            var mod = $('tr.newssubtitle', ts[1]);
            self.result.generationsModificationLength[ modname ] = mod.length;

            mod.find('a').each( function( id, a ) {
                self.Queue.push({
                    uri     :   $(a).attr('href'),
                    rule    :   'carProps'
                });
            });
        };

        self.Done();
    },
    carProps    :   function( self, $, body ) {                             // http://catalog.auto.ru/catalog/cars/card/31365.html
        var name = $('div.content.navigate-menu').text();
        var len = $("div.block.content div.block:not(.not-print) table:eq(1) td:not([colspan='2']):odd:not(:empty)").length;

        self.result.propLength = {};
        self.result.propLength[ name ] = len;

        self.Done();
    }
};

exports.autoYandexRu = {
    index       :   function( self, $, body ) {                             // http://auto.yandex.ru/
        self.result.markLength = $('table.marks-all a').length;
        $('table.marks-all a').each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr('href'),
                rule    :   'getMarks'
            });
        });
        self.Done();
    },
    getMarks    :   function( self, $, body ) {                             // http://auto.yandex.ru/models.xml?mark=HONDA
        var nameTmp = $("#content h1:eq(0)");
        nameTmp.find('span').remove();
        var name = nameTmp.text();
        self.result.mark = {};
        self.result.mark[ name ] = $('table.marks.all li').length;
        $('table.marks.all li span a').each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr( 'href' ),
                rule    :   'getModel'
            });
        });
        self.Done();
    },
    getModel    :   function( self, $, body ) {                             // http://auto.yandex.ru/search.xml?mark=HONDA&model=ACCORD&state=NEW&state=USED&price_from=&price_to=&currency=USD&year_from=&year_to=&engine_type=&color=&km_age_to=&displacement_from=&displacement_to=&climate=&airbag=
        var name = $('div.header h3').text();
        self.result.model = {};
//        self.result.model[ name ] = $("td.informer-group-item.slider__item").length;
        self.result.model[ name ] = $('td.informer-group-item.slider__item').length || $("td.informer-group-item.slider__item h6").length;
        var sliderItemLinks = $('td.informer-group-item.slider__item div.catalog').length
            ? $('td.informer-group-item.slider__item div.catalog')
            : $("td.informer-group-item.slider__item h6");

        sliderItemLinks.each( function( id, el ) {
            var href = $(el).find( 'a:eq(0)' ).attr( 'href' );
            self.Queue.push({
                uri     :   href,
                rule    :   'getModification'
            });
        });
        self.Done();
    },
    getModification :   function( self, $, body ) {                         // http://auto.yandex.ru/catalog.xml?configuration_id=7156485
        var name = $('div.b-header-adtn.i-clearfix h1').text();
        self.result.modification = {};
        self.result.modification[ name ] = $('td.nw a').length;

        $('td.nw a').each( function( id, a ) {
            self.Queue.push({
                uri     :   $(a).attr( 'href' ),
                rule    :   'getProperties'
            });
        });

        self.Done();
    },
    getProperties   :   function( self, $, body ) {                         // http://auto.yandex.ru/complect-cmp.xml?conf_comp_tech_id=7156485_7156530_7156492
        var name = $('div.b-header-adtn.i-clearfix h1').text() + ' ' +$('th.one-header h6').parent().text() + '-' + $("div.add-to-comparison").attr('id');
        self.result.properties = {};
        self.result.properties[ name ] = $('td.techn:not(.comfort) table td[colspan!=2]:odd:not(:empty)').length;
        self.Done();
    }
};

exports['alpina-cars.ru'] = {
    index           :   function( self, $, body ) {                         // http://www.alpina-cars.ru/ww/models-ru.html
        self.result.models = $('li.act ul a').get().map(function(e) {return $(e).attr('title')});

        $('li.act ul a').each(function(id, a) {
            self.Queue.push({
//                uri     :   '/'+$(a).attr('href').replace(/\.html$/, '/technical-data.html'),
                uri     :   '/'+$(a).attr('href').replace(/\.html$/, '/technical-data.html'),
                rule    :   'model'
            });
        });
        self.Done();
    },
    model           :   function( self, $, body ) {
        var menuModel = $("a.secnav_act:eq(0)").parent().find('ul').find('a').get().map(function(e) {return '/'+$(e).attr('href')}),
            selectModel = $("select[name='selectmodel'] option").get().map(function(e) {if (e)return '/'+$(e).attr('value')}),
            models = [].concat(menuModel, selectModel);

        models.forEach( function( h ) {
            self.Queue.push({
                uri     :   h,
                rule    :   'cfgdata'
            });
        });

//        self.result.modelUrls = models;
        self.Done();

    },
    cfgdata         :   function( self, $, body ) {                         // http://www.alpina-cars.ru/ww/models-ru/b5-biturbo/technical-data.html
        var model = $("table.configuratordata").parent().find('table:not(.configuratordata) td:eq(0)').text().trim();
        var result = {};
        $("table.configuratordata").each(function(id, t) {
            var cls = $(t).find('th:eq(0)').text();
            result[cls] = {};
            $(t).find('tr').each(function(id, tr) {
                var td = $(tr).find('td:not(:empty)');
                if ( td.length ) {
                    result[cls][$(td[0]).text()] = $(td[1]).text();
                }
            });
        });

        self.result.cfgData = {};
        self.result.cfgData[ model + '-' + self.referer ]= result;

        self.Done();
    }
};

exports['astonmartin.ru'] = {
    index           :   function( self, $, body ) {                         // http://www.astonmartin.ru/
        var models = $('#Footer_CarMenu_WebLinks2 ul:eq(0) a').get().map(function(e) {return $(e).attr('title')}),
            modelSpecs = $('#Footer_CarMenu_WebLinks2 ul:eq(0) a').get().map(function(e) {return $(e).attr('href')+'/specs'}),
            modelOptions = $('#Footer_CarMenu_WebLinks2 ul:eq(0) a').get().map(function(e) {return $(e).attr('href')+'/options'});

        modelSpecs.forEach( function( e ) {
            self.Queue.push({
                uri     :   e,
                rule    :   'modelSpec'
            });
        });
        modelOptions.forEach( function( e ) {
            self.Queue.push({
                uri     :   e,
                rule    :   'modelOptions'
            });
        });

        self.result.models = models;

        self.Done();
    },
    modelSpec       :   function( self, $, body ) {                         // http://www.astonmartin.ru/cars/36/specs
        var name = $('#subnav h1').text()+ '-' +self.referer,
            specs = {};
        $('div.box').each(function(id, d){
            var c=$(d).find('h2').text(),
                s=specs[c]=[];
            $(d).find('li').get().map(function(l){
                s.push($(l).text().trim())
            });
        });

        self.result.specs = {};
        self.result.specs[ name ] = specs;

        self.Done();
    },
    modelOptions    :   function( self, $, body ) {                         // http://www.astonmartin.ru/cars/36/options
        var name = $('#subnav h1').text()+ '-' +self.referer,
            specs = {};
        $('div.column').each(function(id, d){
            var c=$(d).find('h2').text(),
                s=specs[c]=[];
            $(d).find('li').get().map(function(l){
                s.push($(l).text().trim())
            });
        });

        self.result.options = {};
        self.result.options[ name ] = specs;

        self.Done();
    }
};

exports['bentleyspb.ru'] = {
    index           :   function( self, $, body ) {                         // http://www.bentleyspb.ru/Current-Models/Current-Model-Overview/
        var models = $('div.item div.model').get().map(function(e){return $(e).find('h2').text()});

        self.result.models = models.sort();

        self.Done()

    }
};

exports['byd.tagaz.ru'] = {
    index           :   function( self, $, body ) {
        self.Queue.push({
            uri     :   'http://byd.tagaz.ru/complectation',
            rule    :   'complectation'
        });
        self.Queue.push({
            uri     :   'http://byd.tagaz.ru/engineering',
            rule    :   'engineering'
        });
        self.Done();
    },
    complectation   :   function( self, $, body ) {                         // http://byd.tagaz.ru/complectation
        var $comp = $("div.moduletable:eq(3) div:eq(0)"),
            cols = $comp.find('table:eq(0) td').get().map(function( e ){return $(e).text();}),
            price= $comp.find('table:eq(1) td').get().map(function( e ){return $(e).text();});
//        console.log($($comp.get()[0].childNodes).get().text() );return self.Done();
        var p = $comp.get()[0].childNodes.splice(3),
            params = {},
            ptr = null;
            p.map(function(e) {
                var cls = $(e).is('table') && $(e).text().trim() || null;
                if ( cls ) {
                    ptr = params[ cls ] = {};
                    return;
                }
                $(e).find( 'table tr' ).each(function(i,e){
                    var item = $(e).find('td:first').text().trim(),
                        opts = $(e).find('td:not(:first) img').get().map(function(t){return $(t).attr('alt') == 'Есть' ? true : false;});

                    ptr[ item ] = opts;
//                    console.inspect( item );
//                    console.inspect( opts );
                });
//
            });

        self.result.complectation = {};
        var model = self.result.complectation[ cols[0]+' '+price[0] ] = {};
        price.splice(1).forEach(function( e, id ){
            var m = model[ cols[ 1+id ] ] = {'Цена': e };

            for( var p in params ) {
                var z = m[ p ] = {}
                for( var c in params[p] ) {
                     z[ c ] = params[ p ][c][ id ];
                }
            }
        });

        self.Done();
    },
    engineering     :   function( self, $, body ) {                             // http://byd.tagaz.ru/engineering
        var $comp = $("div.moduletable:eq(3)"),
            cols = $comp.find('table:eq(0) td').get().map(function( e ){return $(e).text();}),
            price= $comp.find('table:eq(1) td').get().map(function( e ){return $(e).text();}),
            model = cols[0]+' '+price[0],
            p = $comp.get()[0].childNodes.splice(5),
            params = {},
            ptr = null;

        p.map(function(e) {
            var cls = $(e).is('table') && $(e).text().trim() || null;
            if ( cls ) {
                ptr = params[ cls ] = {};
                return;
            }
            $(e).find( 'table tr' ).each(function(i,e){
                var item = $(e).find('td:first').text().trim(),
                    opts = $(e).find('td:not(:first)').text().trim();

                ptr[ item ] = opts;
            });
        });

        self.result.engineering = {};
        self.result.engineering[ model ] = params;

        self.Done();
    }
};

exports['chery.ru'] = {
    index           :   function( self, $, body ) {                             // http://www.chery.ru/models
        var models = $('td.cars-text a[title]').get().map(function(e) {return $(e).attr('title')});
        $('td.cars-text a[title]').each( function( id, e ) {
            self.Queue.push({
                uri     :   $(e).attr('href')+'/price',
                rule    :   'price'
            });
            self.Queue.push({
                uri     :   $(e).attr('href')+'/specifications',
                rule    :   'specifications'
            });
        });

        self.result.models = models;

        self.Done();
    },
    price           :   function( self, $, body ) {                             // http://www.chery.ru/models/tiggo/price
        var name = $('div.describe h1 span').text().trim() + '-' + self.referer,
            result={},
            cls='',
            ptr=result,
            cols = [];
        $('table.all_table tr').get().map(function(e){
            if ( $(e).find('td').hasClass('header') ){
                cls=$(e).text().trim();
                ptr=result[cls]={};

                return;
            }

            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:not(:first)').get().map(function(e) {
                    return $(e).text().trim().length
                        ? $(e).text().trim()
                        : $(e).find('img').length ? false : true;
                });
            if ( (!cols.length || /^Выпуск/.test( cls )) && !th.length ) {
                for ( var i in td ) {
                    if ( !cols[i] ) cols[i] = td[i];
                }
                return;
            }
            ptr[ th ] = td;
        });

        self.result.price = {};
        self.result.price[ name ] = {};

        cols.map(function(e, i) {
            self.result.price[ name ][ e ] = {};
        });

        for ( var k in result ) {
            for( var z in result[ k ] ) {
                if ( Array.isArray( result[ k ][ z ] ) ) {
                    for ( var i in result[ k ][ z ] ) {
                        if ( !self.result.price[ name ][ cols[ i ] ] ) self.result.price[ name ][ cols[ i ] ] = {};
                        if ( !self.result.price[ name ][ cols[ i ] ][ k ] ) self.result.price[ name ][ cols[ i ] ][ k ] = {};
                        if ( !self.result.price[ name ][ cols[ i ] ][ k ][ z ] ) self.result.price[ name ][ cols[ i ] ][ k ][ z ] = {};

                        self.result.price[ name ][ cols[ i ] ][ k ][ z ] = result[ k ][ z ][ i ];
                    }
                } else {
                    self.result.price[ name ][ cols[ z ] ][ k ] = result[ k ][ z ];
                }
            }
        }

        self.Done();
    },
    specifications  :   function( self, $, body ) {                             // http://www.chery.ru/models/tiggo/specifications
        var name = $('div.describe h1 span').text().trim() + '-' + self.referer,
            result={},
            cls='',
            ptr=result;

        $('table.all_table tr').get().splice(1).map(function(e){

            if ( $(e).find('td').hasClass('header') ){
                cls=$(e).text().trim();
                ptr=result[cls]={};
                return;
            }

            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:eq(1)').text().trim().length
                    ? $(e).find('td:eq(1)').text().trim()
                    : $(e).find('td:eq(1) img').length ? false : true;

            ptr[ th ] = td;
        });

        self.result.specifications = {};
        self.result.specifications[ name ] = result;

        self.Done();
    }
};

exports['dodge.ru'] = exports['chrysler.ru'] = {
    index           :   function( self, $, body, inner ) {                             // http://www.chrysler.ru/lineup.html
//        var models = {};
//        $('div.model').get().map(function(e){
//            var name = $(e).find('div.info h3').text().trim(),
//                price = $(e).find('div.image_info div.as_shown_text').text().trim();
//            models[name] = price;
//        });
//

        $("#vehicle_menu_container li:not(:last) a").each(function(i, e) {
            var uri = $(e).attr('href').replace(/(.+)\/.+$/, '$1/specs/');
            self.Queue.push({
                uri     :   uri+'index.html',
                rule    :   'specs'
            });
            self.Queue.push({
                uri     :   uri+'exterior.html',
                rule    :   'exterior'
            });
            self.Queue.push({
                uri     :   uri+'interior.html',
                rule    :   'interior'
            });
        });

//        $('div.model div.image_info a').each(function( id, a ){
//            var uri = $(a).attr('href').replace(/(.+)\/.+$/, '$1/specs/');
//            self.Queue.push({
//                uri     :   uri+'index.html',
//                rule    :   'specs'
//            });
//            self.Queue.push({
//                uri     :   uri+'exterior.html',
//                rule    :   'exterior'
//            });
//            self.Queue.push({
//                uri     :   uri+'interior.html',
//                rule    :   'interior'
//            });
//        });

//        self.result.models = models;

        !inner && self.Done();
    },
    specs           :   function( self, $, body, inner ) {                             // http://www.chrysler.ru/11grand_voyager/specs/index.html
        var rows = $('#specs_row_holder'),
            name = $("#vehicle_name").text().trim(),
            cols = rows.find('h3').get().map(function(e){return $(e).text();}),
            specs = {},
            result = {},
            cls = '',
            scls = null,
            ptr = null;
        rows.find('div:not(:empty)').get().splice(3).map( function(e) {

            if ( $(e).hasClass('specs_toggle_feature') ) {
                cls = $(e).text().trim();
                ptr = result[ cls ] = {};
                return;
            }

            $( e ).find( 'ul' ).each(function(id, e){
            
          		if ( $(e).find('li:first strong b').length ) {
          			scls = $(e).find('li:first strong b').text().trim();
          			ptr = result[ cls ][ scls ] = {};
          			return;
          		}

                var name = $(e).find('li:first').text().trim(),
                    items = $(e).find('li:not(:first)').get().map(function(e){return $(e).text().trim();});
                    
                ptr[ name ] = items;
            });
        });

		function forCols( e, i ) {
            specs[e] = {};
            for( var p in result ) {
                specs[e][p] = {};
                for ( var z in result[p] ) {
              		if ( result[p][z] && !Array.isArray( result[p][z] ) ) {
              			specs[e][p][z] = {};
              			for ( var x in result[p][z] ) {
		                    specs[e][p][z][x] = result[p][z][x][i];
              			}
              		} else
	                    specs[e][p][z] = result[p][z][i];
                }
            }
		}
        cols.forEach( forCols );

        self.result.specs = {};
        self.result.specs[ name ] = specs;
        !inner && self.Done();
    },
    exterior        :   function( self, $, body ) {                                 // http://www.chrysler.ru/11grand_voyager/specs/exterior.html
        this.specs.apply( this, [ self, $, body, true ] );

        self.result.exterior = self.result.specs;
        delete self.result.specs;

        self.Done();
    },
    interior        :   function( self, $, body ) {                                 // http://www.chrysler.ru/11grand_voyager/specs/interior.html
        this.specs.apply( this, [ self, $, body, true ] );

        self.result.interior = self.result.specs;
        delete self.result.specs;

        self.Done();
    }
};

exports["info.citroen.ru"] = {
    index           :   function( self, $, body ) {                                 // http://info.citroen.ru/price
        var result={},
            cls='',
            ptr=null;

        $('div.price').get().map(function(e){
            cls=$(e).find('h3').text();
            ptr=result[cls]=[];
            $(e).find('a').get().map(function(e){
                ptr.push($(e).find('h4').text().trim());
                self.Queue.push({
                    uri     :   $(e).attr('href'),
                    rule    :   'getComps'
                });
            });
        });

        self.result.models = result;

        self.Done();
    },
    getComps        :   function( self, $, body ) {                                 // http://info.citroen.ru/price/commercial/jumper/integration/chassis/
        $('select.cf:eq(0) option').each(function(i,e) {
            self.Queue.push({
                uri     :   self.referer,
                method  :   'POST',
                body    :   'n1='+$(e).attr('value')+'&n2=1',
                rule    :   'info'
            });
        });

        var tr = $("#technical_characteristics table tr").get(),
            comps = [],
            skip = 0;
        for ( var i in tr ) {
            var pd = $(tr[i]).find("td:not(:eq(0),:eq(1)) div.pd").get();
//            console.inspect( $(pd[0]).text().length );
            if ( !$(pd[0]).text().length ) continue;

            pd.map(function(e) {
                if ( $(e).text().length )
                    comps.push( $(e).text() + ' - ' + self.referer );
            });
            skip = i;
            break;
        }
//        console.debug( comps );
        var result = {},
            cls = '',
            ptr = null;
//            comps = $("#technical_characteristics table tr:eq(5) td:not(:eq(0),:eq(1))").get().map(function(e) {
//            comps = $("#technical_characteristics table tr:eq(0) td:not(:eq(0),:eq(1)) div.pd:not(:empty)").get().map(function(e) {
//                if ( !$(e).text().length ) console.warn( self.referer );
//                return $(e).text() + ' - ' + self.referer;
//            });

        $("#technical_characteristics table tr").get().splice(skip).map(function(e) {
            cls = $(e).find( 'td:eq(0) div.pd' ).text().trim();
            if ( cls ) {
                ptr = result[ cls ] = {};
//                return;
            }

            var name = $(e).find('td:eq(1) div').text().trim(),
                items = [];
            $(e).find('td:gt(1)').get().map(function(e) {var t = $(e).text(); if (t && t.length)items.push(t)});
            try {
                ptr[ name ] = items;
            } catch(e) {
//                console.debug( self.referer, body.toString().slice(0,400) );
            }
        });

        self.result.tc = {};
//        console.inspect( result );
//        console.inspect( comps );
        comps.forEach(function( e, i ) {
            var w = self.result.tc[ e ] = {};

            for ( var p in result ) {
                w[p] = {};
                for ( var z in result[p] ) {
                    w[p][z] = result[p][z][ i ] || '';
                }
            }
        });

        self.Done();
    },
    info            :   function( self, $, body ) {                                 // http://info.citroen.ru/price/commercial/jumper/integration/chassis/ n1=3&n2=1

        var name = $('select.cf:eq(0) option:selected').text() + ' - ' + self.referer,
            price = $("#total1").text(),
            result = {},
            cls = '',
            ptr = result;

        $('#pricetable tr').each(function(i,e) {
            if ( $(e).hasClass('h1') ) {
                cls = $(e).text().trim();
                ptr = result[ cls ] = {};
                return;
            }
            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:eq(1)').text().trim();

            ptr[ th ] = td;
        });

        self.result.price = {};
        self.result.price[ name ] = result;
        self.result.price[ name ]['Цена'] = price;

        self.Done();
    }
};

exports["uzdaewoo.ru"] = {
    index           :   function( self, $, body ) {
        var models = $('#sub2 li.m1').get().map(function(e) {                       // http://www.uzdaewoo.ru/

            self.Queue.push({
                uri     :   $(e).find('ul.subsubmenu a[href^="/auto/teh_"]').attr('href'),
                rule    :   'chars'
            });
            self.Queue.push({
                uri     :   $(e).find('ul.subsubmenu a[href^="/auto/komplektatsiya_"]').attr('href'),
                rule    :   'price'
            });

            return $(e).find('a:eq(0)').text();
        });

        self.result.models = models;

        self.Done();
    },
    chars           :   function( self, $, body ) {                                     // http://www.uzdaewoo.ru/auto/teh_harakteristiki_2/
        var name = $('h1.header').text(),
            result = {},
            ptr = null;

        $('#techtable tr').get().map(function(e) {
            var cls = $(e).find('th').text().trim();
            if ( cls.length ){
                ptr = result[ cls ] = {};
                return;
            }

            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:eq(1)').text().trim();

            ptr[ th ] = td;
        });

        self.result.chars = {};
        self.result.chars[ name ] = result;

        self.Done();
    },
    price           :   function( self, $, body ) {                                     // http://www.uzdaewoo.ru/auto/komplektatsiya_i_tseni_3/
        var name = $('h1.header').text(),
            comps = $('#kompltable thead th.mod').get().map(function(e) {return $(e).text().trim()}),
            result = {},
            cls = $('#kompltable thead th.sto').text().trim(),
            ptr = result[ cls ] = {};

        $('#kompltable tbody tr').each(function( id, e ) {
            cls = $(e).find('th').text().trim();
            if ( cls ) {
                ptr = result[ cls ] = {};
                return;
            }

            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:gt(0)').get().map( function(e) { return $(e).text().trim();} );

            ptr[ th ] = td;
        });

        self.result.price = {};
        comps.forEach(function( c, id ) {
            var price = {};
            for( var p in result ) {
                price[ p ] = {};
                for( var z in result[ p ] ) {
                    price[p][z] = result[p][z][id] || result[p][z][0] || '';
                }
            }
            self.result.price[ c+'-'+id ] = price;
        });

        self.Done();
    }
};

exports['ferrari.com'] = {
    index           :   function( self, $, body ) {                                     // http://www.ferrari.com/English/GT_Sport%20Cars/CurrentRange/Pages/Current_Range.aspx
  		self.result.models = [];
		$("div.WF_Item_Content_2_Row div[id^='clientHeading']").each(function(i,e) {
  			var explore = $(e).find('div.link-item a'),
  				model = $(e).find('h3').text().trim();
  			
  			if ( model )
          	  	self.result.models.push( model )

            if ( $(explore).text().trim() != 'Explore') return;

            var href = $(explore[1]).attr('href'),
          		mark = href.replace(/.+\/([^/]+)$/, '$1').replace(/Ferrari/i, '');
            self.Queue.push({
          		uri		:	href+ '/Pages/' + mark + '.aspx'.replace(/ /, '%20'),
          		rule	:	'getSpecUrl'
            });
            
            
        });
        self.result.models.sort();
        self.Done();
    },
    getSpecUrl		:	function( self, $, body ) {										// http://www.ferrari.com/English/GT_Sport%20Cars/CurrentRange/458-Italia/Pages/458-Italia.aspx
  		$('#nav_sub-navigation li').each(function(i, e) {
            console.inspect( $(e).text().trim() );
  		    if ( /Tech.+ spec.+/i.test($(e).text().trim()) ) {
  		  		self.Queue.push({
  		  			uri		:	$(e).find('a').attr('href').replace(/ /, '%20'),
  		  			rule	:	'getSpecs'                            
  		  		});
  		  	}
  		})
  		self.Done();
    },
    getSpecs		:	function( self, $, body ) {										// http://www.ferrari.com/English/GT_Sport%20Cars/CurrentRange/458-Italia/Performance_Figures/Pages/Technical_Sheet_458-Italia.aspx
  		var name = $("#imageTopText").text().trim()  + ' - ' + self.referer,
  			result = self.result[ name ] = {}, 
  			ptr = result;
  	
  		$('div.WF_ContentLevel_2_Tables div.AspNet-WebPart').each(function(i,e) {
  		    var cls = $(e).find("div.WF_Table_Caption").text().trim();
  		    if ( cls ) {
  		  		ptr = result[ cls ] = {};
  		    }
  	        $(e).find("div.WF_TR, div.WF_TR_Alt").each(function(i,e) {
  	            var th = $(e).find('div.WF_TD_Col_1').text().trim(),
	                td = $(e).find('div.WF_TD_Col_2').text().trim();
                ptr[ th ] = td;
            });
  		});
  		self.Done();
    }
};

exports['fiat.ru'] = {                                                                  // http://fiat.ru/model/
    index           :   function( self, $, body ) {
        self.result.models = [];
        $('div.model:not(:last)').get().map(function(e) {
            // http://fiat.ru/model/passenger/grpunto5d/technical/dimensions/
            // http://fiat.ru/model/passenger/albea/technical/print/?form=print
            // http://fiat.ru/model/passenger/albea/integration/print/?form=print
            if ( !$(e).find('div.more a').length ) return;
//            console.inspect( $(e).find('div.more a').attr('href') );
            self.Queue.push({
                uri     :   $(e).find('div.more a').attr('href').replace(/description\//, 'technical/'),
                rule    :   'checkPrint'
            });
            
            var title = $(e).find('div.name a img').attr('title') + ' - ' + $(e).find('div.name').text().trim();
            self.result.models.push(title);
        });

        self.Done();
    },
    parseTab        :   function( self, $, variable, cols ) {
        var name = $('div.top_block div.right h2').text() + ' - ' + self.referer,
            cols = cols || $('div.press table.tab tr:eq(0) td:gt(0)').get().map(function(e) {return $(e).text().trim()}),
            result = {};

        $('div.press table.tab tr').get().splice(1).map(function(e) {
            var th  = $(e).find('td:eq(0)').text().trim(),
                td  = $(e).find('td:gt(0)').get().map(function(e){return $(e).text().trim()});

            result[ th ] = td;
        });

        var ptr = variable[ name ] = {};

        cols.forEach(function(e, id) {
            ptr[ e ] = {};
            for ( var p in result ) {
                ptr[ e ][ p ] = result[p][id] || '';
            }
        });
    },
    checkPrint      :   function( self, $, body ) {
        self.Queue.push({
            uri     :   self.referer + 'print/?form=print',
            rule    :   'technicalPrint'
        });

        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'technical/dimensions/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'technical/engine/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'technical/part/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'technical/field/'),
            rule     :   'parsePrice'
        });


        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'integration/exterior/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'integration/comfort/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'integration/safety/'),
            rule     :   'parsePrice'
        });
        self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'integration/audio/'),
            rule     :   'parsePrice'
        });

        self.referer && self.Queue.push({
            uri      :   self.referer.replace(/technical\//, 'integration/'),
            rule     :   'parsePrice'
        });


        var tech = self.result.tech = {};
        this.parseTab( self, $, tech );

        self.Done();
    },
    parsePrice      :   function( self, $, body ) {
        var cols = $('div.press table.tab tr.tab1:first td:gt(0)').get().map(function(e) {
            return $(e).text().trim();
        });
//        console.inspect( cols );
        $('div.press table.tab tr.tab2:first td:gt(0)').get().forEach(function(e, id) {
            cols[id]+=' - '+$(e).text().trim();
        });

        var price = self.result.price = {};
        this.parseTab( self, $, price, cols );

        self.Done();
    },
    technicalPrint  :   function( self, $, body ) {
        var name = $('table h2').text().trim() + ' - ' + self.referer,
            result = {},
            ptr = result,
            cols = $('table table tr:eq(0) td:gt(0)').get().map(function(e){return $(e).text().trim()});

        $('table table tr:gt(0)').get().map(function(e) {
            if ( $(e).find('td').length == 1 ) {
                ptr = result[ $(e).find('td').text().trim() ] = {};
                return;
            }
            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:gt(0)').get().map(function(e) {return $(e).text().trim()});

            ptr[ th ] = td;
        });
        self.result.tech = {}
        var tech = self.result.tech[ name ] = {};

//        console.inspect( cols );

        cols.forEach(function(e, i) {
            ptr = tech[ e ] = {};
            for( var p in result ) {
                if ( cols.length > 1 ) {
                    ptr[ p ] = result[ p ][i];
                } else {
                    if ( !ptr[ p ] ) ptr[ p ] = {};
                    for ( var k in result[ p ] ) {
                        ptr[ p ][ k ] = result[ p ][ k ][i];
                    }
                }
//                console.inspect( result[ p ] );
            }
        });

        self.Done();
    }
};

exports['ford.ru'] = {
    index           :   function( self, $, body ) {                                         // http://www.ford.ru/Cars

//        $('script:not([src])').get().forEach(function(e, i) {
//            console.debug( 'script %d', i );
//            console.warn( $(e).text() );
//        });

//        console.inspect( $('script:not([src]):eq(16)').text() );
        var vm = require('vm'),
            script = vm.createScript( $('script:not([src]):eq(16)').text() ),
            sandbox = {
                window  :   {
                    addEvent:   function() {}
                },
                engine  :   {
                    fvd     :   {
                        data    :   {}
                    }
                }
            };

        try {
            script.runInNewContext( sandbox );
        } catch ( e ) {
            console.error( e );
        }

        var obj = sandbox.engine.fvd.data.nameplates;

        self.result.models = {};

        for ( var o in obj ) {
            var e = obj[o];
            self.result.models[ e.name ] = e.minprice;

            self.Queue.push({
                uri     :   e.link,
                rule    :   'car'
            });
        }

        self.Done();
    },
    car             :   function( self, $, body ) {                                         // http://www.ford.ru/Cars/Fusion
        var links = [ $('a:contains("Цены")').attr('href'), $('a:contains("Комплектации")').attr('href'), $('a:contains("Элементы и оборудование")').attr('href')],
            rules = [ 'price', 'comps', 'opts' ];

        links.forEach(function( e, i ) {
            if ( !e ) return;
            self.Queue.push({
                uri     :   e,
                rule    :   rules[i]
            });
        });

        self.Done();
    },
    price           :   function( self, $, body ) {
        var cols = [],
            length = $('table.defTable tr:eq(0) th').length,
            depth = 1,
            result = {},
            ptr = null,
            cls = null;

        $('table.defTable tr:eq(0) th').each(function(i, e) {
//            console.inspect( $(e).html() );
            if ( i == length -1 || $(e).find('font').length ) {
                cols.push( $(e).text().trim() );
            }
        });

        depth = length-cols.length;

        $('table.defTable tr:gt(0) ').each(function(i, e) {
            if ( $(e).find('td').length == 1 ) {
                ptr = result[ $(e).find('td').text().trim() ] = {};
                return;
            }
            var marg = 0;
            if ( $(e).find('td').length == length ) {
                cls = ptr[ $(e).find('td:eq(0)').text().trim() ] = {};
                depth > 1 && (marg = 1);
            };

//            console.log( $(e).find('td').text() );

            $(e).find('td:gt('+marg+')').each(function(i,e) {
                cls[ cols[i] ] = $(e).text().trim();
            });

        });

        self.result.price = result;

        self.Done();
    },
    comps           :   function( self, $, body ) {
        var comps = self.result.comps = {};
        $('div.shlDerivativeDiv').each(function(i,e) {
            var name = $(e).find('span.fvdCarName').text().trim();

            comps[ name ] = {
                'Цена'  :   $(e).find('span.fvdMinPrice1').text().trim(),
                detail  :   $(e).find('div.shlDetail li').get().map(function(e){return $(e).text().trim()})
            };


        });

        self.Done();
    },
    opts            :   function( self, $, body ) {                                     // http://www.ford.ru/Cars/Focus/Focus_Featuresandspecifications
        var name = $('div.headers div.Text').text().trim(),
            cols = $('div.DataColOuter table thead th:not(:first)').get().map(function(e) {return $(e).find('div.text').text().trim()}),
            result = {},
            ptr = null;

//        console.inspect(cols);

        $('div.FirstCol table tbody tr').each(function(i, e) {

            if ( $(e).find('td').length == 1 ) {
                ptr = result[ $(e).find('td').text().trim() ] = {};
                return;
            }

            var th = $(e).find('td:eq(0)').text().trim(),
                td = $(e).find('td:gt(0)').get().map(function(e) {return $(e).text().trim()});

            ptr[ th ] = td;
        });

        self.result.opts = {};

        var opts = self.result.opts[ name ] = {};

        cols.forEach(function(e, i) {
            var ptr = opts[ e ] = {};
            for ( var p in result ) {
                ptr[p] = {};
                for ( var z in result[p] ) {
                    ptr[p][z] = result[p][z][i];
                }
            }
        });

        self.Done();
    }
};

exports['shop.rusma.ru'] = {
    index           :   function( self, $, body ) {                                     // http://shop.rusma.ru/index.aspx?view=model&group=170
        self.Queue.push({
            uri     :   'http://shop.rusma.ru/index.aspx?view=model&group=170',
            rule    :   'models'
        });
        self.Queue.push({
            uri     :   'http://shop.rusma.ru/index.aspx?view=model&group=171',
            rule    :   'models'
        });

        self.Done();
    },
    models          :   function( self, $, body ) {
        var models = $('.text_shag tr').get().map(function(e) {                     // http://shop.rusma.ru/index.aspx?view=model&group=170

            self.Queue.push({
                uri     :   $(e).find( 'td:last h3 a' ).attr('href'),
                rule    :   'price'
            });
//            return $(e).find( 'td:last h3' ).text().trim();
        });
        self.Done();
    },
    price           :   function( self, $, body ) {                                   // http://shop.rusma.ru/index.aspx?view=complect&model=174
        var table = $("td.text_shag table"),
            cols = $(table).find('tr:eq(0) td:not(:first)').get().map(function(e) {return $(e).text().trim()}),
            result = {},
            ptr = result;

        $(table).find('tr:not(:first)').each(function(i, e) {
            ptr = result[ $(e).find('td:first').text().trim() ] = {};
            $(e).find('td:not(:first)').each(function(i, e) { ptr[ cols[i] ] = $(e).text().trim().replace(/\t|\r|\n/g,'')});
        });

        self.result.models = result;
        self.Done();
    }
};

exports['geely-motors.com'] = {
    index           :   function( self, $, body ) {                                     // http://geely-motors.com/
        $('.collapsed:not(:last)').each( function( i, o ) {
            self.Queue.push({
                uri     :   $(o).find('a').attr('href'),
                rule    :   'getProp'
            });
        });
        self.Done();
    },
    getProp         :   function( self, $, body ) {
        $('div.content li.leaf:not([class*="menu"])').each(function(i, o) {
            var a = $(o).find('a'),
                rule = {
                    'Спецификация'  :   'specific',
                    'Комплектация'  :   'complect'
                }[ a.attr('title') ];

            if ( rule )
                self.Queue.push({
                    uri     :   a.attr('href'),
                    rule    :   rule
                });
        });
        self.Done();
    },
    specific        :   function( self, $, body ) {
        var result = {}, ptr = result;
        $('#content-content table').each(function( i, o ) {
            var cls;
            $(o).find( 'tr').each( function( i, tr ) {
                var td = $(tr).find('td').get();
                if ( !cls ) {
                    cls = $(td.shift()).text().trim();
                    ptr = result[ cls ] = {};
                }

                var k = $(td).eq(0).text().trim(),
                    v = $(td).eq(1).text().trim();

                if ( k )
                    ptr[ k ] = v;
            });
        });

        self.result.specific = {};
        self.result.specific[ self.referer ] = result;

        self.Done();
    },
    complect        :   function( self, $, body ) {
        var result = {}, ptr = result;
        $("div.content table").each(function(i, o) {
            var cell;
            $(o).find('tr').each(function(i, tr) {
                var td = $(tr).find('td').get();
                if ( !cell ) {
                    cell = td.splice(1).map(function(e) { result[ $(e).text().trim() ] = {};return $(e).text().trim(); });

                    return;
                }

                var k = $(td).eq(0).text().trim();

                $( td ).splice(1).map(function(e, i) {
                    result[ cell[ i ] ][k] = $(e).text().trim();
                });
            });
        });
        self.result[ self.referer ] = {};
        self.result[ self.referer ] = result;
        self.Done();
    }
};

exports['irito.ru'] = {
    index           :   function( self, $, body ) {                             // http://www.irito.ru/
        self.Queue.push({
            uri     :   'http://www.irito.ru/pikapy/',
            rule    :   'getModels'
        });
        self.Queue.push({
            uri     :   'http://www.irito.ru/4x4/',
            rule    :   'getModels'
        });
        self.Done();
    },
    getModels       :   function( self, $, body ) {                             // http://www.irito.ru/great-wall/great-wall-wingle-3/
        var short = {};
        $('div.avtomob').each(function(i, e) {
            var name = $(e).find('a:last'),
                price = $(e).find('span').text().trim();
            short[ name.text().trim() ] = price;
            self.Queue.push({
                uri     :   name.attr('href') + '/optsii-i-tsveta' + ( i > 0 ? '-'+(i+1) : '' ) + '/',
                rule    :   'getSvet'
            });
            self.Queue.push({
                uri     :   name.attr('href') + '/harakteristiki' + ( i > 0 ? '-'+(i+1) : '' ) + '/',
                rule    :   'getChars'
            });
        });
        self.result.shortPrice = short;
        self.Done();
    },
    getSvet         :   function( self, $, body ) {                             // http://www.irito.ru/great-wall/great-wall-hover-h5/optsii-i-tsveta-4/
        var name = $("h1:last").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result, cls,
            cols = $('table.complect.table tbody tr:not(:first,:eq(0)) td:not(:first)').get().map(function(e) {
                return $(e).text().trim();
            });

        $('table.complect.table tbody tr:not(:first,:eq(0))').each(function(i, e) {
            var cls = $(e).find('td:first strong');
            if ( cls.length && cls.text().trim().length ) {
                ptr = result[ cls.text().trim() ] = {};
                return;
            }
            var th = $(e).find( 'td.base_name').text().trim(),
                td = [];
            $(e).find( 'td:not(.base_name)').each(function(i, e) {
                var colspan = parseInt( $(e).attr('colspan')),
                    text = $(e).text().trim();

                if ( colspan ) {
                    for( var n = i; n < i+ colspan; n++ ) {
                        td.push( text );
                    }
                    return;
                }
                td.push( text );
            });
            if ( th.length ) ptr[ th ] = td;
        });

        self.result.svet = {};
        self.result.svet[ name ] = result;
        self.Done();
    },
    getChars        :   function( self, $, body ) {
        var name = $("h1:last").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result, cls;

        $("#car_info table tr").each(function(i, e) {
            var cls = $(e).find('td:first strong');
            if ( cls.length && cls.text().trim().length ) {
                ptr = result[ cls.text().trim() ] = {};
                return;
            }
            var th = $(e).find( 'td:first').text().trim(),
                td = $(e).find('td:not(:first)').get().map(function(e) {return $(e).text().trim();});

            if ( th.length ) ptr[ th ] = td;
        });

        self.result.chars = {};
        self.result.chars[ name ] = result;
        self.Done();
    }
};

exports[ 'haima.ru' ] = {
    index           :   function( self, $, body ) { // http://www.haima.ru/customer/cars/
        $('ul.left-menu li a').each(function( i, e ) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'getPrice'
            });
        });
        self.Done();
    },
    getPrice        :   function( self, $, body ) { // http://www.haima.ru/customer/cars/haima3hb/
        var name = $('h1').text().trim() + ' - ' + self.referer,
            table = $('.body_text div[id^="kz"]:not(:first) table'),
                //$(".body_text div[id]:not(:visible) table[style]:not(:first)"),
            result = {}, ptr = result, cls = null,
            cols = [];

        $(table).find('tr').each(function( i, e ) {
            var cls = $( e ).find('td:first').attr('rowspan') ? $(e).find('td:first').text().trim().replace(/\t|\r|\n/g, '').replace(/ +/g, ' ') : null;

            if ( cls && cls.length ) {
                ptr = result[ cls ] = {};
            }

            var th = $(e).find('td:eq(' + (cls && cls.length && '1' || '0') + ')').text().trim().replace(/\t|\r|\n/g, '').replace(/ +/g, ' '),
                td = [];

                $(e).find('td:gt(' + (cls && cls.length && '1' || '0') + ')').each(function(i, e) {
                    var colspan = parseInt( $(e).attr( 'colspan' ) );

                    if ( colspan ) {
                        for ( var n = i; n < colspan+i; n++ ) {
                            td.push( $(e).text().trim() );
                        }
                        return;
                    }
                    td.push( $(e).text().trim() );
                });

            if ( th.length ) ptr[ th ] = td;
        });

        if ( Array.isArray( result['Комплектация (наименование)'] ) ) {
            var cols = result['Комплектация (наименование)'],
                r = {};

            for ( var i in result ) {
                for ( var m in result[ i ] ) {
                    cols.map(function( e, n ) {
                        if ( ! r[ e ] ) r[ e ] = {};
                        if ( ! r[ e ][ m ] ) r[ e ][ m ] = {};

                        r[ e ][ m ] = result[ i ][ m ][ n ];
                    })
                }
            }
        }

        self.result.data = {};
        self.result.data[ name ] = r;

        self.Done();
    }
};

exports[ 'honda.co.ru' ] = {
    index           :   function( self, $, body ) { // http://www.honda.co.ru/
        $('.topsubnav a').each(function(i,e) {
//            console.log('OKKK');
            self.Queue.push({
                uri     :   $(e).attr('href') + 'technical-information/',
                rule    :   'tech'
            });
            self.Queue.push({
                uri     :   $(e).attr('href') + 'components-and-prices/',
                rule    :   'price'
            });
        });
        console.log('OKKK!!!');
        self.Done();
    },
    tech            :   function( self, $, body ) { // http://www.honda.co.ru/cars/civic_5d/technical-information/
        var name = $("h1:first").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result, cols = [];
        $('table.tech tr').each(function( i, e ) {
            if ( $(e).find('td:first h3').length && !$(e).find('td:first h3').text().trim().length && !cols.length ) {
                cols = $(e).find('td:not(:first)').get().map(function(e) {return $(e).text().trim()});
                return;
            }
            if ( $(e).find( 'td:first h3:not(:empty)').length ) {
                ptr = result[ $(e).find( 'td:first h3:not(:empty)').text().trim() ] = {}
                return;
            }
            var th = $(e).find('td:first').text().trim(),
                td = $(e).find('td:not(:first)').get().map(function(e) {return $(e).text().trim()});

            ptr[ th ] = td;
        });

        self.result.tech = {}
        var tech = self.result.tech[ name ] = {};

        for ( var z in result ) {
            for( var x in result[ z ] ) {
                for ( var i in result[ z ][ x ] ) {
                    if ( cols.length ) {
                        if ( !tech[ cols[ i ] ] ) tech[ cols[ i ] ] = {};
                        if ( !tech[ cols[ i ] ][ z ] ) tech[ cols[ i ] ][ z ] = {};
                        if ( !tech[ cols[ i ] ][ z ][ x ] ) tech[ cols[ i ] ][ z ][ x ] = {};

                        tech[ cols[ i ] ][ z ][ x ] = result[ z ][ x ][ i ];
                    } else {
                        if ( !tech[ z ] ) tech[ z ] = {};
                        tech[ z ][ x ] = result[ z ][ x ][ i ];
                    }
                }
            }
        }

        self.Done();
    },
    price           :   function( self, $, body ) { // http://www.honda.co.ru/cars/civic_5d/components-and-prices/
        var name = $("h1:first").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result, cols = [];
        $('table.tech tr').each(function( i, e ) {
            if ( $(e).find('th:first').length && !$(e).find('th:first').text().trim().length && !cols.length ) {
                cols = $(e).find('th:not(:first)').get().map(function(e) {return $(e).text().trim()});
                return;
            }
            if ( $(e).find( 'td:first h3:not(:empty)').length ) {
                ptr = result[ $(e).find( 'td:first h3:not(:empty)').text().trim() ] = {}
                return;
            }
            var th = $(e).find('td:first').text().trim(),
                td = $(e).find('td:not(:first)').get().map(function(e) {
                    return $(e).hasClass('plus') || $(e).hasClass('minus')
                        ? $(e).hasClass('plus')
                        : $(e).text().trim()
                });

            ptr[ th ] = td;
        });
        self.result.price = {}
        var tech = self.result.price[ name ] = {};

        for ( var z in result ) {
            for( var i in result[ z ] ) {
                if ( cols.length ) {
                    if ( !tech[ cols[ i ] ] ) tech[ cols[ i ] ] = {};
                    if ( !tech[ cols[ i ] ][ z ] ) tech[ cols[ i ] ][ z ] = {};

                    tech[ cols[ i ] ][ z ] = result[ z ][ i ];
                } else {
                    if ( !tech[ z ] ) tech[ z ] = {};
                    tech[ z ] = result[ z ][ i ];
                }
            }
        }

        self.Done();
    }
};

exports[ 'jeep-russia.ru' ] = {
    index           :   function( self, $, body ) { // http://www.jeep-russia.ru/lineup.html
        $('li[class^="Product"] a').each(function(i, e) {
            // http://www.jeep-russia.ru/wrangler/specs/index.html
            // http://www.jeep-russia.ru/wrangler/specs/exterior.html
            // http://www.jeep-russia.ru/wrangler/specs/standart.html
            self.Queue.push({
                uri     :   $(e).attr('href').replace(/\/index\.html/, '/specs/index.html'),
                rule    :   'dynamic'
            });
            self.Queue.push({
                uri     :   $(e).attr('href').replace(/\/index\.html/, '/specs/exterior.html'),
                rule    :   'exterior'
            });
            self.Queue.push({
                uri     :   $(e).attr('href').replace(/\/index\.html/, '/specs/standart.html'),
                rule    :   'standart'
            });
        });

        self.Done();
    },
    parser          :   function( $, Result ) {
        var result = {},
            cols = $("#specs_row_holder h3").get().map(function(e) {return $(e).text().trim();}),
            ptr = result, endptr = result;

        $('div[id^="row"].specs_toggle_feature, div[id^="row"].specs_row').each(function(i, e) {
            if ( $(e).hasClass('specs_toggle_feature') ) {
                ptr = endptr = result[ $(e).find('a').text().trim() ] = {};
                return;
            }
            $(e).find('ul').each(function(i, e) {
                if ( $(e).find('li:first b').length ) {
                    ptr = endptr[ $(e).find('li:first b').text().trim() ] = {};
                    return;
                }
                var key = $(e).find('li:first').text().trim(),
                    value = $(e).find('li:not(:first)').get().map(function(e) {return $(e).text().trim()});

                ptr[ key ] = value;
            });
        });

        for( var z in result ) {
            for ( var x in result[ z ] ) {
                if ( Array.isArray( result[ z ][ x ] ) ) {
                    for ( var i in result[ z ][ x ] ) {
                        if ( !Result[ cols[ i ] ] ) Result[ cols[ i ] ] = {};
                        if ( !Result[ cols[ i ] ][ z ] ) Result[ cols[ i ] ][ z ] = {};
                        Result[ cols[ i ] ][ z ][ x ] = result[ z ][ x ][ i ];
                    }
                } else {
                    for ( var c in result[ z ][ x ] ) {
                        for ( var i in result[ z ][ x ][ c ] ) {
                            if ( !Result[ cols[ i ] ] ) Result[ cols[ i ] ] = {};
                            if ( !Result[ cols[ i ] ][ z ] ) Result[ cols[ i ] ][ z ] = {};
                            if ( !Result[ cols[ i ] ][ z ][ x ] ) Result[ cols[ i ] ][ z ][ x ] = {};
                            Result[ cols[ i ] ][ z ][ x ][ c ] = result[ z ][ x ][ c ][ i ];
                        }
                    }
                }
            }
        }
    },
    dynamic         :   function( self, $, body ) { // http://www.jeep-russia.ru/wrangler/specs/index.html
        self.result.dynamic = {};
        var name = $('#vehicle_name').text().trim().replace(/\n|\t|\r/g, ''),
            v = self.result.dynamic[ name ] = {};
        this.parser( $, v );
        self.Done();
    },
    exterior         :   function( self, $, body ) { // http://www.jeep-russia.ru/wrangler/specs/index.html
        self.result.exterior = {};
        var name = $('#vehicle_name').text().trim().replace(/\n|\t|\r/g, ''),
            v = self.result.exterior[ name ] = {};
        this.parser( $, v );
        self.Done();
    },
    standart         :   function( self, $, body ) { // http://www.jeep-russia.ru/wrangler/specs/index.html
        self.result.standart = {};
        var name = $('#vehicle_name').text().trim().replace(/\n|\t|\r/g, ''),
            v = self.result.standart[ name ] = {};
        this.parser( $, v );
        self.Done();
    }
};

exports[ 'kia.ru' ] = {
    index           :   function( self, $, body ) { // http://www.kia.ru/
        $("div.inf table tr:not(:first) td").each(function(i, e) {
            if ( !$(e).find('a:first').attr('href') ) return;

            self.Queue.push({
                uri     :   $(e).find('a:first').attr('href') + 'options/',
                rule    :   'options'
            });
            self.Queue.push({
                uri     :   $(e).find('a:first').attr('href') + 'properties/',
                rule    :   'properties'
            });
        });
        self.Done();
    },
    parser          :   function( $, Result ) {
        var ptr = result = {}, cols = [];
        $('table.propsTable tr').each(function(i, e) {
            if ( $(e).hasClass('c3') ) {
                ptr = result[ $(e).text().trim() ] = {}
                return;
            }

            var key = $(e).find('td:first').text().trim().replace( /\n|\r/, '').replace( /\t|\ +/, ' '),
                value = [];
            $(e).find('td:not(:first)').each(function(i, e) {
                var text = $(e).text().trim();

                if ( !text.length ) {
                    text = $(e).find('img').attr('src') == '/bitrix/templates/.default/images/kia/tab_icon_yes.gif';
                }

                var colspan = parseInt( $(e).attr('colspan') );
                if ( colspan ) {
                    for ( var n = i; n < colspan + i; n++ ) {
                        value.push( text );
                    }
                }
                value.push( text );
            });

            ptr[ key ] = value;
        });
        Tools.resultToObject( result, cols, Result );
    },
    options         :   function( self, $, body ) { // http://www.kia.ru/models/optima/options/
        self.result.options = {};
        var name = $('ul.breadcrumb-navigation a:last').text().trim() + ' - ' + self.referer,
            options = self.result.options[ name ] = {};

        this.parser( $, options );

        self.Done();
    },
    properties      :   function( self, $, body ) { // http://www.kia.ru/models/optima/options/
        self.result.properties = {};
        var name = $('ul.breadcrumb-navigation a:last').text().trim() + ' - ' + self.referer,
            properties = self.result.properties[ name ] = {};

        this.parser( $, properties );

        self.Done();
    }
};

exports[ 'lada-auto.ru' ] = {
    index           :   function( self, $, body ) { // http://www.lada-auto.ru/cgi-bin/models.pl
        if ( self.referer != 'http://www.lada-auto.ru/cgi-bin/models_special.pl' ) {
            self.Queue.push({
                uri     :   'http://www.lada-auto.ru/cgi-bin/models_special.pl',
                rule    :   'index'
            });
        }
        $('td.medium-w2:eq(1) a[href^="/cgi-bin/models"]').each(function(i, e) {
            var modelId = /.+model_id=(\d+).+/.exec( $(e).attr('href') );
            if ( modelId && modelId[ 1 ] ) modelId = modelId[ 1 ];
            else return;

            self.Queue.push({
                uri     :   '/cgi-bin/print.pl?model_id=' +modelId+ '&branch=tth',
                rule    :   'tth'
            });
            self.Queue.push({
                uri     :   '/cgi-bin/print.pl?model_id=' +modelId+ '&branch=isp',
                rule    :   'isp'
            });
            self.Queue.push({
                uri     :   '/cgi-bin/car_line.pl?modelid=' +modelId,
                rule    :   'line'
            });
        });
        self.Done();
    },
    parser          :   function( $, Result ) {
        var result = {}, ptr = result,
            table = $('td[align=left][valign=top]:last table:last'),
            teh = $(table).find('tr:first td:first').hasClass('medium2'),
            cols = $(table).find('tr:eq(' +(!teh+0)+ ') td:gt(' +(teh+0)+ ')').get().map(function(e) {return $(e).text().trim()});

        $(table).find('tr:gt(' + (!teh + 0) + ')').each(function(i, e) {
//            console.inspect( $(e).find('td:first').text().trim(), $(e).find('td:first').attr('class') )
            if ( $(e).find('td:first').hasClass( 'medium' ) && !$(e).find('td:gt(0)').text().trim().length ) {
                var n = $(e).find('td:first').text().trim();
                if ( n ) ptr = result[ n ] = {};
                return;
            }
            var key = $(e).find('td:first').text().trim(),
                value = [];
            $(e).find('td:gt(' +(teh+0)+ ')').each(function(i, e) {
                var text = $(e).text().trim();
//                console.inspect( text );
                if ( !text.length ) {
                    text = $(e).find('img').attr('src') == '/new!/images/ladapoint5.gif';
                }

                var colspan = parseInt( $(e).attr('colspan') );
                if ( colspan ) {
                    for ( var n = i; n < colspan + i; n++ ) {
                        value.push( text );
                    }
                }
                value.push( text );
            });

            ptr[ key ] = value;
        });
        Tools.resultToObject( result, cols, Result );
    },
    tth             :   function( self, $, body ) { // http://www.lada-auto.ru/cgi-bin/print.pl?model_id=6404734&branch=tth
        self.result.tth = {};
        var name = $('.xbig:first').text().trim() + ' - ' + self.referer,
            result = self.result.tth[ name ] = {};

        this.parser( $, result );

        self.Done();
    },
    isp             :   function( self, $, body ) { // http://www.lada-auto.ru/cgi-bin/print.pl?model_id=6404734&branch=tth
        self.result.isp = {};
        var name = $('.xbig:first').text().trim() + ' - ' + self.referer,
            result = self.result.isp[ name ] = {};

        this.parser( $, result );

        self.Done();
    },
    line            :   function( self, $, body ) { // http://www.lada-auto.ru/cgi-bin/car_line.pl?modelid=6404734
        $('form table tr:first table a[href^="/cgi-bin/print.pl"]').each(function(i, e) {
            var href = $(e).attr('href');
            if ( /tth_one/.test( href ) ) {
                self.Queue.push({
                    uri     :   href,
                    rule    :   'tth'
                });
            }
            if ( /isp_one/.test( href ) ) {
                self.Queue.push({
                    uri     :   href,
                    rule    :   'isp'
                });
            }
        });
        self.Done();
    }
};

exports['lifan-car.ru'] = {
    index           :   function( self, $, body ) { // http://lifan-car.ru/Automobiles.asp
        $('div.menu li').has('a[title="Автомобили"]').find('a[title="Комплектации и цены"]').each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'price'
            });
        });
        $('div.menu li').has('a[title="Автомобили"]').find('a[title="Технические характеристики"]').each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'tech'
            });
        });
        self.Done();
    },
    price           :   function( self, $, body ) { // http://lifan-car.ru/LF320/configuration-price.asp
        var name = $($("#breadcrumbs a:not(:last)").get().reverse()[0]).text().trim(),
            result = {}, ptr = result,
            cols = $(".spec2 tr:first td:gt(0)").get().map(function(e) {return $(e).text().trim()});

        $(".spec2 tr").each(function(i, e) {
            if ( $(e).find('td:first').attr('colspan') ) {
                ptr = result[ $(e).find('td:first').text().trim() ] = {};
                return;
            }
            var th = $(e).find('td:first').text().trim(),
                td = $(e).find('td:gt(0)').get().map(function(e){return $(e).text().trim()});

            ptr[ th ] = td;
        });
//        console.inspect( cols );
        self.result.price = {};
        self.result.price[ name + ' - ' + self.referer ] = Tools.resultToObject( result, [] );
        self.Done();
    },
    tech            :   function( self, $, body ) {
        var name = $($("#breadcrumbs a:not(:last)").get().reverse()[0]).text().trim(),
            result = {}, ptr = result,
            cols = $(".spec2 tr:first td:gt(0)").get().map(function(e) {return $(e).text().trim()});

        $('table[class^="spec"] tr').each(function(i, e) {
            if ( $(e).find('th:first, td:first').attr('colspan') ) {
                ptr = result[ $(e).find('th:first, td:first').text().trim() ] = {};
                return;
            }

            var th = $(e).find('th:eq(0),td:eq(0)').text().trim().replace(/\r|\n|  +/g, ''),
                td = [],
                selector = $(e).find('td');

            if ( !$(e).find('th').length ) {
                selector = $(e).find('td:gt(0)');
            }
            selector.each(function(i, e){
                var colspan = parseInt( $(e).attr('colspan')),
                    value = $(e).text().trim();
                if ( colspan ) {
                    for ( var n = i; n < colspan + i; n++ ) {
                        td.push( value );
                    }
                }
                td.push( value );
            });
            ptr[ th ] = td;
        });

        self.result.tech = {};
        self.result.tech[ name + ' - ' + self.referer ] = Tools.resultToObject( result, [] );
        self.Done();
    }
};
exports['lotuscars.ru'] = {
    index           :   function( self, $, body ) { // http://lotuscars.ru/models
        $("li.collapsed a").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'getModels'
            });
        });
        self.Done();
    },
    getModels       :   function( self, $, body ) { // http://lotuscars.ru/models/lotus-elise
        $("li.expanded.active ul.menu a").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'specs'
            });
        });

        self.Done();
    },
    specs           :   function( self, $, body ) { // http://lotuscars.ru/models/evora-ips
        var name = $("div.copy h2").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result.specs = {};

        $("table.specs tr").each(function( i, e ) {
            var cls = $(e).find( 'th:first[colspan]').length;
            if ( cls ) {
                ptr = result.specs[ $(e).find('th:first').text().trim() ] = {};
                return;
            }

            var th = $(e).find('th:first').text().trim(),
                td = $(e).find('td').text().trim();

            ptr[ th ] = td;
        });
        ptr = result.sc = {};
        $("#tabSC").find('b, ul').each(function(i, e) {
            if ( $(e).is('b') ) {
                ptr =  result.sc[ $(e).text().trim() ] = [];
                return;
            }

            $(e).find('li').get().map(function(e) {Array.isArray(ptr) && ptr.push($(e).text().trim());});
            Array.isArray(ptr) && ptr.sort();
        });

        self.result.specs = {};
        self.result.specs[ name ] = result;

        self.Done();
    }
};
exports['maybach-manufaktur.ru'] = {
    index           :   function( self, $, body ) { // http://www.maybach-manufaktur.ru/
        $('#sub10002 a[href*="tech_data"]').each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'tech'
            });
        });
        self.Done();
    },
    tech            :   function( self, $, body ) { // http://www.maybach-manufaktur.ru/cars/maybach_57s_62s/tech_data/
        var name = $(".title1").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result;

        $("td.text1 >table table tr").each(function(i, e) {
            if ($(e).find('b').length) {
                ptr = result[ $(e).text().trim() ] = {};
                return;
            }

            var th = $(e).find('td:first').text().trim(),
                td = $(e).find('td:last').text().trim();

            ptr[ th ] = td;
        });

        self.result.tech = {};
        self.result.tech[ name ] = result;
        self.Done();
    }
};

exports['mazda.ru'] = {
    index           :   function( self, $, body ) { // http://www.mazda.ru/showroom/
        $('#js_showroomThumbList a[href*="showroom"]').each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href').replace(/overview\//, '') + 'specs/',
                rule    :   'tech'
            });
        });

        self.Done();
    },
    tech            :   function( self, $, body ) { // http://www.mazda.ru/showroom/mazda6/specs/
        var name = $("h1").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result,
            cols = [];
        function parseTable( $, ptr, i ) {
            i = i || 0;
            cols = $('table.specs:eq('+i+') tr:eq(0) th').get().map(function(e){return $(e).text().trim()});
            $('table.specs:eq('+i+') tr:gt(0)').each(function(i, e) {
                var pptr = ptr[ 'row-' + i ] = {};
                $(e).find('td').each(function(i, e) {
                    pptr[ cols[ i ] ] = $(e).text().trim();
                });
            });
        }
        if ( $("h3").length ) {
            $("h3").each(function(i, e) {
                ptr = result[ $(e).text().trim() ] = {};

                parseTable( $, ptr, i );
            });
        } else {
            parseTable( $, ptr, 0 );
        }

        self.result.tech = {};
        self.result.tech[ name ] = result;
        self.Done();
    }
};

exports[ 'mercedes-benz.ru' ] = {
    index           :   function( self, $, body ) {
        var result = {}, ptr = result;
        $("list[name='tabsys'] item").each(function(i, e) {
            ptr = result[ $(e).find('titles').text().trim() ] = {};

            $(e).find('subparsys >datasection[name="productentry2"]').each(function(i, e) {
                var href = $(e).find('reference').attr('href');
                ptr[ $(e).find('data[name="modelname"]').text().trim() ] = $(e).find('data[name="price"]').text().trim() + $(e).find('data[name="currency"]').text().trim();

                self.Queue.push({
                    uri     :   href.replace(/\.html/, '/facts/technical_data.html'),
                    rule    :   'tech'
                })
            });
        });

        self.result = result;
        self.Done();
    }
};

exports['mitsubishi-motors.ru'] = {
    index           :   function( self, $, body ) { // http://www.mitsubishi-motors.ru/auto/catalogue/
        $(".thumbnails a").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href') + 'equipment/',
                rule    :   'equipment'
            });
            self.Queue.push({
                uri     :   $(e).attr('href') + 'specifications/',
                rule    :   'specifications'
            });
        });

        self.Done();
    },
    equipment       :   function( self, $, body ) {
        var name = $("h1").text().trim() + ' - ' + self.referer,
            result = {}, ptr = result;

        $("#tableAll tr").each(function(i, e) {
            if ( $(e).find('td[style="background-color:#fff8d1;"]') ) {
                ptr = result[ $(e).find('td[style="background-color:#fff8d1;"]').text().trim() ] = {};
                return;
            }
            var th = $(e).find("td, th").eq(0).text().trim(),
                td = [];
            console.inspect( th );
            $(e).find("td, th").gt(0).each(function(i, e) {
                var colspan = parseInt($(e).attr('colspan'));
                if ( colspan ) {
                    for( var n = i; n < colspan + i; n++ ) {
                        td.push($(e).text().trim() );
                    }
                }
            });
            ptr[ th ] = td;
        });

        console.inspect( result );
        self.result.equipment = {};
        self.result.equipment[ name ] = Tools.resultToObject( result, [] );

        self.Done();
    }
};

exports['auto.yandex.ru'] = {
    index           :   function( self, $, body ) { // http://auto.yandex.ru/
        var fav = self.result.marksFav = [];
        $(".marks-fav a").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'getPopular'
            });
            fav.push($(e).text().trim());
        });
        fav.sort();
        self.Done();
    },
    getPopular      :   function( self, $, body ) { // http://auto.yandex.ru/models.xml?mark=DAEWOO
        self.result.popular = {};
        var name = $("h1").find("span").remove().end().text();
            popular = self.result.popular[name] = [];
        $(".marks.popular a:not([onclick])").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'getRelated'
            })
            popular.push($(e).text().trim());
        });

        popular.sort();
        self.Done()
    },
    getRelated      :   function( self, $, body ) { // http://auto.yandex.ru/search.xml?mark=DAEWOO&model=LANOS&state=NEW&state=USED&price_from=&price_to=&currency=USD&year_from=&year_to=&engine_type=&color=&km_age_to=&displacement_from=&displacement_to=&climate=&airbag=
        self.result.related = {};
        var uri = url.parse( self.referer, true );
        var name = uri.query.mark + ' - ' + uri.query.model,
            related = self.result.related[ name ] = [];
        $(".related a").each(function(i, e) {
            related.push( $(e).text().trim() );
        });

        self.Done();
    },
    _Callback       :   function( result ) {
        fs.writeFileSync('./auto.yandex.ru', JSON.stringify( result ), 'utf-8');
        console.log('done')
        process.exit();
    }
};

exports['porsche.com'] = {
    index           :   function( self, $, body ) { // http://www.porsche.com/russia/models/
        $(".innerContent a").each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href'),
                rule    :   'getModels'
            });
        });

        self.Done();
    },
    getModels       :   function( self, $, body ) { // http://www.porsche.com/russia/models/911/
        $('ul#navigation-sub a:not([href^="javascript"])').each(function(i, e) {
            self.Queue.push({
                uri     :   $(e).attr('href') + 'featuresandspecs/',
                rule    :   'getSpecs'
            });
        });

        self.Done();
    },
    getSpecs        :   function( self, $, body ) { // http://www.porsche.com/russia/models/911/911-carrera-gts/featuresandspecs/
        var name = ' - ' + self.referer,
            params = {}, ptr = params, cols = [];

        $('.MRfeatures')
    }
};


exports['pdf-giant.com'] = {
    index           :   function( self, $, body) { // http://pdf-giant.com/
    
    }
};

// var script = document.createElement('script');script.async=true;script.src='http://realtrm.com/shared/js/jquery-1.3.2.min.js';document.body.appendChild(script);
