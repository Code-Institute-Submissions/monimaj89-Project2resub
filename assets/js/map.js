let map, places;
let infoWindow;
let markers = [];
let autocomplete;
let placeType;

const MARKER_PATH =
  "https://developers.google.com/maps/documentation/javascript/images/marker_green";

  function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
      center: {
        lat: 51.509865,
        lng: -0.118092
      },
      zoom: 13,
      mapTypeControl: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false,
    });
    infoWindow = new google.maps.InfoWindow({
      content: document.getElementById("info-content"),
    });
  
    // Create the autocomplete object and associate it with the UI input control.
  
    autocomplete = new google.maps.places.Autocomplete(
      document.getElementById("searchBox"), {
        types: ["(cities)"],
      });
    places = new google.maps.places.PlacesService(map);
    autocomplete.addListener("place_changed", onPlaceChanged);
  }
  
  function onPlaceChanged() {
    const place = autocomplete.getPlace();
  
    if (place.geometry && place.geometry.location) {
      map.panTo(place.geometry.location);
      map.setZoom(15);
      selectedType = 'lodging';
      search();
    } else {
      document.getElementById("searchBox");
    }
  }

  // Search for hotels, restaurant and attractions in the selected city, within the viewport of the map.

function search() {
    let placeTypeNew;
    placeTypeNew = "";
    let search;
  
    const multiType = placeType.includes(",");
    if (multiType) {
      placeTypeNew = placeType.split(',');
      search = {
        bounds: map.getBounds(),
        types: placeTypeNew,
      };
    } else {
      search = {
        bounds: map.getBounds(),
        types: [placeType]
      };
    }

  places.nearbySearch(search, (results, status,) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      clearResults();
      clearMarkers();

      // Create a marker for each place found, and
      // assign a letter of the alphabetic to each marker icon.

      for (let i = 0; i < results.length; i++) {
        const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
        const markerIcon = MARKER_PATH + markerLetter + ".png";

        // Use marker animation to drop the icons incrementally on the map.

        markers[i] = new google.maps.Marker({
          position: results[i].geometry.location,
          animation: google.maps.Animation.DROP,
          icon: markerIcon,
        });
        // If the user clicks a hotel marker, show the details of that hotel
        // in an info window.
        // @ts-ignore TODO refactor to avoid storing on marker

        markers[i].placeResult = results[i];
        google.maps.event.addListener(markers[i], "click", showInfoWindow);
        setTimeout(dropMarker(i), i * 100);
        addResult(results[i], i);
      }
    }
  });
}
