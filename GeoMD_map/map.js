
////////////////////////////////////////////////
///////////////////VARIABLES////////////////////
////////////////////////////////////////////////

var view = [37.8, -96];
var dataView = "bottomleft";
var legendView = 'bottomright';
var title = "US Population Density";
var units = 'people per m<sup>2<sup>';

//view values in js object
//statesData.features.forEach((x,y) => console.log(x.properties.density));

//extract values to array
var values = []
statesData.features.forEach((x,y) => {
		values.push(x.properties.density);
    }
  )
  
//sort values
values = [...values].sort((a, b) => a - b);

function percentRank(array, n) {
    var L = 0;
    var S = 0;
    var N = array.length

    for (var i = 0; i < array.length; i++) {
        if (array[i] < n) {
            L += 1
        } else if (array[i] === n) {
            S += 1
        } else {

        }
    }

    var pct = (L + (0.5 * S)) / N
    return pct
}

var asPer = []
values.forEach((x, y) => asPer.push(percentRank(values, x)));

//function to remove outliers from arrary
function filterOutliers(someArray) {  

    // Copy the values, rather than operating on references to existing values
    var vals = someArray.concat();
    /* Then find a generous IQR. This is generous because if (values.length / 4) 
     * is not an int, then really you should average the two elements on either 
     * side to find q1.
     */     
    var q1 = vals[Math.floor((vals.length / 4))];
    // Likewise for q3. 
    var q3 = vals[Math.ceil((vals.length * (3 / 4)))];
    var iqr = q3 - q1;
    
    // Then find min and max values
    var maxValue = q3 + iqr*1.5;
    var minValue = q1 - iqr*1.5;

    // Then filter anything beyond or beneath these values.
    var filteredValues = vals.filter(function(x) {
        return (x <= maxValue) && (x >= minValue);
    });

    // Then return
    return filteredValues;
}

function percentile(arr, p) {
    if (arr.length === 0) return 0;
    if (typeof p !== 'number') throw new TypeError('p must be a number');
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = (arr.length - 1) * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
}

function median(arr) {
  const half = Math.floor(values.length / 2);
  return (values.length % 2
    ? values[half]
    : (values[half - 1] + values[half]) / 2
  );
}

med = median(values);

//get array with outliers removed
newValues = filterOutliers(values);

//function to find standard deviation
function getStandardDeviation (array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}


minv = Math.floor(Math.min(...values));
maxv = Math.ceil(Math.max(...values));


pallets = {
	'Sunset': [
'#FFEDA0',
'#FED976',
'#FEB24C',
'#FD8D3C',
'#FC4E2A',
'#E31A1C',
'#BD0026',
'#900026',
'#400055',
'#000066',
],
'Brights': [
'#fffa61',
'#ffcd24',
'#ffa227',
'#ff7736',
'#ef4c45',
'#d41f51',
'#b0005b',
'#850060',
'#54005f',
'#110057'
],
'Spring': [
'#f2ff61',
'#a6ec6b',
'#56d57b',
'#00bb8b',
'#00a094',
'#008394',
'#006689',
'#004a75',
'#002f58',
'#001638',
],
'Sky': [
'#70f5ff',
'#22dffa',
'#00c9f7',
'#00b2f3',
'#009bee',
'#0083e6',
'#006ad9',
'#0050c8',
'#0032b1',
'#2f0094',
]};

//let brackets = [b0, b1, b2, b3, b4, b5, b6, b7, b8]
var colorsDefault = pallets.Spring
const cats = 9;
var range = [...Array(cats).keys()];

colors = colorsDefault.filter((element, index) => {
  	return index % Math.floor(colorsDefault.length/cats) === 0;
	})
  
function getDivisions() {
	var interval;
  var range;
  var brackets;
	if (document.getElementById('divisions')!=null) {
  	interval = Number(document.getElementById('divisions').value)
  } 
  else {
  	interval = cats
  }
  var colors;
	colors = colorsDefault.filter((element, index) => {
  	return index % Math.floor(colorsDefault.length/interval) === 0;
	})
  intPer = []
  brackets = []
  range = [...Array(interval).keys()];
  range.forEach((x, y) => {
    i = 1/interval*y;
    per = percentile(values, i);
    intPer.push(per)
  });

  intPer.push(maxv);
  intPer.forEach((x, y) => {
    if (typeof intPer[y+1]==="number") {
      v = intPer[y+1] - intPer[y];
    }
    else{
      v = intPer[y]
    }
    var figs;
    if (Math.round(med) > 2) {
      if ((Math.round(v).toString().length <= Math.round(x).toString().length)||(y==0)) {
        figs = Math.round(v).toString().length - 1;
      }
      else {
        figs = Math.round(x).toString().length - 1;
      }
    }
    else {
      var figs = per.toString().search(/[1-9]/);
    }
    per = Math.round(x/(10**figs))*(10**figs);
    brackets.push(per);
  })
  return [brackets, colors]
}
brackets = getDivisions()[0]
colors = getDivisions()[1]

console.log(colors,brackets)

////////////////////////////////////////////////
////////////////MAP//DISPLAY////////////////////
////////////////////////////////////////////////

const map = L.map('map').setView(view, 3);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// control that shows state info on hover
const info = L.control({position: dataView});

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (props) {
  const contents = props ? `<b>${props.name}</b><br />${props.density} people / mi<sup>2</sup>` : units;
  this._div.innerHTML = `<h4>${title}</h4>${contents}`;
};

info.addTo(map);


// get color depending on population density value

function getColor(d, b, c) {
    
    return d <= b[1]  ? c[0] :
           (b[1] < d && d <= b[2])  ? c[1] :
           (b[2] < d && d <= b[3])  ? c[2] :
           (b[3] < d && d <= b[4])   ? c[3] :
           (b[4] < d && d <= b[5])   ? c[4] :
           (b[5] < d && d <= b[6])   ? c[5] :
           (b[6] < d && d <= b[7])   ? c[6] :
           (b[7] < d && d <= b[8])	 ?	c[7] :
           (b[8] < d && d <= b[9])	 ?	c[8] : c[9];
}

function getClass(d, b) {
	for (i=0; i < b.length; i++) {
    	if (b[i+1] < b[i]) {
      	b[i] = b[i+1]
      }
      if (b[i] > b[i+1]) {
      	b[i+1] = b[i]
      }
    }
	return 	d <= b[1]  ? "feat "+0 :
           b[1] < d && d <= b[2] ? "feat "+1 :
           b[2] < d && d <= b[3] ? "feat "+2 :
           b[3] < d && d <= b[4] ? "feat "+3 :
           b[4] < d && d <= b[5] ? "feat "+4 :
           b[5] < d && d <= b[6] ? "feat "+5 :
           b[6] < d && d <= b[7] ? "feat "+6 :
           b[7] < d && d <= b[8] ? "feat "+7 :
           b[8] < d && d <= b[9] ? "feat "+8 :
           												"feat "+9;
}


function style(feature) {
  return {
    weight: 0.5,
    opacity: 0.5,
    color: 'black',
    dashArray: '4',
    fillOpacity: 0.6,
    className: getClass(feature.properties.density, brackets),
    fillColor: getColor(feature.properties.density, brackets, colors),
  };
}


function highlightFeature(e) {
  const layer = e.target;

  layer.setStyle({
  	opacity: 1,
    weight: 3,
    color: 'white',
    dashArray: '',
    fillOpacity: 1
  });

  layer.bringToFront();
  info.update(layer.feature.properties);

}

/* global statesData */
let geojson = L.geoJson(statesData, {
  style,
  onEachFeature
}).addTo(map); 

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');

////////////////////////////////////////////////
///////////////////SLIDER///////////////////////
////////////////////////////////////////////////


const palletSelector = L.control({position:'topright'})

palletSelector.onAdd = function(map) {
	  const div = L.DomUtil.create('div', 'info selector');
		div.innerHTML =       
    `<span class='pallet'>Pallet:</span>
    <select id='pallet' class='pallet' onclick=getPallet()>
        <option value="Spring">Spring</option>
        <option value="Sunset">Sunset</option>
        <option value="Brights">Brights</option>       
        <option value="Sky">Sky</option>
      </select>
    <span class='pallet'>Divisions:</span>
    <select id='divisions' class='pallet' onclick=getDivisions() onChange=addLegend()>
        <option value=2>2</option>
        <option value=3>3</option>
        <option value=4>4</option>     
        <option value=5>5</option>     
        <option value=6>6</option>     
        <option value=7>7</option>     
        <option value=8>8</option>     
        <option value=9 selected>9</option>     
        <option value=10>10</option>     
    </select>`;
    return div
};

palletSelector.addTo(map);

function addLegend() {
  let legend = L.control({position: legendView});
  legend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'info legend');
    let divisions = brackets.slice(0,cats);
    let labels = [];

    let from, to;
    for (let i = 0; i < divisions.length; i++) {
      from = brackets[i];
      to = brackets[i + 1];
      labels.push(`<div class="wrapper">
        <input type="color" id="color${i}" class="legend" value="${colors[i]}" onmouseover=selectHighlight(${i}) onmouseleave=deselectAll()>      
      </div>`);
     labels.push(`<div class="slide" onmousedown=mapFreeze() onmouseleave=mapMove()>
     <section id=${i} class="range-slider">
          <span id="start${i}">${from} &ndash;</span>
          <span id="end${i}">${to}</span>
        </section>
        <div>`);
    }
    div.innerHTML = labels.join('<br>');
    return div;
  };
  legend.addTo(map);
  delete map.legend;

}

addLegend()

function mapFreeze() {
 map.dragging.disable();
}

function mapMove() {
	map.dragging.enable();
}


function getPallet () {
	var e = document.getElementById("pallet");
	var value = e.value;
	var text = e.options[e.selectedIndex].text;
  colors = pallets[text];
  colors.forEach((x, y) => {
  	el = document.getElementById("color"+y)
    el.value = colors[y];
    geojson.setStyle(style);
  });
  geojson.setStyle(style);
}


//change color to input value in color list//
function setColors (i,el) {
  colors[i]=el.value;
  geojson.setStyle(style);
}


//add event listeners to legend and color input//

function colorChange (i){
  let el = document.getElementById("color"+i);
  el.addEventListener("input", event => {
      setColors(i,el);
      geojson.setStyle(style);
    });
}

  
var len = (Array.from({length: cats}, (x, i) => i));
len.forEach(colorChange);


function selectHighlight(x) {
	feats = document.getElementsByClassName('feat');
  for (i=0; i<feats.length; i++) {
  	feats[i].classList.add("dim")
  }
  el = document.getElementsByClassName(x);
  for (i=0; i<el.length; i++) {
  	el[i].classList.remove("dim");
    el[i].classList.add("highlight");
  }
}

function deselectAll() {
	feats = document.getElementsByClassName('feat');
  for (i=0; i<feats.length; i++) {
  	feats[i].classList.remove("dim");
    feats[i].classList.remove("highlight");
  }
}
