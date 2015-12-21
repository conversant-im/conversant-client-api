"use strict"

class Model{
    constructor(type){
        this.$type = type;
        console.log('created type: '+ type);
    }
}

let Auth = {};

Auth.OrganizationRoles = class extends Model{
    constructor(role){
        super('m,Auth.OrganizationRoles');
        this.role = role;
    }
    static team(){ return new OrganizationRoles("team"); }
    static admin(){ return new OrganizationRoles("admin"); }
    static owner(){ return new OrganizationRoles("owner"); }
    static organization(){ return new OrganizationRoles("organization"); }
};

Auth.ProfileInfo = class extends Model{
    constructor(orgId, provider, id, role, fullName){
        super('m.Auth.ProfileInfo');
        this.orgId = orgId;
        this.provider = provider;
        this.id = id;
        this.role = role;
        this.fullName = fullName;
    }
};

module.exports = {
    Auth:{
        OrganizationRoles: Auth.OrganizationRoles,
        ProfileInfo: Auth.ProfileInfo
    }
}


// Expose to None NODE.js clients
// TODO make this an option so we do not pollute the namespace
window.m = {
    Auth:{
        OrganizationRoles: Auth.OrganizationRoles,
        ProfileInfo: Auth.ProfileInfo
    }
}






