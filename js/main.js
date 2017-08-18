// We create a map variable.
var map;

// We create an infowindow global variable.
var museumInfoWindow;

// We create a placeholder for all the locations we will be representing on the map.
var markers = ko.observableArray([]);

// We create the callback function for that will be used by the google maps api.
function initMap(){
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 48.8331, lng: 2.3264},
		zoom: 14,
		mapTypeControl: false,
		styles : [
			{
				"featureType": "administrative",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "poi",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "road",
				"elementType": "labels.icon",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "transit",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			}
		]
	});

	// We create an infoWindow that we store in the global variable museumInfoWindow.
	museumInfoWindow = new google.maps.InfoWindow();

	// The bounds variable will be used later to reajust the boundaries of the map for them to englobe all the markers.
	var bounds = new google.maps.LatLngBounds();

	// This is the data relative to the museums that we will displaying
	// on the map.
	var museums = [
		{name: 'Musée de Cluny', location: {lat: 48.850483, lng: 2.344081}, website: 'http://www.musee-moyenage.fr/'},
		{name: 'Louvre', location: {lat: 48.860611, lng: 2.337644}, website: 'http://www.louvre.fr/en/homepage'},
		{name: 'Musée d\'Orsay', location: {lat: 48.859961, lng: 2.326561}, website: 'http://www.musee-orsay.fr/en'},
		{name: 'Centre Georges Pompidou', location: {lat: 48.860642, lng: 2.352245}, website: 'https://www.centrepompidou.fr/en'},
		{name: 'Musée du quai Branly', location: {lat: 48.860889, lng: 2.297894}, website: 'http://www.quaibranly.fr/en/'},
	];

	// We loop through all the museums stores in the variable museum and create marker elements that we store in the global variable "markers".
	for (var i = 0; i < museums.length; i++){
		var position = museums[i].location;
		var title = museums[i].name;
		var url = museums[i].website;
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: title,
			animation: google.maps.Animation.DROP,
			id: 'item' + i,
			url: url,
		});
		markers.push(marker);

		// We add an event listener to populate an infoWindow when we click on a marker.
		marker.addListener('click', function(){
			populateInfoWindowAndWiki(this, museumInfoWindow);
		})

		// We extend the boundaries of the map for it to include each marker we created.
		bounds.extend(markers()[i].position);
	}

	// We make the boundaries of the map include all the markers we looped through.
	map.fitBounds(bounds);
}


// This function populates infowindows and generates the content of the wikipedia info panel for a given marker.
function populateInfoWindowAndWiki(marker, infowindow){

	// We check if the marker does not already have its infowindow open.
	if (infowindow.marker != marker){

		// We initialize the content of the infoWindow.
		infowindow.setContent('');
		infowindow.marker = marker;

		// We add an event listener to close the infowindow when we click the close button.
		infowindow.addListener('closeclick', function(){
			infowindow.setMarker = null;
			infowindow.marker = null;
		})

		// This variable will allow to find the closest streetView image given a position and a radius
		var streetViewService = new google.maps.StreetViewService();
		// We set a radius that we will use to find the closest streetView image in case the exact position we provide does not have a streetView image.
		var radius = 50;

		// This function will be used by the streetViewService variable to get the panormic view. It sets the heading and the pitch for the streetView.
		function getStreetView(data, status){
			// Check if a street view was found.
			if (status == google.maps.StreetViewStatus.OK){
				var nearStreetViewLocation =  data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, marker.position);
				infowindow.setContent('<div>' + marker.title +
					'</div> <div id="pano"></div> <br> <a href="' +
					marker.url + '" target="_blank"> Website </a>');
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
						heading: heading,
						pitch: 30
					}
				};
				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
			}else {
				// In case the server does not find an image show an error message.
				infowindow.setContent('<div>' + marker.title + '</div>' +
					'<div>No Street View Found</div>');
			}
		}
		// Retrieve the panorama for that position within the radius we set. The panorama is rendered in the div that has an id of "pano".
		streetViewService.getPanoramaByLocation(marker.position, radius,
			getStreetView);
		// Make the map recenter on the marker.
		map.setCenter(marker.position);
		// Open the infowindow.
		infowindow.open(map, marker);
		// Run the wikiSidebar function on the marker to generate the content of the pannel.
		wikiSidebar(marker);
	}
}


// Generate the content related to a given marker in the wikipedia info pannel.
function wikiSidebar(marker){
	// initialize the content of the pannel.
	$('#linksWiki').html("");
	// Rhe url that will be used for the ajax request.
	var wikiUrl = 'http://en.wikipedia.org/w/api.php?'+
		'action=opensearch&search='+ marker.title + '&format=json&callback=wikiCallack'

	// We set a timeout after which a failure message will appear. This timeout will be cleared if we get an answer from the server within the time we set.
	var wikiRequestTimeout = setTimeout(function(){
		$('#linksWiki').text("Failed to get wikipedia resources");
	},8000);

	$.ajax({
		url: wikiUrl,
		dataType: "jsonp",
		success: function(response){
			var articleList = response[1];
			var summary = response[2];

			articleStr = articleList[0];
			summaryStr = summary[0];
			var url = 'http://en.wikipedia.org/wiki/' + articleStr;
			$('#linksWiki').html('<li><a href="' + url + '" target="_blank">' + articleStr + '</a><br><div>' + summaryStr + '</div></li>');
			if (articleList.length>1){
				$('#linksWiki').append('<br><br><h5>Other</h5>');
				for (var i=1; i<articleList.length; i++){
					link = 'http://en.wikipedia.org/wiki/' + articleList[i];
					$('#linksWiki').append('<li><a href="' + link +'" target="_blank">' + articleList[i] + '</a></li>');
				};
			};
			clearTimeout(wikiRequestTimeout);
		}
	})
}

// A view model that will allow to display a list of the museums and filter through them by name.
function ListViewModel(){

	var self = this;
	// This variable represents the marker that will be selected by clicking its corresponding list element.
	self.selectedMuseum = ko.observable(null);
	// This function will keep track of the markers to show, the elements of the list to display and
	self.showMarker = function(museumMarker){
		// Get the input from user
		self.selectedMuseum(museumMarker);
		// Since this function will be run on click we make it populate the infoWindow and the wiki pannel.
		populateInfoWindowAndWiki(museumMarker, museumInfoWindow);
		// We add animation to the corresponding marker.
		museumMarker.setAnimation(google.maps.Animation.BOUNCE);
		// We stop the animation after a certain time.
		setTimeout(function()
			{museumMarker.setAnimation(null); }, 3000);
	};
	// This variable represents what the user types into the input to filter results.
	self.searched = ko.observable("");
	// A ko.computed variable that will be adjusting to the user input.
	self.markersToShow = ko.computed(function(){
		// Empty list to store the markers to display
		var mToShow = [];
		// We loop through the markers and add them to the list only if they contain part of the input.
		for (i = 0; i < markers().length; i++){
			// We close any infoWindow that might still be displayed.
			museumInfoWindow.close();
			if (markers()[i].title.toLowerCase().indexOf(
				self.searched().toLowerCase()) >= 0){
				mToShow.push(markers()[i]);
				// We keep only the markers that are passing the filter diplayed.
				markers()[i].setVisible(true);
			} else {
				// Any marker that does not pass the filter is hidden.
				markers()[i].setVisible(false);
			};
		}
		return mToShow;
	})
}

// We make sure to apply the bindings using knockout that will keep track of any changes in the ListViewModel and apply effectively any needed changes.
ko.applyBindings(new ListViewModel());

// We create event listeners to handle the interaction with the list pannel and the wikipedia pannel
var menu = document.querySelector('#menu');
var main = document.querySelector('main');
var listView = document.querySelector('#listView');
var wikiBtn = document.querySelector('#wikiBtn');
var wikiView = document.querySelector('#wikiView');
var closeWiki = document.querySelector('#closeWiki');
var closeList = document.querySelector('#closeList');

menu.addEventListener('click', function(e) {
	wikiView.classList.remove('open');
	listView.classList.toggle('open');
	e.stopPropagation();
})
main.addEventListener('click', function() {
	listView.classList.remove('open');
})

wikiBtn.addEventListener('click', function(e) {
	listView.classList.remove('open');
	wikiView.classList.toggle('open');
	e.stopPropagation();
})
main.addEventListener('click', function() {
	wikiView.classList.remove('open');
});
closeWiki.addEventListener('click', function() {
	wikiView.classList.remove('open');
})
closeList.addEventListener('click', function() {
	listView.classList.remove('open');
})