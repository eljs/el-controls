import { raf }     from 'es-raf'

class TextBox extends Text
import html from '../../templates/controls/select'

export default class Select extends Control
  tag: 'selection'
  html: html

  instructions: ''

  autofocus:    false
  disabled:     false
  multiple:     false
  require:      false
  size:         10

  selectOptions: {}

  options: ->
    return @selectOptions

  getValue: (e)->
    el = e.target
    return (el.options[el.selectedIndex].value ? '').trim()

  init:(opts)->
    super

Select.register()

