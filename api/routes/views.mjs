import express from "express"
const { Router, Request, Response } = express;
const route = Router();
import {sanitize} from "entitystorage";
import {validateAccess, noGuest} from "../../../../services/auth.mjs"
import List from "../../models/list.mjs";
import ListView from "../../models/listview.mjs";

export default (app) => {

  const route = Router();
  app.use("/listview", route)

  route.get('/:id', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.read"})) return;
    let view = ListView.lookup(req.params.id)
    if(!view) { res.sendStatus(404); return; }
    if(!view.validateAccess(res.locals.user)) return res.sendStatus(401);
    res.json(view.toObj(res.locals.user, res.locals.shareKey));
  });

  route.post('/', noGuest, function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let view = new ListView(req.body.title, res.locals.user)
    res.json(view.toObj(res.locals.user, res.locals.shareKey));
  });

  route.delete('/:id', noGuest, function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let view = ListView.lookup(req.params.id)
    if(!view) return res.sendStatus(404);
    if(!view.validateAccess(res.locals.user)) return res.sendStatus(401);
    view.delete();
    res.json(true);
  });

  route.patch('/:id', noGuest, function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let view = ListView.lookup(req.params.id)
    if(!view) { res.sendStatus(404); return; }
    if(!view.validateAccess(res.locals.user)) return res.sendStatus(401);
    
    if(req.body.title !== undefined) view.title = req.body.title;

    res.json(view.toObj(res.locals.user, res.locals.shareKey));
  });

  route.post('/:id/lists', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let view = ListView.lookup(req.params.id)
    if(!view) { res.sendStatus(404); return; }
    if(!view.validateAccess(res.locals.user)) return res.sendStatus(401);

    let list = List.lookup(req.body.listId)
    if(!list) { res.sendStatus(404); return; }
    if(!list.validateAccess(res, 'r')) return;

    view.addList(list)
    res.json({success: true});
  });
  
  route.delete('/:id/lists/:list', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let view = ListView.lookup(req.params.id)
    if(!view) { res.sendStatus(404); return; }
    if(!view.validateAccess(res.locals.user)) return res.sendStatus(401);

    let list = List.lookup(req.params.list)
    if(!list) { res.sendStatus(404); return; }
    if(!list.validateAccess(res, 'r')) return;

    view.removeList(list)
    res.json({success: true});
  });

  route.get('/', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.read"})) return;
    let views = ListView.all(res.locals.user)
    res.json(views.map(view => ({id: view._id, title: view.title})));
  });
};