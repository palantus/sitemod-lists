import express from "express"
const { Router, Request, Response } = express;
const route = Router();
import { sanitize } from "entitystorage";
import { validateAccess, noGuest } from "../../../../services/auth.mjs"
import List from "../../models/list.mjs";
import ListItem from "../../models/listitem.mjs";

export default (app) => {

  const route = Router();
  app.use("/lists", route)

  route.get('/main', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.read" })) return;
    let lists = List.allMain(res.locals.user)
    res.json(lists.map(list => ({ id: list._id, title: list.title, rights: list.rights(res.locals.user) })));
  });

  route.get('/export', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.read" })) return;
    let lists = List.all(res.locals.user)
    res.json(lists.map(list => list.toObjFull(res.locals.user, res.locals.shareKey)));
  });

  route.get('/:id', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.read" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'r')) return;
    res.json(list.toObj(res.locals.user, res.locals.shareKey));
  });

  route.post('/', noGuest, function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = new List(req.body.title, res.locals.user)
    res.json(list.toObj(res.locals.user, res.locals.shareKey));
  });

  route.delete('/:id', noGuest, function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'w')) return;
    list.delete();
    res.json(true);
  });

  route.patch('/:id', noGuest, function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (list.related.owner?._id != res.locals.user._id) return res.status(403).json({ error: `Only owner can do this` });

    if (req.body.title !== undefined) list.title = req.body.title;
    if (req.body.color !== undefined) list.color = req.body.color;
    if (req.body.archived !== undefined) { if (req.body.archived) list.tag("archived"); else list.removeTag("archived"); }
    if (req.body.keepSorted !== undefined) list.keepSorted = !!req.body.keepSorted;
    if (req.body.subList !== undefined) { if (req.body.subList) list.tag("sublist"); else list.removeTag("sublist"); }

    res.json(list.toObj(res.locals.user, res.locals.shareKey));
  });

  route.post('/:id/items', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'w')) return;
    if (req.body.type == "ref" && (!req.body.refType || !req.body.refValue)) throw "Missing refType or refValue for reference"
    let item;
    if (req.body.type == "sub") {
      let subList = new List(req.body.text || "New sub-list", res.locals.user, { type: "sub" })
      item = new ListItem({ type: "ref", refType: "list", refValue: subList._id, text: subList.title })
    } else {
      item = new ListItem({ type: req.body.type, text: req.body.text, refType: sanitize(req.body.refType), refValue: sanitize(req.body.refValue) })
    }

    list.rel(item, "item")
    res.json(item.toObj());
  });

  route.post('/:id/deletechecked', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'w')) return;
    list.rels.item?.forEach(i => {
      if (i.tags.includes("checked")) i.delete();
    })
    res.json(true)
  });

  route.patch('/:id/items/:item', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'w')) return;
    let item = ListItem.lookup(sanitize(req.params.item))
    if (!item) { res.sendStatus(404); return; }

    if (req.body.text !== undefined) {
      item.text = req.body.text;
    }
    if (req.body.checked !== undefined) {
      if (req.body.checked) item.tag("checked");
      else item.removeTag("checked");
    }
    if (req.body.refType !== undefined) item.refType = sanitize(req.body.refType)
    if (req.body.refValue !== undefined) item.refValue = sanitize(req.body.refValue)
    if (typeof req.body.moveBefore === "number" || typeof req.body.moveAfter === "number")
      item.moveBetween(typeof req.body.moveAfter === "number" ? req.body.moveAfter : null, typeof req.body.moveBefore === "number" ? req.body.moveBefore : null)

    if (req.body.text !== undefined || req.body.refType !== undefined || req.body.refValue !== undefined) {
      item.updateHTML();
    }

    res.json(item.toObj());
  });

  route.get('/:id/items/:item', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'r')) return;
    let item = ListItem.lookup(sanitize(req.params.item))
    if (!item) { res.sendStatus(404); return; }
    res.json(item.toObjFull());
  });

  route.delete('/:id/items/:item', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;
    let list = List.lookup(sanitize(req.params.id))
    if (!list) { res.sendStatus(404); return; }
    if (!list.validateAccess(res, 'w')) return;
    let item = ListItem.lookup(sanitize(req.params.item))
    if (!item) { res.sendStatus(404); return; }
    item.delete();
    res.json(true);
  });

  route.get('/', function(req, res, next) {
    if (!validateAccess(req, res, { permission: "lists.read" })) return;
    let lists = List.all(res.locals.user)
    res.json(lists.map(list => ({ id: list._id, title: list.title, subList: list.tags.includes("sublist"), archived: list.tags.includes("archived") })));
  });

  route.post("/import", async (req, res) => {
    if (!validateAccess(req, res, { permission: "lists.edit" })) return;

    if (req.body.type == "legacy") {
      let bucketId = "" + req.body.bucketId
      let bucketName = "" + req.body.title || "Imported bucket"

      if (!bucketId) { res.sendStatus(404); return; }

      let rBucket;
      try {
        rBucket = await (await fetch(`https://lists.ahkpro.dk/api/GetBucket?id=${bucketId}`)).json()
      } catch (err) {
        console.log(err)
      }

      if (!rBucket || !rBucket.success)
        return res.sendStatus(404);

      let lists = rBucket.result.lists;

      for(let id of lists.map(l => l.id)){
        let rList;
        try {
          rList = await (await fetch(`https://lists.ahkpro.dk/api/GetList?id=${id}`)).json()
        } catch (err) {
          console.log(err)
        }
        if (!rList || !rList.success)
          continue;
        rList = rList.result;

        let list = new List(rList.Title, res.locals.user);

        for(let rItem of rList.items){
          let item = new ListItem({text: rItem.Title})
          if(rItem.finished) item.tag("checked");
          list.rel(item, "item");
        }
      }
      res.json({ success: true })
    } else if(req.body.type == "json"){
      try{
        let json = ""+req.body.json
        let lists = JSON.parse(json)
        if(!Array.isArray(lists)) throw "Must be an array"
        for(let l of lists){
          if(!Array.isArray(l.items)) continue;

          let list = new List((l.title || "New list").substring(0, 500), res.locals.user)
          list.keepSorted = l.keepSorted || false;
          list.color = l.color || null;
          if(l.archived) list.tag("archived")
          if(l.subList) list.tag("sublist")
          for(let i of l.items){
            let item = new ListItem({text: i.text});
            if(i.checked) item.tag("checked");
            if(i.orderIdx) item.orderIdx = i.orderIdx;
            if(i.refType) item.refType = i.refType;
            if(i.refValue) item.refValue = i.refValue;
            item.updateHTML();
            list.rel(item, "item");
          }
        }
        res.json({success:true})
      } catch(err){
        console.log(err)
        res.sendStatus(501)
      }
    }
  })
};
