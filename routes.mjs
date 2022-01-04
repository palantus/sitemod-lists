routes.push(...[
  {path: "/lists",                  page: "../pages/lists.mjs"},
  {regexp: /\/list\/([0-9]+)/,            page: "../pages/list.mjs"},
])