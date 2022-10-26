routes.push(...[
  {path: "/lists",                  page: "../pages/lists.mjs"},
  {path: "/listviews",              page: "../pages/lists-views.mjs"},
  {regexp: /^\/listview\/([0-9]+)/,     page: "../pages/lists-view.mjs"},
  {regexp: /^\/list\/([0-9]+)/,     page: "../pages/list.mjs", publicAccess: true},
])