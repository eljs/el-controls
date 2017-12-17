import Text from './text'
import html from '../../templates/controls/copy'

import { valueOrCall } from '../utils/valueOrCall'

export default class Copy extends Text
  tag: 'copy'
  html: html

  # pass this in optionally to overwrite a specific value
  text: ''

  # this is set automatically
  copied: false

  init: ()->
    if !@text
      super

  getText: ()->
    return valueOrCall(@text) || @input.ref.get(input.name)

  # readonly
  getName: ()->
  change: ()->
  _change: ()->

  copy: (e)->
    text = @getText()

    textArea = document.createElement "textarea"

    textArea.style.position = 'fixed'
    textArea.style.top = 0
    textArea.style.left = 0
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = 0
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'
    textArea.value = text
    document.body.appendChild textArea
    textArea.select()

    try
      successful = document.execCommand 'copy'
      msg = successful ? 'successful' : 'unsuccessful'
      console.log 'Copying text command was ' + msg
    catch err
      console.log 'Oops, unable to copy'

    document.body.removeChild textArea

    @copied = true

    @scheduleUpdate()
    return false

Copy.register()
