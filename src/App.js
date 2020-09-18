import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';
//

import mapboxgl from 'mapbox-gl';
import './mapbox-gl.css';
import axios from 'axios';
import PropTypes from 'prop-types';


const API_KEY = '6351dad7ec9d4c4f9f03bab9b5180c38';
const BUS_POSITIONS = 'https://api.wmata.com/Bus.svc/json/jBusPositions';
const BUS_ROUTES = 'https://api.wmata.com/Bus.svc/json/jRouteDetails?RouteID=';
const BUS_STOPS = 'https://api.wmata.com/Bus.svc/json/jStops?';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2ltbW9uc2QiLCJhIjoiY2poeXk3YzlpMHJsbTNwcnYyNW1zeG9vMCJ9.sRhhJsrU0qUGbM7LiSrW_Q';

class App extends Component {
  constructor(props) {
    super(props);
    this.getBusPositions = this.getBusPositions.bind(this);
    this.onGetRouteByID = this.onGetRouteByID.bind(this);
    this.constructRouteShape = this.constructRouteShape.bind(this);
    this.makePointJson = this.makePointJson.bind(this);
  }

  state = {
    lat: 38.9,
    lng: -77.1,
    zoom: 11,
    //geojson containing info about all bus positions
    bus_json: {
      'type': 'FeatureCollection',
      'features': []
    },
    //geojson containing info about bus routes
    bus_route_json: {
      'type': 'FeatureCollection',
      'features': []
    },
    //geojson containing info about bus stops
    bus_stop_json: {
      'type': 'FeatureCollection',
      'features': []
    }
  }

  componentDidMount() {
    const {bus_json} = this.state;

    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    //creating a new variable that points to the outer this,
    //ie the this that is associated with the app component
    const self = this;
    //the scope of this changes inside of the below function
    this.map.on('load', function () {
      //add the bus stop points to the map
      this.addSource('bus_stops', {
        'type': 'geojson',
        'data': {...self.state.bus_stop_json}
      });
      this.addLayer({
        id: 'bus_stops',
        type: 'circle',
        source: 'bus_stops',
        paint: {
          'circle-color': '#B7A4AA',
          'circle-radius': 2.5
        }
      });

      //pre-emptively adding the bus-route layer to the map
      this.addSource('bus_routes', {
        'type': 'geojson',
        'data': {...self.state.bus_route_json}
      });
      this.addLayer({
        id: 'bus_routes',
        type: 'line',
        source: 'bus_routes',
        paint: {
          'line-color': '#0E79B2',
          'line-width': 3.2,
          'line-opacity': 0.6
        }
      });

      //add the bus position points to the map
      this.addSource('buses', {
        'type': 'geojson',
        'data': {...self.state.bus_json}
      });
      this.addLayer({
        id: 'buses',
        type: 'circle',
        source: 'buses',
        paint: {
          'circle-color': '#3E8E6B'
        }
      });
    });

    //configuring interactions for when the user clicks on a bus
    this.map.on('click', 'buses', function(e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const route_id = e.features[0].properties.RouteID;
      const headsign = e.features[0].properties.TripHeadsign;
       
      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      //i am using the ReactDOM to render a component inside the popup box
      const placeholder = document.createElement('div');
      ReactDOM.render(
        <BusPopupContent 
          route = {route_id} 
          headsign = {headsign}
          onClick = {() => self.onGetRouteByID(route_id)}
        />,
        placeholder
      );
       
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setDOMContent(placeholder)
        .addTo(this);
    });

    //configuring interactions for when the user clicks on a bus stop
    this.map.on('click', 'bus_stops', function(e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const name = e.features[0].properties.Name;
      const routes = JSON.parse(e.features[0].properties.Routes);
       
      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      //i am using the ReactDOM to render a component inside the popup box
      const placeholder = document.createElement('div');
      ReactDOM.render(
        <BusStopPopupContent 
          name = {name}
          routes = {routes}
          //when the user clicks on the button, they get to see all the routes
          //that the stop serves
          onClick = { () => {
            for (var route of routes) {
              self.onGetRouteByID(route);
            }
          }
          }
        />,
        placeholder
      );
       
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setDOMContent(placeholder)
        .addTo(this);
    });

    this.getBusPositions();
    this.getBusStops();
    //this runs the bus position function every 5 seconds
    this.timer_id = setInterval(() => this.getBusPositions(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer_id);
  }

  componentDidUpdate() {
    //prevents an error from being thrown. when the page loads, this function is called
    //before the map loads
    if(typeof(this.map.getSource('buses')) !== 'undefined') {
      this.map.getSource('buses').setData(this.state.bus_json);
      this.map.getSource('bus_routes').setData(this.state.bus_route_json);
      this.map.getSource('bus_stops').setData(this.state.bus_stop_json);
    }
  }
  getBusPositions() {
    axios
      .get(BUS_POSITIONS, {
        headers: {
          'api_key': API_KEY
        }
      })
      .then( res => {
        const new_bus_json = {
          'type': 'FeatureCollection',
          'features': []
        };

        //call the function that returns the point data in an acceptable format
        const updated_buses = this.makePointJson(res.data.BusPositions);
        new_bus_json['features'] = updated_buses;
        this.setState({bus_json: new_bus_json});
        console.log('bus positions')
      })
      .catch(err => {
        console.log(err);
      });
  }


  //this function makes a call to the api to get information on all bus stops
  getBusStops() {
    axios
    .get(BUS_STOPS, {
      headers: {
        'api_key': API_KEY
      }
    })
    .then(res => {
      const new_stop_json = {
        'type': 'FeatureCollection',
        'features': []
      };

      //call the function that returns the point data in an acceptable format
      console.log('bus stops');
      const updated_stops = this.makePointJson(res.data.Stops);
      new_stop_json['features'] = updated_stops;
      this.setState({bus_stop_json: new_stop_json});
    })
    .catch(err => {
      console.log(err);
    });
  }

  //this function takes objects from the WMATA API (bus stops, bus positions)
  //that represent point data, and returns an acceptable geojson of those points
  makePointJson(points_obj) {
    const points_arr = [];
    
    //looping over each feature from the request
    for (var feature of points_obj) {
      const feat_obj = {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [
            feature.Lon,
            feature.Lat
          ]
        },
        'properties': {...feature}
      }
      points_arr.push(feat_obj);
    }
    return points_arr;
  }

  //this function makes a call to the api to get the bus route information
  //route arg is a string representing the bus route's name, ie P6 or D80
  onGetRouteByID(route) {
    const url = `${BUS_ROUTES}${route}`;

    axios
    .get(url, {
      headers: {
        'api_key': API_KEY
      }
    })
    .then( res => {
      //make a geojson out of the bus route, add it to the map
      const route_shape = this.constructRouteShape(res);
      const feat_obj = {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': route_shape
        },
        'properties': {'RouteID': route},
      }

      const bus_routes = this.state.bus_route_json;
      bus_routes.features.push(feat_obj);
      this.setState({bus_route_json: bus_routes});
    })
    .catch(err => {
      console.log(err);
    });
  }

  //this function takes the Shape array contained in an API request to a specific
  //bus route, then turns it into an actual geojson
  //api_rt arg is the result generated by the onGetRouteByID function. it is a json
  //it returns an array where each entry is an array of [Lon, Lat]
  constructRouteShape(api_rt) {
    const pts = [];
    for (var pt of api_rt.data.Direction0.Shape) {
      pts.push([pt.Lon, pt.Lat]);
    }
    return pts
  }

  render () {
    return(
      <div>
        <div ref={el => this.mapContainer = el} className="mapContainer" />
      </div>
    );
  }
}

//component that contains info that will go into the popup for the bus layer
const BusPopupContent = ({route, headsign, onClick}) =>
  <div>
    <div>{route} to {headsign}</div>
    <button
      type = 'button'
      onClick = {() => onClick()}
    >
      Click to show route
    </button>
  </div>

//component that makes popup content for the bus stops
const BusStopPopupContent = ({name, routes, onClick}) =>
  <div>
    <div>{name}</div>
    <div>Serving routes {routes}</div>
    <button
      type = 'button'
      onClick = {() => onClick()}
    >
      Click to show all routes
    </button>
  </div>
export default App;
