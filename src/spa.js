// SPA navigation helper: pushState + App er popstate listener trigger kore.
// (Ager '#/blog' link gulo pathname-routing e kaj korena, tai ei helper)
export const go = (path) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

// <a href="/blog" onClick={nav('/blog')}> : normal click e SPA navigate,
// ctrl/cmd/middle click e browser er default (new tab) kaj korbe
export const nav = (path) => (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  go(path)
}
