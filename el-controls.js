var ElControls = (function (exports,buffer,util,Stream,zlib,assert,require$$0) {
  'use strict';

  buffer = buffer && buffer.hasOwnProperty('default') ? buffer['default'] : buffer;
  util = util && util.hasOwnProperty('default') ? util['default'] : util;
  Stream = Stream && Stream.hasOwnProperty('default') ? Stream['default'] : Stream;
  zlib = zlib && zlib.hasOwnProperty('default') ? zlib['default'] : zlib;
  assert = assert && assert.hasOwnProperty('default') ? assert['default'] : assert;
  require$$0 = require$$0 && require$$0.hasOwnProperty('default') ? require$$0['default'] : require$$0;

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
  var requestAnimationFrame$1;

  frameDuration = 1000 / 60;

  id = 0;

  last = 0;

  queue = [];

  var raf = requestAnimationFrame$1 = function(callback) {
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

  // Shims/Polyfills
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
  function toString(obj) {
    return Object.prototype.toString.call(obj)
  }

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
  const
    // be aware, internal usage
    // ATTENTION: prefix the global dynamic variables with `__`
    // tags instances cache
    __TAGS_CACHE = [],
    // tags implementation cache
    __TAG_IMPL = {},
    YIELD_TAG = 'yield',

    /**
     * Const
     */
    GLOBAL_MIXIN = '__global_mixin',

    // riot specific prefixes or attributes
    ATTRS_PREFIX = 'riot-',

    // Riot Directives
    REF_DIRECTIVES = ['ref', 'data-ref'],
    IS_DIRECTIVE = 'data-is',
    CONDITIONAL_DIRECTIVE = 'if',
    LOOP_DIRECTIVE = 'each',
    LOOP_NO_REORDER_DIRECTIVE = 'no-reorder',
    SHOW_DIRECTIVE = 'show',
    HIDE_DIRECTIVE = 'hide',
    KEY_DIRECTIVE = 'key',
    RIOT_EVENTS_KEY = '__riot-events__',

    // for typeof == '' comparisons
    T_STRING = 'string',
    T_OBJECT = 'object',
    T_UNDEF  = 'undefined',
    T_FUNCTION = 'function',

    XLINK_NS = 'http://www.w3.org/1999/xlink',
    SVG_NS = 'http://www.w3.org/2000/svg',
    XLINK_REGEX = /^xlink:(\w+)/,

    WIN = typeof window === T_UNDEF ? undefined : window,

    // special native tags that cannot be treated like the others
    RE_SPECIAL_TAGS = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/,
    RE_SPECIAL_TAGS_NO_OPTION = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/,
    RE_EVENTS_PREFIX = /^on/,
    RE_HTML_ATTRS = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g,
    // some DOM attributes must be normalized
    CASE_SENSITIVE_ATTRIBUTES = {
      'viewbox': 'viewBox',
      'preserveaspectratio': 'preserveAspectRatio'
    },
    /**
     * Matches boolean HTML attributes in the riot tag definition.
     * With a long list like this, a regex is faster than `[].indexOf` in most browsers.
     * @const {RegExp}
     * @see [attributes.md](https://github.com/riot/compiler/blob/dev/doc/attributes.md)
     */
    RE_BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/,
    // version# for IE 8-11, 0 for others
    IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;

  // node_modules/riot/lib/browser/common/util/dom.js

  /**
   * Shorter and fast way to select multiple nodes in the DOM
   * @param   { String } selector - DOM selector
   * @param   { Object } ctx - DOM node where the targets of our search will is located
   * @returns { Object } dom nodes found
   */
  function $$(selector, ctx) {
    return [].slice.call((ctx || document).querySelectorAll(selector))
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
   * Check if a DOM node is an svg tag or part of an svg
   * @param   { HTMLElement }  el - node we want to test
   * @returns {Boolean} true if it's an svg node
   */
  function isSvg(el) {
    const owner = el.ownerSVGElement;
    return !!owner || owner === null
  }

  /**
   * Create a generic DOM node
   * @param   { String } name - name of the DOM node we want to create
   * @returns { Object } DOM node just created
   */
  function mkEl(name) {
    return name === 'svg' ? document.createElementNS(SVG_NS, name) : document.createElement(name)
  }

  /**
   * Set the inner html of any DOM node SVGs included
   * @param { Object } container - DOM node where we'll inject new html
   * @param { String } html - html to inject
   * @param { Boolean } isSvg - svg tags should be treated a bit differently
   */
  /* istanbul ignore next */
  function setInnerHTML(container, html, isSvg) {
    // innerHTML is not supported on svg tags so we neet to treat them differently
    if (isSvg) {
      const node = container.ownerDocument.importNode(
        new DOMParser()
          .parseFromString(`<svg xmlns="${ SVG_NS }">${ html }</svg>`, 'application/xml')
          .documentElement,
        true
      );

      container.appendChild(node);
    } else {
      container.innerHTML = html;
    }
  }

  /**
   * Toggle the visibility of any DOM node
   * @param   { Object }  dom - DOM node we want to hide
   * @param   { Boolean } show - do we want to show it?
   */

  function toggleVisibility(dom, show) {
    dom.style.display = show ? '' : 'none';
    dom.hidden = show ? false : true;
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

  var dom = /*#__PURE__*/Object.freeze({
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
      // replace any user node or insert the new one into the head
      const userNode = $$1('style[type=riot]');

      setAttr(newNode, 'type', 'text/css');
      /* istanbul ignore next */
      if (userNode) {
        if (userNode.id) newNode.id = userNode.id;
        userNode.parentNode.replaceChild(newNode, userNode);
      } else document.head.appendChild(newNode);

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
  }

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
  var observable = function(el) {

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
    return isNil(value) || value === ''
  }

  /**
   * Check against the null and undefined values
   * @param   { * }  value -
   * @returns {Boolean} -
   */
  function isNil(value) {
    return isUndefined(value) || value === null
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
   * @returns { Boolean } true if writable
   */
  function isWritable(obj, key) {
    const descriptor = getPropDescriptor(obj, key);
    return isUndefined(obj[key]) || descriptor && descriptor.writable
  }

  var check = /*#__PURE__*/Object.freeze({
    isBoolAttr: isBoolAttr,
    isFunction: isFunction$2,
    isObject: isObject,
    isUndefined: isUndefined,
    isString: isString,
    isBlank: isBlank,
    isNil: isNil,
    isArray: isArray,
    isWritable: isWritable
  });

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
    for (; i < len; i++) fn(list[i], i);
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
    Object.defineProperty(el, key, extend({
      value,
      enumerable: false,
      writable: false,
      configurable: true
    }, options));
    return el
  }

  /**
   * Function returning always a unique identifier
   * @returns { Number } - number from 0...n
   */
  const uid = (function() {
    let i = -1;
    return () => ++i
  })();

  /**
   * Short alias for Object.getOwnPropertyDescriptor
   */
  const getPropDescriptor = (o, k) => Object.getOwnPropertyDescriptor(o, k);

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
  function extend(src) {
    let obj;
    let i = 1;
    const args = arguments;
    const l = args.length;

    for (; i < l; i++) {
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

  var misc = /*#__PURE__*/Object.freeze({
    each: each,
    contains: contains,
    toCamel: toCamel,
    startsWith: startsWith,
    defineProperty: defineProperty,
    uid: uid,
    getPropDescriptor: getPropDescriptor,
    extend: extend
  });

  // node_modules/riot/lib/settings.js

  var settings = extend(Object.create(brackets.settings), {
    skipAnonymousTags: true,
    // handle the auto updates on any DOM event
    autoUpdate: true
  })

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
    if (!settings.autoUpdate) return

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
    let tag = expr.tag || expr.dom._tag;
    let ref;

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
        parent,
        tagName
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
    parent.__.onUnmount = () => {
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

    const dom = expr.dom;
    // remove the riot- prefix
    const attrName = normalizeAttrName(expr.attr);
    const isToggle = contains([SHOW_DIRECTIVE, HIDE_DIRECTIVE], attrName);
    const isVirtual = expr.root && expr.root.tagName === 'VIRTUAL';
    const { isAnonymous } = this.__;
    const parent = dom && (expr.parent || dom.parentNode);
    // detect the style attributes
    const isStyleAttr = attrName === 'style';
    const isClassAttr = attrName === 'class';

    let value;

    // if it's a tag we could totally skip the rest
    if (expr._riot_id) {
      if (expr.__.wasCreated) {
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

    const context = isToggle && !isAnonymous ? inheritParentProps.call(this) : this;

    // ...it seems to be a simple expression so we try to calculate its value
    value = tmpl(expr.expr, context);

    const hasValue = !isBlank(value);
    const isObj = isObject(value);

    // convert the style/class objects to strings
    if (isObj) {
      if (isClassAttr) {
        value = tmpl(JSON.stringify(value), this);
      } else if (isStyleAttr) {
        value = styleObjectToString(value);
      }
    }

    // remove original attribute
    if (expr.attr && (!expr.wasParsedOnce || !hasValue || value === false)) {
      // remove either riot-* attributes or just the attribute name
      remAttr(dom, getAttr(dom, expr.attr) ? expr.attr : attrName);
    }

    // for the boolean attributes we don't need the value
    // we can convert it to checked=true to checked=checked
    if (expr.bool) value = value ? attrName : false;
    if (expr.isRtag) return updateDataIs(expr, this, value)
    if (expr.wasParsedOnce && expr.value === value) return

    // update the expression value
    expr.value = value;
    expr.wasParsedOnce = true;

    // if the value is an object (and it's not a style or class attribute) we can not do much more with it
    if (isObj && !isClassAttr && !isStyleAttr && !isToggle) return
    // avoid to render undefined/null values
    if (!hasValue) value = '';

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
      } else if (hasValue && value !== false) {
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
        this.expressions = parseExpressions.apply(this.tag, [this.current, true]);
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
  }

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
  }

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
   * Return the value we want to use to lookup the postion of our items in the collection
   * @param   { String }  keyAttr         - lookup string or expression
   * @param   { * }       originalItem    - original item from the collection
   * @param   { Object }  keyedItem       - object created by riot via { item, i in collection }
   * @param   { Boolean } hasKeyAttrExpr  - flag to check whether the key is an expression
   * @returns { * } value that we will use to figure out the item position via collection.indexOf
   */
  function getItemId(keyAttr, originalItem, keyedItem, hasKeyAttrExpr) {
    if (keyAttr) {
      return hasKeyAttrExpr ?  tmpl(keyAttr, keyedItem) :  originalItem[keyAttr]
    }

    return originalItem
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
    const keyAttr = getAttr(dom, KEY_DIRECTIVE);
    const hasKeyAttrExpr = keyAttr ? tmpl.hasExpr(keyAttr) : false;
    const tagName = getTagName(dom);
    const impl = __TAG_IMPL[tagName];
    const parentNode = dom.parentNode;
    const placeholder = createDOMPlaceholder();
    const child = getTag(dom);
    const ifExpr = getAttr(dom, CONDITIONAL_DIRECTIVE);
    const tags = [];
    const isLoop = true;
    const innerHTML = dom.innerHTML;
    const isAnonymous = !__TAG_IMPL[tagName];
    const isVirtual = dom.tagName === 'VIRTUAL';
    let oldItems = [];
    let hasKeys;

    // remove the each property from the original tag
    remAttr(dom, LOOP_DIRECTIVE);
    remAttr(dom, KEY_DIRECTIVE);

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
      const tmpItems = [];

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

          return !!tmpl(ifExpr, extend(Object.create(parent), item))
        });
      }

      // loop all the new items
      each(items, (_item, i) => {
        const item = !hasKeys && expr.key ? mkitem(expr, _item, i) : _item;
        const itemId = getItemId(keyAttr, _item, item, hasKeyAttrExpr);
        // reorder only if the items are objects
        const doReorder = mustReorder && typeof _item === T_OBJECT && !hasKeys;
        const oldPos = oldItems.indexOf(itemId);
        const isNew = oldPos === -1;
        const pos = !isNew && doReorder ? oldPos : i;
        // does a tag exist in this position?
        let tag = tags[pos];
        const mustAppend = i >= oldItems.length;
        const mustCreate =  doReorder && isNew || !doReorder && !tag;

        // new tag
        if (mustCreate) {
          tag = createTag(impl, {
            parent,
            isLoop,
            isAnonymous,
            tagName,
            root: dom.cloneNode(isAnonymous),
            item,
            index: i,
          }, innerHTML);

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
          if (keyAttr || contains(items, oldItems[pos])) {
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

        tmpItems[i] = itemId;

        if (!mustCreate) tag.update(item);
      });

      // remove the redundant tags
      unmountRedundant(items, tags);

      // clone the items array
      oldItems = tmpItems.slice();

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
   * @param   { Boolean } mustIncludeRoot - flag to decide whether the root must be parsed as well
   * @returns { Array } all the expressions found
   */
  function parseExpressions(root, mustIncludeRoot) {
    const expressions = [];

    walkNodes(root, (dom) => {
      const type = dom.nodeType;
      let attr;
      let tagImpl;

      if (!mustIncludeRoot && dom === root) return

      // text node
      if (type === 3 && dom.parentNode.tagName !== 'STYLE' && tmpl.hasExpr(dom.nodeValue))
        expressions.push({dom, expr: dom.nodeValue});

      if (type !== 1) return

      const isVirtual = dom.tagName === 'VIRTUAL';

      // loop. each does it's own thing (for now)
      if (attr = getAttr(dom, LOOP_DIRECTIVE)) {
        if(isVirtual) setAttr(dom, 'loopVirtual', true); // ignore here, handled in _each
        expressions.push(_each(dom, this, attr));
        return false
      }

      // if-attrs become the new parent. Any following expressions (either on the current
      // element, or below it) become children of this expression.
      if (attr = getAttr(dom, CONDITIONAL_DIRECTIVE)) {
        expressions.push(Object.create(IfExpr).init(dom, this, attr));
        return false
      }

      if (attr = getAttr(dom, IS_DIRECTIVE)) {
        if (tmpl.hasExpr(attr)) {
          expressions.push({
            isRtag: true,
            expr: attr,
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
          const tag = createTag(
            {tmpl: dom.outerHTML},
            {root: dom, parent: this},
            dom.innerHTML
          );

          expressions.push(tag); // no return, anonymous tag, keep parsing
        } else {
          expressions.push(
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
        expressions.push(expr);
      }]);
    });

    return expressions
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

      if (contains(REF_DIRECTIVES, name) && dom.tagName.toLowerCase() !== YIELD_TAG) {
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

  const
    reHasYield  = /<yield\b/i,
    reYieldAll  = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig,
    reYieldSrc  = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig,
    reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig,
    rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' },
    tblTags = IE_VERSION && IE_VERSION < 10 ? RE_SPECIAL_TAGS : RE_SPECIAL_TAGS_NO_OPTION,
    GENERIC = 'div',
    SVG = 'svg';


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
      setInnerHTML(el, tmpl, isSvg$$1);

    return el
  }

  // node_modules/riot/lib/browser/tag/core.js

  /**
   * Another way to create a riot tag a bit more es6 friendly
   * @param { HTMLElement } el - tag DOM selector or DOM node/s
   * @param { Object } opts - tag logic
   * @returns { Tag } new riot tag instance
   */
  function Tag(el, opts) {
    // get the tag properties from the class constructor
    const {name, tmpl, css, attrs, onCreate} = this;
    // register a new tag and cache the class prototype
    if (!__TAG_IMPL[name]) {
      tag(name, tmpl, css, attrs, onCreate);
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
  function tag(name, tmpl, css, attrs, fn) {
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
  function tag2(name, tmpl, css, attrs, fn) {
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
  function mount(selector, tagName, opts) {
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
  function mixin(name, mix, g) {
    // Unnamed global
    if (isObject(name)) {
      mixin(`__${mixins_id++}__`, name, true);
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
      extend(mix.prototype, store[name] || {}) && mix :
      extend(store[name] || {}, mix);
  }

  /**
   * Update all the tags instances created
   * @returns { Array } all the tags instances
   */
  function update() {
    return each(__TAGS_CACHE, tag => tag.update())
  }

  function unregister(name) {
    __TAG_IMPL[name] = null;
  }

  const version = 'WIP';

  var core = /*#__PURE__*/Object.freeze({
    Tag: Tag,
    tag: tag,
    tag2: tag2,
    mount: mount,
    mixin: mixin,
    update: update,
    unregister: unregister,
    version: version
  });

  // node_modules/riot/lib/browser/tag/tag.js

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
    const ctx = isLoop ? inheritParentProps.call(this) : parent || this;

    each(instAttrs, (attr) => {
      if (attr.expr) updateExpression.call(ctx, attr.expr);
      // normalize the attribute names
      opts[toCamel(attr.name).replace(ATTRS_PREFIX, '')] = attr.expr ? attr.expr.value : attr.value;
    });
  }

  /**
   * Manage the mount state of a tag triggering also the observable events
   * @this Tag
   * @param { Boolean } value - ..of the isMounted flag
   */
  function setMountState(value) {
    const { isAnonymous } = this.__;

    defineProperty(this, 'isMounted', value);

    if (!isAnonymous) {
      if (value) this.trigger('mount');
      else {
        this.trigger('unmount');
        this.off('*');
        this.__.wasCreated = false;
      }
    }
  }


  /**
   * Tag creation factory function
   * @constructor
   * @param { Object } impl - it contains the tag template, and logic
   * @param { Object } conf - tag options
   * @param { String } innerHTML - html that eventually we need to inject in the tag
   */
  function createTag(impl = {}, conf = {}, innerHTML) {
    const tag$$1 = conf.context || {};
    const opts = extend({}, conf.opts);
    const parent = conf.parent;
    const isLoop = conf.isLoop;
    const isAnonymous = !!conf.isAnonymous;
    const skipAnonymous = settings.skipAnonymousTags && isAnonymous;
    const item = conf.item;
    // available only for the looped nodes
    const index = conf.index;
    // All attributes on the Tag when it's first parsed
    const instAttrs = [];
    // expressions on this type of Tag
    const implAttrs = [];
    const expressions = [];
    const root = conf.root;
    const tagName = conf.tagName || getTagName(root);
    const isVirtual = tagName === 'virtual';
    const isInline = !isVirtual && !impl.tmpl;
    let dom;

    // make this tag observable
    if (!skipAnonymous) observable(tag$$1);
    // only call unmount if we have a valid __TAG_IMPL (has name property)
    if (impl.name && root._tag) root._tag.unmount(true);

    // not yet mounted
    defineProperty(tag$$1, 'isMounted', false);

    defineProperty(tag$$1, '__', {
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
      wasCreated: false,
      tail: null,
      head: null,
      parent: null,
      item: null
    });

    // create a unique id to this tag
    // it could be handy to use it also to improve the virtual dom rendering speed
    defineProperty(tag$$1, '_riot_id', uid()); // base 1 allows test !t._riot_id
    defineProperty(tag$$1, 'root', root);
    extend(tag$$1, { opts }, item);
    // protect the "tags" and "refs" property from being overridden
    defineProperty(tag$$1, 'parent', parent || null);
    defineProperty(tag$$1, 'tags', {});
    defineProperty(tag$$1, 'refs', {});

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
    defineProperty(tag$$1, 'update', function tagUpdate(data) {
      const nextOpts = {};
      const canTrigger = tag$$1.isMounted && !skipAnonymous;

      // inherit properties from the parent tag
      if (isAnonymous && parent) extend(tag$$1, parent);
      extend(tag$$1, data);

      updateOpts.apply(tag$$1, [isLoop, parent, isAnonymous, nextOpts, instAttrs]);

      if (
        canTrigger &&
        tag$$1.isMounted &&
        isFunction$2(tag$$1.shouldUpdate) && !tag$$1.shouldUpdate(data, nextOpts)
      ) {
        return tag$$1
      }

      extend(opts, nextOpts);

      if (canTrigger) tag$$1.trigger('update', data);
      updateAllExpressions.call(tag$$1, expressions);
      if (canTrigger) tag$$1.trigger('updated');

      return tag$$1
    });

    /**
     * Add a mixin to this tag
     * @returns { Tag } the current tag instance
     */
    defineProperty(tag$$1, 'mixin', function tagMixin() {
      each(arguments, (mix) => {
        let instance;
        let obj;
        let props = [];

        // properties blacklisted and will not be bound to the tag instance
        const propsBlacklist = ['init', '__proto__'];

        mix = isString(mix) ? mixin(mix) : mix;

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
          // bind methods to tag
          // allow mixins to override other properties/parent mixins
          if (!contains(propsBlacklist, key)) {
            // check for getters/setters
            const descriptor = getPropDescriptor(instance, key) || getPropDescriptor(proto, key);
            const hasGetterSetter = descriptor && (descriptor.get || descriptor.set);

            // apply method only if it does not already exist on the instance
            if (!tag$$1.hasOwnProperty(key) && hasGetterSetter) {
              Object.defineProperty(tag$$1, key, descriptor);
            } else {
              tag$$1[key] = isFunction$2(instance[key]) ?
                instance[key].bind(tag$$1) :
                instance[key];
            }
          }
        });

        // init method will be called automatically
        if (instance.init)
          instance.init.bind(tag$$1)(opts);
      });

      return tag$$1
    });

    /**
     * Mount the current tag instance
     * @returns { Tag } the current tag instance
     */
    defineProperty(tag$$1, 'mount', function tagMount() {
      root._tag = tag$$1; // keep a reference to the tag just created

      // Read all the attrs on this instance. This give us the info we need for updateOpts
      parseAttributes.apply(parent, [root, root.attributes, (attr, expr) => {
        if (!isAnonymous && RefExpr.isPrototypeOf(expr)) expr.tag = tag$$1;
        attr.expr = expr;
        instAttrs.push(attr);
      }]);

      // update the root adding custom attributes coming from the compiler
      walkAttrs(impl.attrs, (k, v) => { implAttrs.push({name: k, value: v}); });
      parseAttributes.apply(tag$$1, [root, implAttrs, (attr, expr) => {
        if (expr) expressions.push(expr);
        else setAttr(root, attr.name, attr.value);
      }]);

      // initialiation
      updateOpts.apply(tag$$1, [isLoop, parent, isAnonymous, opts, instAttrs]);

      // add global mixins
      const globalMixin = mixin(GLOBAL_MIXIN);

      if (globalMixin && !skipAnonymous) {
        for (const i in globalMixin) {
          if (globalMixin.hasOwnProperty(i)) {
            tag$$1.mixin(globalMixin[i]);
          }
        }
      }

      if (impl.fn) impl.fn.call(tag$$1, opts);

      if (!skipAnonymous) tag$$1.trigger('before-mount');

      // parse layout after init. fn may calculate args for nested custom tags
      each(parseExpressions.apply(tag$$1, [dom, isAnonymous]), e => expressions.push(e));

      tag$$1.update(item);

      if (!isAnonymous && !isInline) {
        while (dom.firstChild) root.appendChild(dom.firstChild);
      }

      defineProperty(tag$$1, 'root', root);

      // if we need to wait that the parent "mount" or "updated" event gets triggered
      if (!skipAnonymous && tag$$1.parent) {
        const p = getImmediateCustomParentTag(tag$$1.parent);
        p.one(!p.isMounted ? 'mount' : 'updated', () => {
          setMountState.call(tag$$1, true);
        });
      } else {
        // otherwise it's not a child tag we can trigger its mount event
        setMountState.call(tag$$1, true);
      }

      tag$$1.__.wasCreated = true;

      return tag$$1

    });

    /**
     * Unmount the tag instance
     * @param { Boolean } mustKeepRoot - if it's true the root node will not be removed
     * @returns { Tag } the current tag instance
     */
    defineProperty(tag$$1, 'unmount', function tagUnmount(mustKeepRoot) {
      const el = tag$$1.root;
      const p = el.parentNode;
      const tagIndex = __TAGS_CACHE.indexOf(tag$$1);

      if (!skipAnonymous) tag$$1.trigger('before-unmount');

      // clear all attributes coming from the mounted tag
      walkAttrs(impl.attrs, (name) => {
        if (startsWith(name, ATTRS_PREFIX))
          name = name.slice(ATTRS_PREFIX.length);

        remAttr(root, name);
      });

      // remove all the event listeners
      tag$$1.__.listeners.forEach((dom) => {
        Object.keys(dom[RIOT_EVENTS_KEY]).forEach((eventName) => {
          dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][eventName]);
        });
      });

      // remove tag instance from the global tags cache collection
      if (tagIndex !== -1) __TAGS_CACHE.splice(tagIndex, 1);

      // clean up the parent tags object
      if (parent && !isAnonymous) {
        const ptag = getImmediateCustomParentTag(parent);

        if (isVirtual) {
          Object
            .keys(tag$$1.tags)
            .forEach(tagName => arrayishRemove(ptag.tags, tagName, tag$$1.tags[tagName]));
        } else {
          arrayishRemove(ptag.tags, tagName, tag$$1);
        }
      }

      // unmount all the virtual directives
      if (tag$$1.__.virts) {
        each(tag$$1.__.virts, (v) => {
          if (v.parentNode) v.parentNode.removeChild(v);
        });
      }

      // allow expressions to unmount themselves
      unmountAll(expressions);
      each(instAttrs, a => a.expr && a.expr.unmount && a.expr.unmount());

      // clear the tag html if it's necessary
      if (mustKeepRoot) setInnerHTML(el, '');
      // otherwise detach the root tag from the DOM
      else if (p) p.removeChild(el);

      // custom internal unmount function to avoid relying on the observable
      if (tag$$1.__.onUnmount) tag$$1.__.onUnmount();

      // weird fix for a weird edge case #2409 and #2436
      // some users might use your software not as you've expected
      // so I need to add these dirty hacks to mitigate unexpected issues
      if (!tag$$1.isMounted) setMountState.call(tag$$1, true);

      setMountState.call(tag$$1, false);

      delete tag$$1.root._tag;

      return tag$$1
    });

    return tag$$1
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
    const tag = createTag(child, opts, innerHTML);
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
      if (expr.unmount) expr.unmount(true);
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
    } else if (obj[key] === value)
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
    const context = ctx || (implClass ? Object.create(implClass.prototype) : {});
    // cache the inner HTML to fix #855
    const innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;
    const conf = extend({ root, opts, context }, { parent: opts ? opts.parent : null });
    let tag;

    if (impl && root) tag = createTag(impl, conf, innerHTML);

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
   * Return a temporary context containing also the parent properties
   * @this Tag
   * @param { Tag } - temporary tag context containing all the parent properties
   */
  function inheritParentProps() {
    if (this.parent) return extend(Object.create(this), this.parent)
    return this
  }

  /**
   * Move virtual tag and all child nodes
   * @this Tag
   * @param { Node } src  - the node that will do the inserting
   * @param { Tag } target - insert before this tag's first child
   */
  function moveVirtual(src, target) {
    let el = this.__.head;
    let sib;
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

  var tags = /*#__PURE__*/Object.freeze({
    getTag: getTag,
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
    inheritParentProps: inheritParentProps,
    moveVirtual: moveVirtual,
    selectTags: selectTags
  });

  // node_modules/riot/lib/riot.js

  /**
   * Riot public api
   */
  const settings$1 = settings;
  const util$1 = {
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

  var riot$1 = extend({}, core, {
    observable: observable,
    settings: settings$1,
    util: util$1,
  })

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
    var i, j, k, len, letter, order2, ref, test1, test2, test3;
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
      observable(this);
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
  var id$1, p, rafId, scheduleUpdate, todos;

  todos = {};

  rafId = -1;

  p = null;

  id$1 = 0;

  scheduleUpdate = function(tag) {
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
    if (!tag) {
      todos = {
        '*': riot$1
      };
    } else if (tag.update == null) {
      throw new Error('tag has no update routine');
    } else {
      currentTag = tag;
      while (currentTag != null) {
        parentTag = currentTag.parent;
        if (!currentTag._schedulingId) {
          currentTag._schedulingId = id$1++;
        } else if (todos[currentTag.schedulingId] != null) {
          return p;
        }
        currentTag = parentTag;
      }
      todos[tag._schedulingId] = tag;
    }
    if (rafId === -1) {
      rafId = raf(function() {
        return p.resolve();
      });
    }
    return p;
  };

  // node_modules/el.js/src/views/view.coffee
  var View, collapsePrototype, setPrototypeOf;

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
    class View {
      static register() {
        return new this;
      }

      constructor() {
        var newProto;
        newProto = collapsePrototype({}, this);
        this.beforeInit();
        riot$1.tag(this.tag, this.html, this.css, this.attrs, function(opts) {
          var handler, k, name, parent, proto, ref, ref1, self, v;
          if (newProto != null) {
            for (k in newProto) {
              v = newProto[k];
              if (isFunction$1(v)) {
                ((v) => {
                  var oldFn;
                  if (this[k] != null) {
                    oldFn = this[k];
                    return this[k] = () => {
                      oldFn.apply(this, arguments);
                      return v.apply(this, arguments);
                    };
                  } else {
                    return this[k] = () => {
                      return v.apply(this, arguments);
                    };
                  }
                })(v);
              } else {
                this[k] = v;
              }
            }
          }
          // Loop up the parents setting parent as the prototype so you have access to vars on it
          // Might be terrible, might be great, who knows?
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
            for (name in ref1) {
              handler = ref1[name];
              ((name, handler) => {
                if (typeof handler === 'string') {
                  return this.on(name, () => {
                    return this[handler].apply(this, arguments);
                  });
                } else {
                  return this.on(name, () => {
                    return handler.apply(this, arguments);
                  });
                }
              })(name, handler);
            }
          }
          return this.init(opts);
        });
      }

      beforeInit() {}

      init() {}

      scheduleUpdate() {
        return scheduleUpdate(this);
      }

    }
    View.prototype.tag = '';

    View.prototype.html = '';

    View.prototype.css = '';

    View.prototype.attrs = '';

    View.prototype.events = null;

    return View;

  }).call(undefined);

  var View$1 = View;

  // node_modules/el.js/src/views/inputify.coffee
  var inputify, isRef;

  isRef = function(o) {
    return (o != null) && isFunction$1(o.ref);
  };

  // inputify takes a model and a configuration and returns observable values
  //   data: an generic dictionary object that you want to generate observable properties from
  //   configs: a mapping of model values to a middleware stack eg.
  //       field1: middleware
  //       where middleware is an array of (value, name, model)-> value
  inputify = function(data, configs = {}) {
    var config, inputs, name, ref;
    ref = data;
    if (!isRef(ref)) {
      ref = refer$1(data);
    }
    inputs = {};
    for (name in configs) {
      config = configs[name];
      (function(name, config) {
        var i, input, len, middleware, middlewareFn, validate;
        middleware = [];
        if (config && config.length > 0) {
          for (i = 0, len = config.length; i < len; i++) {
            middlewareFn = config[i];
            (function(name, middlewareFn) {
              return middleware.push(function(pair) {
                [ref, name] = pair;
                return Promise$2.resolve(pair).then(function(pair) {
                  return middlewareFn.call(pair[0], pair[0].get(pair[1]), pair[1], pair[0]);
                }).then(function(v) {
                  ref.set(name, v);
                  return pair;
                });
              });
            })(name, middlewareFn);
          }
        }
        middleware.push(function(pair) {
          [ref, name] = pair;
          // on success resolve the value in the ref
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
        // make the input an observable so both form and input can observe it
        observable(input);
        return inputs[name] = input;
      })(name, config);
    }
    return inputs;
  };

  var inputify$1 = inputify;

  // node_modules/el.js/src/views/form.coffee
  var Form;

  Form = (function() {
    // Supported Events:
    //   submit - fired when form is submitted
    class Form extends View$1 {
      initInputs() {
        this.inputs = {};
        if (this.configs != null) {
          return this.inputs = inputify$1(this.data, this.configs);
        }
      }

      init() {
        return this.initInputs();
      }

      submit(e) {
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
        p = Promise$2.settle(ps).then((results) => {
          var i, len, result;
          for (i = 0, len = results.length; i < len; i++) {
            result = results[i];
            if (!result.isFulfilled()) {
              return;
            }
          }
          return this._submit.apply(this, arguments);
        });
        if (e != null) {
          e.preventDefault();
          e.stopPropagation();
        }
        return p;
      }

      _submit() {}

    }
    // input for validate
    // configs: null

    // output from validate that's used for configuring InputViews
    // inputs: null

    // ref to use for validate
    // data: null

    // default transclude contents
    Form.prototype.html = '<yield/>';

    return Form;

  }).call(undefined);

  // do actual submit stuff
  var Form$1 = Form;

  // node_modules/el.js/src/views/input.coffee
  var Input;

  Input = (function() {
    // Input binds to specific fields in the data tree and automatically
    // updates the UI from the data tree on update and updates fields in
    // the data tree on user interaction.
    class Input extends View$1 {
      init() {
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
          observable(this.input);
        }
        this.input.on('validate', (pRef) => {
          return this.validate(pRef);
        });
        // auto refresh on update of field
        return this.input.ref.on('set', (n, v1, v2) => {
          if (n === this.input.name && v1 !== v2) {
            this._change(v1, true);
            return this.scheduleUpdate();
          }
        });
      }

      getValue(event) {
        return event.target.value;
      }

      change(event) {
        var value;
        value = this.getValue(event);
        return this._change(value);
      }

      _change(value, forced) {
        var name, ref;
        ({ref, name} = this.input);
        if (!forced && value === ref.get(name)) {
          return;
        }
        this.input.ref.set(name, value);
        this.clearError();
        return this.validate();
      }

      error(err) {
        var ref1;
        return this.errorMessage = (ref1 = err != null ? err.message : void 0) != null ? ref1 : err;
      }

      changed() {}

      clearError() {
        return this.errorMessage = '';
      }

      // support pass by reference since observable.trigger doesn't return things
      validate(pRef) {
        var p;
        p = this.input.validate(this.input.ref, this.input.name).then((value) => {
          this.changed(value);
          this.valid = true;
          return this.scheduleUpdate();
        }).catch((err) => {
          this.error(err);
          this.valid = false;
          this.scheduleUpdate();
          throw err;
        });
        if (pRef != null) {
          pRef.p = p;
        }
        return p;
      }

    }
    Input.prototype.input = null;

    // Is the input validated?

    // Input state is calculated like this:
    // initial: @value = false
    // valid:   @value = true
    // invald:  @value = false && @errorMessage != ''
    Input.prototype.valid = false;

    // Records the error from any validation middleware if any
    Input.prototype.errorMessage = '';

    return Input;

  }).call(undefined);

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
  var El, k, v;

  El = {
    // deprecated
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

  for (k in riot$1) {
    v = riot$1[k];
    (function(k, v) {
      if (isFunction$1(v)) {
        return El[k] = function() {
          return v.apply(riot$1, arguments);
        };
      }
    })(k, v);
  }

  var El$1 = El;

  // src/events.coffee
  var Events;

  var Events$1 = Events = {
    Change: 'change',
    ChangeSuccess: 'change-success',
    ChangeFailed: 'change-failed'
  };

  // src/utils/valueOrCall.coffee
  var valueOrCall;

  var valueOrCall$1 = valueOrCall = function(valueOrFunc) {
    if (typeof valueOrFunc === 'function') {
      return valueOrFunc();
    }
    return valueOrFunc;
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
  var root = typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined' ? global : undefined;
  var requestAnimationFrame$2 = root.requestAnimationFrame ||
      (function (fn) { return root.setTimeout(fn, 16); });
  var cancelAnimationFrame$1 = root.cancelAnimationFrame ||
      (function (id) { return root.clearTimeout(id); });

  // node_modules/es6-tween/src/core.js
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
  var _ticker = requestAnimationFrame$2;
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
                  var STRING_BUFFER = '', idx = Math.round(n * k), pidx = idx - 1 < 0 ? 0 : idx - 1, vCurr = v[idx], vPrev = v[pidx];
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
  function NodeCache (node, object, tween) {
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
  }

  // node_modules/es6-tween/src/selector.js
  function Selector (selector, collection) {
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
  }

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
                  Plugins[property].update.call(this, object[property], start, end, value, elapsed, property);
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
  var __assign$2 = (undefined && undefined.__assign) || Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
      }
      return t;
  };

  // node_modules/es6-tween/src/index.js

  // src/controls/control.coffee
  var Control, _controlId, scrolling;

  scrolling = false;

  _controlId = 0;

  var Control$1 = Control = (function() {
    class Control extends El$1.Input {
      init() {
        super.init();
        return this._controlId = _controlId++;
      }

      getId() {
        return this.tag + '-' + this._controlId;
      }

      getName() {
        var ref;
        return (ref = valueOrCall$1(this.name)) != null ? ref : this.input.name.replace(/\\./g, '-');
      }

      getValue(event) {
        var ref;
        return (ref = event.target.value) != null ? ref.trim() : void 0;
      }

      error(err) {
        var elTop, rect, t, wTop;
        if (err instanceof DOMException) {
          console.log('WARNING: Error in riot dom manipulation ignored:', err);
          return;
        }
        super.error();
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
          }, 500, Easing.Cubic).on('update', function({x}) {
            return window.scrollTo(window.pageXOffset, x);
          }).on('complete', function() {
            scrolling = false;
            return autoPlay(false);
          }).start();
        }
        return this.mediator.trigger(Events$1.ChangeFailed, this.input.name, this.input.ref.get(this.input.name));
      }

      change() {
        super.change();
        return this.mediator.trigger(Events$1.Change, this.input.name, this.input.ref.get(this.input.name));
      }

      changed(value) {
        this.mediator.trigger(Events$1.ChangeSuccess, this.input.name, value);
        return El$1.scheduleUpdate();
      }

      value() {
        return this.input.ref(this.input.name);
      }

    }
    Control.prototype._controlId = 0;

    Control.prototype.name = null;

    return Control;

  }).call(undefined);

  // templates/controls/checkbox.pug
  var html = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" type=\"checkbox\" onchange=\"{ change }\" onblur=\"{ change }\" checked=\"{ input.ref.get(input.name) }\">\n</yield>\n<yield></yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>";

  // src/controls/checkbox.coffee
  var CheckBox;

  var checkbox = CheckBox = (function() {
    class CheckBox extends Control$1 {
      getValue(event) {
        return event.target.checked;
      }

    }
    CheckBox.prototype.tag = 'checkbox';

    CheckBox.prototype.html = html;

    return CheckBox;

  }).call(undefined);

  CheckBox.register();

  // src/utils/placeholder.coffee
  // contains parts of Input Placeholder Polyfill
  // MIT Licensed
  // Created by Christopher Rolfe

  // When the input value is the same as the placeholder clear it

  var exports$1, hidePlaceholderOnFocus, unfocusOnAnElement;

  hidePlaceholderOnFocus = function(event) {
    var target;
    target = event.currentTarget ? event.currentTarget : event.srcElement;
    if (target.value === target.getAttribute('placeholder')) {
      return target.value = '';
    }
  };


  // When the input has an empty value put the placeholder back in

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
      //jquery case
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
      // Attach event listeners for click and blur
      // Click so that we can clear the placeholder if we need to
      // Blur to re-add it if needed
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
  var html$1 = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" type=\"{ type }\" onchange=\"{ change }\" onblur=\"{ change }\" riot-value=\"{ input.ref.get(input.name) }\" autocomplete=\"{ autocomplete }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" readonly=\"{ readonly }\" placeholder=\"{ placeholder }\">\n</yield>\n<yield from=\"label\">\n  <div class=\"label { active: input.ref.get(input.name) || placeholder }\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

  // src/controls/text.coffee
  var Text;

  var Text$1 = Text = (function() {
    class Text extends Control$1 {
      init() {
        super.init();
        return this.on('mounted', () => {
          var el;
          el = this.root.getElementsByTagName(this.formElement)[0];
          if (this.type !== 'password') {
            return placeholder(el);
          }
        });
      }

    }
    Text.prototype.tag = 'text';

    Text.prototype.html = html$1;

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

    return Text;

  }).call(undefined);

  Text.register();

  // src/controls/readonly.coffee
  var ReadOnly;

  var ReadOnly$1 = ReadOnly = (function() {
    class ReadOnly extends Text$1 {
      init() {
        if (!this.text) {
          return super.init();
        }
      }

      getText() {
        return valueOrCall$1(this.text) || this.input.ref.get(input.name);
      }

      // readonly
      change() {}

      _change() {}

      getName() {}

    }
    ReadOnly.prototype.tag = 'readonly';

    ReadOnly.prototype.readonly = true;

    // pass this in optionally to overwrite a specific value
    ReadOnly.prototype.text = '';

    return ReadOnly;

  }).call(undefined);

  ReadOnly.register();

  // templates/controls/copy.pug
  var html$2 = "\n<yield from=\"input\">\n  <input class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" type=\"{ type }\" onclick=\"{ copy }\" riot-value=\"{ getText() }\" autocomplete=\"{ autocomplete }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" readonly=\"true\" placeholder=\"{ placeholder }\">\n</yield>\n<yield from=\"label\">\n  <div class=\"label { active: true }\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield from=\"copy-text\">\n  <div class=\"copy-text\">{ copied ? 'Copied' : '&#128203;' }</div>\n</yield>\n<yield></yield>";

  // src/controls/copy.coffee
  var Copy;

  var copy = Copy = (function() {
    class Copy extends ReadOnly$1 {
      init() {
        return super.init();
      }

      copy(e) {
        var msg, successful, text, textArea;
        text = this.getText();
        textArea = document.createElement("textarea");
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = 0;
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          successful = document.execCommand('copy');
          msg = successful != null ? successful : {
            'successful': 'unsuccessful'
          };
          console.log('Copying text command was ' + msg);
        } catch (error) {
          console.log('Oops, unable to copy');
        }
        document.body.removeChild(textArea);
        this.copied = true;
        this.scheduleUpdate();
        return false;
      }

    }
    Copy.prototype.tag = 'copy';

    Copy.prototype.html = html$2;

    // pass this in optionally to overwrite a specific value
    Copy.prototype.text = '';

    // this is set automatically
    Copy.prototype.copied = false;

    return Copy;

  }).call(undefined);

  Copy.register();

  // templates/controls/selection.pug
  var html$3 = "\n<yield from=\"input\">\n  <select class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" onchange=\"{ change }\" onblur=\"{ change }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled || !hasOptions() }\" multiple=\"{ multiple }\" size=\"{ size }\">\n    <option if=\"{ placeholder }\" value=\"\">{ placeholder }</option>\n    <option each=\"{ v, k in options() }\" value=\"{ k }\" selected=\"{ k == input.ref.get(input.name) }\">{ v }</option>\n  </select>\n  <div class=\"select-indicator\">▼</div>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

  // src/controls/selection.coffee
  var Select;

  var Select$1 = Select = (function() {
    class Select extends Control$1 {
      hasOptions() {
        // call for side effects
        this.options;
        return this._optionsHash.length > 2;
      }

      options() {
        var optionsHash, selectOptions;
        selectOptions = this.selectOptions;
        if (typeof selectOptions === 'function') {
          selectOptions = selectOptions();
        }
        optionsHash = JSON.stringify(selectOptions);
        if (this._optionsHash !== optionsHash) {
          this._optionsHash = optionsHash;
        }
        return selectOptions;
      }

      getValue(e) {
        var el, ref, ref1, ref2;
        el = e.target;
        return ((ref = (ref1 = el.options) != null ? (ref2 = ref1[el.selectedIndex]) != null ? ref2.value : void 0 : void 0) != null ? ref : '').trim();
      }

      init() {
        return super.init();
      }

    }
    Select.prototype.tag = 'selection';

    Select.prototype.html = html$3;

    Select.prototype.placeholder = 'Select an Option';

    Select.prototype.autofocus = false;

    Select.prototype.disabled = false;

    Select.prototype.multiple = false;

    Select.prototype.size = null;

    // default to something that will be visible
    Select.prototype._optionsHash = 'default';

    Select.prototype.selectOptions = {};

    return Select;

  }).call(undefined);

  Select.register();

  // src/controls/country-select.coffee
  var CountrySelect;

  var countrySelect = CountrySelect = (function() {
    class CountrySelect extends Select$1 {
      // set up the countries in selectedOptions
      // countries should be in the form of
      // [{
      //     code: 'XX',
      //     name: 'Country Name',
      //     subdivisions: [{
      //         code: 'YY',
      //         name: 'Subdivision Name',
      //     }]
      // }]
      options() {
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
      }

      init() {
        return super.init();
      }

    }
    CountrySelect.prototype.tag = 'country-select';

    return CountrySelect;

  }).call(undefined);

  CountrySelect.register();

  // templates/controls/currency.pug
  var html$4 = "\n<yield from=\"input\">\n  <div class=\"currency-container { invalid: errorMessage, valid: valid }\">\n    <input class=\"currency-amount right-aligned {invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" type=\"{ type }\" onchange=\"{ change }\" onblur=\"{ change }\" riot-value=\"{ renderValue() }\" autocomplete=\"{ autocomplete }\" autofocus=\"{ autofocus }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" readonly=\"{ readonly }\" placeholder=\"{ placeholder }\">\n    <div class=\"currency-code\">\n      <div class=\"currency-code-text\">{ getCurrency().toUpperCase() }</div>\n    </div>\n  </div>\n</yield>\n<yield from=\"label\">\n  <div class=\"label { active: input.ref.get(input.name) || input.ref.get(input.name) == 0 || placeholder }\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

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
  var currencySeparator, currencySigns, digitsOnlyRe;

  currencySeparator = '.';

  digitsOnlyRe = new RegExp('[^\\d.-]', 'g');

  currencySigns = currencies.data;

  // Does the currency support decimal notation
  var isZeroDecimal = function(code) {
    if (code) {
      code = code.toLowerCase();
    }
    if (code === 'bif' || code === 'clp' || code === 'djf' || code === 'gnf' || code === 'jpy' || code === 'kmf' || code === 'krw' || code === 'mga' || code === 'pyg' || code === 'rwf' || code === 'vnd' || code === 'vuv' || code === 'xaf' || code === 'xof' || code === 'xpf') {
      return true;
    }
    return false;
  };

  // Convert data format to humanized format
  var renderUICurrencyFromJSON = function(code, jsonCurrency) {
    var currentCurrencySign, ref;
    if (code) {
      code = code.toLowerCase();
    }
    if (isNaN(jsonCurrency)) {
      jsonCurrency = 0;
    }
    currentCurrencySign = (ref = currencySigns[code]) != null ? ref : '';
    // ethereum
    if (code === 'eth' || code === 'btc' || code === 'xbt') {
      jsonCurrency = jsonCurrency / 1e9;
      return currentCurrencySign + jsonCurrency;
    }
    jsonCurrency = '' + jsonCurrency;
    // jsonCurrency is not cents
    if (isZeroDecimal(code)) {
      return currentCurrencySign + jsonCurrency;
    }
    // jsonCurrency is cents
    while (jsonCurrency.length < 3) {
      jsonCurrency = '0' + jsonCurrency;
    }
    return currentCurrencySign + jsonCurrency.substr(0, jsonCurrency.length - 2) + '.' + jsonCurrency.substr(-2);
  };

  // Convert humanized format to data format
  var renderJSONCurrencyFromUI = function(code, uiCurrency) {
    var currentCurrencySign, parts;
    if (code) {
      code = code.toLowerCase();
    }
    currentCurrencySign = currencySigns[code];
    // ethereum
    if (code === 'eth' || code === 'btc' || code === 'xbt') {
      return parseFloat(('' + uiCurrency).replace(digitsOnlyRe, '')) * 1e9;
    }
    if (isZeroDecimal(code)) {
      return parseInt(('' + uiCurrency).replace(digitsOnlyRe, '').replace(currencySeparator, ''), 10);
    }
    // uiCurrency is a whole unit of currency
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

  var currency = Currency = (function() {
    class Currency extends Text$1 {
      init() {
        return super.init();
      }

      getCurrency(e) {
        return valueOrCall$1(this.currency);
      }

      renderValue() {
        return renderUICurrencyFromJSON(this.getCurrency(), this.input.ref.get(this.input.name));
      }

      getValue(e) {
        var el, ref;
        el = e.target;
        return renderJSONCurrencyFromUI(this.getCurrency(), ((ref = el.value) != null ? ref : '0').trim());
      }

    }
    Currency.prototype.tag = 'currency';

    Currency.prototype.html = html$4;

    Currency.prototype.currency = '';

    return Currency;

  }).call(undefined);

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
          var el = $(this)
          ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide();
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
      var id = zid(element)
      ;(events || '').split(/\s/).forEach(function(event){
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

  (function($){
    var zepto$$1 = $.zepto, oldQsa = zepto$$1.qsa, oldMatches = zepto$$1.matches;

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
      has:      function(idx, _, sel){ if (zepto$$1.qsa(this, sel).length) return this }
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

    zepto$$1.qsa = function(node, selector) {
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
          zepto$$1.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
      })
    };

    zepto$$1.matches = function(node, selector){
      return process(selector, function(sel, filter, arg){
        return (!sel || oldMatches(node, sel)) &&
          (!filter || filter.call(node, null, arg) === node)
      })
    };
  })(zepto);

  // src/$.coffee
  // Use zepto if there's no jquery involved so we can run without it.
  // Use jquery or something else if you need better compatibility.
  var $$2;

  $$2 = zepto;

  if (window.$ == null) {
    // add in outer support from https://gist.github.com/pamelafox/1379704
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
    // Use whichever $
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

  function extend$1(a, b) {
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

      options = extend$1({}, options);

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
  var html$5 = "\n<yield from=\"input\">\n  <select class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" style=\"display: none\" onchange=\"{ change }\" onblur=\"{ change }\" placeholder=\"{ placeholder }\"></select>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

  // src/controls/dropdown.coffee
  var Select$2, coolDown, isABrokenBrowser;

  isABrokenBrowser = window.navigator.userAgent.indexOf('MSIE') > 0 || window.navigator.userAgent.indexOf('Trident') > 0;

  coolDown = -1;

  var dropdown = Select$2 = (function() {
    class Select extends Text$1 {
      options() {
        return this.selectOptions;
      }

      getValue(event) {
        var ref;
        return (ref = $$3(event.target).val()) != null ? ref.trim().toLowerCase() : void 0;
      }

      initSelect($select) {
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
        // valueField: 'value'
        // labelField: 'text'
        // searchField: 'text'
        }).on('change', (event) => {
          // This isn't working right, sometimes you have one change firing events on unrelated fields
          if (coolDown !== -1) {
            return;
          }
          coolDown = setTimeout(function() {
            return coolDown = -1;
          }, 100);
          this.change(event);
          event.preventDefault();
          event.stopPropagation();
          return false;
        });
        select = $select[0];
        select.selectize.addOption(options);
        select.selectize.addItem([this.input.ref.get(this.input.name)] || [], true);
        select.selectize.refreshOptions(false);
        //support auto fill
        $input = $select.parent().find('.selectize-input input:first');
        $input.on('change', function(event) {
          var val;
          val = $$3(event.target).val();
          if (invertedOptions[val] != null) {
            return $select[0].selectize.setValue(invertedOptions[val]);
          }
        });
        //support read only
        if (this.readOnly) {
          return $input.attr('readonly', true);
        }
      }

      init(opts) {
        super.init();
        return this.style = this.style || 'width:100%';
      }

      onUpdated() {
        var $control, $select, select, v;
        if (this.input == null) {
          return;
        }
        $select = $$3(this.root).find('select');
        select = $select[0];
        if (select != null) {
          v = this.input.ref.get(this.input.name);
          if (!this.initialized) {
            return raf(() => {
              this.initSelect($select);
              return this.initialized = true;
            });
          } else if ((select.selectize != null) && v !== select.selectize.getValue()) {
            select.selectize.clear(true);
            return select.selectize.addItem(v, true);
          }
        } else {
          $control = $$3(this.root).find('.selectize-control');
          if ($control[0] == null) {
            return raf(() => {
              return this.scheduleUpdate();
            });
          }
        }
      }

    }
    Select.prototype.tag = 'dropdown';

    Select.prototype.html = html$5;

    Select.prototype.selectOptions = {};

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

    return Select;

  }).call(undefined);

  // @on 'unmount', ()=>
  //   $select = $(@root).find('select')
  Select$2.register();

  //  commonjsHelpers

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var lib = (typeof self === 'object' && self.self === self && self) ||
    (typeof commonjsGlobal === 'object' && commonjsGlobal.global === commonjsGlobal && commonjsGlobal) ||
    commonjsGlobal;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/window-or-global/lib/index.js

  var canPromise = function() {
    return (
      typeof lib.Promise === 'function' &&
      typeof lib.Promise.prototype.then === 'function'
    )
  };

  //  commonjs-external:buffer

  // node_modules/qrcode/lib/utils/buffer.js
  var buffer$1 = buffer.Buffer;

  // node_modules/qrcode/lib/core/utils.js
  var toSJISFunction;
  var CODEWORDS_COUNT = [
    0, // Not used
    26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
    404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
    1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185,
    2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706
  ];

  /**
   * Returns the QR Code size for the specified version
   *
   * @param  {Number} version QR Code version
   * @return {Number}         size of QR code
   */
  var getSymbolSize = function getSymbolSize (version) {
    if (!version) throw new Error('"version" cannot be null or undefined')
    if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40')
    return version * 4 + 17
  };

  /**
   * Returns the total number of codewords used to store data and EC information.
   *
   * @param  {Number} version QR Code version
   * @return {Number}         Data length in bits
   */
  var getSymbolTotalCodewords = function getSymbolTotalCodewords (version) {
    return CODEWORDS_COUNT[version]
  };

  /**
   * Encode data with Bose-Chaudhuri-Hocquenghem
   *
   * @param  {Number} data Value to encode
   * @return {Number}      Encoded value
   */
  var getBCHDigit = function (data) {
    var digit = 0;

    while (data !== 0) {
      digit++;
      data >>>= 1;
    }

    return digit
  };

  var setToSJISFunction = function setToSJISFunction (f) {
    if (typeof f !== 'function') {
      throw new Error('"toSJISFunc" is not a valid function.')
    }

    toSJISFunction = f;
  };

  var isKanjiModeEnabled = function () {
    return typeof toSJISFunction !== 'undefined'
  };

  var toSJIS = function toSJIS (kanji) {
    return toSJISFunction(kanji)
  };

  var utils = {
  	getSymbolSize: getSymbolSize,
  	getSymbolTotalCodewords: getSymbolTotalCodewords,
  	getBCHDigit: getBCHDigit,
  	setToSJISFunction: setToSJISFunction,
  	isKanjiModeEnabled: isKanjiModeEnabled,
  	toSJIS: toSJIS
  };

  var errorCorrectionLevel = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/error-correction-level.js
  exports.L = { bit: 1 };
  exports.M = { bit: 0 };
  exports.Q = { bit: 3 };
  exports.H = { bit: 2 };

  function fromString (string) {
    if (typeof string !== 'string') {
      throw new Error('Param is not a string')
    }

    var lcStr = string.toLowerCase();

    switch (lcStr) {
      case 'l':
      case 'low':
        return exports.L

      case 'm':
      case 'medium':
        return exports.M

      case 'q':
      case 'quartile':
        return exports.Q

      case 'h':
      case 'high':
        return exports.H

      default:
        throw new Error('Unknown EC Level: ' + string)
    }
  }

  exports.isValid = function isValid (level) {
    return level && typeof level.bit !== 'undefined' &&
      level.bit >= 0 && level.bit < 4
  };

  exports.from = function from (value, defaultValue) {
    if (exports.isValid(value)) {
      return value
    }

    try {
      return fromString(value)
    } catch (e) {
      return defaultValue
    }
  };
  });
  var errorCorrectionLevel_1 = errorCorrectionLevel.L;
  var errorCorrectionLevel_2 = errorCorrectionLevel.M;
  var errorCorrectionLevel_3 = errorCorrectionLevel.Q;
  var errorCorrectionLevel_4 = errorCorrectionLevel.H;
  var errorCorrectionLevel_5 = errorCorrectionLevel.isValid;
  var errorCorrectionLevel_6 = errorCorrectionLevel.from;

  // node_modules/qrcode/lib/core/bit-buffer.js
  function BitBuffer () {
    this.buffer = [];
    this.length = 0;
  }

  BitBuffer.prototype = {

    get: function (index) {
      var bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1
    },

    put: function (num, length) {
      for (var i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      }
    },

    getLengthInBits: function () {
      return this.length
    },

    putBit: function (bit) {
      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) {
        this.buffer.push(0);
      }

      if (bit) {
        this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      }

      this.length++;
    }
  };

  var bitBuffer = BitBuffer;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/utils/buffer.js

  // node_modules/qrcode/lib/core/bit-matrix.js


  /**
   * Helper class to handle QR Code symbol modules
   *
   * @param {Number} size Symbol size
   */
  function BitMatrix (size) {
    if (!size || size < 1) {
      throw new Error('BitMatrix size must be defined and greater than 0')
    }

    this.size = size;
    this.data = new buffer$1(size * size);
    this.data.fill(0);
    this.reservedBit = new buffer$1(size * size);
    this.reservedBit.fill(0);
  }

  /**
   * Set bit value at specified location
   * If reserved flag is set, this bit will be ignored during masking process
   *
   * @param {Number}  row
   * @param {Number}  col
   * @param {Boolean} value
   * @param {Boolean} reserved
   */
  BitMatrix.prototype.set = function (row, col, value, reserved) {
    var index = row * this.size + col;
    this.data[index] = value;
    if (reserved) this.reservedBit[index] = true;
  };

  /**
   * Returns bit value at specified location
   *
   * @param  {Number}  row
   * @param  {Number}  col
   * @return {Boolean}
   */
  BitMatrix.prototype.get = function (row, col) {
    return this.data[row * this.size + col]
  };

  /**
   * Applies xor operator at specified location
   * (used during masking process)
   *
   * @param {Number}  row
   * @param {Number}  col
   * @param {Boolean} value
   */
  BitMatrix.prototype.xor = function (row, col, value) {
    this.data[row * this.size + col] ^= value;
  };

  /**
   * Check if bit at specified location is reserved
   *
   * @param {Number}   row
   * @param {Number}   col
   * @return {Boolean}
   */
  BitMatrix.prototype.isReserved = function (row, col) {
    return this.reservedBit[row * this.size + col]
  };

  var bitMatrix = BitMatrix;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/utils.js

  var alignmentPattern = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/alignment-pattern.js
  /**
   * Alignment pattern are fixed reference pattern in defined positions
   * in a matrix symbology, which enables the decode software to re-synchronise
   * the coordinate mapping of the image modules in the event of moderate amounts
   * of distortion of the image.
   *
   * Alignment patterns are present only in QR Code symbols of version 2 or larger
   * and their number depends on the symbol version.
   */

  var getSymbolSize = utils.getSymbolSize;

  /**
   * Calculate the row/column coordinates of the center module of each alignment pattern
   * for the specified QR Code version.
   *
   * The alignment patterns are positioned symmetrically on either side of the diagonal
   * running from the top left corner of the symbol to the bottom right corner.
   *
   * Since positions are simmetrical only half of the coordinates are returned.
   * Each item of the array will represent in turn the x and y coordinate.
   * @see {@link getPositions}
   *
   * @param  {Number} version QR Code version
   * @return {Array}          Array of coordinate
   */
  exports.getRowColCoords = function getRowColCoords (version) {
    if (version === 1) return []

    var posCount = Math.floor(version / 7) + 2;
    var size = getSymbolSize(version);
    var intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
    var positions = [size - 7]; // Last coord is always (size - 7)

    for (var i = 1; i < posCount - 1; i++) {
      positions[i] = positions[i - 1] - intervals;
    }

    positions.push(6); // First coord is always 6

    return positions.reverse()
  };

  /**
   * Returns an array containing the positions of each alignment pattern.
   * Each array's element represent the center point of the pattern as (x, y) coordinates
   *
   * Coordinates are calculated expanding the row/column coordinates returned by {@link getRowColCoords}
   * and filtering out the items that overlaps with finder pattern
   *
   * @example
   * For a Version 7 symbol {@link getRowColCoords} returns values 6, 22 and 38.
   * The alignment patterns, therefore, are to be centered on (row, column)
   * positions (6,22), (22,6), (22,22), (22,38), (38,22), (38,38).
   * Note that the coordinates (6,6), (6,38), (38,6) are occupied by finder patterns
   * and are not therefore used for alignment patterns.
   *
   * var pos = getPositions(7)
   * // [[6,22], [22,6], [22,22], [22,38], [38,22], [38,38]]
   *
   * @param  {Number} version QR Code version
   * @return {Array}          Array of coordinates
   */
  exports.getPositions = function getPositions (version) {
    var coords = [];
    var pos = exports.getRowColCoords(version);
    var posLength = pos.length;

    for (var i = 0; i < posLength; i++) {
      for (var j = 0; j < posLength; j++) {
        // Skip if position is occupied by finder patterns
        if ((i === 0 && j === 0) ||             // top-left
            (i === 0 && j === posLength - 1) || // bottom-left
            (i === posLength - 1 && j === 0)) { // top-right
          continue
        }

        coords.push([pos[i], pos[j]]);
      }
    }

    return coords
  };
  });
  var alignmentPattern_1 = alignmentPattern.getRowColCoords;
  var alignmentPattern_2 = alignmentPattern.getPositions;

  // node_modules/qrcode/lib/core/finder-pattern.js
  var getSymbolSize$1 = utils.getSymbolSize;
  var FINDER_PATTERN_SIZE = 7;

  /**
   * Returns an array containing the positions of each finder pattern.
   * Each array's element represent the top-left point of the pattern as (x, y) coordinates
   *
   * @param  {Number} version QR Code version
   * @return {Array}          Array of coordinates
   */
  var getPositions = function getPositions (version) {
    var size = getSymbolSize$1(version);

    return [
      // top-left
      [0, 0],
      // top-right
      [size - FINDER_PATTERN_SIZE, 0],
      // bottom-left
      [0, size - FINDER_PATTERN_SIZE]
    ]
  };

  var finderPattern = {
  	getPositions: getPositions
  };

  var maskPattern = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/mask-pattern.js
  /**
   * Data mask pattern reference
   * @type {Object}
   */
  exports.Patterns = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };

  /**
   * Weighted penalty scores for the undesirable features
   * @type {Object}
   */
  var PenaltyScores = {
    N1: 3,
    N2: 3,
    N3: 40,
    N4: 10
  };

  /**
   * Check if mask pattern value is valid
   *
   * @param  {Number}  mask    Mask pattern
   * @return {Boolean}         true if valid, false otherwise
   */
  exports.isValid = function isValid (mask) {
    return mask && mask !== '' && !isNaN(mask) && mask >= 0 && mask <= 7
  };

  /**
   * Returns mask pattern from a value.
   * If value is not valid, returns undefined
   *
   * @param  {Number|String} value        Mask pattern value
   * @return {Number}                     Valid mask pattern or undefined
   */
  exports.from = function from (value) {
    return exports.isValid(value) ? parseInt(value, 10) : undefined
  };

  /**
  * Find adjacent modules in row/column with the same color
  * and assign a penalty value.
  *
  * Points: N1 + i
  * i is the amount by which the number of adjacent modules of the same color exceeds 5
  */
  exports.getPenaltyN1 = function getPenaltyN1 (data) {
    var size = data.size;
    var points = 0;
    var sameCountCol = 0;
    var sameCountRow = 0;
    var lastCol = null;
    var lastRow = null;

    for (var row = 0; row < size; row++) {
      sameCountCol = sameCountRow = 0;
      lastCol = lastRow = null;

      for (var col = 0; col < size; col++) {
        var module = data.get(row, col);
        if (module === lastCol) {
          sameCountCol++;
        } else {
          if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
          lastCol = module;
          sameCountCol = 1;
        }

        module = data.get(col, row);
        if (module === lastRow) {
          sameCountRow++;
        } else {
          if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
          lastRow = module;
          sameCountRow = 1;
        }
      }

      if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
      if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
    }

    return points
  };

  /**
   * Find 2x2 blocks with the same color and assign a penalty value
   *
   * Points: N2 * (m - 1) * (n - 1)
   */
  exports.getPenaltyN2 = function getPenaltyN2 (data) {
    var size = data.size;
    var points = 0;

    for (var row = 0; row < size - 1; row++) {
      for (var col = 0; col < size - 1; col++) {
        var last = data.get(row, col) +
          data.get(row, col + 1) +
          data.get(row + 1, col) +
          data.get(row + 1, col + 1);

        if (last === 4 || last === 0) points++;
      }
    }

    return points * PenaltyScores.N2
  };

  /**
   * Find 1:1:3:1:1 ratio (dark:light:dark:light:dark) pattern in row/column,
   * preceded or followed by light area 4 modules wide
   *
   * Points: N3 * number of pattern found
   */
  exports.getPenaltyN3 = function getPenaltyN3 (data) {
    var size = data.size;
    var points = 0;
    var bitsCol = 0;
    var bitsRow = 0;

    for (var row = 0; row < size; row++) {
      bitsCol = bitsRow = 0;
      for (var col = 0; col < size; col++) {
        bitsCol = ((bitsCol << 1) & 0x7FF) | data.get(row, col);
        if (col >= 10 && (bitsCol === 0x5D0 || bitsCol === 0x05D)) points++;

        bitsRow = ((bitsRow << 1) & 0x7FF) | data.get(col, row);
        if (col >= 10 && (bitsRow === 0x5D0 || bitsRow === 0x05D)) points++;
      }
    }

    return points * PenaltyScores.N3
  };

  /**
   * Calculate proportion of dark modules in entire symbol
   *
   * Points: N4 * k
   *
   * k is the rating of the deviation of the proportion of dark modules
   * in the symbol from 50% in steps of 5%
   */
  exports.getPenaltyN4 = function getPenaltyN4 (data) {
    var darkCount = 0;
    var modulesCount = data.data.length;

    for (var i = 0; i < modulesCount; i++) darkCount += data.data[i];

    var k = Math.abs(Math.ceil((darkCount * 100 / modulesCount) / 5) - 10);

    return k * PenaltyScores.N4
  };

  /**
   * Return mask value at given position
   *
   * @param  {Number} maskPattern Pattern reference value
   * @param  {Number} i           Row
   * @param  {Number} j           Column
   * @return {Boolean}            Mask value
   */
  function getMaskAt (maskPattern, i, j) {
    switch (maskPattern) {
      case exports.Patterns.PATTERN000: return (i + j) % 2 === 0
      case exports.Patterns.PATTERN001: return i % 2 === 0
      case exports.Patterns.PATTERN010: return j % 3 === 0
      case exports.Patterns.PATTERN011: return (i + j) % 3 === 0
      case exports.Patterns.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
      case exports.Patterns.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0
      case exports.Patterns.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0
      case exports.Patterns.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0

      default: throw new Error('bad maskPattern:' + maskPattern)
    }
  }

  /**
   * Apply a mask pattern to a BitMatrix
   *
   * @param  {Number}    pattern Pattern reference number
   * @param  {BitMatrix} data    BitMatrix data
   */
  exports.applyMask = function applyMask (pattern, data) {
    var size = data.size;

    for (var col = 0; col < size; col++) {
      for (var row = 0; row < size; row++) {
        if (data.isReserved(row, col)) continue
        data.xor(row, col, getMaskAt(pattern, row, col));
      }
    }
  };

  /**
   * Returns the best mask pattern for data
   *
   * @param  {BitMatrix} data
   * @return {Number} Mask pattern reference number
   */
  exports.getBestMask = function getBestMask (data, setupFormatFunc) {
    var numPatterns = Object.keys(exports.Patterns).length;
    var bestPattern = 0;
    var lowerPenalty = Infinity;

    for (var p = 0; p < numPatterns; p++) {
      setupFormatFunc(p);
      exports.applyMask(p, data);

      // Calculate penalty
      var penalty =
        exports.getPenaltyN1(data) +
        exports.getPenaltyN2(data) +
        exports.getPenaltyN3(data) +
        exports.getPenaltyN4(data);

      // Undo previously applied mask
      exports.applyMask(p, data);

      if (penalty < lowerPenalty) {
        lowerPenalty = penalty;
        bestPattern = p;
      }
    }

    return bestPattern
  };
  });
  var maskPattern_1 = maskPattern.Patterns;
  var maskPattern_2 = maskPattern.isValid;
  var maskPattern_3 = maskPattern.from;
  var maskPattern_4 = maskPattern.getPenaltyN1;
  var maskPattern_5 = maskPattern.getPenaltyN2;
  var maskPattern_6 = maskPattern.getPenaltyN3;
  var maskPattern_7 = maskPattern.getPenaltyN4;
  var maskPattern_8 = maskPattern.applyMask;
  var maskPattern_9 = maskPattern.getBestMask;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/error-correction-level.js

  // node_modules/qrcode/lib/core/error-correction-code.js


  var EC_BLOCKS_TABLE = [
  // L  M  Q  H
    1, 1, 1, 1,
    1, 1, 1, 1,
    1, 1, 2, 2,
    1, 2, 2, 4,
    1, 2, 4, 4,
    2, 4, 4, 4,
    2, 4, 6, 5,
    2, 4, 6, 6,
    2, 5, 8, 8,
    4, 5, 8, 8,
    4, 5, 8, 11,
    4, 8, 10, 11,
    4, 9, 12, 16,
    4, 9, 16, 16,
    6, 10, 12, 18,
    6, 10, 17, 16,
    6, 11, 16, 19,
    6, 13, 18, 21,
    7, 14, 21, 25,
    8, 16, 20, 25,
    8, 17, 23, 25,
    9, 17, 23, 34,
    9, 18, 25, 30,
    10, 20, 27, 32,
    12, 21, 29, 35,
    12, 23, 34, 37,
    12, 25, 34, 40,
    13, 26, 35, 42,
    14, 28, 38, 45,
    15, 29, 40, 48,
    16, 31, 43, 51,
    17, 33, 45, 54,
    18, 35, 48, 57,
    19, 37, 51, 60,
    19, 38, 53, 63,
    20, 40, 56, 66,
    21, 43, 59, 70,
    22, 45, 62, 74,
    24, 47, 65, 77,
    25, 49, 68, 81
  ];

  var EC_CODEWORDS_TABLE = [
  // L  M  Q  H
    7, 10, 13, 17,
    10, 16, 22, 28,
    15, 26, 36, 44,
    20, 36, 52, 64,
    26, 48, 72, 88,
    36, 64, 96, 112,
    40, 72, 108, 130,
    48, 88, 132, 156,
    60, 110, 160, 192,
    72, 130, 192, 224,
    80, 150, 224, 264,
    96, 176, 260, 308,
    104, 198, 288, 352,
    120, 216, 320, 384,
    132, 240, 360, 432,
    144, 280, 408, 480,
    168, 308, 448, 532,
    180, 338, 504, 588,
    196, 364, 546, 650,
    224, 416, 600, 700,
    224, 442, 644, 750,
    252, 476, 690, 816,
    270, 504, 750, 900,
    300, 560, 810, 960,
    312, 588, 870, 1050,
    336, 644, 952, 1110,
    360, 700, 1020, 1200,
    390, 728, 1050, 1260,
    420, 784, 1140, 1350,
    450, 812, 1200, 1440,
    480, 868, 1290, 1530,
    510, 924, 1350, 1620,
    540, 980, 1440, 1710,
    570, 1036, 1530, 1800,
    570, 1064, 1590, 1890,
    600, 1120, 1680, 1980,
    630, 1204, 1770, 2100,
    660, 1260, 1860, 2220,
    720, 1316, 1950, 2310,
    750, 1372, 2040, 2430
  ];

  /**
   * Returns the number of error correction block that the QR Code should contain
   * for the specified version and error correction level.
   *
   * @param  {Number} version              QR Code version
   * @param  {Number} errorCorrectionLevel Error correction level
   * @return {Number}                      Number of error correction blocks
   */
  var getBlocksCount = function getBlocksCount (version, errorCorrectionLevel$$1) {
    switch (errorCorrectionLevel$$1) {
      case errorCorrectionLevel.L:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 0]
      case errorCorrectionLevel.M:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 1]
      case errorCorrectionLevel.Q:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 2]
      case errorCorrectionLevel.H:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 3]
      default:
        return undefined
    }
  };

  /**
   * Returns the number of error correction codewords to use for the specified
   * version and error correction level.
   *
   * @param  {Number} version              QR Code version
   * @param  {Number} errorCorrectionLevel Error correction level
   * @return {Number}                      Number of error correction codewords
   */
  var getTotalCodewordsCount = function getTotalCodewordsCount (version, errorCorrectionLevel$$1) {
    switch (errorCorrectionLevel$$1) {
      case errorCorrectionLevel.L:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0]
      case errorCorrectionLevel.M:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1]
      case errorCorrectionLevel.Q:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2]
      case errorCorrectionLevel.H:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3]
      default:
        return undefined
    }
  };

  var errorCorrectionCode = {
  	getBlocksCount: getBlocksCount,
  	getTotalCodewordsCount: getTotalCodewordsCount
  };

  // node_modules/qrcode/lib/core/galois-field.js


  var EXP_TABLE = new buffer$1(512);
  var LOG_TABLE = new buffer$1(256)

  /**
   * Precompute the log and anti-log tables for faster computation later
   *
   * For each possible value in the galois field 2^8, we will pre-compute
   * the logarithm and anti-logarithm (exponential) of this value
   *
   * ref {@link https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Introduction_to_mathematical_fields}
   */
  ;(function initTables () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP_TABLE[i] = x;
      LOG_TABLE[x] = i;

      x <<= 1; // multiply by 2

      // The QR code specification says to use byte-wise modulo 100011101 arithmetic.
      // This means that when a number is 256 or larger, it should be XORed with 0x11D.
      if (x & 0x100) { // similar to x >= 256, but a lot faster (because 0x100 == 256)
        x ^= 0x11D;
      }
    }

    // Optimization: double the size of the anti-log table so that we don't need to mod 255 to
    // stay inside the bounds (because we will mainly use this table for the multiplication of
    // two GF numbers, no more).
    // @see {@link mul}
    for (i = 255; i < 512; i++) {
      EXP_TABLE[i] = EXP_TABLE[i - 255];
    }
  }());

  /**
   * Returns log value of n inside Galois Field
   *
   * @param  {Number} n
   * @return {Number}
   */
  var log = function log (n) {
    if (n < 1) throw new Error('log(' + n + ')')
    return LOG_TABLE[n]
  };

  /**
   * Returns anti-log value of n inside Galois Field
   *
   * @param  {Number} n
   * @return {Number}
   */
  var exp = function exp (n) {
    return EXP_TABLE[n]
  };

  /**
   * Multiplies two number inside Galois Field
   *
   * @param  {Number} x
   * @param  {Number} y
   * @return {Number}
   */
  var mul = function mul (x, y) {
    if (x === 0 || y === 0) return 0

    // should be EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255] if EXP_TABLE wasn't oversized
    // @see {@link initTables}
    return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]]
  };

  var galoisField = {
  	log: log,
  	exp: exp,
  	mul: mul
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/galois-field.js

  var polynomial = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/polynomial.js



  /**
   * Multiplies two polynomials inside Galois Field
   *
   * @param  {Buffer} p1 Polynomial
   * @param  {Buffer} p2 Polynomial
   * @return {Buffer}    Product of p1 and p2
   */
  exports.mul = function mul (p1, p2) {
    var coeff = new buffer$1(p1.length + p2.length - 1);
    coeff.fill(0);

    for (var i = 0; i < p1.length; i++) {
      for (var j = 0; j < p2.length; j++) {
        coeff[i + j] ^= galoisField.mul(p1[i], p2[j]);
      }
    }

    return coeff
  };

  /**
   * Calculate the remainder of polynomials division
   *
   * @param  {Buffer} divident Polynomial
   * @param  {Buffer} divisor  Polynomial
   * @return {Buffer}          Remainder
   */
  exports.mod = function mod (divident, divisor) {
    var result = new buffer$1(divident);

    while ((result.length - divisor.length) >= 0) {
      var coeff = result[0];

      for (var i = 0; i < divisor.length; i++) {
        result[i] ^= galoisField.mul(divisor[i], coeff);
      }

      // remove all zeros from buffer head
      var offset = 0;
      while (offset < result.length && result[offset] === 0) offset++;
      result = result.slice(offset);
    }

    return result
  };

  /**
   * Generate an irreducible generator polynomial of specified degree
   * (used by Reed-Solomon encoder)
   *
   * @param  {Number} degree Degree of the generator polynomial
   * @return {Buffer}        Buffer containing polynomial coefficients
   */
  exports.generateECPolynomial = function generateECPolynomial (degree) {
    var poly = new buffer$1([1]);
    for (var i = 0; i < degree; i++) {
      poly = exports.mul(poly, [1, galoisField.exp(i)]);
    }

    return poly
  };
  });
  var polynomial_1 = polynomial.mul;
  var polynomial_2 = polynomial.mod;
  var polynomial_3 = polynomial.generateECPolynomial;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/polynomial.js

  // node_modules/qrcode/lib/core/reed-solomon-encoder.js



  function ReedSolomonEncoder (degree) {
    this.genPoly = undefined;
    this.degree = degree;

    if (this.degree) this.initialize(this.degree);
  }

  /**
   * Initialize the encoder.
   * The input param should correspond to the number of error correction codewords.
   *
   * @param  {Number} degree
   */
  ReedSolomonEncoder.prototype.initialize = function initialize (degree) {
    // create an irreducible generator polynomial
    this.degree = degree;
    this.genPoly = polynomial.generateECPolynomial(this.degree);
  };

  /**
   * Encodes a chunk of data
   *
   * @param  {Buffer} data Buffer containing input data
   * @return {Buffer}      Buffer containing encoded data
   */
  ReedSolomonEncoder.prototype.encode = function encode (data) {
    if (!this.genPoly) {
      throw new Error('Encoder not initialized')
    }

    // Calculate EC for this data block
    // extends data size to data+genPoly size
    var pad = new buffer$1(this.degree);
    pad.fill(0);
    var paddedData = buffer$1.concat([data, pad], data.length + this.degree);

    // The error correction codewords are the remainder after dividing the data codewords
    // by a generator polynomial
    var remainder = polynomial.mod(paddedData, this.genPoly);

    // return EC data blocks (last n byte, where n is the degree of genPoly)
    // If coefficients number in remainder are less than genPoly degree,
    // pad with 0s to the left to reach the needed number of coefficients
    var start = this.degree - remainder.length;
    if (start > 0) {
      var buff = new buffer$1(this.degree);
      buff.fill(0);
      remainder.copy(buff, start);

      return buff
    }

    return remainder
  };

  var reedSolomonEncoder = ReedSolomonEncoder;

  // node_modules/qrcode/lib/core/regex.js
  var numeric = '[0-9]+';
  var alphanumeric = '[A-Z $%*+\\-./:]+';
  var kanji = '(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|' +
    '[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|' +
    '[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|' +
    '[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+';
  kanji = kanji.replace(/u/g, '\\u');

  var byte = '(?:(?![A-Z0-9 $%*+\\-./:]|' + kanji + ').)+';

  var KANJI = new RegExp(kanji, 'g');
  var BYTE_KANJI = new RegExp('[^A-Z0-9 $%*+\\-./:]+', 'g');
  var BYTE = new RegExp(byte, 'g');
  var NUMERIC = new RegExp(numeric, 'g');
  var ALPHANUMERIC = new RegExp(alphanumeric, 'g');

  var TEST_KANJI = new RegExp('^' + kanji + '$');
  var TEST_NUMERIC = new RegExp('^' + numeric + '$');
  var TEST_ALPHANUMERIC = new RegExp('^[A-Z0-9 $%*+\\-./:]+$');

  var testKanji = function testKanji (str) {
    return TEST_KANJI.test(str)
  };

  var testNumeric = function testNumeric (str) {
    return TEST_NUMERIC.test(str)
  };

  var testAlphanumeric = function testAlphanumeric (str) {
    return TEST_ALPHANUMERIC.test(str)
  };

  var regex = {
  	KANJI: KANJI,
  	BYTE_KANJI: BYTE_KANJI,
  	BYTE: BYTE,
  	NUMERIC: NUMERIC,
  	ALPHANUMERIC: ALPHANUMERIC,
  	testKanji: testKanji,
  	testNumeric: testNumeric,
  	testAlphanumeric: testAlphanumeric
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/version.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/regex.js

  var mode = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/mode.js



  /**
   * Numeric mode encodes data from the decimal digit set (0 - 9)
   * (byte values 30HEX to 39HEX).
   * Normally, 3 data characters are represented by 10 bits.
   *
   * @type {Object}
   */
  exports.NUMERIC = {
    id: 'Numeric',
    bit: 1 << 0,
    ccBits: [10, 12, 14]
  };

  /**
   * Alphanumeric mode encodes data from a set of 45 characters,
   * i.e. 10 numeric digits (0 - 9),
   *      26 alphabetic characters (A - Z),
   *   and 9 symbols (SP, $, %, *, +, -, ., /, :).
   * Normally, two input characters are represented by 11 bits.
   *
   * @type {Object}
   */
  exports.ALPHANUMERIC = {
    id: 'Alphanumeric',
    bit: 1 << 1,
    ccBits: [9, 11, 13]
  };

  /**
   * In byte mode, data is encoded at 8 bits per character.
   *
   * @type {Object}
   */
  exports.BYTE = {
    id: 'Byte',
    bit: 1 << 2,
    ccBits: [8, 16, 16]
  };

  /**
   * The Kanji mode efficiently encodes Kanji characters in accordance with
   * the Shift JIS system based on JIS X 0208.
   * The Shift JIS values are shifted from the JIS X 0208 values.
   * JIS X 0208 gives details of the shift coded representation.
   * Each two-byte character value is compacted to a 13-bit binary codeword.
   *
   * @type {Object}
   */
  exports.KANJI = {
    id: 'Kanji',
    bit: 1 << 3,
    ccBits: [8, 10, 12]
  };

  /**
   * Mixed mode will contain a sequences of data in a combination of any of
   * the modes described above
   *
   * @type {Object}
   */
  exports.MIXED = {
    bit: -1
  };

  /**
   * Returns the number of bits needed to store the data length
   * according to QR Code specifications.
   *
   * @param  {Mode}   mode    Data mode
   * @param  {Number} version QR Code version
   * @return {Number}         Number of bits
   */
  exports.getCharCountIndicator = function getCharCountIndicator (mode, version) {
    if (!mode.ccBits) throw new Error('Invalid mode: ' + mode)

    if (!version$2.isValid(version)) {
      throw new Error('Invalid version: ' + version)
    }

    if (version >= 1 && version < 10) return mode.ccBits[0]
    else if (version < 27) return mode.ccBits[1]
    return mode.ccBits[2]
  };

  /**
   * Returns the most efficient mode to store the specified data
   *
   * @param  {String} dataStr Input data string
   * @return {Mode}           Best mode
   */
  exports.getBestModeForData = function getBestModeForData (dataStr) {
    if (regex.testNumeric(dataStr)) return exports.NUMERIC
    else if (regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC
    else if (regex.testKanji(dataStr)) return exports.KANJI
    else return exports.BYTE
  };

  /**
   * Return mode name as string
   *
   * @param {Mode} mode Mode object
   * @returns {String}  Mode name
   */
  exports.toString = function toString (mode) {
    if (mode && mode.id) return mode.id
    throw new Error('Invalid mode')
  };

  /**
   * Check if input param is a valid mode object
   *
   * @param   {Mode}    mode Mode object
   * @returns {Boolean} True if valid mode, false otherwise
   */
  exports.isValid = function isValid (mode) {
    return mode && mode.bit && mode.ccBits
  };

  /**
   * Get mode object from its name
   *
   * @param   {String} string Mode name
   * @returns {Mode}          Mode object
   */
  function fromString (string) {
    if (typeof string !== 'string') {
      throw new Error('Param is not a string')
    }

    var lcStr = string.toLowerCase();

    switch (lcStr) {
      case 'numeric':
        return exports.NUMERIC
      case 'alphanumeric':
        return exports.ALPHANUMERIC
      case 'kanji':
        return exports.KANJI
      case 'byte':
        return exports.BYTE
      default:
        throw new Error('Unknown mode: ' + string)
    }
  }

  /**
   * Returns mode from a value.
   * If value is not a valid mode, returns defaultValue
   *
   * @param  {Mode|String} value        Encoding mode
   * @param  {Mode}        defaultValue Fallback value
   * @return {Mode}                     Encoding mode
   */
  exports.from = function from (value, defaultValue) {
    if (exports.isValid(value)) {
      return value
    }

    try {
      return fromString(value)
    } catch (e) {
      return defaultValue
    }
  };
  });
  var mode_1 = mode.NUMERIC;
  var mode_2 = mode.ALPHANUMERIC;
  var mode_3 = mode.BYTE;
  var mode_4 = mode.KANJI;
  var mode_5 = mode.MIXED;
  var mode_6 = mode.getCharCountIndicator;
  var mode_7 = mode.getBestModeForData;
  var mode_8 = mode.isValid;
  var mode_9 = mode.from;

  // node_modules/isarray/index.js
  var toString$1 = {}.toString;

  var isarray = Array.isArray || function (arr) {
    return toString$1.call(arr) == '[object Array]';
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/error-correction-code.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/mode.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/isarray/index.js

  var version$2 = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/version.js






  // Generator polynomial used to encode version information
  var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
  var G18_BCH = utils.getBCHDigit(G18);

  function getBestVersionForDataLength (mode$$1, length, errorCorrectionLevel$$1) {
    for (var currentVersion = 1; currentVersion <= 40; currentVersion++) {
      if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel$$1, mode$$1)) {
        return currentVersion
      }
    }

    return undefined
  }

  function getReservedBitsCount (mode$$1, version) {
    // Character count indicator + mode indicator bits
    return mode.getCharCountIndicator(mode$$1, version) + 4
  }

  function getTotalBitsFromDataArray (segments, version) {
    var totalBits = 0;

    segments.forEach(function (data) {
      var reservedBits = getReservedBitsCount(data.mode, version);
      totalBits += reservedBits + data.getBitsLength();
    });

    return totalBits
  }

  function getBestVersionForMixedData (segments, errorCorrectionLevel$$1) {
    for (var currentVersion = 1; currentVersion <= 40; currentVersion++) {
      var length = getTotalBitsFromDataArray(segments, currentVersion);
      if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel$$1, mode.MIXED)) {
        return currentVersion
      }
    }

    return undefined
  }

  /**
   * Check if QR Code version is valid
   *
   * @param  {Number}  version QR Code version
   * @return {Boolean}         true if valid version, false otherwise
   */
  exports.isValid = function isValid (version) {
    return !isNaN(version) && version >= 1 && version <= 40
  };

  /**
   * Returns version number from a value.
   * If value is not a valid version, returns defaultValue
   *
   * @param  {Number|String} value        QR Code version
   * @param  {Number}        defaultValue Fallback value
   * @return {Number}                     QR Code version number
   */
  exports.from = function from (value, defaultValue) {
    if (exports.isValid(value)) {
      return parseInt(value, 10)
    }

    return defaultValue
  };

  /**
   * Returns how much data can be stored with the specified QR code version
   * and error correction level
   *
   * @param  {Number} version              QR Code version (1-40)
   * @param  {Number} errorCorrectionLevel Error correction level
   * @param  {Mode}   mode                 Data mode
   * @return {Number}                      Quantity of storable data
   */
  exports.getCapacity = function getCapacity (version, errorCorrectionLevel$$1, mode$$1) {
    if (!exports.isValid(version)) {
      throw new Error('Invalid QR Code version')
    }

    // Use Byte mode as default
    if (typeof mode$$1 === 'undefined') mode$$1 = mode.BYTE;

    // Total codewords for this QR code version (Data + Error correction)
    var totalCodewords = utils.getSymbolTotalCodewords(version);

    // Total number of error correction codewords
    var ecTotalCodewords = errorCorrectionCode.getTotalCodewordsCount(version, errorCorrectionLevel$$1);

    // Total number of data codewords
    var dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

    if (mode$$1 === mode.MIXED) return dataTotalCodewordsBits

    var usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode$$1, version);

    // Return max number of storable codewords
    switch (mode$$1) {
      case mode.NUMERIC:
        return Math.floor((usableBits / 10) * 3)

      case mode.ALPHANUMERIC:
        return Math.floor((usableBits / 11) * 2)

      case mode.KANJI:
        return Math.floor(usableBits / 13)

      case mode.BYTE:
      default:
        return Math.floor(usableBits / 8)
    }
  };

  /**
   * Returns the minimum version needed to contain the amount of data
   *
   * @param  {Segment} data                    Segment of data
   * @param  {Number} [errorCorrectionLevel=H] Error correction level
   * @param  {Mode} mode                       Data mode
   * @return {Number}                          QR Code version
   */
  exports.getBestVersionForData = function getBestVersionForData (data, errorCorrectionLevel$$1) {
    var seg;

    var ecl = errorCorrectionLevel.from(errorCorrectionLevel$$1, errorCorrectionLevel.M);

    if (isarray(data)) {
      if (data.length > 1) {
        return getBestVersionForMixedData(data, ecl)
      }

      if (data.length === 0) {
        return 1
      }

      seg = data[0];
    } else {
      seg = data;
    }

    return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl)
  };

  /**
   * Returns version information with relative error correction bits
   *
   * The version information is included in QR Code symbols of version 7 or larger.
   * It consists of an 18-bit sequence containing 6 data bits,
   * with 12 error correction bits calculated using the (18, 6) Golay code.
   *
   * @param  {Number} version QR Code version
   * @return {Number}         Encoded version info bits
   */
  exports.getEncodedBits = function getEncodedBits (version) {
    if (!exports.isValid(version) || version < 7) {
      throw new Error('Invalid QR Code version')
    }

    var d = version << 12;

    while (utils.getBCHDigit(d) - G18_BCH >= 0) {
      d ^= (G18 << (utils.getBCHDigit(d) - G18_BCH));
    }

    return (version << 12) | d
  };
  });
  var version_1 = version$2.isValid;
  var version_2 = version$2.from;
  var version_3 = version$2.getCapacity;
  var version_4 = version$2.getBestVersionForData;
  var version_5 = version$2.getEncodedBits;

  // node_modules/qrcode/lib/core/format-info.js


  var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
  var G15_BCH = utils.getBCHDigit(G15);

  /**
   * Returns format information with relative error correction bits
   *
   * The format information is a 15-bit sequence containing 5 data bits,
   * with 10 error correction bits calculated using the (15, 5) BCH code.
   *
   * @param  {Number} errorCorrectionLevel Error correction level
   * @param  {Number} mask                 Mask pattern
   * @return {Number}                      Encoded format information bits
   */
  var getEncodedBits = function getEncodedBits (errorCorrectionLevel, mask) {
    var data = ((errorCorrectionLevel.bit << 3) | mask);
    var d = data << 10;

    while (utils.getBCHDigit(d) - G15_BCH >= 0) {
      d ^= (G15 << (utils.getBCHDigit(d) - G15_BCH));
    }

    // xor final data with mask pattern in order to ensure that
    // no combination of Error Correction Level and data mask pattern
    // will result in an all-zero data string
    return ((data << 10) | d) ^ G15_MASK
  };

  var formatInfo = {
  	getEncodedBits: getEncodedBits
  };

  // node_modules/qrcode/lib/core/numeric-data.js


  function NumericData (data) {
    this.mode = mode.NUMERIC;
    this.data = data.toString();
  }

  NumericData.getBitsLength = function getBitsLength (length) {
    return 10 * Math.floor(length / 3) + ((length % 3) ? ((length % 3) * 3 + 1) : 0)
  };

  NumericData.prototype.getLength = function getLength () {
    return this.data.length
  };

  NumericData.prototype.getBitsLength = function getBitsLength () {
    return NumericData.getBitsLength(this.data.length)
  };

  NumericData.prototype.write = function write (bitBuffer) {
    var i, group, value;

    // The input data string is divided into groups of three digits,
    // and each group is converted to its 10-bit binary equivalent.
    for (i = 0; i + 3 <= this.data.length; i += 3) {
      group = this.data.substr(i, 3);
      value = parseInt(group, 10);

      bitBuffer.put(value, 10);
    }

    // If the number of input digits is not an exact multiple of three,
    // the final one or two digits are converted to 4 or 7 bits respectively.
    var remainingNum = this.data.length - i;
    if (remainingNum > 0) {
      group = this.data.substr(i);
      value = parseInt(group, 10);

      bitBuffer.put(value, remainingNum * 3 + 1);
    }
  };

  var numericData = NumericData;

  // node_modules/qrcode/lib/core/alphanumeric-data.js


  /**
   * Array of characters available in alphanumeric mode
   *
   * As per QR Code specification, to each character
   * is assigned a value from 0 to 44 which in this case coincides
   * with the array index
   *
   * @type {Array}
   */
  var ALPHA_NUM_CHARS = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ' ', '$', '%', '*', '+', '-', '.', '/', ':'
  ];

  function AlphanumericData (data) {
    this.mode = mode.ALPHANUMERIC;
    this.data = data;
  }

  AlphanumericData.getBitsLength = function getBitsLength (length) {
    return 11 * Math.floor(length / 2) + 6 * (length % 2)
  };

  AlphanumericData.prototype.getLength = function getLength () {
    return this.data.length
  };

  AlphanumericData.prototype.getBitsLength = function getBitsLength () {
    return AlphanumericData.getBitsLength(this.data.length)
  };

  AlphanumericData.prototype.write = function write (bitBuffer) {
    var i;

    // Input data characters are divided into groups of two characters
    // and encoded as 11-bit binary codes.
    for (i = 0; i + 2 <= this.data.length; i += 2) {
      // The character value of the first character is multiplied by 45
      var value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;

      // The character value of the second digit is added to the product
      value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);

      // The sum is then stored as 11-bit binary number
      bitBuffer.put(value, 11);
    }

    // If the number of input data characters is not a multiple of two,
    // the character value of the final character is encoded as a 6-bit binary number.
    if (this.data.length % 2) {
      bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
    }
  };

  var alphanumericData = AlphanumericData;

  // node_modules/qrcode/lib/core/byte-data.js



  function ByteData (data) {
    this.mode = mode.BYTE;
    this.data = new buffer$1(data);
  }

  ByteData.getBitsLength = function getBitsLength (length) {
    return length * 8
  };

  ByteData.prototype.getLength = function getLength () {
    return this.data.length
  };

  ByteData.prototype.getBitsLength = function getBitsLength () {
    return ByteData.getBitsLength(this.data.length)
  };

  ByteData.prototype.write = function (bitBuffer) {
    for (var i = 0, l = this.data.length; i < l; i++) {
      bitBuffer.put(this.data[i], 8);
    }
  };

  var byteData = ByteData;

  // node_modules/qrcode/lib/core/kanji-data.js



  function KanjiData (data) {
    this.mode = mode.KANJI;
    this.data = data;
  }

  KanjiData.getBitsLength = function getBitsLength (length) {
    return length * 13
  };

  KanjiData.prototype.getLength = function getLength () {
    return this.data.length
  };

  KanjiData.prototype.getBitsLength = function getBitsLength () {
    return KanjiData.getBitsLength(this.data.length)
  };

  KanjiData.prototype.write = function (bitBuffer) {
    var i;

    // In the Shift JIS system, Kanji characters are represented by a two byte combination.
    // These byte values are shifted from the JIS X 0208 values.
    // JIS X 0208 gives details of the shift coded representation.
    for (i = 0; i < this.data.length; i++) {
      var value = utils.toSJIS(this.data[i]);

      // For characters with Shift JIS values from 0x8140 to 0x9FFC:
      if (value >= 0x8140 && value <= 0x9FFC) {
        // Subtract 0x8140 from Shift JIS value
        value -= 0x8140;

      // For characters with Shift JIS values from 0xE040 to 0xEBBF
      } else if (value >= 0xE040 && value <= 0xEBBF) {
        // Subtract 0xC140 from Shift JIS value
        value -= 0xC140;
      } else {
        throw new Error(
          'Invalid SJIS character: ' + this.data[i] + '\n' +
          'Make sure your charset is UTF-8')
      }

      // Multiply most significant byte of result by 0xC0
      // and add least significant byte to product
      value = (((value >>> 8) & 0xff) * 0xC0) + (value & 0xff);

      // Convert result to a 13-bit binary string
      bitBuffer.put(value, 13);
    }
  };

  var kanjiData = KanjiData;

  var dijkstra_1 = createCommonjsModule(function (module) {

  /******************************************************************************
   * Created 2008-08-19.
   *
   * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
   *
   * Copyright (C) 2008
   *   Wyatt Baldwin <self@wyattbaldwin.com>
   *   All rights reserved
   *
   * Licensed under the MIT license.
   *
   *   http://www.opensource.org/licenses/mit-license.php
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   *****************************************************************************/
  var dijkstra = {
    single_source_shortest_paths: function(graph, s, d) {
      // Predecessor map for each node that has been encountered.
      // node ID => predecessor node ID
      var predecessors = {};

      // Costs of shortest paths from s to all nodes encountered.
      // node ID => cost
      var costs = {};
      costs[s] = 0;

      // Costs of shortest paths from s to all nodes encountered; differs from
      // `costs` in that it provides easy access to the node that currently has
      // the known shortest path from s.
      // XXX: Do we actually need both `costs` and `open`?
      var open = dijkstra.PriorityQueue.make();
      open.push(s, 0);

      var closest,
          u, v,
          cost_of_s_to_u,
          adjacent_nodes,
          cost_of_e,
          cost_of_s_to_u_plus_cost_of_e,
          cost_of_s_to_v,
          first_visit;
      while (!open.empty()) {
        // In the nodes remaining in graph that have a known cost from s,
        // find the node, u, that currently has the shortest path from s.
        closest = open.pop();
        u = closest.value;
        cost_of_s_to_u = closest.cost;

        // Get nodes adjacent to u...
        adjacent_nodes = graph[u] || {};

        // ...and explore the edges that connect u to those nodes, updating
        // the cost of the shortest paths to any or all of those nodes as
        // necessary. v is the node across the current edge from u.
        for (v in adjacent_nodes) {
          if (adjacent_nodes.hasOwnProperty(v)) {
            // Get the cost of the edge running from u to v.
            cost_of_e = adjacent_nodes[v];

            // Cost of s to u plus the cost of u to v across e--this is *a*
            // cost from s to v that may or may not be less than the current
            // known cost to v.
            cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;

            // If we haven't visited v yet OR if the current known cost from s to
            // v is greater than the new cost we just found (cost of s to u plus
            // cost of u to v across e), update v's cost in the cost list and
            // update v's predecessor in the predecessor list (it's now u).
            cost_of_s_to_v = costs[v];
            first_visit = (typeof costs[v] === 'undefined');
            if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
              costs[v] = cost_of_s_to_u_plus_cost_of_e;
              open.push(v, cost_of_s_to_u_plus_cost_of_e);
              predecessors[v] = u;
            }
          }
        }
      }

      if (typeof d !== 'undefined' && typeof costs[d] === 'undefined') {
        var msg = ['Could not find a path from ', s, ' to ', d, '.'].join('');
        throw new Error(msg);
      }

      return predecessors;
    },

    extract_shortest_path_from_predecessor_list: function(predecessors, d) {
      var nodes = [];
      var u = d;
      var predecessor;
      while (u) {
        nodes.push(u);
        predecessor = predecessors[u];
        u = predecessors[u];
      }
      nodes.reverse();
      return nodes;
    },

    find_path: function(graph, s, d) {
      var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
      return dijkstra.extract_shortest_path_from_predecessor_list(
        predecessors, d);
    },

    /**
     * A very naive priority queue implementation.
     */
    PriorityQueue: {
      make: function (opts) {
        var T = dijkstra.PriorityQueue,
            t = {},
            key;
        opts = opts || {};
        for (key in T) {
          if (T.hasOwnProperty(key)) {
            t[key] = T[key];
          }
        }
        t.queue = [];
        t.sorter = opts.sorter || T.default_sorter;
        return t;
      },

      default_sorter: function (a, b) {
        return a.cost - b.cost;
      },

      /**
       * Add a new item to the queue and ensure the highest priority element
       * is at the front of the queue.
       */
      push: function (value, cost) {
        var item = {value: value, cost: cost};
        this.queue.push(item);
        this.queue.sort(this.sorter);
      },

      /**
       * Return the highest priority element in the queue.
       */
      pop: function () {
        return this.queue.shift();
      },

      empty: function () {
        return this.queue.length === 0;
      }
    }
  };


  // node.js module exports
  {
    module.exports = dijkstra;
  }
  });

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/numeric-data.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/alphanumeric-data.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/byte-data.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/kanji-data.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/dijkstrajs/dijkstra.js

  var segments = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/core/segments.js









  /**
   * Returns UTF8 byte length
   *
   * @param  {String} str Input string
   * @return {Number}     Number of byte
   */
  function getStringByteLength (str) {
    return unescape(encodeURIComponent(str)).length
  }

  /**
   * Get a list of segments of the specified mode
   * from a string
   *
   * @param  {Mode}   mode Segment mode
   * @param  {String} str  String to process
   * @return {Array}       Array of object with segments data
   */
  function getSegments (regex$$1, mode$$1, str) {
    var segments = [];
    var result;

    while ((result = regex$$1.exec(str)) !== null) {
      segments.push({
        data: result[0],
        index: result.index,
        mode: mode$$1,
        length: result[0].length
      });
    }

    return segments
  }

  /**
   * Extracts a series of segments with the appropriate
   * modes from a string
   *
   * @param  {String} dataStr Input string
   * @return {Array}          Array of object with segments data
   */
  function getSegmentsFromString (dataStr) {
    var numSegs = getSegments(regex.NUMERIC, mode.NUMERIC, dataStr);
    var alphaNumSegs = getSegments(regex.ALPHANUMERIC, mode.ALPHANUMERIC, dataStr);
    var byteSegs;
    var kanjiSegs;

    if (utils.isKanjiModeEnabled()) {
      byteSegs = getSegments(regex.BYTE, mode.BYTE, dataStr);
      kanjiSegs = getSegments(regex.KANJI, mode.KANJI, dataStr);
    } else {
      byteSegs = getSegments(regex.BYTE_KANJI, mode.BYTE, dataStr);
      kanjiSegs = [];
    }

    var segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);

    return segs
      .sort(function (s1, s2) {
        return s1.index - s2.index
      })
      .map(function (obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        }
      })
  }

  /**
   * Returns how many bits are needed to encode a string of
   * specified length with the specified mode
   *
   * @param  {Number} length String length
   * @param  {Mode} mode     Segment mode
   * @return {Number}        Bit length
   */
  function getSegmentBitsLength (length, mode$$1) {
    switch (mode$$1) {
      case mode.NUMERIC:
        return numericData.getBitsLength(length)
      case mode.ALPHANUMERIC:
        return alphanumericData.getBitsLength(length)
      case mode.KANJI:
        return kanjiData.getBitsLength(length)
      case mode.BYTE:
        return byteData.getBitsLength(length)
    }
  }

  /**
   * Merges adjacent segments which have the same mode
   *
   * @param  {Array} segs Array of object with segments data
   * @return {Array}      Array of object with segments data
   */
  function mergeSegments (segs) {
    return segs.reduce(function (acc, curr) {
      var prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
      if (prevSeg && prevSeg.mode === curr.mode) {
        acc[acc.length - 1].data += curr.data;
        return acc
      }

      acc.push(curr);
      return acc
    }, [])
  }

  /**
   * Generates a list of all possible nodes combination which
   * will be used to build a segments graph.
   *
   * Nodes are divided by groups. Each group will contain a list of all the modes
   * in which is possible to encode the given text.
   *
   * For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
   * The group for '12345' will contain then 3 objects, one for each
   * possible encoding mode.
   *
   * Each node represents a possible segment.
   *
   * @param  {Array} segs Array of object with segments data
   * @return {Array}      Array of object with segments data
   */
  function buildNodes (segs) {
    var nodes = [];
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];

      switch (seg.mode) {
        case mode.NUMERIC:
          nodes.push([seg,
            { data: seg.data, mode: mode.ALPHANUMERIC, length: seg.length },
            { data: seg.data, mode: mode.BYTE, length: seg.length }
          ]);
          break
        case mode.ALPHANUMERIC:
          nodes.push([seg,
            { data: seg.data, mode: mode.BYTE, length: seg.length }
          ]);
          break
        case mode.KANJI:
          nodes.push([seg,
            { data: seg.data, mode: mode.BYTE, length: getStringByteLength(seg.data) }
          ]);
          break
        case mode.BYTE:
          nodes.push([
            { data: seg.data, mode: mode.BYTE, length: getStringByteLength(seg.data) }
          ]);
      }
    }

    return nodes
  }

  /**
   * Builds a graph from a list of nodes.
   * All segments in each node group will be connected with all the segments of
   * the next group and so on.
   *
   * At each connection will be assigned a weight depending on the
   * segment's byte length.
   *
   * @param  {Array} nodes    Array of object with segments data
   * @param  {Number} version QR Code version
   * @return {Object}         Graph of all possible segments
   */
  function buildGraph (nodes, version) {
    var table = {};
    var graph = {'start': {}};
    var prevNodeIds = ['start'];

    for (var i = 0; i < nodes.length; i++) {
      var nodeGroup = nodes[i];
      var currentNodeIds = [];

      for (var j = 0; j < nodeGroup.length; j++) {
        var node = nodeGroup[j];
        var key = '' + i + j;

        currentNodeIds.push(key);
        table[key] = { node: node, lastCount: 0 };
        graph[key] = {};

        for (var n = 0; n < prevNodeIds.length; n++) {
          var prevNodeId = prevNodeIds[n];

          if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
            graph[prevNodeId][key] =
              getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) -
              getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);

            table[prevNodeId].lastCount += node.length;
          } else {
            if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;

            graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) +
              4 + mode.getCharCountIndicator(node.mode, version); // switch cost
          }
        }
      }

      prevNodeIds = currentNodeIds;
    }

    for (n = 0; n < prevNodeIds.length; n++) {
      graph[prevNodeIds[n]]['end'] = 0;
    }

    return { map: graph, table: table }
  }

  /**
   * Builds a segment from a specified data and mode.
   * If a mode is not specified, the more suitable will be used.
   *
   * @param  {String} data             Input data
   * @param  {Mode | String} modesHint Data mode
   * @return {Segment}                 Segment
   */
  function buildSingleSegment (data, modesHint) {
    var mode$$1;
    var bestMode = mode.getBestModeForData(data);

    mode$$1 = mode.from(modesHint, bestMode);

    // Make sure data can be encoded
    if (mode$$1 !== mode.BYTE && mode$$1.bit < bestMode.bit) {
      throw new Error('"' + data + '"' +
        ' cannot be encoded with mode ' + mode.toString(mode$$1) +
        '.\n Suggested mode is: ' + mode.toString(bestMode))
    }

    // Use Mode.BYTE if Kanji support is disabled
    if (mode$$1 === mode.KANJI && !utils.isKanjiModeEnabled()) {
      mode$$1 = mode.BYTE;
    }

    switch (mode$$1) {
      case mode.NUMERIC:
        return new numericData(data)

      case mode.ALPHANUMERIC:
        return new alphanumericData(data)

      case mode.KANJI:
        return new kanjiData(data)

      case mode.BYTE:
        return new byteData(data)
    }
  }

  /**
   * Builds a list of segments from an array.
   * Array can contain Strings or Objects with segment's info.
   *
   * For each item which is a string, will be generated a segment with the given
   * string and the more appropriate encoding mode.
   *
   * For each item which is an object, will be generated a segment with the given
   * data and mode.
   * Objects must contain at least the property "data".
   * If property "mode" is not present, the more suitable mode will be used.
   *
   * @param  {Array} array Array of objects with segments data
   * @return {Array}       Array of Segments
   */
  exports.fromArray = function fromArray (array) {
    return array.reduce(function (acc, seg) {
      if (typeof seg === 'string') {
        acc.push(buildSingleSegment(seg, null));
      } else if (seg.data) {
        acc.push(buildSingleSegment(seg.data, seg.mode));
      }

      return acc
    }, [])
  };

  /**
   * Builds an optimized sequence of segments from a string,
   * which will produce the shortest possible bitstream.
   *
   * @param  {String} data    Input string
   * @param  {Number} version QR Code version
   * @return {Array}          Array of segments
   */
  exports.fromString = function fromString (data, version) {
    var segs = getSegmentsFromString(data, utils.isKanjiModeEnabled());

    var nodes = buildNodes(segs);
    var graph = buildGraph(nodes, version);
    var path = dijkstra_1.find_path(graph.map, 'start', 'end');

    var optimizedSegs = [];
    for (var i = 1; i < path.length - 1; i++) {
      optimizedSegs.push(graph.table[path[i]].node);
    }

    return exports.fromArray(mergeSegments(optimizedSegs))
  };

  /**
   * Splits a string in various segments with the modes which
   * best represent their content.
   * The produced segments are far from being optimized.
   * The output of this function is only used to estimate a QR Code version
   * which may contain the data.
   *
   * @param  {string} data Input string
   * @return {Array}       Array of segments
   */
  exports.rawSplit = function rawSplit (data) {
    return exports.fromArray(
      getSegmentsFromString(data, utils.isKanjiModeEnabled())
    )
  };
  });
  var segments_1 = segments.fromArray;
  var segments_2 = segments.fromString;
  var segments_3 = segments.rawSplit;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/bit-buffer.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/bit-matrix.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/alignment-pattern.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/finder-pattern.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/mask-pattern.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/reed-solomon-encoder.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/format-info.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/segments.js

  // node_modules/qrcode/lib/core/qrcode.js
















  /**
   * QRCode for JavaScript
   *
   * modified by Ryan Day for nodejs support
   * Copyright (c) 2011 Ryan Day
   *
   * Licensed under the MIT license:
   *   http://www.opensource.org/licenses/mit-license.php
   *
  //---------------------------------------------------------------------
  // QRCode for JavaScript
  //
  // Copyright (c) 2009 Kazuhiko Arase
  //
  // URL: http://www.d-project.com/
  //
  // Licensed under the MIT license:
  //   http://www.opensource.org/licenses/mit-license.php
  //
  // The word "QR Code" is registered trademark of
  // DENSO WAVE INCORPORATED
  //   http://www.denso-wave.com/qrcode/faqpatent-e.html
  //
  //---------------------------------------------------------------------
  */

  /**
   * Add finder patterns bits to matrix
   *
   * @param  {BitMatrix} matrix  Modules matrix
   * @param  {Number}    version QR Code version
   */
  function setupFinderPattern (matrix, version) {
    var size = matrix.size;
    var pos = finderPattern.getPositions(version);

    for (var i = 0; i < pos.length; i++) {
      var row = pos[i][0];
      var col = pos[i][1];

      for (var r = -1; r <= 7; r++) {
        if (row + r <= -1 || size <= row + r) continue

        for (var c = -1; c <= 7; c++) {
          if (col + c <= -1 || size <= col + c) continue

          if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix.set(row + r, col + c, true, true);
          } else {
            matrix.set(row + r, col + c, false, true);
          }
        }
      }
    }
  }

  /**
   * Add timing pattern bits to matrix
   *
   * Note: this function must be called before {@link setupAlignmentPattern}
   *
   * @param  {BitMatrix} matrix Modules matrix
   */
  function setupTimingPattern (matrix) {
    var size = matrix.size;

    for (var r = 8; r < size - 8; r++) {
      var value = r % 2 === 0;
      matrix.set(r, 6, value, true);
      matrix.set(6, r, value, true);
    }
  }

  /**
   * Add alignment patterns bits to matrix
   *
   * Note: this function must be called after {@link setupTimingPattern}
   *
   * @param  {BitMatrix} matrix  Modules matrix
   * @param  {Number}    version QR Code version
   */
  function setupAlignmentPattern (matrix, version) {
    var pos = alignmentPattern.getPositions(version);

    for (var i = 0; i < pos.length; i++) {
      var row = pos[i][0];
      var col = pos[i][1];

      for (var r = -2; r <= 2; r++) {
        for (var c = -2; c <= 2; c++) {
          if (r === -2 || r === 2 || c === -2 || c === 2 ||
            (r === 0 && c === 0)) {
            matrix.set(row + r, col + c, true, true);
          } else {
            matrix.set(row + r, col + c, false, true);
          }
        }
      }
    }
  }

  /**
   * Add version info bits to matrix
   *
   * @param  {BitMatrix} matrix  Modules matrix
   * @param  {Number}    version QR Code version
   */
  function setupVersionInfo (matrix, version) {
    var size = matrix.size;
    var bits = version$2.getEncodedBits(version);
    var row, col, mod;

    for (var i = 0; i < 18; i++) {
      row = Math.floor(i / 3);
      col = i % 3 + size - 8 - 3;
      mod = ((bits >> i) & 1) === 1;

      matrix.set(row, col, mod, true);
      matrix.set(col, row, mod, true);
    }
  }

  /**
   * Add format info bits to matrix
   *
   * @param  {BitMatrix} matrix               Modules matrix
   * @param  {ErrorCorrectionLevel}    errorCorrectionLevel Error correction level
   * @param  {Number}    maskPattern          Mask pattern reference value
   */
  function setupFormatInfo (matrix, errorCorrectionLevel$$1, maskPattern$$1) {
    var size = matrix.size;
    var bits = formatInfo.getEncodedBits(errorCorrectionLevel$$1, maskPattern$$1);
    var i, mod;

    for (i = 0; i < 15; i++) {
      mod = ((bits >> i) & 1) === 1;

      // vertical
      if (i < 6) {
        matrix.set(i, 8, mod, true);
      } else if (i < 8) {
        matrix.set(i + 1, 8, mod, true);
      } else {
        matrix.set(size - 15 + i, 8, mod, true);
      }

      // horizontal
      if (i < 8) {
        matrix.set(8, size - i - 1, mod, true);
      } else if (i < 9) {
        matrix.set(8, 15 - i - 1 + 1, mod, true);
      } else {
        matrix.set(8, 15 - i - 1, mod, true);
      }
    }

    // fixed module
    matrix.set(size - 8, 8, 1, true);
  }

  /**
   * Add encoded data bits to matrix
   *
   * @param  {BitMatrix} matrix Modules matrix
   * @param  {Buffer}    data   Data codewords
   */
  function setupData (matrix, data) {
    var size = matrix.size;
    var inc = -1;
    var row = size - 1;
    var bitIndex = 7;
    var byteIndex = 0;

    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;

      while (true) {
        for (var c = 0; c < 2; c++) {
          if (!matrix.isReserved(row, col - c)) {
            var dark = false;

            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
            }

            matrix.set(row, col - c, dark);
            bitIndex--;

            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || size <= row) {
          row -= inc;
          inc = -inc;
          break
        }
      }
    }
  }

  /**
   * Create encoded codewords from data input
   *
   * @param  {Number}   version              QR Code version
   * @param  {ErrorCorrectionLevel}   errorCorrectionLevel Error correction level
   * @param  {ByteData} data                 Data input
   * @return {Buffer}                        Buffer containing encoded codewords
   */
  function createData (version, errorCorrectionLevel$$1, segments$$1) {
    // Prepare data buffer
    var buffer$$1 = new bitBuffer();

    segments$$1.forEach(function (data) {
      // prefix data with mode indicator (4 bits)
      buffer$$1.put(data.mode.bit, 4);

      // Prefix data with character count indicator.
      // The character count indicator is a string of bits that represents the
      // number of characters that are being encoded.
      // The character count indicator must be placed after the mode indicator
      // and must be a certain number of bits long, depending on the QR version
      // and data mode
      // @see {@link Mode.getCharCountIndicator}.
      buffer$$1.put(data.getLength(), mode.getCharCountIndicator(data.mode, version));

      // add binary data sequence to buffer
      data.write(buffer$$1);
    });

    // Calculate required number of bits
    var totalCodewords = utils.getSymbolTotalCodewords(version);
    var ecTotalCodewords = errorCorrectionCode.getTotalCodewordsCount(version, errorCorrectionLevel$$1);
    var dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

    // Add a terminator.
    // If the bit string is shorter than the total number of required bits,
    // a terminator of up to four 0s must be added to the right side of the string.
    // If the bit string is more than four bits shorter than the required number of bits,
    // add four 0s to the end.
    if (buffer$$1.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
      buffer$$1.put(0, 4);
    }

    // If the bit string is fewer than four bits shorter, add only the number of 0s that
    // are needed to reach the required number of bits.

    // After adding the terminator, if the number of bits in the string is not a multiple of 8,
    // pad the string on the right with 0s to make the string's length a multiple of 8.
    while (buffer$$1.getLengthInBits() % 8 !== 0) {
      buffer$$1.putBit(0);
    }

    // Add pad bytes if the string is still shorter than the total number of required bits.
    // Extend the buffer to fill the data capacity of the symbol corresponding to
    // the Version and Error Correction Level by adding the Pad Codewords 11101100 (0xEC)
    // and 00010001 (0x11) alternately.
    var remainingByte = (dataTotalCodewordsBits - buffer$$1.getLengthInBits()) / 8;
    for (var i = 0; i < remainingByte; i++) {
      buffer$$1.put(i % 2 ? 0x11 : 0xEC, 8);
    }

    return createCodewords(buffer$$1, version, errorCorrectionLevel$$1)
  }

  /**
   * Encode input data with Reed-Solomon and return codewords with
   * relative error correction bits
   *
   * @param  {BitBuffer} bitBuffer            Data to encode
   * @param  {Number}    version              QR Code version
   * @param  {ErrorCorrectionLevel} errorCorrectionLevel Error correction level
   * @return {Buffer}                         Buffer containing encoded codewords
   */
  function createCodewords (bitBuffer$$1, version, errorCorrectionLevel$$1) {
    // Total codewords for this QR code version (Data + Error correction)
    var totalCodewords = utils.getSymbolTotalCodewords(version);

    // Total number of error correction codewords
    var ecTotalCodewords = errorCorrectionCode.getTotalCodewordsCount(version, errorCorrectionLevel$$1);

    // Total number of data codewords
    var dataTotalCodewords = totalCodewords - ecTotalCodewords;

    // Total number of blocks
    var ecTotalBlocks = errorCorrectionCode.getBlocksCount(version, errorCorrectionLevel$$1);

    // Calculate how many blocks each group should contain
    var blocksInGroup2 = totalCodewords % ecTotalBlocks;
    var blocksInGroup1 = ecTotalBlocks - blocksInGroup2;

    var totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);

    var dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
    var dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;

    // Number of EC codewords is the same for both groups
    var ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;

    // Initialize a Reed-Solomon encoder with a generator polynomial of degree ecCount
    var rs = new reedSolomonEncoder(ecCount);

    var offset = 0;
    var dcData = new Array(ecTotalBlocks);
    var ecData = new Array(ecTotalBlocks);
    var maxDataSize = 0;
    var buffer$$1 = new buffer$1(bitBuffer$$1.buffer);

    // Divide the buffer into the required number of blocks
    for (var b = 0; b < ecTotalBlocks; b++) {
      var dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;

      // extract a block of data from buffer
      dcData[b] = buffer$$1.slice(offset, offset + dataSize);

      // Calculate EC codewords for this data block
      ecData[b] = rs.encode(dcData[b]);

      offset += dataSize;
      maxDataSize = Math.max(maxDataSize, dataSize);
    }

    // Create final data
    // Interleave the data and error correction codewords from each block
    var data = new buffer$1(totalCodewords);
    var index = 0;
    var i, r;

    // Add data codewords
    for (i = 0; i < maxDataSize; i++) {
      for (r = 0; r < ecTotalBlocks; r++) {
        if (i < dcData[r].length) {
          data[index++] = dcData[r][i];
        }
      }
    }

    // Apped EC codewords
    for (i = 0; i < ecCount; i++) {
      for (r = 0; r < ecTotalBlocks; r++) {
        data[index++] = ecData[r][i];
      }
    }

    return data
  }

  /**
   * Build QR Code symbol
   *
   * @param  {String} data                 Input string
   * @param  {Number} version              QR Code version
   * @param  {ErrorCorretionLevel} errorCorrectionLevel Error level
   * @param  {MaskPattern} maskPattern     Mask pattern
   * @return {Object}                      Object containing symbol data
   */
  function createSymbol (data, version, errorCorrectionLevel$$1, maskPattern$$1) {
    var segments$$1;

    if (isarray(data)) {
      segments$$1 = segments.fromArray(data);
    } else if (typeof data === 'string') {
      var estimatedVersion = version;

      if (!estimatedVersion) {
        var rawSegments = segments.rawSplit(data);

        // Estimate best version that can contain raw splitted segments
        estimatedVersion = version$2.getBestVersionForData(rawSegments,
          errorCorrectionLevel$$1);
      }

      // Build optimized segments
      // If estimated version is undefined, try with the highest version
      segments$$1 = segments.fromString(data, estimatedVersion || 40);
    } else {
      throw new Error('Invalid data')
    }

    // Get the min version that can contain data
    var bestVersion = version$2.getBestVersionForData(segments$$1,
        errorCorrectionLevel$$1);

    // If no version is found, data cannot be stored
    if (!bestVersion) {
      throw new Error('The amount of data is too big to be stored in a QR Code')
    }

    // If not specified, use min version as default
    if (!version) {
      version = bestVersion;

    // Check if the specified version can contain the data
    } else if (version < bestVersion) {
      throw new Error('\n' +
        'The chosen QR Code version cannot contain this amount of data.\n' +
        'Minimum version required to store current data is: ' + bestVersion + '.\n'
      )
    }

    var dataBits = createData(version, errorCorrectionLevel$$1, segments$$1);

    // Allocate matrix buffer
    var moduleCount = utils.getSymbolSize(version);
    var modules = new bitMatrix(moduleCount);

    // Add function modules
    setupFinderPattern(modules, version);
    setupTimingPattern(modules);
    setupAlignmentPattern(modules, version);

    // Add temporary dummy bits for format info just to set them as reserved.
    // This is needed to prevent these bits from being masked by {@link MaskPattern.applyMask}
    // since the masking operation must be performed only on the encoding region.
    // These blocks will be replaced with correct values later in code.
    setupFormatInfo(modules, errorCorrectionLevel$$1, 0);

    if (version >= 7) {
      setupVersionInfo(modules, version);
    }

    // Add data codewords
    setupData(modules, dataBits);

    if (!maskPattern$$1) {
      // Find best mask pattern
      maskPattern$$1 = maskPattern.getBestMask(modules,
        setupFormatInfo.bind(null, modules, errorCorrectionLevel$$1));
    }

    // Apply mask pattern
    maskPattern.applyMask(maskPattern$$1, modules);

    // Replace format info bits with correct values
    setupFormatInfo(modules, errorCorrectionLevel$$1, maskPattern$$1);

    return {
      modules: modules,
      version: version,
      errorCorrectionLevel: errorCorrectionLevel$$1,
      maskPattern: maskPattern$$1,
      segments: segments$$1
    }
  }

  /**
   * QR Code
   *
   * @param {String | Array} data                 Input data
   * @param {Object} options                      Optional configurations
   * @param {Number} options.version              QR Code version
   * @param {String} options.errorCorrectionLevel Error correction level
   * @param {Function} options.toSJISFunc         Helper func to convert utf8 to sjis
   */
  var create$1 = function create (data, options) {
    if (typeof data === 'undefined' || data === '') {
      throw new Error('No input text')
    }

    var errorCorrectionLevel$$1 = errorCorrectionLevel.M;
    var version;
    var mask;

    if (typeof options !== 'undefined') {
      // Use higher error correction level as default
      errorCorrectionLevel$$1 = errorCorrectionLevel.from(options.errorCorrectionLevel, errorCorrectionLevel.M);
      version = version$2.from(options.version);
      mask = maskPattern.from(options.maskPattern);

      if (options.toSJISFunc) {
        utils.setToSJISFunction(options.toSJISFunc);
      }
    }

    return createSymbol(data, version, errorCorrectionLevel$$1, mask)
  };

  var qrcode = {
  	create: create$1
  };

  //  commonjs-external:util

  //  commonjs-external:stream

  var chunkstream = createCommonjsModule(function (module) {






  var ChunkStream = module.exports = function() {
    Stream.call(this);

    this._buffers = [];
    this._buffered = 0;

    this._reads = [];
    this._paused = false;

    this._encoding = 'utf8';
    this.writable = true;
  };
  util.inherits(ChunkStream, Stream);


  ChunkStream.prototype.read = function(length, callback) {

    this._reads.push({
      length: Math.abs(length),  // if length < 0 then at most this length
      allowLess: length < 0,
      func: callback
    });

    process.nextTick(function() {
      this._process();

      // its paused and there is not enought data then ask for more
      if (this._paused && this._reads.length > 0) {
        this._paused = false;

        this.emit('drain');
      }
    }.bind(this));
  };

  ChunkStream.prototype.write = function(data, encoding) {

    if (!this.writable) {
      this.emit('error', new Error('Stream not writable'));
      return false;
    }

    var dataBuffer;
    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
    }
    else {
      dataBuffer = new Buffer(data, encoding || this._encoding);
    }

    this._buffers.push(dataBuffer);
    this._buffered += dataBuffer.length;

    this._process();

    // ok if there are no more read requests
    if (this._reads && this._reads.length === 0) {
      this._paused = true;
    }

    return this.writable && !this._paused;
  };

  ChunkStream.prototype.end = function(data, encoding) {

    if (data) {
      this.write(data, encoding);
    }

    this.writable = false;

    // already destroyed
    if (!this._buffers) {
      return;
    }

    // enqueue or handle end
    if (this._buffers.length === 0) {
      this._end();
    }
    else {
      this._buffers.push(null);
      this._process();
    }
  };

  ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;

  ChunkStream.prototype._end = function() {

    if (this._reads.length > 0) {
      this.emit('error',
        new Error('There are some read requests waiting on finished stream')
      );
    }

    this.destroy();
  };

  ChunkStream.prototype.destroy = function() {

    if (!this._buffers) {
      return;
    }

    this.writable = false;
    this._reads = null;
    this._buffers = null;

    this.emit('close');
  };

  ChunkStream.prototype._processReadAllowingLess = function(read) {
    // ok there is any data so that we can satisfy this request
    this._reads.shift(); // == read

    // first we need to peek into first buffer
    var smallerBuf = this._buffers[0];

    // ok there is more data than we need
    if (smallerBuf.length > read.length) {

      this._buffered -= read.length;
      this._buffers[0] = smallerBuf.slice(read.length);

      read.func.call(this, smallerBuf.slice(0, read.length));

    }
    else {
      // ok this is less than maximum length so use it all
      this._buffered -= smallerBuf.length;
      this._buffers.shift(); // == smallerBuf

      read.func.call(this, smallerBuf);
    }
  };

  ChunkStream.prototype._processRead = function(read) {
    this._reads.shift(); // == read

    var pos = 0;
    var count = 0;
    var data = new Buffer(read.length);

    // create buffer for all data
    while (pos < read.length) {

      var buf = this._buffers[count++];
      var len = Math.min(buf.length, read.length - pos);

      buf.copy(data, pos, 0, len);
      pos += len;

      // last buffer wasn't used all so just slice it and leave
      if (len !== buf.length) {
        this._buffers[--count] = buf.slice(len);
      }
    }

    // remove all used buffers
    if (count > 0) {
      this._buffers.splice(0, count);
    }

    this._buffered -= read.length;

    read.func.call(this, data);
  };

  ChunkStream.prototype._process = function() {

    try {
      // as long as there is any data and read requests
      while (this._buffered > 0 && this._reads && this._reads.length > 0) {

        var read = this._reads[0];

        // read any data (but no more than length)
        if (read.allowLess) {
          this._processReadAllowingLess(read);

        }
        else if (this._buffered >= read.length) {
          // ok we can meet some expectations

          this._processRead(read);
        }
        else {
          // not enought data to satisfy first request in queue
          // so we need to wait for more
          break;
        }
      }

      if (this._buffers && this._buffers.length > 0 && this._buffers[0] === null) {
        this._end();
      }
    }
    catch (ex) {
      this.emit('error', ex);
    }
  };
  });

  // node_modules/pngjs/lib/interlace.js

  // Adam 7
  //   0 1 2 3 4 5 6 7
  // 0 x 6 4 6 x 6 4 6
  // 1 7 7 7 7 7 7 7 7
  // 2 5 6 5 6 5 6 5 6
  // 3 7 7 7 7 7 7 7 7
  // 4 3 6 4 6 3 6 4 6
  // 5 7 7 7 7 7 7 7 7
  // 6 5 6 5 6 5 6 5 6
  // 7 7 7 7 7 7 7 7 7


  var imagePasses = [
    { // pass 1 - 1px
      x: [0],
      y: [0]
    },
    { // pass 2 - 1px
      x: [4],
      y: [0]
    },
    { // pass 3 - 2px
      x: [0, 4],
      y: [4]
    },
    { // pass 4 - 4px
      x: [2, 6],
      y: [0, 4]
    },
    { // pass 5 - 8px
      x: [0, 2, 4, 6],
      y: [2, 6]
    },
    { // pass 6 - 16px
      x: [1, 3, 5, 7],
      y: [0, 2, 4, 6]
    },
    { // pass 7 - 32px
      x: [0, 1, 2, 3, 4, 5, 6, 7],
      y: [1, 3, 5, 7]
    }
  ];

  var getImagePasses = function(width, height) {
    var images = [];
    var xLeftOver = width % 8;
    var yLeftOver = height % 8;
    var xRepeats = (width - xLeftOver) / 8;
    var yRepeats = (height - yLeftOver) / 8;
    for (var i = 0; i < imagePasses.length; i++) {
      var pass = imagePasses[i];
      var passWidth = xRepeats * pass.x.length;
      var passHeight = yRepeats * pass.y.length;
      for (var j = 0; j < pass.x.length; j++) {
        if (pass.x[j] < xLeftOver) {
          passWidth++;
        }
        else {
          break;
        }
      }
      for (j = 0; j < pass.y.length; j++) {
        if (pass.y[j] < yLeftOver) {
          passHeight++;
        }
        else {
          break;
        }
      }
      if (passWidth > 0 && passHeight > 0) {
        images.push({ width: passWidth, height: passHeight, index: i });
      }
    }
    return images;
  };

  var getInterlaceIterator = function(width) {
    return function(x, y, pass) {
      var outerXLeftOver = x % imagePasses[pass].x.length;
      var outerX = (((x - outerXLeftOver) / imagePasses[pass].x.length) * 8) + imagePasses[pass].x[outerXLeftOver];
      var outerYLeftOver = y % imagePasses[pass].y.length;
      var outerY = (((y - outerYLeftOver) / imagePasses[pass].y.length) * 8) + imagePasses[pass].y[outerYLeftOver];
      return (outerX * 4) + (outerY * width * 4);
    };
  };

  var interlace = {
  	getImagePasses: getImagePasses,
  	getInterlaceIterator: getInterlaceIterator
  };

  // node_modules/pngjs/lib/paeth-predictor.js

  var paethPredictor = function paethPredictor(left, above, upLeft) {

    var paeth = left + above - upLeft;
    var pLeft = Math.abs(paeth - left);
    var pAbove = Math.abs(paeth - above);
    var pUpLeft = Math.abs(paeth - upLeft);

    if (pLeft <= pAbove && pLeft <= pUpLeft) {
      return left;
    }
    if (pAbove <= pUpLeft) {
      return above;
    }
    return upLeft;
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/interlace.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/paeth-predictor.js

  var filterParse = createCommonjsModule(function (module) {




  function getByteWidth(width, bpp, depth) {
    var byteWidth = width * bpp;
    if (depth !== 8) {
      byteWidth = Math.ceil(byteWidth / (8 / depth));
    }
    return byteWidth;
  }

  var Filter = module.exports = function(bitmapInfo, dependencies) {

    var width = bitmapInfo.width;
    var height = bitmapInfo.height;
    var interlace$$1 = bitmapInfo.interlace;
    var bpp = bitmapInfo.bpp;
    var depth = bitmapInfo.depth;

    this.read = dependencies.read;
    this.write = dependencies.write;
    this.complete = dependencies.complete;

    this._imageIndex = 0;
    this._images = [];
    if (interlace$$1) {
      var passes = interlace.getImagePasses(width, height);
      for (var i = 0; i < passes.length; i++) {
        this._images.push({
          byteWidth: getByteWidth(passes[i].width, bpp, depth),
          height: passes[i].height,
          lineIndex: 0
        });
      }
    }
    else {
      this._images.push({
        byteWidth: getByteWidth(width, bpp, depth),
        height: height,
        lineIndex: 0
      });
    }

    // when filtering the line we look at the pixel to the left
    // the spec also says it is done on a byte level regardless of the number of pixels
    // so if the depth is byte compatible (8 or 16) we subtract the bpp in order to compare back
    // a pixel rather than just a different byte part. However if we are sub byte, we ignore.
    if (depth === 8) {
      this._xComparison = bpp;
    }
    else if (depth === 16) {
      this._xComparison = bpp * 2;
    }
    else {
      this._xComparison = 1;
    }
  };

  Filter.prototype.start = function() {
    this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
  };

  Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {

    var xComparison = this._xComparison;
    var xBiggerThan = xComparison - 1;

    for (var x = 0; x < byteWidth; x++) {
      var rawByte = rawData[1 + x];
      var f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
      unfilteredLine[x] = rawByte + f1Left;
    }
  };

  Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {

    var lastLine = this._lastLine;

    for (var x = 0; x < byteWidth; x++) {
      var rawByte = rawData[1 + x];
      var f2Up = lastLine ? lastLine[x] : 0;
      unfilteredLine[x] = rawByte + f2Up;
    }
  };

  Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {

    var xComparison = this._xComparison;
    var xBiggerThan = xComparison - 1;
    var lastLine = this._lastLine;

    for (var x = 0; x < byteWidth; x++) {
      var rawByte = rawData[1 + x];
      var f3Up = lastLine ? lastLine[x] : 0;
      var f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
      var f3Add = Math.floor((f3Left + f3Up) / 2);
      unfilteredLine[x] = rawByte + f3Add;
    }
  };

  Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {

    var xComparison = this._xComparison;
    var xBiggerThan = xComparison - 1;
    var lastLine = this._lastLine;

    for (var x = 0; x < byteWidth; x++) {
      var rawByte = rawData[1 + x];
      var f4Up = lastLine ? lastLine[x] : 0;
      var f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
      var f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
      var f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
      unfilteredLine[x] = rawByte + f4Add;
    }
  };

  Filter.prototype._reverseFilterLine = function(rawData) {

    var filter = rawData[0];
    var unfilteredLine;
    var currentImage = this._images[this._imageIndex];
    var byteWidth = currentImage.byteWidth;

    if (filter === 0) {
      unfilteredLine = rawData.slice(1, byteWidth + 1);
    }
    else {

      unfilteredLine = new Buffer(byteWidth);

      switch (filter) {
        case 1:
          this._unFilterType1(rawData, unfilteredLine, byteWidth);
          break;
        case 2:
          this._unFilterType2(rawData, unfilteredLine, byteWidth);
          break;
        case 3:
          this._unFilterType3(rawData, unfilteredLine, byteWidth);
          break;
        case 4:
          this._unFilterType4(rawData, unfilteredLine, byteWidth);
          break;
        default:
          throw new Error('Unrecognised filter type - ' + filter);
      }
    }

    this.write(unfilteredLine);

    currentImage.lineIndex++;
    if (currentImage.lineIndex >= currentImage.height) {
      this._lastLine = null;
      this._imageIndex++;
      currentImage = this._images[this._imageIndex];
    }
    else {
      this._lastLine = unfilteredLine;
    }

    if (currentImage) {
      // read, using the byte width that may be from the new current image
      this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
    }
    else {
      this._lastLine = null;
      this.complete();
    }
  };
  });

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/chunkstream.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/filter-parse.js

  var filterParseAsync = createCommonjsModule(function (module) {






  var FilterAsync = module.exports = function(bitmapInfo) {
    chunkstream.call(this);

    var buffers = [];
    var that = this;
    this._filter = new filterParse(bitmapInfo, {
      read: this.read.bind(this),
      write: function(buffer$$1) {
        buffers.push(buffer$$1);
      },
      complete: function() {
        that.emit('complete', Buffer.concat(buffers));
      }
    });

    this._filter.start();
  };
  util.inherits(FilterAsync, chunkstream);
  });

  // node_modules/pngjs/lib/constants.js


  var constants = {

    PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

    TYPE_IHDR: 0x49484452,
    TYPE_IEND: 0x49454e44,
    TYPE_IDAT: 0x49444154,
    TYPE_PLTE: 0x504c5445,
    TYPE_tRNS: 0x74524e53, // eslint-disable-line camelcase
    TYPE_gAMA: 0x67414d41, // eslint-disable-line camelcase

    // color-type bits
    COLORTYPE_GRAYSCALE: 0,
    COLORTYPE_PALETTE: 1,
    COLORTYPE_COLOR: 2,
    COLORTYPE_ALPHA: 4, // e.g. grayscale and alpha

    // color-type combinations
    COLORTYPE_PALETTE_COLOR: 3,
    COLORTYPE_COLOR_ALPHA: 6,

    COLORTYPE_TO_BPP_MAP: {
      0: 1,
      2: 3,
      3: 1,
      4: 2,
      6: 4
    },

    GAMMA_DIVISION: 100000
  };

  var crc = createCommonjsModule(function (module) {

  var crcTable = [];

  (function() {
    for (var i = 0; i < 256; i++) {
      var currentCrc = i;
      for (var j = 0; j < 8; j++) {
        if (currentCrc & 1) {
          currentCrc = 0xedb88320 ^ (currentCrc >>> 1);
        }
        else {
          currentCrc = currentCrc >>> 1;
        }
      }
      crcTable[i] = currentCrc;
    }
  }());

  var CrcCalculator = module.exports = function() {
    this._crc = -1;
  };

  CrcCalculator.prototype.write = function(data) {

    for (var i = 0; i < data.length; i++) {
      this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ (this._crc >>> 8);
    }
    return true;
  };

  CrcCalculator.prototype.crc32 = function() {
    return this._crc ^ -1;
  };


  CrcCalculator.crc32 = function(buf) {

    var crc = -1;
    for (var i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ -1;
  };
  });

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/constants.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/crc.js

  var parser = createCommonjsModule(function (module) {





  var Parser = module.exports = function(options, dependencies) {

    this._options = options;
    options.checkCRC = options.checkCRC !== false;

    this._hasIHDR = false;
    this._hasIEND = false;

    // input flags/metadata
    this._palette = [];
    this._colorType = 0;

    this._chunks = {};
    this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
    this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
    this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
    this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
    this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
    this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);

    this.read = dependencies.read;
    this.error = dependencies.error;
    this.metadata = dependencies.metadata;
    this.gamma = dependencies.gamma;
    this.transColor = dependencies.transColor;
    this.palette = dependencies.palette;
    this.parsed = dependencies.parsed;
    this.inflateData = dependencies.inflateData;
    this.finished = dependencies.finished;
  };

  Parser.prototype.start = function() {
    this.read(constants.PNG_SIGNATURE.length,
      this._parseSignature.bind(this)
    );
  };

  Parser.prototype._parseSignature = function(data) {

    var signature = constants.PNG_SIGNATURE;

    for (var i = 0; i < signature.length; i++) {
      if (data[i] !== signature[i]) {
        this.error(new Error('Invalid file signature'));
        return;
      }
    }
    this.read(8, this._parseChunkBegin.bind(this));
  };

  Parser.prototype._parseChunkBegin = function(data) {

    // chunk content length
    var length = data.readUInt32BE(0);

    // chunk type
    var type = data.readUInt32BE(4);
    var name = '';
    for (var i = 4; i < 8; i++) {
      name += String.fromCharCode(data[i]);
    }

    //console.log('chunk ', name, length);

    // chunk flags
    var ancillary = Boolean(data[4] & 0x20); // or critical
  //    priv = Boolean(data[5] & 0x20), // or public
  //    safeToCopy = Boolean(data[7] & 0x20); // or unsafe

    if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
      this.error(new Error('Expected IHDR on beggining'));
      return;
    }

    this._crc = new crc();
    this._crc.write(new Buffer(name));

    if (this._chunks[type]) {
      return this._chunks[type](length);
    }

    if (!ancillary) {
      this.error(new Error('Unsupported critical chunk type ' + name));
      return;
    }

    this.read(length + 4, this._skipChunk.bind(this));
  };

  Parser.prototype._skipChunk = function(/*data*/) {
    this.read(8, this._parseChunkBegin.bind(this));
  };

  Parser.prototype._handleChunkEnd = function() {
    this.read(4, this._parseChunkEnd.bind(this));
  };

  Parser.prototype._parseChunkEnd = function(data) {

    var fileCrc = data.readInt32BE(0);
    var calcCrc = this._crc.crc32();

    // check CRC
    if (this._options.checkCRC && calcCrc !== fileCrc) {
      this.error(new Error('Crc error - ' + fileCrc + ' - ' + calcCrc));
      return;
    }

    if (!this._hasIEND) {
      this.read(8, this._parseChunkBegin.bind(this));
    }
  };

  Parser.prototype._handleIHDR = function(length) {
    this.read(length, this._parseIHDR.bind(this));
  };
  Parser.prototype._parseIHDR = function(data) {

    this._crc.write(data);

    var width = data.readUInt32BE(0);
    var height = data.readUInt32BE(4);
    var depth = data[8];
    var colorType = data[9]; // bits: 1 palette, 2 color, 4 alpha
    var compr = data[10];
    var filter = data[11];
    var interlace = data[12];

    // console.log('    width', width, 'height', height,
    //     'depth', depth, 'colorType', colorType,
    //     'compr', compr, 'filter', filter, 'interlace', interlace
    // );

    if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
      this.error(new Error('Unsupported bit depth ' + depth));
      return;
    }
    if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
      this.error(new Error('Unsupported color type'));
      return;
    }
    if (compr !== 0) {
      this.error(new Error('Unsupported compression method'));
      return;
    }
    if (filter !== 0) {
      this.error(new Error('Unsupported filter method'));
      return;
    }
    if (interlace !== 0 && interlace !== 1) {
      this.error(new Error('Unsupported interlace method'));
      return;
    }

    this._colorType = colorType;

    var bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];

    this._hasIHDR = true;

    this.metadata({
      width: width,
      height: height,
      depth: depth,
      interlace: Boolean(interlace),
      palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
      color: Boolean(colorType & constants.COLORTYPE_COLOR),
      alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
      bpp: bpp,
      colorType: colorType
    });

    this._handleChunkEnd();
  };


  Parser.prototype._handlePLTE = function(length) {
    this.read(length, this._parsePLTE.bind(this));
  };
  Parser.prototype._parsePLTE = function(data) {

    this._crc.write(data);

    var entries = Math.floor(data.length / 3);
    // console.log('Palette:', entries);

    for (var i = 0; i < entries; i++) {
      this._palette.push([
        data[i * 3],
        data[i * 3 + 1],
        data[i * 3 + 2],
        0xff
      ]);
    }

    this.palette(this._palette);

    this._handleChunkEnd();
  };

  Parser.prototype._handleTRNS = function(length) {
    this.read(length, this._parseTRNS.bind(this));
  };
  Parser.prototype._parseTRNS = function(data) {

    this._crc.write(data);

    // palette
    if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
      if (this._palette.length === 0) {
        this.error(new Error('Transparency chunk must be after palette'));
        return;
      }
      if (data.length > this._palette.length) {
        this.error(new Error('More transparent colors than palette size'));
        return;
      }
      for (var i = 0; i < data.length; i++) {
        this._palette[i][3] = data[i];
      }
      this.palette(this._palette);
    }

    // for colorType 0 (grayscale) and 2 (rgb)
    // there might be one gray/color defined as transparent
    if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
      // grey, 2 bytes
      this.transColor([data.readUInt16BE(0)]);
    }
    if (this._colorType === constants.COLORTYPE_COLOR) {
      this.transColor([data.readUInt16BE(0), data.readUInt16BE(2), data.readUInt16BE(4)]);
    }

    this._handleChunkEnd();
  };

  Parser.prototype._handleGAMA = function(length) {
    this.read(length, this._parseGAMA.bind(this));
  };
  Parser.prototype._parseGAMA = function(data) {

    this._crc.write(data);
    this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);

    this._handleChunkEnd();
  };

  Parser.prototype._handleIDAT = function(length) {
    this.read(-length, this._parseIDAT.bind(this, length));
  };
  Parser.prototype._parseIDAT = function(length, data) {

    this._crc.write(data);

    if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
      throw new Error('Expected palette not found');
    }

    this.inflateData(data);
    var leftOverLength = length - data.length;

    if (leftOverLength > 0) {
      this._handleIDAT(leftOverLength);
    }
    else {
      this._handleChunkEnd();
    }
  };

  Parser.prototype._handleIEND = function(length) {
    this.read(length, this._parseIEND.bind(this));
  };
  Parser.prototype._parseIEND = function(data) {

    this._crc.write(data);

    this._hasIEND = true;
    this._handleChunkEnd();

    if (this.finished) {
      this.finished();
    }
  };
  });

  var pixelBppMap = {
    1: { // L
      0: 0,
      1: 0,
      2: 0,
      3: 0xff
    },
    2: { // LA
      0: 0,
      1: 0,
      2: 0,
      3: 1
    },
    3: { // RGB
      0: 0,
      1: 1,
      2: 2,
      3: 0xff
    },
    4: { // RGBA
      0: 0,
      1: 1,
      2: 2,
      3: 3
    }
  };

  function bitRetriever(data, depth) {

    var leftOver = [];
    var i = 0;

    function split() {
      if (i === data.length) {
        throw new Error('Ran out of data');
      }
      var byte = data[i];
      i++;
      var byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
      switch (depth) {
        default:
          throw new Error('unrecognised depth');
        case 16:
          byte2 = data[i];
          i++;
          leftOver.push(((byte << 8) + byte2));
          break;
        case 4:
          byte2 = byte & 0x0f;
          byte1 = byte >> 4;
          leftOver.push(byte1, byte2);
          break;
        case 2:
          byte4 = byte & 3;
          byte3 = byte >> 2 & 3;
          byte2 = byte >> 4 & 3;
          byte1 = byte >> 6 & 3;
          leftOver.push(byte1, byte2, byte3, byte4);
          break;
        case 1:
          byte8 = byte & 1;
          byte7 = byte >> 1 & 1;
          byte6 = byte >> 2 & 1;
          byte5 = byte >> 3 & 1;
          byte4 = byte >> 4 & 1;
          byte3 = byte >> 5 & 1;
          byte2 = byte >> 6 & 1;
          byte1 = byte >> 7 & 1;
          leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
          break;
      }
    }

    return {
      get: function(count) {
        while (leftOver.length < count) {
          split();
        }
        var returner = leftOver.slice(0, count);
        leftOver = leftOver.slice(count);
        return returner;
      },
      resetAfterLine: function() {
        leftOver.length = 0;
      },
      end: function() {
        if (i !== data.length) {
          throw new Error('extra data found');
        }
      }
    };
  }

  function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) { // eslint-disable-line max-params
    var imageWidth = image.width;
    var imageHeight = image.height;
    var imagePass = image.index;
    for (var y = 0; y < imageHeight; y++) {
      for (var x = 0; x < imageWidth; x++) {
        var pxPos = getPxPos(x, y, imagePass);

        for (var i = 0; i < 4; i++) {
          var idx = pixelBppMap[bpp][i];
          if (idx === 0xff) {
            pxData[pxPos + i] = 0xff;
          } else {
            var dataPos = idx + rawPos;
            if (dataPos === data.length) {
              throw new Error('Ran out of data');
            }
            pxData[pxPos + i] = data[dataPos];
          }
        }
        rawPos += bpp; //eslint-disable-line no-param-reassign
      }
    }
    return rawPos;
  }

  function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) { // eslint-disable-line max-params
    var imageWidth = image.width;
    var imageHeight = image.height;
    var imagePass = image.index;
    for (var y = 0; y < imageHeight; y++) {
      for (var x = 0; x < imageWidth; x++) {
        var pixelData = bits.get(bpp);
        var pxPos = getPxPos(x, y, imagePass);

        for (var i = 0; i < 4; i++) {
          var idx = pixelBppMap[bpp][i];
          pxData[pxPos + i] = idx !== 0xff ? pixelData[idx] : maxBit;
        }
      }
      bits.resetAfterLine();
    }
  }

  var dataToBitMap = function(data, bitmapInfo) {

    var width = bitmapInfo.width;
    var height = bitmapInfo.height;
    var depth = bitmapInfo.depth;
    var bpp = bitmapInfo.bpp;
    var interlace$$1 = bitmapInfo.interlace;

    if (depth !== 8) {
      var bits = bitRetriever(data, depth);
    }
    var pxData;
    if (depth <= 8) {
      pxData = new Buffer(width * height * 4);
    }
    else {
      pxData = new Uint16Array(width * height * 4);
    }
    var maxBit = Math.pow(2, depth) - 1;
    var rawPos = 0;
    var images;
    var getPxPos;

    if (interlace$$1) {
      images = interlace.getImagePasses(width, height);
      getPxPos = interlace.getInterlaceIterator(width, height);
    }
    else {
      var nonInterlacedPxPos = 0;
      getPxPos = function() {
        var returner = nonInterlacedPxPos;
        nonInterlacedPxPos += 4;
        return returner;
      };
      images = [{ width: width, height: height }];
    }

    for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
      if (depth === 8) {
        rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
      }
      else {
        mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
      }
    }
    if (depth === 8) {
      if (rawPos !== data.length) {
        throw new Error('extra data found');
      }
    }
    else {
      bits.end();
    }

    return pxData;
  };

  var bitmapper = {
  	dataToBitMap: dataToBitMap
  };

  // node_modules/pngjs/lib/format-normaliser.js

  function dePalette(indata, outdata, width, height, palette) {
    var pxPos = 0;
    // use values from palette
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var color = palette[indata[pxPos]];

        if (!color) {
          throw new Error('index ' + indata[pxPos] + ' not in palette');
        }

        for (var i = 0; i < 4; i++) {
          outdata[pxPos + i] = color[i];
        }
        pxPos += 4;
      }
    }
  }

  function replaceTransparentColor(indata, outdata, width, height, transColor) {
    var pxPos = 0;
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var makeTrans = false;

        if (transColor.length === 1) {
          if (transColor[0] === indata[pxPos]) {
            makeTrans = true;
          }
        }
        else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
          makeTrans = true;
        }
        if (makeTrans) {
          for (var i = 0; i < 4; i++) {
            outdata[pxPos + i] = 0;
          }
        }
        pxPos += 4;
      }
    }
  }

  function scaleDepth(indata, outdata, width, height, depth) {
    var maxOutSample = 255;
    var maxInSample = Math.pow(2, depth) - 1;
    var pxPos = 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        for (var i = 0; i < 4; i++) {
          outdata[pxPos + i] = Math.floor((indata[pxPos + i] * maxOutSample) / maxInSample + 0.5);
        }
        pxPos += 4;
      }
    }
  }

  var formatNormaliser = function(indata, imageData) {

    var depth = imageData.depth;
    var width = imageData.width;
    var height = imageData.height;
    var colorType = imageData.colorType;
    var transColor = imageData.transColor;
    var palette = imageData.palette;

    var outdata = indata; // only different for 16 bits

    if (colorType === 3) { // paletted
      dePalette(indata, outdata, width, height, palette);
    }
    else {
      if (transColor) {
        replaceTransparentColor(indata, outdata, width, height, transColor);
      }
      // if it needs scaling
      if (depth !== 8) {
        // if we need to change the buffer size
        if (depth === 16) {
          outdata = new Buffer(width * height * 4);
        }
        scaleDepth(indata, outdata, width, height, depth);
      }
    }
    return outdata;
  };

  //  commonjs-external:zlib

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/filter-parse-async.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/parser.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/bitmapper.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/format-normaliser.js

  var parserAsync = createCommonjsModule(function (module) {









  var ParserAsync = module.exports = function(options) {
    chunkstream.call(this);

    this._parser = new parser(options, {
      read: this.read.bind(this),
      error: this._handleError.bind(this),
      metadata: this._handleMetaData.bind(this),
      gamma: this.emit.bind(this, 'gamma'),
      palette: this._handlePalette.bind(this),
      transColor: this._handleTransColor.bind(this),
      finished: this._finished.bind(this),
      inflateData: this._inflateData.bind(this)
    });
    this._options = options;
    this.writable = true;

    this._parser.start();
  };
  util.inherits(ParserAsync, chunkstream);


  ParserAsync.prototype._handleError = function(err) {

    this.emit('error', err);

    this.writable = false;

    this.destroy();

    if (this._inflate && this._inflate.destroy) {
      this._inflate.destroy();
    }

    this.errord = true;
  };

  ParserAsync.prototype._inflateData = function(data) {
    if (!this._inflate) {
      if (this._bitmapInfo.interlace) {
        this._inflate = zlib.createInflate();

        this._inflate.on('error', this.emit.bind(this, 'error'));
        this._filter.on('complete', this._complete.bind(this));

        this._inflate.pipe(this._filter);
      } else {
        var rowSize = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7) >> 3) + 1;
        var imageSize = rowSize * this._bitmapInfo.height;
        var chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
        
        this._inflate = zlib.createInflate({ chunkSize: chunkSize });
        var leftToInflate = imageSize;

        var emitError = this.emit.bind(this, 'error');
        this._inflate.on('error', function(err) {
          if (!leftToInflate) {
            return;
          }

          emitError(err);
        });
        this._filter.on('complete', this._complete.bind(this));

        var filterWrite = this._filter.write.bind(this._filter);
        this._inflate.on('data', function(chunk) {
          if (!leftToInflate) {
            return;
          }

          if (chunk.length > leftToInflate) {
            chunk = chunk.slice(0, leftToInflate);
          }

          leftToInflate -= chunk.length;

          filterWrite(chunk);
        });

        this._inflate.on('end', this._filter.end.bind(this._filter));
      }
    }
    this._inflate.write(data);
  };

  ParserAsync.prototype._handleMetaData = function(metaData) {

    this.emit('metadata', metaData);

    this._bitmapInfo = Object.create(metaData);

    this._filter = new filterParseAsync(this._bitmapInfo);
  };

  ParserAsync.prototype._handleTransColor = function(transColor) {
    this._bitmapInfo.transColor = transColor;
  };

  ParserAsync.prototype._handlePalette = function(palette) {
    this._bitmapInfo.palette = palette;
  };


  ParserAsync.prototype._finished = function() {
    if (this.errord) {
      return;
    }

    if (!this._inflate) {
      this.emit('error', 'No Inflate block');
    }
    else {
      // no more data to inflate
      this._inflate.end();
    }
    this.destroySoon();
  };

  ParserAsync.prototype._complete = function(filteredData) {

    if (this.errord) {
      return;
    }

    try {
      var bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);

      var normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
      bitmapData = null;
    }
    catch (ex) {
      this._handleError(ex);
      return;
    }

    this.emit('parsed', normalisedBitmapData);
  };
  });

  var bitpacker = function(dataIn, width, height, options) {
    var outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
    if (options.colorType === options.inputColorType) {
      var bigEndian = (function() {
        var buffer$$1 = new ArrayBuffer(2);
        new DataView(buffer$$1).setInt16(0, 256, true /* littleEndian */);
        // Int16Array uses the platform's endianness.
        return new Int16Array(buffer$$1)[0] !== 256;
      })();
      // If no need to convert to grayscale and alpha is present/absent in both, take a fast route
       if (options.bitDepth === 8 || (options.bitDepth === 16 && bigEndian)){
           return dataIn;
      }
    }

    // map to a UInt16 array if data is 16bit, fix endianness below
    var data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);

    var maxValue = 255;
    var inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
    if (inBpp == 4 && !options.inputHasAlpha) inBpp = 3;
    var outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
    if (options.bitDepth === 16) {
      maxValue = 65535;
      outBpp *= 2;
    }
    var outData = new Buffer(width * height * outBpp);

    var inIndex = 0;
    var outIndex = 0;

    var bgColor = options.bgColor || {};
    if (bgColor.red === undefined) {
      bgColor.red = maxValue;
    }
    if (bgColor.green === undefined) {
      bgColor.green = maxValue;
    }
    if (bgColor.blue === undefined) {
      bgColor.blue = maxValue;
    }

    function getRGBA(data, inIndex) {
      var red, green, blue, alpha = maxValue;
      switch (options.inputColorType) {
        case constants.COLORTYPE_COLOR_ALPHA:
          alpha = data[inIndex + 3];
          red = data[inIndex];
          green = data[inIndex+1];
          blue = data[inIndex+2];
          break;
        case constants.COLORTYPE_COLOR:
          red = data[inIndex];
          green = data[inIndex+1];
          blue = data[inIndex+2];
          break;
        case constants.COLORTYPE_ALPHA:
          alpha = data[inIndex + 1];
          red = data[inIndex];
          green = red;
          blue = red;
          break;
        case constants.COLORTYPE_GRAYSCALE:
          red = data[inIndex];
          green = red;
          blue = red;
          break;
        default:
          throw new Error('input color type:' + options.inputColorType + ' is not supported at present');
      }

      if (options.inputHasAlpha) {
        if (!outHasAlpha) {
          alpha /= maxValue;
          red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
          green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
          blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
        }
      }
      return {red: red, green: green, blue: blue, alpha: alpha};
    }

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var rgba = getRGBA(data, inIndex);

        switch (options.colorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
          case constants.COLORTYPE_COLOR:
            if (options.bitDepth === 8) {
              outData[outIndex] = rgba.red;
              outData[outIndex + 1] = rgba.green;
              outData[outIndex + 2] = rgba.blue;
              if (outHasAlpha) {
                outData[outIndex + 3] = rgba.alpha;
              }
            } else {
              outData.writeUInt16BE(rgba.red, outIndex);
              outData.writeUInt16BE(rgba.green, outIndex + 2);
              outData.writeUInt16BE(rgba.blue, outIndex + 4);
              if (outHasAlpha) {
                outData.writeUInt16BE(rgba.alpha, outIndex + 6);
              }
            }
            break;
          case constants.COLORTYPE_ALPHA:
          case constants.COLORTYPE_GRAYSCALE:
            // Convert to grayscale and alpha
            var grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
            if (options.bitDepth === 8) {
              outData[outIndex] = grayscale;
              if (outHasAlpha) {
                outData[outIndex + 1] = rgba.alpha;
              }
            } else {
              outData.writeUInt16BE(grayscale, outIndex);
              if (outHasAlpha) {
                outData.writeUInt16BE(rgba.alpha, outIndex + 2);
              }
            }
            break;
        }

        inIndex += inBpp;
        outIndex += outBpp;
      }
    }

    return outData;
  };

  function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
    pxData.copy(rawData, rawPos, pxPos, pxPos + byteWidth);
  }

  function filterSumNone(pxData, pxPos, byteWidth) {

    var sum = 0;
    var length = pxPos + byteWidth;

    for (var i = pxPos; i < length; i++) {
      sum += Math.abs(pxData[i]);
    }
    return sum;
  }

  function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var val = pxData[pxPos + x] - left;

      rawData[rawPos + x] = val;
    }
  }

  function filterSumSub(pxData, pxPos, byteWidth, bpp) {

    var sum = 0;
    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var val = pxData[pxPos + x] - left;

      sum += Math.abs(val);
    }

    return sum;
  }

  function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {

    for (var x = 0; x < byteWidth; x++) {

      var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
      var val = pxData[pxPos + x] - up;

      rawData[rawPos + x] = val;
    }
  }

  function filterSumUp(pxData, pxPos, byteWidth) {

    var sum = 0;
    var length = pxPos + byteWidth;
    for (var x = pxPos; x < length; x++) {

      var up = pxPos > 0 ? pxData[x - byteWidth] : 0;
      var val = pxData[x] - up;

      sum += Math.abs(val);
    }

    return sum;
  }

  function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
      var val = pxData[pxPos + x] - ((left + up) >> 1);

      rawData[rawPos + x] = val;
    }
  }

  function filterSumAvg(pxData, pxPos, byteWidth, bpp) {

    var sum = 0;
    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
      var val = pxData[pxPos + x] - ((left + up) >> 1);

      sum += Math.abs(val);
    }

    return sum;
  }

  function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
      var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
      var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

      rawData[rawPos + x] = val;
    }
  }

  function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
    var sum = 0;
    for (var x = 0; x < byteWidth; x++) {

      var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
      var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
      var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
      var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

      sum += Math.abs(val);
    }

    return sum;
  }

  var filters = {
    0: filterNone,
    1: filterSub,
    2: filterUp,
    3: filterAvg,
    4: filterPaeth
  };

  var filterSums = {
    0: filterSumNone,
    1: filterSumSub,
    2: filterSumUp,
    3: filterSumAvg,
    4: filterSumPaeth
  };

  var filterPack = function(pxData, width, height, options, bpp) {

    var filterTypes;
    if (!('filterType' in options) || options.filterType === -1) {
      filterTypes = [0, 1, 2, 3, 4];
    }
    else if (typeof options.filterType === 'number') {
      filterTypes = [options.filterType];
    }
    else {
      throw new Error('unrecognised filter types');
    }

    if (options.bitDepth === 16) bpp *= 2;
    var byteWidth = width * bpp;
    var rawPos = 0;
    var pxPos = 0;
    var rawData = new Buffer((byteWidth + 1) * height);

    var sel = filterTypes[0];

    for (var y = 0; y < height; y++) {

      if (filterTypes.length > 1) {
        // find best filter for this line (with lowest sum of values)
        var min = Infinity;

        for (var i = 0; i < filterTypes.length; i++) {
          var sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
          if (sum < min) {
            sel = filterTypes[i];
            min = sum;
          }
        }
      }

      rawData[rawPos] = sel;
      rawPos++;
      filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
      rawPos += byteWidth;
      pxPos += byteWidth;
    }
    return rawData;
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/bitpacker.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/filter-pack.js

  var packer = createCommonjsModule(function (module) {







  var Packer = module.exports = function(options) {
    this._options = options;

    options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
    options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
    options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
    options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
    options.deflateFactory = options.deflateFactory || zlib.createDeflate;
    options.bitDepth = options.bitDepth || 8;
    // This is outputColorType
    options.colorType = (typeof options.colorType === 'number') ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
    options.inputColorType = (typeof options.inputColorType === 'number') ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;

    if ([
      constants.COLORTYPE_GRAYSCALE,
      constants.COLORTYPE_COLOR,
      constants.COLORTYPE_COLOR_ALPHA,
      constants.COLORTYPE_ALPHA
    ].indexOf(options.colorType) === -1) {
      throw new Error('option color type:' + options.colorType + ' is not supported at present');
    }
    if ([
      constants.COLORTYPE_GRAYSCALE,
      constants.COLORTYPE_COLOR,
      constants.COLORTYPE_COLOR_ALPHA,
      constants.COLORTYPE_ALPHA
    ].indexOf(options.inputColorType) === -1) {
      throw new Error('option input color type:' + options.inputColorType + ' is not supported at present');
    }
    if (options.bitDepth !== 8 && options.bitDepth !== 16) {
      throw new Error('option bit depth:' + options.bitDepth + ' is not supported at present');
    }
  };

  Packer.prototype.getDeflateOptions = function() {
    return {
      chunkSize: this._options.deflateChunkSize,
      level: this._options.deflateLevel,
      strategy: this._options.deflateStrategy
    };
  };

  Packer.prototype.createDeflate = function() {
    return this._options.deflateFactory(this.getDeflateOptions());
  };

  Packer.prototype.filterData = function(data, width, height) {
    // convert to correct format for filtering (e.g. right bpp and bit depth)
    var packedData = bitpacker(data, width, height, this._options);

    // filter pixel data
    var bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
    var filteredData = filterPack(packedData, width, height, this._options, bpp);
    return filteredData;
  };

  Packer.prototype._packChunk = function(type, data) {

    var len = (data ? data.length : 0);
    var buf = new Buffer(len + 12);

    buf.writeUInt32BE(len, 0);
    buf.writeUInt32BE(type, 4);

    if (data) {
      data.copy(buf, 8);
    }

    buf.writeInt32BE(crc.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
    return buf;
  };

  Packer.prototype.packGAMA = function(gamma) {
    var buf = new Buffer(4);
    buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
    return this._packChunk(constants.TYPE_gAMA, buf);
  };

  Packer.prototype.packIHDR = function(width, height) {

    var buf = new Buffer(13);
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    buf[8] = this._options.bitDepth; // Bit depth
    buf[9] = this._options.colorType; // colorType
    buf[10] = 0; // compression
    buf[11] = 0; // filter
    buf[12] = 0; // interlace

    return this._packChunk(constants.TYPE_IHDR, buf);
  };

  Packer.prototype.packIDAT = function(data) {
    return this._packChunk(constants.TYPE_IDAT, data);
  };

  Packer.prototype.packIEND = function() {
    return this._packChunk(constants.TYPE_IEND, null);
  };
  });

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/packer.js

  var packerAsync = createCommonjsModule(function (module) {






  var PackerAsync = module.exports = function(opt) {
    Stream.call(this);

    var options = opt || {};

    this._packer = new packer(options);
    this._deflate = this._packer.createDeflate();

    this.readable = true;
  };
  util.inherits(PackerAsync, Stream);


  PackerAsync.prototype.pack = function(data, width, height, gamma) {
    // Signature
    this.emit('data', new Buffer(constants.PNG_SIGNATURE));
    this.emit('data', this._packer.packIHDR(width, height));

    if (gamma) {
      this.emit('data', this._packer.packGAMA(gamma));
    }

    var filteredData = this._packer.filterData(data, width, height);

    // compress it
    this._deflate.on('error', this.emit.bind(this, 'error'));

    this._deflate.on('data', function(compressedData) {
      this.emit('data', this._packer.packIDAT(compressedData));
    }.bind(this));

    this._deflate.on('end', function() {
      this.emit('data', this._packer.packIEND());
      this.emit('end');
    }.bind(this));

    this._deflate.end(filteredData);
  };
  });

  //  commonjs-external:assert

  var syncInflate = createCommonjsModule(function (module, exports) {

  var assert$$1 = assert.ok;



  var kMaxLength = buffer.kMaxLength;

  function Inflate(opts) {
    if (!(this instanceof Inflate)) {
      return new Inflate(opts);
    }

    if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
      opts.chunkSize = zlib.Z_MIN_CHUNK;
    }

    zlib.Inflate.call(this, opts);

    if (opts && opts.maxLength != null) {
      this._maxLength = opts.maxLength;
    }
  }

  function createInflate(opts) {
    return new Inflate(opts);
  }

  function _close(engine, callback) {
    if (callback) {
      process.nextTick(callback);
    }

    // Caller may invoke .close after a zlib error (which will null _handle).
    if (!engine._handle) {
      return;
    }

    engine._handle.close();
    engine._handle = null;
  }

  Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
    if (typeof asyncCb === 'function') {
      return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
    }

    var self = this;

    var availInBefore = chunk && chunk.length;
    var availOutBefore = this._chunkSize - this._offset;
    var leftToInflate = this._maxLength;
    var inOff = 0;

    var buffers = [];
    var nread = 0;

    var error;
    this.on('error', function(err) {
      error = err;
    });

    function handleChunk(availInAfter, availOutAfter) {
      if (self._hadError) {
        return;
      }

      var have = availOutBefore - availOutAfter;
      assert$$1(have >= 0, 'have should not go down');

      if (have > 0) {
        var out = self._buffer.slice(self._offset, self._offset + have);
        self._offset += have;

        if (out.length > leftToInflate) {
          out = out.slice(0, leftToInflate);
        }

        buffers.push(out);
        nread += out.length;
        leftToInflate -= out.length;

        if (leftToInflate === 0) {
          return false;
        }
      }

      if (availOutAfter === 0 || self._offset >= self._chunkSize) {
        availOutBefore = self._chunkSize;
        self._offset = 0;
        self._buffer = Buffer.allocUnsafe(self._chunkSize);
      }

      if (availOutAfter === 0) {
        inOff += (availInBefore - availInAfter);
        availInBefore = availInAfter;

        return true;
      }

      return false;
    }

    assert$$1(this._handle, 'zlib binding closed');
    do {
      var res = this._handle.writeSync(flushFlag,
                                       chunk, // in
                                       inOff, // in_off
                                       availInBefore, // in_len
                                       this._buffer, // out
                                       this._offset, //out_off
                                       availOutBefore); // out_len
    } while (!this._hadError && handleChunk(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    if (nread >= kMaxLength) {
      _close(this);
      throw new RangeError('Cannot create final Buffer. It would be larger than 0x' + kMaxLength.toString(16) + ' bytes');
    }

    var buf = Buffer.concat(buffers, nread);
    _close(this);

    return buf;
  };

  util.inherits(Inflate, zlib.Inflate);

  function zlibBufferSync(engine, buffer$$1) {
    if (typeof buffer$$1 === 'string') {
      buffer$$1 = Buffer.from(buffer$$1);
    }
    if (!(buffer$$1 instanceof Buffer)) {
      throw new TypeError('Not a string or buffer');
    }

    var flushFlag = engine._finishFlushFlag;
    if (flushFlag == null) {
      flushFlag = zlib.Z_FINISH;
    }

    return engine._processChunk(buffer$$1, flushFlag);
  }

  function inflateSync(buffer$$1, opts) {
    return zlibBufferSync(new Inflate(opts), buffer$$1);
  }

  module.exports = exports = inflateSync;
  exports.Inflate = Inflate;
  exports.createInflate = createInflate;
  exports.inflateSync = inflateSync;
  });
  var syncInflate_1 = syncInflate.Inflate;
  var syncInflate_2 = syncInflate.createInflate;
  var syncInflate_3 = syncInflate.inflateSync;

  var syncReader = createCommonjsModule(function (module) {

  var SyncReader = module.exports = function(buffer$$1) {

    this._buffer = buffer$$1;
    this._reads = [];
  };

  SyncReader.prototype.read = function(length, callback) {

    this._reads.push({
      length: Math.abs(length),  // if length < 0 then at most this length
      allowLess: length < 0,
      func: callback
    });
  };

  SyncReader.prototype.process = function() {

    // as long as there is any data and read requests
    while (this._reads.length > 0 && this._buffer.length) {

      var read = this._reads[0];

      if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {

        // ok there is any data so that we can satisfy this request
        this._reads.shift(); // == read

        var buf = this._buffer;

        this._buffer = buf.slice(read.length);

        read.func.call(this, buf.slice(0, read.length));

      }
      else {
        break;
      }

    }

    if (this._reads.length > 0) {
      return new Error('There are some read requests waitng on finished stream');
    }

    if (this._buffer.length > 0) {
      return new Error('unrecognised content at end of stream');
    }

  };
  });

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/sync-reader.js

  var process$1 = function(inBuffer, bitmapInfo) {

    var outBuffers = [];
    var reader = new syncReader(inBuffer);
    var filter = new filterParse(bitmapInfo, {
      read: reader.read.bind(reader),
      write: function(bufferPart) {
        outBuffers.push(bufferPart);
      },
      complete: function() {
      }
    });

    filter.start();
    reader.process();

    return Buffer.concat(outBuffers);
  };

  var filterParseSync = {
  	process: process$1
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/sync-inflate.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/filter-parse-sync.js

  var hasSyncZlib = true;


  if (!zlib.deflateSync) {
    hasSyncZlib = false;
  }







  var parserSync = function(buffer$$1, options) {

    if (!hasSyncZlib) {
      throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
    }

    var err;
    function handleError(_err_) {
      err = _err_;
    }

    var metaData;
    function handleMetaData(_metaData_) {
      metaData = _metaData_;
    }

    function handleTransColor(transColor) {
      metaData.transColor = transColor;
    }

    function handlePalette(palette) {
      metaData.palette = palette;
    }

    var gamma;
    function handleGamma(_gamma_) {
      gamma = _gamma_;
    }

    var inflateDataList = [];
    function handleInflateData(inflatedData) {
      inflateDataList.push(inflatedData);
    }

    var reader = new syncReader(buffer$$1);

    var parser$$1 = new parser(options, {
      read: reader.read.bind(reader),
      error: handleError,
      metadata: handleMetaData,
      gamma: handleGamma,
      palette: handlePalette,
      transColor: handleTransColor,
      inflateData: handleInflateData
    });

    parser$$1.start();
    reader.process();

    if (err) {
      throw err;
    }

    //join together the inflate datas
    var inflateData = Buffer.concat(inflateDataList);
    inflateDataList.length = 0;

    var inflatedData;
    if (metaData.interlace) {
      inflatedData = zlib.inflateSync(inflateData);
    } else {
      var rowSize = ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1;
      var imageSize = rowSize * metaData.height;
      inflatedData = syncInflate(inflateData, { chunkSize: imageSize, maxLength: imageSize });
    }
    inflateData = null;

    if (!inflatedData || !inflatedData.length) {
      throw new Error('bad png - invalid inflate data response');
    }

    var unfilteredData = filterParseSync.process(inflatedData, metaData);
    inflateData = null;

    var bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
    unfilteredData = null;

    var normalisedBitmapData = formatNormaliser(bitmapData, metaData);

    metaData.data = normalisedBitmapData;
    metaData.gamma = gamma || 0;

    return metaData;
  };

  var hasSyncZlib$1 = true;

  if (!zlib.deflateSync) {
    hasSyncZlib$1 = false;
  }



  var packerSync = function(metaData, opt) {

    if (!hasSyncZlib$1) {
      throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
    }

    var options = opt || {};

    var packer$$1 = new packer(options);

    var chunks = [];

    // Signature
    chunks.push(new Buffer(constants.PNG_SIGNATURE));

    // Header
    chunks.push(packer$$1.packIHDR(metaData.width, metaData.height));

    if (metaData.gamma) {
      chunks.push(packer$$1.packGAMA(metaData.gamma));
    }

    var filteredData = packer$$1.filterData(metaData.data, metaData.width, metaData.height);

    // compress it
    var compressedData = zlib.deflateSync(filteredData, packer$$1.getDeflateOptions());
    filteredData = null;

    if (!compressedData || !compressedData.length) {
      throw new Error('bad png - invalid compressed data response');
    }
    chunks.push(packer$$1.packIDAT(compressedData));

    // End
    chunks.push(packer$$1.packIEND());

    return Buffer.concat(chunks);
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/parser-sync.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/packer-sync.js

  var read = function(buffer$$1, options) {

    return parserSync(buffer$$1, options || {});
  };

  var write = function(png, options) {

    return packerSync(png, options);
  };

  var pngSync = {
  	read: read,
  	write: write
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/parser-async.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/packer-async.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/png-sync.js

  var png = createCommonjsModule(function (module, exports) {








  var PNG = exports.PNG = function(options) {
    Stream.call(this);

    options = options || {}; // eslint-disable-line no-param-reassign

    // coerce pixel dimensions to integers (also coerces undefined -> 0):
    this.width = options.width | 0;
    this.height = options.height | 0;

    this.data = this.width > 0 && this.height > 0 ?
      new Buffer(4 * this.width * this.height) : null;

    if (options.fill && this.data) {
      this.data.fill(0);
    }

    this.gamma = 0;
    this.readable = this.writable = true;

    this._parser = new parserAsync(options);

    this._parser.on('error', this.emit.bind(this, 'error'));
    this._parser.on('close', this._handleClose.bind(this));
    this._parser.on('metadata', this._metadata.bind(this));
    this._parser.on('gamma', this._gamma.bind(this));
    this._parser.on('parsed', function(data) {
      this.data = data;
      this.emit('parsed', data);
    }.bind(this));

    this._packer = new packerAsync(options);
    this._packer.on('data', this.emit.bind(this, 'data'));
    this._packer.on('end', this.emit.bind(this, 'end'));
    this._parser.on('close', this._handleClose.bind(this));
    this._packer.on('error', this.emit.bind(this, 'error'));

  };
  util.inherits(PNG, Stream);

  PNG.sync = pngSync;

  PNG.prototype.pack = function() {

    if (!this.data || !this.data.length) {
      this.emit('error', 'No data provided');
      return this;
    }

    process.nextTick(function() {
      this._packer.pack(this.data, this.width, this.height, this.gamma);
    }.bind(this));

    return this;
  };


  PNG.prototype.parse = function(data, callback) {

    if (callback) {
      var onParsed, onError;

      onParsed = function(parsedData) {
        this.removeListener('error', onError);

        this.data = parsedData;
        callback(null, this);
      }.bind(this);

      onError = function(err) {
        this.removeListener('parsed', onParsed);

        callback(err, null);
      }.bind(this);

      this.once('parsed', onParsed);
      this.once('error', onError);
    }

    this.end(data);
    return this;
  };

  PNG.prototype.write = function(data) {
    this._parser.write(data);
    return true;
  };

  PNG.prototype.end = function(data) {
    this._parser.end(data);
  };

  PNG.prototype._metadata = function(metadata) {
    this.width = metadata.width;
    this.height = metadata.height;

    this.emit('metadata', metadata);
  };

  PNG.prototype._gamma = function(gamma) {
    this.gamma = gamma;
  };

  PNG.prototype._handleClose = function() {
    if (!this._parser.writable && !this._packer.readable) {
      this.emit('close');
    }
  };


  PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params
    // coerce pixel dimensions to integers (also coerces undefined -> 0):
    /* eslint-disable no-param-reassign */
    srcX |= 0;
    srcY |= 0;
    width |= 0;
    height |= 0;
    deltaX |= 0;
    deltaY |= 0;
    /* eslint-enable no-param-reassign */

    if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
      throw new Error('bitblt reading outside image');
    }

    if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
      throw new Error('bitblt writing outside image');
    }

    for (var y = 0; y < height; y++) {
      src.data.copy(dst.data,
        ((deltaY + y) * dst.width + deltaX) << 2,
        ((srcY + y) * src.width + srcX) << 2,
        ((srcY + y) * src.width + srcX + width) << 2
      );
    }
  };


  PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params

    PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
    return this;
  };

  PNG.adjustGamma = function(src) {
    if (src.gamma) {
      for (var y = 0; y < src.height; y++) {
        for (var x = 0; x < src.width; x++) {
          var idx = (src.width * y + x) << 2;

          for (var i = 0; i < 3; i++) {
            var sample = src.data[idx + i] / 255;
            sample = Math.pow(sample, 1 / 2.2 / src.gamma);
            src.data[idx + i] = Math.round(sample * 255);
          }
        }
      }
      src.gamma = 0;
    }
  };

  PNG.prototype.adjustGamma = function() {
    PNG.adjustGamma(this);
  };
  });
  var png_1 = png.PNG;

  var utils$1 = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/renderer/utils.js
  function hex2rgba (hex) {
    if (typeof hex !== 'string') {
      throw new Error('Color should be defined as hex string')
    }

    var hexCode = hex.slice().replace('#', '').split('');
    if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
      throw new Error('Invalid hex color: ' + hex)
    }

    // Convert from short to long form (fff -> ffffff)
    if (hexCode.length === 3 || hexCode.length === 4) {
      hexCode = Array.prototype.concat.apply([], hexCode.map(function (c) {
        return [c, c]
      }));
    }

    // Add default alpha value
    if (hexCode.length === 6) hexCode.push('F', 'F');

    var hexValue = parseInt(hexCode.join(''), 16);

    return {
      r: (hexValue >> 24) & 255,
      g: (hexValue >> 16) & 255,
      b: (hexValue >> 8) & 255,
      a: hexValue & 255,
      hex: '#' + hexCode.slice(0, 6).join('')
    }
  }

  exports.getOptions = function getOptions (options) {
    if (!options) options = {};
    if (!options.color) options.color = {};

    var margin = typeof options.margin === 'undefined' ||
      options.margin === null ||
      options.margin < 0 ? 4 : options.margin;

    var width = options.width && options.width >= 21 ? options.width : undefined;
    var scale = options.scale || 4;

    return {
      width: width,
      scale: width ? 4 : scale,
      margin: margin,
      color: {
        dark: hex2rgba(options.color.dark || '#000000ff'),
        light: hex2rgba(options.color.light || '#ffffffff')
      },
      type: options.type,
      rendererOpts: options.rendererOpts || {}
    }
  };

  exports.getScale = function getScale (qrSize, opts) {
    return opts.width && opts.width >= qrSize + opts.margin * 2
      ? opts.width / (qrSize + opts.margin * 2)
      : opts.scale
  };

  exports.getImageWidth = function getImageWidth (qrSize, opts) {
    var scale = exports.getScale(qrSize, opts);
    return Math.floor((qrSize + opts.margin * 2) * scale)
  };

  exports.qrToImageData = function qrToImageData (imgData, qr, opts) {
    var size = qr.modules.size;
    var data = qr.modules.data;
    var scale = exports.getScale(size, opts);
    var symbolSize = Math.floor((size + opts.margin * 2) * scale);
    var scaledMargin = opts.margin * scale;
    var palette = [opts.color.light, opts.color.dark];

    for (var i = 0; i < symbolSize; i++) {
      for (var j = 0; j < symbolSize; j++) {
        var posDst = (i * symbolSize + j) * 4;
        var pxColor = opts.color.light;

        if (i >= scaledMargin && j >= scaledMargin &&
          i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
          var iSrc = Math.floor((i - scaledMargin) / scale);
          var jSrc = Math.floor((j - scaledMargin) / scale);
          pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
        }

        imgData[posDst++] = pxColor.r;
        imgData[posDst++] = pxColor.g;
        imgData[posDst++] = pxColor.b;
        imgData[posDst] = pxColor.a;
      }
    }
  };
  });
  var utils_1 = utils$1.getOptions;
  var utils_2 = utils$1.getScale;
  var utils_3 = utils$1.getImageWidth;
  var utils_4 = utils$1.qrToImageData;

  //  commonjs-external:fs

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/pngjs/lib/png.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/utils.js

  var png$1 = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/renderer/png.js

  var PNG = png.PNG;


  exports.render = function render (qrData, options) {
    var opts = utils$1.getOptions(options);
    var pngOpts = opts.rendererOpts;
    var size = utils$1.getImageWidth(qrData.modules.size, opts);

    pngOpts.width = size;
    pngOpts.height = size;

    var pngImage = new PNG(pngOpts);
    utils$1.qrToImageData(pngImage.data, qrData, opts);

    return pngImage
  };

  exports.renderToDataURL = function renderToDataURL (qrData, options, cb) {
    if (typeof cb === 'undefined') {
      cb = options;
      options = undefined;
    }

    var png$$1 = exports.render(qrData, options);
    var buffer$$1 = [];

    png$$1.on('error', cb);

    png$$1.on('data', function (data) {
      buffer$$1.push(data);
    });

    png$$1.on('end', function () {
      var url = 'data:image/png;base64,';
      url += Buffer.concat(buffer$$1).toString('base64');
      cb(null, url);
    });

    png$$1.pack();
  };

  exports.renderToFile = function renderToFile (path, qrData, options, cb) {
    if (typeof cb === 'undefined') {
      cb = options;
      options = undefined;
    }

    var stream = require$$0.createWriteStream(path);
    stream.on('error', cb);
    stream.on('close', cb);

    exports.renderToFileStream(stream, qrData, options);
  };

  exports.renderToFileStream = function renderToFileStream (stream, qrData, options) {
    var png$$1 = exports.render(qrData, options);
    png$$1.pack().pipe(stream);
  };
  });
  var png_1$1 = png$1.render;
  var png_2 = png$1.renderToDataURL;
  var png_3 = png$1.renderToFile;
  var png_4 = png$1.renderToFileStream;

  var utf8 = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/renderer/utf8.js


  var BLOCK_CHAR = {
    WW: ' ',
    WB: '▄',
    BB: '█',
    BW: '▀'
  };

  function getBlockChar (top, bottom) {
    if (top && bottom) return BLOCK_CHAR.BB
    if (top && !bottom) return BLOCK_CHAR.BW
    if (!top && bottom) return BLOCK_CHAR.WB
    return BLOCK_CHAR.WW
  }

  exports.render = function (qrData, options, cb) {
    var size = qrData.modules.size;
    var data = qrData.modules.data;

    var opts = utils$1.getOptions(options);

    var output = '';
    var hMargin = Array(size + (opts.margin * 2) + 1).join(BLOCK_CHAR.WW);
    hMargin = Array((opts.margin / 2) + 1).join(hMargin + '\n');

    var vMargin = Array(opts.margin + 1).join(BLOCK_CHAR.WW);

    output += hMargin;
    for (var i = 0; i < size; i += 2) {
      output += vMargin;
      for (var j = 0; j < size; j++) {
        var topModule = data[i * size + j];
        var bottomModule = data[(i + 1) * size + j];

        output += getBlockChar(topModule, bottomModule);
      }

      output += vMargin + '\n';
    }

    output += hMargin.slice(0, -1);

    if (typeof cb === 'function') {
      cb(null, output);
    }

    return output
  };

  exports.renderToFile = function renderToFile (path, qrData, options, cb) {
    if (typeof cb === 'undefined') {
      cb = options;
      options = undefined;
    }

    var fs = require$$0;
    var utf8 = exports.render(qrData, options);
    fs.writeFile(path, utf8, cb);
  };
  });
  var utf8_1 = utf8.render;
  var utf8_2 = utf8.renderToFile;

  // node_modules/qrcode/lib/renderer/terminal.js
  // var Utils = require('./utils')

  var render = function (qrData, options, cb) {
    var size = qrData.modules.size;
    var data = qrData.modules.data;

    // var opts = Utils.getOptions(options)

    // use same scheme as https://github.com/gtanner/qrcode-terminal because it actually works! =)
    var black = '\x1b[40m  \x1b[0m';
    var white = '\x1b[47m  \x1b[0m';

    var output = '';
    var hMargin = Array(size + 3).join(white);
    var vMargin = Array(2).join(white);

    output += hMargin + '\n';
    for (var i = 0; i < size; ++i) {
      output += white;
      for (var j = 0; j < size; j++) {
        // var topModule = data[i * size + j]
        // var bottomModule = data[(i + 1) * size + j]

        output += data[i * size + j] ? black : white;// getBlockChar(topModule, bottomModule)
      }
      // output += white+'\n'
      output += vMargin + '\n';
    }

    output += hMargin + '\n';

    if (typeof cb === 'function') {
      cb(null, output);
    }

    return output
  };
  /*
  exports.renderToFile = function renderToFile (path, qrData, options, cb) {
    if (typeof cb === 'undefined') {
      cb = options
      options = undefined
    }

    var fs = require('fs')
    var utf8 = exports.render(qrData, options)
    fs.writeFile(path, utf8, cb)
  }
  */

  var terminal = {
  	render: render
  };

  // node_modules/qrcode/lib/renderer/svg-tag.js


  function getColorAttrib (color, attrib) {
    var alpha = color.a / 255;
    var str = attrib + '="' + color.hex + '"';

    return alpha < 1
      ? str + ' ' + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"'
      : str
  }

  function svgCmd (cmd, x, y) {
    var str = cmd + x;
    if (typeof y !== 'undefined') str += ' ' + y;

    return str
  }

  function qrToPath (data, size, margin) {
    var path = '';
    var moveBy = 0;
    var newRow = false;
    var lineLength = 0;

    for (var i = 0; i < data.length; i++) {
      var col = Math.floor(i % size);
      var row = Math.floor(i / size);

      if (!col && !newRow) newRow = true;

      if (data[i]) {
        lineLength++;

        if (!(i > 0 && col > 0 && data[i - 1])) {
          path += newRow
            ? svgCmd('M', col + margin, 0.5 + row + margin)
            : svgCmd('m', moveBy, 0);

          moveBy = 0;
          newRow = false;
        }

        if (!(col + 1 < size && data[i + 1])) {
          path += svgCmd('h', lineLength);
          lineLength = 0;
        }
      } else {
        moveBy++;
      }
    }

    return path
  }

  var render$1 = function render (qrData, options, cb) {
    var opts = utils$1.getOptions(options);
    var size = qrData.modules.size;
    var data = qrData.modules.data;
    var qrcodesize = size + opts.margin * 2;

    var bg = !opts.color.light.a
      ? ''
      : '<path ' + getColorAttrib(opts.color.light, 'fill') +
        ' d="M0 0h' + qrcodesize + 'v' + qrcodesize + 'H0z"/>';

    var path =
      '<path ' + getColorAttrib(opts.color.dark, 'stroke') +
      ' d="' + qrToPath(data, size, opts.margin) + '"/>';

    var viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"';

    var width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" ';

    var svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + '>' + bg + path + '</svg>';

    if (typeof cb === 'function') {
      cb(null, svgTag);
    }

    return svgTag
  };

  var svgTag = {
  	render: render$1
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/svg-tag.js

  var svg = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/renderer/svg.js


  exports.render = svgTag.render;

  exports.renderToFile = function renderToFile (path, qrData, options, cb) {
    if (typeof cb === 'undefined') {
      cb = options;
      options = undefined;
    }

    var fs = require$$0;
    var svgTag$$1 = exports.render(qrData, options);

    var xmlStr = '<?xml version="1.0" encoding="utf-8"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
      svgTag$$1;

    fs.writeFile(path, xmlStr, cb);
  };
  });
  var svg_1 = svg.render;
  var svg_2 = svg.renderToFile;

  var canvas = createCommonjsModule(function (module, exports) {
  // node_modules/qrcode/lib/renderer/canvas.js


  function clearCanvas (ctx, canvas, size) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!canvas.style) canvas.style = {};
    canvas.height = size;
    canvas.width = size;
    canvas.style.height = size + 'px';
    canvas.style.width = size + 'px';
  }

  function getCanvasElement () {
    try {
      return document.createElement('canvas')
    } catch (e) {
      throw new Error('You need to specify a canvas element')
    }
  }

  exports.render = function render (qrData, canvas, options) {
    var opts = options;
    var canvasEl = canvas;

    if (typeof opts === 'undefined' && (!canvas || !canvas.getContext)) {
      opts = canvas;
      canvas = undefined;
    }

    if (!canvas) {
      canvasEl = getCanvasElement();
    }

    opts = utils$1.getOptions(opts);
    var size = utils$1.getImageWidth(qrData.modules.size, opts);

    var ctx = canvasEl.getContext('2d');
    var image = ctx.createImageData(size, size);
    utils$1.qrToImageData(image.data, qrData, opts);

    clearCanvas(ctx, canvasEl, size);
    ctx.putImageData(image, 0, 0);

    return canvasEl
  };

  exports.renderToDataURL = function renderToDataURL (qrData, canvas, options) {
    var opts = options;

    if (typeof opts === 'undefined' && (!canvas || !canvas.getContext)) {
      opts = canvas;
      canvas = undefined;
    }

    if (!opts) opts = {};

    var canvasEl = exports.render(qrData, canvas, opts);

    var type = opts.type || 'image/png';
    var rendererOpts = opts.rendererOpts || {};

    return canvasEl.toDataURL(type, rendererOpts.quality)
  };
  });
  var canvas_1 = canvas.render;
  var canvas_2 = canvas.renderToDataURL;

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/can-promise/index.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/core/qrcode.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/canvas.js

  // node_modules/qrcode/lib/browser.js





  function renderCanvas (renderFunc, canvas$$1, text, opts, cb) {
    var args = [].slice.call(arguments, 1);
    var argsNum = args.length;
    var isLastArgCb = typeof args[argsNum - 1] === 'function';

    if (!isLastArgCb && !canPromise()) {
      throw new Error('Callback required as last argument')
    }

    if (isLastArgCb) {
      if (argsNum < 2) {
        throw new Error('Too few arguments provided')
      }

      if (argsNum === 2) {
        cb = text;
        text = canvas$$1;
        canvas$$1 = opts = undefined;
      } else if (argsNum === 3) {
        if (canvas$$1.getContext && typeof cb === 'undefined') {
          cb = opts;
          opts = undefined;
        } else {
          cb = opts;
          opts = text;
          text = canvas$$1;
          canvas$$1 = undefined;
        }
      }
    } else {
      if (argsNum < 1) {
        throw new Error('Too few arguments provided')
      }

      if (argsNum === 1) {
        text = canvas$$1;
        canvas$$1 = opts = undefined;
      } else if (argsNum === 2 && !canvas$$1.getContext) {
        opts = text;
        text = canvas$$1;
        canvas$$1 = undefined;
      }

      return new Promise(function (resolve, reject) {
        try {
          var data = qrcode.create(text, opts);
          resolve(renderFunc(data, canvas$$1, opts));
        } catch (e) {
          reject(e);
        }
      })
    }

    try {
      var data = qrcode.create(text, opts);
      cb(null, renderFunc(data, canvas$$1, opts));
    } catch (e) {
      cb(e);
    }
  }

  var create$2 = qrcode.create;
  var toCanvas = renderCanvas.bind(null, canvas.render);
  var toDataURL = renderCanvas.bind(null, canvas.renderToDataURL);

  // only svg for now.
  var toString_1 = renderCanvas.bind(null, function (data, _, opts) {
    return svgTag.render(data, opts)
  });

  var browser$1 = {
  	create: create$2,
  	toCanvas: toCanvas,
  	toDataURL: toDataURL,
  	toString: toString_1
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/png.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/utf8.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/terminal.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/renderer/svg.js

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/browser.js

  // node_modules/qrcode/lib/server.js







  function checkParams (text, opts, cb) {
    if (typeof text === 'undefined') {
      throw new Error('String required as first argument')
    }

    if (typeof cb === 'undefined') {
      cb = opts;
      opts = {};
    }

    if (typeof cb !== 'function') {
      if (!canPromise()) {
        throw new Error('Callback required as last argument')
      } else {
        opts = cb || {};
        cb = null;
      }
    }

    return {
      opts: opts,
      cb: cb
    }
  }

  function getTypeFromFilename (path) {
    return path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
  }

  function getRendererFromType (type) {
    switch (type) {
      case 'svg':
        return svg

      case 'txt':
      case 'utf8':
        return utf8

      case 'png':
      case 'image/png':
      default:
        return png$1
    }
  }

  function getStringRendererFromType (type) {
    switch (type) {
      case 'svg':
        return svg

      case 'terminal':
        return terminal

      case 'utf8':
      default:
        return utf8
    }
  }

  function render$2 (renderFunc, text, params) {
    if (!params.cb) {
      return new Promise(function (resolve, reject) {
        try {
          var data = qrcode.create(text, params.opts);
          return renderFunc(data, params.opts, function (err, data) {
            return err ? reject(err) : resolve(data)
          })
        } catch (e) {
          reject(e);
        }
      })
    }

    try {
      var data = qrcode.create(text, params.opts);
      return renderFunc(data, params.opts, params.cb)
    } catch (e) {
      params.cb(e);
    }
  }

  var create$3 = qrcode.create;

  var toCanvas$1 = browser$1.toCanvas;

  var toString_1$1 = function toString (text, opts, cb) {
    var params = checkParams(text, opts, cb);
    var renderer = getStringRendererFromType(params.opts.type);
    return render$2(renderer.render, text, params)
  };

  var toDataURL$1 = function toDataURL (text, opts, cb) {
    var params = checkParams(text, opts, cb);
    var renderer = getRendererFromType(params.opts.type);
    return render$2(renderer.renderToDataURL, text, params)
  };

  var toFile = function toFile (path, text, opts, cb) {
    if (typeof path !== 'string' || typeof text !== 'string') {
      throw new Error('Invalid argument')
    }

    if ((arguments.length < 3) && !canPromise()) {
      throw new Error('Too few arguments provided')
    }

    var params = checkParams(text, opts, cb);
    var type = params.opts.type || getTypeFromFilename(path);
    var renderer = getRendererFromType(type);
    var renderToFile = renderer.renderToFile.bind(null, path);

    return render$2(renderToFile, text, params)
  };

  var toFileStream = function toFileStream (stream, text, opts) {
    if (arguments.length < 2) {
      throw new Error('Too few arguments provided')
    }

    var params = checkParams(text, opts, stream.emit.bind(stream, 'error'));
    var renderer = getRendererFromType('png'); // Only png support for now
    var renderToFileStream = renderer.renderToFileStream.bind(null, stream);
    render$2(renderToFileStream, text, params);
  };

  var server = {
  	create: create$3,
  	toCanvas: toCanvas$1,
  	toString: toString_1$1,
  	toDataURL: toDataURL$1,
  	toFile: toFile,
  	toFileStream: toFileStream
  };

  //  commonjs-proxy:/Users/dtai/work/hanzo/el-controls/node_modules/qrcode/lib/server.js

  // node_modules/qrcode/lib/index.js
  /*
  *copyright Ryan Day 2012
  *
  * Licensed under the MIT license:
  *   http://www.opensource.org/licenses/mit-license.php
  *
  * this is the main server side application file for node-qrcode.
  * these exports use serverside canvas api methods for file IO and buffers
  *
  */

  var lib$1 = server;

  // templates/controls/qrcode.pug
  var html$6 = "\n<canvas></canvas>";

  // src/controls/qrcode.coffee
  var QRCode;

  var qrcode$1 = QRCode = (function() {
    class QRCode extends ReadOnly$1 {
      init() {
        return super.init();
      }

      onUpdated() {
        var canvas;
        canvas = this.root.children[0];
        return lib$1.toCanvas(canvas, this.getText(), {
          version: parseInt(this.version, 10),
          errorCorrectionLevel: this.errorCorrectionLevel,
          scale: parseInt(this.scale, 10),
          margin: parseInt(this.margin, 10)
        }, function(error) {
          if (error) {
            return console.error(error);
          }
        });
      }

    }
    QRCode.prototype.tag = 'qrcode';

    QRCode.prototype.html = html$6;

    // pass this in optionally to overwrite a specific value
    QRCode.prototype.text = '';

    // version '1' to '40', undefined for automatic detection (default)
    QRCode.prototype.version = void 0;

    // level of error correction
    // 'L' = 7%
    // 'M' = 15% (default)
    // 'Q' = 25%
    // 'H' = 35%
    // 'S' = 50% (unsupported)
    QRCode.prototype.errorCorrectionLevel = 'M';

    // scale of a module
    QRCode.prototype.scale = 4;

    // margin of white area around qr code in pixels
    QRCode.prototype.margin = 4;

    QRCode.prototype.events = {
      updated: function() {
        return this.onUpdated();
      },
      mount: function() {
        return this.onUpdated();
      }
    };

    return QRCode;

  }).call(undefined);

  QRCode.register();

  // src/controls/recaptcha.coffee
  var ReCaptcha;

  var recaptcha = ReCaptcha = (function() {
    // requires <script src='//www.google.com/recaptcha/api.js?render=explicit'/>
    class ReCaptcha extends El$1.View {
      init() {
        var tryRecaptcha;
        if (!this.sitekey) {
          console.error('recaptcha: no sitekey found');
          return;
        }
        tryRecaptcha = () => {
          return requestAnimationFrame(() => {
            try {
              return grecaptcha.render(this.root, {
                sitekey: this.sitekey,
                theme: this.theme,
                callback: (res) => {
                  return this.data.set('user.g-recaptcha-response', res);
                }
              });
            } catch (error) {
              return tryRecaptcha();
            }
          });
        };
        return tryRecaptcha();
      }

    }
    ReCaptcha.prototype.tag = 'recaptcha';

    ReCaptcha.prototype.html = '';

    // sitekey from recaptcha
    // sitekey: null

    // theme ('dark'/'light')
    ReCaptcha.prototype.theme = 'light';

    return ReCaptcha;

  }).call(undefined);

  ReCaptcha.register();

  // src/controls/state-select.coffee
  var StateSelect;

  var stateSelect = StateSelect = (function() {
    class StateSelect extends Select$1 {
      options() {
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
      }

      getCountry() {
        return '';
      }

      init() {
        return super.init();
      }

    }
    StateSelect.prototype.tag = 'state-select';

    return StateSelect;

  }).call(undefined);

  StateSelect.register();

  // templates/controls/textarea.pug
  var html$7 = "\n<yield from=\"input\">\n  <textarea class=\"{invalid: errorMessage, valid: valid, labeled: label}\" id=\"{ getId() }\" name=\"{ getName() }\" onchange=\"{ change }\" onblur=\"{ change }\" rows=\"{ rows }\" cols=\"{ cols }\" disabled=\"{ disabled }\" maxlength=\"{ maxlength }\" placeholder=\"{ placeholder }\" readonly=\"{ readonly }\" wrap=\"{ wrap }\">{ input.ref.get(input.name) }</textarea>\n</yield>\n<yield from=\"label\">\n  <div class=\"label active\" if=\"{ label }\">{ label }</div>\n</yield>\n<yield from=\"error\">\n  <div class=\"error\" if=\"{ errorMessage }\">{ errorMessage }</div>\n</yield>\n<yield from=\"instructions\">\n  <div class=\"helper\" if=\"{ instructions &amp;&amp; !errorMessage }\">{ instructions }</div>\n</yield>\n<yield></yield>";

  // src/controls/textbox.coffee
  var TextBox;

  TextBox = (function() {
    class TextBox extends Text$1 {}
    TextBox.prototype.tag = 'textbox';

    TextBox.prototype.html = html$7;

    TextBox.prototype.formElement = 'textarea';

    TextBox.prototype.rows = null;

    TextBox.prototype.cols = null;

    TextBox.prototype.disabled = false;

    TextBox.prototype.maxlength = null;

    TextBox.prototype.readonly = false;

    TextBox.prototype.wrap = null;

    return TextBox;

  }).call(undefined);

  TextBox.register();

  var TextBox$1 = TextBox;

  // src/controls/index.coffee

  // src/index.coffee

  exports.Events = Events$1;
  exports.CheckBox = checkbox;
  exports.Control = Control$1;
  exports.Copy = copy;
  exports.CountrySelect = countrySelect;
  exports.Currency = currency;
  exports.Dropdown = dropdown;
  exports.QRCode = qrcode$1;
  exports.ReCaptcha = recaptcha;
  exports.ReadOnly = ReadOnly$1;
  exports.Select = Select$1;
  exports.StateSelect = stateSelect;
  exports.Text = Text$1;
  exports.TextBox = TextBox$1;

  return exports;

}({},buffer,util,Stream,zlib,assert,require$$0));
//# sourceMappingURL=elcontrols.js.map
