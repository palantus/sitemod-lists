import Entity, {query} from "entitystorage"
import DataType from "../../../models/datatype.mjs"

export default class ListItem extends Entity {
  initNew({type, text, refType, refValue}) {

    switch(type){
      case "ref":
        this.type = "ref";
        let type = DataType.lookup(refType)
        if(!type) throw "Unknown data type for list ref"
        this.refType = ""+refType;
        this.refValue = ""+refValue;
        this.text = typeof text === "string" ? text.substring(0, 9999) : '' || null;
        break;

      default:
        this.type = "item";
        this.text = text || "New item";
    }

    this.updateHTML()

    this.tag("listitem")
  }

  updateHTML(){
    let textHTMLValue = (this.text||"").replace(/\[\[([a-zA-Z0-9\-]+)\]\]/g, (grp, pageId) => `<a href="/wiki/${pageId}">${Entity.find(`tag:wiki prop:id=${pageId}`)?.title||pageId}</a>`)
                                       .replace(/\[\[(\/[a-zA-Z0-9\-\/\?\&\=]+)\]\]/g, (grp, link) => `<a href="${link}">${link.slice(1).split("/").map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(" ")}</a>`)

    if(this.type == "ref"){
      let type = DataType.lookup(this.refType)
      if(!type) return this.textHTML = "UNKNOWN TYPE";
      let defaultText = type.showId ? `${type.title} ${this.refValue}` : type.title
      if(type.uiPath)
        this.textHTML = `<a href="/${type.uiPath}/${this.refValue}">${textHTMLValue || defaultText}</a>`
      else
        this.textHTML = textHTMLValue || defaultText
    } else {
      this.textHTML = textHTMLValue
    }
  }

  static lookup(id) {
    if(!id) return null;
    return query.type(ListItem).id(id).tag("listitem").first
  }

  static allFromListRef(list) {
    if(!list) return [];
    return query.type(ListItem).tag("listitem").prop("type", "ref").prop("refType", "list").prop("refValue", list._id).all
  }

  static all(){
    return query.type(ListItem).tag("listitem").all
  }

  toObj() {
    return {
      id: this._id,
      textHTML: this.textHTML,
      checked: this.tags.includes("checked")
    }
  }

  toObjFull() {
    
    return {
      ...this.toObj(),
      type: this.type,
      refType: this.refType,
      refValue: this.refValue,
      text: this.text
    }
  }
}