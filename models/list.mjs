import Entity from "entitystorage"
import ListItem from "./listitem.mjs";

export default class List extends Entity {
  initNew(title, owner, {type} = {}) {
    this.title = typeof title === "string" ? title.substring(0, 9999) : '' || "New list";

    this.rel(owner, "owner")
    this.tag("list")

    if(type == "sub")
      this.tag("sublist")
  }

  static lookup(id) {
    if(!id) return null;
    return List.find(`id:"${id}" tag:list`)
  }

  static all(user){
    return List.search(`tag:list owner.id:${user}`)
  }

  static allMain(user){
    return List.search(`tag:list owner.id:${user} !tag:sublist !tag:archived`)
  }

  delete(){
    this.rels.item?.forEach(i => i.delete())
    ListItem.allFromListRef(this).forEach(i => i.delete())
    super.delete()
  }

  toObj() {
    return {
      id: this._id, 
      title: this.title,
      color: this.color||null,
      items: this.rels.item?.map(i => ListItem.from(i).toObj()) || [],
      subList: this.tags.includes("sublist"),
      archived: this.tags.includes("archived"),
      keepSorted: typeof this.keepSorted === "boolean" ? this.keepSorted : false
    }
  }

  toObjFull() {
    
    return {
      id: this._id, 
      title: this.title,
      color: this.color||null,
      items: this.rels.item?.map(i => ListItem.from(i).toObjFull()) || [],
      subList: this.tags.includes("sublist"),
      archived: this.tags.includes("archived"),
      keepSorted: typeof this.keepSorted === "boolean" ? this.keepSorted : false
    }
  }
}