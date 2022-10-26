import lists from './routes/lists.mjs';
import views from './routes/views.mjs';

export default (app, graphQLFields) => {

  lists(app)
  views(app)

  return app
}