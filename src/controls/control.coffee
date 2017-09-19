import El       from 'el.js'
import Events   from  '../events'

import { Tween, Easing, autoPlay } from 'es6-tween/src/index.lite'

scrolling = false

export default class Control extends El.Input
  init: ->
    super

  getValue: (event) ->
    return event.target.value?.trim()

  error: (err) ->
    if err instanceof DOMException
      console.log 'WARNING: Error in riot dom manipulation ignored:', err
      return

    super

    rect = @root.getBoundingClientRect()
    elTop = rect.top
    wTop = window.pageYOffset

    if !scrolling && elTop <= wTop
      scrolling = true

      autoPlay true

      t = new Tween { x: 0 }
        .to { x: elTop }, 500, Easing.Cubic
        .onUpdate (x)->
          percent = x / elTop
          window.scrollTo window.pageXOffset, wTop - x
        .onComplete ->
          scrolling = false

    @mediator.trigger Events.ChangeFailed, @input.name, @input.ref.get @input.name

  change: ->
    super
    @mediator.trigger Events.Change, @input.name, @input.ref.get @input.name

  changed: (value) ->
    @mediator.trigger Events.ChangeSuccess, @input.name, value
    El.scheduleUpdate()

  value: ->
    return @input.ref @input.name
