/*
 *  Sarah Krueger
 *  Last updated: May 6, 2016
 */

// content vars
var panorama;
var map;
var routeMarker;
var searchBox;

// route vars
var start;
var end;
var routeCoordinates = [];
var routeHeadings = [];
var speedMarkers = [];
var heading;
var pitch = 1;

// UI var defaults
var baseSpeed = 600;
var speed = baseSpeed;
var rampedSpeed = false;
var isPaused = false;


function initialize() {
  $('input[type=radio][name=speed]').change(function() {
    if (this.value === 'ramp') {
      speed = baseSpeed;
      rampedSpeed = true;
    } else {
      speed = 300 * this.value;
      rampedSpeed = false;
    }
  });
  startBox = new google.maps.places.Autocomplete($('#input-from').get(0), {
    types: ['geocode']
  });
  endBox = new google.maps.places.Autocomplete($('#input-to').get(0), {
    types: ['geocode']
  });
}

function geocode () {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( {'address': $('#input-from').get(0).value}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      var source = results[0].geometry.location;
      start = {lat: source.lat(), lng: source.lng()};
      geocoder.geocode( {'address': $('#input-to').get(0).value}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var dest = results[0].geometry.location;
          end = {lat: dest.lat(), lng: dest.lng()};

          start = {lat:34.0410805, lng:-118.8915323};
          end = {lat: 34.021144, lng:-118.8289902};
          // successfully got start and end: populate UI
          $('#input-from').prop('disabled',true);
          $('#input-to').prop('disabled',true);
          $('#enter').css('display', 'none');
          $('#left-panel').css('height', '500px');
          $('#controls').css('display', 'block');
          $('#right-panel').css('display', 'block');
          load();
        } else {
          alert("Geocode was not successful for the following reason: " + status);
        }
      });
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}

function load () {
  // calculate initial heading
  heading = calculateHeading(start, end);

  // load street view
  panorama = new google.maps.StreetViewPanorama(
    $('#street-view').get(0), {
      position: start,
      pov: {
        heading: heading, 
        pitch: pitch
      },
      zoom: 1,
      panControl: false,
      linksControl: false
    });

  // load map view
  map = new google.maps.Map(
    $('#map-view').get(0), {
      center: start,
      zoom: 14,
      streetViewControl: false,
      mapTypeControl: false
    });

  // set up path
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer({
    map: map
  });
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
      var legs = response.routes[0].legs;
      for (i = 0; i < legs.length; i++) {
        var steps = legs[i].steps;
        for (j = 0; j < steps.length; j++) {
          var path = steps[j].path;
          for (k = 0; k < path.length; k++) {
            // coord
            routeCoordinates.push({
              lat: path[k].lat(), 
              lng: path[k].lng()
            });
            // heading
            var rc_len = routeCoordinates.length;
            if (rc_len > 1) {
              var h = calculateHeading(routeCoordinates[rc_len - 2],
                                       routeCoordinates[rc_len - 1]);
              var prev_h = routeHeadings[routeHeadings.length - 1] || heading;
              // console.log(Math.abs(h - prev_h));
              if (Math.abs(h - prev_h) > 30 && Math.abs(h - prev_h) < 95) {
                routeHeadings.push(h);
              } else if (rc_len === 2) {
                routeHeadings.push(h);
              } else {
                routeHeadings.push(prev_h);
              }
            }
          }
        }
      }
      heading = routeHeadings[0];
      routeHeadings.push(routeHeadings[routeHeadings.length - 1]);
      // speed Markers
      var index = Math.floor(routeCoordinates.length / 7.0);
      for (var i = 1; i < 7; i++) {
        speedMarkers.push(i * index);
      }
      speedMarkers = [25, 40, 50, 100, 125, 138]; // DELETE THIS!!!!!!!
      routeCoordinates[47] = routeCoordinates[48]; // DELETE THIS!!!!!!!
      // draw line
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });

}


function calculateHeading (c1, c2) {
  var p1 = new google.maps.LatLng(c1.lat, c1.lng);
  var p2 = new google.maps.LatLng(c2.lat, c2.lng);
  var h = google.maps.geometry.spherical.computeHeading(p1, p2);
  if (h < 0) {
    h = 360 + h;
  }
  return h;
}


function startAnimation () {
  // change play/pause routing
  $('#play-pause').get(0).setAttribute('onClick', 'pausePlayAnimation()');
  $('#play-pause span').text('Pause');

  // load position marker on map
  if (typeof routeMarker === 'undefined') {
    routeMarker = new google.maps.Marker({
      position: start,
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
  } else { // (for reset)
    routeMarker.setPosition(start);
  }
  // (for reset)
  panorama.setPosition(routeCoordinates[0]);
  panorama.setPov({
    heading: routeHeadings[0],
    pitch: pitch
  });
  // start trip sequence (init pano -> route -> end pano)
  initialPanorama();
};


function initialPanorama () {
  var currHeading = heading;
  var stepSize = 0.4;

  var startPanoInterval = setInterval(function() {
    if (!isPaused) {
      currHeading += stepSize;
      if (currHeading >= 360) {
        currHeading = 0;
      }
      if (currHeading >= (heading - stepSize + 0.01) &&
          currHeading <= (heading + stepSize - 0.01)) {
        clearInterval(startPanoInterval);
        window.setTimeout(advanceRoute(), 300);
      }
      panorama.setPov({
        heading: currHeading,
        pitch: pitch
      });    
    }
  }, 5);
}

function advanceRoute() {
  var currIndex = -1;
  var routePlaying = true;

  var setNewRouteSpeed = function (s) {
    speed = s;
    clearInterval(advanceRouteInterval);
    advanceRouteInterval = setInterval(advance, speed); 
  }

  var advance = function () {
    if (!isPaused) {
      ++currIndex;
      if (currIndex >= routeCoordinates.length - 1) {
        clearInterval(advanceRouteInterval);
        window.setTimeout(finalPanorama(), 300);
        routePlaying = false;
      }
      if (rampedSpeed) {
        if (currIndex === speedMarkers[0] || 
            currIndex === speedMarkers[4]) {
          setNewRouteSpeed(baseSpeed * 0.5);
        } else if (currIndex === speedMarkers[1] || 
                   currIndex === speedMarkers[3]) {
          setNewRouteSpeed(baseSpeed * 0.35);
        } else if (currIndex === speedMarkers[2]) {
          setNewRouteSpeed(baseSpeed * 0.25); 
        } else if (currIndex === speedMarkers[5]) {
          setNewRouteSpeed(baseSpeed); 
        }
      }
      panorama.setPosition(routeCoordinates[currIndex]);
      panorama.setPov({
        heading: routeHeadings[currIndex],
        pitch: pitch
      });
      routeMarker.setPosition(routeCoordinates[currIndex]);
    }
  }
  var advanceRouteInterval = setInterval(advance, speed);

  $('input[type=radio][name=speed]').change(function() {
    if (routePlaying) {
      setNewRouteSpeed(speed);
    }
  });

}

function finalPanorama () {
  var finalHeading = routeHeadings[routeHeadings.length - 1];
  var currHeading = finalHeading;
  var stepSize = 0.4;

  var finalPanoInterval = setInterval(function() {
    if (!isPaused) {
      currHeading += stepSize;

      if (currHeading >= 360) {
        currHeading = 0;
      }
      if (currHeading >= (finalHeading - stepSize + 0.01) &&
          currHeading <= (finalHeading + stepSize - 0.01)) {
        clearInterval(finalPanoInterval);
        // change play/pause routing
        $('#play-pause').get(0).setAttribute('onClick', 'startAnimation()');
        $('#play-pause span').text('Restart');
      }
      panorama.setPov({
        heading: currHeading,
        pitch: pitch
      });
    }
  }, 5);
}


function pausePlayAnimation () {
  isPaused = !isPaused;
  if (isPaused) {
    $('#play-pause span').text('Play');
  } else {
    $('#play-pause span').text('Pause');
  }
}

