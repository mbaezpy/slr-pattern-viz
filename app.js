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
    list.push(obj)
  }, 
  (obj) => {
    console.log("error")
  }, 
  (obj) => {
    res.json(list)
  })
  
})

app.use('/static', express.static('public'))

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Storygram server listening at http://localhost:' + port);