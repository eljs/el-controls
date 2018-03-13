import Control from './control'

# requires <script src='//www.google.com/recaptcha/api.js?render=explicit'/>
export default class ReCaptcha extends Control
  tag:  'recaptcha'
  html: ''

  # sitekey from recaptcha
  # sitekey: null

  # theme ('dark'/'light')
  theme: 'light'

  init: ->
    super

    requestAnimationFrame =>
      grecaptcha.render @root,
        sitekey: @recaptcha
        theme:   @theme
        callback: (res) =>
          @data.set 'user.g-recaptcha-response', res

ReCaptcha.register()
