var express = require('express');
var app = express();

app.get('/', function(req, res){
	res.send('Impro! Getting there!');
});

app.listen(process.env.PORT || 5000);