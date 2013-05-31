require('lo');
exports['pdf-giant.com'] = {
    index           :   function( self, $) { // http://pdf-giant.com/
        $("div.mybox").each(function(i, e) {
            self.Queue.push({
                uri : $(e).find('h1>a').attr('href'),
                rule: 'parse'
            });
        });
        $("div.navigation a:contains('Next')").each(function(i, e) {
            self.Queue.push({
                uri : $(e).attr('href'),
                rule: 'index'
            });
        });
        self.Done();
    },
    parse           :   function(self, $) { // http://pdf-giant.com/money/27524-belarus-may-2013.html
        console.log(self);
        var result = self.result,
            ctx = $('#dle-content'),
            h1 = ctx.find('h1').html(),
            img = ctx.find('img').attr('src'),
            links = ctx.find('div>a[rel="nofollow"]').map(function(i, e) {return $(e).attr('href')});
        result[h1] = {
            uri: self.referer,
            image: img,
            links: links
        };
        self.Done();
    },
    _callback       :   function() {
        require('fs').writeFileSync('./pdf-giant.json', JSON.stringify(arguments));
        console.inspect(arguments);
    }
};
