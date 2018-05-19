import Control from './control'
import GMaps from 'gmaps'

import html from '../../templates/controls/gmap'

import valueOrCall from '../utils/valueOrCall'

geocode = (address)->
  return new Promise (resolve, reject) ->
    GMaps.geocode
      address: address
      callback: (results, status) =>
        if status != 'OK'
          reject status
          return

        resolve results

export default class GMap extends Control
  tag: 'gmap'
  html: html

  # pass this in optionally to overwrite a specific value
  address: ''

  # we cache address to prevent unnecessary reloads
  previousAddress: ''

  # gmaps map
  # map: null

  # latlng cache
  # latlng: null

  errorMessage: ''

  mapTypeId: 'roadmap'

  init: () ->
    if !@address
      super arguments...

    resize = =>
      @resize()

    @on 'mount', =>
      settings =
        div: @root.getElementsByClassName('map')[0]
        lat: 21.3280681
        lng: -157.798970564
        zoom: 10
        disableDefaultUI: true
        draggable: false
        zoomControl: false
        scrollwheel: false
        disableDoubleClickZoom: true
        mapTypeId: @mapTypeId

      @map = new GMaps settings

      window.addEventListener 'resize', resize

      @scheduleUpdate()

    @on 'updated', =>
      add = @getAddress()
      if add != @previousAddress
        @previousAddress = add
        geocode(add).then (results) =>
          @latlng = latlng = results[0].geometry.location
          @map.removeMarkers()
          @map.addMarker
            lat: latlng.lat()
            lng: latlng.lng()

          resize()

        .catch (err) =>
          @errorMessage = 'Error: ' + err

    @on 'unmount', =>
      window.removeEventListener 'resize', resize

  getAddress: ->
    return (valueOrCall(@address) || @input.ref.get(input.name)).trim()

  resize: ->
    if !@map
      return

    @map.refresh()

    if @latlng
      @map.setCenter @latlng.lat(), @latlng.lng()

  # readonly
  change:  ->
  _change: ->
  getName: ->

GMap.register()
