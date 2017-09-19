import Promise from 'broken'
import {raf}   from 'es-raf'

# Shims/Polyfills
window.Promise               ?= Promise
window.requestAnimationFrame ?= raf
window.cancelAnimationFrame  ?= raf.cancel
