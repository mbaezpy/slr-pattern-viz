/*
* Quick and dirty code for analysing exclusion patterns collected from the 
* the crowd
* @author: Marcos Baez <baez@disi.unitn.it>
*/

const MIN_PATTERN_LENGTH = 10

// No templating libraries, just plain html patters for this small experiment

const tmpl = "<li class='{gold}'> " +
              " <h5>{title} <i class='fas fa-star-of-life' style='color: #ff922b'></i></h5>" +
              " <div class='row'> "+
              "   <div class='col-md'>" +
              "     <span class='badge badge-primary'>{njuds}</span> judgements in total.  <br> " + 
              "     <span class='badge badge-primary'>{njudsValid}</span> valid judgements.</div>"+
              "   <div class='col-md'>" +
              "     <span class='badge badge-primary'>{nIn}</span> include{nMaybe}  <br> " + 
              "     <span class='badge badge-primary'>{nOut}</span> exclude </div> "+      
              " </div> <p></p> <p data-unit='{dataUnit}'><strong>Abstract</strong>. {abstract} </p>  " +
              "<p><strong>Does the paper describe a study or experiment that inolves technology for online social interaction?</strong> <span class='badge badge-success'>{golden}</span></p>" +
              " <ul data-unit='{dataUnit}' class='reasons'>{reasons}</ul>" +
              " <div style='display:none' class='row patterns-block'> "+
              "   <div class='col-md bg-light'>" +      
              "      <div class='invalids bg-faded'><p class='text-danger'><strong>Invalid patterns</strong></p>" +
              "        <ul data-unit='{dataUnit}' class='invalids'>{invalids}</ul>" +
              "      </div> " +
              "    </div></div> " +
              "<hr>" +
              "</li>"


const tmplReason = "<li data-pcore='{pcore}'><p><span class='badge badge-info'>{in_out_radio}</span> <span class='text-primary'>Reason:</span> {exl_crit}</p></li>"
const tmplPattern = "<li><p><span class='badge'>{in_out_radio}</span>: {pattern}</p></li>"

$(document).ready(function () {
      let searchParams = new URLSearchParams(window.location.search)
      var url = searchParams.get('url')
      if (! url) {
        alert("Specify the url to the CSV file containing the task results (?url=path)")
        return
      }
      $.getJSON("/units?url="+url).done((units) => {
        
        var lastUnit = null;
        var judgments = [];
        
        
        $(units).each((i, obj) => {
          
          if (lastUnit != obj._unit_id){
            UI.render(judgments)
            lastUnit = obj._unit_id
            judgments = []
          }
          
          judgments.push(obj)                      
          
        })
      })
  
  
      // Attach filters to the marks
  
      $("#papers").on("click","li mark.m-start", function(e) {
        var unit = $(e.currentTarget).parent().data("unit")
        var pcore = $(e.currentTarget).data("pcore")
        
        $li = $("ul").filter("[data-unit=" + unit + "]").children()
        
        if(! $(e.currentTarget).hasClass("selected")){  
          $(e.currentTarget).parent().children().filter("mark.m-start").removeClass("selected")                  

          $li.hide()
          $li.filter("[data-pcore=" + pcore + "]").toggle()
          $(e.currentTarget).toggleClass("selected")
        } else {
          $li.show()
          $(e.currentTarget).parent().children().filter("mark.m-start").removeClass("selected")                  
          
        }        
        
      })
  
  
      // Filters for golden data
      $("#opt-show-golden").change(function(e){
        var doShow = $(e.currentTarget).is(":checked")

        if(doShow){
          $("#papers > li").hide()
          $("#papers > li.golden").show()
        } else {
          $("#papers > li").show()
        }
      })  
  
      // Filters for invalid patterns
      $("#opt-show-invalid").change(function(e){
        var doShow = $(e.currentTarget).is(":checked")
        $(".patterns-block").toggle()
      })    
  
  
});

var UI= {
  /* This function orchestrate the rendering the the page */
  render : juds => {
    if (juds.length == 0) return;
    
    var marks = UI.mark(juds)
    
    // We prepare the HTML for the highlighted abstract. We build it by joining each word either wrapped
    // in a "mark" tag (if highlighted) or "span" (if not highlighted)
    var abstract = "";
    $(marks.paint).each((i, obj) => {
      if (obj.mark >0 ){
        
        // we attach some extra metadata to the start, so we can use it to filter the reasons
        if(obj.start){
           abstract += "<mark data-pcore='{pcore}' title='{npatterns}' class='m-start' style='background: linear-gradient(to right, rgba(239, 137, 0, {opacity}) , rgba(239, 239, 0, {opacity}))'> <span class='badge badge-pill badge-dark'>{npatterns}</span> </mark>"
             .replace(/{opacity}/g, obj.mark / marks.valid)
             .replace(/{npatterns}/g, obj.start)
             .replace(/{pcore}/g, i)
        }
        
        abstract += "<mark style='background-color:rgba(239, 239, 0, {opacity})'> {word}</mark>"
                    .replace("{word}", obj.word)
                    .replace("{opacity}", obj.mark / marks.valid)
                    
        // We highlight differently the end of a pattern
        if(obj.end){
           abstract += "<mark class='m-end' style='background: linear-gradient(to right, rgba(239, 239, 0, {opacity}), rgba(239, 137, 0, {opacity}) )'> </mark>".replace(/{opacity}/g, obj.mark / marks.valid)
        }        
        
      } else {
        abstract += "<span> {word}</span>".replace("{word}", obj.word)
      }
    })
    
    var reasons = ""
    var invalids = ""
    
    $(marks.validJuds).each((i, obj) => {
      reasons+= tmplReason.replace("{exl_crit}", obj.jud.excl_crit)
                          .replace("{pcore}", obj.pos)
                          .replace("{in_out_radio}", obj.jud.in_out_radio)
    })
    
    $(marks.invalidJuds).each((i, obj) => {
      invalids+= tmplPattern.replace("{pattern}", obj.jud.reason_pattern)
                          .replace("{in_out_radio}", obj.jud.in_out_radio)
    })    
    
    
    console.log(juds[0]._golden)
    
    var txt = tmpl.replace("{title}", juds[0].title)
                  .replace("{gold}", eval(juds[0]._golden.toLowerCase()) ? "golden" : "")   
                  .replace("{golden}", eval(juds[0]._golden.toLowerCase()) ? "Golden: " + juds[0].in_out_radio_gold.toUpperCase() : "")   
                  .replace("{njuds}", juds.length)
                  .replace(/{dataUnit}/g, juds[0]._unit_id)
                  .replace("{abstract}", abstract)
                  .replace("{reasons}", reasons)
                  .replace("{invalids}", invalids)
                  .replace("{njudsValid}", marks.valid)    
                  .replace("{nIn}", marks.inScope.yes)  
                  .replace("{nOut}", marks.inScope.no)     
                  .replace("{nMaybe}", marks.inScope.maybe? " (+"+marks.inScope.maybe+" maybe)" : "")   
    
    $("#papers").append(txt)    
    
  },
  
  /* Function that analyses the exclusion patterns, and build a basic structure to facilitate 
   * the visualisation of the patterns.*/
  mark : juds => {
    // We break the abstract into words. 
    var words = juds[0].abstract.split(" ")
    
    // For each word in "words" we have some metadata in "paint" that tells us to how many patterns it belongs, 
    // weather it is the start or end word of the pattern. We use this metadata to calculate how much to highlight
    // each word
    var paint = Array(words.length)    
    
    $(paint).each((i, obj) => {
          paint[i] = {
            word : words[i],
            mark : 0,
            start : 0,
            end : 0
          }      
    });
    
    // These are some variables we use to calculate some summaries
    var inScope = { yes : 0, no : 0, maybe : 0 }
    
    var valid = 0
    var validJuds = []
    var invalidJuds = []
    
    $(juds).each((i, obj) => {
      var idx = obj.abstract.indexOf(obj.reason_pattern)
      if (idx < 0 || (obj.reason_pattern.length < MIN_PATTERN_LENGTH)) {
        invalidJuds.push({ jud : obj})
        return
      }
      
      // Where in the words array would the pattern start?
      var iFrom = obj.abstract.substring(0, idx).trim().split(" ").length
      var iTo   = obj.abstract.substring(0, idx + obj.reason_pattern.length).trim().split(" ").length -1
    
      
      for(var i=iFrom; i<=iTo; i++){  
          paint[i].mark++
      } 
      paint[iFrom].start++
      paint[iTo].end++
      
      inScope[obj.in_out_radio]++
      
      validJuds.push({
        pos : iFrom,
        jud : obj
      })
      
      valid++

    })
  
    return {
      paint: paint,
      valid: valid,
      inScope : inScope,
      validJuds : validJuds,
      invalidJuds : invalidJuds
    }
  }
}