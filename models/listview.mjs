import Entity, {query} from "entitystorage"
import List from "./list.mjs";

export default class ListView extends Entity {
  initNew(title, owner) {
    this.title = typeof title === "string" ? title.substring(0, 9999) : '' || "New view";
    this.rel(owner, "owner")
    this.tag("listview")
  }

  static lookup(id) {
    if(!id) return null;
    return query.type(ListView).id(id).tag("listview").first
  }

  static all(user){
    return query.type(ListView).tag("listview").all.filter(v => v.validateAccess(user))
  }

  get lists(){
    return this.rels.list?.map(i => List.from(i)) || []
  }

  validateAccess(user){
    return this.related.owner?.id == user?.id
  }

  addList(list){
    this.rel(list, "list")
  }

  removeList(list){
    this.removeRel(list, "list")
  }

  toObj(user, shareKey) {
    return {
      id: this._id, 
      title: this.title,
      lists: this.lists.filter(l => l.hasAccess(user)).map(l => l.toObj(user, shareKey))
    }
  }
}