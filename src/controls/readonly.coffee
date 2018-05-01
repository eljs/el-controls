import Text from './text'

import valueOrCall from '../utils/valueOrCall'

export default class ReadOnly extends Text
  tag: 'readonly'
  readonly:     true

  # pass this in optionally to overwrite a specific value
  text: ''

  init: ->
    if !@text
      super()

  getText: ->
    return valueOrCall(@text) || @input.ref.get(input.name)

  # readonly
  change:  ->
  _change: ->
  getName: ->

ReadOnly.register()
