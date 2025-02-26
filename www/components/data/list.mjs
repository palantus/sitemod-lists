let elementName = "data-list-component"

import { confirmDialog, showDialog, alertDialog } from "../dialog.mjs";
import api from "../../system/api.mjs"
import { goto, setPageTitle, stylesheets } from "../../system/core.mjs"
import "../../components/field-edit.mjs"
import "../../components/field-list.mjs"
import "../../components/acl.mjs"
import { fireSelfSync, onMessage, offMessage } from "../../system/message.mjs"
import { uuidv4 } from "../../libs/uuid.mjs"
import "../../components/dropdown-menu.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <style>
    #container:not(.noframe){
      padding: 5px;
      border: 1px solid gray;
      border-radius: 5px;
      box-shadow: 2px 2px 5px #777;
      background: rgba(255, 255, 255, 0.9);
      color: black;
      min-width: 130px;
    }
    .hidden{display: none;}

    #title-main{
      font-size: 120%;
      margin-top: 0px;
      margin-bottom: 5px;
    }

    #body{
    }

    div.item{
      /*white-space: nowrap;*/
      padding-top: 1px;
      padding-bottom: 1px;
    }

    .item table{border-collapse: collapse;width: 100%;}
    .item table td:first-child{width: 21px;}

    #bottombar{
      margin-top: 5px;
      display: flex;
      gap: 10px;
      position: relative;
    }

    .link {
      background: none;
      border: none;
      text-decoration: none;
      color: #777;
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
      padding: 0;
    }

    .right-action-buttons{
      opacity: 0;
      pointer-events: none;
      transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
    }
    
    #container.noframe .right-action-buttons{
      margin-left: 5px;
    }

    #container:not(.noframe) .right-action-buttons{
      position: absolute;
      left: calc(100% + .25rem);
      top: 0;
      transform: translateX(-20px);
    }

    .right-action-buttons:hover{
      opacity: 1
      pointer-events: auto;
    }

    /*
    #container:not(.noframe) .options{      
      margin-left: 5px;
      right: 0px;
      bottom: 0px;
      position: absolute;
    }
    */
    
    .options span[slot="label"]{      
      font-weight: bold;
    }
    
    .information-grid {
      display: grid;
      grid-template-columns: repeat(2, max-content);
      gap: 2rem;
    }
    
    .dropdown-links {
      display: flex;
      flex-direction: column;
      gap: .25rem;
    }

    .dropdown-heading{
      margin-bottom: 5px;
    }
    #newitem-text{width: calc(100% - 10px);}
    #newitem-dialog label{width: 115px;display: inline-block;}
    #newitem-dialog field-edit{width: 235px;}

    .itemtextcontainer{position: relative;}
    .itemtext{/*width: 100%; */display: inline-block;}
    .itemtext a{color: inherit !important; text-decoration: none;  font-weight: 550;}
    .itemtextcontainer:focus-within .right-action-buttons{opacity: 1; pointer-events: auto;}
    .itemtextcontainer:hover .right-action-buttons{opacity: 1; pointer-events: auto;}
    .right-action-buttons .edit-btn{cursor: pointer; pointer-events: auto; display: inline-block; width: 15px; height: 15px;background-size: cover;}

    #options-list field-edit{
      position: relative;
      top: 5px;
      width: 140px;
    }
    .item table td:first-child{vertical-align: top;}

    #add{cursor: pointer; pointer-events: auto; background-image: url("/img/plus.png"); display: inline-block; width: 17px; height: 17px;background-size: cover;margin-left: 4px;}
    acl-component{margin-top: 5px; position: relative;}
  </style>
  <div id="container">
    <field-ref id="title-main"></field-ref>
    <div id="body"></div>
    <div id="bottombar">
      <div id="add" title="Add item"></div>
      
      <dropdown-menu-component class="options" title="Options" width="300px">
        <span slot="label" tabindex="0">&vellip;</span>
        <div slot="content" class="information-grid">
          <div>
            <div class="dropdown-heading">Title and access</div>
            <div class="dropdown-links">
              <input id="title-edit"></input>
              <acl-component id="acl" rights="rw" type="list" disabled/>
            </div>
          </div>
          <div>
            <div class="dropdown-heading">Color</div>
            <div class="dropdown-links">
              <input id="color" type="color"></input>
            </div>
          </div>
          <div>
            <div class="dropdown-heading">Actions</div>
            <div class="dropdown-links">
              <button id="clearchecked" title="Clear checked items">Clear checked</button>
              <button id="deletechecked" title="Delete checked items">Delete checked</button>
              <button id="delete" title="Delete list">Delete list</button>
            </div>
          </div>
          <div>
            <div class="dropdown-heading">Options</div>
            <div class="dropdown-links">
              <field-list labels-pct="85" id="options-list">
                <field-edit id="archived" label="Archived" type="checkbox"></field-edit>
                <field-edit id="subList" label="Sublist" type="checkbox"></field-edit>
                <field-edit id="keepSorted" label="Keep sorted" type="checkbox"></field-edit>
              </field-list>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog-component title="Add Item" id="newitem-dialog">
    
      <div>
        <label for="newitem-type">Type: </label>
        <field-edit id="newitem-type" type="select">
          <option value="item">Item</option>
          <option value="sub">New list</option>
          <option value="ref">Reference</option>
        </field-edit>
      </div>

      <div id="add-item-ref">
        <label for="newitem-ref-type">Reference type: </label>
        <field-edit id="newitem-ref-type" type="select" lookup="type"></field-edit>
        <br>
        <label for="newitem-ref-value"">Reference: </label>
        <field-edit id="newitem-ref-value" type="text"></field-edit>
      </div>
    
      <br>
      
      <label for="newitem-text"">Text: </label><br>
      <textarea id="newitem-text" name="text" rows="8" wrap="soft" dialog-no-enter></textarea>

  </dialog-component>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' })
        .adoptedStyleSheets = [stylesheets.global];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.add = this.add.bind(this)
    this.delete = this.delete.bind(this)
    this.deleteChecked = this.deleteChecked.bind(this)
    this.clearChecked = this.clearChecked.bind(this)
    this.change = this.change.bind(this)
    this.bodyClick = this.bodyClick.bind(this)
    this.refreshData = this.refreshData.bind(this)

    if (this.hasAttribute("noframe"))
      this.shadowRoot.getElementById("container").classList.add("noframe")

    if (this.hasAttribute("noedit")) {
      this.shadowRoot.getElementById("bottombar").style.display = "none"
    } else {
      this.shadowRoot.getElementById("add").addEventListener("click", () => this.add())
      this.shadowRoot.getElementById("delete").addEventListener("click", this.delete)
      this.shadowRoot.getElementById("deletechecked").addEventListener("click", this.deleteChecked)
      this.shadowRoot.getElementById("clearchecked").addEventListener("click", this.clearChecked)
      this.shadowRoot.getElementById("body").addEventListener("change", this.change)
      this.shadowRoot.getElementById("body").addEventListener("click", this.bodyClick)
      this.shadowRoot.getElementById("color").addEventListener("change", async (e) => {
        await api.patch(`lists/${this.listId}`, { color: e.target.value })
        this.refreshData()
      })
      this.shadowRoot.getElementById("title-edit").addEventListener("change", async (e) => {
        if (e.target.value == this.list.title) return;
        await api.patch(`lists/${this.listId}`, { title: e.target.value })
        this.refreshData()
      })

      this.shadowRoot.getElementById("newitem-type").addEventListener("value-changed", (evt) => {
        let type = evt.target.getValue()
        this.shadowRoot.getElementById("add-item-ref").classList.toggle("hidden", type != "ref")
        //this.shadowRoot.getElementById("newitem-text").classList.toggle("hidden", type != "item")
      })

      this.shadowRoot.getElementById("newitem-ref-type").addEventListener("value-changed", async (evt) => {
        let typeName = evt.target.getValue()
        let type = (await api.get(`system/datatypes`, { cache: true })).find(t => t.id == typeName)
        this.shadowRoot.getElementById("newitem-ref-value").setAttribute("type", type.api.exhaustiveList ? "select" : "text")
        this.shadowRoot.getElementById("newitem-ref-value").setAttribute("lookup", typeName)
        this.shadowRoot.getElementById("newitem-ref-value").setAttribute("value", "")
      })

      this.shadowRoot.getElementById("newitem-ref-value").addEventListener("value-changed", (evt) => {
        if (this.shadowRoot.getElementById("newitem-text").value) return; //Don't override existing value
        let value = evt.target.getValue()
        let valueTitle = evt.target.getValueTitle()
        this.shadowRoot.getElementById("newitem-text").value = (value != valueTitle ? valueTitle : "") || ""
      })

      this.shadowRoot.getElementById("archived").addEventListener("value-changed", () => {
        this.list.archived = !!this.shadowRoot.getElementById("archived").getValue()
        this.dispatchEvent(new CustomEvent("list-archived", { bubbles: true, cancelable: false, detail: { listId: this.listId } }));
        this.refreshView();
      })

      this.shadowRoot.getElementById("keepSorted").addEventListener("value-changed", this.refreshData)

      this.shadowRoot.getElementById("subList").addEventListener("value-changed", () => {
        this.list.subList = !!this.shadowRoot.getElementById("subList").getValue()
        this.dispatchEvent(new CustomEvent("list-archived", { bubbles: true, cancelable: false, detail: { listId: this.listId } }));
        this.refreshView();
      })
    }

    this.shadowRoot.getElementById("body").addEventListener("mousedown", e => {
      if (!e.target.classList.contains("draggable")) return;
      if (this.list.keepSorted) return;

      let getElementIndex = elem => {
        let i = 0;
        while ((elem = elem.previousElementSibling) != null) ++i;
        return i;
      }

      let itemDiv = e.target.closest("div.item")
      let si = getElementIndex(itemDiv)
      let sy = e.pageY
      let b = document.body
      let drag;

      b.classList.add("grabCursor")
      b.style.userSelect = "none"
      itemDiv.classList.add("grabbed");

      let move = e => {
        if(!itemDiv || itemDiv.parentElement != this.shadowRoot.getElementById("body")){
          document.removeEventListener("mousemove", move)
          document.removeEventListener("mouseup", up);
        }
        if (!drag && Math.abs(e.pageY - sy) < 10)
          return;

        drag = true;
        this.shadowRoot.getElementById("body").querySelectorAll("div.item").forEach(sib => {
          if (sib == itemDiv) return;
          var s = sib
          let i = getElementIndex(s)
          let y = s.getBoundingClientRect().top;

          if (i >= 0 && e.pageY >= y && e.pageY < y + s.getBoundingClientRect().height) {
            if (i < getElementIndex(itemDiv))
              this.shadowRoot.getElementById("body").insertBefore(s, itemDiv.nextElementSibling)
            else
              this.shadowRoot.getElementById("body").insertBefore(s, itemDiv);
            return false;
          }
        });
      };

      let up = e => {
        if (drag && si != getElementIndex(itemDiv)) {
          drag = false;
          let previousId = itemDiv.previousElementSibling?.getAttribute("data-itemid")
          let nextId = itemDiv.nextElementSibling?.getAttribute("data-itemid")
          let id = itemDiv.getAttribute("data-itemid")
          if(!id || (!previousId && !nextId)) return;
          api.patch(`lists/${this.listId}/items/${id}`, {moveBefore: parseInt(nextId), moveAfter: parseInt(previousId)})
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
    this.elementId = `${elementName}-${uuidv4()}`;
  }

  async add(item) {
    let dialog = this.shadowRoot.querySelector("#newitem-dialog")

    this.shadowRoot.getElementById("newitem-ref-value").setValue(item?.refValue || "")
    if (item && item.refType) {
      let type = (await api.get(`system/datatypes`, { cache: true })).find(t => t.id == item.refType)
      this.shadowRoot.getElementById("newitem-ref-value").setAttribute("type", type?.api.exhaustiveList ? "select" : "text")
      this.shadowRoot.getElementById("newitem-ref-value").setAttribute("lookup", type?.id)
      await this.shadowRoot.getElementById("newitem-ref-value").refreshLookups()
    }

    this.shadowRoot.getElementById("newitem-type").setValue(item?.type || "item")
    this.shadowRoot.getElementById("newitem-type").parentElement.classList.toggle("hidden", !!item)
    this.shadowRoot.getElementById("newitem-text").value = item?.text || ""
    this.shadowRoot.getElementById("newitem-ref-type").setValue(item?.refType || "")
    this.shadowRoot.getElementById("newitem-ref-value").setValue(item?.refValue || "")

    this.shadowRoot.getElementById("add-item-ref").classList.toggle("hidden", (item?.type || "item") != "ref")

    showDialog(dialog, {
      show: () => this.shadowRoot.querySelector("#newitem-text").focus(),
      ok: async (val) => {
        if (item)
          await api.patch(`lists/${this.listId}/items/${item.id}`, val)
        else
          await api.post(`lists/${this.listId}/items`, val)
        this.refreshData()
        if (val.type == "sub")
          this.dispatchEvent(new CustomEvent("list-added", { bubbles: true, cancelable: false, detail: { listId: this.listId } }));

        fireSelfSync("list-edit", { id: this.listId })
      },
      validate: ({ type, text, refType, refValue }) =>
        !text && type == "item" ? "Please fill out text"
          : (!refType || !refValue) && type == "ref" ? "Please fill out reference info"
            : true,
      values: () => {
        return {
          type: this.shadowRoot.getElementById("newitem-type").getValue(),
          text: this.shadowRoot.getElementById("newitem-text").value.replace(/\n/g, ""),
          refType: this.shadowRoot.getElementById("newitem-ref-type").getValue(),
          refValue: this.shadowRoot.getElementById("newitem-ref-value").getValue(),
        }
      },
      close: () => {
        this.shadowRoot.querySelectorAll("input,textarea").forEach(e => e.value = '')
      }
    })
  }

  async delete() {
    if (!await confirmDialog(`Are you sure that you want to delete the list: ${this.list.title}?`)) return;
    await api.del(`lists/${this.listId}`)
    this.dispatchEvent(new CustomEvent("list-deleted", { bubbles: true, cancelable: false, detail: { listId: this.listId } }));
    if (this.hasAttribute("backondelete"))
      window.history.back();
  }

  async deleteChecked() {
    await api.post(`lists/${this.listId}/deletechecked`)
    this.refreshData(true)
    fireSelfSync("list-edit", { id: this.listId })
  }

  async clearChecked() {
    await api.post(`lists/${this.listId}/clearchecked`)
    this.refreshData(true)
    fireSelfSync("list-edit", { id: this.listId })
  }

  async change(e) {
    if (e.target.tagName != "INPUT") return;
    let itemId = e.target.closest(".item").getAttribute("data-itemid")

    await api.patch(`lists/${this.listId}/items/${itemId}`, { checked: e.target.checked })
    fireSelfSync("list-edit", { id: this.listId })
  }

  async bodyClick(e) {
    if (e.target.tagName == "A") {
      let href = e.target.getAttribute("href")
      if (href.startsWith("/")) {
        e.preventDefault();
        goto(href)
      }
    } else if (e.target.classList.contains("edit-btn")) {
      let itemId = e.target.closest(".item").getAttribute("data-itemid")
      let itemBasic = this.list.items.find(i => i.id == itemId)
      if (itemBasic) {
        let item = await api.get(`lists/${this.listId}/items/${itemBasic.id}`)
        this.add(item)
      }
    }
  }

  async refreshData(force) {
    let listId = this.listId = this.getAttribute("listid")
    if (!listId) return;

    if (this.hasAttribute("setpagetitle") && !this.list) setPageTitle("")

    try {
      this.list = await api.get(`lists/${listId}`)
    } catch (err) { }
    if (!this.list) {
      alertDialog("This list doesn't exist or you do not have access to see it").then(() => window.history.back())
      this.style.display = "none";
      return;
    }

    if (force !== true && this.lastListJSON && this.lastListJSON == JSON.stringify(this.list)) return;
    this.lastListJSON = JSON.stringify(this.list);

    if (this.hasAttribute("setpagetitle")) setPageTitle(this.list.title)

    if (this.list.color && !this.hasAttribute("noframe")) {
      this.shadowRoot.getElementById("container").style.backgroundColor = this.list.color;
    }
    this.shadowRoot.getElementById("title-main").innerText = this.list.title
    this.shadowRoot.getElementById("title-main").setAttribute("ref", `/list/${listId}`)
    this.shadowRoot.getElementById("title-edit").value = this.list.title
    this.shadowRoot.getElementById("color").value = this.list.color || "#FFFFFF"

    if (this.list.keepSorted) {
      for (let l of this.list.items) {
        l.textSortable = (l.textHTML?.replace(/(<([^>]+)>)/ig, '') || "").toLowerCase()
      }
      this.list.items = this.list.items.sort((a, b) => a.textSortable < b.textSortable ? -1 : 1)
    } else {
      this.list.items = this.list.items.sort((a, b) => a.orderIdx - b.orderIdx)
    }

    this.shadowRoot.getElementById("body").innerHTML = this.list.items.map(i => `
      <div class="item" data-itemid="${i.id}" >
        <table>
          <tr>
            <td>
              <input class="draggable" type="checkbox" ${i.checked ? "checked" : ""} ${this.hasAttribute("noedit") ? "disabled" : ""}></input>
            </td>
            <td>
              <div class="itemtextcontainer" tabindex=0>
                <span class="itemtext">${i.textHTML}<span class="right-action-buttons"><span class="draggable edit-btn" title="Edit">&#9998;</span></span></span>
              </div>
            </td>
          </tr>
        </table>
      </div>`).join("")

    this.refreshView();
    if (this.list.rights.includes("w") && this.shadowRoot.getElementById("acl").getAttribute("entity-id") != listId) {
      this.shadowRoot.querySelectorAll("#options-list field-edit").forEach(e => e.setAttribute("patch", `lists/${listId}`))
      this.shadowRoot.getElementById("acl").setAttribute("entity-id", listId)
      setTimeout(() => this.shadowRoot.getElementById("acl").removeAttribute("disabled"), 500)
    }
  }

  refreshView() {
    if (!this.list.rights.includes("w")) {
      this.shadowRoot.getElementById("bottombar").style.display = "none"
      this.shadowRoot.querySelectorAll(".right-action-buttons").forEach(e => e.style.display = "none")
      this.shadowRoot.querySelectorAll("input").forEach(e => e.setAttribute("disabled", "true"))

    }
    this.shadowRoot.getElementById("archived").setAttribute("value", this.list.archived ? true : false)
    this.shadowRoot.getElementById("subList").setAttribute("value", this.list.subList ? true : false)
    this.shadowRoot.getElementById("keepSorted").setAttribute("value", this.list.keepSorted ? true : false)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "listid":
        this.refreshData()
        break;
    }
  }

  static get observedAttributes() {
    return ["listid"];
  }


  connectedCallback() {
    onMessage("list-edit", this.elementId, this.refreshData)
  }

  disconnectedCallback() {
    offMessage("list-edit", this.elementId)
  }
}


window.customElements.define(elementName, Element);
export { Element, elementName as name }
