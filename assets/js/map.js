let map, places;
let infoWindow;
let markers = [];
let autocomplete;
let placeType;

const MARKER_PATH =
  "https://developers.google.com/maps/documentation/javascript/images/marker_green";
  const hostnameRegexp = new RegExp("^https?://.+?/");

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
      placeType = 'lodging';
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
  
    const multiType = placeType?.includes(",");
    if (multiType) {
      placeTypeNew = placeType.split(",");
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
  
  
    places.nearbySearch(search, (results, status) => {
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
  
          // If the user clicks a place marker, show the details of that place
          // in an info window.
          // @ts-ignore TODO refactor to avoid storing on marker
  
          markers[i].placeResult = results[i];
          google.maps.event.addListener(markers[i], "click", showInfoWindow);
          setTimeout(dropMarker(i), i * 200);
          addResult(results[i], i);
        }
      }
    });
  }

function dropMarker(i) {
    return function () {
      markers[i].setMap(map);
    };
  }

// Radio buttons search function

function setSearchFor(placeSearchType) {
  placeType = "";
  placeType = placeSearchType;
  search();
}

//  Show search result in the table

function addResult(result, i) {
  const results = document.getElementById("results");
  const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
  const markerIcon = MARKER_PATH + markerLetter + ".png";
  const tr = document.createElement("tr");

  tr.style.backgroundColor = i % 2 === 0 ? "#F0F0F0" : "#FFFFFF";
  tr.onclick = function () {
    google.maps.event.trigger(markers[i], "click");
  };

  const iconTd = document.createElement("td");
  const nameTd = document.createElement("td");
  const ratingTd = document.createElement("td");
  const icon = document.createElement("img");

  icon.src = markerIcon;
  icon.setAttribute("class", "placeIcon");
  icon.setAttribute("className", "placeIcon");

  const name = document.createTextNode(result.name);

  //  Show rating stars on the searched places

  let ratingHtml = "";
  let ratingNew = "";
  let ratingNum = parseFloat(result.rating);
  const blackstar = "\u2605";
  const whitestar = "\u2606";
  if (ratingNum) {
    for (let i = 0; i < 5; i++) {
      ratingHtml +=  ratingNum < (i + 0.5) ? whitestar : blackstar;
      ratingNew = document.createTextNode(ratingHtml);
    }
  } else {
    ratingHtml += whitestar + whitestar + whitestar + whitestar + whitestar;
    ratingNew = document.createTextNode(ratingHtml);
  }

  iconTd.appendChild(icon);
  nameTd.appendChild(name);
  ratingTd.appendChild(ratingNew);
  tr.appendChild(iconTd);
  tr.appendChild(nameTd);
  tr.appendChild(ratingTd);
  results.appendChild(tr);
}

// Get the place details showed in an info window anchored on the marker.

function showInfoWindow() {
  // @ts-ignore
  const marker = this;

  places.getDetails({
      placeId: marker.placeResult.place_id
    },
    (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return;
      }

      infoWindow.open(map, marker);
      buildIWContent(place);
    }
  );
}


function buildIWContent(place) {
  document.getElementById("iw-icon").innerHTML =
    '<img class="hotelIcon" ' + 'src="' + place.icon + '"/>';
  document.getElementById("iw-url").innerHTML =
    '<b><a href="' + place.url + '">' + place.name + "</a></b>";
  document.getElementById("iw-address").textContent = place.vicinity;
  if (place.formatted_phone_number) {
    document.getElementById("iw-phone-row").style.display = "";
    document.getElementById("iw-phone").textContent =
      place.formatted_phone_number;
  } else {
    document.getElementById("iw-phone-row").style.display = "none";
  }


  // The regexp isolates the first part of the URL (domain plus subdomain)
  // to give a short URL for displaying in the info window.

  if (place.website) {
    let fullUrl = place.website;
    let website = String(hostnameRegexp.exec(place.website));

    if (!website) {
      website = "http://" + place.website + "/";
      fullUrl = website;
    }

    document.getElementById("iw-website-row").style.display = "";
    document.getElementById("iw-website").textContent = website;
  } else {
    document.getElementById("iw-website-row").style.display = "none";
  }
}


function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }

  markers = [];
}

function clearResults() {
  const results = document.getElementById("results");

  while (results.childNodes[0]) {
    results.removeChild(results.childNodes[0]);
  }
}

window.initMap = initMap;


// Clear all search results



function wipeOut() {
  document.getElementById("searchBox").value = "";
  let clearAll = document.getElementsByName("searchFor");
  for(let i = 0; i < clearAll.length; i++) {
    clearAll[i].checked = false;
  }
  clearResults();
  clearMarkers(); 
}


// Hide the paragraph above search bar on mobile devices.

const searchIcon = document.querySelector(".search-icon");
const text = document.querySelector(".text");

searchIcon.addEventListener("click", function () {
  if (window.innerWidth <= 767) {
    text.classList.add("hide-text");
  }
});