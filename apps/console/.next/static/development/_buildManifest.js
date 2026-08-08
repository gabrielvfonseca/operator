self.__BUILD_MANIFEST = ((a) => ({
  __rewrites: {
    afterFiles: [
      { has: a, source: "\u002Fcontrol-ui\u002Fcontrol-ui\u002Fapi\u002F:path*", destination: a },
      { has: a, source: "\u002Fcontrol-ui\u002Fcontrol-ui\u002Fws\u002F:path*", destination: a },
    ],
    beforeFiles: [],
    fallback: [],
  },
  __routerFilterStatic: a,
  __routerFilterDynamic: a,
  sortedPages: ["\u002F_app"],
}))(void 0);
self.__BUILD_MANIFEST_CB?.();
