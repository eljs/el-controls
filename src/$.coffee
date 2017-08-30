# Use zepto if there's no jquery involved so we can run without it.
# Use jquery or something else if you need better compatibility.
import zepto from 'zepto-modules/zepto'
import 'zepto-modules/event'
import 'zepto-modules/ie'
import 'zepto-modules/stack'
import 'zepto-modules/selector'

$ = zepto

if !window.$?
  # add in outer support from https://gist.github.com/pamelafox/1379704
  ['width', 'height'].forEach (dimension)->
    Dimension = dimension.replace /./, (m)-> return m[0].toUpperCase()
    $.fn['outer' + Dimension] = (margin)->
      elem = this
      if elem
        size = elem[dimension]()
        sides =
          width: ['left', 'right']
          height: ['top', 'bottom']
        sides[dimension].forEach (side)->
          if margin
            size += parseInt elem.css('margin-' + side), 10
        return size
      else
        return null

  window.$ = $
else
  # Use whichever $
  $ = window.$

export default $

