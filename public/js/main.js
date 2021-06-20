var state = false;
var state_delete = false

// #################### Building the map ###########################################################################################################
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94LXJhbmRvbS11c2VyIiwiYSI6ImNrbjM3aXN0ZDFib3IycHF1OG9rYTc4NGUifQ.vNQ1toe6tDdtvJcfrERbQw';

const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [28.830532, 47.023076],
	maxBounds: [
		[26.544212, 45.447345],
		[30.456659, 48.536586]
	],
	zoom: 9
});

map.loadImage('../images/icons/home-icon-silhouette.png', function (error, image) {
	if (error) throw error;
	map.addImage('home-icon', image);
});

map.loadImage('../images/icons/flag-simple.png', function (error, image) {
	if (error) throw error;
	map.addImage('flag-icon', image);
});

//################################# Adding zoom box ################################################################################################
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

//################################# Retrieve Markers from database ##################################################################################
let apartments;
async function getApartments() {
	const res = await fetch('/api/v1/apartments');
	const data = await res.json();

	apartments = data.data.map(apartment => {
		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [
					apartment.location.coordinates[0],
					apartment.location.coordinates[1]
				]
			},
			properties: {
				pointID: apartment.apartmentID,
				apartmentAddress: apartment.location.formattedAddress,
				apartmentPrice: {
					Value: apartment.price.value,
					Currency: apartment.price.currency
				},

				icon: 'home-icon'
			}
		};
	});

	loadMap(apartments);

	addMarkers(apartments, 'points');
}

// ############## Load map with all apartments ###########################################################################################
function loadMap(apartments) {
	map.on('load', function () {
		map.addLayer({
			id: 'points',
			type: 'symbol',
			source: 'points',
			layout: {
				'visibility': 'none',
				'icon-image': '{icon}',
				'icon-size': 1,
				'text-field': '{pointID}',
				'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
				'text-offset': [0, 0.9],
				'text-anchor': 'top'
			},
			source: {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: apartments
				}
			},
		});
	});
	//console.log(apartments)
}

getApartments();

//#################### SHOW APARTMENTS ON THE MAP ####################################################################################################

function addMarkers(apartments, layer_id) {
	/* For each feature in the GeoJSON object above: */
	var i = 0;
	apartments.forEach(function (marker) {

		/* Create a div element for the marker. */
		var el = document.createElement('div');
		/* Assign a unique `id` to the marker. */
		el.id = 'marker-' + i;
		/* Assign the `marker` class to each marker for styling. */
		el.className = 'marker';
		//console.log(el);
		i++;

		/**
		 * Create a marker using the div element
		 * defined above and add it to the map.
		 **/
		var mWidth = 30,
			mHeigh = 30;
		new mapboxgl.Marker(el, {
				offset: [0, 0]
			})
			.setLngLat(marker.geometry.coordinates)
			.addTo(map);


		el.addEventListener('click', function (e) {

			/* Close all other popups and display popup for clicked apartment */

			var visibility = map.getLayoutProperty(
				layer_id,
				'visibility'
			);
			if (visibility == 'visible')
				createPopUp(marker, layer_id);
		});
	});
}

function add_dest_marker(dest, layer_id) {
	var last = dest.length;

	if (last == 0)
		return;
	else {
		var el = document.createElement('div');
		el.id = 'dest-marker-' + last;
		el.className = 'marker';
	}

	new mapboxgl.Marker(el)
		.setLngLat(dest[last - 1].geometry.coordinates)
		.addTo(map);

	el.addEventListener('click', function (e) {
		createPopUp(dest[last - 1], layer_id);
	});
}

// Apartment info popup
function createPopUp(currentFeature, layer_id) {
	var popUps = document.getElementsByClassName('mapboxgl-popup');
	/** Check if there is already a popup on the map and if so, remove it */
	if (popUps[0]) popUps[0].remove();

	if (layer_id === 'points' || layer_id === 'nearest-apartment') {
		var popup = new mapboxgl.Popup({
				closeOnClick: false
			})
			.setLngLat(currentFeature.geometry.coordinates)
			.setHTML('<h5>' + currentFeature.properties.pointID + '</h5>' +
				'<h6>' + currentFeature.properties.apartmentAddress + '</h6>' +
				'<h6>' + currentFeature.properties.apartmentPrice.Value + ' ' + currentFeature.properties.apartmentPrice.Currency + '</h6>')
			.addTo(map);
	} else {
		var popup = new mapboxgl.Popup({
				closeOnClick: false
			})
			.setLngLat(currentFeature.geometry.coordinates)
			.setHTML('<h5>' + currentFeature.properties.pointID + '</h5>' +
				'<h6 id="show_dest_type">Type:' + currentFeature.properties.type + ' </h6>' +
				'<input id="dest_type" type="text" placeholder="Enter type" name="dest_type" required>' +
				'<button id="save_type">Save</button>')
			.addTo(map);

		document.getElementById('save_type').onclick = function () {
			change_type()
		};

		function change_type() {
			let dest_type = document.getElementById('dest_type');
			// Only for destination layer
			if (dest_type.value == currentFeature.properties.type || dest_type.value === "") {
				currentFeature.properties.type = "None";
				document.getElementById("show_dest_type").innerHTML = "Type: None";
			} else {
				currentFeature.properties.type = dest_type.value;
				document.getElementById("show_dest_type").innerHTML = "Type: " + dest_type.value;
			}
		}

	}
}

//changing destiantion type from none to input value


//#################### ADD DESTINATIONS BY CLICK ####################################################################################################
var marker = new mapboxgl.Marker();
var add_dest_btn = document.getElementById("add-destination-btn");
var dests = {
	"type": "FeatureCollection",
	"features": []
}


function add_marker(event) {
	var coords = event.lngLat;
	console.log('Lng:', coords.lng, 'Lat:', coords.lat);
	//marker.setLngLat(coords).addTo(map);

	notify.fire({
		icon: 'success',
		iconHtml: '<div class="dashicons dashicons-yes" style="transform: scale(3);"></div>',
		title: `Destination added. on lng ${coords.lng}; lat ${coords.lat} `,
	})

	add_dest_btn.classList.remove("active");

	dests.features.push({
		type: 'Feature',
		geometry: {
			type: 'Point',
			coordinates: [
				coords.lng,
				coords.lat
			]
		},
		properties: {
			icon: 'flag-icon',
			pointID: dests.features.length,
			type: 'None',
			// apartmentAddress: apartment.location.formattedAddress,

		},
	});

	add_dest_marker(dests.features, 'circles');
	map.getSource('circles').setData(dests);

	//console.log(dests);
	//load_dests(dests);
}

//load destinations on the map
function load_dests(dests) {
	map.on('load', function () {

		map.addSource('circles', {
			'type': 'geojson',
			'data': dests
		});
		map.addLayer({
			id: 'circles',
			type: 'symbol',
			layout: {
				'icon-image': '{icon}',
				'icon-size': 0.5,
				'text-field': '{pointID}',
				'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
				'text-offset': [0, 0.9],
				'text-anchor': 'top'

			},
			source: 'circles'
		});
	});
}


map.on('idle', function () {
	add_dest_btn.onclick = function (e) {
		this.classList.toggle("active");
	}

	if (add_dest_btn.classList.contains("active")) {

		map.on('click', add_marker);

	} else {
		map.off('click', add_marker);
	}

	if (map.getLayer("circles"))
		console.log('Set');
	else
		console.log('None');


});

//#################### SHOW DESTINATIONS ON THE MAP ####################################################################################################
load_dests(dests);

//#################### FIND THE MOST OPTIMAL ROUTE ####################################################################################################


let findMinBtn = document.getElementById('find-min-btn');
let startRoute;

findMinBtn.onclick = function () {

	let nearMarker = document.getElementById('near-marker');
	if (nearMarker != null) document.getElementById('near-marker').remove();

	let mapLayer = map.getLayer('nearest-apartment');
	if (typeof mapLayer !== 'undefined') {
		// Remove map layer & source.
		map.removeLayer('nearest-apartment-circle');
		map.removeLayer('nearest-apartment').removeSource('nearest-apartment');
	}

	let centroidLayer = map.getLayer('centroid');
	if (typeof centroidLayer !== 'undefined') {
		// Remove map layer & source.
		map.removeLayer('centroid').removeSource('centroid');
	}

	let centerOfMass;
	if (dests.features.length > 2) {
		centerOfMass = turf.centroid(dests);
	}
	//console.log(centerOfMass);
	/* Proof centerOfMass is working
	
	let centroidM = new mapboxgl.Marker()
								.setLngLat(centerOfMass.geometry.coordinates)
								.addTo(map);

	*/
	map.addSource('nearest-apartment', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: [

			]
		}
	})

	let fApartments = {
		"type": "FeatureCollection",
		"features": apartments
	}
	let nearestApartment = turf.nearestPoint(centerOfMass, fApartments);
	startRoute = nearestApartment.geometry.coordinates;

	if (nearestApartment != null) {
		map.getSource('nearest-apartment').setData({
			type: 'FeatureCollection',
			features: [
				nearestApartment
			]
		});

		let nApartmentId = nearestApartment.properties.pointID;

		let bestApartmentIndex = apartments.findIndex(function (apartments, index) {
			if (apartments.properties.pointID == nApartmentId)
				return true;
		})

		console.log(bestApartmentIndex);

		map.addLayer({
			id: 'nearest-apartment',
			type: 'symbol',
			source: 'nearest-apartment',
			layout: {
				'visibility': 'visible',
				'icon-image': '{icon}',
				'icon-size': 1,
				'text-field': '{pointID}',
				'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
				'text-offset': [0, 0.9],
				'text-anchor': 'top'
			},
			paint: {
				"icon-color": "#32a83c"
			}
		}, 'points');

		map.addLayer({
			id: 'nearest-apartment-circle',
			type: 'circle',
			source: 'nearest-apartment',
			paint: {
				'circle-radius': 18,
				'circle-color': '#26ab5f'
			}
		}, 'nearest-apartment');


		let el1 = document.createElement('div');
		el1.id = 'near-marker';
		el1.className = 'marker';

		new mapboxgl.Marker(el1)
			.setLngLat(nearestApartment.geometry.coordinates)
			.addTo(map);

		el1.addEventListener('click', function (e) {
			createPopUp(apartments[bestApartmentIndex], 'nearest-apartment');
		});
	}
}

function inputTransport(){

	document.getElementById('choose-transport').style.display="block"; //this is the replace of this line
	let val;
	
	
	document.getElementById('walking').onclick = function(){
		val = 'walking';
		document.getElementById('choose-transport').style.display="none"; 
	};

	document.getElementById('cycling').onclick = function(){
		val = 'cycling';
		document.getElementById('choose-transport').style.display="none"; 
	};

	document.getElementById('driving').onclick = function(){
		val = 'driving';
		document.getElementById('choose-transport').style.display="none"; 
	};

	return val;
}


function getRoute(endRoute) {
	//let transport = inputTransport();
	let start = startRoute;
	let url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + 
	start[0] + ',' + start[1] + ';' + endRoute[0] + ',' + endRoute[1] + 
	'?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

	// make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
	var req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.onload = function() {
		var json = JSON.parse(req.response);
		var data = json.routes[0];
		var route = data.geometry.coordinates;
		var geojson = {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: route
			}
		};
		// if the route already exists on the map, reset it using setData
		if (map.getSource('route')) {
		map.getSource('route').setData(geojson);
		} else { // otherwise, make a new request
		map.addLayer({
			id: 'route',
			type: 'line',
			source: {
			type: 'geojson',
			data: {
				type: 'Feature',
				properties: {},
				geometry: {
				type: 'LineString',
				coordinates: geojson
				}
			}
			},
			layout: {
			'line-join': 'round',
			'line-cap': 'round',
			},
			paint: {
			'line-color': '#3887be',
			'line-width': 5,
			'line-opacity': 0.75
			}
		});
		}
		// add turn instructions here at the end
	};
	req.send();
}


let findRouteBtn = document.getElementById('find-route-btn');
let  canvas = map.getCanvasContainer();
findRouteBtn.onclick = function(){


	let mapLayer = map.getLayer('end');
	if (typeof mapLayer !== 'undefined') {
		// Remove map layer & source.
		map.removeLayer('end').removeSource('end');
	}
	// make an initial directions request that
	// starts and ends at the same location
	if (startRoute != null){
		getRoute(startRoute);
	
		// Add starting point to the map

		// this is where the code from the next step will go
		map.once('click', function(e) {
			let coordsObj = e.lngLat;
			canvas.style.cursor = '';
			let coords = Object.keys(coordsObj).map(function(key) {
				return coordsObj[key];
			});
			let end = {
				type: 'FeatureCollection',
				features: [{
					type: 'Feature',
					properties: {},
					geometry: {
					type: 'Point',
					coordinates: coords
					}
				}]
			};
			if (map.getLayer('end')) {
				map.getSource('end').setData(end);
			} else {
				map.addLayer({
					id: 'end',
					type: 'circle',
					visibility: 'none',
					source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: [{
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'Point',
							coordinates: coords
						}
						}]
					}
					},
					paint: {
					'circle-radius': 10,
					'circle-color': '#f30'
					}
				});
			}
		getRoute(coords);
		map.off('click', this);
		});
		//map.on('click', setEndPoint('click'));

		//map.off('click', setEndPoint('click'));
		
	}
};





//############################################################ SEARCHING BAR ################################################################################
/* Given a query in the form "lng, lat" or "lat, lng"
 * returns the matching geographic coordinate(s)
 * as search results in carmen geojson format,
 * https://github.com/mapbox/carmen/blob/master/carmen-geojson.md */
var coordinatesGeocoder = function (query) {
	// Match anything which looks like
	// decimal degrees coordinate pair.
	var matches = query.match(
		/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
	);
	if (!matches) {
		return null;
	}

	function coordinateFeature(lng, lat) {
		return {
			center: [lng, lat],
			geometry: {
				type: 'Point',
				coordinates: [lng, lat]
			},
			place_name: 'Lat: ' + lat + ' Lng: ' + lng,
			place_type: ['coordinate'],
			properties: {},
			type: 'Feature'
		};
	}

	var coord1 = Number(matches[1]);
	var coord2 = Number(matches[2]);
	var geocodes = [];

	if (coord1 < -90 || coord1 > 90) {
		// must be lng, lat
		geocodes.push(coordinateFeature(coord1, coord2));
	}

	if (coord2 < -90 || coord2 > 90) {
		// must be lat, lng
		geocodes.push(coordinateFeature(coord2, coord1));
	}

	if (geocodes.length === 0) {
		// else could be either lng, lat or lat, lng
		geocodes.push(coordinateFeature(coord1, coord2));
		geocodes.push(coordinateFeature(coord2, coord1));
	}

	return geocodes;
};

// Add the control to the map
map.addControl(
	geocoder = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		countries: 'md',
		localGeocoder: coordinatesGeocoder,
		autocomplete: true,
		language: "en",
		zoom: 13,
		placeholder: 'Search for your place...',
		mapboxgl: mapboxgl,

	})
);
var searchBar = document.querySelector(".searching-bar")
var searchingBtn = document.querySelector(".searching-btn")
var xIcon = document.querySelector(".xIcon")
var menuIcon = document.querySelector(".menuIcon")

//searchingBtn.addEventListener("click", toggleSearch);

function toggleSearch() {
	if (searchBar.classList.contains("showSearchBar")) {
		searchBar.classList.remove("showSearchBar");
		xIcon.style.display = "none";
		menuIcon.style.display = "block";
	} else {
		searchBar.classList.add("showSearchBar");
		xIcon.style.display = "block";
		menuIcon.style.display = "none";
	}
}

//########################################-MAP-Navigation-bar####################################################################################################
document
	.getElementById('listing-group')
	.addEventListener('change', function (e) {
		var handler = e.target.id;
		if (e.target.checked) {
			map[handler].enable();
		} else {
			map[handler].disable();
		}
	});

var menu = document.querySelector(".listing-group")
var ham = document.querySelector(".ham")
var xIcon = document.querySelector(".xIcon")
var menuIcon = document.querySelector(".menuIcon")

ham.addEventListener("click", toggleMenu)

function toggleMenu() {
	if (menu.classList.contains("showMenu")) {
		menu.classList.remove("showMenu");
		xIcon.style.display = "none";
		menuIcon.style.display = "block";
	} else {
		menu.classList.add("showMenu");
		xIcon.style.display = "block";
		menuIcon.style.display = "none";
	}
}

//########################################MAP-LEFT-EDIT-SIDEBAR####################################################################################################
function toggleSidebar(id) {
	var elem = document.getElementById(id);
	var classes = elem.className.split(' ');
	var collapsed = classes.indexOf('collapsed') !== -1;

	var padding = {};

	if (collapsed) {
		// Remove the 'collapsed' class from the class list of the element, this sets it back to the expanded state.
		classes.splice(classes.indexOf('collapsed'), 1);

		padding[id] = 100; // In px, matches the width of the sidebars set in .sidebar CSS class
		map.easeTo({
			padding: padding,
			duration: 1000 // In ms, CSS transition duration property for the sidebar matches this value
		});
	} else {
		padding[id] = 0;
		// Add the 'collapsed' class to the class list of the element
		classes.push('collapsed');

		map.easeTo({
			padding: padding,
			duration: 1000
		});
	}

	// Update the class list on the element
	elem.className = classes.join(' ');
}

//######################################## DRAW-POLYGON ####################################################################################################


var draw = new MapboxDraw({
	/*
	styles: [
	  {
	    'id': 'highlight-active-points',
	    'type': 'circle',
	    'filter': ['all',
	      ['==', '$type', 'Point'],
	      ['==', 'meta', 'feature'],
	      ['==', 'active', 'true']],
	    'paint': {
	      'circle-radius': 7,
	      'circle-color': '#000000'
	    }
	  },
	  {
	    'id': 'points-are-blue',
	    'type': 'circle',
	    'filter': ['all',
	      ['==', '$type', 'Point'],
	      ['==', 'meta', 'feature'],
	      ['==', 'active', 'false']],
	    'paint': {
	      'circle-radius': 5,
	      'circle-color': '#000088'
	    }
	  }
	],
	*/
	container: 'map',
	displayControlsDefault: false,
	controls: {
		polygon: true,
		point: true,
		trash: true,
	},
	//defaultMode: 'draw_polygon'
});


map.on('draw.create', updateArea);
map.on('draw.delete', updateArea);
map.on('draw.update', updateArea);


function updateArea(e) {
	var data = draw.getAll();
	var answer = document.getElementById('calculated-area');
	if (data.features.length > 0) {
		var area = turf.area(data);
		// restrict to area to 2 decimal points
		var rounded_area = Math.round(area * 100) / 100;
	} else {
		answer.innerHTML = '';
		if (e.type !== 'draw.delete')
			alert('Use the draw tools to draw a polygon!');
	}
}
document.getElementById('draw-gl').appendChild(draw.onAdd(map))


// ######################################## Tab moving ####################################################################################################
function openPage(pageName, elmnt, color) {
	// Hide all elements with class="tabcontent" by default */
	var i, tabcontent, tablinks;
	tabcontent = document.getElementsByClassName("menu-content");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	// Remove the background color of all tablinks/buttons
	tablinks = document.getElementsByClassName("button");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].style.backgroundColor = "";
		tablinks[i].style.color = "";
	}


	// Show the specific tab content
	document.getElementById(pageName).style.display = "block";
	elmnt.style.backgroundColor = "rgb(212, 212, 212)";
	elmnt.style.color = "gray";

}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

function changeColor(element) {
	element.style.backgroundColor = "rgb(212, 212, 212)";
	element.style.color = "gray";
}


//######################################## Enables marker input####################################################################################################
function editorButton(element) {
	if (!document.getElementById(element).classList.contains('active'))
		document.getElementById(element).classList.toggle('active');
	else document.getElementById(element).classList.remove('active');
}

//######################################## Toggle layer ####################################################################################################

map.on('idle', function () {
	// If these two layers have been added to the style,
	// add the toggle buttons.
	if (map.getLayer('points')) {
		// Enumerate ids of the layers.
		var toggleableLayerIds = ['points'];
		// Set up the corresponding toggle button for each layer.
		for (var i = 0; i < toggleableLayerIds.length; i++) {
			// Create a link.
			var link = document.getElementById('toggle-apartment-btn');
			//link.className = 'active';
			// Show or hide layer when the toggle is clicked.
			link.onclick = function (e) {
				var clickedLayer = 'points';
				e.preventDefault();
				e.stopPropagation();

				var visibility = map.getLayoutProperty(
					clickedLayer,
					'visibility'
				);

				// Toggle layer visibility by changing the layout object's visibility property.
				if (visibility === 'visible') {
					map.setLayoutProperty(
						clickedLayer,
						'visibility',
						'none'
					);
					this.classList.remove('active');
				} else {
					this.classList.toggle('active');
					map.setLayoutProperty(
						clickedLayer,
						'visibility',
						'visible'
					);
				}
			};
		}
	}
});

//######################################## MODAL #################################################################################################################
const notify = Swal.mixin({
	toast: true,
	position: 'bottom-start',
	showConfirmButton: false,
	timer: 6000,
	willOpen: (toast) => {
		// Offset the toast message based on the admin menu size
		var dir = 'rtl' === document.dir ? 'right' : 'left'
		//toast.parentElement.style[dir] = document.getElementById('adminmenu').offsetWidth + 'px'
	}
})