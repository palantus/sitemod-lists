import Role from "../../models/role.mjs"
import DataType from "../../models/datatype.mjs"
import List from "./models/list.mjs"
import { query, nextNum } from "entitystorage"

export default async () => {
  // init
  Role.lookupOrCreate("lists").addPermission(["lists.read", "lists.edit"], true)

  DataType.lookupOrCreate("list", {title: "List", permission: "lists.read", api: "lists", nameField: "title", uiPath: "list", acl: "r:private;w:private"})
          .init({typeModel: List})
  
  query.tag("listitem").not(query.prop("orderIdx")).all.sort((a, b) => a._id - b._id).forEach(item => {
    item.orderIdx = nextNum() * 100;
  })
  query.tag("listitem").all.filter(i => isNaN(i.orderIdx)).sort((a, b) => a._id - b._id).forEach(item => {
    item.orderIdx = nextNum() * 100;
  })

  return {}
}