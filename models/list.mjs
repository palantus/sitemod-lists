import Entity from "entitystorage"
import ListItem from "./listitem.mjs";
import ACL from "../../../models/acl.mjs"
import DataType from "../../../models/datatype.mjs";

export default class List extends Entity {
  initNew(title, owner, {type} = {}) {
    this.title = typeof title === "string" ? title.substring(0, 9999) : '' || "New list";

    this.tag("list")

    if(type == "sub")
      this.tag("sublist")

    ACL.setDefaultACLOnEntity(this, owner, DataType.lookup("list"))
  }

  static lookup(id) {
    if(!id) return null;
    return List.find(`id:"${id}" tag:list`)
  }

  static all(user){
    let type = DataType.lookup("list")
    return List.search(`tag:list`).filter(l => new ACL(l, type).hasAccess(user, 'r'))
  }

  static allMain(user){
    let type = DataType.lookup("list")
    return List.search(`tag:list !tag:sublist !tag:archived`).filter(l => new ACL(l, type).hasAccess(user, 'r'))
  }

  delete(){
    this.rels.item?.forEach(i => i.delete())
    ListItem.allFromListRef(this).forEach(i => i.delete())
    super.delete()
  }

  hasAccess(user, right = 'r'){
    return new ACL(this, DataType.lookup("list")).hasAccess(user, right)
  }

  validateAccess(res, right, respondIfFalse = true){
    return new ACL(this, DataType.lookup("list")).validateAccess(res, right, respondIfFalse)
  }

  rights(user, shareKey){
    let acl = new ACL(this, DataType.lookup("list"))
    return "" + (acl.hasAccess(user, "r", shareKey)?'r':'') + (acl.hasAccess(user, "w", shareKey)?'w':'')
  }

  toObj(user, shareKey) {
    return {
      id: this._id, 
      title: this.title,
      color: this.color||null,
      items: this.rels.item?.map(i => ListItem.from(i).toObj()) || [],
      subList: this.tags.includes("sublist"),
      archived: this.tags.includes("archived"),
      keepSorted: typeof this.keepSorted === "boolean" ? this.keepSorted : false,
      rights: this.rights(user, shareKey)
    }
  }

  toObjFull(user, shareKey) {
    
    return {
      id: this._id, 
      title: this.title,
      color: this.color||null,
      items: this.rels.item?.map(i => ListItem.from(i).toObjFull()) || [],
      subList: this.tags.includes("sublist"),
      archived: this.tags.includes("archived"),
      keepSorted: typeof this.keepSorted === "boolean" ? this.keepSorted : false,
      rights: this.rights(user, shareKey)
    }
  }
}