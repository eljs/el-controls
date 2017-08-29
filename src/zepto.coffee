# Use zepto if there's no jquery involved so we can run without it.
# Use jquery or something else if you need better compatibility.
import $ from 'zepto-modules/_default'
import 'zepto-modules/selector'

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

export default $

