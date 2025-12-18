'use strict';

var index = require('./index-Cg2jQwez.js');
var appGlobals = require('./app-globals-V2Kpy_OQ.js');

const defineCustomElements = async (win, options) => {
  if (typeof window === 'undefined') return undefined;
  await appGlobals.globalScripts();
  return index.bootstrapLazy([["my-component.cjs",[[769,"my-component",{"first":[1],"middle":[1],"last":[1]}]]],["my-status-badge.cjs",[[769,"my-status-badge",{"type":[1]}]]]], options);
};

exports.setNonce = index.setNonce;
exports.defineCustomElements = defineCustomElements;
//# sourceMappingURL=loader.cjs.js.map

//# sourceMappingURL=loader.cjs.js.map