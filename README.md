# Neighborhood map

We developped a responsive web application that uses the google maps api in order to display on a map markers for major museums in Paris. In addition to the map, there are two panels. The left panel allows to see the list of museums that are referenced and filter through them by name using an input field. The second panel that is on the right allows to display information about the museum that is available on Wikipedia.

## Getting Started

This app can be launched directly by opening the neighborhood_map.html file in a browser. It can also be run on localhost using python by opening the terminal to the main folder and running the following line of code: " python -m SimpleHTTPServer 8080". Now the app can be accessed using the following url: "http://localhost:8080/neighborhood_map.html".
You can click on markers to open an infowindow with a google streetView. For further info about the museum one click the info button that is on the top-right to open the wikipedia panel which displays the most accurate link to wikipedia as well and a little summary of that article. In case there are more possible links, the "others" section is displayed showing other possible links to other wikipedia article. On the left panel, one can filter through the museums using the input field.

### Prerequisites

In order to run this web application you need:
* Internet connection to enable the use of the CDNs of bootstrap and jquery. It also allows to retrieve data from the wikipedia api
* keep the knockout-3.4.2.js file in the js folder
* a google maps key while making sure that google streetView is activated on the google console


### How to run the app

The application is using html, css and javascript. We use JS to define a callback function called initMap that will be used by the google maps api to show markers and display an infowindow for each marker with a streetView panorama. The listView follows an MVVM pattern that uses knockout. It allows to set bindings and avoid having to refresh the page while filtering through the elements in the list. The input field's content is represented by an observable that is tracked by knockout and is using into a 'computed observable' that checks constantly for the list elements that contain part of the input and displays those on the DOM. On the html we set the bindings using 'data-bind'.
The wikipedia data is retrieved using an ajax request. Since making a normal json request to the wikipedia API will result in a cross-site request error, we need to find a way around it. One possible way is to use JSONP. That allows to wrap the request inside a function that we pass throught the jQuery .ajax method. The json data we get in return is then parsed and displayed to the app users.

### Attributions

We use the following third party APIs:
* Google maps and google streetView api
* Wikipedia API

## Specifications

### Interface Design
The app was designed to be responsive and to be usable across desktops, tablets and mobile. We used the bootstrap framework and defined width and height in percentage terms for it to adapt to the viewport. We also used @media to set thresholds for the dimensions of some buttons and font sizes to adapt to the viewport and insure usability on all platforms.

### App functionality
There is a filter that allows to filter through list view elements and markers. Clicking on a list element displays unique information about the location both in an infowindow and the info pannel. It also makes the marker bounce. Using the knockout framework we made sure that the list functionality is responsive and runs error free.

### Asynchronous Data Usage
Application utilizes the Google Maps API and the wikipedia API.
All data requests are retrieved in an asynchronous manner.
Data requests that fail are handled gracefully using common fallback techniques. We set a timeout to display error messages for the wikipedia API and for the google streetView request we check if the status of the response we get back from the server is OK using an if statement. If not, we display an error.

### Location Details Functionality
Additional Location Data is provided in the infowindow and in the info pannel using the wikipedia API.
