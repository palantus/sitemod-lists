const elementName = 'list-page'

import {state} from "/system/core.mjs"
import "/components/data/list.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <style>
    #container{
      padding: 10px;
    }

  </style>

  <div id="container">
    <data-list-component id="list" noframe backondelete></data-list-component>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listId = /(\d+)/.exec(state().path)[0]
    this.refreshData()
  }

  refreshData(){
    this.shadowRoot.getElementById("list").setAttribute("listid", this.listId)
  }

  connectedCallback() {
    this.refreshData()
  }

  disconnectedCallback() {
  }

}

window.customElements.define(elementName, Element);
export {Element, elementName as name}