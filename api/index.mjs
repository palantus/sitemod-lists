import lists from './routes/lists.mjs';

export default (app, graphQLFields) => {

  lists(app)

  return app
}