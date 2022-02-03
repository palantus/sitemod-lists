import express from "express"
const { Router, Request, Response } = express;
const route = Router();
import {sanitize} from "entitystorage";
import {validateAccess} from "../../../../services/auth.mjs"
import List from "../../models/list.mjs";
import ListItem from "../../models/listitem.mjs";

export default (app) => {

  const route = Router();
  app.use("/lists", route)

  route.get('/main', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.read"})) return;
    let lists = List.allMain(res.locals.user)
    res.json(lists.map(list => ({id: list._id, title: list.title})));
  });

  route.get('/:id', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.read"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    res.json(list.toObj());
  });

  route.post('/', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = new List(req.body.title, res.locals.user)
    res.json(list.toObj());
  });

  route.delete('/:id', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    list.delete();
    res.json(true);
  });

  route.patch('/:id', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    
    if(req.body.title !== undefined) list.title = req.body.title;
    if(req.body.color !== undefined) list.color = req.body.color;
    if(req.body.archived !== undefined) {if(req.body.archived) list.tag("archived");  else list.removeTag("archived");}

    res.json(list.toObj());
  });

  route.post('/:id/items', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    if(req.body.type == "ref" && (!req.body.refType || !req.body.refValue)) throw "Missing refType or refValue for reference"
    let item;
    if(req.body.type == "sub"){
      let subList = new List(req.body.text || "New sub-list", res.locals.user, {type: "sub"})
      item = new ListItem({type: "ref", refType: "list", refValue: subList._id, text: subList.title})
    } else {
      item = new ListItem(req.body)
    }
    
    list.rel(item, "item")
    res.json(item.toObj());
  });

  route.post('/:id/deletechecked', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    list.rels.item?.forEach(i => {
      if(i.tags.includes("checked")) i.delete();
    })
    res.json(true)
  });

  route.patch('/:id/items/:item', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let list = List.lookup(sanitize(req.params.id))
    if(!list) { res.sendStatus(404); return; }
    let item = ListItem.lookup(sanitize(req.params.item))
    if(!item) { res.sendStatus(404); return; }
    
    if(req.body.text !== undefined) {
      item.text = req.body.text;
      item.updateHTML();
    }
    if(req.body.checked !== undefined){
      if(req.body.checked) item.tag("checked"); 
      else item.removeTag("checked");
    }

    res.json(item.toObj());
  });
  
  route.delete('/:id/items/:item', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.edit"})) return;
    let item = ListItem.lookup(sanitize(req.params.item))
    if(!item) { res.sendStatus(404); return; }
    item.delete();
    res.json(true);
  });

  route.get('/', function (req, res, next) {
    if(!validateAccess(req, res, {permission: "lists.read"})) return;
    let lists = List.all(res.locals.user)
    res.json(lists.map(list => ({id: list._id, title: list.title, subList: list.tags.includes("sublist"), archived: list.tags.includes("archived")})));
  });
};