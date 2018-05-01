export default valueOrCall = (valueOrFunc)->
  if typeof valueOrFunc == 'function'
    return valueOrFunc()

  return valueOrFunc
