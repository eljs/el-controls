import Select from './select'

export default class CountrySelect extends Select
  tag: 'country-selection'

  # set up the countries in selectedOptions
  # countries should be in the form of
  # [{
  #     code: 'XX',
  #     name: 'Country Name',
  #     subdivisions: [{
  #         code: 'YY',
  #         name: 'Subdivision Name',
  #     }]
  # }]

  options: ->
    countries = @countries ? @data?.get('countries') ? @parent?.data?.get('countries') ? []

    optionsHash = JSON.stringify countries

    if @_optionsHash == optionsHash
      return @selectOptions

    @_optionsHash = optionsHash

    @selectOptions = options = {}
    @input.ref.set(@input.name, '')

    countries.sort (a, b)->
      nameA = a.name.toUpperCase()
      nameB = b.name.toUpperCase()
      return -1 if nameA < nameB
      return 1 if nameA > nameB
      return 0

    for country in countries
      options[country.code.toUpperCase()] = country.name

    return options

  init: ()->
    super

CountrySelect.register()
