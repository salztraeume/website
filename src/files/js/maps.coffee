defaultFill = "#dbd9d9"
guestColor = "#810eed"

map = new Datamap
    element: document.getElementById 'maps-container'
    projection: 'mercator'
    scope: 'world'
    fills:
        defaultFill: defaultFill
        marker: guestColor

    geographyConfig:
        dataUrl: null  #if not null, datamaps will fetch the map JSON (currently only supports topojson)
        hideAntarctica: true
        borderWidth: 1
        borderColor: '#FDFDFD'
        popupTemplate: (geography, data) ->  #this function should just return a string
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>'

        popupOnHover: true #disable the popup while hovering
        highlightOnHover: true
        highlightFillColor: '#636262'
        highlightBorderColor: '#ffffff'
        highlightBorderWidth: 1

    arcConfig:
        strokeColor: '#DD1C77'
        strokeWidth: 1
        arcSharpness: 1
        animationSpeed: 600


    # setProjection: (element) ->
    #   projection = d3.geo.conicEqualArea()
    #     .center([19, 42])
    #     # .rotate([12.4, 9])
    #     .scale(600)
    #     .translate([element.offsetWidth / 2, element.offsetHeight / 2])
    #   path = d3.geo.path()
    #     .projection(projection);

    #   return {path: path, projection: projection};

map.bubbles [
    {
        name: 'Tivat'
        radius: 3
        fillKey: 'marker'
        latitude: 42.4318453
        longitude: 18.7041056
    }
    {
        name: 'Bukarest'
        radius: 3
        fillKey: 'marker'
        latitude: 44.4378258
        longitude: 26.0946376
    }
    {
        name: 'Kaliningrad'
        radius: 3
        fillKey: 'marker'
        latitude: 54.7116095
        longitude: 20.46453
    }
    {
        name: 'Berlin'
        radius: 3
        fillKey: 'marker'
        latitude: 52.5075419
        longitude: 13.4251364
    }
    {
        name: 'Hamburg'
        radius: 3
        fillKey: 'marker'
        latitude: 53.558572
        longitude: 9.9278215
    }
    {
        name: 'Philadelphia'
        radius: 3
        fillKey: 'marker'
        latitude: 40.0047528
        longitude: -75.1180329
    }
    {
        name: 'Karlsruhe'
        radius: 3
        fillKey: 'marker'
        latitude: 49.0158491
        longitude: 8.4095339
    }
    {
        name: 'London'
        radius: 3
        fillKey: 'marker'
        latitude: 51.5286416
        longitude: -0.1015987
    }
    {
        name: 'Tel Aviv-Yafo'
        radius: 3
        fillKey: 'marker'
        latitude: 32.0878802
        longitude: 34.797246
    }
    {
        name: 'Algarve'
        radius: 3
        fillKey: 'marker'
        latitude: 37.2454205
        longitude: -8.1960583
    }
    {
        name: 'Osnabrück'
        radius: 3
        fillKey: 'marker'
        latitude: 52.2779866
        longitude: 8.0554295
    }
    {
        name: 'Korea'
        radius: 3
        fillKey: 'marker'
        latitude: 38.007845
        longitude: 127.6660732
    }
    {
        name: 'Dresden'
        radius: 3
        fillKey: 'marker'
        latitude: 51.0768337
        longitude: 13.7725857
    }
    {
        name: 'Nürnberg'
        radius: 3
        fillKey: 'marker'
        latitude: 49.4360936
        longitude: 11.1011232
    }
],
    borderWidth: 1
    borderColor: '#FFFFFF'
    popupOnHover: true
    popupTemplate: (geography, data) ->
      "<div class='hoverinfo' style='color: #{guestColor}'><strong>#{data.name}</strong></div>"
    fillOpacity: 0.75
    highlightOnHover: true
    highlightFillColor: guestColor
    highlightBorderColor: guestColor
    highlightBorderWidth: 5
    highlightFillOpacity: 0.85