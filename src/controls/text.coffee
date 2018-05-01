import Control from './control'
import placeholder from '../utils/placeholder'

import html from '../../templates/controls/text'

export default class Text extends Control
  tag:          'text'
  html:         html
  type:         'text'
  formElement:  'input'

  autocomplete: 'on'
  autofocus:    false
  disabled:     false
  maxlength:    null
  readonly:     false
  placeholder:  null
  label:        ''
  instructions: null

  init: ->
    super()

    @on 'mounted', =>
      el = @root.getElementsByTagName(@formElement)[0]

      if @type != 'password'
        placeholder el

Text.register()
