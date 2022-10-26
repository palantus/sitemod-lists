const elementName = 'listview-page'

import api from "/system/api.mjs"
import {state, isMobile} from "/system/core.mjs"
import "/components/action-bar.mjs"
import "/components/action-bar-item.mjs"
import "/components/field-ref.mjs"
import "/components/field.mjs"
import "/components/action-bar-menu.mjs"
import {on, off} from "/system/events.mjs"
import "/components/data/list.mjs"
import { showDialog, alertDialog } from "../../components/dialog.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <link rel='stylesheet' href='/css/global.css'>
  <link rel='stylesheet' href='/css/searchresults.css'>
  <style>
    #container{
      position: relative;
      padding: 5px;
    }
    #choose-lists-lists td:first-child{
      width: 21px;
    }
    #items-tab tr th{
      border-bottom: 1px solid gray;
    }
    #move{cursor:move;}
    action-bar label{
      border-left: 1px solid var(--contrast-color);
      padding-left: 10px;
      margin-left: 5px;
      padding-top: 3px;
    }
    .hidden{display: none;}
  </style>  

  <action-bar>
      <action-bar-item id="refresh-btn">Refresh</action-bar-item>
      <action-bar-item id="choose-lists-btn">Select lists</action-bar-item>
      <label for="view-checked">View checked</label>
      <input type="checkbox" id="view-checked"></input>
  </action-bar>

  <div id="container">
    <table id="items-tab">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th>List</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody id="items">
      </tbody>
    </table>

    <dialog-component title="Select lists" id="choose-lists-dialog">
      <table>
        <tbody id="choose-lists-lists">
        </tbody>
      </table>
    </dialog-component>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.refreshData = this.refreshData.bind(this);
    this.chooseLists = this.chooseLists.bind(this)
    this.itemsClick = this.itemsClick.bind(this)
    
    this.shadowRoot.getElementById("choose-lists-btn").addEventListener("click", this.chooseLists)
    this.shadowRoot.getElementById("refresh-btn").addEventListener("click", e => this.refreshData(e, true))
    this.shadowRoot.getElementById("view-checked").addEventListener("change", this.refreshData)

    this.viewId = /(\d+)/.exec(state().path)[0]

    this.shadowRoot.getElementById("items").addEventListener("click", this.itemsClick)
    this.shadowRoot.getElementById("items").addEventListener("mousedown", e => {
      if (!e.target.classList.contains("draggable")) return;

      let getElementIndex = elem => {
        let i = 0;
        while ((elem = elem.previousElementSibling) != null) ++i;
        return i;
      }

      let itemDiv = e.target.closest("tr.item")
      let si = getElementIndex(itemDiv)
      let sy = e.pageY
      let b = document.body
      let drag;

      b.classList.add("grabCursor")
      b.style.userSelect = "none"
      itemDiv.classList.add("grabbed");

      let move = e => {
        if(!itemDiv || itemDiv.parentElement != this.shadowRoot.getElementById("items")){
          document.removeEventListener("mousemove", move)
          document.removeEventListener("mouseup", up);
        }
        if (!drag && Math.abs(e.pageY - sy) < 10)
          return;

        drag = true;
        this.shadowRoot.getElementById("items").querySelectorAll("tr.item").forEach(sib => {
          if (sib == itemDiv) return;
          var s = sib
          let i = getElementIndex(s)
          let y = s.getBoundingClientRect().top;

          if (i >= 0 && e.pageY >= y && e.pageY < y + s.getBoundingClientRect().height) {
            if (i < getElementIndex(itemDiv))
              this.shadowRoot.getElementById("items").insertBefore(s, itemDiv.nextElementSibling)
            else
              this.shadowRoot.getElementById("items").insertBefore(s, itemDiv);
            return false;
          }
        });
      };

      let up = e => {
        if (drag && si != getElementIndex(itemDiv)) {
          drag = false;
          let listId = itemDiv.getAttribute("data-listid")
          let previousId = itemDiv.previousElementSibling?.getAttribute("data-itemid")
          let nextId = itemDiv.nextElementSibling?.getAttribute("data-itemid")
          let id = itemDiv.getAttribute("data-itemid")
          if(!id || (!previousId && !nextId)) return;
          api.patch(`lists/${listId}/items/${id}`, {moveBefore: parseInt(nextId), moveAfter: parseInt(previousId)})
        }
        document.removeEventListener("mousemove", move)
        document.removeEventListener("mouseup", up);
        b.classList.remove("grabCursor")
        b.style.userSelect = "initial";
        itemDiv.classList.remove("grabbed");
        e.stopPropagation();
        e.preventDefault()
      }

      document.addEventListener("mousemove", move)
      document.addEventListener("mouseup", up)
      e.stopPropagation();
    })
  }

  async refreshData(e, force){
    if(!this.viewId || isNaN(this.viewId)) return;
    let viewChecked = this.shadowRoot.getElementById("view-checked").checked
    let isMobileView = isMobile()

    try{
      this.view = await api.get(`listview/${this.viewId}`)
    } catch(err){
      alertDialog("Could not fetch view. You probably don't have access to it.")
      return;
    }
    this.items = this.view.lists.map(l => {
        for(let item of l.items) {
          item.listId = l.id
          item.listTitle = l.title
        }
        return l.items
      }).flat()
        .sort((a, b) => a.orderIdx - b.orderIdx)
    this.shadowRoot.getElementById("items").innerHTML = this.items.filter(i => viewChecked || !i.checked)
                                                                  .map(item => `
        <tr class="item" data-itemid="${item.id}" data-listid="${item.listId}">
          <td id="move" class="draggable ${isMobileView ? "hidden" : ""}">&#x2630;</td>
          <td><input type="checkbox" ${item.checked? "checked" : ""} class="selected-switch"></input></td>
          <td><field-ref ref="/list/${item.listId}">${item.listTitle}</field-ref></td>
          <td>${item.textHTML}</td>
        </tr>
      `).join("")

    this.shadowRoot.getElementById("items-tab").querySelector("th:first-child").classList.toggle("hidden", isMobileView)
  }

  async chooseLists(){
    let listsElement = this.shadowRoot.getElementById("choose-lists-lists")
    let lists = await api.get("lists")
    listsElement.innerHTML = lists.sort((a, b) => a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1)
                                  .map(l => `<tr data-id="${l.id}"><td><input type="checkbox" ${this.view.lists.find(selectedList => selectedList.id == l.id) ? "checked" : ""}></input></td><td>${l.title}</td></tr>`).join("")
    let dialog = this.shadowRoot.getElementById("choose-lists-dialog")
    showDialog(dialog, {
      ok: async (val) => {
        let addedLists = val.selectedLists.filter(id => !this.view.lists.find(l => l.id == id))
        for(let id of addedLists) await api.post(`listview/${this.view.id}/lists`, {listId : id})
        let removedLists = val.notSelectedLists.filter(id => this.view.lists.find(l => l.id == id))
        for(let id of removedLists) await api.del(`listview/${this.view.id}/lists/${id}`)
        this.refreshData()
      },
      validate: (val) => true,
      values: () => {return {
        selectedLists : Array.from(listsElement.querySelectorAll("input:checked")).map(le => parseInt(le.closest("tr").getAttribute("data-id"))),
        notSelectedLists : Array.from(listsElement.querySelectorAll("input:not(:checked)")).map(le => parseInt(le.closest("tr").getAttribute("data-id")))
      }}
    })
  }

  async itemsClick(e){
    if(e.target.tagName != "INPUT") return;
    let listId = e.target.closest("tr").getAttribute("data-listid")
    let itemId = e.target.closest("tr").getAttribute("data-itemid")
    if(e.target.classList.contains("selected-switch")){
      await api.patch(`lists/${listId}/items/${itemId}`, { checked: e.target.checked })
    }
  }

  connectedCallback() {
    on("changed-page", elementName, this.refreshData)
  }

  disconnectedCallback() {
    off("changed-page", elementName)
  }
}

window.customElements.define(elementName, Element);
export {Element, elementName as name}