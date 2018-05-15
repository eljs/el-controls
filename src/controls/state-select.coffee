import Select from './selection'

export default class StateSelect extends Select
  tag: 'state-select'

  options: ->
    countries = @countries ? @data?.get('countries') ? @parent?.data?.get('countries') ? []

    code = @getCountry()

    # code is a 2 character alpha code
    if !code || code.length != 2
      @_optionsHash = ''
      return

    code = code.toUpperCase()

    found = false

    for country in countries
      if country.code.toUpperCase() == code
        found = true
        subdivisions = country.subdivisions

        optionsHash = JSON.stringify subdivisions

        if @_optionsHash == optionsHash
          return @selectOptions

        subdivisions = subdivisions.slice 0

        @_optionsHash = optionsHash

        @selectOptions = options = {}

        subdivisions.sort (a, b)->
          nameA = a.name.toUpperCase()
          nameB = b.name.toUpperCase()
          return -1 if nameA < nameB
          return 1 if nameA > nameB
          return 0

        for subdivision in subdivisions
          options[subdivision.code.toUpperCase()] = subdivision.name
        break

    if !found
      @_optionsHash = ''

    return options

  getCountry: ->
    return ''

  init: ->
    super arguments...

StateSelect.register()
