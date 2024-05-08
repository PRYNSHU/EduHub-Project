const express = require('express')
const router = express.Router()
const con = require("../db")


//Add New Role and set default permissions
router.post("/new-role", (req, res) => {
    const roleName = req.body.roleName
    con.query(`insert into user_roles(roleName) values(?) `, [roleName], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        let roleId = result.insertId
        con.query(`insert into default_role_permissions (roleId,permissions) select ${roleId} roleId,drp.permissions from default_role_permissions drp where roleId=1 `, async (err, result) => {
            if (err)
                return res.status(500).end(err.sqlMessage)
            const newRole = await getRoleWithPermissionsById(roleId)
            res.send({ role: newRole })
        })
    })
})

//Get Single Role With Permissions By RoleId
function getRoleWithPermissionsById(roleId) {
    return new Promise((resolve) => {
        con.query(`SELECT d.roleId,r.roleName,d.permissions FROM default_role_permissions d inner join user_roles r on r.roleId=d.roleId where r.roleId=?`, [roleId], (err, result) => {
            result[0].permissions = JSON.parse(result[0].permissions)
            resolve(result[0])
        })
    })
}

//Get Roles with Permissions
router.get("/default-role-permissions", (req, res) => {
    con.query(`SELECT d.roleId,r.roleName,d.permissions FROM default_role_permissions d right join user_roles r on r.roleId=d.roleId `, (err, result) => {
        result.filter(r => {
            r.permissions = JSON.parse(r.permissions)
        })
        res.send(result)
    })
})

//Update default Permissions
router.put("/default-permissions-all", async (req, res) => {
    let roleId = req.body.roleId
    let permissions = JSON.stringify(req.body.permissions)
    con.query(`update default_role_permissions set permissions = ? where roleId = ? `, [permissions, roleId], (err, result) => {
        res.send({ success: result.changedRows > 0 })
    })
})

module.exports = router