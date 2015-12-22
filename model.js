"use strict"

class Type{
    static check(inst, type){
        if( ! (inst instanceof type) ) {
            throw new Error('[ERROR] Type Check failed. ' + typeof(inst) + ' is not ' + type)
        }
        return inst
    }
    static check(inst, type, fail){
        if( ! (inst instanceof type) ) {
            fail(new Error('[ERROR] Type Check failed. ' + typeof(inst) + ' is not ' + type))
        }
        return inst
    }
}

class Model{
    constructor(type){
        this.$type = type;
        console.log('created type: '+ type);
    }
}

let Auth = {};
Auth.OrganizationRoles = class extends Model{
    static type(){ return 'm.Auth.OrganizationRoles'}
    constructor(role){
        super(Auth.OrganizationRoles.type());
        this.role = role;
    }
    static team(){ return new OrganizationRoles("team"); }
    static admin(){ return new OrganizationRoles("admin"); }
    static owner(){ return new OrganizationRoles("owner"); }
    static organization(){ return new OrganizationRoles("organization"); }
}
Auth.ProfileInfo = class extends Model{
    static type(){ return 'm.Auth.ProfileInfo'}
    constructor(orgId, provider, id, role, fullName){
        super(Auth.ProfileInfo.type())
        this.orgId = new String(orgId)
        this.provider = new String(provider)
        this.id = new String(id)
        this.role = Type.check(role,Auth.OrganizationRoles)
        this.fullName = new String(fullName)
    }
}
Auth.PrimaryProfile = class extends Model{
    static type(){ return 'm.Auth.PrimaryProfile'}
    constructor(primary, providers){
        super(Auth.PrimaryProfile.type())
        this.primary = Type.check(primary,Auth.ProfileInfo)
        this.providers = providers.map( p => Type.check(primary,Auth.ProfileInfo) )
    }
}
Auth.UserState = class extends Model{
    static type(){ return 'm.Auth.UserState'}
    constructor(isOnline, action, state){
        super(Auth.UserState.type())
        this.isOnline = new Boolean(isOnline)
        this.action = Type.check(action, Auth.UserState)
        this.state = state
    }
}
Auth.UserAction = class extends Model{
    static type(){ return 'm.Auth.UserAction'}
    constructor(action){
        super(Auth.UserAction.type())
        this.action = new String(action)
    }

    static none(){ return Auth.UserAction("none") }
    static typing(){ return Auth.UserAction("typing") }
    static online(){ return Auth.UserAction("online") }
    static presence(){ return Auth.UserAction("presence") }
    static offline(){ return Auth.UserAction("offline") }
    static collaborationEnter(){ return Auth.UserAction("collaborationEnter") }

}


let Collaboration = {};
Collaboration.ViewerState = class extends Model{
    static type(){ return 'm.Collaboration.ViewerState'}
    constructor(app, resource, sampleTimeMs, settings, transform){
        super(Collaboration.ViewerState.type())
        this.app = Type.check(app, Apps.App)
        this.resource = Type.check(resource, Resource.Resource)
        this.sampleTimeMs = new Number(sampleTimeMs)
        this.settings = settings
        this.transform = Type.check(transform, Geom.Transform3d)
    }
}
Collaboration.SyncViewEvent = class extends Model{
    static type(){ return 'm.Collaboration.SyncViewEvent'}
    constructor(collaborationId, orgId, profile, viewerState){
        super(Collaboration.SyncViewEvent.type())
        this.collaborationId = new String(collaborationId)
        this.orgId = new String(orgId)
        this.profile = Type.check(profile, Auth.ProfileInfo)
        this.viewerState = Type.check(viewerState, Collaboration.ViewerState)
    }
}
Collaboration.SyncUserEvent = class extends Model{
    static type(){ return 'm.Collaboration.SyncUserEvent'}
    constructor(collaborationId, orgId, profile, userState){
        super(Collaboration.SyncUserEvent.type())
        this.collaborationId = new String(collaborationId)
        this.orgId = new String(orgId)
        this.profile = Type.check(profile, Auth.ProfileInfo)
        this.userState = Type.check(userState, Auth.UserState)
    }
}

let Apps = {};
Apps.App = class extends Model{
    static type(){ return 'm.Apps.App'}
    constructor(id, name, args){
        super(Apps.App.type())
        this.id = new String(id)
        this.name = new String(name)
        this.args = args
    }
}

let Resource = {};
Resource.Resource = class extends Model{
    static type(){ return 'm.Resource.Resource'}
    constructor( uri, contentType, thumbnail ){
        super(Resource.Resource.type())
        this.uri = new String(uri)
        this.contentType = new String(contentType)
        this.thumbnail = new String(thumbnail)
    }
}

let Geom = {};
Geom.Transform3d = class extends Model{
    static type(){ return 'm.Geom.Transform3d'}
    constructor(matrix){
        super(Geom.Transform3d.type())
        this.matrix = matrix.map( x => new Number(x))
        assert( this.matrix.length == (4 * 4) )
    }

    static identity(){
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1]
    }
}


module.exports = {
    Type: Type,
    Auth:{
        OrganizationRoles: Auth.OrganizationRoles,
        ProfileInfo: Auth.ProfileInfo
    },
    Collaboration:{
        ViewerState: Collaboration.ViewerState,
        SyncViewEvent: Collaboration.SyncViewEvent
    },
    Apps:{
        App: Apps.App
    },
    Geom:{
        Transform3d: Geom.Transform3d
    },
    Resource: {
        Resource: Resource.Resource
    }
}


// Expose to None NODE.js clients
// TODO make this an option so we do not pollute the namespace
window.m = module.exports






