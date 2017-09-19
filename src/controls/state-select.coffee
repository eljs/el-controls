import Select from './select'

export default class StateSelect extends Select
  tag: 'state-selection'

  options: ->
    countries = @countries ? @data?.get('countries') ? @parent?.data?.get('countries') ? []

    @selectOptions = options = {}

    code = @getCountry()

    # code is a 2 character alpha code
    if !code || code.length != 2
      return

    code = code.toUpperCase()

    for country in countries
      if country.code.toUpperCase() == code
        for subdivision in country.subdivisions
          options[subdivision.code] = subdivision.name
        break

    return options

  getCountry: ->
    return ''

  init: ()->
    super

StateSelect.register()
