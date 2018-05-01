import Text from './text'
import { valueOrCall } from '../utils/valueOrCall'

import html from '../../templates/controls/currency'

import {
  renderUICurrencyFromJSON
  renderJSONCurrencyFromUI
} from 'shop.js-util/src/currency'

export default class Currency extends Text
  tag:          'currency'
  html:         html
  currency:     ''

  init: ->
    super()

  getCurrency: (e)->
    return valueOrCall @currency

  renderValue: ->
    renderUICurrencyFromJSON @getCurrency(), @input.ref.get(@input.name)

  getValue: (e)->
    el = e.target
    return renderJSONCurrencyFromUI @getCurrency(), (el.value ? '0').trim()

Currency.register()
