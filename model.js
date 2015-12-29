"use strict"

/**
 * @class Type
 * Helper class for doing runtime type checking and error reporting.
 */
class Type{
    static check(inst, type, fail){
        if( ! (inst instanceof type) ) {
            if(type.type && inst.$type && type.type() == inst.$type){// FIXME: this is a hack until we have our own mapper.
                return inst
            }
            if(typeof fail === "undefined")
                throw new Error('[ERROR] Type Check failed. ' + typeof(inst) + ' is not ' + type)
            else
                fail(new Error('[ERROR] Type Check failed. ' + typeof(inst) + ' is not ' + type))
        }
        return inst
    }
}

/**
 * @class Model
 * Base type for all `Model` types in the system.
 */
class Model{
    /**
     *
     * @param type {String} the full class name of the type be instantiated.
     */
    constructor(type){
        this.$type = type;
        console.log('created type: '+ type);
    }
}

/**
 * @namespace Auth
 */
let Auth = {};

/**
 * @class OrganizationRoles
 * Construct an organization role.
 */
Auth.OrganizationRoles = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth.OrganizationRoles'}
    constructor(role){
        super(Auth.OrganizationRoles.type());
        this.role = role;
    }

    /**
     * Return OrganizationRoles TEAM
     * @returns {OrganizationRoles}
     */
    static team(){ return new OrganizationRoles("team"); }
    /**
     * Return OrganizationRoles ADMIN
     * @returns {OrganizationRoles}
     */
    static admin(){ return new OrganizationRoles("admin"); }
    /**
     * Return OrganizationRoles OWNER
     * @returns {OrganizationRoles}
     */
    static owner(){ return new OrganizationRoles("owner"); }
    /**
     * Return OrganizationRoles ORGANIZATION
     * @returns {OrganizationRoles}
     */
    static organization(){ return new OrganizationRoles("organization"); }
    /**
     * Return OrganizationRoles GUEST
     * @returns {OrganizationRoles}
     */
    static guest(){ return new OrganizationRoles("guest"); }
}

/**
 * @class ProfileInfo
 * A simple view of a provider for a user.  Users can have many providers for many different organization.
 * Users will typically have 1 provider="conversant" per orgId.
 */
Auth.ProfileInfo = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth.ProfileInfo'}

    /**
     *
     * @param orgId {String}
     * @param provider {String}
     * @param id {String}
     * @param role {Auth.OrganizationRoles}
     * @param fullName {String}
     */
    constructor(orgId, provider, id, role, fullName){
        super(Auth.ProfileInfo.type())
        this.orgId = new String(orgId)
        this.provider = new String(provider)
        this.id = new String(id)
        this.role = Type.check(role,Auth.OrganizationRoles)
        this.fullName = new String(fullName)
    }
}

/**
 * @class PrimaryProfile
 * A list of profiles that are known for that user under that organiztion.
 * The primary will be a provider of type "conversant"
 */
Auth.PrimaryProfile = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth.PrimaryProfile'}

    /**
     *
     * @param primary {Auth.ProfileInfo}
     * @param providers {Auth.ProfileInfo[]}
     */
    constructor(primary, providers){
        super(Auth.PrimaryProfile.type())
        this.primary = Type.check(primary,Auth.ProfileInfo)
        this.providers = providers.map( p => Type.check(primary,Auth.ProfileInfo) )
    }
}

/**
 * @class UserState
 * Used to pass a user action that requires synchronization by the system.
 */
Auth.UserState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth.UserState'}

    /**
     *
     * @param isOnline {Boolean}
     * @param action {Auth.UserState}
     * @param state {Map}
     */
    constructor(isOnline, action, state){
        super(Auth.UserState.type())
        this.isOnline = isOnline
        this.action = Type.check(action, Auth.UserState)
        this.state = state
    }

}

/**
 * @class UserAction
 * Some User level event that requies syncing.
 */
Auth.UserAction = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth.UserAction'}

    /**
     *
     * @param action {String}
     */
    constructor(action){
        super(Auth.UserAction.type())
        this.action = new String(action)
    }

    /**
     * None User Action
     * @returns {Auth.UserAction}
     */
    static none(){ return Auth.UserAction("none") }
    /**
     * typing User Action
     * @returns {Auth.UserAction}
     */
    static typing(){ return Auth.UserAction("typing") }
    /**
     * online User Action
     * @returns {Auth.UserAction}
     */
    static online(){ return Auth.UserAction("online") }
    /**
     * presence User Action
     * @returns {Auth.UserAction}
     */
    static presence(){ return Auth.UserAction("presence") }
    /**
     * offline User Action
     * @returns {Auth.UserAction}
     */
    static offline(){ return Auth.UserAction("offline") }
    /**
     * collaborationEnter User Action
     * @returns {Auth.UserAction}
     */
    static collaborationEnter(){ return Auth.UserAction("collaborationEnter") }

}

/**
 * @namespace Collaboration
 */
let Collaboration = {};

/**
 * @class ViewerState
 * Used by applications to sync the view state of a sync panel.
 */
Collaboration.ViewerState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.ViewerState'}

    /**
     *
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param sampleTimeMs {Number}
     * @param settings {Map}
     * @param transform {Geom.Transform3d}
     */
    constructor(app, resource, sampleTimeMs, settings, transform){
        super(Collaboration.ViewerState.type())
        this.app = Type.check(app, Apps.App)
        this.resource = Type.check(resource, Resource.Resource)
        this.sampleTimeMs = new Number(sampleTimeMs)
        this.settings = settings
        this.transform = Type.check(transform, Geom.Transform3d)
    }
}

/**
 * @class SyncViewEvent
 * Application Event to Sync the View state.
 */
Collaboration.SyncViewEvent = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.SyncViewEvent'}

    /**
     *
     * @param collaborationId {String}
     * @param orgId {String}
     * @param profile {Auth.ProfileInfo}
     * @param viewerState {Collaboration.ViewerState}
     */
    constructor(collaborationId, orgId, profile, viewerState){
        super(Collaboration.SyncViewEvent.type())
        this.collaborationId = new String(collaborationId)
        this.orgId = new String(orgId)
        this.profile = Type.check(profile, Auth.ProfileInfo)
        this.viewerState = Type.check(viewerState, Collaboration.ViewerState)
    }
}

/**
 * @class SyncUserEvent
 * System level event for passing user state.
 */
Collaboration.SyncUserEvent = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.SyncUserEvent'}

    /**
     *
     * @param collaborationId {String}
     * @param orgId {String}
     * @param profile {Auth.ProfileInfo}
     * @param userState {Auth.UserState}
     */
    constructor(collaborationId, orgId, profile, userState){
        super(Collaboration.SyncUserEvent.type())
        this.collaborationId = new String(collaborationId)
        this.orgId = new String(orgId)
        this.profile = Type.check(profile, Auth.ProfileInfo)
        this.userState = Type.check(userState, Auth.UserState)
    }
}

/**
 * @class Collaboration
 */
Collaboration.Collaboration = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.Collaboration'}

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param collaborationType {Collaboration.CollaborationType}
     * @param members {Auth.ProfileInfo[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, orgId, collaborationType, members, name, avatarUrl, cover, content, settings){
        super(Collaboration.Collaboration.type())
        this.id = new String(id)
        this.orgId = new String(orgId)
        this.collaborationType = Type.check(collaborationType, Collaboration.CollaborationType)
        this.members = members.map( (m) => Type.check(m, Auth.ProfileInfo)  )
        this.name = typeof name === "undefined" ? [] : [new String(name)]
        this.avatarUrl = typeof avatarUrl === "undefined" ? [] : [new String(avatarUrl)]
        this.cover = typeof cover === "undefined" ? [] : [new String(cover)]
        this.content = content.map( (c) => Type.check(c, Collaboration.Content)  )
        this.settings = settings
    }
}

/**
 * @class CollaborationType
 */
Collaboration.CollaborationType = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.CollaborationType'}

    /**
     *
     * @param name {String}
     */
    constructor(name){
        super(Collaboration.CollaborationType.type())
        this.name = new String(name)
    }

    /**
     * AD-HOC collaboration type
     * @returns {Collaboration.CollaborationType}
     */
    static adHoc(){ return Collaboration.CollaborationType("ad-hoc") }
    /**
     * GROUP collaboration type
     * @returns {Collaboration.CollaborationType}
     */
    static group(){ return Collaboration.CollaborationType("group") }
    /**
     * CHANNEL collaboration type
     * @returns {Collaboration.CollaborationType}
     */
    static channel(){ return Collaboration.CollaborationType("channel") }
    /**
     * QUEUE collaboration type
     * @returns {Collaboration.CollaborationType}
     */
    static queue(){ return Collaboration.CollaborationType("queue") }
}


/**
 * @class Content
 */
Collaboration.Content = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.Content'}

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.ProfileInfo[]}
     * @param seen {Auth.ProfileInfo[]}
     * @param path OPTIONAL {String}
     * @param sentiment OPTIONAL {String}
     * @param nlp OPTIONAL {String}
     * @param content OPTIONAL {String}
     * @param meta {Map}
     * @param contentType {String}
     * @param contentClass {Collaboration.ContentClass}
     * @param contentUri {String}
     * @param view {Collaboration.ViewerState}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, path, sentiment, nlp, content, meta, contentType, contentClass, contentUri, view){
        super(Collaboration.Content.type())
        this.id = new String(id)
        this.collaborationId = new String(collaborationId)
        this.orgId = new String(orgId)
        this.timestamp = new String(timestamp)
        this.authors = authors.map( (a) => Type.check(a, Auth.ProfileInfo) )
        this.seen = seen.map( (s) => Type.check(s, Auth.ProfileInfo) )
        this.path = typeof path === "undefined" ? [] : [new String(path)]
        this.nlp = typeof nlp === "undefined" ? [] : [new String(nlp)]
        this.sentiment = typeof sentiment === "undefined" ? [] : [new String(sentiment)]
        this.content = typeof content === "undefined" ? [] : [new String(content)]
        this.meta = meta
        this.contentType = new String(contentType)
        this.contentClass = Type.check(contentClass, Collaboration.ContentClass)
        this.contentUri = new String(contentUri)
        this.view = Type.check(view, Collaboration.ViewerState)
    }
}

/**
 * @class ContentClass
 */
Collaboration.ContentClass = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration.ContentClass'}

    /**
     *
     * @param className {String}
     */
    constructor(className){
        super(Collaboration.ContentClass.type())
        this["class"] = new String(className)
    }

    /**
     * MSG content class
     * @returns {Collaboration.ContentClass}
     */
    static msg(){ return Collaboration.ContentClass("msg") }
    /**
     * EVENT content class
     * @returns {Collaboration.ContentClass}
     */
    static event(){ return Collaboration.ContentClass("event") }
    /**
     * LINK content class
     * @returns {Collaboration.ContentClass}
     */
    static link(){ return Collaboration.ContentClass("link") }
    /**
     * GHOST content class
     * @returns {Collaboration.ContentClass}
     */
    static ghost(){ return Collaboration.ContentClass("ghost") }
    /**
     * COMPACT content class
     * @returns {Collaboration.ContentClass}
     */
    static compact(){ return Collaboration.ContentClass("compact") }
}

/**
 * @namespace Apps
 */
let Apps = {};

/**
 * @class App
 * Identifies an application of the system.
 */
Apps.App = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.App'}

    /**
     *
     * @param id {String}
     * @param name {String}
     * @param icon {String}
     * @param origin {String} The origin fo the iframe that the app will be hosted in
     * @param args {String}
     */
    constructor(id, name, icon, origin, args){
        super(Apps.App.type())
        this.id = new String(id)
        this.name = new String(name)
        this.icon = new String(icon)
        this.origin = new String(origin)
        this.args = args
    }
}

/**
 * @class Init
 * Signal the host that the app is ready for initialization.
 */
Apps.Init = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.Init'}

    /**
     *
     * @param appId {String} Your app id to initialize
     */
    constructor(appId){
        super(Apps.Init.type())
        this.appId = new String(appId)
    }
}


/**
 * @class InitApp
 */
Apps.InitApp = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.InitApp'}

    /**
     *
     * @param profile {Apps.App}
     * @param isSyncMode {Boolean} is your app loading in the sync panel or the app panel
     * @param restoreState {Collaboration.ViewerState} OPTIONAL The view state that is to be restored
     */
    constructor(app, restoreState){
        super(Apps.InitApp.type())
        this.app = Type.check(app, Apps.App)
        this.restoreState = typeof restoreState === "undefined" ? [] : [Type.check(restoreState, Collaboration.ViewerState)]
    }
}

/**
 * @class InitProfile
 */
Apps.InitProfile = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.InitProfile'}

    /**
     *
     * @param profile {Auth.ProfileInfo}
     */
    constructor(profile){
        super(Apps.InitProfile.type())
        this.profile = Type.check(profile, Auth.ProfileInfo)
    }
}

/**
 * @class InitCollaboration
 */
Apps.InitCollaboration = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.InitCollaboration'}

    /**
     *
     * @param collaboration {Collaboration.Collaboration}
     */
    constructor(collaboration){
        super(Apps.InitCollaboration.type())
        this.collaboration = Type.check(collaboration, Collaboration.Collaboration)
    }
}

/**
 * @class InitTeam
 */
Apps.InitTeam = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.InitTeam'}

    /**
     *
     * @param team {Collaboration.SyncUserEvent[]}
     */
    constructor(team){
        super(Apps.InitTeam.type())
        this.team = team.map( (t) => Type.check(t, Collaboration.SyncUserEvent) )
    }
}

/**
 * @class InitPeers
 */
Apps.InitPeers = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps.InitPeers'}

    /**
     *
     * @param peers {Peers.PeerState[]}
     */
    constructor(peers){
        super(Apps.InitPeers.type())
        this.peers = peers.map( (p) => Type.check(t, Peers.PeerState) )
    }
}

/**
 * @namespace Resource
 */
let Resource = {};

/**
 * @class Resource
 */
Resource.Resource = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Resource.Resource'}

    /**
     * @param uri {String}
     * @param contentType {String}
     * @param thumbnail {String}
     */
    constructor( uri, contentType, thumbnail ){
        super(Resource.Resource.type())
        this.uri = new String(uri)
        this.contentType = new String(contentType)
        this.thumbnail = new String(thumbnail)
    }
}

/**
 * @namespace Geom
 */
let Geom = {};

/**
 * @class Transform3d
 * A 3D transformation
 */
Geom.Transform3d = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Geom.Transform3d'}

    /**
     *
     * @param matrix {number[]}
     */
    constructor(matrix){
        super(Geom.Transform3d.type())
        this.matrix = matrix
        if( this.matrix.length != (4 * 4) ){
            throw new Error('Matrix is not 4x4')
        }
    }

    /**
     * The identity matrix
     * @returns {number[]}
     */
    static identity(){
        return new Geom.Transform3d([1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1]);
    }
}


module.exports = {
    Type: Type,
    Auth:Auth,
    Collaboration:Collaboration,
    Apps:Apps,
    Geom:Geom,
    Resource: Resource
}


// Expose to None NODE.js clients
// TODO make this an option so we do not pollute the namespace
window.m = module.exports






