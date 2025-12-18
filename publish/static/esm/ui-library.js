import { p as promiseResolve, b as bootstrapLazy } from './index-Da-d8Ktn.js';
export { s as setNonce } from './index-Da-d8Ktn.js';
import { g as globalScripts } from './app-globals-DQuL1Twl.js';

/*
 Stencil Client Patch Browser v4.39.0 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  const importMeta = import.meta.url;
  const opts = {};
  if (importMeta !== "") {
    opts.resourcesUrl = new URL(".", importMeta).href;
  }
  return promiseResolve(opts);
};

patchBrowser().then(async (options) => {
  await globalScripts();
  return bootstrapLazy([["my-component",[[769,"my-component",{"first":[1],"middle":[1],"last":[1]}]]],["my-status-badge",[[769,"my-status-badge",{"type":[1]}]]]], options);
});
//# sourceMappingURL=ui-library.js.map

//# sourceMappingURL=ui-library.js.map