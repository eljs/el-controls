import Text from './text'
import html from '../../templates/controls/qrcode'

import { valueOrCall } from '../utils/valueOrCall'
import qrcode from 'qrcode/build/qrcode.js'

export default class QRCode extends Text
  tag: 'qrcode'
  html: html

  # pass this in optionally to overwrite a specific value
  text: ''

  # version '1' to '40', undefined for automatic detection (default)
  version: undefined

  # level of error correction
  # 'L' = 7%
  # 'M' = 15% (default)
  # 'Q' = 25%
  # 'H' = 35%
  # 'S' = 50% (unsupported)
  errorCorrectionLevel: 'M'

  # scale of a module
  scale: 4

  # margin of white area around qr code in pixels
  margin: 4

  init: ->
    if !@text
      super

    @on 'updated', ->
      canvas = @root.children[0]
      qrcode.toCanvas canvas, @getText(),
        version: @version
        errorCorrectionLevel: @errorCorrectionLevel
        scale: @scale
        margin: @margin
      , (error)->
        if error
          console.error error
        console.log 'success!'

  getText: ->
    return valueOrCall(@text) || @input.ref.get(input.name)

  # readonly
  change:  ->
  _change: ->
  getName: ->

QRCode.register()
