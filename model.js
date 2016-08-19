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
 * @class OrganizationRoles
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
 * @class Organization
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
 * @class ViewerState
 * Used by applications to sync the view state of a sync panel.
 */
Collaboration.ViewerState = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Collaboration$ViewerState'}

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
        this.app = null
        this.resource = null
        this.sampleTimeMs = null
        this.settings = null
        this.transform = null
        if(arguments.length) {
            this.app = Type.check(app, Apps.App)
            this.resource = Type.check(resource, Resource.Resource)
            this.sampleTimeMs = new m.Double(sampleTimeMs)
            this.settings = settings
            this.transform = Type.check(transform, Geom.Transform3d)
        }
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
    static type(){ return 'm.Collaboration$SyncViewEvent'}

    /**
     *
     * @param collaborationId {String}
     * @param orgId {String}
     * @param provider {Auth.Provider}
     * @param viewerState {Collaboration.ViewerState}
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
            this.viewerState = Type.check(viewerState, Collaboration.ViewerState)
        }
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
 *
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
            this.avatarUrl = typeof avatarUrl === "undefined" ? null : new String(avatarUrl)
            this.cover = typeof cover === "undefined" ? null : new String(cover)
            this.content = content.map((c) => Type.check(c, Collaboration.Content))
            this.settings = settings
        }
    }
}

/**
 * @class CollaborationAdHoc
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
 * @class CollaborationChannel
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
     * @param name OPTIONAL {String}
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
     * @param view {Collaboration.ViewerState}
     */
    constructor(type, id, collaborationId, orgId, timestamp, authors, seen, message, view){
        super(type)
        this.id = null
        this.collaborationId = null
        this.orgId = null
        this.timestamp = null
        this.authors = null
        this.seen = null
        this.message = null
        this.view = null
        if(arguments.length > 1) {
            this.id = new UUID(id)
            this.collaborationId = new UUID(collaborationId)
            this.orgId = new UUID(orgId)
            this.timestamp = new String(timestamp)
            this.authors = authors.map((a) => Type.check(a, Auth.Provider))
            this.seen = seen.map((s) => Type.check(s, Auth.Provider))
            this.message = Type.check(message, Collaboration.Message)
            this.view = Type.check(view, Collaboration.ViewerState)
        }
    }
}

/**
 * @class ContentMsg
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
     * @param sentiment {String}
     * @param nlp {String}
     * @param ner {Entities.NamedEntity[]}
     * @param message {Collaboration.Message}
     * @param view {Collaboration.ViewerState}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, sentiment, nlp, ner, message, view){

        if(arguments.length) {
            super(Collaboration.ContentMsg.type(),id, collaborationId, orgId, timestamp, authors, seen, message, view)
            this.sentiment = typeof sentiment === "undefined" ? null : new String(sentiment)
            this.nlp = typeof nlp === "undefined" ? null : new String(nlp)
            this.ner = ner.map((s) => Type.check(s, Entities.NamedEntity))
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
     * @param view {Collaboration.ViewerState}
     * @param meta {ETL.Meta}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, entityUri, view, meta){
        if(arguments.length) {
            super(Collaboration.ContentLinkCard.type(),id, collaborationId, orgId, timestamp, authors, seen, message, view)
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
     * @param view {Collaboration.ViewerState}
     * @param severity {Collaboration.NotificationLevel}
     * @param icon {String}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, view, severity, icon){
        if(arguments.length) {
            super(Collaboration.ContentNotification.type(),id, collaborationId, orgId, timestamp, authors, seen, message, view)
            this.severity = Type.check(severity, Collaboration.NotificationLevel)
            this.icon = new String(icon)

        }else{
            super(Collaboration.ContentAppEvent.type())
            this.severity = null
            this.icon = null
        }
    }
}


/**
 * @class ContentAppEvent
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
     * @param view {Collaboration.ViewerState}
     * @param coverImg {String}
     * @param actions {Apps.App[]}
     */
    constructor(id, collaborationId, orgId, timestamp, authors, seen, message, view, coverImg, actions){
        if(arguments.length) {
            super(Collaboration.ContentAppEvent.type(),id, collaborationId, orgId, timestamp, authors, seen, message, view)
            this.coverImg = new String(coverImg)
            this.actions = actions.map((s) => Type.check(s, Apps.App))
        }else{
            super(Collaboration.ContentAppEvent.type())
            this.coverImg = null
            this.actions = null
        }
    }
}


/**
 * @class NotificationLevel
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
            this.mentions = mentions.map((a) => Type.check(a, Auth.Provider))
        }
    }
}

/**
 * @class MessageBasic
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
            super(Collaboration.MessageBasic.type(),text, mentions)
        }else{
            super(Collaboration.MessageBasic.type())
        }
    }
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
 * @class Launch
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
     * @param restoreState {Collaboration.ViewerState} OPTIONAL The view state that is to be restored
     * @param mode {Apps.AppMode}
     */
    constructor(app, restoreState, mode){
        super(Apps.InitApp.type())
        this.app = null
        this.restoreState = null
        if(arguments.length) {
            this.app = Type.check(app, Apps.App)
            this.restoreState = typeof restoreState === "undefined" ? null : [Type.check(restoreState, Collaboration.ViewerState)]
        }
    }
}

/**
 * @class InitProfile
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
 */
Apps.InitCollaboration = class extends Model{
    /**
     * Return the full class name of this type.
     * @returns {string}
     */
    static type(){ return 'm.Apps$InitCollaboration'}

    /**
     *
     * @param collaboration {Collaboration.Collaboration}
     */
    constructor(collaboration){
        super(Apps.InitCollaboration.type())
        this.collaboration = null
        if(arguments.length) {
            this.collaboration = Type.check(collaboration, Collaboration.Collaboration)
        }
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
 * @class Resource
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






