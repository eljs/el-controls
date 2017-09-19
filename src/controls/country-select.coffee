import Select from './select'

export default class CountrySelect extends Select
  tag: 'country-selection'

  _countryCount: 0

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
  #
  options: ->
    countries = @countries ? @data?.get('countries') ? @parent?.data?.get('countries') ? []

    if @_countryCount == countries.length
      return @selectOptions

    _countryCount = countries.length

    @selectOptions = options = {}

    for country in countries
      options[country.code] = country.name

    return options

  init: ()->
    super

CountrySelect.register()
