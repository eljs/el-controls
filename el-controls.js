var ElControls = (function (exports) {
'use strict';

// node_modules/broken/lib/broken.mjs
// src/promise-inspection.coffee
var PromiseInspection;

var PromiseInspection$1 = PromiseInspection = (function() {
  function PromiseInspection(arg) {
    this.state = arg.state, this.value = arg.value, this.reason = arg.reason;
  }

  PromiseInspection.prototype.isFulfilled = function() {
    return this.state === 'fulfilled';
  };

  PromiseInspection.prototype.isRejected = function() {
    return this.state === 'rejected';
  };

  return PromiseInspection;

})();

// src/utils.coffee
var _undefined$1 = void 0;

var _undefinedString$1 = 'undefined';

// src/soon.coffee
var soon;

soon = (function() {
  var bufferSize, callQueue, cqYield, fq, fqStart;
  fq = [];
  fqStart = 0;
  bufferSize = 1024;
  callQueue = function() {
    var err;
    while (fq.length - fqStart) {
      try {
        fq[fqStart]();
      } catch (error) {
        err = error;
        if (typeof console !== 'undefined') {
          console.error(err);
        }
      }
      fq[fqStart++] = _undefined$1;
      if (fqStart === bufferSize) {
        fq.splice(0, bufferSize);
        fqStart = 0;
      }
    }
  };
  cqYield = (function() {
    var dd, mo;
    if (typeof MutationObserver !== _undefinedString$1) {
      dd = document.createElement('div');
      mo = new MutationObserver(callQueue);
      mo.observe(dd, {
        attributes: true
      });
      return function() {
        dd.setAttribute('a', 0);
      };
    }
    if (typeof setImmediate !== _undefinedString$1) {
      return function() {
        setImmediate(callQueue);
      };
    }
    return function() {
      setTimeout(callQueue, 0);
    };
  })();
  return function(fn) {
    fq.push(fn);
    if (fq.length - fqStart === 1) {
      cqYield();
    }
  };
})();

var soon$1 = soon;

// src/promise.coffee
var Promise$1;
var STATE_FULFILLED;
var STATE_PENDING;
var STATE_REJECTED;
var _undefined;
var rejectClient;
var resolveClient;

_undefined = void 0;

STATE_PENDING = _undefined;

STATE_FULFILLED = 'fulfilled';

STATE_REJECTED = 'rejected';

resolveClient = function(c, arg) {
  var err, yret;
  if (typeof c.y === 'function') {
    try {
      yret = c.y.call(_undefined, arg);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.resolve(arg);
  }
};

rejectClient = function(c, reason) {
  var err, yret;
  if (typeof c.n === 'function') {
    try {
      yret = c.n.call(_undefined, reason);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.reject(reason);
  }
};

Promise$1 = (function() {
  function Promise(fn) {
    if (fn) {
      fn((function(_this) {
        return function(arg) {
          return _this.resolve(arg);
        };
      })(this), (function(_this) {
        return function(arg) {
          return _this.reject(arg);
        };
      })(this));
    }
  }

  Promise.prototype.resolve = function(value) {
    var clients, err, first, next;
    if (this.state !== STATE_PENDING) {
      return;
    }
    if (value === this) {
      return this.reject(new TypeError('Attempt to resolve promise with self'));
    }
    if (value && (typeof value === 'function' || typeof value === 'object')) {
      try {
        first = true;
        next = value.then;
        if (typeof next === 'function') {
          next.call(value, (function(_this) {
            return function(ra) {
              if (first) {
                if (first) {
                  first = false;
                }
                _this.resolve(ra);
              }
            };
          })(this), (function(_this) {
            return function(rr) {
              if (first) {
                first = false;
                _this.reject(rr);
              }
            };
          })(this));
          return;
        }
      } catch (error) {
        err = error;
        if (first) {
          this.reject(err);
        }
        return;
      }
    }
    this.state = STATE_FULFILLED;
    this.v = value;
    if (clients = this.c) {
      soon$1((function(_this) {
        return function() {
          var c, i, len;
          for (i = 0, len = clients.length; i < len; i++) {
            c = clients[i];
            resolveClient(c, value);
          }
        };
      })(this));
    }
  };

  Promise.prototype.reject = function(reason) {
    var clients;
    if (this.state !== STATE_PENDING) {
      return;
    }
    this.state = STATE_REJECTED;
    this.v = reason;
    if (clients = this.c) {
      soon$1(function() {
        var c, i, len;
        for (i = 0, len = clients.length; i < len; i++) {
          c = clients[i];
          rejectClient(c, reason);
        }
      });
    } else if (!Promise.suppressUncaughtRejectionError && typeof console !== 'undefined') {
      console.log('Broken Promise, please catch rejections: ', reason, reason ? reason.stack : null);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var a, client, p, s;
    p = new Promise;
    client = {
      y: onFulfilled,
      n: onRejected,
      p: p
    };
    if (this.state === STATE_PENDING) {
      if (this.c) {
        this.c.push(client);
      } else {
        this.c = [client];
      }
    } else {
      s = this.state;
      a = this.v;
      soon$1(function() {
        if (s === STATE_FULFILLED) {
          resolveClient(client, a);
        } else {
          rejectClient(client, a);
        }
      });
    }
    return p;
  };

  Promise.prototype["catch"] = function(cfn) {
    return this.then(null, cfn);
  };

  Promise.prototype["finally"] = function(cfn) {
    return this.then(cfn, cfn);
  };

  Promise.prototype.timeout = function(ms, msg) {
    msg = msg || 'timeout';
    return new Promise((function(_this) {
      return function(resolve, reject) {
        setTimeout(function() {
          return reject(Error(msg));
        }, ms);
        _this.then(function(val) {
          resolve(val);
        }, function(err) {
          reject(err);
        });
      };
    })(this));
  };

  Promise.prototype.callback = function(cb) {
    if (typeof cb === 'function') {
      this.then(function(val) {
        return cb(null, val);
      });
      this["catch"](function(err) {
        return cb(err, null);
      });
    }
    return this;
  };

  return Promise;

})();

var Promise$2 = Promise$1;

// src/helpers.coffee
var resolve = function(val) {
  var z;
  z = new Promise$2;
  z.resolve(val);
  return z;
};

var reject = function(err) {
  var z;
  z = new Promise$2;
  z.reject(err);
  return z;
};

var all = function(ps) {
  var i, j, len, p, rc, resolvePromise, results, retP;
  results = [];
  rc = 0;
  retP = new Promise$2();
  resolvePromise = function(p, i) {
    if (!p || typeof p.then !== 'function') {
      p = resolve(p);
    }
    p.then(function(yv) {
      results[i] = yv;
      rc++;
      if (rc === ps.length) {
        retP.resolve(results);
      }
    }, function(nv) {
      retP.reject(nv);
    });
  };
  for (i = j = 0, len = ps.length; j < len; i = ++j) {
    p = ps[i];
    resolvePromise(p, i);
  }
  if (!ps.length) {
    retP.resolve(results);
  }
  return retP;
};

var reflect = function(promise) {
  return new Promise$2(function(resolve, reject) {
    return promise.then(function(value) {
      return resolve(new PromiseInspection$1({
        state: 'fulfilled',
        value: value
      }));
    })["catch"](function(err) {
      return resolve(new PromiseInspection$1({
        state: 'rejected',
        reason: err
      }));
    });
  });
};

var settle = function(promises) {
  return all(promises.map(reflect));
};

// src/index.coffee
Promise$2.all = all;

Promise$2.reflect = reflect;

Promise$2.reject = reject;

Promise$2.resolve = resolve;

Promise$2.settle = settle;

Promise$2.soon = soon$1;

// node_modules/es-raf/dist/es-raf.mjs
var browser = (function() {
  var loadTime, now;
  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    now = function() {
      return performance.now();
    };
  } else {
    now = function() {
      return Date.now() - loadTime;
    };
    loadTime = new Date().getTime();
  }
  return now;
})();

var frameDuration;
var id;
var last;
var queue;
var requestAnimationFrame;

frameDuration = 1000 / 60;

id = 0;

last = 0;

queue = [];

var raf = requestAnimationFrame = function(callback) {
  var next, now_;
  if (queue.length === 0) {
    now_ = browser();
    next = Math.max(0, frameDuration - (now_ - last));
    last = next + now_;
    setTimeout(function() {
      var cp, err, i, len, x;
      cp = queue.slice(0);
      queue.length = 0;
      for (i = 0, len = cp.length; i < len; i++) {
        x = cp[i];
        if (!x.cancelled) {
          try {
            x.callback(last);
          } catch (error) {
            err = error;
            setTimeout(function() {
              throw err;
            }, 0);
          }
        }
      }
    }, Math.round(next));
  }
  queue.push({
    handle: ++id,
    callback: callback,
    cancelled: false
  });
  return id;
};

// src/utils/patches.coffee
if (window.Promise == null) {
  window.Promise = Promise$2;
}

if (window.requestAnimationFrame == null) {
  window.requestAnimationFrame = raf;
}

if (window.cancelAnimationFrame == null) {
  window.cancelAnimationFrame = raf.cancel;
}

// node_modules/es-tostring/index.mjs
var toString = function(obj) {
  return Object.prototype.toString.call(obj)
};

// node_modules/es-is/function.js
// Generated by CoffeeScript 1.12.5
var isFunction;

var isFunction$1 = isFunction = function(value) {
  var str;
  if (typeof window !== 'undefined' && value === window.alert) {
    return true;
  }
  str = toString(value);
  return str === '[object Function]' || str === '[object GeneratorFunction]' || str === '[object AsyncFunction]';
};

// node_modules/riot/lib/browser/common/global-variables.js
const __TAGS_CACHE = [];
const __TAG_IMPL = {};
const GLOBAL_MIXIN = '__global_mixin';
const ATTRS_PREFIX = 'riot-';
const REF_DIRECTIVES = ['ref', 'data-ref'];
const IS_DIRECTIVE = 'data-is';
const CONDITIONAL_DIRECTIVE = 'if';
const LOOP_DIRECTIVE = 'each';
const LOOP_NO_REORDER_DIRECTIVE = 'no-reorder';
const SHOW_DIRECTIVE = 'show';
const HIDE_DIRECTIVE = 'hide';
const RIOT_EVENTS_KEY = '__riot-events__';
const T_STRING = 'string';
const T_OBJECT = 'object';
const T_UNDEF  = 'undefined';
const T_FUNCTION = 'function';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_REGEX = /^xlink:(\w+)/;
const WIN = typeof window === T_UNDEF ? undefined : window;
const RE_SPECIAL_TAGS = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/;
const RE_SPECIAL_TAGS_NO_OPTION = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/;
const RE_EVENTS_PREFIX = /^on/;
const RE_HTML_ATTRS = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g;
const CASE_SENSITIVE_ATTRIBUTES = { 'viewbox': 'viewBox' };
const RE_BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/;
const IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;

// node_modules/riot/lib/browser/common/util/check.js
/**
 * Check if the passed argument is a boolean attribute
 * @param   { String } value -
 * @returns { Boolean } -
 */
function isBoolAttr(value) {
  return RE_BOOL_ATTRS.test(value)
}

/**
 * Check if passed argument is a function
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isFunction$2(value) {
  return typeof value === T_FUNCTION
}

/**
 * Check if passed argument is an object, exclude null
 * NOTE: use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isObject(value) {
  return value && typeof value === T_OBJECT // typeof null is 'object'
}

/**
 * Check if passed argument is undefined
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isUndefined(value) {
  return typeof value === T_UNDEF
}

/**
 * Check if passed argument is a string
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isString(value) {
  return typeof value === T_STRING
}

/**
 * Check if passed argument is empty. Different from falsy, because we dont consider 0 or false to be blank
 * @param { * } value -
 * @returns { Boolean } -
 */
function isBlank(value) {
  return isUndefined(value) || value === null || value === ''
}

/**
 * Check if passed argument is a kind of array
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isArray(value) {
  return Array.isArray(value) || value instanceof Array
}

/**
 * Check whether object's property could be overridden
 * @param   { Object }  obj - source object
 * @param   { String }  key - object property
 * @returns { Boolean } -
 */
function isWritable(obj, key) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return isUndefined(obj[key]) || descriptor && descriptor.writable
}


var check = Object.freeze({
	isBoolAttr: isBoolAttr,
	isFunction: isFunction$2,
	isObject: isObject,
	isUndefined: isUndefined,
	isString: isString,
	isBlank: isBlank,
	isArray: isArray,
	isWritable: isWritable
});

// node_modules/riot/lib/browser/common/util/dom.js
/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(selector))
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $$1(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

/**
 * Create a document fragment
 * @returns { Object } document fragment
 */
function createFrag() {
  return document.createDocumentFragment()
}

/**
 * Create a document text node
 * @returns { Object } create a text node to use as placeholder
 */
function createDOMPlaceholder() {
  return document.createTextNode('')
}

/**
 * Check if a DOM node is an svg tag
 * @param   { HTMLElement }  el - node we want to test
 * @returns {Boolean} true if it's an svg node
 */
function isSvg(el) {
  return !!el.ownerSVGElement
}

/**
 * Create a generic DOM node
 * @param   { String } name - name of the DOM node we want to create
 * @param   { Boolean } isSvg - true if we need to use an svg node
 * @returns { Object } DOM node just created
 */
function mkEl(name) {
  return name === 'svg' ? document.createElementNS(SVG_NS, name) : document.createElement(name)
}

/**
 * Set the inner html of any DOM node SVGs included
 * @param { Object } container - DOM node where we'll inject new html
 * @param { String } html - html to inject
 */
/* istanbul ignore next */
function setInnerHTML(container, html) {
  if (!isUndefined(container.innerHTML))
    container.innerHTML = html;
    // some browsers do not support innerHTML on the SVGs tags
  else {
    const doc = new DOMParser().parseFromString(html, 'application/xml');
    const node = container.ownerDocument.importNode(doc.documentElement, true);
    container.appendChild(node);
  }
}

/**
 * Toggle the visibility of any DOM node
 * @param   { Object }  dom - DOM node we want to hide
 * @param   { Boolean } show - do we want to show it?
 */

function toggleVisibility(dom, show) {
  dom.style.display = show ? '' : 'none';
  dom['hidden'] = show ? false : true;
}

/**
 * Remove any DOM attribute from a node
 * @param   { Object } dom - DOM node we want to update
 * @param   { String } name - name of the property we want to remove
 */
function remAttr(dom, name) {
  dom.removeAttribute(name);
}

/**
 * Convert a style object to a string
 * @param   { Object } style - style object we need to parse
 * @returns { String } resulting css string
 * @example
 * styleObjectToString({ color: 'red', height: '10px'}) // => 'color: red; height: 10px'
 */
function styleObjectToString(style) {
  return Object.keys(style).reduce((acc, prop) => {
    return `${acc} ${prop}: ${style[prop]};`
  }, '')
}

/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name)
}

/**
 * Set any DOM attribute
 * @param { Object } dom - DOM node we want to update
 * @param { String } name - name of the property we want to set
 * @param { String } val - value of the property we want to set
 */
function setAttr(dom, name, val) {
  const xlink = XLINK_REGEX.exec(name);
  if (xlink && xlink[1])
    dom.setAttributeNS(XLINK_NS, xlink[1], val);
  else
    dom.setAttribute(name, val);
}

/**
 * Insert safely a tag to fix #1962 #1649
 * @param   { HTMLElement } root - children container
 * @param   { HTMLElement } curr - node to insert
 * @param   { HTMLElement } next - node that should preceed the current node inserted
 */
function safeInsert(root, curr, next) {
  root.insertBefore(curr, next.parentNode && next);
}

/**
 * Minimize risk: only zero or one _space_ between attr & value
 * @param   { String }   html - html string we want to parse
 * @param   { Function } fn - callback function to apply on any attribute found
 */
function walkAttrs(html, fn) {
  if (!html) return
  let m;
  while (m = RE_HTML_ATTRS.exec(html))
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4]);
}

/**
 * Walk down recursively all the children tags starting dom node
 * @param   { Object }   dom - starting node where we will start the recursion
 * @param   { Function } fn - callback to transform the child node just found
 * @param   { Object }   context - fn can optionally return an object, which is passed to children
 */
function walkNodes(dom, fn, context) {
  if (dom) {
    const res = fn(dom, context);
    let next;
    // stop the recursion
    if (res === false) return

    dom = dom.firstChild;

    while (dom) {
      next = dom.nextSibling;
      walkNodes(dom, fn, res);
      dom = next;
    }
  }
}

var dom = Object.freeze({
	$$: $$,
	$: $$1,
	createFrag: createFrag,
	createDOMPlaceholder: createDOMPlaceholder,
	isSvg: isSvg,
	mkEl: mkEl,
	setInnerHTML: setInnerHTML,
	toggleVisibility: toggleVisibility,
	remAttr: remAttr,
	styleObjectToString: styleObjectToString,
	getAttr: getAttr,
	setAttr: setAttr,
	safeInsert: safeInsert,
	walkAttrs: walkAttrs,
	walkNodes: walkNodes
});

// node_modules/riot/lib/browser/tag/styleManager.js
let styleNode;
// Create cache and shortcut to the correct property
let cssTextProp;
let byName = {};
let remainder = [];
let needsInject = false;

// skip the following code on the server
if (WIN) {
  styleNode = ((() => {
    // create a new style element with the correct type
    const newNode = mkEl('style');
    setAttr(newNode, 'type', 'text/css');

    // replace any user node or insert the new one into the head
    const userNode = $$1('style[type=riot]');
    /* istanbul ignore next */
    if (userNode) {
      if (userNode.id) newNode.id = userNode.id;
      userNode.parentNode.replaceChild(newNode, userNode);
    }
    else document.getElementsByTagName('head')[0].appendChild(newNode);

    return newNode
  }))();
  cssTextProp = styleNode.styleSheet;
}

/**
 * Object that will be used to inject and manage the css of every tag instance
 */
var styleManager = {
  styleNode,
  /**
   * Save a tag style to be later injected into DOM
   * @param { String } css - css string
   * @param { String } name - if it's passed we will map the css to a tagname
   */
  add(css, name) {
    if (name) byName[name] = css;
    else remainder.push(css);
    needsInject = true;
  },
  /**
   * Inject all previously saved tag styles into DOM
   * innerHTML seems slow: http://jsperf.com/riot-insert-style
   */
  inject() {
    if (!WIN || !needsInject) return
    needsInject = false;
    const style = Object.keys(byName)
      .map(k => byName[k])
      .concat(remainder).join('\n');
    /* istanbul ignore next */
    if (cssTextProp) cssTextProp.cssText = style;
    else styleNode.innerHTML = style;
  }
};

// node_modules/riot-tmpl/dist/es6.tmpl.js

/**
 * The riot template engine
 * @version v3.0.8
 */

var skipRegex = (function () { //eslint-disable-line no-unused-vars

  var beforeReChars = '[{(,;:?=|&!^~>%*/';

  var beforeReWords = [
    'case',
    'default',
    'do',
    'else',
    'in',
    'instanceof',
    'prefix',
    'return',
    'typeof',
    'void',
    'yield'
  ];

  var wordsLastChar = beforeReWords.reduce(function (s, w) {
    return s + w.slice(-1)
  }, '');

  var RE_REGEX = /^\/(?=[^*>/])[^[/\\]*(?:(?:\\.|\[(?:\\.|[^\]\\]*)*\])[^[\\/]*)*?\/[gimuy]*/;
  var RE_VN_CHAR = /[$\w]/;

  function prev (code, pos) {
    while (--pos >= 0 && /\s/.test(code[pos]));
    return pos
  }

  function _skipRegex (code, start) {

    var re = /.*/g;
    var pos = re.lastIndex = start++;
    var match = re.exec(code)[0].match(RE_REGEX);

    if (match) {
      var next = pos + match[0].length;

      pos = prev(code, pos);
      var c = code[pos];

      if (pos < 0 || ~beforeReChars.indexOf(c)) {
        return next
      }

      if (c === '.') {

        if (code[pos - 1] === '.') {
          start = next;
        }

      } else if (c === '+' || c === '-') {

        if (code[--pos] !== c ||
            (pos = prev(code, pos)) < 0 ||
            !RE_VN_CHAR.test(code[pos])) {
          start = next;
        }

      } else if (~wordsLastChar.indexOf(c)) {

        var end = pos + 1;

        while (--pos >= 0 && RE_VN_CHAR.test(code[pos]));
        if (~beforeReWords.indexOf(code.slice(pos + 1, end))) {
          start = next;
        }
      }
    }

    return start
  }

  return _skipRegex

})();

/**
 * riot.util.brackets
 *
 * - `brackets    ` - Returns a string or regex based on its parameter
 * - `brackets.set` - Change the current riot brackets
 *
 * @module
 */

/* global riot */

var brackets = (function (UNDEF) {

  var
    REGLOB = 'g',

    R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,

    R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,

    S_QBLOCKS = R_STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?([^<]\/)[gim]*/.source,

    UNSUPPORTED = RegExp('[\\' + 'x00-\\x1F<>a-zA-Z0-9\'",;\\\\]'),

    NEED_ESCAPE = /(?=[[\]()*+?.^$|])/g,

    S_QBLOCK2 = R_STRINGS.source + '|' + /(\/)(?![*\/])/.source,

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBLOCK2, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBLOCK2, REGLOB),
      '{': RegExp('([{}])|'   + S_QBLOCK2, REGLOB)
    },

    DEFAULT = '{ }';

  var _pairs = [
    '{', '}',
    '{', '}',
    /{[^}]*}/,
    /\\([{}])/g,
    /\\({)|{/g,
    RegExp('\\\\(})|([[({])|(})|' + S_QBLOCK2, REGLOB),
    DEFAULT,
    /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,
    /(^|[^\\]){=[\S\s]*?}/
  ];

  var
    cachedBrackets = UNDEF,
    _regex,
    _cache = [],
    _settings;

  function _loopback (re) { return re }

  function _rewrite (re, bp) {
    if (!bp) bp = _cache;
    return new RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  function _create (pair) {
    if (pair === DEFAULT) return _pairs

    var arr = pair.split(' ');

    if (arr.length !== 2 || UNSUPPORTED.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    arr = arr.concat(pair.replace(NEED_ESCAPE, '\\').split(' '));

    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr);
    arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr);
    arr[6] = _rewrite(_pairs[6], arr);
    arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCK2, REGLOB);
    arr[8] = pair;
    return arr
  }

  function _brackets (reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx]
  }

  _brackets.split = function split (str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) _bp = _cache;

    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _bp[6];

    var qblocks = [];
    var prevStr = '';
    var mark, lastIndex;

    isexpr = start = re.lastIndex = 0;

    while ((match = re.exec(str))) {

      lastIndex = re.lastIndex;
      pos = match.index;

      if (isexpr) {

        if (match[2]) {

          var ch = match[2];
          var rech = FINDBRACES[ch];
          var ix = 1;

          rech.lastIndex = lastIndex;
          while ((match = rech.exec(str))) {
            if (match[1]) {
              if (match[1] === ch) ++ix;
              else if (!--ix) break
            } else {
              rech.lastIndex = pushQBlock(match.index, rech.lastIndex, match[2]);
            }
          }
          re.lastIndex = ix ? str.length : rech.lastIndex;
          continue
        }

        if (!match[3]) {
          re.lastIndex = pushQBlock(pos, lastIndex, match[4]);
          continue
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos));
        start = re.lastIndex;
        re = _bp[6 + (isexpr ^= 1)];
        re.lastIndex = start;
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start));
    }

    parts.qblocks = qblocks;

    return parts

    function unescapeStr (s) {
      if (prevStr) {
        s = prevStr + s;
        prevStr = '';
      }
      if (tmpl || isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'));
      } else {
        parts.push(s);
      }
    }

    function pushQBlock(_pos, _lastIndex, slash) { //eslint-disable-line
      if (slash) {
        _lastIndex = skipRegex(str, _pos);
      }

      if (tmpl && _lastIndex > _pos + 2) {
        mark = '\u2057' + qblocks.length + '~';
        qblocks.push(str.slice(_pos, _lastIndex));
        prevStr += str.slice(start, _pos) + mark;
        start = _lastIndex;
      }
      return _lastIndex
    }
  };

  _brackets.hasExpr = function hasExpr (str) {
    return _cache[4].test(str)
  };

  _brackets.loopKeys = function loopKeys (expr) {
    var m = expr.match(_cache[9]);

    return m
      ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] }
      : { val: expr.trim() }
  };

  _brackets.array = function array (pair) {
    return pair ? _create(pair) : _cache
  };

  function _reset (pair) {
    if ((pair || (pair = DEFAULT)) !== _cache[8]) {
      _cache = _create(pair);
      _regex = pair === DEFAULT ? _loopback : _rewrite;
      _cache[9] = _regex(_pairs[9]);
    }
    cachedBrackets = pair;
  }

  function _setSettings (o) {
    var b;

    o = o || {};
    b = o.brackets;
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function () { return cachedBrackets },
      enumerable: true
    });
    _settings = o;
    _reset(b);
  }

  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function () { return _settings }
  });

  /* istanbul ignore next: in the browser riot is always in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {};
  _brackets.set = _reset;
  _brackets.skipRegex = skipRegex;

  _brackets.R_STRINGS = R_STRINGS;
  _brackets.R_MLCOMMS = R_MLCOMMS;
  _brackets.S_QBLOCKS = S_QBLOCKS;
  _brackets.S_QBLOCK2 = S_QBLOCK2;

  return _brackets

})();

/**
 * @module tmpl
 *
 * tmpl          - Root function, returns the template value, render with data
 * tmpl.hasExpr  - Test the existence of a expression inside a string
 * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
 */

var tmpl = (function () {

  var _cache = {};

  function _tmpl (str, data) {
    if (!str) return str

    return (_cache[str] || (_cache[str] = _create(str))).call(
      data, _logErr.bind({
        data: data,
        tmpl: str
      })
    )
  }

  _tmpl.hasExpr = brackets.hasExpr;

  _tmpl.loopKeys = brackets.loopKeys;

  // istanbul ignore next
  _tmpl.clearCache = function () { _cache = {}; };

  _tmpl.errorHandler = null;

  function _logErr (err, ctx) {

    err.riotData = {
      tagName: ctx && ctx.__ && ctx.__.tagName,
      _riot_id: ctx && ctx._riot_id  //eslint-disable-line camelcase
    };

    if (_tmpl.errorHandler) _tmpl.errorHandler(err);
    else if (
      typeof console !== 'undefined' &&
      typeof console.error === 'function'
    ) {
      console.error(err.message);
      console.log('<%s> %s', err.riotData.tagName || 'Unknown tag', this.tmpl); // eslint-disable-line
      console.log(this.data); // eslint-disable-line
    }
  }

  function _create (str) {
    var expr = _getTmpl(str);

    if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr;

    return new Function('E', expr + ';')    // eslint-disable-line no-new-func
  }

  var RE_DQUOTE = /\u2057/g;
  var RE_QBMARK = /\u2057(\d+)~/g;

  function _getTmpl (str) {
    var parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1);
    var qstr = parts.qblocks;
    var expr;

    if (parts.length > 2 || parts[0]) {
      var i, j, list = [];

      for (i = j = 0; i < parts.length; ++i) {

        expr = parts[i];

        if (expr && (expr = i & 1

            ? _parseExpr(expr, 1, qstr)

            : '"' + expr
                .replace(/\\/g, '\\\\')
                .replace(/\r\n?|\n/g, '\\n')
                .replace(/"/g, '\\"') +
              '"'

          )) list[j++] = expr;

      }

      expr = j < 2 ? list[0]
           : '[' + list.join(',') + '].join("")';

    } else {

      expr = _parseExpr(parts[1], 0, qstr);
    }

    if (qstr.length) {
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos]
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
      });
    }
    return expr
  }

  var RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/;
  var
    RE_BREND = {
      '(': /[()]/g,
      '[': /[[\]]/g,
      '{': /[{}]/g
    };

  function _parseExpr (expr, asText, qstr) {

    expr = expr
      .replace(/\s+/g, ' ').trim()
      .replace(/\ ?([[\({},?\.:])\ ?/g, '$1');

    if (expr) {
      var
        list = [],
        cnt = 0,
        match;

      while (expr &&
            (match = expr.match(RE_CSNAME)) &&
            !match.index
        ) {
        var
          key,
          jsb,
          re = /,|([[{(])|$/g;

        expr = RegExp.rightContext;
        key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1];

        while (jsb = (match = re.exec(expr))[1]) skipBraces(jsb, re);

        jsb  = expr.slice(0, match.index);
        expr = RegExp.rightContext;

        list[cnt++] = _wrapExpr(jsb, 1, key);
      }

      expr = !cnt ? _wrapExpr(expr, asText)
           : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0];
    }
    return expr

    function skipBraces (ch, re) {
      var
        mm,
        lv = 1,
        ir = RE_BREND[ch];

      ir.lastIndex = re.lastIndex;
      while (mm = ir.exec(expr)) {
        if (mm[0] === ch) ++lv;
        else if (!--lv) break
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex;
    }
  }

  // istanbul ignore next: not both
  var // eslint-disable-next-line max-len
    JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').',
    JS_VARNAME = /[,{][\$\w]+(?=:)|(^ *|[^$\w\.{])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
    JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/;

  function _wrapExpr (expr, asText, key) {
    var tb;

    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length;

        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar;
          if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '[';
        } else if (pos) {
          tb = !JS_NOPROPS.test(s.slice(pos));
        }
      }
      return match
    });

    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}';
    }

    if (key) {

      expr = (tb
          ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')'
        ) + '?"' + key + '":""';

    } else if (asText) {

      expr = 'function(v){' + (tb
          ? expr.replace('return ', 'v=') : 'v=(' + expr + ')'
        ) + ';return v||v===0?v:""}.call(this)';
    }

    return expr
  }

  _tmpl.version = brackets.version = 'v3.0.8';

  return _tmpl

})();

// node_modules/riot-observable/dist/es6.observable.js
var observable$1 = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {};

  /**
   * Private variables
   */
  var callbacks = {},
    slice = Array.prototype.slice;

  /**
   * Public Api
   */

  // extend the el object adding the observable methods
  Object.defineProperties(el, {
    /**
     * Listen to the given `event` ands
     * execute the `callback` each time an event is triggered.
     * @param  { String } event - event id
     * @param  { Function } fn - callback function
     * @returns { Object } el
     */
    on: {
      value: function(event, fn) {
        if (typeof fn == 'function')
          (callbacks[event] = callbacks[event] || []).push(fn);
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Removes the given `event` listeners
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    off: {
      value: function(event, fn) {
        if (event == '*' && !fn) callbacks = {};
        else {
          if (fn) {
            var arr = callbacks[event];
            for (var i = 0, cb; cb = arr && arr[i]; ++i) {
              if (cb == fn) arr.splice(i--, 1);
            }
          } else delete callbacks[event];
        }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Listen to the given `event` and
     * execute the `callback` at most once
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    one: {
      value: function(event, fn) {
        function on() {
          el.off(event, on);
          fn.apply(el, arguments);
        }
        return el.on(event, on)
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Execute all callback functions that listen to
     * the given `event`
     * @param   { String } event - event id
     * @returns { Object } el
     */
    trigger: {
      value: function(event) {

        // getting the arguments
        var arglen = arguments.length - 1,
          args = new Array(arglen),
          fns,
          fn,
          i;

        for (i = 0; i < arglen; i++) {
          args[i] = arguments[i + 1]; // skip first argument
        }

        fns = slice.call(callbacks[event] || [], 0);

        for (i = 0; fn = fns[i]; ++i) {
          fn.apply(el, args);
        }

        if (callbacks['*'] && event != '*')
          el.trigger.apply(el, ['*', event].concat(args));

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  });

  return el

};

// node_modules/riot/lib/browser/common/util/misc.js
/**
 * Specialized function for looping an array-like collection with `each={}`
 * @param   { Array } list - collection of items
 * @param   {Function} fn - callback function
 * @returns { Array } the array looped
 */
function each(list, fn) {
  const len = list ? list.length : 0;
  let i = 0;
  for (; i < len; ++i) {
    fn(list[i], i);
  }
  return list
}

/**
 * Check whether an array contains an item
 * @param   { Array } array - target array
 * @param   { * } item - item to test
 * @returns { Boolean } -
 */
function contains(array, item) {
  return array.indexOf(item) !== -1
}

/**
 * Convert a string containing dashes to camel case
 * @param   { String } str - input string
 * @returns { String } my-string -> myString
 */
function toCamel(str) {
  return str.replace(/-(\w)/g, (_, c) => c.toUpperCase())
}

/**
 * Faster String startsWith alternative
 * @param   { String } str - source string
 * @param   { String } value - test string
 * @returns { Boolean } -
 */
function startsWith(str, value) {
  return str.slice(0, value.length) === value
}

/**
 * Helper function to set an immutable property
 * @param   { Object } el - object where the new property will be set
 * @param   { String } key - object key where the new property will be stored
 * @param   { * } value - value of the new property
 * @param   { Object } options - set the propery overriding the default options
 * @returns { Object } - the initial object
 */
function defineProperty(el, key, value, options) {
  Object.defineProperty(el, key, extend$2({
    value,
    enumerable: false,
    writable: false,
    configurable: true
  }, options));
  return el
}

/**
 * Extend any object with other properties
 * @param   { Object } src - source object
 * @returns { Object } the resulting extended object
 *
 * var obj = { foo: 'baz' }
 * extend(obj, {bar: 'bar', foo: 'bar'})
 * console.log(obj) => {bar: 'bar', foo: 'bar'}
 *
 */
function extend$2(src) {
  let obj;
  const args = arguments;
  for (let i = 1; i < args.length; ++i) {
    if (obj = args[i]) {
      for (const key in obj) {
        // check if this property of the source object could be overridden
        if (isWritable(src, key))
          src[key] = obj[key];
      }
    }
  }
  return src
}

var misc = Object.freeze({
	each: each,
	contains: contains,
	toCamel: toCamel,
	startsWith: startsWith,
	defineProperty: defineProperty,
	extend: extend$2
});

// node_modules/riot/lib/settings.js
var settings$1 = extend$2(Object.create(brackets.settings), {
  skipAnonymousTags: true,
  // handle the auto updates on any DOM event
  autoUpdate: true
});

// node_modules/riot/lib/browser/tag/setEventHandler.js
/**
 * Trigger DOM events
 * @param   { HTMLElement } dom - dom element target of the event
 * @param   { Function } handler - user function
 * @param   { Object } e - event object
 */
function handleEvent(dom, handler, e) {
  let ptag = this.__.parent;
  let item = this.__.item;

  if (!item)
    while (ptag && !item) {
      item = ptag.__.item;
      ptag = ptag.__.parent;
    }

  // override the event properties
  /* istanbul ignore next */
  if (isWritable(e, 'currentTarget')) e.currentTarget = dom;
  /* istanbul ignore next */
  if (isWritable(e, 'target')) e.target = e.srcElement;
  /* istanbul ignore next */
  if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode;

  e.item = item;

  handler.call(this, e);

  // avoid auto updates
  if (!settings$1.autoUpdate) return

  if (!e.preventUpdate) {
    const p = getImmediateCustomParentTag(this);
    // fixes #2083
    if (p.isMounted) p.update();
  }
}

/**
 * Attach an event to a DOM node
 * @param { String } name - event name
 * @param { Function } handler - event callback
 * @param { Object } dom - dom node
 * @param { Tag } tag - tag instance
 */
function setEventHandler(name, handler, dom, tag) {
  let eventName;
  const cb = handleEvent.bind(tag, dom, handler);

  // avoid to bind twice the same event
  // possible fix for #2332
  dom[name] = null;

  // normalize event name
  eventName = name.replace(RE_EVENTS_PREFIX, '');

  // cache the listener into the listeners array
  if (!contains(tag.__.listeners, dom)) tag.__.listeners.push(dom);
  if (!dom[RIOT_EVENTS_KEY]) dom[RIOT_EVENTS_KEY] = {};
  if (dom[RIOT_EVENTS_KEY][name]) dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][name]);

  dom[RIOT_EVENTS_KEY][name] = cb;
  dom.addEventListener(eventName, cb, false);
}

// node_modules/riot/lib/browser/tag/update.js
/**
 * Update dynamically created data-is tags with changing expressions
 * @param { Object } expr - expression tag and expression info
 * @param { Tag }    parent - parent for tag creation
 * @param { String } tagName - tag implementation we want to use
 */
function updateDataIs(expr, parent, tagName) {
  let tag = expr.tag || expr.dom._tag,
    ref;

  const { head } = tag ? tag.__ : {};
  const isVirtual = expr.dom.tagName === 'VIRTUAL';

  if (tag && expr.tagName === tagName) {
    tag.update();
    return
  }

  // sync _parent to accommodate changing tagnames
  if (tag) {
    // need placeholder before unmount
    if(isVirtual) {
      ref = createDOMPlaceholder();
      head.parentNode.insertBefore(ref, head);
    }

    tag.unmount(true);
  }

  // unable to get the tag name
  if (!isString(tagName)) return

  expr.impl = __TAG_IMPL[tagName];

  // unknown implementation
  if (!expr.impl) return

  expr.tag = tag = initChildTag(
    expr.impl, {
      root: expr.dom,
      parent: parent,
      tagName: tagName
    },
    expr.dom.innerHTML,
    parent
  );

  each(expr.attrs, a => setAttr(tag.root, a.name, a.value));
  expr.tagName = tagName;
  tag.mount();

  // root exist first time, after use placeholder
  if (isVirtual) makeReplaceVirtual(tag, ref || tag.root);

  // parent is the placeholder tag, not the dynamic tag so clean up
  parent.__.onUnmount = function() {
    const delName = tag.opts.dataIs;
    arrayishRemove(tag.parent.tags, delName, tag);
    arrayishRemove(tag.__.parent.tags, delName, tag);
    tag.unmount();
  };
}

/**
 * Nomalize any attribute removing the "riot-" prefix
 * @param   { String } attrName - original attribute name
 * @returns { String } valid html attribute name
 */
function normalizeAttrName(attrName) {
  if (!attrName) return null
  attrName = attrName.replace(ATTRS_PREFIX, '');
  if (CASE_SENSITIVE_ATTRIBUTES[attrName]) attrName = CASE_SENSITIVE_ATTRIBUTES[attrName];
  return attrName
}

/**
 * Update on single tag expression
 * @this Tag
 * @param { Object } expr - expression logic
 * @returns { undefined }
 */
function updateExpression(expr) {
  if (this.root && getAttr(this.root,'virtualized')) return

  var dom = expr.dom,
    // remove the riot- prefix
    attrName = normalizeAttrName(expr.attr),
    isToggle = contains([SHOW_DIRECTIVE, HIDE_DIRECTIVE], attrName),
    isVirtual = expr.root && expr.root.tagName === 'VIRTUAL',
    parent = dom && (expr.parent || dom.parentNode),
    // detect the style attributes
    isStyleAttr = attrName === 'style',
    isClassAttr = attrName === 'class',
    hasValue,
    isObj,
    value;

  // if it's a tag we could totally skip the rest
  if (expr._riot_id) {
    if (expr.isMounted) {
      expr.update();
    // if it hasn't been mounted yet, do that now.
    } else {
      expr.mount();
      if (isVirtual) {
        makeReplaceVirtual(expr, expr.root);
      }
    }
    return
  }
  // if this expression has the update method it means it can handle the DOM changes by itself
  if (expr.update) return expr.update()

  // ...it seems to be a simple expression so we try to calculat its value
  value = tmpl(expr.expr, isToggle ? extend$2({}, Object.create(this.parent), this) : this);
  hasValue = !isBlank(value);
  isObj = isObject(value);

  // convert the style/class objects to strings
  if (isObj) {
    isObj = !isClassAttr && !isStyleAttr;
    if (isClassAttr) {
      value = tmpl(JSON.stringify(value), this);
    } else if (isStyleAttr) {
      value = styleObjectToString(value);
    }
  }

  // remove original attribute
  if (expr.attr && (!expr.isAttrRemoved || !hasValue || value === false)) {
    remAttr(dom, expr.attr);
    expr.isAttrRemoved = true;
  }

  // for the boolean attributes we don't need the value
  // we can convert it to checked=true to checked=checked
  if (expr.bool) value = value ? attrName : false;
  if (expr.isRtag) return updateDataIs(expr, this, value)
  if (expr.wasParsedOnce && expr.value === value) return

  // update the expression value
  expr.value = value;
  expr.wasParsedOnce = true;

  // if the value is an object we can not do much more with it
  if (isObj && !isToggle) return
  // avoid to render undefined/null values
  if (isBlank(value)) value = '';

  // textarea and text nodes have no attribute name
  if (!attrName) {
    // about #815 w/o replace: the browser converts the value to a string,
    // the comparison by "==" does too, but not in the server
    value += '';
    // test for parent avoids error with invalid assignment to nodeValue
    if (parent) {
      // cache the parent node because somehow it will become null on IE
      // on the next iteration
      expr.parent = parent;
      if (parent.tagName === 'TEXTAREA') {
        parent.value = value;                    // #1113
        if (!IE_VERSION) dom.nodeValue = value;  // #1625 IE throws here, nodeValue
      }                                         // will be available on 'updated'
      else dom.nodeValue = value;
    }
    return
  }


  // event handler
  if (isFunction$2(value)) {
    setEventHandler(attrName, value, dom, this);
  // show / hide
  } else if (isToggle) {
    toggleVisibility(dom, attrName === HIDE_DIRECTIVE ? !value : value);
  // handle attributes
  } else {
    if (expr.bool) {
      dom[attrName] = value;
    }

    if (attrName === 'value' && dom.value !== value) {
      dom.value = value;
    }

    if (hasValue && value !== false) {
      setAttr(dom, attrName, value);
    }

    // make sure that in case of style changes
    // the element stays hidden
    if (isStyleAttr && dom.hidden) toggleVisibility(dom, false);
  }
}

/**
 * Update all the expressions in a Tag instance
 * @this Tag
 * @param { Array } expressions - expression that must be re evaluated
 */
function updateAllExpressions(expressions) {
  each(expressions, updateExpression.bind(this));
}

// node_modules/riot/lib/browser/tag/if.js
var IfExpr = {
  init(dom, tag, expr) {
    remAttr(dom, CONDITIONAL_DIRECTIVE);
    this.tag = tag;
    this.expr = expr;
    this.stub = createDOMPlaceholder();
    this.pristine = dom;

    const p = dom.parentNode;
    p.insertBefore(this.stub, dom);
    p.removeChild(dom);

    return this
  },
  update() {
    this.value = tmpl(this.expr, this.tag);

    if (this.value && !this.current) { // insert
      this.current = this.pristine.cloneNode(true);
      this.stub.parentNode.insertBefore(this.current, this.stub);
      this.expressions = [];
      parseExpressions.apply(this.tag, [this.current, this.expressions, true]);
    } else if (!this.value && this.current) { // remove
      unmountAll(this.expressions);
      if (this.current._tag) {
        this.current._tag.unmount();
      } else if (this.current.parentNode) {
        this.current.parentNode.removeChild(this.current);
      }
      this.current = null;
      this.expressions = [];
    }

    if (this.value) updateAllExpressions.call(this.tag, this.expressions);
  },
  unmount() {
    unmountAll(this.expressions || []);
  }
};

// node_modules/riot/lib/browser/tag/ref.js
var RefExpr = {
  init(dom, parent, attrName, attrValue) {
    this.dom = dom;
    this.attr = attrName;
    this.rawValue = attrValue;
    this.parent = parent;
    this.hasExp = tmpl.hasExpr(attrValue);
    return this
  },
  update() {
    const old = this.value;
    const customParent = this.parent && getImmediateCustomParentTag(this.parent);
    // if the referenced element is a custom tag, then we set the tag itself, rather than DOM
    const tagOrDom = this.dom.__ref || this.tag || this.dom;

    this.value = this.hasExp ? tmpl(this.rawValue, this.parent) : this.rawValue;

    // the name changed, so we need to remove it from the old key (if present)
    if (!isBlank(old) && customParent) arrayishRemove(customParent.refs, old, tagOrDom);
    if (!isBlank(this.value) && isString(this.value)) {
      // add it to the refs of parent tag (this behavior was changed >=3.0)
      if (customParent) arrayishAdd(
        customParent.refs,
        this.value,
        tagOrDom,
        // use an array if it's a looped node and the ref is not an expression
        null,
        this.parent.__.index
      );

      if (this.value !== old) {
        setAttr(this.dom, this.attr, this.value);
      }
    } else {
      remAttr(this.dom, this.attr);
    }

    // cache the ref bound to this dom node
    // to reuse it in future (see also #2329)
    if (!this.dom.__ref) this.dom.__ref = tagOrDom;
  },
  unmount() {
    const tagOrDom = this.tag || this.dom;
    const customParent = this.parent && getImmediateCustomParentTag(this.parent);
    if (!isBlank(this.value) && customParent)
      arrayishRemove(customParent.refs, this.value, tagOrDom);
  }
};

// node_modules/riot/lib/browser/tag/each.js
/**
 * Convert the item looped into an object used to extend the child tag properties
 * @param   { Object } expr - object containing the keys used to extend the children tags
 * @param   { * } key - value to assign to the new object returned
 * @param   { * } val - value containing the position of the item in the array
 * @param   { Object } base - prototype object for the new item
 * @returns { Object } - new object containing the values of the original item
 *
 * The variables 'key' and 'val' are arbitrary.
 * They depend on the collection type looped (Array, Object)
 * and on the expression used on the each tag
 *
 */
function mkitem(expr, key, val, base) {
  const item = base ? Object.create(base) : {};
  item[expr.key] = key;
  if (expr.pos) item[expr.pos] = val;
  return item
}

/**
 * Unmount the redundant tags
 * @param   { Array } items - array containing the current items to loop
 * @param   { Array } tags - array containing all the children tags
 */
function unmountRedundant(items, tags) {
  let i = tags.length;
  const j = items.length;

  while (i > j) {
    i--;
    remove.apply(tags[i], [tags, i]);
  }
}


/**
 * Remove a child tag
 * @this Tag
 * @param   { Array } tags - tags collection
 * @param   { Number } i - index of the tag to remove
 */
function remove(tags, i) {
  tags.splice(i, 1);
  this.unmount();
  arrayishRemove(this.parent, this, this.__.tagName, true);
}

/**
 * Move the nested custom tags in non custom loop tags
 * @this Tag
 * @param   { Number } i - current position of the loop tag
 */
function moveNestedTags(i) {
  each(Object.keys(this.tags), (tagName) => {
    moveChildTag.apply(this.tags[tagName], [tagName, i]);
  });
}

/**
 * Move a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to move
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function move(root, nextTag, isVirtual) {
  if (isVirtual)
    moveVirtual.apply(this, [root, nextTag]);
  else
    safeInsert(root, this.root, nextTag.root);
}

/**
 * Insert and mount a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to insert
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function insert(root, nextTag, isVirtual) {
  if (isVirtual)
    makeVirtual.apply(this, [root, nextTag]);
  else
    safeInsert(root, this.root, nextTag.root);
}

/**
 * Append a new tag into the DOM
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function append(root, isVirtual) {
  if (isVirtual)
    makeVirtual.call(this, root);
  else
    root.appendChild(this.root);
}

/**
 * Manage tags having the 'each'
 * @param   { HTMLElement } dom - DOM node we need to loop
 * @param   { Tag } parent - parent tag instance where the dom node is contained
 * @param   { String } expr - string contained in the 'each' attribute
 * @returns { Object } expression object for this each loop
 */
function _each(dom, parent, expr) {
  const mustReorder = typeof getAttr(dom, LOOP_NO_REORDER_DIRECTIVE) !== T_STRING || remAttr(dom, LOOP_NO_REORDER_DIRECTIVE);
  const tagName = getTagName(dom);
  const impl = __TAG_IMPL[tagName];
  const parentNode = dom.parentNode;
  const placeholder = createDOMPlaceholder();
  const child = getTag(dom);
  const ifExpr = getAttr(dom, CONDITIONAL_DIRECTIVE);
  const tags = [];
  const isLoop = true;
  const isAnonymous = !__TAG_IMPL[tagName];
  const isVirtual = dom.tagName === 'VIRTUAL';
  let oldItems = [];
  let hasKeys;

  // remove the each property from the original tag
  remAttr(dom, LOOP_DIRECTIVE);

  // parse the each expression
  expr = tmpl.loopKeys(expr);
  expr.isLoop = true;

  if (ifExpr) remAttr(dom, CONDITIONAL_DIRECTIVE);

  // insert a marked where the loop tags will be injected
  parentNode.insertBefore(placeholder, dom);
  parentNode.removeChild(dom);

  expr.update = function updateEach() {
    // get the new items collection
    expr.value = tmpl(expr.val, parent);

    let items = expr.value;
    const frag = createFrag();
    const isObject$$1 = !isArray(items) && !isString(items);
    const root = placeholder.parentNode;

    // if this DOM was removed the update here is useless
    // this condition fixes also a weird async issue on IE in our unit test
    if (!root) return

    // object loop. any changes cause full redraw
    if (isObject$$1) {
      hasKeys = items || false;
      items = hasKeys ?
        Object.keys(items).map(key => mkitem(expr, items[key], key)) : [];
    } else {
      hasKeys = false;
    }

    if (ifExpr) {
      items = items.filter((item, i) => {
        if (expr.key && !isObject$$1)
          return !!tmpl(ifExpr, mkitem(expr, item, i, parent))

        return !!tmpl(ifExpr, extend$2(Object.create(parent), item))
      });
    }

    // loop all the new items
    each(items, (item, i) => {
      // reorder only if the items are objects
      const doReorder = mustReorder && typeof item === T_OBJECT && !hasKeys;
      const oldPos = oldItems.indexOf(item);
      const isNew = oldPos === -1;
      const pos = !isNew && doReorder ? oldPos : i;
      // does a tag exist in this position?
      let tag = tags[pos];
      const mustAppend = i >= oldItems.length;
      const mustCreate =  doReorder && isNew || !doReorder && !tag;

      item = !hasKeys && expr.key ? mkitem(expr, item, i) : item;

      // new tag
      if (mustCreate) {
        tag = new Tag$1(impl, {
          parent,
          isLoop,
          isAnonymous,
          tagName,
          root: dom.cloneNode(isAnonymous),
          item,
          index: i,
        }, dom.innerHTML);

        // mount the tag
        tag.mount();

        if (mustAppend)
          append.apply(tag, [frag || root, isVirtual]);
        else
          insert.apply(tag, [root, tags[i], isVirtual]);

        if (!mustAppend) oldItems.splice(i, 0, item);
        tags.splice(i, 0, tag);
        if (child) arrayishAdd(parent.tags, tagName, tag, true);
      } else if (pos !== i && doReorder) {
        // move
        if (contains(items, oldItems[pos])) {
          move.apply(tag, [root, tags[i], isVirtual]);
          // move the old tag instance
          tags.splice(i, 0, tags.splice(pos, 1)[0]);
          // move the old item
          oldItems.splice(i, 0, oldItems.splice(pos, 1)[0]);
        }

        // update the position attribute if it exists
        if (expr.pos) tag[expr.pos] = i;

        // if the loop tags are not custom
        // we need to move all their custom tags into the right position
        if (!child && tag.tags) moveNestedTags.call(tag, i);
      }

      // cache the original item to use it in the events bound to this node
      // and its children
      tag.__.item = item;
      tag.__.index = i;
      tag.__.parent = parent;

      if (!mustCreate) tag.update(item);
    });

    // remove the redundant tags
    unmountRedundant(items, tags);

    // clone the items array
    oldItems = items.slice();

    root.insertBefore(frag, placeholder);
  };

  expr.unmount = () => {
    each(tags, t => { t.unmount(); });
  };

  return expr
}

// node_modules/riot/lib/browser/tag/parse.js
/**
 * Walk the tag DOM to detect the expressions to evaluate
 * @this Tag
 * @param   { HTMLElement } root - root tag where we will start digging the expressions
 * @param   { Array } expressions - empty array where the expressions will be added
 * @param   { Boolean } mustIncludeRoot - flag to decide whether the root must be parsed as well
 * @returns { Object } an object containing the root noode and the dom tree
 */
function parseExpressions(root, expressions, mustIncludeRoot) {
  const tree = {parent: {children: expressions}};

  walkNodes(root, (dom, ctx) => {
    let type = dom.nodeType,
      parent = ctx.parent,
      attr,
      expr,
      tagImpl;

    if (!mustIncludeRoot && dom === root) return {parent}

    // text node
    if (type === 3 && dom.parentNode.tagName !== 'STYLE' && tmpl.hasExpr(dom.nodeValue))
      parent.children.push({dom, expr: dom.nodeValue});

    if (type !== 1) return ctx // not an element

    const isVirtual = dom.tagName === 'VIRTUAL';

    // loop. each does it's own thing (for now)
    if (attr = getAttr(dom, LOOP_DIRECTIVE)) {
      if(isVirtual) setAttr(dom, 'loopVirtual', true); // ignore here, handled in _each
      parent.children.push(_each(dom, this, attr));
      return false
    }

    // if-attrs become the new parent. Any following expressions (either on the current
    // element, or below it) become children of this expression.
    if (attr = getAttr(dom, CONDITIONAL_DIRECTIVE)) {
      parent.children.push(Object.create(IfExpr).init(dom, this, attr));
      return false
    }

    if (expr = getAttr(dom, IS_DIRECTIVE)) {
      if (tmpl.hasExpr(expr)) {
        parent.children.push({
          isRtag: true,
          expr,
          dom,
          attrs: [].slice.call(dom.attributes)
        });
        return false
      }
    }

    // if this is a tag, stop traversing here.
    // we ignore the root, since parseExpressions is called while we're mounting that root
    tagImpl = getTag(dom);
    if(isVirtual) {
      if(getAttr(dom, 'virtualized')) {dom.parentElement.removeChild(dom); } // tag created, remove from dom
      if(!tagImpl && !getAttr(dom, 'virtualized') && !getAttr(dom, 'loopVirtual'))  // ok to create virtual tag
        tagImpl = { tmpl: dom.outerHTML };
    }

    if (tagImpl && (dom !== root || mustIncludeRoot)) {
      if(isVirtual && !getAttr(dom, IS_DIRECTIVE)) { // handled in update
        // can not remove attribute like directives
        // so flag for removal after creation to prevent maximum stack error
        setAttr(dom, 'virtualized', true);
        const tag = new Tag$1(
          {tmpl: dom.outerHTML},
          {root: dom, parent: this},
          dom.innerHTML
        );
        parent.children.push(tag); // no return, anonymous tag, keep parsing
      } else {
        parent.children.push(
          initChildTag(
            tagImpl,
            {
              root: dom,
              parent: this
            },
            dom.innerHTML,
            this
          )
        );
        return false
      }
    }

    // attribute expressions
    parseAttributes.apply(this, [dom, dom.attributes, (attr, expr) => {
      if (!expr) return
      parent.children.push(expr);
    }]);

    // whatever the parent is, all child elements get the same parent.
    // If this element had an if-attr, that's the parent for all child elements
    return {parent}
  }, tree);
}

/**
 * Calls `fn` for every attribute on an element. If that attr has an expression,
 * it is also passed to fn.
 * @this Tag
 * @param   { HTMLElement } dom - dom node to parse
 * @param   { Array } attrs - array of attributes
 * @param   { Function } fn - callback to exec on any iteration
 */
function parseAttributes(dom, attrs, fn) {
  each(attrs, (attr) => {
    if (!attr) return false

    const name = attr.name;
    const bool = isBoolAttr(name);
    let expr;

    if (contains(REF_DIRECTIVES, name)) {
      expr =  Object.create(RefExpr).init(dom, this, name, attr.value);
    } else if (tmpl.hasExpr(attr.value)) {
      expr = {dom, expr: attr.value, attr: name, bool};
    }

    fn(attr, expr);
  });
}

// node_modules/riot/lib/browser/tag/mkdom.js
/*
  Includes hacks needed for the Internet Explorer version 9 and below
  See: http://kangax.github.io/compat-table/es5/#ie8
       http://codeplanet.io/dropping-ie8/
*/

const reHasYield  = /<yield\b/i;
const reYieldAll  = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig;
const reYieldSrc  = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig;
const reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig;
const rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' };
const tblTags = IE_VERSION && IE_VERSION < 10 ? RE_SPECIAL_TAGS : RE_SPECIAL_TAGS_NO_OPTION;
const GENERIC = 'div';
const SVG = 'svg';


/*
  Creates the root element for table or select child elements:
  tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
*/
function specialTags(el, tmpl, tagName) {

  let
    select = tagName[0] === 'o',
    parent = select ? 'select>' : 'table>';

  // trim() is important here, this ensures we don't have artifacts,
  // so we can check if we have only one element inside the parent
  el.innerHTML = '<' + parent + tmpl.trim() + '</' + parent;
  parent = el.firstChild;

  // returns the immediate parent if tr/th/td/col is the only element, if not
  // returns the whole tree, as this can include additional elements
  /* istanbul ignore next */
  if (select) {
    parent.selectedIndex = -1;  // for IE9, compatible w/current riot behavior
  } else {
    // avoids insertion of cointainer inside container (ex: tbody inside tbody)
    const tname = rootEls[tagName];
    if (tname && parent.childElementCount === 1) parent = $$1(tname, parent);
  }
  return parent
}

/*
  Replace the yield tag from any tag template with the innerHTML of the
  original tag in the page
*/
function replaceYield(tmpl, html) {
  // do nothing if no yield
  if (!reHasYield.test(tmpl)) return tmpl

  // be careful with #1343 - string on the source having `$1`
  const src = {};

  html = html && html.replace(reYieldSrc, function (_, ref, text) {
    src[ref] = src[ref] || text;   // preserve first definition
    return ''
  }).trim();

  return tmpl
    .replace(reYieldDest, function (_, ref, def) {  // yield with from - to attrs
      return src[ref] || def || ''
    })
    .replace(reYieldAll, function (_, def) {        // yield without any "from"
      return html || def || ''
    })
}

/**
 * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
 * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
 *
 * @param   { String } tmpl  - The template coming from the custom tag definition
 * @param   { String } html - HTML content that comes from the DOM element where you
 *           will mount the tag, mostly the original tag in the page
 * @param   { Boolean } isSvg - true if the root node is an svg
 * @returns { HTMLElement } DOM element with _tmpl_ merged through `YIELD` with the _html_.
 */
function mkdom(tmpl, html, isSvg$$1) {
  const match   = tmpl && tmpl.match(/^\s*<([-\w]+)/);
  const  tagName = match && match[1].toLowerCase();
  let el = mkEl(isSvg$$1 ? SVG : GENERIC);

  // replace all the yield tags with the tag inner html
  tmpl = replaceYield(tmpl, html);

  /* istanbul ignore next */
  if (tblTags.test(tagName))
    el = specialTags(el, tmpl, tagName);
  else
    setInnerHTML(el, tmpl);

  return el
}

// node_modules/riot/lib/browser/tag/core.js
/**
 * Another way to create a riot tag a bit more es6 friendly
 * @param { HTMLElement } el - tag DOM selector or DOM node/s
 * @param { Object } opts - tag logic
 * @returns { Tag } new riot tag instance
 */
function Tag$2(el, opts) {
  // get the tag properties from the class constructor
  const {name, tmpl, css, attrs, onCreate} = this;
  // register a new tag and cache the class prototype
  if (!__TAG_IMPL[name]) {
    tag$1(name, tmpl, css, attrs, onCreate);
    // cache the class constructor
    __TAG_IMPL[name].class = this.constructor;
  }

  // mount the tag using the class instance
  mountTo(el, name, opts, this);
  // inject the component css
  if (css) styleManager.inject();

  return this
}

/**
 * Create a new riot tag implementation
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag$1(name, tmpl, css, attrs, fn) {
  if (isFunction$2(attrs)) {
    fn = attrs;

    if (/^[\w-]+\s?=/.test(css)) {
      attrs = css;
      css = '';
    } else
      attrs = '';
  }

  if (css) {
    if (isFunction$2(css))
      fn = css;
    else
      styleManager.add(css);
  }

  name = name.toLowerCase();
  __TAG_IMPL[name] = { name, tmpl, attrs, fn };

  return name
}

/**
 * Create a new riot tag implementation (for use by the compiler)
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag2$1(name, tmpl, css, attrs, fn) {
  if (css) styleManager.add(css, name);

  __TAG_IMPL[name] = { name, tmpl, attrs, fn };

  return name
}

/**
 * Mount a tag using a specific tag implementation
 * @param   { * } selector - tag DOM selector or DOM node/s
 * @param   { String } tagName - tag implementation name
 * @param   { Object } opts - tag logic
 * @returns { Array } new tags instances
 */
function mount$1(selector, tagName, opts) {
  const tags = [];
  let elem, allTags;

  function pushTagsTo(root) {
    if (root.tagName) {
      let riotTag = getAttr(root, IS_DIRECTIVE), tag;

      // have tagName? force riot-tag to be the same
      if (tagName && riotTag !== tagName) {
        riotTag = tagName;
        setAttr(root, IS_DIRECTIVE, tagName);
      }

      tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts);

      if (tag)
        tags.push(tag);
    } else if (root.length)
      each(root, pushTagsTo); // assume nodeList
  }

  // inject styles into DOM
  styleManager.inject();

  if (isObject(tagName)) {
    opts = tagName;
    tagName = 0;
  }

  // crawl the DOM to find the tag
  if (isString(selector)) {
    selector = selector === '*' ?
      // select all registered tags
      // & tags found with the riot-tag attribute set
      allTags = selectTags() :
      // or just the ones named like the selector
      selector + selectTags(selector.split(/, */));

    // make sure to pass always a selector
    // to the querySelectorAll function
    elem = selector ? $$(selector) : [];
  }
  else
    // probably you have passed already a tag or a NodeList
    elem = selector;

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectTags();
    // if the root els it's just a single tag
    if (elem.tagName)
      elem = $$(tagName, elem);
    else {
      // select all the children for all the different root elements
      var nodeList = [];

      each(elem, _el => nodeList.push($$(tagName, _el)));

      elem = nodeList;
    }
    // get rid of the tagName
    tagName = 0;
  }

  pushTagsTo(elem);

  return tags
}

// Create a mixin that could be globally shared across all the tags
const mixins = {};
const globals = mixins[GLOBAL_MIXIN] = {};
let mixins_id = 0;

/**
 * Create/Return a mixin by its name
 * @param   { String }  name - mixin name (global mixin if object)
 * @param   { Object }  mix - mixin logic
 * @param   { Boolean } g - is global?
 * @returns { Object }  the mixin logic
 */
function mixin$1(name, mix, g) {
  // Unnamed global
  if (isObject(name)) {
    mixin$1(`__${mixins_id++}__`, name, true);
    return
  }

  const store = g ? globals : mixins;

  // Getter
  if (!mix) {
    if (isUndefined(store[name]))
      throw new Error(`Unregistered mixin: ${ name }`)

    return store[name]
  }

  // Setter
  store[name] = isFunction$2(mix) ?
    extend$2(mix.prototype, store[name] || {}) && mix :
    extend$2(store[name] || {}, mix);
}

/**
 * Update all the tags instances created
 * @returns { Array } all the tags instances
 */
function update$1() {
  return each(__TAGS_CACHE, tag => tag.update())
}

function unregister$1(name) {
  __TAG_IMPL[name] = null;
}

const version$1 = 'WIP';


var core = Object.freeze({
	Tag: Tag$2,
	tag: tag$1,
	tag2: tag2$1,
	mount: mount$1,
	mixin: mixin$1,
	update: update$1,
	unregister: unregister$1,
	version: version$1
});

// node_modules/riot/lib/browser/tag/tag.js
// counter to give a unique id to all the Tag instances
let uid = 0;

/**
 * We need to update opts for this tag. That requires updating the expressions
 * in any attributes on the tag, and then copying the result onto opts.
 * @this Tag
 * @param   {Boolean} isLoop - is it a loop tag?
 * @param   { Tag }  parent - parent tag node
 * @param   { Boolean }  isAnonymous - is it a tag without any impl? (a tag not registered)
 * @param   { Object }  opts - tag options
 * @param   { Array }  instAttrs - tag attributes array
 */
function updateOpts(isLoop, parent, isAnonymous, opts, instAttrs) {
  // isAnonymous `each` tags treat `dom` and `root` differently. In this case
  // (and only this case) we don't need to do updateOpts, because the regular parse
  // will update those attrs. Plus, isAnonymous tags don't need opts anyway
  if (isLoop && isAnonymous) return
  const ctx = !isAnonymous && isLoop ? this : parent || this;

  each(instAttrs, (attr) => {
    if (attr.expr) updateAllExpressions.call(ctx, [attr.expr]);
    // normalize the attribute names
    opts[toCamel(attr.name).replace(ATTRS_PREFIX, '')] = attr.expr ? attr.expr.value : attr.value;
  });
}


/**
 * Tag class
 * @constructor
 * @param { Object } impl - it contains the tag template, and logic
 * @param { Object } conf - tag options
 * @param { String } innerHTML - html that eventually we need to inject in the tag
 */
function Tag$1(impl = {}, conf = {}, innerHTML) {
  var opts = extend$2({}, conf.opts),
    parent = conf.parent,
    isLoop = conf.isLoop,
    isAnonymous = !!conf.isAnonymous,
    skipAnonymous = settings$1.skipAnonymousTags && isAnonymous,
    item = conf.item,
    index = conf.index, // available only for the looped nodes
    instAttrs = [], // All attributes on the Tag when it's first parsed
    implAttrs = [], // expressions on this type of Tag
    expressions = [],
    root = conf.root,
    tagName = conf.tagName || getTagName(root),
    isVirtual = tagName === 'virtual',
    isInline = !isVirtual && !impl.tmpl,
    propsInSyncWithParent = [],
    dom;

  // make this tag observable
  if (!skipAnonymous) observable$1(this);
  // only call unmount if we have a valid __TAG_IMPL (has name property)
  if (impl.name && root._tag) root._tag.unmount(true);

  // not yet mounted
  this.isMounted = false;

  defineProperty(this, '__', {
    isAnonymous,
    instAttrs,
    innerHTML,
    tagName,
    index,
    isLoop,
    isInline,
    // tags having event listeners
    // it would be better to use weak maps here but we can not introduce breaking changes now
    listeners: [],
    // these vars will be needed only for the virtual tags
    virts: [],
    tail: null,
    head: null,
    parent: null,
    item: null
  });

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  defineProperty(this, '_riot_id', ++uid); // base 1 allows test !t._riot_id
  defineProperty(this, 'root', root);
  extend$2(this, { opts }, item);
  // protect the "tags" and "refs" property from being overridden
  defineProperty(this, 'parent', parent || null);
  defineProperty(this, 'tags', {});
  defineProperty(this, 'refs', {});

  if (isInline || isLoop && isAnonymous) {
    dom = root;
  } else {
    if (!isVirtual) root.innerHTML = '';
    dom = mkdom(impl.tmpl, innerHTML, isSvg(root));
  }

  /**
   * Update the tag expressions and options
   * @param   { * }  data - data we want to use to extend the tag properties
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'update', function tagUpdate(data) {
    const nextOpts = {},
      canTrigger = this.isMounted && !skipAnonymous;

    extend$2(this, data);
    updateOpts.apply(this, [isLoop, parent, isAnonymous, nextOpts, instAttrs]);

    if (
      canTrigger &&
      this.isMounted &&
      isFunction$2(this.shouldUpdate) && !this.shouldUpdate(data, nextOpts)
    ) {
      return this
    }

    // inherit properties from the parent, but only for isAnonymous tags
    if (isLoop && isAnonymous) inheritFrom.apply(this, [this.parent, propsInSyncWithParent]);
    extend$2(opts, nextOpts);
    if (canTrigger) this.trigger('update', data);
    updateAllExpressions.call(this, expressions);
    if (canTrigger) this.trigger('updated');

    return this

  }.bind(this));

  /**
   * Add a mixin to this tag
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'mixin', function tagMixin() {
    each(arguments, (mix) => {
      let instance, obj;
      let props = [];

      // properties blacklisted and will not be bound to the tag instance
      const propsBlacklist = ['init', '__proto__'];

      mix = isString(mix) ? mixin$1(mix) : mix;

      // check if the mixin is a function
      if (isFunction$2(mix)) {
        // create the new mixin instance
        instance = new mix();
      } else instance = mix;

      const proto = Object.getPrototypeOf(instance);

      // build multilevel prototype inheritance chain property list
      do props = props.concat(Object.getOwnPropertyNames(obj || instance));
      while (obj = Object.getPrototypeOf(obj || instance))

      // loop the keys in the function prototype or the all object keys
      each(props, (key) => {
        // bind methods to this
        // allow mixins to override other properties/parent mixins
        if (!contains(propsBlacklist, key)) {
          // check for getters/setters
          const descriptor = Object.getOwnPropertyDescriptor(instance, key) || Object.getOwnPropertyDescriptor(proto, key);
          const hasGetterSetter = descriptor && (descriptor.get || descriptor.set);

          // apply method only if it does not already exist on the instance
          if (!this.hasOwnProperty(key) && hasGetterSetter) {
            Object.defineProperty(this, key, descriptor);
          } else {
            this[key] = isFunction$2(instance[key]) ?
              instance[key].bind(this) :
              instance[key];
          }
        }
      });

      // init method will be called automatically
      if (instance.init)
        instance.init.bind(this)();
    });
    return this
  }.bind(this));

  /**
   * Mount the current tag instance
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'mount', function tagMount() {
    root._tag = this; // keep a reference to the tag just created

    // Read all the attrs on this instance. This give us the info we need for updateOpts
    parseAttributes.apply(parent, [root, root.attributes, (attr, expr) => {
      if (!isAnonymous && RefExpr.isPrototypeOf(expr)) expr.tag = this;
      attr.expr = expr;
      instAttrs.push(attr);
    }]);

    // update the root adding custom attributes coming from the compiler
    implAttrs = [];
    walkAttrs(impl.attrs, (k, v) => { implAttrs.push({name: k, value: v}); });
    parseAttributes.apply(this, [root, implAttrs, (attr, expr) => {
      if (expr) expressions.push(expr);
      else setAttr(root, attr.name, attr.value);
    }]);

    // initialiation
    updateOpts.apply(this, [isLoop, parent, isAnonymous, opts, instAttrs]);

    // add global mixins
    const globalMixin = mixin$1(GLOBAL_MIXIN);

    if (globalMixin && !skipAnonymous) {
      for (var i in globalMixin) {
        if (globalMixin.hasOwnProperty(i)) {
          this.mixin(globalMixin[i]);
        }
      }
    }

    if (impl.fn) impl.fn.call(this, opts);

    if (!skipAnonymous) this.trigger('before-mount');

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions.apply(this, [dom, expressions, isAnonymous]);

    this.update(item);

    if (!isAnonymous && !isInline) {
      while (dom.firstChild) root.appendChild(dom.firstChild);
    }

    defineProperty(this, 'root', root);


    if (skipAnonymous) return

    // set the isMounted flag asynchronously
    this.one('mount', () => defineProperty(this, 'isMounted', true));

    // if it's not a child tag we can trigger its mount event
    if (!this.parent) {
      this.trigger('mount');
    }
    // otherwise we need to wait that the parent "mount" or "updated" event gets triggered
    else {
      const p = getImmediateCustomParentTag(this.parent);
      p.one(!p.isMounted ? 'mount' : 'updated', () => {
        this.trigger('mount');
      });
    }

    return this

  }.bind(this));

  /**
   * Unmount the tag instance
   * @param { Boolean } mustKeepRoot - if it's true the root node will not be removed
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'unmount', function tagUnmount(mustKeepRoot) {
    const el = this.root;
    const p = el.parentNode;
    const tagIndex = __TAGS_CACHE.indexOf(this);
    let ptag;

    if (!skipAnonymous) this.trigger('before-unmount');

    // clear all attributes coming from the mounted tag
    walkAttrs(impl.attrs, (name) => {
      if (startsWith(name, ATTRS_PREFIX))
        name = name.slice(ATTRS_PREFIX.length);

      remAttr(root, name);
    });

    // remove all the event listeners
    this.__.listeners.forEach((dom) => {
      Object.keys(dom[RIOT_EVENTS_KEY]).forEach((eventName) => {
        dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][eventName]);
      });
    });

    // remove this tag instance from the global virtualDom variable
    if (tagIndex !== -1)
      __TAGS_CACHE.splice(tagIndex, 1);

    if (p || isVirtual) {
      if (parent) {
        ptag = getImmediateCustomParentTag(parent);

        if (isVirtual) {
          Object.keys(this.tags).forEach(tagName => {
            arrayishRemove(ptag.tags, tagName, this.tags[tagName]);
          });
        } else {
          arrayishRemove(ptag.tags, tagName, this);
          // remove from _parent too
          if(parent !== ptag) {
            arrayishRemove(parent.tags, tagName, this);
          }
        }
      } else {
        // remove the tag contents
        setInnerHTML(el, '');
      }

      if (p && !mustKeepRoot) p.removeChild(el);
    }

    if (this.__.virts) {
      each(this.__.virts, (v) => {
        if (v.parentNode) v.parentNode.removeChild(v);
      });
    }

    // allow expressions to unmount themselves
    unmountAll(expressions);
    each(instAttrs, a => a.expr && a.expr.unmount && a.expr.unmount());

    // custom internal unmount function to avoid relying on the observable
    if (this.__.onUnmount) this.__.onUnmount();

    if (!skipAnonymous) {
      this.trigger('unmount');
      this.off('*');
    }

    defineProperty(this, 'isMounted', false);

    delete this.root._tag;

    return this

  }.bind(this));
}

// node_modules/riot/lib/browser/common/util/tags.js
/**
 * Detect the tag implementation by a DOM node
 * @param   { Object } dom - DOM node we need to parse to get its tag implementation
 * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
 */
function getTag(dom) {
  return dom.tagName && __TAG_IMPL[getAttr(dom, IS_DIRECTIVE) ||
    getAttr(dom, IS_DIRECTIVE) || dom.tagName.toLowerCase()]
}

/**
 * Inherit properties from a target tag instance
 * @this Tag
 * @param   { Tag } target - tag where we will inherit properties
 * @param   { Array } propsInSyncWithParent - array of properties to sync with the target
 */
function inheritFrom(target, propsInSyncWithParent) {
  each(Object.keys(target), (k) => {
    // some properties must be always in sync with the parent tag
    const mustSync = contains(propsInSyncWithParent, k);

    if (isUndefined(this[k]) || mustSync) {
      // track the property to keep in sync
      // so we can keep it updated
      if (!mustSync) propsInSyncWithParent.push(k);
      this[k] = target[k];
    }
  });
}

/**
 * Move the position of a custom tag in its parent tag
 * @this Tag
 * @param   { String } tagName - key where the tag was stored
 * @param   { Number } newPos - index where the new tag will be stored
 */
function moveChildTag(tagName, newPos) {
  const parent = this.parent;
  let tags;
  // no parent no move
  if (!parent) return

  tags = parent.tags[tagName];

  if (isArray(tags))
    tags.splice(newPos, 0, tags.splice(tags.indexOf(this), 1)[0]);
  else arrayishAdd(parent.tags, tagName, this);
}

/**
 * Create a new child tag including it correctly into its parent
 * @param   { Object } child - child tag implementation
 * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
 * @param   { String } innerHTML - inner html of the child node
 * @param   { Object } parent - instance of the parent tag including the child custom tag
 * @returns { Object } instance of the new child tag just created
 */
function initChildTag(child, opts, innerHTML, parent) {
  const tag = new Tag$1(child, opts, innerHTML);
  const tagName = opts.tagName || getTagName(opts.root, true);
  const ptag = getImmediateCustomParentTag(parent);
  // fix for the parent attribute in the looped elements
  defineProperty(tag, 'parent', ptag);
  // store the real parent tag
  // in some cases this could be different from the custom parent tag
  // for example in nested loops
  tag.__.parent = parent;

  // add this tag to the custom parent tag
  arrayishAdd(ptag.tags, tagName, tag);

  // and also to the real parent tag
  if (ptag !== parent)
    arrayishAdd(parent.tags, tagName, tag);

  return tag
}

/**
 * Loop backward all the parents tree to detect the first custom parent tag
 * @param   { Object } tag - a Tag instance
 * @returns { Object } the instance of the first custom parent tag found
 */
function getImmediateCustomParentTag(tag) {
  let ptag = tag;
  while (ptag.__.isAnonymous) {
    if (!ptag.parent) break
    ptag = ptag.parent;
  }
  return ptag
}

/**
 * Trigger the unmount method on all the expressions
 * @param   { Array } expressions - DOM expressions
 */
function unmountAll(expressions) {
  each(expressions, expr => {
    if (expr instanceof Tag$1) expr.unmount(true);
    else if (expr.tagName) expr.tag.unmount(true);
    else if (expr.unmount) expr.unmount();
  });
}

/**
 * Get the tag name of any DOM node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { Boolean } skipDataIs - hack to ignore the data-is attribute when attaching to parent
 * @returns { String } name to identify this dom node in riot
 */
function getTagName(dom, skipDataIs) {
  const child = getTag(dom);
  const namedTag = !skipDataIs && getAttr(dom, IS_DIRECTIVE);
  return namedTag && !tmpl.hasExpr(namedTag) ?
    namedTag : child ? child.name : dom.tagName.toLowerCase()
}

/**
 * Set the property of an object for a given key. If something already
 * exists there, then it becomes an array containing both the old and new value.
 * @param { Object } obj - object on which to set the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be set
 * @param { Boolean } ensureArray - ensure that the property remains an array
 * @param { Number } index - add the new item in a certain array position
 */
function arrayishAdd(obj, key, value, ensureArray, index) {
  const dest = obj[key];
  const isArr = isArray(dest);
  const hasIndex = !isUndefined(index);

  if (dest && dest === value) return

  // if the key was never set, set it once
  if (!dest && ensureArray) obj[key] = [value];
  else if (!dest) obj[key] = value;
  // if it was an array and not yet set
  else {
    if (isArr) {
      const oldIndex = dest.indexOf(value);
      // this item never changed its position
      if (oldIndex === index) return
      // remove the item from its old position
      if (oldIndex !== -1) dest.splice(oldIndex, 1);
      // move or add the item
      if (hasIndex) {
        dest.splice(index, 0, value);
      } else {
        dest.push(value);
      }
    } else obj[key] = [dest, value];
  }
}

/**
 * Removes an item from an object at a given key. If the key points to an array,
 * then the item is just removed from the array.
 * @param { Object } obj - object on which to remove the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be removed
 * @param { Boolean } ensureArray - ensure that the property remains an array
*/
function arrayishRemove(obj, key, value, ensureArray) {
  if (isArray(obj[key])) {
    let index = obj[key].indexOf(value);
    if (index !== -1) obj[key].splice(index, 1);
    if (!obj[key].length) delete obj[key];
    else if (obj[key].length === 1 && !ensureArray) obj[key] = obj[key][0];
  } else
    delete obj[key]; // otherwise just delete the key
}

/**
 * Mount a tag creating new Tag instance
 * @param   { Object } root - dom node where the tag will be mounted
 * @param   { String } tagName - name of the riot tag we want to mount
 * @param   { Object } opts - options to pass to the Tag instance
 * @param   { Object } ctx - optional context that will be used to extend an existing class ( used in riot.Tag )
 * @returns { Tag } a new Tag instance
 */
function mountTo(root, tagName, opts, ctx) {
  const impl = __TAG_IMPL[tagName];
  const implClass = __TAG_IMPL[tagName].class;
  const tag = ctx || (implClass ? Object.create(implClass.prototype) : {});
  // cache the inner HTML to fix #855
  const innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;
  const conf = extend$2({ root, opts }, { parent: opts ? opts.parent : null });

  if (impl && root) Tag$1.apply(tag, [impl, conf, innerHTML]);

  if (tag && tag.mount) {
    tag.mount(true);
    // add this tag to the virtualDom variable
    if (!contains(__TAGS_CACHE, tag)) __TAGS_CACHE.push(tag);
  }

  return tag
}

/**
 * makes a tag virtual and replaces a reference in the dom
 * @this Tag
 * @param { tag } the tag to make virtual
 * @param { ref } the dom reference location
 */
function makeReplaceVirtual(tag, ref) {
  const frag = createFrag();
  makeVirtual.call(tag, frag);
  ref.parentNode.replaceChild(frag, ref);
}

/**
 * Adds the elements for a virtual tag
 * @this Tag
 * @param { Node } src - the node that will do the inserting or appending
 * @param { Tag } target - only if inserting, insert before this tag's first child
 */
function makeVirtual(src, target) {
  const head = createDOMPlaceholder();
  const tail = createDOMPlaceholder();
  const frag = createFrag();
  let sib;
  let el;

  this.root.insertBefore(head, this.root.firstChild);
  this.root.appendChild(tail);

  this.__.head = el = head;
  this.__.tail = tail;

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    this.__.virts.push(el); // hold for unmounting
    el = sib;
  }

  if (target)
    src.insertBefore(frag, target.__.head);
  else
    src.appendChild(frag);
}

/**
 * Move virtual tag and all child nodes
 * @this Tag
 * @param { Node } src  - the node that will do the inserting
 * @param { Tag } target - insert before this tag's first child
 */
function moveVirtual(src, target) {
  let el = this.__.head, sib;
  const frag = createFrag();

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    el = sib;
    if (el === this.__.tail) {
      frag.appendChild(el);
      src.insertBefore(frag, target.__.head);
      break
    }
  }
}

/**
 * Get selectors for tags
 * @param   { Array } tags - tag names to select
 * @returns { String } selector
 */
function selectTags(tags) {
  // select all tags
  if (!tags) {
    const keys = Object.keys(__TAG_IMPL);
    return keys + selectTags(keys)
  }

  return tags
    .filter(t => !/[^-\w]/.test(t))
    .reduce((list, t) => {
      const name = t.trim().toLowerCase();
      return list + `,[${IS_DIRECTIVE}="${name}"]`
    }, '')
}


var tags = Object.freeze({
	getTag: getTag,
	inheritFrom: inheritFrom,
	moveChildTag: moveChildTag,
	initChildTag: initChildTag,
	getImmediateCustomParentTag: getImmediateCustomParentTag,
	unmountAll: unmountAll,
	getTagName: getTagName,
	arrayishAdd: arrayishAdd,
	arrayishRemove: arrayishRemove,
	mountTo: mountTo,
	makeReplaceVirtual: makeReplaceVirtual,
	makeVirtual: makeVirtual,
	moveVirtual: moveVirtual,
	selectTags: selectTags
});

// node_modules/riot/lib/riot.js
/**
 * Riot public api
 */
const settings = settings$1;
const util = {
  tmpl,
  brackets,
  styleManager,
  vdom: __TAGS_CACHE,
  styleNode: styleManager.styleNode,
  // export the riot internal utils as well
  dom,
  check,
  misc,
  tags
};

// export the core props/methods










var riot$1 = extend$2({}, core, {
  observable: observable$1,
  settings,
  util,
});

// node_modules/es-is/number.js
// Generated by CoffeeScript 1.12.5
var isNumber;

var isNumber$1 = isNumber = function(value) {
  return toString(value) === '[object Number]';
};

// node_modules/es-is/object.js
// Generated by CoffeeScript 1.12.5
var isObject$1;

var isObject$2 = isObject$1 = function(value) {
  return toString(value) === '[object Object]';
};

// node_modules/es-object-assign/lib/es-object-assign.mjs
// src/index.coffee
var getOwnSymbols;
var objectAssign;
var shouldUseNative;
var toObject;
var slice = [].slice;

getOwnSymbols = Object.getOwnPropertySymbols;

toObject = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative = function() {
  var err, i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

var index = objectAssign = (function() {
  if (shouldUseNative()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    to = toObject(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (Object.prototype.hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnSymbols) {
        ref = getOwnSymbols(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (Object.prototype.propIsEnumerable.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

// node_modules/referential/lib/referential.mjs
// src/ref.coffee
var Ref;
var nextId;
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

nextId = (function() {
  var ids;
  ids = 0;
  return function() {
    return ids++;
  };
})();

var Ref$1 = Ref = (function() {
  function Ref(_value, parent, key1) {
    this._value = _value;
    this.parent = parent;
    this.key = key1;
    this._cache = {};
    this._children = {};
    this._numChildren = 0;
    this._id = nextId();
    if (this.parent != null) {
      this.parent._children[this._id] = this;
      this.parent._numChildren++;
    }
    observable$1(this);
    
  }

  Ref.prototype._mutate = function(key) {
    var child, id, ref;
    this._cache = {};
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child._mutate();
    }
    return this;
  };

  Ref.prototype.clear = function() {
    var child, id, ref;
    this._cache = {};
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child.clear();
    }
    this._children = {};
    this._numChildren = 0;
    this._value = void 0;
    if (this.parent != null) {
      return this.parent.set(this.key, void 0);
    }
  };

  Ref.prototype.destroy = function() {
    var child, id, ref;
    ref = this._children;
    for (id in ref) {
      child = ref[id];
      child.destroy();
    }
    delete this._cache;
    delete this._children;
    this.off('*');
    if (this.parent) {
      delete this.parent._children[this._id];
      this.parent._numChildren--;
    }
    return this;
  };

  Ref.prototype.value = function(state) {
    if (!this.parent) {
      if (state != null) {
        this._value = state;
      }
      return this._value;
    }
    if (state != null) {
      return this.parent.set(this.key, state);
    } else {
      return this.parent.get(this.key);
    }
  };

  Ref.prototype.ref = function(key) {
    if (!key) {
      return this;
    }
    return new Ref(null, this, key);
  };

  Ref.prototype.get = function(key) {
    if (!key) {
      return this.value();
    } else {
      if (this._cache[key]) {
        return this._cache[key];
      }
      return this._cache[key] = this.index(key);
    }
  };

  Ref.prototype.set = function(key, value) {
    var k, oldValue, v;
    if (isObject$2(key)) {
      for (k in key) {
        v = key[k];
        this.set(k, v);
      }
      return this;
    }
    oldValue = this.get(key);
    this._mutate(key);
    if (value == null) {
      if (isObject$2(key)) {
        this.value(index(this.value(), key));
      } else {
        this.index(key, value, false);
      }
    } else {
      this.index(key, value, false);
    }
    this._triggerSet(key, value, oldValue);
    this._triggerSetChildren(key, value, oldValue);
    return this;
  };

  Ref.prototype._triggerSetChildren = function(key, value, oldValue) {
    var child, childKeys, childRemainderKey, i, id, keyPart, keyParts, partialKey, ref, ref1, regExps, results;
    if (this._numChildren === 0) {
      return this;
    }
    key = key + '';
    keyParts = key.split('.');
    partialKey = '';
    childKeys = [];
    regExps = {};
    for (i in keyParts) {
      keyPart = keyParts[i];
      if (partialKey === '') {
        partialKey = keyPart;
      } else {
        partialKey += '.' + keyPart;
      }
      childKeys[i] = partialKey;
      regExps[partialKey] = new RegExp('^' + partialKey + '\.?');
    }
    ref = this._children;
    results = [];
    for (id in ref) {
      child = ref[id];
      if (ref1 = child.key, indexOf.call(childKeys, ref1) >= 0) {
        childRemainderKey = key.replace(regExps[child.key], '');
        child.trigger('set', childRemainderKey, value, oldValue);
        results.push(child._triggerSetChildren(childRemainderKey, value, oldValue));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Ref.prototype._triggerSet = function(key, value, oldValue) {
    var parentKey;
    this.trigger('set', key, value, oldValue);
    if (this.parent) {
      parentKey = this.key + '.' + key;
      return this.parent._triggerSet(parentKey, value, oldValue);
    }
  };

  Ref.prototype.extend = function(key, value) {
    var clone;
    this._mutate(key);
    if (value == null) {
      this.value(index(this.value(), key));
    } else {
      if (isObject$2(value)) {
        this.value(index((this.ref(key)).get(), value));
      } else {
        clone = this.clone();
        this.set(key, value);
        this.value(index(clone.get(), this.value()));
      }
    }
    return this;
  };

  Ref.prototype.clone = function(key) {
    return new Ref(index({}, this.get(key)));
  };

  Ref.prototype.index = function(key, value, get, obj) {
    var next, prop, props;
    if (get == null) {
      get = true;
    }
    if (obj == null) {
      obj = this.value();
    }
    if (this.parent) {
      return this.parent.index(this.key + '.' + key, value, get);
    }
    if (isNumber$1(key)) {
      key = String(key);
    }
    props = key.split('.');
    if (get) {
      while (prop = props.shift()) {
        if (!props.length) {
          return obj != null ? obj[prop] : void 0;
        }
        obj = obj != null ? obj[prop] : void 0;
      }
      return;
    }
    if (this._value == null) {
      this._value = {};
      if (obj == null) {
        obj = this._value;
      }
    }
    while (prop = props.shift()) {
      if (!props.length) {
        return obj[prop] = value;
      } else {
        next = props[0];
        if (obj[prop] == null) {
          if (isNaN(Number(next))) {
            if (obj[prop] == null) {
              obj[prop] = {};
            }
          } else {
            if (obj[prop] == null) {
              obj[prop] = [];
            }
          }
        }
      }
      obj = obj[prop];
    }
  };

  return Ref;

})();

// src/index.coffee
var methods;
var refer;

methods = ['extend', 'get', 'index', 'ref', 'set', 'value', 'clear', 'destroy', 'on', 'off', 'one', 'trigger'];

refer = function(state, ref) {
  var fn, i, len, method, wrapper;
  if (ref == null) {
    ref = null;
  }
  if (ref == null) {
    ref = new Ref$1(state);
  }
  wrapper = function(key) {
    return ref.get(key);
  };
  fn = function(method) {
    return wrapper[method] = function() {
      return ref[method].apply(ref, arguments);
    };
  };
  for (i = 0, len = methods.length; i < len; i++) {
    method = methods[i];
    fn(method);
  }
  wrapper.refer = function(key) {
    return refer(null, ref.ref(key));
  };
  wrapper.clone = function(key) {
    return refer(null, ref.clone(key));
  };
  return wrapper;
};

refer.Ref = Ref$1;

var refer$1 = refer;

// node_modules/el.js/src/schedule.coffee
var id$1;
var p;
var rafId;
var scheduleUpdate;
var todos;

todos = {};

rafId = -1;

p = null;

id$1 = 0;

scheduleUpdate = function(tag$$1) {
  var currentTag, parentTag;
  if (!p) {
    p = new Promise$2;
    p.then(function() {
      var _, todo;
      for (_ in todos) {
        todo = todos[_];
        todo.update();
      }
      p = null;
      todos = {};
      return rafId = -1;
    });
  }
  if (todos['*']) {
    return p;
  }
  if (!tag$$1) {
    todos = {
      '*': riot$1
    };
  } else if (tag$$1.update == null) {
    throw new Error('tag has no update routine');
  } else {
    currentTag = tag$$1;
    while (currentTag != null) {
      parentTag = currentTag.parent;
      if (!currentTag._schedulingId) {
        currentTag._schedulingId = id$1++;
      } else if (todos[currentTag.schedulingId] != null) {
        return p;
      }
      currentTag = parentTag;
    }
    todos[tag$$1._schedulingId] = tag$$1;
  }
  if (rafId === -1) {
    rafId = raf(function() {
      return p.resolve();
    });
  }
  return p;
};

// node_modules/el.js/src/views/view.coffee
var View;
var collapsePrototype;
var setPrototypeOf;

setPrototypeOf = (function() {
  var mixinProperties, setProtoOf;
  setProtoOf = function(obj, proto) {
    return obj.__proto__ = proto;
  };
  mixinProperties = function(obj, proto) {
    var prop, results;
    results = [];
    for (prop in proto) {
      if (obj[prop] == null) {
        results.push(obj[prop] = proto[prop]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  if (Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array) {
    return setProtoOf;
  } else {
    return mixinProperties;
  }
})();

collapsePrototype = function(collapse, proto) {
  var parentProto;
  if (proto === View.prototype) {
    return;
  }
  parentProto = Object.getPrototypeOf(proto);
  collapsePrototype(collapse, parentProto);
  return index(collapse, parentProto);
};

View = (function() {
  View.register = function() {
    return new this;
  };

  View.prototype.tag = '';

  View.prototype.html = '';

  View.prototype.css = '';

  View.prototype.attrs = '';

  View.prototype.events = null;

  function View() {
    var newProto;
    newProto = collapsePrototype({}, this);
    this.beforeInit();
    riot$1.tag(this.tag, this.html, this.css, this.attrs, function(opts) {
      var fn, handler, k, name, parent, proto, ref, ref1, self, v;
      if (newProto != null) {
        for (k in newProto) {
          v = newProto[k];
          if (isFunction$1(v)) {
            (function(_this) {
              return (function(v) {
                var oldFn;
                if (_this[k] != null) {
                  oldFn = _this[k];
                  return _this[k] = function() {
                    oldFn.apply(_this, arguments);
                    return v.apply(_this, arguments);
                  };
                } else {
                  return _this[k] = function() {
                    return v.apply(_this, arguments);
                  };
                }
              });
            })(this)(v);
          } else {
            this[k] = v;
          }
        }
      }
      self = this;
      parent = (ref = self.parent) != null ? ref : opts.parent;
      proto = Object.getPrototypeOf(self);
      while (parent && parent !== proto) {
        setPrototypeOf(self, parent);
        self = parent;
        parent = self.parent;
        proto = Object.getPrototypeOf(self);
      }
      if (opts != null) {
        for (k in opts) {
          v = opts[k];
          this[k] = v;
        }
      }
      if (this.events != null) {
        ref1 = this.events;
        fn = (function(_this) {
          return function(name, handler) {
            if (typeof handler === 'string') {
              return _this.on(name, function() {
                return _this[handler].apply(_this, arguments);
              });
            } else {
              return _this.on(name, function() {
                return handler.apply(_this, arguments);
              });
            }
          };
        })(this);
        for (name in ref1) {
          handler = ref1[name];
          fn(name, handler);
        }
      }
      return this.init(opts);
    });
  }

  View.prototype.beforeInit = function() {};

  View.prototype.init = function() {};

  View.prototype.scheduleUpdate = function() {
    return scheduleUpdate(this);
  };

  return View;

})();

var View$1 = View;

// node_modules/el.js/src/views/inputify.coffee
var inputify;
var isRef;

isRef = function(o) {
  return (o != null) && isFunction$1(o.ref);
};

inputify = function(data, configs) {
  var config, fn, inputs, name, ref;
  if (configs == null) {
    configs = {};
  }
  ref = data;
  if (!isRef(ref)) {
    ref = refer$1(data);
  }
  inputs = {};
  fn = function(name, config) {
    var fn1, i, input, len, middleware, middlewareFn, validate;
    middleware = [];
    if (config && config.length > 0) {
      fn1 = function(name, middlewareFn) {
        return middleware.push(function(pair) {
          ref = pair[0], name = pair[1];
          return Promise$2.resolve(pair).then(function(pair) {
            return middlewareFn.call(pair[0], pair[0].get(pair[1]), pair[1], pair[0]);
          }).then(function(v) {
            ref.set(name, v);
            return pair;
          });
        });
      };
      for (i = 0, len = config.length; i < len; i++) {
        middlewareFn = config[i];
        fn1(name, middlewareFn);
      }
    }
    middleware.push(function(pair) {
      ref = pair[0], name = pair[1];
      return Promise$2.resolve(ref.get(name));
    });
    validate = function(ref, name) {
      var j, len1, p;
      p = Promise$2.resolve([ref, name]);
      for (j = 0, len1 = middleware.length; j < len1; j++) {
        middlewareFn = middleware[j];
        p = p.then(middlewareFn);
      }
      return p;
    };
    input = {
      name: name,
      ref: ref,
      config: config,
      validate: validate
    };
    observable$1(input);
    return inputs[name] = input;
  };
  for (name in configs) {
    config = configs[name];
    fn(name, config);
  }
  return inputs;
};

var inputify$1 = inputify;

// node_modules/el.js/src/views/form.coffee
var Form;
var extend$3 = function(child, parent) { for (var key in parent) { if (hasProp$2.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$2 = {}.hasOwnProperty;

Form = (function(superClass) {
  extend$3(Form, superClass);

  function Form() {
    return Form.__super__.constructor.apply(this, arguments);
  }

  Form.prototype.html = '<yield/>';

  Form.prototype.initInputs = function() {
    this.inputs = {};
    if (this.configs != null) {
      return this.inputs = inputify$1(this.data, this.configs);
    }
  };

  Form.prototype.init = function() {
    return this.initInputs();
  };

  Form.prototype.submit = function(e) {
    var input, name, p, pRef, ps, ref;
    ps = [];
    ref = this.inputs;
    for (name in ref) {
      input = ref[name];
      pRef = {};
      input.trigger('validate', pRef);
      if (pRef.p != null) {
        ps.push(pRef.p);
      }
    }
    p = Promise$2.settle(ps).then((function(_this) {
      return function(results) {
        var i, len, result;
        for (i = 0, len = results.length; i < len; i++) {
          result = results[i];
          if (!result.isFulfilled()) {
            return;
          }
        }
        return _this._submit.apply(_this, arguments);
      };
    })(this));
    if (e != null) {
      e.preventDefault();
      e.stopPropagation();
    }
    return p;
  };

  Form.prototype._submit = function() {};

  return Form;

})(View$1);

var Form$1 = Form;

// node_modules/el.js/src/views/input.coffee
var Input;
var extend$4 = function(child, parent) { for (var key in parent) { if (hasProp$3.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$3 = {}.hasOwnProperty;

Input = (function(superClass) {
  extend$4(Input, superClass);

  function Input() {
    return Input.__super__.constructor.apply(this, arguments);
  }

  Input.prototype.input = null;

  Input.prototype.valid = false;

  Input.prototype.errorMessage = '';

  Input.prototype.init = function() {
    var ref1, ref2;
    if ((this.input == null) && (this.lookup == null) && (this.bind == null)) {
      throw new Error('No input or bind provided');
    }
    if ((this.input == null) && (this.inputs != null)) {
      this.input = this.inputs[(ref1 = this.lookup) != null ? ref1 : this.bind];
    }
    if (this.input == null) {
      this.input = {
        name: (ref2 = this.lookup) != null ? ref2 : this.bind,
        ref: this.data,
        validate: function(ref, name) {
          return Promise.resolve([ref, name]);
        }
      };
      observable$1(this.input);
    }
    this.input.on('validate', (function(_this) {
      return function(pRef) {
        return _this.validate(pRef);
      };
    })(this));
    return this.input.ref.on('set', (function(_this) {
      return function(n, v1, v2) {
        if (n === _this.input.name && v1 !== v2) {
          return _this.scheduleUpdate();
        }
      };
    })(this));
  };

  Input.prototype.getValue = function(event) {
    return event.target.value;
  };

  Input.prototype.change = function(event) {
    var name, ref, ref1, value;
    ref1 = this.input, ref = ref1.ref, name = ref1.name;
    value = this.getValue(event);
    if (value === ref.get(name)) {
      return;
    }
    this.input.ref.set(name, value);
    this.clearError();
    return this.validate();
  };

  Input.prototype.error = function(err) {
    var ref1;
    return this.errorMessage = (ref1 = err != null ? err.message : void 0) != null ? ref1 : err;
  };

  Input.prototype.changed = function() {};

  Input.prototype.clearError = function() {
    return this.errorMessage = '';
  };

  Input.prototype.validate = function(pRef) {
    var p;
    p = this.input.validate(this.input.ref, this.input.name).then((function(_this) {
      return function(value) {
        _this.changed(value);
        _this.valid = true;
        return _this.scheduleUpdate();
      };
    })(this))["catch"]((function(_this) {
      return function(err) {
        _this.error(err);
        _this.valid = false;
        _this.scheduleUpdate();
        throw err;
      };
    })(this));
    if (pRef != null) {
      pRef.p = p;
    }
    return p;
  };

  return Input;

})(View$1);

var Input$1 = Input;

// node_modules/el.js/src/views/index.coffee
var Views;

var Views$1 = Views = {
  Form: Form$1,
  Input: Input$1,
  View: View$1,
  inputify: inputify$1
};

// node_modules/el.js/src/index.coffee
var El;
var fn;
var k;
var v;

El = {
  Views: Views$1,
  View: Views$1.View,
  Form: Views$1.Form,
  Input: Views$1.Input,
  ref: refer$1,
  riot: riot$1,
  scheduleUpdate: function() {
    return scheduleUpdate();
  }
};

fn = function(k, v) {
  if (isFunction$1(v)) {
    return El[k] = function() {
      return v.apply(riot$1, arguments);
    };
  }
};
for (k in riot$1) {
  v = riot$1[k];
  fn(k, v);
}

var El$1 = El;

// src/events.coffee
var Events;

var Events$1 = Events = {
  Change: 'change',
  ChangeSuccess: 'change-success',
  ChangeFailed: 'change-failed'
};

// node_modules/es6-tween/src/shim.js
var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
/* global global */


var root = typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined' ? global : undefined;
var requestAnimationFrame$1 = root.requestAnimationFrame ||
    (function (fn) { return root.setTimeout(fn, 16); });
var cancelAnimationFrame$1 = root.cancelAnimationFrame ||
    (function (id) { return root.clearTimeout(id); });

// node_modules/es6-tween/src/core.js
/* global process */
/**
 * Get browser/Node.js current time-stamp
 * @return Normalised current time-stamp in milliseconds
 * @memberof TWEEN
 * @example
 * TWEEN.now
 */
var now = (function () {
    if (typeof process !== 'undefined' && process.hrtime !== undefined && (!process.versions || process.versions.electron === undefined)) {
        return function () {
            var time = process.hrtime();
            // Convert [seconds, nanoseconds] to milliseconds.
            return time[0] * 1000 + time[1] / 1000000;
        };
        // In a browser, use window.performance.now if it is available.
    }
    else if (root.performance !== undefined &&
        root.performance.now !== undefined) {
        // This must be bound, because directly assigning this function
        // leads to an invocation exception in Chrome.
        return root.performance.now.bind(root.performance);
        // Use Date.now if it is available.
    }
    else {
        var offset_1 = root.performance &&
            root.performance.timing &&
            root.performance.timing.navigationStart
            ? root.performance.timing.navigationStart
            : Date.now();
        return function () {
            return Date.now() - offset_1;
        };
    }
})();
/**
 * Lightweight, effecient and modular ES6 version of tween.js
 * @copyright 2017 @dalisoft and es6-tween contributors
 * @license MIT
 * @namespace TWEEN
 * @example
 * // ES6
 * const {add, remove, isRunning, autoPlay} = TWEEN
 */
var _tweens = [];
var isStarted = false;
var _autoPlay = false;
var _tick;
var _ticker = requestAnimationFrame$1;
var _stopTicker = cancelAnimationFrame$1;
var emptyFrame = 0;
var powerModeThrottle = 120;
/**
 * Adds tween to list
 * @param {Tween} tween Tween instance
 * @memberof TWEEN
 * @example
 * let tween = new Tween({x:0})
 * tween.to({x:200}, 1000)
 * TWEEN.add(tween)
 */
var add = function (tween) {
    var i = _tweens.indexOf(tween);
    if (i > -1) {
        _tweens.splice(i, 1);
    }
    _tweens.push(tween);
    emptyFrame = 0;
    if (_autoPlay && !isStarted) {
        _tick = _ticker(update$2);
        isStarted = true;
    }
};
/**
 * Runs update loop automaticlly
 * @param {Boolean} state State of auto-run of update loop
 * @example TWEEN.autoPlay(true)
 * @memberof TWEEN
 */
var autoPlay = function (state) {
    _autoPlay = state;
};
/**
 * Removes tween from list
 * @param {Tween} tween Tween instance
 * @memberof TWEEN
 * @example
 * TWEEN.remove(tween)
 */
var remove$1 = function (tween) {
    var i = _tweens.indexOf(tween);
    if (i !== -1) {
        _tweens.splice(i, 1);
    }
};
/**
 * Updates global tweens by given time
 * @param {number=} time Timestamp
 * @param {Boolean=} preserve Prevents tween to be removed after finish
 * @memberof TWEEN
 * @example
 * TWEEN.update(500)
 */
var update$2 = function (time, preserve) {
    time = time !== undefined ? time : now();
    if (_autoPlay && isStarted) {
        _tick = _ticker(update$2);
    }
    if (!_tweens.length) {
        emptyFrame++;
    }
    if (emptyFrame > powerModeThrottle) {
        _stopTicker(_tick);
        isStarted = false;
        emptyFrame = 0;
        return false;
    }
    var i = 0;
    while (i < _tweens.length) {
        _tweens[i++].update(time, preserve);
    }
    return true;
};
/**
 * The plugins store object
 * @namespace TWEEN.Plugins
 * @memberof TWEEN
 * @example
 * let num = Plugins.num = function (node, start, end) {
 * return t => start + (end - start) * t
 * }
 *
 * @static
 */
var Plugins = {};

// node_modules/es6-tween/src/Easing.js
/**
 * List of full easings
 * @namespace TWEEN.Easing
 * @example
 * import {Tween, Easing} from 'es6-tween'
 *
 * // then set via new Tween({x:0}).to({x:100}, 1000).easing(Easing.Quadratic.InOut).start()
 */
var Easing = {
    Linear: {
        None: function (k) {
            return k;
        }
    },
    Quadratic: {
        In: function (k) {
            return k * k;
        },
        Out: function (k) {
            return k * (2 - k);
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k;
            }
            return -0.5 * (--k * (k - 2) - 1);
        }
    },
    Cubic: {
        In: function (k) {
            return k * k * k;
        },
        Out: function (k) {
            return --k * k * k + 1;
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k + 2);
        }
    },
    Quartic: {
        In: function (k) {
            return k * k * k * k;
        },
        Out: function (k) {
            return 1 - --k * k * k * k;
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k;
            }
            return -0.5 * ((k -= 2) * k * k * k - 2);
        }
    },
    Quintic: {
        In: function (k) {
            return k * k * k * k * k;
        },
        Out: function (k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    },
    Sinusoidal: {
        In: function (k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function (k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function (k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    },
    Exponential: {
        In: function (k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function (k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if ((k *= 2) < 1) {
                return 0.5 * Math.pow(1024, k - 1);
            }
            return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        }
    },
    Circular: {
        In: function (k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function (k) {
            return Math.sqrt(1 - --k * k);
        },
        InOut: function (k) {
            if ((k *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - k * k) - 1);
            }
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        }
    },
    Elastic: {
        In: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
        },
        Out: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
        },
        InOut: function (k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            k *= 2;
            if (k < 1) {
                return (-0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI));
            }
            return (0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1);
        }
    },
    Back: {
        In: function (k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        Out: function (k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        InOut: function (k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) {
                return 0.5 * (k * k * ((s + 1) * k - s));
            }
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    },
    Bounce: {
        In: function (k) {
            return 1 - Easing.Bounce.Out(1 - k);
        },
        Out: function (k) {
            if (k < 1 / 2.75) {
                return 7.5625 * k * k;
            }
            else if (k < 2 / 2.75) {
                return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
            }
            else if (k < 2.5 / 2.75) {
                return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
            }
            else {
                return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
            }
        },
        InOut: function (k) {
            if (k < 0.5) {
                return Easing.Bounce.In(k * 2) * 0.5;
            }
            return Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
    },
    Stepped: {
        steps: function (steps) { return function (k) { return ((k * steps) | 0) / steps; }; }
    }
};

// node_modules/es6-tween/src/constants.js
// Frame lag-fix constants
var FRAME_MS = 50 / 3;
var TOO_LONG_FRAME_MS = 250;
var CHAINED_TWEENS = '_chainedTweens';
// Event System
var EVENT_CALLBACK = 'Callback';
var EVENT_UPDATE = 'update';
var EVENT_COMPLETE = 'complete';
var EVENT_START = 'start';
var EVENT_REPEAT = 'repeat';
var EVENT_REVERSE = 'reverse';
var EVENT_PAUSE = 'pause';
var EVENT_PLAY = 'play';
var EVENT_RESTART = 'restart';
var EVENT_STOP = 'stop';
var EVENT_SEEK = 'seek';
// For String tweening stuffs
var STRING_PROP = 'STRING_PROP';
// Also RegExp's for string tweening
var NUM_REGEX = /\s+|([A-Za-z?().,{}:""[\]#\%]+)|([-+]=+)?([-+]+)?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]=?\d+)?/g;

// Copies everything, duplicates, no shallow-copy
function deepCopy(source) {
    if ((source && source.nodeType) || source === undefined || typeof source !== 'object') {
        return source;
    }
    else if (Array.isArray(source)) {
        return [].concat(source);
    }
    else if (typeof source === 'object') {
        var target = {};
        for (var prop in source) {
            target[prop] = deepCopy(source[prop]);
        }
        return target;
    }
    return source;
}
var isNaNForST = function (v) {
    return isNaN(+v) || ((v[0] === '+' || v[0] === '-') && v[1] === '=') || v === '' || v === ' ';
};
var hexColor = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;
var hex2rgb = function (all, hex) {
    var r;
    var g;
    var b;
    if (hex.length === 3) {
        r = hex[0];
        g = hex[1];
        b = hex[2];
        hex = r + r + g + g + b + b;
    }
    var color = parseInt(hex, 16);
    r = color >> 16 & 255;
    g = color >> 8 & 255;
    b = color & 255;
    return "rgb(" + r + "," + g + "," + b + ")";
};
function decomposeString(fromValue) {
    return typeof fromValue !== 'string' ? fromValue : fromValue.replace(hexColor, hex2rgb).match(NUM_REGEX).map(function (v) { return (isNaNForST(v) ? v : +v); });
}
// Decompose value, now for only `string` that required
function decompose(prop, obj, from, to, stringBuffer) {
    var fromValue = from[prop];
    var toValue = to[prop];
    if (typeof fromValue === 'string' || typeof toValue === 'string') {
        var fromValue1 = Array.isArray(fromValue) && fromValue[0] === STRING_PROP ? fromValue : decomposeString(fromValue);
        var toValue1 = Array.isArray(toValue) && toValue[0] === STRING_PROP ? toValue : decomposeString(toValue);
        var i = 1;
        while (i < fromValue1.length) {
            if (fromValue1[i] === toValue1[i] && typeof fromValue1[i - 1] === 'string') {
                fromValue1.splice(i - 1, 2, fromValue1[i - 1] + fromValue1[i]);
                toValue1.splice(i - 1, 2, toValue1[i - 1] + toValue1[i]);
            }
            else {
                i++;
            }
        }
        i = 0;
        if (fromValue1[0] === STRING_PROP) {
            fromValue1.shift();
        }
        if (toValue1[0] === STRING_PROP) {
            toValue1.shift();
        }
        var fromValue2 = { isString: true, length: fromValue1.length };
        var toValue2 = { isString: true, length: toValue1.length };
        while (i < fromValue2.length) {
            fromValue2[i] = fromValue1[i];
            toValue2[i] = toValue1[i];
            i++;
        }
        from[prop] = fromValue2;
        to[prop] = toValue2;
        return true;
    }
    else if (typeof fromValue === 'object' && typeof toValue === 'object') {
        if (Array.isArray(fromValue)) {
            return fromValue.map(function (v, i) {
                return decompose(i, obj[prop], fromValue, toValue);
            });
        }
        else {
            for (var prop2 in toValue) {
                decompose(prop2, obj[prop], fromValue, toValue);
            }
        }
        return true;
    }
    return false;
}
// Recompose value
var DECIMAL = Math.pow(10, 4);
var RGB = 'rgb(';
var RGBA = 'rgba(';
var isRGBColor = function (v, i, r) {
    if (r === void 0) { r = RGB; }
    return typeof v[i] === 'number' &&
        (v[i - 1] === r || v[i - 3] === r || v[i - 5] === r);
};
function recompose(prop, obj, from, to, t, originalT, stringBuffer) {
    var fromValue = stringBuffer ? from : from[prop];
    var toValue = stringBuffer ? to : to[prop];
    if (toValue === undefined) {
        return fromValue;
    }
    if (fromValue === undefined ||
        typeof fromValue === 'string' ||
        fromValue === toValue) {
        return toValue;
    }
    else if (typeof fromValue === 'object' && typeof toValue === 'object') {
        if (!fromValue || !toValue) {
            return obj[prop];
        }
        if (typeof fromValue === 'object' && !!fromValue && fromValue.isString) {
            var STRING_BUFFER = '';
            for (var i = 0, len = fromValue.length; i < len; i++) {
                var isRelative = typeof fromValue[i] === 'number' && typeof toValue[i] === 'string' && toValue[i][1] === '=';
                var currentValue = typeof fromValue[i] !== 'number'
                    ? fromValue[i]
                    : (((isRelative
                        ? fromValue[i] +
                            parseFloat(toValue[i][0] + toValue[i].substr(2)) * t
                        : fromValue[i] + (toValue[i] - fromValue[i]) * t) *
                        DECIMAL) |
                        0) /
                        DECIMAL;
                if (isRGBColor(fromValue, i) || isRGBColor(fromValue, i, RGBA)) {
                    currentValue |= 0;
                }
                STRING_BUFFER += currentValue;
                if (isRelative && originalT === 1) {
                    fromValue[i] =
                        fromValue[i] +
                            parseFloat(toValue[i][0] + toValue[i].substr(2));
                }
            }
            if (!stringBuffer) {
                obj[prop] = STRING_BUFFER;
            }
            return STRING_BUFFER;
        }
        else if (Array.isArray(fromValue) && fromValue[0] !== STRING_PROP) {
            for (var i = 0, len = fromValue.length; i < len; i++) {
                if (fromValue[i] === toValue[i]) {
                    continue;
                }
                recompose(i, obj[prop], fromValue, toValue, t, originalT);
            }
        }
        else if (typeof fromValue === 'object' && !!fromValue && !fromValue.isString) {
            for (var i in fromValue) {
                if (fromValue[i] === toValue[i]) {
                    continue;
                }
                recompose(i, obj[prop], fromValue, toValue, t, originalT);
            }
        }
    }
    else if (typeof fromValue === 'number') {
        var isRelative = typeof toValue === 'string';
        obj[prop] =
            (((isRelative
                ? fromValue + parseFloat(toValue[0] + toValue.substr(2)) * t
                : fromValue + (toValue - fromValue) * t) *
                DECIMAL) |
                0) /
                DECIMAL;
        if (isRelative && originalT === 1) {
            from[prop] = obj[prop];
        }
    }
    else if (typeof toValue === 'function') {
        obj[prop] = toValue(t);
    }
    return obj[prop];
}
// Dot notation => Object structure converter
// example
// {'scale.x.y.z':'VALUE'} => {scale:{x:{y:{z:'VALUE'}}}}
// Only works for 3-level parsing, after 3-level, parsing dot-notation not works as it's not affects
var propRegExp = /([.\[])/g;
var replaceBrace = /\]/g;
var propExtract = function (obj, property) {
    var value = obj[property];
    var props = property.replace(replaceBrace, '').split(propRegExp);
    var propsLastIndex = props.length - 1;
    var lastArr = Array.isArray(obj);
    var lastObj = typeof obj === 'object' && !lastArr;
    if (lastObj) {
        obj[property] = null;
        delete obj[property];
    }
    else if (lastArr) {
        obj.splice(property, 1);
    }
    return props.reduce(function (nested, prop, index) {
        if (lastArr) {
            if (prop !== '.' && prop !== '[') {
                prop *= 1;
            }
        }
        var nextProp = props[index + 1];
        var nextIsArray = nextProp === '[';
        if (prop === '.' || prop === '[') {
            if (prop === '.') {
                lastObj = true;
                lastArr = false;
            }
            else if (prop === '[') {
                lastObj = false;
                lastArr = true;
            }
            return nested;
        }
        else if (nested[prop] === undefined) {
            if (lastArr || lastObj) {
                nested[prop] =
                    index === propsLastIndex
                        ? value
                        : lastArr || nextIsArray ? [] : lastObj ? {} : null;
                lastObj = lastArr = false;
                return nested[prop];
            }
        }
        else if (nested[prop] !== undefined) {
            if (index === propsLastIndex) {
                nested[prop] = value;
            }
            return nested[prop];
        }
        return nested;
    }, obj);
};
var SET_NESTED = function (nested) {
    if (typeof nested === 'object' && !!nested) {
        for (var prop in nested) {
            if (prop.indexOf('.') !== -1 || prop.indexOf('[') !== -1) {
                propExtract(nested, prop);
            }
            else if (typeof nested[prop] === 'object' && !!nested[prop]) {
                var nested2 = nested[prop];
                for (var prop2 in nested2) {
                    if (prop2.indexOf('.') !== -1 || prop2.indexOf('[') !== -1) {
                        propExtract(nested2, prop2);
                    }
                    else if (typeof nested2[prop2] === 'object' && !!nested2[prop2]) {
                        var nested3 = nested2[prop2];
                        for (var prop3 in nested3) {
                            if (prop3.indexOf('.') !== -1 || prop3.indexOf('[') !== -1) {
                                propExtract(nested3, prop3);
                            }
                        }
                    }
                }
            }
        }
    }
    return nested;
};

// node_modules/es6-tween/src/Interpolation.js
/**
 * List of full Interpolation
 * @namespace TWEEN.Interpolation
 * @example
 * import {Interpolation, Tween} from 'es6-tween'
 *
 * let bezier = Interpolation.Bezier
 * new Tween({x:0}).to({x:[0, 4, 8, 12, 15, 20, 30, 40, 20, 40, 10, 50]}, 1000).interpolation(bezier).start()
 * @memberof TWEEN
 */
var Interpolation = {
    Linear: function (v, k, value) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.Linear;
        if (k < 0) {
            return fn(v[0], v[1], f, value);
        }
        if (k > 1) {
            return fn(v[m], v[m - 1], m - f, value);
        }
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i, value);
    },
    Bezier: function (v, k, value) {
        var b = Interpolation.Utils.Reset(value);
        var n = v.length - 1;
        var pw = Math.pow;
        var fn = Interpolation.Utils.Bernstein;
        var isBArray = Array.isArray(b);
        for (var i = 0; i <= n; i++) {
            if (typeof b === 'number') {
                b += pw(1 - k, n - i) * pw(k, i) * v[i] * fn(n, i);
            }
            else if (isBArray) {
                for (var p = 0, len = b.length; p < len; p++) {
                    if (typeof b[p] === 'number') {
                        b[p] += pw(1 - k, n - i) * pw(k, i) * v[i][p] * fn(n, i);
                    }
                    else {
                        b[p] = v[i][p];
                    }
                }
            }
            else if (typeof b === 'object') {
                for (var p in b) {
                    if (typeof b[p] === 'number') {
                        b[p] += pw(1 - k, n - i) * pw(k, i) * v[i][p] * fn(n, i);
                    }
                    else {
                        b[p] = v[i][p];
                    }
                }
            }
            else if (typeof b === 'string') {
                var STRING_BUFFER = '', idx = Math.round(n * k), pidx = idx - 1 < 0 ? 0 : idx - 1, nidx = idx + 1 > n ? n : idx + 1, vCurr = v[idx], vPrev = v[pidx];
                for (var ks = 1, len = vCurr.length; ks < len; ks++) {
                    STRING_BUFFER += vCurr[ks];
                }
                return STRING_BUFFER;
            }
        }
        return b;
    },
    CatmullRom: function (v, k, value) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.CatmullRom;
        if (v[0] === v[m]) {
            if (k < 0) {
                i = Math.floor((f = m * (1 + k)));
            }
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i, value);
        }
        else {
            if (k < 0) {
                return fn(v[1], v[1], v[0], v[0], -k, value);
            }
            if (k > 1) {
                return fn(v[m - 1], v[m - 1], v[m], v[m], (k | 0) - k, value);
            }
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i, value);
        }
    },
    Utils: {
        Linear: function (p0, p1, t, v) {
            if (typeof p0 === 'string') {
                return p1;
            }
            else if (typeof p0 === 'number') {
                return typeof p0 === 'function' ? p0(t) : p0 + (p1 - p0) * t;
            }
            else if (typeof p0 === 'object') {
                if (p0.length !== undefined) {
                    if (p0[0] === STRING_PROP) {
                        var STRING_BUFFER = '';
                        for (var i = 1, len = p0.length; i < len; i++) {
                            var currentValue = typeof p0[i] === 'number' ? p0[i] + (p1[i] - p0[i]) * t : p1[i];
                            if (isRGBColor(p0, i) || isRGBColor(p0, i, RGBA)) {
                                currentValue |= 0;
                            }
                            STRING_BUFFER += currentValue;
                        }
                        return STRING_BUFFER;
                    }
                    for (var p = 0, len = v.length; p < len; p++) {
                        v[p] = Interpolation.Utils.Linear(p0[p], p1[p], t, v[p]);
                    }
                }
                else {
                    for (var p in v) {
                        v[p] = Interpolation.Utils.Linear(p0[p], p1[p], t, v[p]);
                    }
                }
                return v;
            }
        },
        Reset: function (value) {
            if (Array.isArray(value)) {
                for (var i = 0, len = value.length; i < len; i++) {
                    value[i] = Interpolation.Utils.Reset(value[i]);
                }
                return value;
            }
            else if (typeof value === 'object') {
                for (var i in value) {
                    value[i] = Interpolation.Utils.Reset(value[i]);
                }
                return value;
            }
            else if (typeof value === 'number') {
                return 0;
            }
            return value;
        },
        Bernstein: function (n, i) {
            var fc = Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },
        Factorial: (function () {
            var a = [1];
            return function (n) {
                var s = 1;
                if (a[n]) {
                    return a[n];
                }
                for (var i = n; i > 1; i--) {
                    s *= i;
                }
                a[n] = s;
                return s;
            };
        })(),
        CatmullRom: function (p0, p1, p2, p3, t, v) {
            if (typeof p0 === 'string') {
                return p1;
            }
            else if (typeof p0 === 'number') {
                var v0 = (p2 - p0) * 0.5;
                var v1 = (p3 - p1) * 0.5;
                var t2 = t * t;
                var t3 = t * t2;
                return ((2 * p1 - 2 * p2 + v0 + v1) * t3 +
                    (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
                    v0 * t +
                    p1);
            }
            else if (typeof p0 === 'object') {
                if (p0.length !== undefined) {
                    if (p0[0] === STRING_PROP) {
                        var STRING_BUFFER = '';
                        for (var i = 1, len = p0.length; i < len; i++) {
                            var currentValue = typeof p0[i] === 'number'
                                ? Interpolation.Utils.CatmullRom(p0[i], p1[i], p2[i], p3[i], t)
                                : p3[i];
                            if (isRGBColor(p0, i) || isRGBColor(p0, i, RGBA)) {
                                currentValue |= 0;
                            }
                            STRING_BUFFER += currentValue;
                        }
                        return STRING_BUFFER;
                    }
                    for (var p = 0, len = v.length; p < len; p++) {
                        v[p] = Interpolation.Utils.CatmullRom(p0[p], p1[p], p2[p], p3[p], t, v[p]);
                    }
                }
                else {
                    for (var p in v) {
                        v[p] = Interpolation.Utils.CatmullRom(p0[p], p1[p], p2[p], p3[p], t, v[p]);
                    }
                }
                return v;
            }
        }
    }
};

// node_modules/es6-tween/src/NodeCache.js
var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var Store = {};
var NodeCache = function (node, object, tween) {
    if (!node || !node.nodeType) {
        return object;
    }
    var ID = node.queueID || 'q_' + Date.now();
    if (!node.queueID) {
        node.queueID = ID;
    }
    var storeID = Store[ID];
    if (storeID) {
        if (storeID.object === object &&
            node === storeID.tween.node &&
            tween._startTime === storeID.tween._startTime) {
            remove$1(storeID.tween);
        }
        else if (typeof object === 'object' && !!object && !!storeID.object) {
            for (var prop in object) {
                if (prop in storeID.object) {
                    if (tween._startTime === storeID.tween._startTime) {
                        delete storeID.object[prop];
                    }
                    else {
                        storeID.propNormaliseRequired = true;
                    }
                }
            }
            storeID.object = __assign$1({}, storeID.object, object);
        }
        return storeID.object;
    }
    if (typeof object === 'object' && !!object) {
        Store[ID] = { tween: tween, object: object, propNormaliseRequired: false };
        return Store[ID].object;
    }
    return object;
};

// node_modules/es6-tween/src/selector.js
var Selector = function (selector, collection) {
    if (collection) {
        return !selector
            ? null
            : selector === window || selector === document
                ? [selector]
                : typeof selector === 'string'
                    ? !!document.querySelectorAll && document.querySelectorAll(selector)
                    : Array.isArray(selector)
                        ? selector
                        : selector.nodeType ? [selector] : [];
    }
    return !selector
        ? null
        : selector === window || selector === document
            ? selector
            : typeof selector === 'string'
                ? !!document.querySelector && document.querySelector(selector)
                : Array.isArray(selector)
                    ? selector[0]
                    : selector.nodeType ? selector : null;
};

// node_modules/es6-tween/src/Tween.js
var _id = 0; // Unique ID
var defaultEasing = Easing.Linear.None;
/**
 * Tween main constructor
 * @constructor
 * @class
 * @namespace TWEEN.Tween
 * @param {Object|Element} node Node Element or Tween initial object
 * @param {Object=} object If Node Element is using, second argument is used for Tween initial object
 * @example let tween = new Tween(myNode, {width:'100px'}).to({width:'300px'}, 2000).start()
 */
var Tween = /** @class */ (function () {
    function Tween(node, object) {
        this._chainedTweensCount = 0;
        this.id = _id++;
        if (!!node && typeof node === 'object' && !object && !node.nodeType) {
            object = this.object = node;
            node = null;
        }
        else if (!!node &&
            (node.nodeType || node.length || typeof node === 'string')) {
            node = this.node = Selector(node);
            object = this.object = NodeCache(node, object, this);
        }
        this._valuesEnd = null;
        this._valuesStart = {};
        this._duration = 1000;
        this._easingFunction = defaultEasing;
        this._easingReverse = defaultEasing;
        this._interpolationFunction = Interpolation.Linear;
        this._startTime = 0;
        this._initTime = 0;
        this._delayTime = 0;
        this._repeat = 0;
        this._r = 0;
        this._isPlaying = false;
        this._yoyo = false;
        this._reversed = false;
        this._onStartCallbackFired = false;
        this._pausedTime = null;
        this._isFinite = true;
        this._maxListener = 15;
        this._prevTime = null;
        return this;
    }
    /**
     * Easier way to call the Tween
     * @param {Element} node DOM Element
     * @param {object} object - Initial value
     * @param {object} to - Target value
     * @param {object} params - Options of tweens
     * @example Tween.fromTo(node, {x:0}, {x:200}, {duration:1000})
     * @memberof TWEEN.Tween
     * @static
     */
    Tween.fromTo = function (node, object, to, params) {
        if (params === void 0) { params = {}; }
        params.quickRender = params.quickRender ? params.quickRender : !to;
        var tween = new Tween(node, object).to(to, params);
        if (params.quickRender) {
            tween.render().update(tween._startTime);
            tween._rendered = false;
            tween._onStartCallbackFired = false;
        }
        return tween;
    };
    /**
     * Easier way calling constructor only applies the `to` value, useful for CSS Animation
     * @param {Element} node DOM Element
     * @param {object} to - Target value
     * @param {object} params - Options of tweens
     * @example Tween.to(node, {x:200}, {duration:1000})
     * @memberof TWEEN.Tween
     * @static
     */
    Tween.to = function (node, to, params) {
        return Tween.fromTo(node, null, to, params);
    };
    /**
     * Easier way calling constructor only applies the `from` value, useful for CSS Animation
     * @param {Element} node DOM Element
     * @param {object} from - Initial value
     * @param {object} params - Options of tweens
     * @example Tween.from(node, {x:200}, {duration:1000})
     * @memberof TWEEN.Tween
     * @static
     */
    Tween.from = function (node, from, params) {
        return Tween.fromTo(node, from, null, params);
    };
    /**
     * Sets max `event` listener's count to Events system
     * @param {number} count - Event listener's count
     * @memberof TWEEN.Tween
     */
    Tween.prototype.setMaxListener = function (count) {
        if (count === void 0) { count = 15; }
        this._maxListener = count;
        return this;
    };
    /**
     * Adds `event` to Events system
     * @param {string} event - Event listener name
     * @param {Function} callback - Event listener callback
     * @memberof TWEEN.Tween
     */
    Tween.prototype.on = function (event, callback) {
        var _maxListener = this._maxListener;
        var callbackName = event + EVENT_CALLBACK;
        for (var i = 0; i < _maxListener; i++) {
            var callbackId = callbackName + i;
            if (!this[callbackId]) {
                this[callbackId] = callback;
                break;
            }
        }
        return this;
    };
    /**
     * Adds `event` to Events system.
     * Removes itself after fired once
     * @param {string} event - Event listener name
     * @param {Function} callback - Event listener callback
     * @memberof TWEEN.Tween
     */
    Tween.prototype.once = function (event, callback) {
        var _this = this;
        var _maxListener = this._maxListener;
        var callbackName = event + EVENT_CALLBACK;
        var _loop_1 = function (i) {
            var callbackId = callbackName + i;
            if (!this_1[callbackId]) {
                this_1[callbackId] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    callback.apply(_this, args);
                    _this[callbackId] = null;
                };
                return "break";
            }
        };
        var this_1 = this;
        for (var i = 0; i < _maxListener; i++) {
            var state_1 = _loop_1(i);
            if (state_1 === "break")
                break;
        }
        return this;
    };
    /**
     * Removes `event` from Events system
     * @param {string} event - Event listener name
     * @param {Function} callback - Event listener callback
     * @memberof TWEEN.Tween
     */
    Tween.prototype.off = function (event, callback) {
        var _maxListener = this._maxListener;
        var callbackName = event + EVENT_CALLBACK;
        for (var i = 0; i < _maxListener; i++) {
            var callbackId = callbackName + i;
            if (this[callbackId] === callback) {
                this[callbackId] = null;
            }
        }
        return this;
    };
    /**
     * Emits/Fired/Trigger `event` from Events system listeners
     * @param {string} event - Event listener name
     * @memberof TWEEN.Tween
     */
    Tween.prototype.emit = function (event, arg1, arg2, arg3, arg4) {
        var _maxListener = this._maxListener;
        var callbackName = event + EVENT_CALLBACK;
        if (!this[callbackName + 0]) {
            return this;
        }
        for (var i = 0; i < _maxListener; i++) {
            var callbackId = callbackName + i;
            if (this[callbackId]) {
                this[callbackId](arg1, arg2, arg3, arg4);
            }
        }
        return this;
    };
    /**
     * @return {boolean} State of playing of tween
     * @example tween.isPlaying() // returns `true` if tween in progress
     * @memberof TWEEN.Tween
     */
    Tween.prototype.isPlaying = function () {
        return this._isPlaying;
    };
    /**
     * @return {boolean} State of started of tween
     * @example tween.isStarted() // returns `true` if tween in started
     * @memberof TWEEN.Tween
     */
    Tween.prototype.isStarted = function () {
        return this._onStartCallbackFired;
    };
    /**
     * Reverses the tween state/direction
     * @example tween.reverse()
     * @param {boolean=} state Set state of current reverse
     * @memberof TWEEN.Tween
     */
    Tween.prototype.reverse = function (state) {
        var _reversed = this._reversed;
        this._reversed = state !== undefined ? state : !_reversed;
        return this;
    };
    /**
     * @return {boolean} State of reversed
     * @example tween.reversed() // returns `true` if tween in reversed state
     * @memberof TWEEN.Tween
     */
    Tween.prototype.reversed = function () {
        return this._reversed;
    };
    /**
     * Pauses tween
     * @example tween.pause()
     * @memberof TWEEN.Tween
     */
    Tween.prototype.pause = function () {
        if (!this._isPlaying) {
            return this;
        }
        this._isPlaying = false;
        remove$1(this);
        this._pausedTime = now();
        return this.emit(EVENT_PAUSE, this.object);
    };
    /**
     * Play/Resume the tween
     * @example tween.play()
     * @memberof TWEEN.Tween
     */
    Tween.prototype.play = function () {
        if (this._isPlaying) {
            return this;
        }
        this._isPlaying = true;
        this._startTime += now() - this._pausedTime;
        this._initTime = this._startTime;
        add(this);
        this._pausedTime = now();
        return this.emit(EVENT_PLAY, this.object);
    };
    /**
     * Restarts tween from initial value
     * @param {boolean=} noDelay If this param is set to `true`, restarts tween without `delay`
     * @example tween.restart()
     * @memberof TWEEN.Tween
     */
    Tween.prototype.restart = function (noDelay) {
        this._repeat = this._r;
        this.reassignValues();
        add(this);
        return this.emit(EVENT_RESTART, this.object);
    };
    /**
     * Seek tween value by `time`. Note: Not works as excepted. PR are welcome
     * @param {Time} time Tween update time
     * @param {boolean=} keepPlaying When this param is set to `false`, tween pausing after seek
     * @example tween.seek(500)
     * @memberof TWEEN.Tween
     * @deprecated Not works as excepted, so we deprecated this method
     */
    Tween.prototype.seek = function (time, keepPlaying) {
        var _a = this, _duration = _a._duration, _repeat = _a._repeat, _initTime = _a._initTime, _startTime = _a._startTime, _delayTime = _a._delayTime, _reversed = _a._reversed;
        var updateTime = _initTime + time;
        this._isPlaying = true;
        if (updateTime < _startTime && _startTime >= _initTime) {
            this._startTime -= _duration;
            this._reversed = !_reversed;
        }
        this.update(time, false);
        this.emit(EVENT_SEEK, time, this.object);
        return keepPlaying ? this : this.pause();
    };
    /**
     * Sets tween duration
     * @param {number} amount Duration is milliseconds
     * @example tween.duration(2000)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.duration = function (amount) {
        this._duration =
            typeof amount === 'function' ? amount(this._duration) : amount;
        return this;
    };
    /**
     * Sets target value and duration
     * @param {object} properties Target value (to value)
     * @param {number|Object=} [duration=1000] Duration of tween
     * @example let tween = new Tween({x:0}).to({x:100}, 2000)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.to = function (properties, duration, maybeUsed) {
        if (duration === void 0) { duration = 1000; }
        this._valuesEnd = properties;
        if (typeof duration === 'number' || typeof duration === 'function') {
            this._duration =
                typeof duration === 'function' ? duration(this._duration) : duration;
        }
        else if (typeof duration === 'object') {
            for (var prop in duration) {
                if (typeof this[prop] === 'function') {
                    var _a = Array.isArray(duration[prop]) ? duration[prop] : [duration[prop]], _b = _a[0], arg1 = _b === void 0 ? null : _b, _c = _a[1], arg2 = _c === void 0 ? null : _c, _d = _a[2], arg3 = _d === void 0 ? null : _d, _e = _a[3], arg4 = _e === void 0 ? null : _e;
                    this[prop](arg1, arg2, arg3, arg4);
                }
            }
        }
        return this;
    };
    /**
     * Renders and computes value at first render
     * @private
     * @memberof TWEEN.Tween
     */
    Tween.prototype.render = function () {
        if (this._rendered) {
            return this;
        }
        var _a = this, _valuesStart = _a._valuesStart, _valuesEnd = _a._valuesEnd, object = _a.object, node = _a.node, InitialValues = _a.InitialValues, _easingFunction = _a._easingFunction;
        SET_NESTED(object);
        SET_NESTED(_valuesEnd);
        if (node && node.queueID && Store[node.queueID]) {
            var prevTweenByNode = Store[node.queueID];
            if (prevTweenByNode.propNormaliseRequired &&
                prevTweenByNode.tween !== this) {
                for (var property in _valuesEnd) {
                    if (prevTweenByNode.tween._valuesEnd[property] !== undefined) {
                        //delete prevTweenByNode.tween._valuesEnd[property];
                    }
                }
                prevTweenByNode.normalisedProp = true;
                prevTweenByNode.propNormaliseRequired = false;
            }
        }
        if (node && InitialValues) {
            if (!object || Object.keys(object).length === 0) {
                object = this.object = NodeCache(node, InitialValues(node, _valuesEnd), this);
            }
            else if (!_valuesEnd || Object.keys(_valuesEnd).length === 0) {
                _valuesEnd = this._valuesEnd = InitialValues(node, object);
            }
        }
        for (var property in _valuesEnd) {
            var start = object && object[property] && deepCopy(object[property]);
            var end = _valuesEnd[property];
            if (Plugins[property] && Plugins[property].init) {
                Plugins[property].init.call(this, start, end, property, object);
                if (start === undefined && _valuesStart[property]) {
                    start = _valuesStart[property];
                }
                if (Plugins[property].skipProcess) {
                    continue;
                }
            }
            if ((typeof start === 'number' && isNaN(start)) ||
                start === null ||
                end === null ||
                start === false ||
                end === false ||
                start === undefined ||
                end === undefined ||
                start === end) {
                continue;
            }
            if (Array.isArray(end) && !Array.isArray(start)) {
                end.unshift(start);
                for (var i = 0, len = end.length; i < len; i++) {
                    if (typeof end[i] === 'string') {
                        var arrayOfStrings = decomposeString(end[i]);
                        var stringObject = { length: arrayOfStrings.length, isString: true };
                        for (var ii = 0, len2 = arrayOfStrings.length; ii < len2; ii++) {
                            stringObject[ii] = arrayOfStrings[ii];
                        }
                        end[i] = stringObject;
                    }
                }
            }
            _valuesStart[property] = start;
            if (typeof start === 'number' && typeof end === 'string' && end[1] === '=') {
                continue;
            }
            decompose(property, object, _valuesStart, _valuesEnd);
        }
        if (Tween.Renderer && this.node && Tween.Renderer.init) {
            Tween.Renderer.init.call(this, object, _valuesStart, _valuesEnd);
            this.__render = true;
        }
        return this;
    };
    /**
     * Start the tweening
     * @param {number|string} time setting manual time instead of Current browser timestamp or like `+1000` relative to current timestamp
     * @example tween.start()
     * @memberof TWEEN.Tween
     */
    Tween.prototype.start = function (time) {
        this._startTime =
            time !== undefined
                ? typeof time === 'string' ? now() + parseFloat(time) : time
                : now();
        this._startTime += this._delayTime;
        this._initTime = this._prevTime = this._startTime;
        this._onStartCallbackFired = false;
        this._rendered = false;
        this._isPlaying = true;
        add(this);
        return this;
    };
    /**
     * Stops the tween
     * @example tween.stop()
     * @memberof TWEEN.Tween
     */
    Tween.prototype.stop = function () {
        var _a = this, _isPlaying = _a._isPlaying, _isFinite = _a._isFinite, object = _a.object, _startTime = _a._startTime, _delayTime = _a._delayTime, _duration = _a._duration, _r = _a._r, _yoyo = _a._yoyo, _reversed = _a._reversed;
        if (!_isPlaying) {
            return this;
        }
        var atStart = _isFinite ? (_r + 1) % 2 === 1 : !_reversed;
        this._reversed = false;
        if (_yoyo && atStart) {
            this.update(_startTime);
        }
        else {
            this.update(_startTime + _duration);
        }
        remove$1(this);
        return this.emit(EVENT_STOP, object);
    };
    /**
     * Set delay of tween
     * @param {number} amount Sets tween delay / wait duration
     * @example tween.delay(500)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.delay = function (amount) {
        this._delayTime =
            typeof amount === 'function' ? amount(this._delayTime) : amount;
        return this;
    };
    /**
     * Chained tweens
     * @param {any} arguments Arguments list
     * @example tween.chainedTweens(tween1, tween2)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.chainedTweens = function () {
        this._chainedTweensCount = arguments.length;
        if (!this._chainedTweensCount) {
            return this;
        }
        for (var i = 0, len = this._chainedTweensCount; i < len; i++) {
            this[CHAINED_TWEENS + i] = arguments[i];
        }
        return this;
    };
    /**
     * Sets how times tween is repeating
     * @param {amount} amount the times of repeat
     * @example tween.repeat(5)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.repeat = function (amount) {
        this._repeat = !this._duration
            ? 0
            : typeof amount === 'function' ? amount(this._repeat) : amount;
        this._r = this._repeat;
        this._isFinite = isFinite(amount);
        return this;
    };
    /**
     * Set delay of each repeat alternate of tween
     * @param {number} amount Sets tween repeat alternate delay / repeat alternate wait duration
     * @example tween.reverseDelay(500)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.reverseDelay = function (amount) {
        this._reverseDelayTime =
            typeof amount === 'function' ? amount(this._reverseDelayTime) : amount;
        return this;
    };
    /**
     * Set `yoyo` state (enables reverse in repeat)
     * @param {boolean} state Enables alternate direction for repeat
     * @param {Function=} _easingReverse Easing function in reverse direction
     * @example tween.yoyo(true)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.yoyo = function (state, _easingReverse) {
        this._yoyo =
            typeof state === 'function'
                ? state(this._yoyo)
                : state === null ? this._yoyo : state;
        if (!state) {
            this._reversed = false;
        }
        this._easingReverse = _easingReverse || null;
        return this;
    };
    /**
     * Set easing
     * @param {Function} _easingFunction Easing function, applies in non-reverse direction if Tween#yoyo second argument is applied
     * @example tween.easing(Easing.Elastic.InOut)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.easing = function (_easingFunction) {
        this._easingFunction = _easingFunction;
        return this;
    };
    /**
     * Set interpolation
     * @param {Function} _interpolationFunction Interpolation function
     * @example tween.interpolation(Interpolation.Bezier)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.interpolation = function (_interpolationFunction) {
        if (typeof _interpolationFunction === 'function') {
            this._interpolationFunction = _interpolationFunction;
        }
        return this;
    };
    /**
     * Reassigns value for rare-case like Tween#restart or for Timeline
     * @private
     * @memberof TWEEN.Tween
     */
    Tween.prototype.reassignValues = function (time) {
        var _a = this, _valuesStart = _a._valuesStart, object = _a.object, _delayTime = _a._delayTime;
        this._isPlaying = true;
        this._startTime = time !== undefined ? time : now();
        this._startTime += _delayTime;
        this._reversed = false;
        add(this);
        for (var property in _valuesStart) {
            var start = _valuesStart[property];
            object[property] = start;
        }
        return this;
    };
    /**
     * Updates initial object to target value by given `time`
     * @param {Time} time Current time
     * @param {boolean=} preserve Prevents from removing tween from store
     * @param {boolean=} forceTime Forces to be frame rendered, even mismatching time
     * @example tween.update(100)
     * @memberof TWEEN.Tween
     */
    Tween.prototype.update = function (time, preserve, forceTime) {
        var _a = this, _onStartCallbackFired = _a._onStartCallbackFired, _easingFunction = _a._easingFunction, _interpolationFunction = _a._interpolationFunction, _easingReverse = _a._easingReverse, _repeat = _a._repeat, _delayTime = _a._delayTime, _reverseDelayTime = _a._reverseDelayTime, _yoyo = _a._yoyo, _reversed = _a._reversed, _startTime = _a._startTime, _prevTime = _a._prevTime, _duration = _a._duration, _valuesStart = _a._valuesStart, _valuesEnd = _a._valuesEnd, object = _a.object, _isFinite = _a._isFinite, _isPlaying = _a._isPlaying, __render = _a.__render, _chainedTweensCount = _a._chainedTweensCount;
        var elapsed;
        var currentEasing;
        var property;
        var propCount = 0;
        if (!_duration) {
            elapsed = 1;
            _repeat = 0;
        }
        else {
            time = time !== undefined ? time : now();
            var delta = time - _prevTime;
            this._prevTime = time;
            if (delta > TOO_LONG_FRAME_MS) {
                time -= delta - FRAME_MS;
            }
            if (!_isPlaying || (time < _startTime && !forceTime)) {
                return true;
            }
            elapsed = (time - _startTime) / _duration;
            elapsed = elapsed > 1 ? 1 : elapsed;
            elapsed = _reversed ? 1 - elapsed : elapsed;
        }
        if (!_onStartCallbackFired) {
            if (!this._rendered) {
                this.render();
                this._rendered = true;
            }
            this.emit(EVENT_START, object);
            this._onStartCallbackFired = true;
        }
        currentEasing = _reversed
            ? _easingReverse || _easingFunction
            : _easingFunction;
        if (!object) {
            return true;
        }
        for (property in _valuesEnd) {
            var start = _valuesStart[property];
            if ((start === undefined || start === null) &&
                !(Plugins[property] && Plugins[property].update)) {
                continue;
            }
            var end = _valuesEnd[property];
            var value = currentEasing[property]
                ? currentEasing[property](elapsed)
                : typeof currentEasing === 'function'
                    ? currentEasing(elapsed)
                    : defaultEasing(elapsed);
            var _interpolationFunctionCall = _interpolationFunction[property]
                ? _interpolationFunction[property]
                : typeof _interpolationFunction === 'function'
                    ? _interpolationFunction
                    : Interpolation.Linear;
            if (typeof end === 'number') {
                object[property] =
                    (((start + (end - start) * value) * DECIMAL) | 0) / DECIMAL;
            }
            else if (Array.isArray(end) && !Array.isArray(start)) {
                object[property] = _interpolationFunctionCall(end, value, object[property]);
            }
            else if (end && end.update) {
                end.update(value);
            }
            else if (typeof end === 'function') {
                object[property] = end(value);
            }
            else if (typeof end === 'string' && typeof start === 'number') {
                object[property] = start + parseFloat(end[0] + end.substr(2)) * value;
            }
            else {
                recompose(property, object, _valuesStart, _valuesEnd, value, elapsed);
            }
            if (Plugins[property] && Plugins[property].update) {
                Plugins[property].update.call(this, object[property], start, end, value, elapsed);
            }
            propCount++;
        }
        if (!propCount) {
            remove$1(this);
            return false;
        }
        if (__render && Tween.Renderer && Tween.Renderer.update) {
            Tween.Renderer.update.call(this, object, elapsed);
        }
        this.emit(EVENT_UPDATE, object, elapsed, time);
        if (elapsed === 1 || (_reversed && elapsed === 0)) {
            if (_repeat > 0 && _duration > 0) {
                if (_isFinite) {
                    this._repeat--;
                }
                if (_yoyo) {
                    this._reversed = !_reversed;
                }
                else {
                    for (property in _valuesEnd) {
                        var end = _valuesEnd[property];
                        if (typeof end === 'string' && typeof _valuesStart[property] === 'number') {
                            _valuesStart[property] += parseFloat(end[0] + end.substr(2));
                        }
                    }
                }
                this.emit(_yoyo && !_reversed ? EVENT_REVERSE : EVENT_REPEAT, object);
                if (_reversed && _reverseDelayTime) {
                    this._startTime = time - _reverseDelayTime;
                }
                else {
                    this._startTime = time + _delayTime;
                }
                return true;
            }
            else {
                if (!preserve) {
                    this._isPlaying = false;
                    remove$1(this);
                    _id--;
                }
                this.emit(EVENT_COMPLETE, object);
                this._repeat = this._r;
                if (_chainedTweensCount) {
                    for (var i = 0; i < _chainedTweensCount; i++) {
                        this[CHAINED_TWEENS + i].start(time + _duration);
                    }
                }
                return false;
            }
        }
        return true;
    };
    return Tween;
}());

// node_modules/es6-tween/src/Interpolator.js

// node_modules/es6-tween/src/index.js

// src/controls/control.coffee
var Control;
var scrolling;
var extend$1 = function(child, parent) { for (var key in parent) { if (hasProp$1.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$1 = {}.hasOwnProperty;

scrolling = false;

var Control$1 = Control = (function(superClass) {
  extend$1(Control, superClass);

  function Control() {
    return Control.__super__.constructor.apply(this, arguments);
  }

  Control.prototype.init = function() {
    return Control.__super__.init.apply(this, arguments);
  };

  Control.prototype.getValue = function(event) {
    var ref;
    return (ref = event.target.value) != null ? ref.trim() : void 0;
  };

  Control.prototype.error = function(err) {
    var elTop, rect, t, wTop;
    if (err instanceof DOMException) {
      console.log('WARNING: Error in riot dom manipulation ignored:', err);
      return;
    }
    Control.__super__.error.apply(this, arguments);
    rect = this.root.getBoundingClientRect();
    elTop = rect.top - window.innerHeight / 2;
    wTop = window.pageYOffset;
    if (!scrolling && elTop <= wTop) {
      scrolling = true;
      autoPlay(true);
      t = new Tween({
        x: wTop
      }).to({
        x: wTop + elTop
      }, 500, Easing.Cubic).on('update', function(arg) {
        var x;
        x = arg.x;
        return window.scrollTo(window.pageXOffset, x);
      }).on('complete', function() {
        scrolling = false;
        return autoPlay(false);
      }).start();
    }
    return this.mediator.trigger(Events$1.ChangeFailed, this.input.name, this.input.ref.get(this.input.name));
  };

  Control.prototype.change = function() {
    Control.__super__.change.apply(this, arguments);
    return this.mediator.trigger(Events$1.Change, this.input.name, this.input.ref.get(this.input.name));
  };

  Control.prototype.changed = function(value) {
    this.mediator.trigger(Events$1.ChangeSuccess, this.input.name, value);
    return El$1.scheduleUpdate();
  };

  Control.prototype.value = function() {
    return this.input.ref(this.input.name);
  };

  return Control;

})(El$1.Input);

// templates/controls/checkbox.pug
var html = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" type=\"checkbox\" onchange=\"{ change }\" onblur=\"{ change }\" checked=\"{ input.ref.get(input.name) }\">\n</yield>\n<yield></yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>";

// src/controls/checkbox.coffee
var CheckBox;
var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp = {}.hasOwnProperty;

var checkbox = CheckBox = (function(superClass) {
  extend(CheckBox, superClass);

  function CheckBox() {
    return CheckBox.__super__.constructor.apply(this, arguments);
  }

  CheckBox.prototype.tag = 'checkbox';

  CheckBox.prototype.html = html;

  CheckBox.prototype.getValue = function(event) {
    return event.target.checked;
  };

  return CheckBox;

})(Control$1);

CheckBox.register();

// templates/controls/selection.pug
var html$1 = "\n<yield from=\"input\">\n  <select class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" onchange=\"{ change }\" onblur=\"{ change }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled || !hasOptions() }\" multiple=\"{ multiple }\" size=\"{ size }\">\n    <option if=\"{ placeholder }\" value=\"\">{ placeholder }</option>\n    <option each=\"{ v, k in options() }\" value=\"{ k }\" selected=\"{ k == input.ref.get(input.name) }\">{ v }</option>\n  </select>\n  <div class=\"select-indicator\">▼</div>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

// src/controls/selection.coffee
var Select;
var extend$6 = function(child, parent) { for (var key in parent) { if (hasProp$5.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$5 = {}.hasOwnProperty;

var Select$1 = Select = (function(superClass) {
  extend$6(Select, superClass);

  function Select() {
    return Select.__super__.constructor.apply(this, arguments);
  }

  Select.prototype.tag = 'selection';

  Select.prototype.html = html$1;

  Select.prototype.placeholder = 'Select an Option';

  Select.prototype.autofocus = false;

  Select.prototype.disabled = false;

  Select.prototype.multiple = false;

  Select.prototype.size = null;

  Select.prototype._optionsHash = 'default';

  Select.prototype.selectOptions = {};

  Select.prototype.hasOptions = function() {
    this.options;
    return this._optionsHash.length > 2;
  };

  Select.prototype.options = function() {
    var optionsHash;
    optionsHash = JSON.stringify(this.selectOptions);
    if (this._optionsHash !== optionsHash) {
      this._optionsHash = optionsHash;
    }
    return this.selectOptions;
  };

  Select.prototype.getValue = function(e) {
    var el, ref, ref1, ref2;
    el = e.target;
    return ((ref = (ref1 = el.options) != null ? (ref2 = ref1[el.selectedIndex]) != null ? ref2.value : void 0 : void 0) != null ? ref : '').trim();
  };

  Select.prototype.init = function(opts) {
    return Select.__super__.init.apply(this, arguments);
  };

  return Select;

})(Control$1);

Select.register();

// src/controls/country-select.coffee
var CountrySelect;
var extend$5 = function(child, parent) { for (var key in parent) { if (hasProp$4.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$4 = {}.hasOwnProperty;

var countrySelect = CountrySelect = (function(superClass) {
  extend$5(CountrySelect, superClass);

  function CountrySelect() {
    return CountrySelect.__super__.constructor.apply(this, arguments);
  }

  CountrySelect.prototype.tag = 'country-select';

  CountrySelect.prototype.options = function() {
    var countries, country, i, len, options, optionsHash, ref, ref1, ref2, ref3, ref4, ref5;
    countries = (ref = (ref1 = (ref2 = this.countries) != null ? ref2 : (ref3 = this.data) != null ? ref3.get('countries') : void 0) != null ? ref1 : (ref4 = this.parent) != null ? (ref5 = ref4.data) != null ? ref5.get('countries') : void 0 : void 0) != null ? ref : [];
    optionsHash = JSON.stringify(countries);
    if (this._optionsHash === optionsHash) {
      return this.selectOptions;
    }
    countries = countries.slice(0);
    this._optionsHash = optionsHash;
    this.selectOptions = options = {};
    this.input.ref.set(this.input.name, '');
    countries.sort(function(a, b) {
      var nameA, nameB;
      nameA = a.name.toUpperCase();
      nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    for (i = 0, len = countries.length; i < len; i++) {
      country = countries[i];
      options[country.code.toUpperCase()] = country.name;
    }
    return options;
  };

  CountrySelect.prototype.init = function() {
    return CountrySelect.__super__.init.apply(this, arguments);
  };

  return CountrySelect;

})(Select$1);

CountrySelect.register();

// src/utils/placeholder.coffee
var exports$1;
var hidePlaceholderOnFocus;
var unfocusOnAnElement;

hidePlaceholderOnFocus = function(event) {
  var target;
  target = event.currentTarget ? event.currentTarget : event.srcElement;
  if (target.value === target.getAttribute('placeholder')) {
    return target.value = '';
  }
};

unfocusOnAnElement = function(event) {
  var target;
  target = event.currentTarget ? event.currentTarget : event.srcElement;
  if (target.value === '') {
    return target.value = target.getAttribute('placeholder');
  }
};

exports$1 = function() {};

if (document.createElement("input").placeholder == null) {
  exports$1 = function(input) {
    var ref;
    input = (ref = input[0]) != null ? ref : input;
    if (input._placeholdered != null) {
      return;
    }
    Object.defineProperty(input, '_placeholdered', {
      value: true,
      writable: true
    });
    if (!input.value) {
      input.value = input.getAttribute('placeholder');
    }
    if (input.addEventListener) {
      input.addEventListener('click', hidePlaceholderOnFocus, false);
      return input.addEventListener('blur', unfocusOnAnElement, false);
    } else if (input.attachEvent) {
      input.attachEvent('onclick', hidePlaceholderOnFocus);
      return input.attachEvent('onblur', unfocusOnAnElement);
    }
  };
}

var placeholder = exports$1;

// templates/controls/text.pug
var html$2 = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" type=\"{ type }\" onchange=\"{ change }\" onblur=\"{ change }\" riot-value=\"{ input.ref.get(input.name) }\" autocomplete=\"{ autocomplete }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" readonly=\"{ readonly }\" placeholder=\"{ placeholder }\">\n</yield>\n<yield from=\"label\">\n  <div class=\"label { active: input.ref.get(input.name) || placeholder }\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

// src/controls/text.coffee
var Text;
var extend$8 = function(child, parent) { for (var key in parent) { if (hasProp$7.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$7 = {}.hasOwnProperty;

var Text$1 = Text = (function(superClass) {
  extend$8(Text, superClass);

  function Text() {
    return Text.__super__.constructor.apply(this, arguments);
  }

  Text.prototype.tag = 'text';

  Text.prototype.html = html$2;

  Text.prototype.type = 'text';

  Text.prototype.formElement = 'input';

  Text.prototype.autocomplete = 'on';

  Text.prototype.autofocus = false;

  Text.prototype.disabled = false;

  Text.prototype.maxlength = null;

  Text.prototype.readonly = false;

  Text.prototype.placeholder = null;

  Text.prototype.label = '';

  Text.prototype.instructions = null;

  Text.prototype.init = function() {
    Text.__super__.init.apply(this, arguments);
    return this.on('mounted', (function(_this) {
      return function() {
        var el;
        el = _this.root.getElementsByTagName(_this.formElement)[0];
        if (_this.type !== 'password') {
          return placeholder(el);
        }
      };
    })(this));
  };

  return Text;

})(Control$1);

Text.register();

// templates/controls/currency.pug
var html$3 = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" type=\"{ type }\" onchange=\"{ change }\" onblur=\"{ change }\" riot-value=\"{ renderValue() }\" autocomplete=\"{ autocomplete }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" readonly=\"{ readonly }\" placeholder=\"{ placeholder }\">\n</yield>\n<yield from=\"label\">\n  <div class=\"label { active: input.ref.get(input.name) || placeholder }\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

// node_modules/shop.js-util/src/data/currencies.coffee
var currencies = {
  data: {
    'aud': '$',
    'cad': '$',
    'eur': '€',
    'gbp': '£',
    'hkd': '$',
    'jpy': '¥',
    'nzd': '$',
    'sgd': '$',
    'usd': '$',
    'ghc': '¢',
    'ars': '$',
    'bsd': '$',
    'bbd': '$',
    'bmd': '$',
    'bnd': '$',
    'kyd': '$',
    'clp': '$',
    'cop': '$',
    'xcd': '$',
    'svc': '$',
    'fjd': '$',
    'gyd': '$',
    'lrd': '$',
    'mxn': '$',
    'nad': '$',
    'sbd': '$',
    'srd': '$',
    'tvd': '$',
    'bob': '$b',
    'uyu': '$u',
    'egp': '£',
    'fkp': '£',
    'gip': '£',
    'ggp': '£',
    'imp': '£',
    'jep': '£',
    'lbp': '£',
    'shp': '£',
    'syp': '£',
    'cny': '¥',
    'afn': '؋',
    'thb': '฿',
    'khr': '៛',
    'crc': '₡',
    'trl': '₤',
    'ngn': '₦',
    'kpw': '₩',
    'krw': '₩',
    'ils': '₪',
    'vnd': '₫',
    'lak': '₭',
    'mnt': '₮',
    'cup': '₱',
    'php': '₱',
    'uah': '₴',
    'mur': '₨',
    'npr': '₨',
    'pkr': '₨',
    'scr': '₨',
    'lkr': '₨',
    'irr': '﷼',
    'omr': '﷼',
    'qar': '﷼',
    'sar': '﷼',
    'yer': '﷼',
    'pab': 'b/.',
    'vef': 'bs',
    'bzd': 'bz$',
    'nio': 'c$',
    'chf': 'chf',
    'huf': 'ft',
    'awg': 'ƒ',
    'ang': 'ƒ',
    'pyg': 'gs',
    'jmd': 'j$',
    'czk': 'kč',
    'bam': 'km',
    'hrk': 'kn',
    'dkk': 'kr',
    'eek': 'kr',
    'isk': 'kr',
    'nok': 'kr',
    'sek': 'kr',
    'hnl': 'l',
    'ron': 'lei',
    'all': 'lek',
    'lvl': 'ls',
    'ltl': 'lt',
    'mzn': 'mt',
    'twd': 'nt$',
    'bwp': 'p',
    'byr': 'p.',
    'gtq': 'q',
    'zar': 'r',
    'brl': 'r$',
    'dop': 'rd$',
    'myr': 'rm',
    'idr': 'rp',
    'sos': 's',
    'pen': 's/.',
    'ttd': 'tt$',
    'zwd': 'z$',
    'pln': 'zł',
    'mkd': 'ден',
    'rsd': 'Дин.',
    'bgn': 'лв',
    'kzt': 'лв',
    'kgs': 'лв',
    'uzs': 'лв',
    'azn': 'ман',
    'rub': 'руб',
    'inr': '',
    'try': '',
    '': ''
  }
};

// node_modules/shop.js-util/src/currency.coffee
var currencySeparator;
var currencySigns;
var digitsOnlyRe;

currencySeparator = '.';

digitsOnlyRe = new RegExp('[^\\d.-]', 'g');

currencySigns = currencies.data;

var isZeroDecimal = function(code) {
  if (code) {
    code = code.toLowerCase();
  }
  if (code === 'bif' || code === 'clp' || code === 'djf' || code === 'gnf' || code === 'jpy' || code === 'kmf' || code === 'krw' || code === 'mga' || code === 'pyg' || code === 'rwf' || code === 'vnd' || code === 'vuv' || code === 'xaf' || code === 'xof' || code === 'xpf') {
    return true;
  }
  return false;
};



var renderUICurrencyFromJSON = function(code, jsonCurrency) {
  var currentCurrencySign, ref;
  if (code) {
    code = code.toLowerCase();
  }
  if (isNaN(jsonCurrency)) {
    jsonCurrency = 0;
  }
  currentCurrencySign = (ref = currencySigns[code]) != null ? ref : '';
  if (code === 'eth' || code === 'btc' || code === 'xbt') {
    jsonCurrency = jsonCurrency / 1e9;
    return currentCurrencySign + jsonCurrency;
  }
  jsonCurrency = '' + jsonCurrency;
  if (isZeroDecimal(code)) {
    return currentCurrencySign + jsonCurrency;
  }
  while (jsonCurrency.length < 3) {
    jsonCurrency = '0' + jsonCurrency;
  }
  return currentCurrencySign + jsonCurrency.substr(0, jsonCurrency.length - 2) + '.' + jsonCurrency.substr(-2);
};

var renderJSONCurrencyFromUI = function(code, uiCurrency) {
  var currentCurrencySign, parts;
  if (code) {
    code = code.toLowerCase();
  }
  currentCurrencySign = currencySigns[code];
  if (code === 'eth' || code === 'btc' || code === 'xbt') {
    return parseFloat(('' + uiCurrency).replace(digitsOnlyRe, '')) * 1e9;
  }
  if (isZeroDecimal(code)) {
    return parseInt(('' + uiCurrency).replace(digitsOnlyRe, '').replace(currencySeparator, ''), 10);
  }
  parts = uiCurrency.split(currencySeparator);
  if (parts.length > 1) {
    parts[1] = parts[1].substr(0, 2);
    while (parts[1].length < 2) {
      parts[1] += '0';
    }
  } else {
    parts[1] = '00';
  }
  return parseInt(parseFloat(parts[0].replace(digitsOnlyRe, '')) * 100 + parseFloat(parts[1].replace(digitsOnlyRe, '')), 10);
};

// src/controls/currency.coffee
var Currency;
var extend$7 = function(child, parent) { for (var key in parent) { if (hasProp$6.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$6 = {}.hasOwnProperty;

var currency = Currency = (function(superClass) {
  extend$7(Currency, superClass);

  function Currency() {
    return Currency.__super__.constructor.apply(this, arguments);
  }

  Currency.prototype.tag = 'currency';

  Currency.prototype.html = html$3;

  Currency.prototype.currency = '';

  Currency.prototype.init = function() {
    Currency.__super__.init.apply(this, arguments);
    return this.on('mounted', (function(_this) {
      return function() {
        var el;
        el = _this.root.getElementsByTagName(_this.formElement)[0];
        if (_this.type !== 'password') {
          return placeholder(el);
        }
      };
    })(this));
  };

  Currency.prototype.getCurrency = function(e) {
    var currency;
    currency = this.currency;
    if (typeof currency === 'function') {
      return currency();
    }
    return currency;
  };

  Currency.prototype.renderValue = function() {
    return renderUICurrencyFromJSON(this.getCurrency(), this.input.ref.get(input.name));
  };

  Currency.prototype.getValue = function(e) {
    var el, ref;
    el = e.target;
    return renderJSONCurrencyFromUI(this.getCurrency(), ((ref = el.value) != null ? ref : '0').trim());
  };

  return Currency;

})(Text$1);

Currency.register();

// node_modules/zepto-modules/zepto.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array };

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector;
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent;
    if (temp) (parent = tempParent).appendChild(element);
    match = ~zepto.qsa(parent, selector).indexOf(element);
    temp && tempParent.removeChild(element);
    return match
  };

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj);

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) };
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) };

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display;
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName);
      document.body.appendChild(element);
      display = getComputedStyle(element, '').getPropertyValue("display");
      element.parentNode.removeChild(element);
      display == "none" && (display = "block");
      elementDisplay[nodeName] = display;
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0;
    for (i = 0; i < len; i++) this[i] = dom[i];
    this.length = len;
    this.selector = selector || '';
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container;

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
      if (!(name in containers)) name = '*';

      container = containers[name];
      container.innerHTML = '' + html;
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this);
      });
    }

    if (isPlainObject(properties)) {
      nodes = $(dom);
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value);
        else nodes.attr(key, value);
      });
    }

    return dom
  };

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  };

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  };

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function(selector, context) {
    var dom;
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim();
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector);
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector);
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null;
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector);
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  };

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  };

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {};
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = [];
        extend(target[key], source[key], deep);
      }
      else if (source[key] !== undefined) target[key] = source[key];
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1);
    if (typeof target == 'boolean') {
      deep = target;
      target = args.shift();
    }
    args.forEach(function(arg){ extend(target, arg, deep); });
    return target
  };

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly);
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  };

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    };

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined;

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value);
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type;
  $.isFunction = isFunction;
  $.isWindow = isWindow;
  $.isArray = isArray;
  $.isPlainObject = isPlainObject;

  $.isEmptyObject = function(obj) {
    var name;
    for (name in obj) return false
    return true
  };

  $.isNumeric = function(val) {
    var num = Number(val), type = typeof val;
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  };

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  };

  $.camelCase = camelize;
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  };

  // plugin compatibility
  $.uuid = 0;
  $.support = { };
  $.expr = { };
  $.noop = function() {};

  $.map = function(elements, callback){
    var value, values = [], i, key;
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i);
        if (value != null) values.push(value);
      }
    else
      for (key in elements) {
        value = callback(elements[key], key);
        if (value != null) values.push(value);
      }
    return flatten(values)
  };

  $.each = function(elements, callback){
    var i, key;
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  };

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  };

  if (window.JSON) $.parseJSON = JSON.parse;

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
  });

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function(){
      var i, value, args = [];
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i];
        args[i] = zepto.isZ(value) ? value.toArray() : value;
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($);
      else document.addEventListener('DOMContentLoaded', function(){ callback($); }, false);
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this);
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      });
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[];
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this);
        });
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector);
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el);
        });
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0];
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1];
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this;
      if (!selector) result = $();
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this;
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        });
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector));
      else result = this.map(function(){ return zepto.qsa(this, selector) });
      return result
    },
    closest: function(selector, context){
      var nodes = [], collection = typeof selector == 'object' && $(selector);
      this.each(function(_, node){
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode;
        if (node && nodes.indexOf(node) < 0) nodes.push(node);
      });
      return $(nodes)
    },
    parents: function(selector){
      var ancestors = [], nodes = this;
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node
          }
        });
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = ''; })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '');
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName);
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure);
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1;

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        );
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure));
        var children;
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first();
        $(structure).append(this);
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure);
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure;
        contents.length ? contents.wrapAll(dom) : self.append(dom);
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children());
      });
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this);(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide();
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML;
          $(this).empty().append( funcArg(this, html, idx, originHtml) );
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent);
          this.textContent = newText == null ? '' : ''+newText;
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result;
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key]);
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute);
      }, this);})
    },
    prop: function(name, value){
      name = propMap[name] || name;
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name]);
        }) :
        (this[0] && this[0][name])
    },
    removeProp: function(name){
      name = propMap[name] || name;
      return this.each(function(){ delete this[name]; })
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName);

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      if (0 in arguments) {
        if (value == null) value = "";
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value);
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            };

        if ($this.css('position') == 'static') props['position'] = 'relative';
        $this.css(props);
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0];
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {};
          var computedStyle = getComputedStyle(element, '');
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop));
          });
          return props
        }
      }

      var css = '';
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)); });
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value);
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)); });
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
      }

      return this.each(function(){ this.style.cssText += ';' + css; })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = [];
        var cls = className(this), newName = funcArg(this, name, idx, cls);
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass);
        }, this);
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "));
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this);
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ");
        });
        className(this, classList.trim());
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this));
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass);
        });
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0];
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value; } :
        function(){ this.scrollTo(this.scrollX, value); })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0];
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value; } :
        function(){ this.scrollTo(value, this.scrollY); })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0;
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0;

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0;
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0;

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent;
        return parent
      })
    }
  };

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() });

    $.fn[dimension] = function(value){
      var offset, el = this[0];
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this);
        el.css(dimension, funcArg(this, value, idx, el[dimension]()));
      })
    };
  });

  function traverseNode(node, fun) {
    fun(node);
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun);
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2; //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            var arr = [];
            argType = type(arg);
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el));
              });
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1;
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode;

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null;

        var parentInDocument = $.contains(document.documentElement, parent);

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true);
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target);
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src){
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
              target['eval'].call(target, el.innerHTML);
            }
          });
        });
      })
    };

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this);
      return this
    };
  });

  zepto.Z.prototype = Z.prototype = $.fn;

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq;
  zepto.deserializeValue = deserializeValue;
  $.zepto = zepto;

  return $
})();

var zepto = Zepto;

//  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/zepto-modules/zepto.js

// node_modules/zepto-modules/event.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.



(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) var matcher = matcherFor(event.ns);
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []));
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event);
      handler.fn    = fn;
      handler.sel   = selector;
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget;
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      };
      handler.del   = delegator;
      var callback  = delegator || fn;
      handler.proxy = function(e){
        e = compatible(e);
        if (e.isImmediatePropagationStopped()) return
        e.data = data;
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
        if (result === false) e.preventDefault(), e.stopPropagation();
        return result
      };
      handler.i = set.length;
      set.push(handler);
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
    });
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element);(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i];
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
      });
    });
  }

  $.event = { add: add, remove: remove };

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2);
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) };
      proxyFn._zid = zid(fn);
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn);
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  };

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  };
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  };
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  };

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      };

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event);

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name];
        event[name] = function(){
          this[predicate] = returnTrue;
          return sourceMethod && sourceMethod.apply(source, arguments)
        };
        event[predicate] = returnFalse;
      });

      try {
        event.timeStamp || (event.timeStamp = Date.now());
      } catch (ignored) { }

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue;
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event };
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  };
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  };

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback);
    return this
  };
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback);
    return this
  };

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this;
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one);
      });
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined;
    if (callback === undefined || data === false)
      callback = data, data = undefined;

    if (callback === false) callback = returnFalse;

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback);
        return callback.apply(this, arguments)
      };

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0);
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element});
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      };

      add(element, event, callback, data, selector, delegator || autoRemove);
    })
  };
  $.fn.off = function(event, selector, callback){
    var $this = this;
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn);
      });
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined;

    if (callback === false) callback = returnFalse;

    return $this.each(function(){
      remove(this, event, callback, selector);
    })
  };

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event);
    event._args = args;
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]();
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event);
      else $(this).triggerHandler(event, args);
    })
  };

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result;
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event);
      e._args = args;
      e.target = element;
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e);
        if (e.isImmediatePropagationStopped()) return false
      });
    });
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    };
  });

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type;
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true;
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
    event.initEvent(type, bubbles, true);
    return compatible(event)
  };

})(zepto);

// node_modules/zepto-modules/ie.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function(){
  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined);
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element, pseudoElement){
      try {
        return nativeGetComputedStyle(element, pseudoElement)
      } catch(e) {
        return null
      }
    };
  }
})();

// node_modules/zepto-modules/stack.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.



(function($){
  $.fn.end = function(){
    return this.prevObject || $()
  };

  $.fn.andSelf = function(){
    return this.add(this.prevObject || $())
  };

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property];
    $.fn[property] = function(){
      var ret = fn.apply(this, arguments);
      ret.prevObject = this;
      return ret
    };
  });
})(zepto);

// node_modules/zepto-modules/selector.js
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.



(function($){
  var zepto$$2 = $.zepto, oldQsa = zepto$$2.qsa, oldMatches = zepto$$2.matches;

  function visible(elem){
    elem = $(elem);
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  // Implements a subset from:
  // http://api.jquery.com/category/selectors/jquery-selector-extensions/
  //
  // Each filter function receives the current index, all nodes in the
  // considered set, and a value if there were parentheses. The value
  // of `this` is the node currently being considered. The function returns the
  // resulting node(s), null, or undefined.
  //
  // Complex selectors are not supported:
  //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
  //   ul.inner:first > li
  var filters = $.expr[':'] = {
    visible:  function(){ if (visible(this)) return this },
    hidden:   function(){ if (!visible(this)) return this },
    selected: function(){ if (this.selected) return this },
    checked:  function(){ if (this.checked) return this },
    parent:   function(){ return this.parentNode },
    first:    function(idx){ if (idx === 0) return this },
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
    eq:       function(idx, _, value){ if (idx === value) return this },
    contains: function(idx, _, text){ if ($(this).text().indexOf(text) > -1) return this },
    has:      function(idx, _, sel){ if (zepto$$2.qsa(this, sel).length) return this }
  };

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe  = /^\s*>/,
      classTag = 'Zepto' + (+new Date());

  function process(sel, fn) {
    // quote the hash in `a[href^=#]` expression
    sel = sel.replace(/=#\]/g, '="#"]');
    var filter, arg, match = filterRe.exec(sel);
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3];
      sel = match[1];
      if (arg) {
        var num = Number(arg);
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '');
        else arg = num;
      }
    }
    return fn(sel, filter, arg)
  }

  zepto$$2.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg){
      try {
        var taggedParent;
        if (!sel && filter) sel = '*';
        else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
          taggedParent = $(node).addClass(classTag), sel = '.'+classTag+' '+sel;

        var nodes = oldQsa(node, sel);
      } catch(e) {
        console.error('error performing selector: %o', selector);
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag);
      }
      return !filter ? nodes :
        zepto$$2.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  };

  zepto$$2.matches = function(node, selector){
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  };
})(zepto);

// src/$.coffee
var $$2;

$$2 = zepto;

if (window.$ == null) {
  ['width', 'height'].forEach(function(dimension) {
    var Dimension;
    Dimension = dimension.replace(/./, function(m) {
      return m[0].toUpperCase();
    });
    return $$2.fn['outer' + Dimension] = function(margin) {
      var elem, sides, size;
      elem = this;
      if (elem) {
        size = elem[dimension]();
        sides = {
          width: ['left', 'right'],
          height: ['top', 'bottom']
        };
        sides[dimension].forEach(function(side) {
          if (margin) {
            return size += parseInt(elem.css('margin-' + side), 10);
          }
        });
        return size;
      } else {
        return null;
      }
    };
  });
  window.$ = $$2;
} else {
  $$2 = window.$;
}

var $$3 = $$2;

// node_modules/es-sifter/sifter.mjs
var DIACRITICS = {
    'a': '[aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ]',
    'b': '[b␢βΒB฿𐌁ᛒ]',
    'c': '[cĆćĈĉČčĊċC̄c̄ÇçḈḉȻȼƇƈɕᴄＣｃ]',
    'd': '[dĎďḊḋḐḑḌḍḒḓḎḏĐđD̦d̦ƉɖƊɗƋƌᵭᶁᶑȡᴅＤｄð]',
    'e': '[eÉéÈèÊêḘḙĚěĔĕẼẽḚḛẺẻĖėËëĒēȨȩĘęᶒɆɇȄȅẾếỀềỄễỂểḜḝḖḗḔḕȆȇẸẹỆệⱸᴇＥｅɘǝƏƐε]',
    'f': '[fƑƒḞḟ]',
    'g': '[gɢ₲ǤǥĜĝĞğĢģƓɠĠġ]',
    'h': '[hĤĥĦħḨḩẖẖḤḥḢḣɦʰǶƕ]',
    'i': '[iÍíÌìĬĭÎîǏǐÏïḮḯĨĩĮįĪīỈỉȈȉȊȋỊịḬḭƗɨɨ̆ᵻᶖİiIıɪＩｉ]',
    'j': '[jȷĴĵɈɉʝɟʲ]',
    'k': '[kƘƙꝀꝁḰḱǨǩḲḳḴḵκϰ₭]',
    'l': '[lŁłĽľĻļĹĺḶḷḸḹḼḽḺḻĿŀȽƚⱠⱡⱢɫɬᶅɭȴʟＬｌ]',
    'n': '[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲȠƞᵰᶇɳȵɴＮｎŊŋ]',
    'o': '[oØøÖöÓóÒòÔôǑǒŐőŎŏȮȯỌọƟɵƠơỎỏŌōÕõǪǫȌȍՕօ]',
    'p': '[pṔṕṖṗⱣᵽƤƥᵱ]',
    'q': '[qꝖꝗʠɊɋꝘꝙq̃]',
    'r': '[rŔŕɌɍŘřŖŗṘṙȐȑȒȓṚṛⱤɽ]',
    's': '[sŚśṠṡṢṣꞨꞩŜŝŠšŞşȘșS̈s̈]',
    't': '[tŤťṪṫŢţṬṭƮʈȚțṰṱṮṯƬƭ]',
    'u': '[uŬŭɄʉỤụÜüÚúÙùÛûǓǔŰűŬŭƯưỦủŪūŨũŲųȔȕ∪]',
    'v': '[vṼṽṾṿƲʋꝞꝟⱱʋ]',
    'w': '[wẂẃẀẁŴŵẄẅẆẇẈẉ]',
    'x': '[xẌẍẊẋχ]',
    'y': '[yÝýỲỳŶŷŸÿỸỹẎẏỴỵɎɏƳƴ]',
    'z': '[zŹźẐẑŽžŻżẒẓẔẕƵƶ]'
};

var asciifold = (function() {
    var i, n, k, chunk;
    var foreignletters = '';
    var lookup = {};
    for (k in DIACRITICS) {
        if (DIACRITICS.hasOwnProperty(k)) {
            chunk = DIACRITICS[k].substring(2, DIACRITICS[k].length - 1);
            foreignletters += chunk;
            for (i = 0, n = chunk.length; i < n; i++) {
                lookup[chunk.charAt(i)] = k;
            }
        }
    }
    var regexp = new RegExp('[' +  foreignletters + ']', 'g');
    return function(str) {
        return str.replace(regexp, function(foreignletter) {
            return lookup[foreignletter];
        }).toLowerCase();
    };
})();

function cmp(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
        return a > b ? 1 : (a < b ? -1 : 0);
    }
    a = asciifold(String(a || ''));
    b = asciifold(String(b || ''));
    if (a > b) return 1;
    if (b > a) return -1;
    return 0;
}

function extend$10(a, b) {
    var i, n, k, object;
    for (i = 1, n = arguments.length; i < n; i++) {
        object = arguments[i];
        if (!object) continue;
        for (k in object) {
            if (object.hasOwnProperty(k)) {
                a[k] = object[k];
            }
        }
    }
    return a;
}

/**
 * A property getter resolving dot-notation
 * @param  {Object}  obj     The root object to fetch property on
 * @param  {String}  name    The optionally dotted property name to fetch
 * @param  {Boolean} nesting Handle nesting or not
 * @return {Object}          The resolved property value
 */
function getattr(obj, name, nesting) {
    if (!obj || !name) return;
    if (!nesting) return obj[name];
    var names = name.split('.');
    while(names.length && (obj = obj[names.shift()]));
    return obj;
}

function trim(str) {
    return (str + '').replace(/^\s+|\s+$|/g, '');
}

function escapeRegex(str) {
    return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
}

const isArray$1 = Array.isArray || (typeof $ !== 'undefined' && $.isArray) || function(object) {
    return Object.prototype.toString.call(object) === '[object Array]';
};

/**
 * sifter.js
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

/**
 * Textually searches arrays and hashes of objects
 * by property (or multiple properties). Designed
 * specifically for autocomplete.
 *
 * @constructor
 * @param {array|object} items
 * @param {object} items
 */
function Sifter(items, settings) {
    this.items = items;
    this.settings = settings || {diacritics: true};
}

/**
 * Splits a search string into an array of individual
 * regexps to be used to match results.
 *
 * @param {string} query
 * @returns {array}
 */
Sifter.prototype.tokenize = function(query) {
    query = trim(String(query || '').toLowerCase());
    if (!query || !query.length) return [];

    var i, n, regex, letter;
    var tokens = [];
    var words = query.split(/ +/);

    for (i = 0, n = words.length; i < n; i++) {
        regex = escapeRegex(words[i]);
        if (this.settings.diacritics) {
            for (letter in DIACRITICS) {
                if (DIACRITICS.hasOwnProperty(letter)) {
                    regex = regex.replace(new RegExp(letter, 'g'), DIACRITICS[letter]);
                }
            }
        }
        tokens.push({
            string : words[i],
            regex  : new RegExp(regex, 'i')
        });
    }

    return tokens;
};

/**
 * Iterates over arrays and hashes.
 *
 * ```
 * this.iterator(this.items, function(item, id) {
 *    // invoked for each item
 * });
 * ```
 *
 * @param {array|object} object
 */
Sifter.prototype.iterator = function(object, callback) {
    var iterator;
    if (isArray$1(object)) {
        iterator = Array.prototype.forEach || function(callback) {
            for (var i = 0, n = this.length; i < n; i++) {
                callback(this[i], i, this);
            }
        };
    } else {
        iterator = function(callback) {
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    callback(this[key], key, this);
                }
            }
        };
    }

    iterator.apply(object, [callback]);
};

/**
 * Returns a function to be used to score individual results.
 *
 * Good matches will have a higher score than poor matches.
 * If an item is not a match, 0 will be returned by the function.
 *
 * @param {object|string} search
 * @param {object} options (optional)
 * @returns {function}
 */
Sifter.prototype.getScoreFunction = function(search, options) {
    var self, fields, tokens, tokenCount, nesting;

    self       = this;
    search     = self.prepareSearch(search, options);
    tokens     = search.tokens;
    fields     = search.options.fields;
    tokenCount = tokens.length;
    nesting    = search.options.nesting;

    /**
     * Calculates how close of a match the
     * given value is against a search token.
     *
     * @param {mixed} value
     * @param {object} token
     * @return {number}
     */
     function scoreValue(value, token) {
        var score, pos;

        if (!value) return 0;
        value = String(value || '');
        pos = value.search(token.regex);
        if (pos === -1) return 0;
        score = token.string.length / value.length;
        if (pos === 0) score += 0.5;
        return score;
    }

    /**
     * Calculates the score of an object
     * against the search query.
     *
     * @param {object} token
     * @param {object} data
     * @return {number}
     */
    var scoreObject = (function() {
        var fieldCount = fields.length;
        if (!fieldCount) {
            return function() { return 0; };
        }
        if (fieldCount === 1) {
            return function(token, data) {
                return scoreValue(getattr(data, fields[0], nesting), token);
            };
        }
        return function(token, data) {
            for (var i = 0, sum = 0; i < fieldCount; i++) {
                sum += scoreValue(getattr(data, fields[i], nesting), token);
            }
            return sum / fieldCount;
        };
    })();

    if (!tokenCount) {
        return function() { return 0; };
    }
    if (tokenCount === 1) {
        return function(data) {
            return scoreObject(tokens[0], data);
        };
    }

    if (search.options.conjunction === 'and') {
        return function(data) {
            var score;
            for (var i = 0, sum = 0; i < tokenCount; i++) {
                score = scoreObject(tokens[i], data);
                if (score <= 0) return 0;
                sum += score;
            }
            return sum / tokenCount;
        };
    } else {
        return function(data) {
            for (var i = 0, sum = 0; i < tokenCount; i++) {
                sum += scoreObject(tokens[i], data);
            }
            return sum / tokenCount;
        };
    }
};

/**
 * Returns a function that can be used to compare two
 * results, for sorting purposes. If no sorting should
 * be performed, `null` will be returned.
 *
 * @param {string|object} search
 * @param {object} options
 * @return function(a,b)
 */
Sifter.prototype.getSortFunction = function(search, options) {
    var i, n, self, field, fields, fieldsCount, multiplier, multipliers, sort, implicitScore;

    self   = this;
    search = self.prepareSearch(search, options);
    sort   = (!search.query && options.sortEmpty) || options.sort;

    /**
     * Fetches the specified sort field value
     * from a search result item.
     *
     * @param  {string} name
     * @param  {object} result
     * @return {mixed}
     */
    function getField(name, result) {
        if (name === '$score') return result.score;
        return getattr(self.items[result.id], name, options.nesting);
    }

    // parse options
    fields = [];
    if (sort) {
        for (i = 0, n = sort.length; i < n; i++) {
            if (search.query || sort[i].field !== '$score') {
                fields.push(sort[i]);
            }
        }
    }

    // the "$score" field is implied to be the primary
    // sort field, unless it's manually specified
    if (search.query) {
        implicitScore = true;
        for (i = 0, n = fields.length; i < n; i++) {
            if (fields[i].field === '$score') {
                implicitScore = false;
                break;
            }
        }
        if (implicitScore) {
            fields.unshift({field: '$score', direction: 'desc'});
        }
    } else {
        for (i = 0, n = fields.length; i < n; i++) {
            if (fields[i].field === '$score') {
                fields.splice(i, 1);
                break;
            }
        }
    }

    multipliers = [];
    for (i = 0, n = fields.length; i < n; i++) {
        multipliers.push(fields[i].direction === 'desc' ? -1 : 1);
    }

    // build function
    fieldsCount = fields.length;
    if (!fieldsCount) {
        return null;
    } else if (fieldsCount === 1) {
        field = fields[0].field;
        multiplier = multipliers[0];
        return function(a, b) {
            return multiplier * cmp(
                getField(field, a),
                getField(field, b)
            );
        };
    } else {
        return function(a, b) {
            var i, result, field;
            for (i = 0; i < fieldsCount; i++) {
                field = fields[i].field;
                result = multipliers[i] * cmp(
                    getField(field, a),
                    getField(field, b)
                );
                if (result) return result;
            }
            return 0;
        };
    }
};

/**
 * Parses a search query and returns an object
 * with tokens and fields ready to be populated
 * with results.
 *
 * @param {string} query
 * @param {object} options
 * @returns {object}
 */
Sifter.prototype.prepareSearch = function(query, options) {
    if (typeof query === 'object') return query;

    options = extend$10({}, options);

    var optionFields     = options.fields;
    var optionSort       = options.sort;
    var optionSortEmpty = options.sortEmpty;

    if (optionFields && !isArray$1(optionFields)) options.fields = [optionFields];
    if (optionSort && !isArray$1(optionSort)) options.sort = [optionSort];
    if (optionSortEmpty && !isArray$1(optionSortEmpty)) options.sortEmpty = [optionSortEmpty];

    return {
        options : options,
        query   : String(query || '').toLowerCase(),
        tokens  : this.tokenize(query),
        total   : 0,
        items   : []
    };
};

/**
 * Searches through all items and returns a sorted array of matches.
 *
 * The `options` parameter can contain:
 *
 *   - fields {string|array}
 *   - sort {array}
 *   - score {function}
 *   - filter {bool}
 *   - limit {integer}
 *
 * Returns an object containing:
 *
 *   - options {object}
 *   - query {string}
 *   - tokens {array}
 *   - total {int}
 *   - items {array}
 *
 * @param {string} query
 * @param {object} options
 * @returns {object}
 */
Sifter.prototype.search = function(query, options) {
    var self = this, score, search;
    var fnSort;
    var fnScore;

    search  = this.prepareSearch(query, options);
    options = search.options;
    query   = search.query;

    // generate result scoring function
    fnScore = options.score || self.getScoreFunction(search);

    // perform search and sort
    if (query.length) {
        self.iterator(self.items, function(item, id) {
            score = fnScore(item);
            if (options.filter === false || score > 0) {
                search.items.push({'score': score, 'id': id});
            }
        });
    } else {
        self.iterator(self.items, function(item, id) {
            search.items.push({'score': 1, 'id': id});
        });
    }

    fnSort = self.getSortFunction(search, options);
    if (fnSort) search.items.sort(fnSort);

    // apply limits
    search.total = search.items.length;
    if (typeof options.limit === 'number') {
        search.items = search.items.slice(0, options.limit);
    }

    return search;
};

// node_modules/es-is/array.js
// Generated by CoffeeScript 1.12.5
var isArray$2;

var isArray$3 = isArray$2 = Array.isArray || function(value) {
  return toString(value) === '[object Array]';
};

// node_modules/es-microplugin/microplugin.mjs
// src/index.js
/**
 * microplugin.js
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

const MicroPlugin = {};

MicroPlugin.mixin = function(Interface) {
    Interface.plugins = {};

    /**
     * Initializes the listed plugins (with options).
     * Acceptable formats:
     *
     * List (without options):
     *   ['a', 'b', 'c']
     *
     * List (with options):
     *   [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
     *
     * Hash (with options):
     *   {'a': { ... }, 'b': { ... }, 'c': { ... }}
     *
     * @param {mixed} plugins
     */
    Interface.prototype.initializePlugins = function(plugins) {
        var i, n, key;
        var self  = this;
        var queue = [];

        self.plugins = {
            names     : [],
            settings  : {},
            requested : {},
            loaded    : {}
        };

        if (isArray$3(plugins)) {
            for (i = 0, n = plugins.length; i < n; i++) {
                if (typeof plugins[i] === 'string') {
                    queue.push(plugins[i]);
                } else {
                    self.plugins.settings[plugins[i].name] = plugins[i].options;
                    queue.push(plugins[i].name);
                }
            }
        } else if (plugins) {
            for (key in plugins) {
                if (plugins.hasOwnProperty(key)) {
                    self.plugins.settings[key] = plugins[key];
                    queue.push(key);
                }
            }
        }

        while (queue.length) {
            self.require(queue.shift());
        }
    };

    Interface.prototype.loadPlugin = function(name) {
        var self    = this;
        var plugins = self.plugins;
        var plugin  = Interface.plugins[name];

        if (!Interface.plugins.hasOwnProperty(name)) {
            throw new Error('Unable to find "' +  name + '" plugin');
        }

        plugins.requested[name] = true;
        plugins.loaded[name] = plugin.fn.apply(self, [self.plugins.settings[name] || {}]);
        plugins.names.push(name);
    };

    /**
     * Initializes a plugin.
     *
     * @param {string} name
     */
    Interface.prototype.require = function(name) {
        var self = this;
        var plugins = self.plugins;

        if (!self.plugins.loaded.hasOwnProperty(name)) {
            if (plugins.requested[name]) {
                throw new Error('Plugin has circular dependency ("' + name + '")');
            }
            self.loadPlugin(name);
        }

        return plugins.loaded[name];
    };

    /**
     * Registers a plugin.
     *
     * @param {string} name
     * @param {function} fn
     */
    Interface.define = function(name, fn) {
        Interface.plugins[name] = {
            'name' : name,
            'fn'   : fn
        };
    };
};

// node_modules/es-selectize/dist/js/selectize.mjs
// src/contrib/microevent.js
/**
 * MicroEvent - to make any js object an event emitter
 *
 * - pure javascript - server compatible, browser compatible
 * - dont rely on the browser doms
 * - super simple - you get it immediatly, no mistery, no magic involved
 *
 * @author Jerome Etienne (https://github.com/jeromeetienne)
 */

function MicroEvent() {}

MicroEvent.prototype = {
	on: function(event, fct){
		this._events = this._events || {};
		this._events[event] = this._events[event] || [];
		this._events[event].push(fct);
	},
	off: function(event, fct){
		var n = arguments.length;
		if (n === 0) return delete this._events;
		if (n === 1) return delete this._events[event];

		this._events = this._events || {};
		if (event in this._events === false) return;
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	},
	trigger: function(event /* , args... */){
		this._events = this._events || {};
		if (event in this._events === false) return;
		for (var i = 0; i < this._events[event].length; i++){
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
};

/**
 * Mixin will delegate all MicroEvent.js function in the destination object.
 *
 * - MicroEvent.mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {object} the object which will support MicroEvent
 */
MicroEvent.mixin = function(destObject){
	var props = ['on', 'off', 'trigger'];
	for (var i = 0; i < props.length; i++){
		destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
	}
};

// src/contrib/highlight.js
/**
 * highlight v3 | MIT license | Johann Burkard <jb@eaio.com>
 * Highlights arbitrary terms in a node.
 *
 * - Modified by Marshal <beatgates@gmail.com> 2011-6-24 (added regex)
 * - Modified by Brian Reavis <brian@thirdroute.com> 2012-8-27 (cleanup)
 */

function highlight($element, pattern) {
	if (typeof pattern === 'string' && !pattern.length) return;
	var regex = (typeof pattern === 'string') ? new RegExp(pattern, 'i') : pattern;

	var highlight = function(node) {
		var skip = 0;
		if (node.nodeType === 3) {
			var pos = node.data.search(regex);
			if (pos >= 0 && node.data.length > 0) {
				// var match = node.data.match(regex);
				var spannode = document.createElement('span');
				spannode.className = 'highlight';
				var middlebit = node.splitText(pos);
				// var endbit = middlebit.splitText(match[0].length);
				var middleclone = middlebit.cloneNode(true);
				spannode.appendChild(middleclone);
				middlebit.parentNode.replaceChild(spannode, middlebit);
				skip = 1;
			}
		} else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
			for (var i = 0; i < node.childNodes.length; ++i) {
				i += highlight(node.childNodes[i]);
			}
		}
		return skip;
	};

	return $element.each(function() {
		highlight(this);
	});
}

/**
 * removeHighlight fn copied from highlight v5 and
 * edited to remove with() and pass js strict mode
 */
function init$1() {
    $.fn.removeHighlight = function() {
        return this.find('span.highlight').each(function() {
            // this.parentNode.firstChild.nodeName;
            var parent = this.parentNode;
            parent.replaceChild(this.firstChild, this);
            parent.normalize();
        }).end();
    };
}

// src/defaults.js
var defaults = {
	options: [],
	optgroups: [],

	plugins: [],
	delimiter: ',',
	splitOn: null, // regexp or string for splitting up values from a paste command
	persist: true,
	diacritics: true,
	create: false,
	createOnBlur: false,
	createFilter: null,
	highlight: true,
	openOnFocus: true,
	maxOptions: 1000,
	maxItems: null,
	hideSelected: null,
	addPrecedence: false,
	selectOnTab: false,
	preload: false,
	allowEmptyOption: false,
	closeAfterSelect: false,

	scrollDuration: 60,
	loadThrottle: 300,
	loadingClass: 'loading',

	dataAttr: 'data-data',
	optgroupField: 'optgroup',
	valueField: 'value',
	labelField: 'text',
	optgroupLabelField: 'label',
	optgroupValueField: 'value',
	lockOptgroupOrder: false,

	sortField: '$order',
	searchField: ['text'],
	searchConjunction: 'and',

	mode: null,
	wrapperClass: 'selectize-control',
	inputClass: 'selectize-input',
	dropdownClass: 'selectize-dropdown',
	dropdownContentClass: 'selectize-dropdown-content',

	dropdownParent: null,

	copyClassesToDropdown: true,

	/*
	load                 : null, // function(query, callback) { ... }
	score                : null, // function(search) { ... }
	onInitialize         : null, // function() { ... }
	onChange             : null, // function(value) { ... }
	onItemAdd            : null, // function(value, $item) { ... }
	onItemRemove         : null, // function(value) { ... }
	onClear              : null, // function() { ... }
	onOptionAdd          : null, // function(value, data) { ... }
	onOptionRemove       : null, // function(value) { ... }
	onOptionClear        : null, // function() { ... }
	onOptionGroupAdd     : null, // function(id, data) { ... }
	onOptionGroupRemove  : null, // function(id) { ... }
	onOptionGroupClear   : null, // function() { ... }
	onDropdownOpen       : null, // function($dropdown) { ... }
	onDropdownClose      : null, // function($dropdown) { ... }
	onType               : null, // function(str) { ... }
	onDelete             : null, // function(values) { ... }
	*/

	render: {
		/*
		item: null,
		optgroup: null,
		optgroup_header: null,
		option: null,
		option_create: null
		*/
	}
};

// src/consts.js
var IS_MAC        = /Mac/.test(navigator.userAgent);

var KEY_A         = 65;

var KEY_RETURN    = 13;
var KEY_ESC       = 27;
var KEY_LEFT      = 37;
var KEY_UP        = 38;
var KEY_P         = 80;
var KEY_RIGHT     = 39;
var KEY_DOWN      = 40;
var KEY_N         = 78;
var KEY_BACKSPACE = 8;
var KEY_DELETE    = 46;
var KEY_SHIFT     = 16;
var KEY_CMD       = IS_MAC ? 91 : 17;
var KEY_CTRL      = IS_MAC ? 18 : 17;
var KEY_TAB       = 9;

var TAG_SELECT    = 1;
var TAG_INPUT     = 2;

// for now, android support in general is too spotty to support validity
var SUPPORTS_VALIDITY_API = !/android/i.test(window.navigator.userAgent) && !!document.createElement('input').validity;

// src/utils.js
/**
 * Determines if the provided value has been defined.
 *
 * @param {mixed} object
 * @returns {boolean}
 */
function isSet(object) {
	return typeof object !== 'undefined';
}

/**
 * Converts a scalar to its best string representation
 * for hash keys and HTML attribute values.
 *
 * Transformations:
 *   'str'     -> 'str'
 *   null      -> ''
 *   undefined -> ''
 *   true      -> '1'
 *   false     -> '0'
 *   0         -> '0'
 *   1         -> '1'
 *
 * @param {string} value
 * @returns {string|null}
 */
function hashKey(value) {
	if (typeof value === 'undefined' || value === null) return null;
	if (typeof value === 'boolean') return value ? '1' : '0';
	return value + '';
}

/**
 * Escapes a string for use within HTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
	return (str + '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Escapes "$" characters in replacement strings.
 *
 * @param {string} str
 * @returns {string}
 */




/**
 * Wraps `fn` so that it can only be invoked once.
 *
 * @param {function} fn
 * @returns {function}
 */
function once(fn) {
	var called = false;
	return function() {
		if (called) return;
		called = true;
		fn.apply(this, arguments);
	};
}

/**
 * Wraps `fn` so that it can only be called once
 * every `delay` milliseconds (invoked on the falling edge).
 *
 * @param {function} fn
 * @param {int} delay
 * @returns {function}
 */
function debounce(fn, delay) {
	var timeout;
	return function() {
		var self = this;
		var args = arguments;
		window.clearTimeout(timeout);
		timeout = window.setTimeout(function() {
			fn.apply(self, args);
		}, delay);
	};
}

/**
 * Debounce all fired events types listed in `types`
 * while executing the provided `fn`.
 *
 * @param {object} self
 * @param {array} types
 * @param {function} fn
 */
function debounceEvents(self, types, fn) {
	var type;
	var trigger = self.trigger;
	var eventArgs = {};

	// override trigger method
	self.trigger = function() {
		var type = arguments[0];
		if (types.indexOf(type) !== -1) {
			eventArgs[type] = arguments;
		} else {
			return trigger.apply(self, arguments);
		}
	};

	// invoke provided function
	fn.apply(self, []);
	self.trigger = trigger;

	// trigger queued events
	for (type in eventArgs) {
		if (eventArgs.hasOwnProperty(type)) {
			trigger.apply(self, eventArgs[type]);
		}
	}
}

/**
 * A workaround for http://bugs.jquery.com/ticket/6696
 *
 * @param {object} $parent - Parent element to listen on.
 * @param {string} event - Event name.
 * @param {string} selector - Descendant selector to filter by.
 * @param {function} fn - Event handler.
 */
function watchChildEvent($parent, event, selector, fn) {
	$parent.on(event, selector, function(e) {
		var child = e.target;
		while (child && child.parentNode !== $parent[0]) {
			child = child.parentNode;
		}
		e.currentTarget = child;
		return fn.apply(this, [e]);
	});
}

/**
 * Determines the current selection within a text input control.
 * Returns an object containing:
 *   - start
 *   - length
 *
 * @param {object} input
 * @returns {object}
 */
function getSelection(input) {
	var result = {};
	if ('selectionStart' in input) {
		result.start = input.selectionStart;
		result.length = input.selectionEnd - result.start;
	} else if (document.selection) {
		input.focus();
		var sel = document.selection.createRange();
		var selLen = document.selection.createRange().text.length;
		sel.moveStart('character', -input.value.length);
		result.start = sel.text.length - selLen;
		result.length = selLen;
	}
	return result;
}

/**
 * Copies CSS properties from one element to another.
 *
 * @param {object} $from
 * @param {object} $to
 * @param {array} properties
 */
function transferStyles($from, $to, properties) {
	var i, n, styles = {};
	if (properties) {
		for (i = 0, n = properties.length; i < n; i++) {
			styles[properties[i]] = $from.css(properties[i]);
		}
	} else {
		styles = $from.css();
	}
	$to.css(styles);
}

/**
 * Measures the width of a string within a
 * parent element (in pixels).
 *
 * @param {string} str
 * @param {object} $parent
 * @returns {int}
 */
function measureString(str, $parent) {
	if (!str) {
		return 0;
	}

	var $test = $('<test>').css({
		position: 'absolute',
		top: -99999,
		left: -99999,
		width: 'auto',
		padding: 0,
		whiteSpace: 'pre'
	}).text(str).appendTo('body');

	transferStyles($parent, $test, [
		'letterSpacing',
		'fontSize',
		'fontFamily',
		'fontWeight',
		'textTransform'
	]);

	var width = $test.width();
	$test.remove();

	return width;
}

/**
 * Sets up an input to grow horizontally as the user
 * types. If the value is changed manually, you can
 * trigger the "update" handler to resize:
 *
 * $input.trigger('update');
 *
 * @param {object} $input
 */
function autoGrow($input) {
	var currentWidth = null;

	var update = function(e, options) {
		var value, keyCode, printable, placeholder, width;
		var shift, character, selection;
		e = e || window.event || {};
		options = options || {};

		if (e.metaKey || e.altKey) return;
		if (!options.force && $input.data('grow') === false) return;

		value = $input.val();
		if (e.type && e.type.toLowerCase() === 'keydown') {
			keyCode = e.keyCode;
			printable = (
				(keyCode >= 97 && keyCode <= 122) || // a-z
				(keyCode >= 65 && keyCode <= 90)  || // A-Z
				(keyCode >= 48 && keyCode <= 57)  || // 0-9
				keyCode === 32 // space
			);

			if (keyCode === KEY_DELETE || keyCode === KEY_BACKSPACE) {
				selection = getSelection($input[0]);
				if (selection.length) {
					value = value.substring(0, selection.start) + value.substring(selection.start + selection.length);
				} else if (keyCode === KEY_BACKSPACE && selection.start) {
					value = value.substring(0, selection.start - 1) + value.substring(selection.start + 1);
				} else if (keyCode === KEY_DELETE && typeof selection.start !== 'undefined') {
					value = value.substring(0, selection.start) + value.substring(selection.start + 1);
				}
			} else if (printable) {
				shift = e.shiftKey;
				character = String.fromCharCode(e.keyCode);
				if (shift) character = character.toUpperCase();
				else character = character.toLowerCase();
				value += character;
			}
		}

		placeholder = $input.attr('placeholder');
		if (!value && placeholder) {
			value = placeholder;
		}

		width = measureString(value, $input) + 4;
		if (width !== currentWidth) {
			currentWidth = width;
			$input.width(width);
			$input.triggerHandler('resize');
		}
	};

	$input.on('keydown keyup update blur', update);
	update();
}

function domToString(d) {
	var tmp = document.createElement('div');

	tmp.appendChild(d.cloneNode(true));

	return tmp.innerHTML;
}

// src/selectize.js
var inited = false;

function Selectize($input, settings) {
    if (!inited) {
      init$$1();
      inited = true;
    }

	var i, n, dir, input, self = this;
	input = $input[0];
	input.selectize = self;

	// detect rtl environment
	var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
	dir = computedStyle ? computedStyle.getPropertyValue('direction') : input.currentStyle && input.currentStyle.direction;
	dir = dir || $input.parents('[dir]:first').attr('dir') || '';

	// setup default state
	$.extend(self, {
		order            : 0,
		settings         : settings,
		$input           : $input,
		tabIndex         : $input.attr('tabindex') || '',
		tagType          : input.tagName.toLowerCase() === 'select' ? TAG_SELECT : TAG_INPUT,
		rtl              : /rtl/i.test(dir),

		eventNS          : '.selectize' + (++Selectize.count),
		highlightedValue : null,
		isOpen           : false,
		isDisabled       : false,
		isRequired       : $input.is('[required]'),
		isInvalid        : false,
		isLocked         : false,
		isFocused        : false,
		isInputHidden    : false,
		isSetup          : false,
		isShiftDown      : false,
		isCmdDown        : false,
		isCtrlDown       : false,
		ignoreFocus      : false,
		ignoreBlur       : false,
		ignoreHover      : false,
		hasOptions       : false,
		currentResults   : null,
		lastValue        : '',
		caretPos         : 0,
		loading          : 0,
		loadedSearches   : {},

		$activeOption    : null,
		$activeItems     : [],

		optgroups        : {},
		options          : {},
		userOptions      : {},
		items            : [],
		renderCache      : {},
		onSearchChange   : settings.loadThrottle === null ? self.onSearchChange : debounce(self.onSearchChange, settings.loadThrottle)
	});

	// search system
	self.sifter = new Sifter(this.options, {diacritics: settings.diacritics});

	// build options table
	if (self.settings.options) {
		for (i = 0, n = self.settings.options.length; i < n; i++) {
			self.registerOption(self.settings.options[i]);
		}
		delete self.settings.options;
	}

	// build optgroup table
	if (self.settings.optgroups) {
		for (i = 0, n = self.settings.optgroups.length; i < n; i++) {
			self.registerOptionGroup(self.settings.optgroups[i]);
		}
		delete self.settings.optgroups;
	}

	// option-dependent defaults
	self.settings.mode = self.settings.mode || (self.settings.maxItems === 1 ? 'single' : 'multi');
	if (typeof self.settings.hideSelected !== 'boolean') {
		self.settings.hideSelected = self.settings.mode === 'multi';
	}

	self.initializePlugins(self.settings.plugins);
	self.setupCallbacks();
	self.setupTemplates();
	self.setup();
}

function init$$1() {
    // initialize highlight
    init$1();

    // defaults
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Selectize.defaults = defaults;
    Selectize.count    = 0;

    // mixins
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    MicroEvent.mixin(Selectize);
    MicroPlugin.mixin(Selectize);

    // methods
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    $.extend(Selectize.prototype, {

        /**
         * Creates all elements and sets up event bindings.
         */
        setup: function() {
            var self      = this;
            var settings  = self.settings;
            var eventNS   = self.eventNS;
            var $window   = $(window);
            var $document = $(document);
            var $input    = self.$input;

            var $wrapper;
            var $control;
            var $controlInput;
            var $dropdown;
            var $dropdownContent;
            var $dropdownParent;
            var inputMode;
            var classes;
            var classesPlugins;
            var inputId;

            inputMode         = self.settings.mode;
            classes           = $input.attr('class') || '';

            $wrapper          = $('<div>').addClass(settings.wrapperClass).addClass(classes).addClass(inputMode);
            $control          = $('<div>').addClass(settings.inputClass).addClass('items').appendTo($wrapper);
            $controlInput    = $('<input type="text" autocomplete="off" />').appendTo($control).attr('tabindex', $input.is(':disabled') ? '-1' : self.tabIndex);
            $dropdownParent  = $(settings.dropdownParent || $wrapper);
            $dropdown         = $('<div>').addClass(settings.dropdownClass).addClass(inputMode).hide().appendTo($dropdownParent);
            $dropdownContent = $('<div>').addClass(settings.dropdownContentClass).appendTo($dropdown);

            if(inputId = $input.attr('id')) {
                $controlInput.attr('id', inputId + '-selectized');
                $('label[for="'+inputId+'"]').attr('for', inputId + '-selectized');
            }

            if(self.settings.copyClassesToDropdown) {
                $dropdown.addClass(classes);
            }

            $wrapper.css({
                width: $input[0].style.width
            });

            if (self.plugins.names.length) {
                classesPlugins = 'plugin-' + self.plugins.names.join(' plugin-');
                $wrapper.addClass(classesPlugins);
                $dropdown.addClass(classesPlugins);
            }

            if ((settings.maxItems === null || settings.maxItems > 1) && self.tagType === TAG_SELECT) {
                $input.attr('multiple', 'multiple');
            }

            if (self.settings.placeholder) {
                $controlInput.attr('placeholder', settings.placeholder);
            }

            // if splitOn was not passed in, construct it from the delimiter to allow pasting universally
            if (!self.settings.splitOn && self.settings.delimiter) {
                var delimiterEscaped = self.settings.delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                self.settings.splitOn = new RegExp('\\s*' + delimiterEscaped + '+\\s*');
            }

            if ($input.attr('autocorrect')) {
                $controlInput.attr('autocorrect', $input.attr('autocorrect'));
            }

            if ($input.attr('autocapitalize')) {
                $controlInput.attr('autocapitalize', $input.attr('autocapitalize'));
            }

            self.$wrapper          = $wrapper;
            self.$control          = $control;
            self.$controlInput    = $controlInput;
            self.$dropdown         = $dropdown;
            self.$dropdownContent = $dropdownContent;

            $dropdown.on('mouseenter', '[data-selectable]', function() { return self.onOptionHover.apply(self, arguments); });
            $dropdown.on('mousedown click', '[data-selectable]', function() { return self.onOptionSelect.apply(self, arguments); });
            watchChildEvent($control, 'mousedown', '*:not(input)', function() { return self.onItemSelect.apply(self, arguments); });
            autoGrow($controlInput);

            $control.on({
                mousedown : function() { return self.onMouseDown.apply(self, arguments); },
                click     : function() { return self.onClick.apply(self, arguments); }
            });

            $controlInput.on({
                mousedown : function(e) { e.stopPropagation(); },
                keydown   : function() { return self.onKeyDown.apply(self, arguments); },
                keyup     : function() { return self.onKeyUp.apply(self, arguments); },
                keypress  : function() { return self.onKeyPress.apply(self, arguments); },
                resize    : function() { self.positionDropdown.apply(self, []); },
                blur      : function() { return self.onBlur.apply(self, arguments); },
                focus     : function() { self.ignoreBlur = false; return self.onFocus.apply(self, arguments); },
                paste     : function() { return self.onPaste.apply(self, arguments); }
            });

            $document.on('keydown' + eventNS, function(e) {
                self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
                self.isCtrlDown = e[IS_MAC ? 'altKey' : 'ctrlKey'];
                self.isShiftDown = e.shiftKey;
            });

            $document.on('keyup' + eventNS, function(e) {
                if (e.keyCode === KEY_CTRL) self.isCtrlDown = false;
                if (e.keyCode === KEY_SHIFT) self.isShiftDown = false;
                if (e.keyCode === KEY_CMD) self.isCmdDown = false;
            });

            $document.on('mousedown' + eventNS, function(e) {
                if (self.isFocused) {
                    // prevent events on the dropdown scrollbar from causing the control to blur
                    if (e.target === self.$dropdown[0] || e.target.parentNode === self.$dropdown[0]) {
                        return false;
                    }
                    // blur on click outside
                    if (!self.$control.has(e.target).length && e.target !== self.$control[0]) {
                        self.blur(e.target);
                    }
                }
            });

            $window.on(['scroll' + eventNS, 'resize' + eventNS].join(' '), function() {
                if (self.isOpen) {
                    self.positionDropdown.apply(self, arguments);
                }
            });
            $window.on('mousemove' + eventNS, function() {
                self.ignoreHover = false;
            });

            // store original children and tab index so that they can be
            // restored when the destroy() method is called.
            this.revertSettings = {
                $children : $input.children().detach(),
                tabindex  : $input.attr('tabindex')
            };

            $input.attr('tabindex', -1).hide().after(self.$wrapper);

            if ($.isArray(settings.items)) {
                self.setValue(settings.items);
                delete settings.items;
            }

            // feature detect for the validation API
            if (SUPPORTS_VALIDITY_API) {
                $input.on('invalid' + eventNS, function(e) {
                    e.preventDefault();
                    self.isInvalid = true;
                    self.refreshState();
                });
            }

            self.updateOriginalInput();
            self.refreshItems();
            self.refreshState();
            self.updatePlaceholder();
            self.isSetup = true;

            if ($input.is(':disabled')) {
                self.disable();
            }

            self.on('change', this.onChange);

            $input.data('selectize', self);
            $input.addClass('selectized');
            self.trigger('initialize');

            // preload options
            if (settings.preload === true) {
                self.onSearchChange('');
            }

        },

        /**
         * Sets up default rendering functions.
         */
        setupTemplates: function() {
            var self = this;
            var fieldLabel = self.settings.labelField;
            var fieldOptgroup = self.settings.optgroupLabelField;

            var templates = {
                'optgroup': function(data) {
                    return '<div class="optgroup">' + data.html + '</div>';
                },
                'optgroupHeader': function(data, escape) {
                    return '<div class="optgroup-header">' + escape(data[fieldOptgroup]) + '</div>';
                },
                'option': function(data, escape) {
                    return '<div class="option">' + escape(data[fieldLabel]) + '</div>';
                },
                'item': function(data, escape) {
                    return '<div class="item">' + escape(data[fieldLabel]) + '</div>';
                },
                'optionCreate': function(data, escape) {
                    return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                }
            };

            self.settings.render = $.extend({}, templates, self.settings.render);
        },

        /**
         * Maps fired events to callbacks provided
         * in the settings used when creating the control.
         */
        setupCallbacks: function() {
            var key, fn, callbacks = {
                'initialize'      : 'onInitialize',
                'change'          : 'onChange',
                'itemAdd'        : 'onItemAdd',
                'itemRemove'     : 'onItemRemove',
                'clear'           : 'onClear',
                'optionAdd'      : 'onOptionAdd',
                'optionRemove'   : 'onOptionRemove',
                'optionClear'    : 'onOptionClear',
                'optgroupAdd'    : 'onOptionGroupAdd',
                'optgroupRemove' : 'onOptionGroupRemove',
                'optgroupClear'  : 'onOptionGroupClear',
                'dropdownOpen'   : 'onDropdownOpen',
                'dropdownClose'  : 'onDropdownClose',
                'type'            : 'onType',
                'load'            : 'onLoad',
                'focus'           : 'onFocus',
                'blur'            : 'onBlur'
            };

            for (key in callbacks) {
                if (callbacks.hasOwnProperty(key)) {
                    fn = this.settings[callbacks[key]];
                    if (fn) this.on(key, fn);
                }
            }
        },

        /**
         * Triggered when the main control element
         * has a click event.
         *
         * @param {object} e
         * @return {boolean}
         */
        onClick: function(e) {
            var self = this;

            // necessary for mobile webkit devices (manual focus triggering
            // is ignored unless invoked within a click event)
            if (!self.isFocused) {
                self.focus();
                e.preventDefault();
            }
        },

        /**
         * Triggered when the main control element
         * has a mouse down event.
         *
         * @param {object} e
         * @return {boolean}
         */
        onMouseDown: function(e) {
            var self = this;
            var defaultPrevented = e.isDefaultPrevented();

            if (self.isFocused) {
                // retain focus by preventing native handling. if the
                // event target is the input it should not be modified.
                // otherwise, text selection within the input won't work.
                if (e.target !== self.$controlInput[0]) {
                    if (self.settings.mode === 'single') {
                        // toggle dropdown
                        if (self.isOpen)
                          self.close();
                        else
                          self.open();
                    } else if (!defaultPrevented) {
                        self.setActiveItem(null);
                    }
                    return false
                }
            } else {
                // give control focus
                if (!defaultPrevented) {
                    window.setTimeout(function() {
                        self.focus();
                    }, 0);
                }
            }
        },

        /**
         * Triggered when the value of the control has been changed.
         * This should propagate the event to the original DOM
         * input / select element.
         */
        onChange: function() {
            this.$input.trigger('change');
        },

        /**
         * Triggered on <input> paste.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onPaste: function(e) {
            var self = this;

            if (self.isFull() || self.isInputHidden || self.isLocked) {
                e.preventDefault();
                return;
            }

            // If a regex or string is included, this will split the pasted
            // input and create Items for each separate value
            if (self.settings.splitOn) {

                // Wait for pasted text to be recognized in value
                setTimeout(function() {
                    var pastedText = self.$controlInput.val();
                    if(!pastedText.match(self.settings.splitOn)){ return }

                    var splitInput = $.trim(pastedText).split(self.settings.splitOn);
                    for (var i = 0, n = splitInput.length; i < n; i++) {
                        self.createItem(splitInput[i]);
                    }
                }, 0);
            }
        },

        /**
         * Triggered on <input> keypress.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onKeyPress: function(e) {
            if (this.isLocked) return e && e.preventDefault();
            var character = String.fromCharCode(e.keyCode || e.which);
            if (this.settings.create && this.settings.mode === 'multi' && character === this.settings.delimiter) {
                this.createItem();
                e.preventDefault();
                return false;
            }
        },

        /**
         * Triggered on <input> keydown.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onKeyDown: function(e) {
            var self = this;

            if (self.isLocked) {
                if (e.keyCode !== KEY_TAB) {
                    e.preventDefault();
                }
                return;
            }

            switch (e.keyCode) {
                case KEY_A:
                    if (self.isCmdDown) {
                        self.selectAll();
                        return;
                    }
                    break;
                case KEY_ESC:
                    if (self.isOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.close();
                    }
                    return;
                case KEY_N:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_DOWN:
                    if (!self.isOpen && self.hasOptions) {
                        self.open();
                    } else if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $next = self.getAdjacentOption(self.$activeOption, 1);
                        if ($next.length) self.setActiveOption($next, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_P:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_UP:
                    if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $prev = self.getAdjacentOption(self.$activeOption, -1);
                        if ($prev.length) self.setActiveOption($prev, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_RETURN:
                    if (self.isOpen && self.$activeOption) {
                        self.onOptionSelect({currentTarget: self.$activeOption});
                        e.preventDefault();
                    }
                    return;
                case KEY_LEFT:
                    self.advanceSelection(-1, e);
                    return;
                case KEY_RIGHT:
                    self.advanceSelection(1, e);
                    return;
                case KEY_TAB:
                    if (self.settings.selectOnTab && self.isOpen && self.$activeOption) {
                        self.onOptionSelect({currentTarget: self.$activeOption});

                        // Default behaviour is to jump to the next field, we only want this
                        // if the current field doesn't accept any more entries
                        if (!self.isFull()) {
                            e.preventDefault();
                        }
                    }
                    if (self.settings.create && self.createItem()) {
                        e.preventDefault();
                    }
                    return;
                case KEY_BACKSPACE:
                case KEY_DELETE:
                    self.deleteSelection(e);
                    return;
            }

            if ((self.isFull() || self.isInputHidden) && !(IS_MAC ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                return;
            }
        },

        /**
         * Triggered on <input> keyup.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onKeyUp: function(e) {
            var self = this;

            if (self.isLocked) return e && e.preventDefault();
            var value = self.$controlInput.val() || '';
            if (self.lastValue !== value) {
                self.lastValue = value;
                self.onSearchChange(value);
                self.refreshOptions();
                self.trigger('type', value);
            }
        },

        /**
         * Invokes the user-provide option provider / loader.
         *
         * Note: this function is debounced in the Selectize
         * constructor (by `settings.loadThrottle` milliseconds)
         *
         * @param {string} value
         */
        onSearchChange: function(value) {
            var self = this;
            var fn = self.settings.load;
            if (!fn) return;
            if (self.loadedSearches.hasOwnProperty(value)) return;
            self.loadedSearches[value] = true;
            self.load(function(callback) {
                fn.apply(self, [value, callback]);
            });
        },

        /**
         * Triggered on <input> focus.
         *
         * @param {object} e (optional)
         * @returns {boolean}
         */
        onFocus: function(e) {
            var self = this;
            var wasFocused = self.isFocused;

            if (self.isDisabled) {
                self.blur();
                if (e) e.preventDefault();
                return false;
            }

            if (self.ignoreFocus) return;
            self.isFocused = true;
            if (self.settings.preload === 'focus') self.onSearchChange('');

            if (!wasFocused) self.trigger('focus');

            if (!self.$activeItems.length) {
                self.showInput();
                self.setActiveItem(null);
                self.refreshOptions(!!self.settings.openOnFocus);
            }

            self.refreshState();
        },

        /**
         * Triggered on <input> blur.
         *
         * @param {object} e
         * @param {Element} dest
         */
        onBlur: function(e, dest) {
            var self = this;
            if (!self.isFocused) return;
            self.isFocused = false;

            if (self.ignoreFocus) {
                return;
            } else if (!self.ignoreBlur && document.activeElement === self.$dropdownContent[0]) {
                // necessary to prevent IE closing the dropdown when the scrollbar is clicked
                self.ignoreBlur = true;
                self.onFocus(e);
                return;
            }

            var deactivate = function() {
                self.close();
                self.setTextboxValue('');
                self.setActiveItem(null);
                self.setActiveOption(null);
                self.setCaret(self.items.length);
                self.refreshState();

                // IE11 bug: element still marked as active
                if (dest && dest.focus) dest.focus();

                self.ignoreFocus = false;
                self.trigger('blur');
            };

            self.ignoreFocus = true;
            if (self.settings.create && self.settings.createOnBlur) {
                self.createItem(null, false, deactivate);
            } else {
                deactivate();
            }
        },

        /**
         * Triggered when the user rolls over
         * an option in the autocomplete dropdown menu.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onOptionHover: function(e) {
            if (this.ignoreHover) return;
            this.setActiveOption(e.currentTarget, false);
        },

        /**
         * Triggered when the user clicks on an option
         * in the autocomplete dropdown menu.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onOptionSelect: function(e) {
            var value, $target, self = this;

            if (e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }

            $target = $(e.currentTarget);
            if ($target.hasClass('create')) {
                self.createItem(null, function() {
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    }
                });
            } else {
                value = $target.attr('data-value');
                if (typeof value !== 'undefined') {
                    self.lastQuery = null;
                    self.setTextboxValue('');
                    self.addItem(value);
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    } else if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
                        self.setActiveOption(self.getOption(value));
                    }
                }
            }
        },

        /**
         * Triggered when the user clicks on an item
         * that has been selected.
         *
         * @param {object} e
         * @returns {boolean}
         */
        onItemSelect: function(e) {
            var self = this;

            if (self.isLocked) return;
            if (self.settings.mode === 'multi') {
                e.preventDefault();
                self.setActiveItem(e.currentTarget, e);
            }
        },

        /**
         * Invokes the provided method that provides
         * results to a callback---which are then added
         * as options to the control.
         *
         * @param {function} fn
         */
        load: function(fn) {
            var self = this;
            var $wrapper = self.$wrapper.addClass(self.settings.loadingClass);

            self.loading++;
            fn.apply(self, [function(results) {
                self.loading = Math.max(self.loading - 1, 0);
                if (results && results.length) {
                    self.addOption(results);
                    self.refreshOptions(self.isFocused && !self.isInputHidden);
                }
                if (!self.loading) {
                    $wrapper.removeClass(self.settings.loadingClass);
                }
                self.trigger('load', results);
            }]);
        },

        /**
         * Sets the input field of the control to the specified value.
         *
         * @param {string} value
         */
        setTextboxValue: function(value) {
            var $input = this.$controlInput;
            var changed = $input.val() !== value;
            if (changed) {
                $input.val(value).triggerHandler('update');
                this.lastValue = value;
            }
        },

        /**
         * Returns the value of the control. If multiple items
         * can be selected (e.g. <select multiple>), this returns
         * an array. If only one item can be selected, this
         * returns a string.
         *
         * @returns {mixed}
         */
        getValue: function() {
            if (this.tagType === TAG_SELECT && this.$input.attr('multiple')) {
                return this.items;
            } else {
                return this.items.join(this.settings.delimiter);
            }
        },

        /**
         * Resets the selected items to the given value.
         *
         * @param {mixed} value
         */
        setValue: function(value, silent) {
            var events = silent ? [] : ['change'];

            debounceEvents(this, events, function() {
                this.clear(silent);
                this.addItems(value, silent);
            });
        },

        /**
         * Sets the selected item.
         *
         * @param {object} $item
         * @param {object} e (optional)
         */
        setActiveItem: function($item, e) {
            var self = this;
            var eventName;
            var i, idx, begin, end, item, swap;
            var $last;

            if (self.settings.mode === 'single') return;
            $item = $($item);

            // clear the active selection
            if (!$item.length) {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [];
                if (self.isFocused) {
                    self.showInput();
                }
                return;
            }

            // modify selection
            eventName = e && e.type.toLowerCase();

            if (eventName === 'mousedown' && self.isShiftDown && self.$activeItems.length) {
                $last = self.$control.children('.active:last');
                begin = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$last[0]]);
                end   = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$item[0]]);
                if (begin > end) {
                    swap  = begin;
                    begin = end;
                    end   = swap;
                }
                for (i = begin; i <= end; i++) {
                    item = self.$control[0].childNodes[i];
                    if (self.$activeItems.indexOf(item) === -1) {
                        $(item).addClass('active');
                        self.$activeItems.push(item);
                    }
                }
                e.preventDefault();
            } else if ((eventName === 'mousedown' && self.isCtrlDown) || (eventName === 'keydown' && this.isShiftDown)) {
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                    $item.removeClass('active');
                } else {
                    self.$activeItems.push($item.addClass('active')[0]);
                }
            } else {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [$item.addClass('active')[0]];
            }

            // ensure control has focus
            self.hideInput();
            if (!this.isFocused) {
                self.focus();
            }
        },

        /**
         * Sets the selected item in the dropdown menu
         * of available options.
         *
         * @param {object} $object
         * @param {boolean} scroll
         * @param {boolean} animate
         */
        setActiveOption: function($option, scroll, animate) {
            var heightMenu, heightItem, y;
            var scrollTop, scrollBottom;
            var self = this;

            if (self.$activeOption) self.$activeOption.removeClass('active');
            self.$activeOption = null;

            $option = $($option);
            if (!$option.length) return;

            self.$activeOption = $option.addClass('active');

            if (scroll || !isSet(scroll)) {

                heightMenu   = self.$dropdownContent.height();
                heightItem   = self.$activeOption.outerHeight(true);
                scroll        = self.$dropdownContent.scrollTop() || 0;
                y             = self.$activeOption.offset().top - self.$dropdownContent.offset().top + scroll;
                scrollTop    = y;
                scrollBottom = y - heightMenu + heightItem;

                if (y + heightItem > heightMenu + scroll) {
                    self.$dropdownContent.stop().animate({scrollTop: scrollBottom}, animate ? self.settings.scrollDuration : 0);
                } else if (y < scroll) {
                    self.$dropdownContent.stop().animate({scrollTop: scrollTop}, animate ? self.settings.scrollDuration : 0);
                }

            }
        },

        /**
         * Selects all items (CTRL + A).
         */
        selectAll: function() {
            var self = this;
            if (self.settings.mode === 'single') return;

            self.$activeItems = Array.prototype.slice.apply(self.$control.children(':not(input)').addClass('active'));
            if (self.$activeItems.length) {
                self.hideInput();
                self.close();
            }
            self.focus();
        },

        /**
         * Hides the input element out of view, while
         * retaining its focus.
         */
        hideInput: function() {
            var self = this;

            self.setTextboxValue('');
            self.$controlInput.css({opacity: 0, position: 'absolute', left: self.rtl ? 10000 : -10000});
            self.isInputHidden = true;
        },

        /**
         * Restores input visibility.
         */
        showInput: function() {
            this.$controlInput.css({opacity: 1, position: 'relative', left: 0});
            this.isInputHidden = false;
        },

        /**
         * Gives the control focus.
         */
        focus: function() {
            var self = this;
            if (self.isDisabled) return;

            self.ignoreFocus = true;
            self.$controlInput[0].focus();
            window.setTimeout(function() {
                self.ignoreFocus = false;
                self.onFocus();
            }, 0);
        },

        /**
         * Forces the control out of focus.
         *
         * @param {Element} dest
         */
        blur: function(dest) {
            this.$controlInput[0].blur();
            this.onBlur(null, dest);
        },

        /**
         * Returns a function that scores an object
         * to show how good of a match it is to the
         * provided query.
         *
         * @param {string} query
         * @param {object} options
         * @return {function}
         */
        getScoreFunction: function(query) {
            return this.sifter.getScoreFunction(query, this.getSearchOptions());
        },

        /**
         * Returns search options for sifter (the system
         * for scoring and sorting results).
         *
         * @see https://github.com/brianreavis/sifter.js
         * @return {object}
         */
        getSearchOptions: function() {
            var settings = this.settings;
            var sort = settings.sortField;
            if (typeof sort === 'string') {
                sort = [{field: sort}];
            }

            return {
                fields      : settings.searchField,
                conjunction : settings.searchConjunction,
                sort        : sort
            };
        },

        /**
         * Searches through available options and returns
         * a sorted array of matches.
         *
         * Returns an object containing:
         *
         *   - query {string}
         *   - tokens {array}
         *   - total {int}
         *   - items {array}
         *
         * @param {string} query
         * @returns {object}
         */
        search: function(query) {
            var i, result, calculateScore;
            var self     = this;
            var settings = self.settings;
            var options  = this.getSearchOptions();

            // validate user-provided result scoring function
            if (settings.score) {
                calculateScore = self.settings.score.apply(this, [query]);
                if (typeof calculateScore !== 'function') {
                    throw new Error('Selectize "score" setting must be a function that returns a function');
                }
            }

            // perform search
            if (query !== self.lastQuery) {
                self.lastQuery = query;
                result = self.sifter.search(query, $.extend(options, {score: calculateScore}));
                self.currentResults = result;
            } else {
                result = $.extend(true, {}, self.currentResults);
            }

            // filter out selected items
            if (settings.hideSelected) {
                for (i = result.items.length - 1; i >= 0; i--) {
                    if (self.items.indexOf(hashKey(result.items[i].id)) !== -1) {
                        result.items.splice(i, 1);
                    }
                }
            }

            return result;
        },

        /**
         * Refreshes the list of available options shown
         * in the autocomplete dropdown menu.
         *
         * @param {boolean} triggerDropdown
         */
        refreshOptions: function(triggerDropdown) {
            var i, j, k, n, groups, groupsOrder, option, optionHtml, optgroup, optgroups, html, htmlChildren, hasCreateOption;
            var $active, $activeBefore, $create;

            if (typeof triggerDropdown === 'undefined') {
                triggerDropdown = true;
            }

            var self              = this;
            var query             = $.trim(self.$controlInput.val());
            var results           = self.search(query);
            var $dropdownContent = self.$dropdownContent;
            var activeBefore     = self.$activeOption && hashKey(self.$activeOption.attr('data-value'));

            // build markup
            n = results.items.length;
            if (typeof self.settings.maxOptions === 'number') {
                n = Math.min(n, self.settings.maxOptions);
            }

            // render and group available options individually
            groups = {};
            groupsOrder = [];

            for (i = 0; i < n; i++) {
                option      = self.options[results.items[i].id];
                optionHtml = self.render('option', option);
                optgroup    = option[self.settings.optgroupField] || '';
                optgroups   = $.isArray(optgroup) ? optgroup : [optgroup];

                for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
                    optgroup = optgroups[j];
                    if (!self.optgroups.hasOwnProperty(optgroup)) {
                        optgroup = '';
                    }
                    if (!groups.hasOwnProperty(optgroup)) {
                        groups[optgroup] = document.createDocumentFragment();
                        groupsOrder.push(optgroup);
                    }
                    groups[optgroup].appendChild(optionHtml);
                }
            }

            // sort optgroups
            if (this.settings.lockOptgroupOrder) {
                groupsOrder.sort(function(a, b) {
                    var aOrder = self.optgroups[a].$order || 0;
                    var bOrder = self.optgroups[b].$order || 0;
                    return aOrder - bOrder;
                });
            }

            // render optgroup headers & join groups
            html = document.createDocumentFragment();
            for (i = 0, n = groupsOrder.length; i < n; i++) {
                optgroup = groupsOrder[i];
                if (self.optgroups.hasOwnProperty(optgroup) && groups[optgroup].childNodes.length) {
                    // render the optgroup header and options within it,
                    // then pass it to the wrapper template
                    htmlChildren = document.createDocumentFragment();
                    htmlChildren.appendChild(self.render('optgroupHeader', self.optgroups[optgroup]));
                    htmlChildren.appendChild(groups[optgroup]);

                    html.appendChild(self.render('optgroup', $.extend({}, self.optgroups[optgroup], {
                        html: domToString(htmlChildren),
                        dom:  htmlChildren
                    })));
                } else {
                    html.appendChild(groups[optgroup]);
                }
            }

            $dropdownContent.html(html);

            // highlight matching terms inline
            if (self.settings.highlight && results.query.length && results.tokens.length) {
                $dropdownContent.removeHighlight();
                for (i = 0, n = results.tokens.length; i < n; i++) {
                    highlight($dropdownContent, results.tokens[i].regex);
                }
            }

            // add "selected" class to selected options
            if (!self.settings.hideSelected) {
                for (i = 0, n = self.items.length; i < n; i++) {
                    self.getOption(self.items[i]).addClass('selected');
                }
            }

            // add create option
            hasCreateOption = self.canCreate(query);
            if (hasCreateOption) {
                $dropdownContent.prepend(self.render('optionCreate', {input: query}));
                $create = $($dropdownContent[0].childNodes[0]);
            }

            // activate
            self.hasOptions = results.items.length > 0 || hasCreateOption;
            if (self.hasOptions) {
                if (results.items.length > 0) {
                    $activeBefore = activeBefore && self.getOption(activeBefore);
                    if ($activeBefore && $activeBefore.length) {
                        $active = $activeBefore;
                    } else if (self.settings.mode === 'single' && self.items.length) {
                        $active = self.getOption(self.items[0]);
                    }
                    if (!$active || !$active.length) {
                        if ($create && !self.settings.addPrecedence) {
                            $active = self.getAdjacentOption($create, 1);
                        } else {
                            $active = $dropdownContent.find('[data-selectable]:first');
                        }
                    }
                } else {
                    $active = $create;
                }
                self.setActiveOption($active);
                if (triggerDropdown && !self.isOpen) { self.open(); }
            } else {
                self.setActiveOption(null);
                if (triggerDropdown && self.isOpen) { self.close(); }
            }
        },

        /**
         * Adds an available option. If it already exists,
         * nothing will happen. Note: this does not refresh
         * the options list dropdown (use `refreshOptions`
         * for that).
         *
         * Usage:
         *
         *   this.addOption(data)
         *
         * @param {object|array} data
         */
        addOption: function(data) {
            var i, n, value, self = this;

            if ($.isArray(data)) {
                for (i = 0, n = data.length; i < n; i++) {
                    self.addOption(data[i]);
                }
                return;
            }

            if (value = self.registerOption(data)) {
                self.userOptions[value] = true;
                self.lastQuery = null;
                self.trigger('optionAdd', value, data);
            }
        },

        /**
         * Registers an option to the pool of options.
         *
         * @param {object} data
         * @return {boolean|string}
         */
        registerOption: function(data) {
            var key = hashKey(data[this.settings.valueField]);
            if (typeof key === 'undefined' || key === null || this.options.hasOwnProperty(key)) return false;
            data.$order = data.$order || ++this.order;
            this.options[key] = data;
            return key;
        },

        /**
         * Registers an option group to the pool of option groups.
         *
         * @param {object} data
         * @return {boolean|string}
         */
        registerOptionGroup: function(data) {
            var key = hashKey(data[this.settings.optgroupValueField]);
            if (!key) return false;

            data.$order = data.$order || ++this.order;
            this.optgroups[key] = data;
            return key;
        },

        /**
         * Registers a new optgroup for options
         * to be bucketed into.
         *
         * @param {string} id
         * @param {object} data
         */
        addOptionGroup: function(id, data) {
            data[this.settings.optgroupValueField] = id;
            if (id = this.registerOptionGroup(data)) {
                this.trigger('optgroupAdd', id, data);
            }
        },

        /**
         * Removes an existing option group.
         *
         * @param {string} id
         */
        removeOptionGroup: function(id) {
            if (this.optgroups.hasOwnProperty(id)) {
                delete this.optgroups[id];
                this.renderCache = {};
                this.trigger('optgroupRemove', id);
            }
        },

        /**
         * Clears all existing option groups.
         */
        clearOptionGroups: function() {
            this.optgroups = {};
            this.renderCache = {};
            this.trigger('optgroupClear');
        },

        /**
         * Updates an option available for selection. If
         * it is visible in the selected items or options
         * dropdown, it will be re-rendered automatically.
         *
         * @param {string} value
         * @param {object} data
         */
        updateOption: function(value, data) {
            var self = this;
            var $item, $itemNew;
            var valueNew, indexItem, cacheItems, cacheOptions, orderOld;

            value     = hashKey(value);
            valueNew = hashKey(data[self.settings.valueField]);

            // sanity checks
            if (value === null) return;
            if (!self.options.hasOwnProperty(value)) return;
            if (typeof valueNew !== 'string') throw new Error('Value must be set in option data');

            orderOld = self.options[value].$order;

            // update references
            if (valueNew !== value) {
                delete self.options[value];
                indexItem = self.items.indexOf(value);
                if (indexItem !== -1) {
                    self.items.splice(indexItem, 1, valueNew);
                }
            }
            data.$order = data.$order || orderOld;
            self.options[valueNew] = data;

            // invalidate render cache
            cacheItems = self.renderCache.item;
            cacheOptions = self.renderCache.option;

            if (cacheItems) {
                delete cacheItems[value];
                delete cacheItems[valueNew];
            }
            if (cacheOptions) {
                delete cacheOptions[value];
                delete cacheOptions[valueNew];
            }

            // update the item if it's selected
            if (self.items.indexOf(valueNew) !== -1) {
                $item = self.getItem(value);
                $itemNew = $(self.render('item', data));
                if ($item.hasClass('active')) $itemNew.addClass('active');
                $item.replaceWith($itemNew);
            }

            // invalidate last query because we might have updated the sortField
            self.lastQuery = null;

            // update dropdown contents
            if (self.isOpen) {
                self.refreshOptions(false);
            }
        },

        /**
         * Removes a single option.
         *
         * @param {string} value
         * @param {boolean} silent
         */
        removeOption: function(value, silent) {
            var self = this;
            value = hashKey(value);

            var cacheItems = self.renderCache.item;
            var cacheOptions = self.renderCache.option;
            if (cacheItems) delete cacheItems[value];
            if (cacheOptions) delete cacheOptions[value];

            delete self.userOptions[value];
            delete self.options[value];
            self.lastQuery = null;
            self.trigger('optionRemove', value);
            self.removeItem(value, silent);
        },

        /**
         * Clears all options.
         */
        clearOptions: function() {
            var self = this;

            self.loadedSearches = {};
            self.userOptions = {};
            self.renderCache = {};
            self.options = self.sifter.items = {};
            self.lastQuery = null;
            self.trigger('optionClear');
            self.clear();
        },

        /**
         * Returns the jQuery element of the option
         * matching the given value.
         *
         * @param {string} value
         * @returns {object}
         */
        getOption: function(value) {
            return this.getElementWithValue(value, this.$dropdownContent.find('[data-selectable]'));
        },

        /**
         * Returns the jQuery element of the next or
         * previous selectable option.
         *
         * @param {object} $option
         * @param {int} direction  can be 1 for next or -1 for previous
         * @return {object}
         */
        getAdjacentOption: function($option, direction) {
            var $options = this.$dropdown.find('[data-selectable]');
            var index    = $options.index($option) + direction;

            return index >= 0 && index < $options.length ? $options.eq(index) : $();
        },

        /**
         * Finds the first element with a "data-value" attribute
         * that matches the given value.
         *
         * @param {mixed} value
         * @param {object} $els
         * @return {object}
         */
        getElementWithValue: function(value, $els) {
            value = hashKey(value);

            if (typeof value !== 'undefined' && value !== null) {
                for (var i = 0, n = $els.length; i < n; i++) {
                    if ($els[i].getAttribute('data-value') === value) {
                        return $($els[i]);
                    }
                }
            }

            return $();
        },

        /**
         * Returns the jQuery element of the item
         * matching the given value.
         *
         * @param {string} value
         * @returns {object}
         */
        getItem: function(value) {
            return this.getElementWithValue(value, this.$control.children());
        },

        /**
         * "Selects" multiple items at once. Adds them to the list
         * at the current caret position.
         *
         * @param {string} value
         * @param {boolean} silent
         */
        addItems: function(values, silent) {
            var items = $.isArray(values) ? values : [values];
            for (var i = 0, n = items.length; i < n; i++) {
                this.isPending = (i < n - 1);
                this.addItem(items[i], silent);
            }
        },

        /**
         * "Selects" an item. Adds it to the list
         * at the current caret position.
         *
         * @param {string} value
         * @param {boolean} silent
         */
        addItem: function(value, silent) {
            var events = silent ? [] : ['change'];

            debounceEvents(this, events, function() {
                var $item, $option, $options;
                var self = this;
                var inputMode = self.settings.mode;
                var valueNext, wasFull;
                value = hashKey(value);

                if (self.items.indexOf(value) !== -1) {
                    if (inputMode === 'single') self.close();
                    return;
                }

                if (!self.options.hasOwnProperty(value)) return;
                if (inputMode === 'single') self.clear(silent);
                if (inputMode === 'multi' && self.isFull()) return;

                $item = $(self.render('item', self.options[value]));
                wasFull = self.isFull();
                self.items.splice(self.caretPos, 0, value);
                self.insertAtCaret($item);
                if (!self.isPending || (!wasFull && self.isFull())) {
                    self.refreshState();
                }

                if (self.isSetup) {
                    $options = self.$dropdownContent.find('[data-selectable]');

                    // update menu / remove the option (if this is not one item being added as part of series)
                    if (!self.isPending) {
                        $option = self.getOption(value);
                        valueNext = self.getAdjacentOption($option, 1).attr('data-value');
                        self.refreshOptions(self.isFocused && inputMode !== 'single');
                        if (valueNext) {
                            self.setActiveOption(self.getOption(valueNext));
                        }
                    }

                    // hide the menu if the maximum number of items have been selected or no options are left
                    if (!$options.length || self.isFull()) {
                        self.close();
                    } else {
                        self.positionDropdown();
                    }

                    self.updatePlaceholder();
                    self.trigger('itemAdd', value, $item);
                    self.updateOriginalInput({silent: silent});
                }
            });
        },

        /**
         * Removes the selected item matching
         * the provided value.
         *
         * @param {string} value
         */
        removeItem: function(value, silent) {
            var self = this;
            var $item, i, idx;

            $item = (value instanceof $) ? value : self.getItem(value);
            value = hashKey($item.attr('data-value'));
            i = self.items.indexOf(value);

            if (i !== -1) {
                $item.remove();
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                }

                self.items.splice(i, 1);
                self.lastQuery = null;
                if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
                    self.removeOption(value, silent);
                }

                if (i < self.caretPos) {
                    self.setCaret(self.caretPos - 1);
                }

                self.refreshState();
                self.updatePlaceholder();
                self.updateOriginalInput({silent: silent});
                self.positionDropdown();
                self.trigger('itemRemove', value, $item);
            }
        },

        /**
         * Invokes the `create` method provided in the
         * selectize options that should provide the data
         * for the new item, given the user input.
         *
         * Once this completes, it will be added
         * to the item list.
         *
         * @param {string} value
         * @param {boolean} [triggerDropdown]
         * @param {function} [callback]
         * @return {boolean}
         */
        createItem: function(input, triggerDropdown) {
            var self  = this;
            var caret = self.caretPos;
            input = input || $.trim(self.$controlInput.val() || '');

            var callback = arguments[arguments.length - 1];
            if (typeof callback !== 'function') callback = function() {};

            if (typeof triggerDropdown !== 'boolean') {
                triggerDropdown = true;
            }

            if (!self.canCreate(input)) {
                callback();
                return false;
            }

            self.lock();

            var setup = (typeof self.settings.create === 'function') ? this.settings.create : function(input) {
                var data = {};
                data[self.settings.labelField] = input;
                data[self.settings.valueField] = input;
                return data;
            };

            var create = once(function(data) {
                self.unlock();

                if (!data || typeof data !== 'object') return callback();
                var value = hashKey(data[self.settings.valueField]);
                if (typeof value !== 'string') return callback();

                self.setTextboxValue('');
                self.addOption(data);
                self.setCaret(caret);
                self.addItem(value);
                self.refreshOptions(triggerDropdown && self.settings.mode !== 'single');
                callback(data);
            });

            var output = setup.apply(this, [input, create]);
            if (typeof output !== 'undefined') {
                create(output);
            }

            return true;
        },

        /**
         * Re-renders the selected item lists.
         */
        refreshItems: function() {
            this.lastQuery = null;

            if (this.isSetup) {
                this.addItem(this.items);
            }

            this.refreshState();
            this.updateOriginalInput();
        },

        /**
         * Updates all state-dependent attributes
         * and CSS classes.
         */
        refreshState: function() {
            this.refreshValidityState();
            this.refreshClasses();
        },

        /**
         * Update the `required` attribute of both input and control input.
         *
         * The `required` property needs to be activated on the control input
         * for the error to be displayed at the right place. `required` also
         * needs to be temporarily deactivated on the input since the input is
         * hidden and can't show errors.
         */
        refreshValidityState: function() {
            if (!this.isRequired) return false;

            var invalid = !this.items.length;

            this.isInvalid = invalid;
            this.$controlInput.prop('required', invalid);
            this.$input.prop('required', !invalid);
        },

        /**
         * Updates all state-dependent CSS classes.
         */
        refreshClasses: function() {
            var self     = this;
            var isFull   = self.isFull();
            var isLocked = self.isLocked;

            self.$wrapper
                .toggleClass('rtl', self.rtl);

            self.$control
                .toggleClass('focus', self.isFocused)
                .toggleClass('disabled', self.isDisabled)
                .toggleClass('required', self.isRequired)
                .toggleClass('invalid', self.isInvalid)
                .toggleClass('locked', isLocked)
                .toggleClass('full', isFull).toggleClass('not-full', !isFull)
                .toggleClass('input-active', self.isFocused && !self.isInputHidden)
                .toggleClass('dropdown-active', self.isOpen)
                .toggleClass('has-options', !$.isEmptyObject(self.options))
                .toggleClass('has-items', self.items.length > 0);

            self.$controlInput.data('grow', !isFull && !isLocked);
        },

        /**
         * Determines whether or not more items can be added
         * to the control without exceeding the user-defined maximum.
         *
         * @returns {boolean}
         */
        isFull: function() {
            return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
        },

        /**
         * Refreshes the original <select> or <input>
         * element to reflect the current state.
         */
        updateOriginalInput: function(opts) {
            var i, n, options, label, self = this;
            opts = opts || {};

            if (self.tagType === TAG_SELECT) {
                options = [];
                for (i = 0, n = self.items.length; i < n; i++) {
                    label = self.options[self.items[i]][self.settings.labelField] || '';
                    options.push('<option value="' + escapeHtml(self.items[i]) + '" selected="selected">' + escapeHtml(label) + '</option>');
                }
                if (!options.length && !this.$input.attr('multiple')) {
                    options.push('<option value="" selected="selected"></option>');
                }
                self.$input.html(options.join(''));
            } else {
                self.$input.val(self.getValue());
                self.$input.attr('value',self.$input.val());
            }

            if (self.isSetup) {
                if (!opts.silent) {
                    self.trigger('change', self.$input.val());
                }
            }
        },

        /**
         * Shows/hide the input placeholder depending
         * on if there items in the list already.
         */
        updatePlaceholder: function() {
            if (!this.settings.placeholder) return;
            var $input = this.$controlInput;

            if (this.items.length) {
                $input.removeAttr('placeholder');
            } else {
                $input.attr('placeholder', this.settings.placeholder);
            }
            $input.triggerHandler('update', {force: true});
        },

        /**
         * Shows the autocomplete dropdown containing
         * the available options.
         */
        open: function() {
            var self = this;

            if (self.isLocked || self.isOpen || (self.settings.mode === 'multi' && self.isFull())) return;
            self.focus();
            self.isOpen = true;
            self.refreshState();
            self.$dropdown.css({visibility: 'hidden', display: 'block'});
            self.positionDropdown();
            self.$dropdown.css({visibility: 'visible'});
            self.trigger('dropdownOpen', self.$dropdown);
        },

        /**
         * Closes the autocomplete dropdown menu.
         */
        close: function() {
            var self = this;
            var trigger = self.isOpen;

            if (self.settings.mode === 'single' && self.items.length) {
                self.hideInput();
                self.$controlInput.blur(); // close keyboard on iOS
            }

            self.isOpen = false;
            self.$dropdown.hide();
            self.setActiveOption(null);
            self.refreshState();

            if (trigger) self.trigger('dropdownClose', self.$dropdown);
        },

        /**
         * Calculates and applies the appropriate
         * position of the dropdown.
         */
        positionDropdown: function() {
            var $control = this.$control;
            var offset = this.settings.dropdownParent === 'body' ? $control.offset() : $control.position();
            offset.top += $control.outerHeight(true);

            this.$dropdown.css({
                width : $control.outerWidth(),
                top   : offset.top,
                left  : offset.left
            });
        },

        /**
         * Resets / clears all selected items
         * from the control.
         *
         * @param {boolean} silent
         */
        clear: function(silent) {
            var self = this;

            if (!self.items.length) return;
            self.$control.children(':not(input)').remove();
            self.items = [];
            self.lastQuery = null;
            self.setCaret(0);
            self.setActiveItem(null);
            self.updatePlaceholder();
            self.updateOriginalInput({silent: silent});
            self.refreshState();
            self.showInput();
            self.trigger('clear');
        },

        /**
         * A helper method for inserting an element
         * at the current caret position.
         *
         * @param {object} $el
         */
        insertAtCaret: function($el) {
            var caret = Math.min(this.caretPos, this.items.length);
            if (caret === 0) {
                this.$control.prepend($el);
            } else {
                $(this.$control[0].childNodes[caret]).before($el);
            }
            this.setCaret(caret + 1);
        },

        /**
         * Removes the current selected item(s).
         *
         * @param {object} e (optional)
         * @returns {boolean}
         */
        deleteSelection: function(e) {
            var i, n, direction, selection, values, caret, optionSelect, $optionSelect, $tail;
            var self = this;

            direction = (e && e.keyCode === KEY_BACKSPACE) ? -1 : 1;
            selection = getSelection(self.$controlInput[0]);

            if (self.$activeOption && !self.settings.hideSelected) {
                optionSelect = self.getAdjacentOption(self.$activeOption, -1).attr('data-value');
            }

            // determine items that will be removed
            values = [];

            if (self.$activeItems.length) {
                $tail = self.$control.children('.active:' + (direction > 0 ? 'last' : 'first'));
                caret = self.$control.children(':not(input)').index($tail);
                if (direction > 0) { caret++; }

                for (i = 0, n = self.$activeItems.length; i < n; i++) {
                    values.push($(self.$activeItems[i]).attr('data-value'));
                }
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
                if (direction < 0 && selection.start === 0 && selection.length === 0) {
                    values.push(self.items[self.caretPos - 1]);
                } else if (direction > 0 && selection.start === self.$controlInput.val().length) {
                    values.push(self.items[self.caretPos]);
                }
            }

            // allow the callback to abort
            if (!values.length || (typeof self.settings.onDelete === 'function' && self.settings.onDelete.apply(self, [values]) === false)) {
                return false;
            }

            // perform removal
            if (typeof caret !== 'undefined') {
                self.setCaret(caret);
            }
            while (values.length) {
                self.removeItem(values.pop());
            }

            self.showInput();
            self.positionDropdown();
            self.refreshOptions(true);

            // select previous option
            if (optionSelect) {
                $optionSelect = self.getOption(optionSelect);
                if ($optionSelect.length) {
                    self.setActiveOption($optionSelect);
                }
            }

            return true;
        },

        /**
         * Selects the previous / next item (depending
         * on the `direction` argument).
         *
         * > 0 - right
         * < 0 - left
         *
         * @param {int} direction
         * @param {object} e (optional)
         */
        advanceSelection: function(direction, e) {
            var tail, selection, idx, valueLength, cursorAtEdge, $tail;
            var self = this;

            if (direction === 0) return;
            if (self.rtl) direction *= -1;

            tail = direction > 0 ? 'last' : 'first';
            selection = getSelection(self.$controlInput[0]);

            if (self.isFocused && !self.isInputHidden) {
                valueLength = self.$controlInput.val().length;
                cursorAtEdge = direction < 0 ? selection.start === 0 &&
                  selection.length === 0 : selection.start === valueLength;

                if (cursorAtEdge && !valueLength) {
                    self.advanceCaret(direction, e);
                }
            } else {
                $tail = self.$control.children('.active:' + tail);
                if ($tail.length) {
                    idx = self.$control.children(':not(input)').index($tail);
                    self.setActiveItem(null);
                    self.setCaret(direction > 0 ? idx + 1 : idx);
                }
            }
        },

        /**
         * Moves the caret left / right.
         *
         * @param {int} direction
         * @param {object} e (optional)
         */
        advanceCaret: function(direction, e) {
            var self = this, fn, $adj;

            if (direction === 0) return;

            fn = direction > 0 ? 'next' : 'prev';
            if (self.isShiftDown) {
                $adj = self.$controlInput[fn]();
                if ($adj.length) {
                    self.hideInput();
                    self.setActiveItem($adj);
                    if(e) e.preventDefault();
                }
            } else {
                self.setCaret(self.caretPos + direction);
            }
        },

        /**
         * Moves the caret to the specified index.
         *
         * @param {int} i
         */
        setCaret: function(i) {
            var self = this;

            if (self.settings.mode === 'single') {
                i = self.items.length;
            } else {
                i = Math.max(0, Math.min(self.items.length, i));
            }

            if(!self.isPending) {
                // the input must be moved by leaving it in place and moving the
                // siblings, due to the fact that focus cannot be restored once lost
                // on mobile webkit devices
                var j, n, $children, $child;
                $children = self.$control.children(':not(input)');
                for (j = 0, n = $children.length; j < n; j++) {
                    $child = $($children[j]).detach();
                    if (j <  i) {
                        self.$controlInput.before($child);
                    } else {
                        self.$control.append($child);
                    }
                }
            }

            self.caretPos = i;
        },

        /**
         * Disables user input on the control. Used while
         * items are being asynchronously created.
         */
        lock: function() {
            this.close();
            this.isLocked = true;
            this.refreshState();
        },

        /**
         * Re-enables user input on the control.
         */
        unlock: function() {
            this.isLocked = false;
            this.refreshState();
        },

        /**
         * Disables user input on the control completely.
         * While disabled, it cannot receive focus.
         */
        disable: function() {
            var self = this;
            self.$input.prop('disabled', true);
            self.$controlInput.prop('disabled', true).prop('tabindex', -1);
            self.isDisabled = true;
            self.lock();
        },

        /**
         * Enables the control so that it can respond
         * to focus and user input.
         */
        enable: function() {
            var self = this;
            self.$input.prop('disabled', false);
            self.$controlInput.prop('disabled', false).prop('tabindex', self.tabIndex);
            self.isDisabled = false;
            self.unlock();
        },

        /**
         * Completely destroys the control and
         * unbinds all event listeners so that it can
         * be garbage collected.
         */
        destroy: function() {
            var self = this;
            var eventNS = self.eventNS;
            var revertSettings = self.revertSettings;

            self.trigger('destroy');
            self.off();
            self.$wrapper.remove();
            self.$dropdown.remove();

            self.$input
                .html('')
                .append(revertSettings.$children)
                .removeAttr('tabindex')
                .removeClass('selectized')
                .attr({tabindex: revertSettings.tabindex})
                .show();

            self.$controlInput.removeData('grow');
            self.$input.removeData('selectize');

            $(window).off(eventNS);
            $(document).off(eventNS);
            $(document.body).off(eventNS);

            delete self.$input[0].selectize;
        },

        /**
         * A helper method for rendering "item" and
         * "option" templates, given the data.
         *
         * @param {string} templateName
         * @param {object} data
         * @returns {string}
         */
        render: function(templateName, data) {
            var value, id;
            var html = '';
            var cache = false;
            var self = this;
            // var regexTag = /^[\t \r\n]*<([a-z][a-z0-9\-]*(?:\:[a-z][a-z0-9\-]*)?)/i;

            if (templateName === 'option' || templateName === 'item') {
                value = hashKey(data[self.settings.valueField]);
                cache = !!value;
            }

            // pull markup from cache if it exists
            if (cache) {
                if (!isSet(self.renderCache[templateName])) {
                    self.renderCache[templateName] = {};
                }
                if (self.renderCache[templateName].hasOwnProperty(value)) {
                    return self.renderCache[templateName][value];
                }
            }

            // render markup
            html = $(self.settings.render[templateName].apply(this, [data, escapeHtml]));

            // add mandatory attributes
            if (templateName === 'option' || templateName === 'optionCreate') {
                html.attr('data-selectable', '');
            }
            else if (templateName === 'optgroup') {
                id = data[self.settings.optgroupValueField] || '';
                html.attr('data-group', id);
            }
            if (templateName === 'option' || templateName === 'item') {
                html.attr('data-value', value || '');
            }

            // update cache
            if (cache) {
                self.renderCache[templateName][value] = html[0];
            }

            return html[0];
        },

        /**
         * Clears the render cache for a template. If
         * no template is given, clears all render
         * caches.
         *
         * @param {string} templateName
         */
        clearCache: function(templateName) {
            var self = this;
            if (typeof templateName === 'undefined') {
                self.renderCache = {};
            } else {
                delete self.renderCache[templateName];
            }
        },

        /**
         * Determines whether or not to display the
         * create item prompt, given a user input.
         *
         * @param {string} input
         * @return {boolean}
         */
        canCreate: function(input) {
            var self = this;
            if (!self.settings.create) return false;
            var filter = self.settings.createFilter;
            return input.length
                && (typeof filter !== 'function' || filter.apply(self, [input]))
                && (typeof filter !== 'string' || new RegExp(filter).test(input))
                && (!(filter instanceof RegExp) || filter.test(input));
        }

    });
}

// src/index.js
function selectize($select, optsUser) {
    var opts               = $.extend({}, defaults, optsUser);
    var attrData           = opts.dataAttr;
    var fieldLabel         = opts.labelField;
    var fieldValue         = opts.valueField;
    var fieldOptgroup      = opts.optgroupField;
    var fieldOptgroupLabel = opts.optgroupLabelField;
    var fieldOptgroupValue = opts.optgroupValueField;

    /**
     * Initializes selectize from a <input type="text"> element.
     *
     * @param {object} $input
     * @param {object} optsElement
     */
    var initTextbox = function($input, optsElement) {
        var i, n, values, option;

        var dataRaw = $input.attr(attrData);

        if (!dataRaw) {
            var value = $.trim($input.val() || '');
            if (!opts.allowEmptyOption && !value.length) return;
            values = value.split(opts.delimiter);
            for (i = 0, n = values.length; i < n; i++) {
                option = {};
                option[fieldLabel] = values[i];
                option[fieldValue] = values[i];
                optsElement.options.push(option);
            }
            optsElement.items = values;
        } else {
            optsElement.options = JSON.parse(dataRaw);
            for (i = 0, n = optsElement.options.length; i < n; i++) {
                optsElement.items.push(optsElement.options[i][fieldValue]);
            }
        }
    };

    /**
     * Initializes selectize from a <select> element.
     *
     * @param {object} $input
     * @param {object} optsElement
     */
    var initSelect = function($input, optsElement) {
        var i, n, tagName, $children;
        var options = optsElement.options;
        var optionsMap = {};

        var readData = function($el) {
            var data = attrData && $el.attr(attrData);
            if (typeof data === 'string' && data.length) {
                return JSON.parse(data);
            }
            return null;
        };

        var addOption = function($option, group) {
            $option = $($option);

            var value = hashKey($option.val());
            if (!value && !opts.allowEmptyOption) return;

            // if the option already exists, it's probably been
            // duplicated in another optgroup. in this case, push
            // the current group to the "optgroup" property on the
            // existing option so that it's rendered in both places.
            if (optionsMap.hasOwnProperty(value)) {
                if (group) {
                    var arr = optionsMap[value][fieldOptgroup];
                    if (!arr) {
                        optionsMap[value][fieldOptgroup] = group;
                    } else if (!$.isArray(arr)) {
                        optionsMap[value][fieldOptgroup] = [arr, group];
                    } else {
                        arr.push(group);
                    }
                }
                return;
            }

            var option            = readData($option) || {};
            option[fieldLabel]    = option[fieldLabel] || $option.text();
            option[fieldValue]    = option[fieldValue] || value;
            option[fieldOptgroup] = option[fieldOptgroup] || group;

            optionsMap[value] = option;
            options.push(option);

            if ($option.is(':selected')) {
                optsElement.items.push(value);
            }
        };

        var addGroup = function($optgroup) {
            var i, n, id, optgroup, $options;

            $optgroup = $($optgroup);
            id = $optgroup.attr('label');

            if (id) {
                optgroup = readData($optgroup) || {};
                optgroup[fieldOptgroupLabel] = id;
                optgroup[fieldOptgroupValue] = id;
                optsElement.optgroups.push(optgroup);
            }

            $options = $('option', $optgroup);
            for (i = 0, n = $options.length; i < n; i++) {
                addOption($options[i], id);
            }
        };

        optsElement.maxItems = $input.attr('multiple') ? null : 1;

        $children = $input.children();
        for (i = 0, n = $children.length; i < n; i++) {
            tagName = $children[i].tagName.toLowerCase();
            if (tagName === 'optgroup') {
                addGroup($children[i]);
            } else if (tagName === 'option') {
                addOption($children[i]);
            }
        }
    };

    return $select.each(function() {
        if (this.selectize) return;

        var instance;
        var $input = $(this);
        var tagName = this.tagName.toLowerCase();
        var placeholder = $input.attr('placeholder') || $input.attr('data-placeholder');
        if (!placeholder && !opts.allowEmptyOption) {
            placeholder = $input.children('option[value=""]').text();
        }

        var optsElement = {
            'placeholder' : placeholder,
            'options'     : [],
            'optgroups'   : [],
            'items'       : []
        };

        if (tagName === 'select') {
            initSelect($input, optsElement);
        } else {
            initTextbox($input, optsElement);
        }

        instance = new Selectize($input, $.extend(true, {}, defaults, optsElement, optsUser));
    });
}

// templates/controls/dropdown.pug
var html$4 = "\n<yield from=\"input\">\n  <select class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" style=\"display: none;\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" onchange=\"{ change }\" onblur=\"{ change }\" placeholder=\"{ placeholder }\"></select>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

// src/controls/dropdown.coffee
var Select$2;
var coolDown;
var isABrokenBrowser;
var extend$9 = function(child, parent) { for (var key in parent) { if (hasProp$8.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$8 = {}.hasOwnProperty;

isABrokenBrowser = window.navigator.userAgent.indexOf('MSIE') > 0 || window.navigator.userAgent.indexOf('Trident') > 0;

coolDown = -1;

var dropdown = Select$2 = (function(superClass) {
  extend$9(Select, superClass);

  function Select() {
    return Select.__super__.constructor.apply(this, arguments);
  }

  Select.prototype.tag = 'dropdown';

  Select.prototype.html = html$4;

  Select.prototype.selectOptions = {};

  Select.prototype.options = function() {
    return this.selectOptions;
  };

  Select.prototype.readOnly = false;

  Select.prototype.ignore = false;

  Select.prototype.events = {
    updated: function() {
      return this.onUpdated();
    },
    mount: function() {
      return this.onUpdated();
    }
  };

  Select.prototype.getValue = function(event) {
    var ref;
    return (ref = $$3(event.target).val()) != null ? ref.trim().toLowerCase() : void 0;
  };

  Select.prototype.initSelect = function($select) {
    var $input, invertedOptions, name, options, ref, select, value;
    options = [];
    invertedOptions = {};
    ref = this.options();
    for (value in ref) {
      name = ref[value];
      options.push({
        text: name,
        value: value
      });
      invertedOptions[name] = value;
    }
    selectize($select, {
      dropdownParent: 'body'
    }).on('change', (function(_this) {
      return function(event) {
        if (coolDown !== -1) {
          return;
        }
        coolDown = setTimeout(function() {
          return coolDown = -1;
        }, 100);
        _this.change(event);
        event.preventDefault();
        event.stopPropagation();
        return false;
      };
    })(this));
    select = $select[0];
    select.selectize.addOption(options);
    select.selectize.addItem([this.input.ref.get(this.input.name)] || [], true);
    select.selectize.refreshOptions(false);
    $input = $select.parent().find('.selectize-input input:first');
    $input.on('change', function(event) {
      var val;
      val = $$3(event.target).val();
      if (invertedOptions[val] != null) {
        return $select[0].selectize.setValue(invertedOptions[val]);
      }
    });
    if (this.readOnly) {
      return $input.attr('readonly', true);
    }
  };

  Select.prototype.init = function(opts) {
    Select.__super__.init.apply(this, arguments);
    return this.style = this.style || 'width:100%';
  };

  Select.prototype.onUpdated = function() {
    var $control, $select, select, v;
    if (this.input == null) {
      return;
    }
    $select = $$3(this.root).find('select');
    select = $select[0];
    if (select != null) {
      v = this.input.ref.get(this.input.name);
      if (!this.initialized) {
        return raf((function(_this) {
          return function() {
            _this.initSelect($select);
            return _this.initialized = true;
          };
        })(this));
      } else if ((select.selectize != null) && v !== select.selectize.getValue()) {
        select.selectize.clear(true);
        return select.selectize.addItem(v, true);
      }
    } else {
      $control = $$3(this.root).find('.selectize-control');
      if ($control[0] == null) {
        return raf((function(_this) {
          return function() {
            return _this.scheduleUpdate();
          };
        })(this));
      }
    }
  };

  return Select;

})(Text$1);

Select$2.register();

// src/controls/state-select.coffee
var StateSelect;
var extend$11 = function(child, parent) { for (var key in parent) { if (hasProp$9.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$9 = {}.hasOwnProperty;

var stateSelect = StateSelect = (function(superClass) {
  extend$11(StateSelect, superClass);

  function StateSelect() {
    return StateSelect.__super__.constructor.apply(this, arguments);
  }

  StateSelect.prototype.tag = 'state-select';

  StateSelect.prototype.options = function() {
    var code, countries, country, found, i, j, len, len1, options, optionsHash, ref, ref1, ref2, ref3, ref4, ref5, subdivision, subdivisions;
    countries = (ref = (ref1 = (ref2 = this.countries) != null ? ref2 : (ref3 = this.data) != null ? ref3.get('countries') : void 0) != null ? ref1 : (ref4 = this.parent) != null ? (ref5 = ref4.data) != null ? ref5.get('countries') : void 0 : void 0) != null ? ref : [];
    code = this.getCountry();
    if (!code || code.length !== 2) {
      this._optionsHash = '';
      return;
    }
    code = code.toUpperCase();
    found = false;
    for (i = 0, len = countries.length; i < len; i++) {
      country = countries[i];
      if (country.code.toUpperCase() === code) {
        found = true;
        subdivisions = country.subdivisions;
        optionsHash = JSON.stringify(subdivisions);
        if (this._optionsHash === optionsHash) {
          return this.selectOptions;
        }
        subdivisions = subdivisions.slice(0);
        this._optionsHash = optionsHash;
        this.selectOptions = options = {};
        this.input.ref.set(this.input.name, '');
        subdivisions.sort(function(a, b) {
          var nameA, nameB;
          nameA = a.name.toUpperCase();
          nameB = b.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
        for (j = 0, len1 = subdivisions.length; j < len1; j++) {
          subdivision = subdivisions[j];
          options[subdivision.code.toUpperCase()] = subdivision.name;
        }
        break;
      }
    }
    if (!found) {
      this._optionsHash = '';
    }
    return options;
  };

  StateSelect.prototype.getCountry = function() {
    return '';
  };

  StateSelect.prototype.init = function() {
    return StateSelect.__super__.init.apply(this, arguments);
  };

  return StateSelect;

})(Select$1);

StateSelect.register();

// templates/controls/textarea.pug
var html$5 = "\n<yield from=\"input\">\n  <textarea class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ input.name.replace(/\\./g, &quot;-&quot;) }\" name=\"{ name || input.name.replace(/\\./g, &quot;-&quot;) }\" onchange=\"{ change }\" onblur=\"{ change }\" rows=\"{ rows }\" cols=\"{ cols }\" disabled=\"{disabled\" maxlength=\"{ maxlength }\" placeholder=\"{ placeholder }\" readonly=\"{ readonly }\" wrap=\"{ wrap }\">{ input.ref.get(input.name) }</textarea>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

// src/controls/textbox.coffee
var TextBox;
var extend$12 = function(child, parent) { for (var key in parent) { if (hasProp$10.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp$10 = {}.hasOwnProperty;

TextBox = (function(superClass) {
  extend$12(TextBox, superClass);

  function TextBox() {
    return TextBox.__super__.constructor.apply(this, arguments);
  }

  TextBox.prototype.tag = 'textbox';

  TextBox.prototype.html = html$5;

  TextBox.prototype.formElement = 'textarea';

  TextBox.prototype.rows = null;

  TextBox.prototype.cols = null;

  TextBox.prototype.disabled = false;

  TextBox.prototype.maxlength = null;

  TextBox.prototype.readonly = false;

  TextBox.prototype.wrap = null;

  return TextBox;

})(Text$1);

TextBox.register();

var TextBox$1 = TextBox;

// src/controls/index.coffee

// src/index.coffee

exports.Events = Events$1;
exports.CheckBox = checkbox;
exports.Control = Control$1;
exports.CountrySelect = countrySelect;
exports.Currency = currency;
exports.Dropdown = dropdown;
exports.Select = Select$1;
exports.StateSelect = stateSelect;
exports.Text = Text$1;
exports.TextBox = TextBox$1;

return exports;

}({}));
//# sourceMappingURL=elcontrols.js.map
