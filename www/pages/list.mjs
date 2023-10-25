const elementName = 'list-page'

import {state} from "../system/core.mjs"
import "../components/data/list.mjs"
import {uuidv4} from "../libs/uuid.mjs"
import {on, off} from "../system/events.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <style>
    #container{
      padding: 10px;
    }

  </style>

  <div id="container">
    <data-list-component id="list" noframe backondelete setpagetitle></data-list-component>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.refreshData = this.refreshData.bind(this)

    this.listId = /(\d+)/.exec(state().path)[0]
    this.elementId = `${elementName}-${uuidv4()}`;
    this.refreshData()
  }

  refreshData(){
    if(this.shadowRoot.getElementById("list").getAttribute("listid") != this.listId)
      this.shadowRoot.getElementById("list").setAttribute("listid", this.listId)
    else
      this.shadowRoot.getElementById("list").refreshData()
  }

  connectedCallback() {
    on("changed-page", this.elementId, this.refreshData)
    this.interval = setInterval(this.refreshData, 5000)
  }

  disconnectedCallback() {
    off("changed-page", this.elementId)
    clearInterval(this.interval)
  }

}

window.customElements.define(elementName, Element);
export {Element, elementName as name}