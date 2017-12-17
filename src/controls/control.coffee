import El       from 'el.js/src'
import Events   from  '../events'

import { Tween, Easing, autoPlay } from 'es6-tween/src/index'
import { valueOrCall } from '../utils/valueOrCall'

scrolling = false

_controlId = 0

export default class Control extends El.Input
  _controlId: 0

  name: null

  init: ->
    super
    @_controlId = _controlId++

  getId: () ->
    return @tag + '-' + @_controlId

  getName: () ->
    return valueOrCall(@name) ? @input.name.replace /\\./g, '-'

  getValue: (event) ->
    return event.target.value?.trim()

  error: (err) ->
    if err instanceof DOMException
      console.log 'WARNING: Error in riot dom manipulation ignored:', err
      return

    super

    rect = @root.getBoundingClientRect()
    elTop = rect.top - window.innerHeight / 2
    wTop = window.pageYOffset

    if !scrolling && elTop <= wTop
      scrolling = true

      autoPlay true

      t = new Tween { x: wTop }
        .to { x: wTop + elTop }, 500, Easing.Cubic
        .on 'update', ({ x })->
          window.scrollTo window.pageXOffset, x
        .on 'complete', ->
          scrolling = false
          autoPlay false
        .start()

    @mediator.trigger Events.ChangeFailed, @input.name, @input.ref.get @input.name

  change: ->
    super
    @mediator.trigger Events.Change, @input.name, @input.ref.get @input.name

  changed: (value) ->
    @mediator.trigger Events.ChangeSuccess, @input.name, value
    El.scheduleUpdate()

  value: ->
    return @input.ref @input.name
