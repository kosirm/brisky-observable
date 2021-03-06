'use strict'
const isObj = require('vigour-util/is/obj')
const findType = require('./type')

// is this the final api?
exports.define = {
  off (val, nocontext) {
    var emitter = this
    const context = emitter.__c
    const type = typeof val
    var storageKey, storage
    if (type === 'string' || type === 'number') {
      storageKey = findType(val, emitter)
      if (!nocontext) {
        emitter = resolveContext(emitter, context, storageKey)
      }
      storage = emitter[storageKey]
      if (storage) {
        storage.removeProperty(storage[val], val, false, true)
      }
    } else if (val instanceof Array) {
      storage = emitter.attach
      const len = val.length
      storage.each((p, key) => {
        var wrong
        for (let i = 0; i < len; i++) {
          if (p[i] !== val[i]) {
            wrong = true
            break
          }
        }
        if (!wrong) {
          storage.removeProperty(key, val, false, true)
          return true
        }
      })
    } else {
      findAndRemove(emitter, val, nocontext)
    }
  }
}

function resolveContext (emitter, context, storageKey) {
  if (context) {
    let base = emitter.parent.parent
    let type = emitter.key
    let setObj = { on: {} }
    setObj.on[type] = {}
    emitter = (base.set(setObj) || base).emitters[type]
  }
  if (!emitter.hasOwnProperty(storageKey)) {
    emitter.setKey(storageKey, {}, false)
  }
  return emitter
}

function removeFromStorage (storage, val, emitter, field, nocontext) {
  if (storage) {
    var check = val.check
    if (check) {
      storage.each(function (compare, key) {
        if (check(compare)) {
          emitter.off(key, nocontext)
        }
      })
    } else if (field !== void 0) {
      storage.each(function (compare, key) {
        if (compare[field] === val) {
          emitter.off(key, nocontext)
        }
      })
    } else {
      storage.each(function (compare, key) {
        if (compare === val) {
          emitter.off(key, nocontext)
        }
      })
    }
  }
}

function findAndRemove (emitter, val, nocontext) {
  if (isObj(val)) {
    if (val.fn) {
      removeFromStorage(emitter.fn, val.fn, emitter, void 0, true)
    }
    if (val.attach) {
      removeFromStorage(
        emitter.attach,
        val.attach,
        emitter,
        typeof val.attach === 'function' ? 0 : 1,
        true
      )
    }
    if (val.base) {
      removeFromStorage(emitter.base, val.base, emitter, void 0, true)
    }
  } else if (typeof val === 'function') {
    removeFromStorage(emitter.fn, val, emitter, void 0, true)
    removeFromStorage(emitter.attach, val, emitter, 0, true)
  } else if (typeof val === 'object' && val.isBase) {
    removeFromStorage(emitter.base, val, emitter, void 0, true)
    removeFromStorage(emitter.attach, val, emitter, 1, true)
  }
}
