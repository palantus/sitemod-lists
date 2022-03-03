import Role from "../../models/role.mjs"
import DataType from "../../models/datatype.mjs"
import List from "./models/list.mjs"

export default async () => {
  // init
  Role.lookupOrCreate("lists").addPermission(["lists.read", "lists.edit"], true)

  DataType.lookupOrCreate("list", {title: "List", permission: "lists.read", api: "lists", nameField: "title", uiPath: "list", acl: "r:private;w:private"})
          .init({typeModel: List})
  
  return {}
}