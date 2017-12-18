import Text from './text'
import html from '../../templates/controls/qrcode'

import { valueOrCall } from '../utils/valueOrCall'
import qrcode from 'qrcode-generator-es6'

export default class QRCode extends Text
  tag: 'qrcode'
  html: html

  # pass this in optionally to overwrite a specific value
  text: ''

  # version '1' to '40', '0' for automatic detection (default)
  version: '0'

  # level of error correction
  # 'L' = 7%
  # 'M' = 15% (default)
  # 'Q' = 25%
  # 'H' = 35%
  # 'S' = 50% (unsupported)
  errorLevel: 'M'

  # encoding mode
  # Numeric
  # Alphanumeric
  # Byte (default)
  # Kanji
  mode: 'Byte'

  # Multibyte
  # default (no support)
  # SJIS
  # UTF-8 (default)
  multibyte: 'UTF-8'

  init: ()->
    if !@text
      super

  getText: ()->
    return valueOrCall(@text) || @input.ref.get(input.name)

  getDataUri: ()->
    qrcode.stringToBytes = qrcode.stringToBytesFuncs[@multibyte]

    qr = qrcode @version || 4, @errorLevel || 'M'
    qr.addData @getText(), @mode
    qr.make()
    return /<img.*?src="(.*?)"/.exec(qr.createImgTag())[1]

  # readonly
  change:  ()->
  _change: ()->
  getName: ()->

QRCode.register()
