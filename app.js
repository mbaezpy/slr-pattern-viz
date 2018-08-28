/*
* Quick and dirty code for analysing exclusion patterns collected from the 
* the crowd
* @author: Marcos Baez <baez@disi.unitn.it>
*/

const express = require('express')
const app = express();

const request = require('request');

const csv = require('csvtojson')

app.get('/units', (req, res) => {
  var url = req.query.url;
  var list = [];
  csv()
  .fromStream(request.get(url))
  .subscribe((obj) => {

    if (req.query.pattern_separator == "json") {
      var items = JSON.parse(obj.reason_pattern)
      var patterns = []
      for (var i= 0; i < items.length; i++){
        patterns.push(items[i][1])
      }
      obj.reason_pattern = patterns
    } else {
      obj.reason_pattern = obj.reason_pattern.split(req.query.pattern_separator) 
    }

    list.push(obj)
  }, 
  (obj) => {
    console.log("error : " + obj)
  }, 
  (obj) => {
    res.json(list)
  })
  
})

app.use('/static', express.static('public'))

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Pattern highlight server listening at http://localhost:' + port);