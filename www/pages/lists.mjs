const elementName = 'lists-page'

import api from "/system/api.mjs"
import "/components/action-bar.mjs"
import "/components/action-bar-item.mjs"
import "/components/field-ref.mjs"
import "/components/field.mjs"
import {on, off, fire} from "/system/events.mjs"
import {state} from "/system/core.mjs"
import {showDialog} from "/components/dialog.mjs"
import "/components/data/list.mjs"
import { promptDialog } from "../../components/dialog.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <link rel='stylesheet' href='/css/global.css'>
  <link rel='stylesheet' href='/css/searchresults.css'>
  <style>
    #container{
        position: relative;
    }
    data-list-component{
      display: inline-block;
      margin-top: 10px;
      margin-left: 10px;
      max-width: 500px;
      vertical-align: top;
    }
    #lists{
      display: flex;
      flex-wrap: wrap;
    }
  </style>  

  <action-bar>
      <action-bar-item id="new-btn">New list</action-bar-item>
  </action-bar>

  <div id="container">
    <div id="lists">
    </div>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.refreshData = this.refreshData.bind(this);
    this.newList = this.newList.bind(this);
    
    this.shadowRoot.getElementById("new-btn").addEventListener("click", this.newList)
    this.shadowRoot.getElementById("lists").addEventListener("list-deleted", e => {
      this.shadowRoot.querySelector(`data-list-component[listid="${e.detail.listId}"]`)?.remove()
    })
  }
  async refreshData(){
    let lists = await api.get("lists")
    if(JSON.stringify(this.lists) == JSON.stringify(lists)) return;
    this.lists = lists;
    let view = this.shadowRoot.getElementById("lists");
    view.innerHTML = ""
    this.lists.forEach(list => this.addListToView(view, list))
  }

  async addListToView(view, list){
    let comp = document.createElement("data-list-component")
    comp.setAttribute("listid", list.id)
    view.appendChild(comp)
  }

  async newList(){
    let title = await promptDialog("Enter list title")
    if(!title) return;
    let list = await api.post("lists", {title})
    this.addListToView(this.shadowRoot.getElementById("lists"), list)
  }

  connectedCallback() {
    on("changed-project", elementName, this.refreshData)
    on("changed-page", elementName, this.refreshData)
    this.refreshData();
  }

  disconnectedCallback() {
    off("changed-project", elementName)
    off("changed-page", elementName)
  }
}

window.customElements.define(elementName, Element);
export {Element, elementName as name}