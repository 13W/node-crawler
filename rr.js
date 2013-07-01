var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    mkdirp = require('mkdirp');

exports['pdf-giant.com'] = {
    index           :   function( self, $) { // http://pdf-giant.com/
        $("div.mybox").each(function(i, e) {
            self.Queue.push({
                uri : $(e).find('h1>a').attr('href'),
                rule: 'parse'
            });
        });
/*
        $("div.navigation a:contains('Next')").each(function(i, e) {
            self.Queue.push({
                uri : $(e).attr('href'),
                rule: 'index'
            });
        });
*/
        self.Done();
    },
    parse           :   function(self, $) { // http://pdf-giant.com/money/27524-belarus-may-2013.html
//        console.log(self);
        var result = self.result,
            ctx = $('#dle-content'),
            h1 = ctx.find('h1').html(),
            img = ctx.find('img').attr('src'),
            links = ctx.find('div>a[rel="nofollow"]').map(function(i, e) {return $(e).attr('href')}),
            speedlink = $("#dle-speedbar").text(),
            category = $("#dle-speedbar a:last-child").text(),
            props = $('div[id*="news-id"]>div').text().split(' | '),
            text = $('div[id*="news-id"]'),
            imgDir = path.join(process.cwd(), 'downloads' , path.dirname(url.parse(img || '').pathname)),
            imgPath = path.resolve(imgDir, path.basename(img));
//        text.find('div').remove();
        text = text.text();
        result[h1] = {
            name: h1,
            url: self.referer,
            image: img,
            links: links,
            speedlink: speedlink,
            category: category,
            description: text,
            props: {
                type: props[1],
                pages: props[2],
                size: props[3]
            }
        };
        mkdirp.sync(imgDir);
        if (img && !fs.existsSync(imgPath))
            self.Queue.push({
                uri: url.resolve(self.referer, img),
                require: 'binary',
                filename: imgPath
            });
        self.Done();
    },
    _callback       :   function(result) {
        require('fs').writeFileSync('./pdf-giant.json', JSON.stringify(result, null, 2, true));
        console.inspect(arguments);
    }
};

exports['stg2.ssi-cloud.com'] = {
    index   :   function(self, $, body) {
        self.Queue.push({
            uri :   '/login',
            requestOptions: {
                method: 'POST',
                form: {
                    userid: 'bruce.lewis@ibm.com',
                    username: 'bruce.lewis@ibm.com',
                    password: 'passwordone'
                }
            },
            rule: 'collect'
        });
        self.Done();
    },
    collect        :   function(self, $, body) {
        self.Queue.push({
            uri: '/rest/api/ibm/core.teams',
            rule: 'getTeams',
            require: 'json'
        });
        self.Done();
    },
    getTeams        :   function(self, $, body) {
        self.result.teams = body && body.data && body.data['core.team'];
        self.Done();
    },
    _callback       :   function(result) {
        console.inspect(result);
    }
};
