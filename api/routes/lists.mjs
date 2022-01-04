import express from "express"
const { Router, Request, Response } = express;
const route = Router();
import Entity from "entitystorage";
import userService from "../../../../services/user.mjs"

export let convertRefsToLinks = text => {
  return text.replace(/\[\[([a-zA-Z0-9\-]+)\]\]/g, (grp, pageId) => `<a href="/wiki/${pageId}">${Entity.find(`tag:wiki prop:id=${pageId}`)?.title||pageId}</a>`)
             .replace(/\[\[(\/[a-zA-Z0-9\-\/\?\&\=]+)\]\]/g, (grp, link) => `<a href="${link}">${link.slice(1).split("/").map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(" ")}</a>`)
}

export default (app) => {

  const route = Router();
  app.use("/lists", route)

  let toObj = list => ({
    id: list._id, 
    title: list.title,
    color: list.color||null,
    items: list.rels.item?.map(i => ({
      id: i._id,
      text: i.text,
      textHTML: i.textHTML,
      checked: i.tags.includes("checked")
    }))||[]
  })

  route.get('/:id', function (req, res, next) {
    let list = Entity.find(`tag:list id:${req.params.id}`)
    if(!list) { res.sendStatus(404); return; }
    res.json(toObj(list));
  });

  route.post('/', function (req, res, next) {
    let user = userService(res.locals).me()
    let list = new Entity().tag("list").prop("title", req.body.title||"New list").rel(user, "owner")
    res.json({id: list._id, title: list.title});
  });

  route.delete('/:id', function (req, res, next) {
    let list = Entity.find(`tag:list id:${req.params.id}`)
    if(!list) { res.sendStatus(404); return; }
    list.rels.item?.forEach(i => i.delete())
    list.delete();
    res.json(true);
  });

  route.patch('/:id', function (req, res, next) {
    let list = Entity.find(`tag:list id:${req.params.id}`)
    if(!list) { res.sendStatus(404); return; }
    
    if(req.body.title !== undefined) list.title = req.body.title;
    if(req.body.color !== undefined) list.color = req.body.color;

    res.json({id: list._id, title: list.title});
  });

  route.post('/:id/items', function (req, res, next) {
    let list = Entity.find(`tag:list id:${req.params.id}`)
    if(!list) { res.sendStatus(404); return; }
    let item = new Entity().tag("listitem");
    list.rel(item, "item")
    item.text = req.body.text||"New item"
    item.textHTML = convertRefsToLinks(item.text)
    res.json({id: item._id, text: item.text, textHTML: item.textHTML});
  });

  route.post('/:id/deletechecked', function (req, res, next) {
    let list = Entity.find(`tag:list id:${req.params.id}`)
    if(!list) { res.sendStatus(404); return; }
    list.rels.item?.forEach(i => {
      if(i.tags.includes("checked")) i.delete();
    })
    res.json(true)
  });

  route.patch('/:id/items/:item', function (req, res, next) {
    let item = Entity.find(`tag:listitem id:${req.params.item}`)
    if(!item) { res.sendStatus(404); return; }
    
    if(req.body.text !== undefined) {
      list.text = req.body.text;
      item.textHTML = convertRefsToLinks(item.text)
    }
    if(req.body.checked !== undefined){
      if(req.body.checked) item.tag("checked"); 
      else item.removeTag("checked");
    }

    res.json({id: item._id, text: item.text, textHTML: item.textHTML});
  });
  
  route.delete('/:id/items/:item', function (req, res, next) {
    let item = Entity.find(`tag:listitem id:${req.params.item}`)
    if(!item) { res.sendStatus(404); return; }
    item.delete();
    res.json(true);
  });

  route.get('/', function (req, res, next) {
    let user = userService(res.locals).me()
    let lists = Entity.search(`tag:list owner.id:${user}`)
    res.json(lists.map(list => ({id: list._id, title: list.title})));
  });
};