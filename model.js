"use strict"

// TOOD: would like to extend String
class UUID {
    constructor(uuid){
        this.$type = "m.UUID";
        if(uuid.$type && uuid.$type == this.$type){
            this.uuid = uuid.uuid
        }else {
            this.uuid = uuid
        }
    }

    static zero(){ new UUID('00000000-0000-0000-0000-000000000000') }

    valueOf(){
        return this.uuid
    }
}

class Integer extends Number{
    constructor(x){
        super(x)
        this.val = x
        this.$type = "m.Integer";
    }
    valueOf(){
        return this.val
    }
}

class Float extends Number{
    constructor(x){
        super(x)
        this.val = x
        this.$type = "m.Float";
    }
    valueOf(){
        return this.val
    }
}

class Double extends Number{
    constructor(x){
        super(x)
        this.val = x
        this.$type = "m.Double";
    }
    valueOf(){
        return this.val
    }
}

class Long extends Number{
    constructor(x){
        super(x)
        this.val = x
        this.$type = "m.Long";
    }
    valueOf(){
        return this.val
    }
}

class List extends Array{
    constructor(){
        super()
        this.$type = "m.List";
    }
}

class Option{
    static Some(val){ return new Some(val) }
    static None() { return new None() }
}
class Some extends Option{
    constructor(val){
        super()
        this.val = val
        this.$type = "m.Some";
    }
    get(){
        return this.val
    }
    valueOf(){
        return this.val
    }

    map(f){ return f(this.val); }
    foreach(f){ f(this.val); }
}
class None extends Option{
    constructor(){
        super()
        this.$type = "m.None";
    }

    map(f){}
    foreach(f){}
}

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
        //console.log('created type: '+ type);
    }
}

/**
 * @namespace Auth
 */
let Auth = {};


Auth.zeroId = new UUID('00000000-0000-0000-0000-000000000000')


/**
 * @class GetPrimaryProfile
 * @extends Model
 */
Auth.GetPrimaryProfile = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$GetPrimaryProfile'}
    constructor(uid, orgId){
        super(Auth.GetPrimaryProfile.type());
        this.uuid = null
        this.orgId = null
        if(arguments.length) {
            this.uuid = uuid;
            this.orgId = orgId;
        }
    }
}

/**
 * @class OrganizationRoles
 * @extends Model
 * Construct an organization role.
 */
Auth.OrganizationRoles = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$OrganizationRoles'}
    constructor(role){
        super(Auth.OrganizationRoles.type());
        this.name = null
        if(arguments.length) {
            this.name = role;
        }
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
 * @class Provider
 * @extends Model
 * A simple view of a provider for a user.  Users can have many providers for many different organization.
 * Users will typically have 1 provider="conversant" per orgId.
 */
Auth.Provider = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$Provider'}
    /**
     *
     * @param orgId {String}
     * @param source {String}
     * @param provider {String}
     * @param id {String}
     * @param role {Auth.OrganizationRoles}
     * @param fullName {String}
     */
    constructor(orgId, source, provider, id, role, fullName){
        super(Auth.Provider.type())
        this.orgId = null
        this.source = null
        this.provider = null
        this.id = null
        this.role = null
        this.fullName = null
        if(arguments.length) {
            this.orgId = new UUID(orgId)
            this.source = new UUID(source)
            this.provider = new String(provider)
            this.id = new String(id)
            this.role = Type.check(role, Auth.OrganizationRoles)
            this.fullName = new String(fullName)
        }
    }
}

/**
 * @class Provider
 * @extends Model
 * A simple view of a provider for a user.  Users can have many providers for many different organization.
 * Users will typically have 1 provider="conversant" per orgId.
 */
Auth.Bot = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$Bot'}
    /**
     *
     * @param orgId {String}
     * @param source {String}
     * @param provider {String}
     * @param id {String}
     * @param role {Auth.OrganizationRoles}
     * @param fullName {String}
     */
    constructor(orgId, source, provider, id, role, fullName){
        super(Auth.Bot.type())
        this.orgId = null
        this.source = null
        this.provider = null
        this.id = null
        this.role = null
        this.fullName = null
        if(arguments.length) {
            this.orgId = new UUID(orgId)
            this.source = new UUID(source)
            this.provider = new String(provider)
            this.id = new String(id)
            this.role = Type.check(role, Auth.OrganizationRoles)
            this.fullName = new String(fullName)
        }
    }
}


/**
 * @class Role
 * @extends Model
 */
Auth.Role = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$Role'}
    /**
     *
     * @param orgId {String}
     * @param source {String}
     * @param provider {String}
     * @param id {String}
     * @param role {Auth.OrganizationRoles}
     * @param fullName {String}
     */
    constructor(orgId, source, provider, id, role, fullName){
        super(Auth.Role.type())
        this.orgId = null
        this.source = null
        this.provider = null
        this.id = null
        this.role = null
        this.fullName = null
        if(arguments.length) {
            this.orgId = new UUID(orgId)
            this.source = new UUID(source)
            this.provider = new String(provider)
            this.id = new String(id)
            this.role = Type.check(role, Auth.OrganizationRoles)
            this.fullName = new String(fullName)
        }
    }
}


/**
 * @class Organization
 * @extends Model
 * Organization Entity
 */
Auth.Organization = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */

    static type(){ return 'm.Auth$Organization'}
    /**
     *
     * @param url {String}
     * @param name {String}
     * @param provider {Auth.Provider}
     * @param members [Auth.Provider[]]
     * @param settings {Map}
     */
    constructor(url, name, provider, members, settings){
        super(Auth.Provider.type())
        this.url = null
        this.name = null
        this.provider = null
        this.members = null
        this.settings = null
        if(arguments.length) {
            this.url = new String(url)
            this.provider = Type.check(provider, Auth.Provider)
            this.members = members.map( p => Type.check(p,Auth.Provider) )
            this.settings = settings
        }
    }
}


/**
 * @class PrimaryProfile
 * @extends Model
 * A list of profiles that are known for that user under that organiztion.
 * The primary will be a provider of type "conversant"
 */
Auth.PrimaryProfile = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$PrimaryProfile'}

    /**
     *
     * @param primary {Auth.Provider}
     * @param providers {Auth.Provider[]}
     */
    constructor(primary, providers){
        super(Auth.PrimaryProfile.type())
        this.primary = Type.check(primary,Auth.Provider)
        this.providers = providers.map( p => Type.check(p,Auth.Provider) )
    }
}

/**
 * @class UserState
 * @extends Model
 * Used to pass a user action that requires synchronization by the system.
 */
Auth.UserState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$UserState'}

    //isOnline:Boolean, action:UserAction, state: Map[String, String]

    /**
     *
     * @param isOnline {Boolean}
     * @param action {Auth.UserState}
     * @param state {Map}
     */
    constructor(isOnline, action, state){
        super(Auth.UserState.type())
        this.isOnline = null
        this.action = null
        this.state = null
        if(arguments.length) {
            this.isOnline = isOnline
            this.action = Type.check(action, Auth.UserAction)
            this.state = state
        }
    }

}

/**
 * @class UserAction
 * @extends Model
 * Some User level event that requies syncing.
 */
Auth.UserAction = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Auth$UserAction'}

    /**
     *
     * @param action {String}
     */
    constructor(action){
        super(Auth.UserAction.type())
        this.action = null
        if(arguments.length) {
            this.action = new String(action)
        }
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
 * @namespace Entities
 */
let Entities = {};

/**
 * @class NamedEntity
 * @extends Model
 */
Entities.NamedEntity = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */

    /**
     *
     * @param uri {String}
     * @param token {String}
     */
    constructor(type, uri, token){
        super(type)

        this.uri = null
        this.token = null
        if( arguments.length > 1) {
            this.uri = new String(uri)
            this.token = new String(token)
        }
    }
}


/**
 * @class LocationEntity
 * @extends NamedEntity
 */
Entities.LocationEntity = class extends Entities.NamedEntity{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Entities$LocationEntity'}

    /**
     *
     * @param uri {String}
     * @param token {String}
     */
    constructor(uri, token){
        if(arguments.length) {
            super(Entities.LocationEntity.type(), uri, token)
        }else{
            super(Entities.LocationEntity.type())
        }
    }
}


/**
 * @class OrganizationEntity
 * @extends NamedEntity
 */
Entities.OrganizationEntity = class extends Entities.NamedEntity{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Entities$OrganizationEntity'}

    /**
     *
     * @param uri {String}
     * @param token {String}
     */
    constructor(uri, token){
        if(arguments.length) {
            super(Entities.OrganizationEntity.type(), uri, token)
        }else{
            super(Entities.OrganizationEntity.type())
        }
    }
}


/**
 * @class PersonEntity
 * @extends NamedEntity
 */
Entities.PersonEntity = class extends Entities.NamedEntity{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Entities$PersonEntity'}

    /**
     *
     * @param uri {String}
     * @param token {String}
     */
    constructor(uri, token){
        if(arguments.length) {
            super(Entities.PersonEntity.type(), uri, token)
        }else{
            super(Entities.PersonEntity.type())
        }
    }
}



/**
 * @namespace Collaboration
 */
let Collaboration = {};




/**
 * @class PlayerState
 * @extends Model
 */
Collaboration.PlayerState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$PlayerState'}

    /**
     *
     * @param action {String}
     */
    constructor(state){
        super(Collaboration.PlayerState.type())
        this.state = null
        if(arguments.length) {
            this.state = new Integer(state)
        }
    }

    /**
     * UNSTARTED PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static UNSTARTED(){ return Collaboration.PlayerState(-1) }
    /**
     * ENDED PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static ENDED(){ return Collaboration.PlayerState(0) }
    /**
     * PLAYING PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static PLAYING(){ return Collaboration.PlayerState(1) }
    /**
     * PAUSED PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static PAUSED(){ return Collaboration.PlayerState(2) }
    /**
     * BUFFERING PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static BUFFERING(){ return Collaboration.PlayerState(3) }
    /**
     * CUED PlayerState
     * @returns {Collaboration.PlayerState}
     */
    static CUED(){ return Collaboration.PlayerState(5) }

}



/**
 * @class View
 * @extends Model
 */
Collaboration.View = class extends Model{
    /**
     *
     * @param id {UUID}
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     */
    constructor(type, id, collaborationId, app, resource, key, entities){
        super(type)
        this.id = null
        this.collaborationId = null
        this.app = null
        this.resource = null
        this.key = null
        this.entities = new Set()
        if(arguments.length > 1) {
            this.id = new UUID(id)
            this.collaborationId = new UUID(collaborationId)
            this.app = Type.check(app, Apps.App)
            this.resource = Type.check(resource, Resource.Resource)
            this.key = new String(key)
            // FIXME: Set does not define "map"
            this.entities = entities
        }
    }
}


/**
 * @class UrlView
 * @extends View
 */
Collaboration.UrlView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$UrlView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     */
    constructor(collaborationId, app, resource, key, entities){
        if(arguments.length) {
            super(Collaboration.UrlView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities)
        }else{
            super(Collaboration.UrlView.type())
        }
    }
}



/**
 * @class DocumentView
 * @extends View
 */
Collaboration.DocumentView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$DocumentView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     * @param page {Int}
     */
    constructor(collaborationId, app, resource, key, entities, sampleTimeMs, playerState){
        if(arguments.length) {
            super(Collaboration.DocumentView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, page)
            this.page = page
        }else{
            super(Collaboration.DocumentView.type())
            this.page = null
        }
    }
}

/**
 * @class VideoView
 * @extends View
 */
Collaboration.VideoView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$VideoView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     * @param sampleTimeMs {Double}
     * @param playerState {Conversant.PlayerState}
     */
    constructor(collaborationId, app, resource, key, entities, sampleTimeMs, playerState){
        if(arguments.length) {
            super(Collaboration.VideoView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, sampleTimeMs, playerState)
            this.sampleTimeMs = sampleTimeMs
            this.playerState = Type.check(playerState, Collaboration.PlayerState)
        }else{
            super(Collaboration.VideoView.type())
            this.sampleTimeMs = null
            this.playerState = null
        }
    }
}

/**
 * @class ImageView
 * @extends View
 */
Collaboration.ImageView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ImageView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     * @param transform {Geom.Transform3d}
     */
    constructor(collaborationId, app, resource, key, entities, transform){
        if(arguments.length) {
            super(Collaboration.ImageView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform)
            this.transform = Type.check(transform, Geom.Transform3d)
        }else{
            super(Collaboration.ImageView.type())
            this.transform =  null
        }
    }
}



/**
 * @class GLView
 * @extends View
 */
Collaboration.GLView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$GLView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     * @param transform {Geom.Transform3d}
     */
    constructor(collaborationId, app, resource, key, entities, transform){
        if(arguments.length) {
            super(Collaboration.GLView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform)
            this.transform = Type.check(transform, Geom.Transform3d)
        }else{
            super(Collaboration.GLView.type())
            this.transform =  null
        }
    }
}

/**
 * @class MapView
 * @extends View
 */
Collaboration.MapView = class extends Collaboration.View{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$MapView'}

    /**
     *
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     * @param lat {Double}
     * @param lng {Double}
     * @param zoom {Double}
     * @param markers {String}
     * @param update {String}
     * @param address {String}
     * @param name {String}
     */
    constructor(collaborationId, app, resource, key, entities, lat, lng, zoom, markers, update, address, name){
        if(arguments.length) {
            super(Collaboration.MapView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform)
            this.lat = lat
            this.lng = lng
            this.zoom = zoom
            this.markers = markers
            this.update = update
            this.address = address
            this.name = name
        }else{
            super(Collaboration.MapView.type())
            this.lat = null
            this.lng = null
            this.zoom = null
            this.markers = null
            this.update = null
            this.address = null
            this.name = null
        }
    }
}

/**
 * @class SyncViewEvent
 * @extends Model
 * Application Event to Sync the View state.
 */
Collaboration.SyncViewEvent = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$SyncViewEvent'}

    /**
     *
     * @param collaborationId {String}
     * @param orgId {String}
     * @param provider {Auth.Provider}
     * @param viewerState {Collaboration.View}
     */
    constructor(collaborationId, orgId, provider, viewerState){
        super(Collaboration.SyncViewEvent.type())
        this.collaborationId = null
        this.orgId = null
        this.provider = null
        this.viewerState = null
        if(arguments.length) {
            this.collaborationId = new UUID(collaborationId)
            this.orgId = new UUID(orgId)
            this.provider = Type.check(provider, Auth.Provider)
            this.viewerState = viewerState
        }
    }
}

/**
 * @class SyncUserEvent
 * @extends Model
 * System level event for passing user state.
 */
Collaboration.SyncUserEvent = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$SyncUserEvent'}

    /**
     *
     * @param collaborationId {String}
     * @param orgId {String}
     * @param provider {Auth.Provider}
     * @param userState {Auth.UserState}
     */
    constructor(collaborationId, orgId, provider, userState){
        super(Collaboration.SyncUserEvent.type())
        this.collaborationId = null
        this.orgId = null
        this.provider = null
        this.userState = null
        if(arguments.length) {
            this.collaborationId = new UUID(collaborationId)
            this.orgId = new UUID(orgId)
            this.provider = Type.check(provider, Auth.Provider)
            this.userState = Type.check(userState, Auth.UserState)
        }
    }
}


/**
 * @class Notification
 * @extends Model
 */
Collaboration.Notification = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$Notification'}

    /**
     *
     * @param providerKey {String}
     * @param rules {Collaboration.NotificationRule[]}
     */
    constructor(providerKey, rules){
        super(Collaboration.Notification.type())
        this.providerKey = null
        this.rules = null
        if(arguments.length) {
            this.providerKey = new String(providerKey)
            // TOOD: rules [NotificationRule]
        }
    }
}

/**
 * @class Collaboration
 * @extends Model
 */
Collaboration.Collaboration = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(type, id, orgId, members, notifications, name, avatarUrl, cover, content, settings){
        super(type)

        this.id = null
        this.orgId = null
        this.members = null
        this.notifications = null
        this.name = null
        this.avatarUrl = null
        this.cover = null
        this.content = null
        this.settings = null
        console.log('arguments.length',arguments.length)
        if( arguments.length > 1) {
            this.id = new UUID(id)
            this.orgId = new UUID(orgId)
            this.members = members.map((m) => Type.check(m, Auth.Provider))
            this.notifications = Type.check(notifications, Collaboration.Notification)
            this.name = typeof name === "undefined" ? null : new String(name)
            this.avatarUrl = avatarUrl
            this.cover = cover
            this.content = content.map((c) => Type.check(c, Collaboration.Content))
            this.settings = settings
        }
    }
}

/**
 * @class CollaborationAdHoc
 * @extends Collaboration
 */
Collaboration.CollaborationAdHoc = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationAdHoc'}

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, orgId, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationAdHoc.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationAdHoc.type())
        }
    }
}

/**
 * @class CollaborationGroup
 * @extends Collaboration
 */
Collaboration.CollaborationGroup = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationGroup'}

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, orgId, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationGroup.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationGroup.type())
        }
    }
}



/**
 * @class CollaborationCustomer
 * @extends Collaboration
 */
Collaboration.CollaborationCustomer = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationCustomer'}

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, orgId, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationCustomer.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationCustomer.type())
        }
    }
}

/**
 * @class CollaborationContact
 * @extends Collaboration
 */
Collaboration.CollaborationContact = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationContact'}

    /**
     *
     * @param id {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationContact.type(), id, m.Auth.zeroId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationContact.type())
        }
    }
}


/**
 * @class CollaborationConversation
 * @extends Collaboration
 */
Collaboration.CollaborationConversation = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationConversation'}

    /**
     *
     * @param id {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name OPTIONAL {String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationConversation.type(), id, m.Auth.zeroId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationConversation.type())
        }
    }
}


/**
 * @class CollaborationChannel
 * @extends Collaboration
 */
Collaboration.CollaborationChannel = class extends Collaboration.Collaboration{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$CollaborationChannel'}

    /**
     *
     * @param id {String}
     * @param orgId {String}
     * @param members {Auth.Provider[]}
     * @param notifications {Collaboration.Notification[]}
     * @param name Option{String}
     * @param avatarUrl OPTIONAL {String}
     * @param cover OPTIONAL {String}
     * @param content {Collaboration.Content[]}
     * @param settings {Map}
     */
    constructor(id, orgId, members, notifications, name, avatarUrl, cover, content, settings){
        if(arguments.length) {
            super(Collaboration.CollaborationChannel.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings)
        }else{
            super(Collaboration.CollaborationChannel.type())
        }
    }
}


/**
 * @class Content
 * @extends Model
 */
Collaboration.Content = class extends Model{

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.Provider[]}
     * @param seen {Auth.Provider[]}
     * @param message {Collaboration.Message}
     * @param viewId {UUID}
     */
    constructor(type, id, collaborationId, orgId, timestamp, authors, seen, message, viewId){
        super(type)
        this.id = null
        this.collaborationId = null
        this.orgId = null
        this.timestamp = null
        this.authors = null
        this.seen = null
        this.message = null
        this.viewId = null
        if(arguments.length > 1) {
            this.id = new UUID(id)
            this.collaborationId = new UUID(collaborationId)
            this.orgId = new UUID(orgId)
            this.timestamp = new String(timestamp)
            // FIXME: Set does not define "map"
            //this.authors = authors.map((a) => Type.check(a, Auth.Provider))
            this.authors = authors
            //this.seen = seen.map((s) => Type.check(s, Auth.Provider))
            this.seen = seen
            this.message = message
            this.viewId = new UUID(viewId)
        }
    }
}

/**
 * @class ContentMsg
 * @extends Content
 */
Collaboration.ContentMsg = class extends Collaboration.Content{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ContentMsg'}

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.Provider[]}
     * @param seen {Auth.Provider[]}
     * @param sentiment Option{String}
     * @param nlp Option{String}
     * @param ner {Entities.NamedEntity[]}
     * @param message {Collaboration.Message}
     * @param viewId {UUID}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, sentiment, nlp, ner, message, viewId){

        if(arguments.length) {
            super(Collaboration.ContentMsg.type(),id, collaborationId, orgId, timestamp, authors, seen, message, viewId)
            this.sentiment = sentiment
            this.nlp = nlp
            //this.ner = ner.map((s) => Type.check(s, Entities.NamedEntity))  // FIXME: Set does not have "map" defined on it..
            this.ner = ner
        }else{
            super(Collaboration.ContentMsg.type())
            this.sentiment = null
            this.nlp = null
            this.ner = null
        }

    }
}

/**
 * @class ContentLinkCard
 * @extends Content
 */
Collaboration.ContentLinkCard = class extends Collaboration.Content{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ContentLinkCard'}

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.Provider[]}
     * @param seen {Auth.Provider[]}
     * @param message {Collaboration.Message}
     * @param entityUri {String}
     * @param viewId {UUID}
     * @param meta {ETL.Meta}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, entityUri, viewId, meta){
        if(arguments.length) {
            super(Collaboration.ContentLinkCard.type(),id, collaborationId, orgId, timestamp, authors, seen, message, viewId)
            this.entityUri = new String(entityUri)
            this.meta = Type.check(s, ETL.EntityMeta)
        }else{
            super(Collaboration.ContentLinkCard.type())
            this.entityUri = null
            this.meta = null
        }
    }
}

/**
 * @class ContentNotification
 * @extends Content
 */
Collaboration.ContentNotification = class extends Collaboration.Content{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ContentNotification'}

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.Provider[]}
     * @param seen {Auth.Provider[]}
     * @param message {Collaboration.Message}
     * @param viewId {UUID}
     * @param severity {Collaboration.NotificationLevel}
     * @param icon {String}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, viewId, severity, icon){
        if(arguments.length) {
            super(Collaboration.ContentNotification.type(),id, collaborationId, orgId, timestamp, authors, seen, message, viewId)
            this.severity = Type.check(severity, Collaboration.NotificationLevel)
            this.icon = new String(icon)

        }else{
            super(Collaboration.ContentNotification.type())
            this.severity = null
            this.icon = null
        }
    }
}


/**
 * @class ContentAppEvent
 * @extends Content
 */
Collaboration.ContentAppEvent = class extends Collaboration.Content{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ContentAppEvent'}

    /**
     *
     * @param id {String}
     * @param collaborationId {String}
     * @param orgId {String}
     * @param timestamp {String}
     * @param authors {Auth.Provider[]}
     * @param seen {Auth.Provider[]}
     * @param message {Collaboration.Message}
     * @param viewId {UUID}
     * @param coverImg {String}
     * @param actions Set{Apps.App[]}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, viewId, coverImg, actions){
        if(arguments.length) {
            super(Collaboration.ContentAppEvent.type(),id, collaborationId, orgId, timestamp, authors, seen, message, viewId)
            this.coverImg = new String(coverImg)
            //this.actions = actions.map((s) => Type.check(s, Apps.App))
            this.actions = actions
        }else{
            super(Collaboration.ContentAppEvent.type())
            this.coverImg = null
            this.actions = null
        }
    }
}


/**
 * @class NotificationLevel
 * @extends Model
 */
Collaboration.NotificationLevel = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$NotificationLevel'}

    /**
     * @param severity {String}
     */
    constructor( severity ){
        super(Collaboration.NotificationLevel.type())
        this.severity = null
        if(arguments.length) {
            this.severity = new String(severity)
        }
    }

    static info() { new NotificationLevel("info") }
    static warning() { new NotificationLevel("warning") }
    static error(){ new NotificationLevel("error")}
}


/**
 * @class Message
 * @extends Model
 */
Collaboration.Message = class extends Model{

    /**
     *
     * @param text {String}
     * @param mentions {Auth.Provider[]}
     */
    constructor(type, text, mentions){
        super(type)
        this.text = null
        this.mentions = null
        if(arguments.length > 1) {
            this.text = new String(text)
            // FIXME: no "map" on Set
            //this.mentions = mentions.map((a) => Type.check(a, Auth.Provider))
            this.mentions = mentions
        }
    }
}

/**
 * @class MessageBasic
 * @extends Message
 */
Collaboration.MessageBasic = class extends Collaboration.Message{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$MessageBasic'}

    /**
     *
     * @param text {String}
     * @param mentions {Auth.Provider[]}
     */
    constructor(text, mentions){
        if(arguments.length) {
            super(Collaboration.MessageBasic.type(), text, mentions)
        }else{
            super(Collaboration.MessageBasic.type())
        }
    }
}

/**
 * @class BroadcastContent
 * @extends Model
 */
Collaboration.BroadcastContent = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$BroadcastContent'}

    /**
     *
     * @param content {Collaboration.Content}
     * @param view Option{Collaboration.View}
     */
    constructor(content, view){
        super(Collaboration.BroadcastContent.type())
        this.content = null
        this.view = null
        if(arguments.length) {
            this.content = content
            this.view = view
        }
    }
}

/**
 * @namespace Apps
 */
let Apps = {};

/**
 * @class App
 * @extends Model
 * Identifies an application of the system.
 */
Apps.App = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$App'}

    /**
     *
     * @param id {String}
     * @param name {String}
     * @param icon {String}
     * @param origin {String} The origin fo the iframe that the app will be hosted in
     * @param entry {String} The entry point for the application
     * @param args {String}
     */
    constructor(id, name, icon, origin, entry, args){
        super(Apps.App.type())
        this.id = new String(id)
        this.name = new String(name)
        this.icon = new String(icon)
        this.origin = new String(origin)
        this.entry = new String(entry)
        this.args = args
    }

    static info(){ new Apps.App("info","Chat Info", "fa fa-info ", "apps.conversant.im", "https://apps.conversant.im/app/info", {}) }
    static invite(){ new Apps.App("invite","Add People", "fa fa-user-plus ", "apps.conversant.im", "https://apps.conversant.im/app/invite", {}) }
    static drive(){ new Apps.App("drive","Drive", "fa fa-folder ", "apps.conversant.im", "https://apps.conversant.im/app/drive", {}) }
    static webCall(){ new Apps.App("call","Web Call", "fa fa-phone ", "*.conversant.im", "https://apps.conversant.im/app/call", {}) }
    static youtube(){ new Apps.App("youtube","YouTube", "fa fa-youtube ", "apps.conversant.im", "https://apps.conversant.im/app/youtube", {}) }
    static map(){ new Apps.App("map","Maps", "fa fa-map-marker", "apps.conversant.im", "https://apps.conversant.im/app/map", {}) }
    static image(){ new Apps.App("image","Image Viewer", "fa fa-picture-o", "apps.conversant.im", "https://apps.conversant.im/app/image", {}) }
    static giffy(){ new Apps.App("giffy","Giffy", "fa fa-file-o", "apps.conversant.im", "https://apps.conversant.im/app/giffy", {}) }
}


/**
 * @class AppMode
 * @extends Model
 *
 */
Apps.AppMode = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$AppMode'}

    /**
     *
     * @param mode {String} mode the app is to run in
     */
    constructor(mode){
        super(Apps.AppMode.type())
        this.mode = null
        if(arguments.length){
            this.mode = new String(mode)
        }
    }

    static syncApp(){ new Apps.AppMode("syncApp") }
    static collaborationApp(){ new Apps.AppMode("collaborationApp") }
    static standAloneApp(){ new Apps.AppMode("standAloneApp") }
}


/**
 * @class Launch
 * @extends Model
 *
 */
Apps.Launch = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$Launch'}

    /**
     *
     * @param app {Apps.App} App to load
     * @param url {String} url to send to app
     * @param mode {Apps.Mode} The mode the app is expected to handle
     */
    constructor(load, url, mode){
        super(Apps.Launch.type())
        this.load = null
        this.url = null
        this.mode = null
        if(arguments.length){
            this.app = Type.check(app, Apps.App)
            this.url = new String(url)
            this.mode = Type.check(mode, Apps.AppMode)
        }

    }
}


/**
 * @class Init
 * @extends Model
 * Signal the host that the app is ready for initialization.
 */
Apps.Init = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$Init'}

    /**
     *
     * @param appId {String} Your app id to initialize
     * @param mode {Apps.AppMode} mode you app is running in.
     */
    constructor(appId, mode){
        super(Apps.Init.type())
        this.appId = new String(appId)
        this.mode = Type.check(mode, Apps.AppMode)
    }
}


/**
 * @class InitApp
 * @extends Model
 */
Apps.InitApp = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitApp'}

    /**
     *
     * @param app {Apps.App}
     * @param restoreState {Collaboration.View} OPTIONAL The view state that is to be restored
     * @param mode {Apps.AppMode}
     */
    constructor(app, restoreState, mode){
        super(Apps.InitApp.type())
        this.app = null
        this.restoreState = null
        if(arguments.length) {
            this.app = Type.check(app, Apps.App)
            this.restoreState = restoreState
        }
    }
}

/**
 * @class InitProfile
 * @extends Model
 */
Apps.InitProvider = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitProvider'}

    /**
     *
     * @param provider {Auth.Provider}
     */
    constructor(provider){
        super(Apps.InitProvider.type())
        this.provider = null
        if(arguments.length) {
            this.provider = Type.check(provider, Auth.Provider)
        }
    }
}

/**
 * @class InitOrganization
 * @extends Model
 */
Apps.InitOrganization = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitOrganization'}

    /**
     *
     * @param organization {Auth.Organization}
     */
    constructor(organization){
        super(Apps.InitOrganization.type())
        this.organization = null
        if(arguments.length) {
            this.organization = Type.check(organization, Auth.Organization)
        }
    }
}

/**
 * @class InitCollaboration
 * @extends Model
 */
Apps.InitCollaboration = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitCollaboration'}

    /**
     *
     * @param collaboration Option{Collaboration.Collaboration}
     */
    constructor(collaboration){
        super(Apps.InitCollaboration.type())
        this.collaboration = null
        if(arguments.length) {
            this.collaboration = collaboration
        }
    }
}

/**
 * @class InitTeam
 * @extends Model
 */
Apps.InitTeam = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitTeam'}

    /**
     *
     * @param team {Collaboration.SyncUserEvent[]}
     */
    constructor(team){
        super(Apps.InitTeam.type())
        this.team = null
        if(arguments.length) {
            this.team = team.map((t) => Type.check(t, Collaboration.SyncUserEvent))
        }
    }
}

/**
 * @class InitPeers
 * @extends Model
 */
Apps.InitPeers = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitPeers'}

    /**
     *
     * @param peers {Peers.PeerState[]}
     */
    constructor(peers, room){
        super(Apps.InitPeers.type())
        this.peers = null
        this.room = null
        if(arguments.length) {
            this.peers = peers.map((p) => Type.check(t, Peers.PeerState))
            this.room = new String(room)
        }
    }
}

/**
 * @namespace Peers
 */
let Peers = {};

/**
 * @class PeerState
 * @extends Model
 */
Peers.PeerState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Peers$PeerState'}

    /**
     * @param provider {Auth.Provider}
     * @param collaborationId {String}
     * @param userAgent {String}
     * @param iceConnectionState {Peers.IceConnectionState}
     * @param signalingState {Peers.SignalingState}
     */
    constructor( provider, collaborationId, userAgent, iceConnectionState, signalingState ){
        super(Peers.PeerState.type())
        this.provider = null
        this.collaborationId = null
        this.userAgent = null
        this.iceConnectionState = null
        this.signalingState = null
        if(arguments.length) {
            this.provider = null
            this.collaborationId = new String(collaborationId)
            this.userAgent = typeof userAgent === "undefined" ? null : new String(userAgent)
            this.iceConnectionState = Type.check(iceConnectionState, Peers.IceConnectionState)
            this.signalingState = Type.check(signalingState, Peers.SignalingState)
        }
    }
}

/**
 * @class IceConnectionState
 * @extends Model
 */
Peers.IceConnectionState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Peers$IceConnectionState'}

    /**
     * @param state {String}
     */
    constructor( state ){
        super(Peers.IceConnectionState.type())
        this.state = null
        if(arguments.length) {
            this.state = new String(state)
        }
    }

    static new() { new IceConnectionState("new") }
    static checking() { new IceConnectionState("checking") }
    static connected(){ new IceConnectionState("connected")}
    static completed(){ new IceConnectionState("completed")}
    static failed(){ new IceConnectionState("failed")}
    static disconnected(){ new IceConnectionState("disconnected")}
    static closed(){ new IceConnectionState("closed")}
}


/**
 * @class SignalingState
 * @extends Model
 */
Peers.SignalingState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Peers$SignalingState'}

    /**
     * @param state {String}
     */
    constructor( state ){
        super(Peers.SignalingState.type())
        this.state = null
        if(arguments.length) {
            this.state = new String(state)
        }
    }

    static stable() { new SignalingState("stable") }
    static haveLocalOffer() { new SignalingState("have-local-offer") }
    static haveLocalPranswer(){ new SignalingState("have-local-pranswer")}
    static haveRemotePranswer(){ new SignalingState("have-remote-pranswer")}
    static closed(){ new SignalingState("closed")}
}


/**
 * @namespace Resource
 */
let Resource = {};

/**
 * @class Resource
 * @extends Model
 */
Resource.Resource = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Resource$Resource'}

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
 * @extends Model
 * A 3D transformation
 */
Geom.Transform3d = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Geom$Transform3d'}

    /**
     *
     * @param matrix {number[]}
     */
    constructor(matrix){
        super(Geom.Transform3d.type())
        this.matrix = [1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]
        if( arguments.length ) {
            this.matrix = matrix
            if (this.matrix.length != (4 * 4)) {
                throw new Error('Matrix is not 4x4')
            }
        }
    }

    /**
     * The identity matrix
     * @returns {number[]}
     */
    static identity(){
        return new Geom.Transform3d([1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]);
    }
}

/**
 * @namespace ETL
 */
let ETL = {};


/**
 * @class EntityMeta
 * @extends Model
 */
ETL.EntityMeta = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.ETL$EntityMeta'}

    /**
     * @param uri {String}
     * @param timestamp {String}
     * @param version {String}
     * @param icon {String}
     * @param thumb {String}
     * @param domain {String}
     * @param publishDate {String}
     * @param contentType {String}
     * @param title {String}
     * @param description {String}
     * @param authors {String[]}
     * @param keywords {String[]}
     * @param coverUrl {String}
     * @param imgs {String[]}
     * @param meta {Map}
     * @param content {String}
     * @param raw {String}
     */
    constructor(uri,timestamp,version,icon,thumb,domain,publishDate,contentType,title,description,authors,keywords,coverUrl,imgs,meta,content,raw){
        super(ETL.EntityMeta.type())
        this.uri = null
        this.timestamp = null
        this.version = null
        this.icon= null
        this.thumb = null
        this.domain = null
        this.publishDate = null
        this.contentType = null
        this.title = null
        this.description = null
        this.authors = null
        this.keywords = null
        this.coverUrl = null
        this.imgs = null
        this.meta = null
        this.content = null
        this.raw = null
        if(arguments.length){
            this.uri = new String(uri)
            this.timestamp = new String(timestamp)
            this.version = new String(version)
            this.icon= new String(icon)
            this.thumb = new String(thumb)
            this.domain = new String(domain)
            this.publishDate = typeof publishDate === "undefined" ? null : new String(publishDate)
            this.contentType =  new String(contentType)
            this.title = new String(title)
            this.description = new String(description)
            this.authors = authors
            this.keywords = keywords
            this.coverUrl = new String(coverUrl)
            this.imgs = imgs
            this.meta = meta
            this.content = typeof content === "undefined" ? null : new String(content)
            this.raw = typeof raw === "undefined" ? null : new String(raw)
        }
    }
}


module.exports = {
    Type: Type,
    UUID: UUID,
    List: List,
    Integer: Integer,
    Float: Float,
    Double: Double,
    Long: Long,
    Option: Option,
    Auth:Auth,
    Collaboration:Collaboration,
    Apps:Apps,
    Entities: Entities,
    Geom:Geom,
    Peers: Peers,
    Resource: Resource,
    ETL:ETL
}


window.m = module.exports






