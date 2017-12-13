import Text from './text'
import placeholder from '../utils/placeholder'

import html from '../../templates/controls/currency'

import {
  renderUICurrencyFromJSON
  renderJSONCurrencyFromUI
} from 'shop.js-util/src/currency'

export default class Currency extends Text
  tag:          'currency'
  html:         html
  currency:     ''

  init: ()->
    super

    @on 'mounted', =>
      el = @root.getElementsByTagName(@formElement)[0]

      if @type != 'password'
        placeholder el

  getCurrency: (e)->
    currency = @currency
    if typeof currency == 'function'
      return currency()

    return currency

  renderValue: ->
    renderUICurrencyFromJSON @getCurrency(), @input.ref.get(input.name)

  getValue: (e)->
    el = e.target
    return renderJSONCurrencyFromUI @getCurrency(), (el.value ? '0').trim()

Currency.register()
