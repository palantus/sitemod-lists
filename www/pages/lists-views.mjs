const elementName = 'listviews-page'

import api from "../system/api.mjs"
import "../components/action-bar.mjs"
import "../components/action-bar-item.mjs"
import "../components/field-ref.mjs"
import "../components/field.mjs"
import "../components/action-bar-menu.mjs"
import {on, off} from "../system/events.mjs"
import {apiURL} from "../system/core.mjs"
import "../components/data/list.mjs"
import { promptDialog, confirmDialog } from "../../components/dialog.mjs"

const template = document.createElement('template');
template.innerHTML = `
  <link rel='stylesheet' href='../css/global.css'>
  <link rel='stylesheet' href='../css/searchresults.css'>
  <style>
    #container{
        position: relative;
        padding: 10px;
    }
    span.delete-view{cursor: pointer; user-select: none;}
  </style>  

  <action-bar>
      <action-bar-item id="new-view-btn">New view</action-bar-item>
  </action-bar>

  <div id="container">
    <table>
      <tbody id="views">
      </tbody>
    </table>
  </div>
`;

class Element extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.refreshData = this.refreshData.bind(this);
    this.newView = this.newView.bind(this);
    this.viewsClick = this.viewsClick.bind(this)
    
    this.shadowRoot.getElementById("new-view-btn").addEventListener("click", this.newView)
    this.shadowRoot.getElementById("views").addEventListener("click", this.viewsClick)
  }

  async refreshData(e, force){
    this.views = await api.get("listview")
    this.shadowRoot.getElementById("views").innerHTML = this.views.map(v => `
        <tr data-viewid="${v.id}">
          <td><field-ref ref="/listview/${v.id}">${v.title}</field-ref></td>
          <td><span class="delete-view">&#x1F5D1;</span></td>
        </tr>
      `).join("")
  }

  async newView(){
    let title = await promptDialog("Enter view title")
    if(!title) return;
    await api.post("listview", {title})
    this.refreshData()
  }

  async viewsClick(e){
    if(e.target.tagName != "SPAN") return;
    let viewId = e.target.closest("tr").getAttribute("data-viewid")
    if(e.target.classList.contains("delete-view")){
      if(!(await confirmDialog(`Are you sure that you want to delete the following list?<br>${this.views.find(v => v.id == viewId).title}`))) return;
      await api.del(`listview/${viewId}`)
      this.refreshData()
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