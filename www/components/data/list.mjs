let elementName = "data-list-component"

import { confirmDialog } from "../dialog.mjs";
import { promptDialog } from "../dialog.mjs";
import api from "/system/api.mjs"
import { goto } from "/system/core.mjs"

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
    }

    #title{
      font-size: 120%;
      margin-top: 0px;
      margin-bottom: 5px;
    }

    #body{
    }

    div.item{
      /*white-space: nowrap;*/
    }

    .item table{border-collapse: collapse;}
    .item table td:first-child{width: 21px;}

    #bottombar{
      margin-top: 5px;
      display: flex;
      align-items: baseline;
      gap: 5px;
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
    
    .dropdown:focus-within > .link,
    .link:hover {
      color: black;
    }
    
    .dropdown {
      position: relative;
      display: inline-block;
    }
    
    .dropdown-menu {
      position: absolute;
      left: 0;
      top: calc(100% + .25rem);
      background-color: white;
      padding: .75rem;
      border-radius: .25rem;
      box-shadow: 0 2px 5px 0 rgba(0, 0, 0, .5);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-10px);
      transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
    }

    .dropdown:focus-within{
      z-index: 2;
    }
    
    .dropdown:focus-within > button + .dropdown-menu {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
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

    img{
      pointer-events: none;
      width: 17px;
      vertical-align: middle;
      padding-bottom: 2px;
    }
    #options:hover{
      filter: invert(10%);
    }

    .dropdown-heading{
      margin-bottom: 5px;
    }
  </style>
  <div id="container">
    <p id="title" title="Doubleclick to change">Untitled</p>
    <div id="body">
      
    </div>
    <div id="bottombar">
      <button class="styled" id="add" title="Add item">Add</button>
      <div class="dropdown" data-dropdown>
        <button id="options" title="Options" data-dropdown-button>Options</button>
        <div class="dropdown-menu information-grid">
          <div>
            <div class="dropdown-heading">Title</div>
            <div class="dropdown-links">
              <input id="title-edit"></input>
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
              <button id="clearchecked" title="Delete checked items">Remove checked</button>
              <button id="delete" title="Delete list">Delete list</button>
              <button id="share" title="Open shareable link" data-dropdown-button>Share</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.add = this.add.bind(this)
    this.delete = this.delete.bind(this)
    this.deleteChecked = this.deleteChecked.bind(this)
    this.change = this.change.bind(this)
    this.bodyClick = this.bodyClick.bind(this)
    this.share = this.share.bind(this)
    this.titleChange = this.titleChange.bind(this)

    if (this.hasAttribute("noframe"))
      this.shadowRoot.getElementById("container").classList.add("noframe")

    if (this.hasAttribute("noedit")) {
      this.shadowRoot.getElementById("bottombar").style.display = "none"
    } else {
      this.shadowRoot.getElementById("add").addEventListener("click", this.add)
      this.shadowRoot.getElementById("delete").addEventListener("click", this.delete)
      this.shadowRoot.getElementById("clearchecked").addEventListener("click", this.deleteChecked)
      this.shadowRoot.getElementById("body").addEventListener("change", this.change)
      this.shadowRoot.getElementById("body").addEventListener("click", this.bodyClick)
      this.shadowRoot.getElementById("share").addEventListener("click", this.share)
      this.shadowRoot.getElementById("title").addEventListener("dblclick", this.titleChange)
      this.shadowRoot.getElementById("color").addEventListener("change", async (e) => {
        await api.patch(`lists/${this.listId}`, {color: e.target.value})
        this.refreshData()
      })
      this.shadowRoot.getElementById("title-edit").addEventListener("change", async (e) => {
        if(e.target.value == this.list.title) return;
        await api.patch(`lists/${this.listId}`, {title: e.target.value})
        this.refreshData()
      })
    }
  }

  async add() {
    let text = await promptDialog("Enter new item text")
    if (!text) return;
    await api.post(`lists/${this.listId}/items`, { text })
    this.refreshData()
  }

  async delete() {
    if (!await confirmDialog(`Are you sure that you want to delete the list: ${this.list.title}?`)) return;
    await api.del(`lists/${this.listId}`)
    this.dispatchEvent(new CustomEvent("list-deleted", { bubbles: true, cancelable: false, detail: { listId: this.listId } }));
  }

  async deleteChecked() {
    await api.post(`lists/${this.listId}/deletechecked`)
    this.refreshData()
  }

  async change(e) {
    if (e.target.tagName != "INPUT") return;
    let itemId = e.target.closest(".item").getAttribute("data-itemid")

    await api.patch(`lists/${this.listId}/items/${itemId}`, { checked: e.target.checked })
  }

  async titleChange() {
    let title = await promptDialog("Enter new title", this.list.title)
    if (!title) return;
    await api.patch(`lists/${this.listId}`, { title })
    this.refreshData();
  }

  bodyClick(e) {
    if (e.target.tagName == "A") {
      let href = e.target.getAttribute("href")
      if (href.startsWith("/")) {
        e.preventDefault();
        goto(href)
      }
    }
  }

  share() {
    goto(`/list/${this.listId}`)
  }

  async refreshData() {
    let listId = this.listId = this.getAttribute("listid")
    if (!listId) return;

    this.list = await api.get(`lists/${listId}`)

    if(this.list.color && !this.hasAttribute("noframe")){
      this.shadowRoot.getElementById("container").style.backgroundColor = this.list.color;
    }
    this.shadowRoot.getElementById("title").innerText = this.list.title
    this.shadowRoot.getElementById("title-edit").value = this.list.title
    this.shadowRoot.getElementById("color").value = this.list.color||"#FFFFFF"
    this.shadowRoot.getElementById("body").innerHTML = this.list.items.map(i => `
      <div class="item" data-itemid="${i.id}">
        <table>
          <tr>
            <td>
              <input type="checkbox" ${i.checked ? "checked" : ""} ${this.hasAttribute("noedit") ? "disabled" : ""}></input>
            </td>
            <td>
              <span>${i.textHTML}</span>
            </td>
          </tr>
        </table>
      </div>`).join("")

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
    this.refreshData();
  }

  disconnectedCallback() {
  }
}


window.customElements.define(elementName, Element);
export { Element, elementName as name }