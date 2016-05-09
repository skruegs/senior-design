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
var trip;

// UI var defaults
var baseSpeed = 600;
var speed = baseSpeed;
var rampedSpeed = false;
var isPaused = false;


/**
 *  Initializes event handlers.
 */
function initialize() {
  $('input[type=radio][name=speed]').change(function() {
    if (this.value === 'ramp') {
      rampedSpeed = true;
    } else {
      speed = baseSpeed * this.value;
      rampedSpeed = false;
    }
  });
}


/**
 *  Determines source and destination lat/longs.
 *  Loads the full UI on success.
 */
function configureEndpoints () {
  trip = $('input[name=trip]:checked').val();
  if (trip === 'ny') {
    start = {lat: 40.7916895, lng: -73.9530089};
    end = {lat: 40.7728354, lng: -73.966765};
    $('#trip_name').html('<p>New York, NY</p>');

  } else if (trip === 'pa') {
    start = {lat: 39.9496531, lng: -75.156393};
    end = {lat: 39.9481971, lng: -75.144902};
    $('#trip_name').html('<p>Philadelphia, PA</p>');
  }
  $('#trip-form').css('display', 'none');
  $('#enter').css('display', 'none');
  $('#left-panel').css('height', '500px');
  $('#controls').css('display', 'block');
  $('#right-panel').css('display', 'block');
  load();
}


/**
 *  Loads both maps and calculates route coordinates, heading values,
 *  and ramp speed markers.
 */
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
              // heading
              var rc_len = routeCoordinates.length;
              if (rc_len > 1) {
                var h = calculateHeading(routeCoordinates[rc_len - 2],
                                         routeCoordinates[rc_len - 1]);
                var prev_h = routeHeadings[routeHeadings.length - 1] || heading;
                if (Math.abs(h - prev_h) > 40 && Math.abs(h - prev_h) < 100) {
                  routeHeadings.push(h);
                } else {
                  routeHeadings.push(prev_h);
                }
              }
              // add midpoint
              if (rc_len > 1) {
                var lat3 = (routeCoordinates[rc_len - 1].lat + path[k].lat()) / 2;
                var lng3 = (routeCoordinates[rc_len - 1].lng + path[k].lng()) / 2;
                routeCoordinates.push({
                  lat: lat3, 
                  lng: lng3
                });
                routeHeadings.push(routeHeadings[routeHeadings.length - 1]);
              }
              // coord
              routeCoordinates.push({
                lat: path[k].lat(), 
                lng: path[k].lng()
              });
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

        // POIs
        loadCustomRouteMarkers();

        // draw route line on inset map
        directionsDisplay.setDirections(response);
      } else {
      window.alert('Route coordinates directions request failed: ' + status);
    }
  });
}


/**
 *  @return
 *    Heading angle (0 <= angle <= 360) between points c1 and c2.
 */
function calculateHeading (c1, c2) {
  var p1 = new google.maps.LatLng(c1.lat, c1.lng);
  var p2 = new google.maps.LatLng(c2.lat, c2.lng);
  var h = google.maps.geometry.spherical.computeHeading(p1, p2);
  if (h < 0) {
    h = 360 + h;
  }
  return h;
}


/**
 *  Loads Point of Interest map markers for selected trip.
 */
function loadCustomRouteMarkers () {
  if (trip === 'ny') {
    routeCoordinates[63] = routeCoordinates[64];
    var guggMarker = new google.maps.Marker({
        position: {lat: 40.783211, lng: -73.9590865},
        map: panorama,
        icon: '../assets/guggenheim.png',
        title: 'The Guggenheim'
    });
    var metMarker = new google.maps.Marker({
        position: {lat: 40.778839, lng: -73.963031},
        map: panorama,
        icon: '../assets/met.png',
        title: 'The Met'
    });
    var cpMarker = new google.maps.Marker({
        position: {lat: 40.776409, lng: -73.9647285},
        map: panorama,
        icon: '../assets/centralpark.png',
        title: 'Central Park'
    });

  } else if (trip === 'pa') {
    var libertyBellMarker = new google.maps.Marker({
        position: {lat: 39.9493191, lng: -75.151158},
        map: panorama,
        icon: '../assets/libertybell.png',
        title: 'The Guggenheim'
    });
    var indHallMarker = new google.maps.Marker({
        position: {lat: 39.948435, lng: -75.150034},
        map: panorama,
        icon: '../assets/indhall.png',
        title: 'The Met'
    });
    var secondBankMarker = new google.maps.Marker({
        position: {lat: 39.9487841, lng: -75.148194},
        map: panorama,
        icon: '../assets/secondbank.png',
        title: 'Central Park'
    });
  }

}


/**
 *  Begins hyperlapse and inset map animations.
 */
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
  } else { // (on reset)
    routeMarker.setPosition(start);
  }
  // (on reset)
  panorama.setPosition(routeCoordinates[0]);
  panorama.setPov({
    heading: routeHeadings[0],
    pitch: pitch
  });
  // start trip sequence (init pano -> route -> end pano)
  initialPanorama();
};


/**
 *  Begins 360 panorama at start position.
 */
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
        // start correct route
        if (trip === 'ny') {
          window.setTimeout(advanceRouteNYC(), 300);
        } else if (trip === 'pa') {
          window.setTimeout(advanceRoutePHL(), 300);
        }
      }
      panorama.setPov({
        heading: currHeading,
        pitch: pitch
      });    
    }
  }, 5);
}


/**
 *  Begins NYC hyperlapse playback.
 */
function advanceRouteNYC () {
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
          setNewRouteSpeed(baseSpeed * 0.33);
        } else if (currIndex === speedMarkers[2]) {
          setNewRouteSpeed(baseSpeed * 0.25); 
        } else if (currIndex === speedMarkers[5]) {
          setNewRouteSpeed(baseSpeed); 
        } 
      }
      // pause at POIS
      if (currIndex === 31) { // gugg
        isPaused = true;
        setTimeout(playLeftPan(currIndex), 100);
      } else if (currIndex === 49) {  // met
        isPaused = true;
        setTimeout(playRightPan(currIndex), 100);
      } else if (currIndex === 63) {  // central park
        isPaused = true;
        setTimeout(playRightPan(currIndex), 100);
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
  
  // handle speed change during playback
  $('input[type=radio][name=speed]').change(function() {
    if (routePlaying) {
      setNewRouteSpeed(speed);
    }
  });
}


/**
 *  Begins PHL hyperlapse playback.
 */
function advanceRoutePHL () {
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
          setNewRouteSpeed(baseSpeed * 0.33);
        } else if (currIndex === speedMarkers[2]) {
          setNewRouteSpeed(baseSpeed * 0.25); 
        } else if (currIndex === speedMarkers[5]) {
          setNewRouteSpeed(baseSpeed); 
        } 
      }
      // pause at POIS
      if (currIndex === 8) {  // liberty
        isPaused = true;
        setTimeout(playLeftPan(currIndex), 100);
      } else if (currIndex === 10) {  // ind hall
        isPaused = true;
        setTimeout(playRightPan(currIndex), 100);
      } else if (currIndex === 15) {  // bank
        isPaused = true;
        setTimeout(playRightPan(currIndex), 100);
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

  // handle speed change during playback
  $('input[type=radio][name=speed]').change(function() {
    if (routePlaying) {
      setNewRouteSpeed(speed);
    }
  });
}



/* 
 * Pans heading left while paused at POI.
 */
function playLeftPan(currIndex) {
  var currHeading = routeHeadings[currIndex];
  var stepSize = -0.3;

  var interval = setInterval(function() {
    currHeading += stepSize;

    if (trip === 'ny') {
      if (currHeading <= 150) {
        stepSize = -stepSize;
      }
      if (currHeading > routeHeadings[currIndex]) {
        clearInterval(interval);
        isPaused = false;
      }
    } else if (trip === 'pa') {
      if (currHeading <= 20) {
        stepSize = -stepSize;
      }
      if (currHeading > routeHeadings[currIndex]) {
        clearInterval(interval);
        isPaused = false;
      }
    }
    panorama.setPov({
      heading: currHeading,
      pitch: pitch
    });
  }, 5);
}


/* 
 * Pans heading right while paused at POI.
 */
function playRightPan (currIndex) {
  var currHeading = routeHeadings[currIndex];
  var stepSize = 0.3;

  var interval = setInterval(function() {
    currHeading += stepSize;

    if (trip === 'ny') {
      if (currHeading >= 270) {
        stepSize = -stepSize;
      }
      if (currHeading < routeHeadings[currIndex]) {
        clearInterval(interval);
        isPaused = false;
      }
    } else if (trip === 'pa') {
      if (currHeading >= 170) {
        stepSize = -stepSize;
      }
      if (currHeading < routeHeadings[currIndex]) {
        clearInterval(interval);
        isPaused = false;
      }
    }
    panorama.setPov({
      heading: currHeading,
      pitch: pitch
    });
  }, 5);

}


/**
 *  Begins 360 panoroma at destination.
 */
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


/**
 *  Handles play/pause button event.
 */
function pausePlayAnimation () {
  isPaused = !isPaused;
  if (isPaused) {
    $('#play-pause span').text('Play');
  } else {
    $('#play-pause span').text('Pause');
  }
}


/**
 *  Exports trip's POI data to text file.
 */
function exportData () {
  var path = document.location.pathname;
  var directory = path.substring(path.indexOf('/'), path.lastIndexOf('/'));
  if (trip === 'ny') {
    window.open(directory + '/exported-data/nyc.txt');
  } else if (trip === 'pa') {
    window.open(directory + '/exported-data/phl.txt');
  }
} 
