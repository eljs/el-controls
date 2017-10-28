import Text from './text'
import html from '../../templates/controls/textarea'

class TextBox extends Text
  tag:         'textbox'
  html:         html
  formElement: 'textarea'

  rows: null
  cols: null
  disabled: false
  maxlength: null
  readonly: false
  wrap: null

TextBox.register()

export default TextBox
