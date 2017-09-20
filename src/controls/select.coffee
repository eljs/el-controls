import Control from './control'

import html from '../../templates/controls/select'

export default class Select extends Control
  tag: 'selection'
  html: html

  instructions: 'Select an Option'

  autofocus:    false
  disabled:     false
  multiple:     false
  size:         null

  # default to something that will be visible
  _optionsHash: 'default'
  selectOptions: {}

  hasOptions: ->
    # call for side effects
    @options
    return @_optionsHash.length > 2

  options: ->
    optionsHash = JSON.stringify @selectOptions

    if @_optionsHash != optionsHash
      @_optionsHash = optionsHash

    return @selectOptions

  getValue: (e)->
    el = e.target
    return (el.options?[el.selectedIndex]?.value ? '').trim()

  init:(opts)->
    super

Select.register()

