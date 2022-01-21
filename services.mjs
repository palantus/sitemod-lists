import Permission from "../../models/permission.mjs"
import Role from "../../models/role.mjs"

export default async () => {
  // init
  Role.lookupOrCreate("lists").addPermission(["lists.read", "lists.edit"], true)

  return {
  }
}