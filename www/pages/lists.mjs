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
    #filters{margin-left: 3px; padding-top: 1px; border-left: 1px solid lightgray; padding-left: 5px;}
    #filters label{user-select: none;}
    div.lists-container{display: none; margin-top: 20px;}
    div.lists-container h2{margin-bottom: 0px; margin-left: 10px;}
    #graveyard{display: none;}
  </style>  

  <action-bar>
      <action-bar-item id="new-btn">New list</action-bar-item>
      <action-bar-item id="refresh-btn">Refresh</action-bar-item>
      <div id="filters">
        <input type="checkbox" id="show-all"></input>
        <label for="show-all">Show all</label>
      </div>
  </action-bar>

  <div id="container">
    <div id="lists">
    </div>

    <div id="sublists-container" class="lists-container">
      <h2>Sub lists:</h2>
      <div id="sublists">
      </div>
    </div>

    <div id="archive-container" class="lists-container">
      <h2>Archive:</h2>
      <div id="archive">
      </div>
    </div>

    <div id="graveyard"></div>
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
    this.shadowRoot.getElementById("refresh-btn").addEventListener("click", e => this.refreshData(e, true))
    this.shadowRoot.getElementById("lists").addEventListener("list-deleted", this.refreshData)
    this.shadowRoot.getElementById("lists").addEventListener("list-archived", this.refreshData)
    this.shadowRoot.getElementById("lists").addEventListener("list-added", this.refreshData)
    this.shadowRoot.getElementById("sublists").addEventListener("list-deleted", this.refreshData)
    this.shadowRoot.getElementById("sublists").addEventListener("list-archived", this.refreshData)
    this.shadowRoot.getElementById("sublists").addEventListener("list-added", this.refreshData)
    this.shadowRoot.getElementById("archive").addEventListener("list-deleted", this.refreshData)
    this.shadowRoot.getElementById("archive").addEventListener("list-archived", this.refreshData)
    this.shadowRoot.getElementById("archive").addEventListener("list-added", this.refreshData)
    this.shadowRoot.getElementById("show-all").addEventListener("click", this.refreshData)
  }

  async refreshData(e, force){
    let showAll = this.shadowRoot.getElementById("show-all").checked
    let lists = await api.get(showAll ? "lists" : "lists/main")
    if(force !== true && JSON.stringify(this.lists) == JSON.stringify(lists)) return;
    this.lists = lists

    if(force === true){
      this.shadowRoot.getElementById("lists").innerHTML = ""
      this.shadowRoot.getElementById("sublists").innerHTML = ""
      this.shadowRoot.getElementById("archive").innerHTML = ""
      this.shadowRoot.getElementById("graveyard").innerHTML = ""
    }

    if(e?.originalTarget?.id != "show-all"){
      let view = this.shadowRoot.getElementById("lists");
      this.setListsInView(view, this.lists.filter(l => !l.subList && !l.archived))
    }

    this.shadowRoot.getElementById("sublists-container").style.display = showAll ? "block" : "none"
    if(showAll){
      let view = this.shadowRoot.getElementById("sublists");
      this.setListsInView(view, this.lists.filter(l => l.subList && !l.archived))
    }

    this.shadowRoot.getElementById("archive-container").style.display = showAll ? "block" : "none"
    if(showAll){
      let view = this.shadowRoot.getElementById("archive");
      this.setListsInView(view, this.lists.filter(l => l.archived))
    }
  }

  async setListsInView(view, lists){
    for(let list of lists){
      let comp = this.shadowRoot.querySelector(`data-list-component[listid="${list.id}"]`)
      if(comp){
        if(comp.parentElement !== view){
          comp.remove();
        }
      } else {
        comp = document.createElement("data-list-component")
        comp.setAttribute("listid", list.id)
        console.log("NEW")
      }
      view.appendChild(comp)
    }
    [...view.querySelectorAll("data-list-component")].filter(e => !lists.find(l => l.id == e.getAttribute("listid"))).forEach(e => {
      e.remove()
      this.shadowRoot.getElementById("graveyard").appendChild(e)
    })
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
    on("changed-page", elementName, this.refreshData)
    this.refreshData();
  }

  disconnectedCallback() {
    off("changed-page", elementName)
  }
}

window.customElements.define(elementName, Element);
export {Element, elementName as name}