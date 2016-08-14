var express = require("express");
var Bing = require('node-bing-api')({ accKey: process.env.BING_ACCOUNT_KEY });
var mongo = require("mongodb").MongoClient;


var app = express();
var port = process.env.PORT || 8080;
var mongoUrl = process.env.MONGOLAB_URI;

app.get('/', function(req, res) {
   res.send('<center><b>image search API</b><br><br> /imagesearch/*query* to search (add ?offset=*nr* to paginate through result)<br> /latest/ for latest search querys</center>');
});

app.get('/imagesearch/:query',function (req,res) {
    var offset = req.query.offset ? req.query.offset*10 : 0;
    Bing.images(req.params.query, {top:10, skip: offset}, function(error, rest, body){
       var summadum = [];
       for(var i=0;i<body.d.results.length;i++) {
           var temp = {};
           temp.title = body.d.results[i].Title;
           temp.url = body.d.results[i].MediaUrl;
           temp.srcUrl = body.d.results[i].SourceUrl;
           temp.thumbnail = body.d.results[i].Thumbnail.MediaUrl;
           summadum.push(temp);
       }
       res.send(summadum);
    });
    mongo.connect(mongoUrl, function(err,db) {
        if(err) throw err;
        var colle = db.collection('imagesearch');
        colle.insert({ "term" : req.params.query, "when" : Date().toString() });
        db.close();
    });
});

app.get('/latest/',function(req, res) {
    mongo.connect(mongoUrl, function(err,db) {
        if(err) throw err;
        var colle = db.collection('imagesearch');
        colle.find({},{_id: 0}).sort({$natural:-1}).limit(10).toArray(function (err, result) {
            if(err) throw err;
            res.send(result);
            db.close();
        });
    });
});


app.listen(port, function() {
    console.log('Listening on port '+port);
});


