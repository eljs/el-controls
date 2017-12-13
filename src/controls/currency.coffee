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

  init: ()->
    super

    @on 'mounted', =>
      el = @root.getElementsByTagName(@formElement)[0]

      if @type != 'password'
        placeholder el

  getValue: (e)->
    el = e.target
    return renderJSONCurrencyFromUI((el.value ? '0').trim())

  renderUICurrencyFromJSON: renderUICurrencyFromJSON

Currency.register()
