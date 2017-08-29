// We create a map variable.
var map;

// We create an infowindow global variable.
var museumInfoWindow;

// We create a placeholder for all the locations we will be representing
// on the map.
var markers = ko.observableArray([]);


var selectedMarker = ko.observable();
// We create the callback function for that will be used by the google
// maps api.
function initMap(){
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 48.8331, lng: 2.3264},
		zoom: 14,
		mapTypeControl: false,
		styles : map_style,
	});

	// We create an infoWindow that we store in the global variable
	// museumInfoWindow.
	museumInfoWindow = new google.maps.InfoWindow();

	// The bounds variable will be used later to reajust the boundaries
	// of the map for them to englobe all the markers.
	var bounds = new google.maps.LatLngBounds();

	// We loop through all the museums stores in the variable museum and
	// create marker elements that we store in the global variable "markers".
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

		// We add an event listener to populate an infoWindow when we click
		// on a marker.
		google.maps.event.addListener(marker, "click", openInfoWindowOnClick);

		// We extend the boundaries of the map for it to include each
		// marker we created.
		bounds.extend(markers()[i].position);
	}

	// We make the boundaries of the map include all the markers we looped
	// through.
	map.fitBounds(bounds);

	// We make the boundaries of the map include all the markers as user
	// resizes the screen.
	google.maps.event.addDomListener(window, 'resize', function() {
		map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
	});
}


// This function populates infowindows and generates the content of the
// wikipedia info panel for a given marker.
function populateInfoWindowAndWiki(marker, infowindow){
	// This function will be used by the streetViewService (line172)
	// to get the panoramic view. It sets the heading and the pitch for
	// the streetView. It also sets the content of the infowindow.
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
			// In case the server does not find an image show an
			// error message.
			infowindow.setContent('<div>' + marker.title + '</div>' +
				'<div>No Street View Found</div>');
		}
	}
	// We check if the marker does not already have its infowindow open.
	if (infowindow.marker != marker){

		// We initialize the content of the infoWindow.
		infowindow.setContent('');
		infowindow.marker = marker;

		// We add an event listener to close the infowindow when we click
		// the close button.
		infowindow.addListener('closeclick', function(){
			infowindow.setMarker = null;
			infowindow.marker = null;
		});

		// This variable will allow to find the closest streetView image
		// given a position and a radius
		var streetViewService = new google.maps.StreetViewService();
		// We set a radius that we will use to find the closest streetView
		// image in case the exact position we provide does not have a
		// streetView image.
		var radius = 50;


		// Retrieve the panorama for that position within the radius we set.
		// The panorama is rendered in the div that has an id of "pano".
		streetViewService.getPanoramaByLocation(marker.position, radius,
			getStreetView);
		// Make the map recenter on the marker.
		map.setCenter(marker.position);
		// We add animation to the corresponding marker.
		marker.setAnimation(google.maps.Animation.BOUNCE);
		// We stop the animation after a certain time.
		setTimeout(function()
			{marker.setAnimation(null); }, 3000);
		// Open the infowindow.
		infowindow.open(map, marker);
		// Run the wikiSidebar function on the marker to generate the
		// content of the pannel.
		selectedMarker(marker);
	}
}

// We make the populateInfoWindowAndWiki function take no argument. This will
// facilitate the use of the function in the initMap function.
function openInfoWindowOnClick() {
	populateInfoWindowAndWiki(this, museumInfoWindow);
}

// Generate the content related to a given marker in the wikipedia info
// pannel.

// A view model that will allow to display a list of the museums and filter
// through them by name.
function ListViewModel(){

	var self = this;
	// This variable represents the marker that will be selected by
	// clicking its corresponding list element.
	self.selectedMuseum = ko.observable(null);
	// This function will keep track of the markers to show, the elements
	// of the list to display and
	self.showMarker = function(museumMarker){
		// Get the input from user
		self.selectedMuseum(museumMarker);
		// Since this function will be run on click we make it populate
		// the infoWindow and the wiki pannel.
		populateInfoWindowAndWiki(museumMarker, museumInfoWindow);
	};
	// This variable represents what the user types into the input to
	// filter results.
	self.searched = ko.observable("");
	// A ko.computed variable that will be adjusting to the user input.
	self.markersToShow = ko.computed(function(){
		// Empty list to store the markers to display
		var mToShow = [];
		// We loop through the markers and add them to the list only if
		// they contain part of the input.
		for (i = 0; i < markers().length; i++){
			// We close any infoWindow that might still be displayed.
			museumInfoWindow.close();
			if (markers()[i].title.toLowerCase().indexOf(
				self.searched().toLowerCase()) >= 0){
				mToShow.push(markers()[i]);
				// We keep only the markers that are passing the filter
				// diplayed.
				markers()[i].setVisible(true);
			} else {
				// Any marker that does not pass the filter is hidden.
				markers()[i].setVisible(false);
			}
		}
		return mToShow;
	});

	// We store the appropriate html
	self.generateWikihtml =  ko.computed(function(){
		if (selectedMarker() != null) {
			contentStr = "";
			var wikiUrl = 'http://en.wikipedia.org/w/api.php?'+
				'action=opensearch&search='+ selectedMarker.title +
				'&format=json&callback=wikiCallack';
			$.ajax({
				url: wikiUrl,
				dataType: "jsonp",
				async: false
			}).done(function(response){
				var articleList = response[1];
				var summary = response[2];

				articleStr = articleList[0];
				summaryStr = summary[0];
				var url = 'http://en.wikipedia.org/wiki/' + articleStr;
				contentStr = contentStr + "<li><a href=\"" + url +
					"\" target=\"_blank\">" + articleStr + "</a><br><div>" +
					summaryStr + "</div></li>";
				if (articleList.length>1){
					contentStr = contentStr + "<br><br><h5>Other</h5>";
					for (var i=1; i<articleList.length; i++){
						link = "http://en.wikipedia.org/wiki/" + articleList[i];
						contentStr = contentStr + '<li><a href="' +
						link +"\" target=\"_blank\">" + articleList[i] + "</a></li>";
					}
				}
				return contentStr;
			}).fail(function(){
				contentStr = "Failed to get wikipedia resources";
				return contentStr;
			})
		}else {
			return "Please select a marker";
		}
	});

	self.visibleListView = ko.observable(false);
	self.visibleWikiView = ko.observable(false);

	self.toggle_listView = function(){
		self.visibleWikiView(false);
		self.visibleListView(!self.visibleListView());
	}
	self.toggle_wikiView = function(){
		self.visibleListView(false);
		self.visibleWikiView(!self.visibleWikiView());
	}
	self.close_all_pannels = function(){
		self.visibleListView(false);
		self.visibleWikiView(false);
	}
}

// We make sure to apply the bindings using knockout that will keep track of
// any changes in the ListViewModel and apply effectively any needed changes.
ko.applyBindings(new ListViewModel());
