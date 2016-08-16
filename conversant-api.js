"use strict"
let Rx = require('rx-lite')
let m = require('./model')
let mapper = require('./mapper')

/**
 * @class API
 * base class for api implementation.
 */
class API {
	constructor(observer, observable) {
		this.mapper = new mapper.Mapper()
		//this.futures = new Map
		this.channelSubject = Rx.Subject.create(observer, observable)
		this.channelSubject.subscribe((x) => {console.log(x);}, (e) => {console.log(e);})
	}

	_send(data){
		//console.log('channelSubject.onNext', data)
		this.channelSubject.onNext(data)
	}

	/**
	 * addResponder
	 * The method allows you to register handlers for data of a certain 'type'.  When data of this
	 * type passes through the stream each of your registered handlers will be called with an
	 * opportunity to react on this data.
	 *
	 * @param type {String} A String indicating the ES6 class name that you want to subscribe to
	 * @param fun {function} The function that will receive data. The data will be instances of the
	 * type parameter passed in.
	 *
	 * @returns {Rx.Subscription}
     */
	addResponder(type, fun){
		let subject = new Rx.Subject()
		this.channelSubject.filter( (x) => x.$type === type ).subscribe(subject)
		return typeof fun === "undefined" ? subject.subscribe() : subject.subscribe( (x) => fun(x))
	}

	_addFuture(type, fun){
		let subject = new Rx.Subject()
		this.channelSubject.filter( (x) => x.$type === type ).subscribe(subject)
		let subscription = subject.subscribe( (x) => {
			fun(x)
			subscription.dispose()
		})
	}

	_futurePromise(type){
		let p = new Promise((resolve, reject) => {
			this._addFuture(type, resolve)
		})
		return p
	}

	/**
	 * addGuest(profile:Auth.ProfileInfo):Future[Auth.PrimaryProfile]
	 * Add a guest account to the system.  You will need to pass in the provider type and unique
	 * id for that provider.  Examples of providers and valid id are:
	 *    provider: 'email',  id: 'user@gmail.com'
	 *    or
	 *    provider: 'phone', id: '+1.777.222.1111'
	 *
	 * @param profile {Auth.ProfileInfo}
	 * profile for the new guest of type 'm.Auth.ProfileInfo'
	 * @returns promise {Promise} that will be filled with {Auth.PrimaryProfile}
	 * This function returns a promise that will be filled with an instance of
	 * 'm.Auth.PrimaryProfile' for the guest that was created
     */
	addGuest(profile) {
		let p = new Promise((resolve, reject) => {
			m.Type.check(profile, m.Auth.ProfileInfo, reject)
			this._addFuture(m.Auth.PrimaryProfile.type(), resolve)
			this.send(this.mapper.write(profile))
		})
		return p
	}

	/**
	 * def syncUser(sync:Collaboration.SyncUserEvent):Unit
	 * Synchronize user state.
	 *
	 * @param sync {Collaboration.SyncUserEvent}
	 * The synchronize event to be shared with other users on the system.  This parameter is
	 * of type 'm.Collaboration.SyncUserEvent'
     */
	syncUser(sync){
		m.Type.check(sync, m.Collaboration.SyncUserEvent)
		this._send(this.mapper.write(sync))
	}

	/**
	 * def syncView(sync:Collaboration.SyncViewEvent):Unit
	 * Synchronize view/app state in the synchronization pannel.
	 *
	 * @param sync {m.Collaboration.ViewerState}
	 * The synchronize event bring application state in sync.  This parameter is
	 * of type 'm.Collaboration.ViewerState'
     */
	syncView(sync){
		m.Type.check(sync, m.Collaboration.ViewerState)
		let syncEvent = new m.Collaboration.SyncViewEvent(this.appParams.collaboration.id,this.appParams.collaboration.orgId,this.appParams.provider,sync);
		this._send(this.mapper.write(syncEvent))
	}

	sendMessage(msg, view){
		let content = new m.Collaboration.ContentMsg(
			m.Auth.zeroId,
			this.appParams.collaboration.id,
			this.appParams.collaboration.orgId,
			"",
			[this.appParams.provider],
			[this.appParams.provider],
			null,
			null,
			null,
			new m.Collaboration.MessageBasic(msg, []),
			view);

		this._send(this.mapper.write(content))

	}

	send(x){
		this._send(this.mapper.write(x))
	}

	// def sendChatMessage(author:Auth.ProfileInfo, cId: String, v:Collaboration.ViewerState, content:Option[String], contentClass:Collaboration.ContentClass):Unit
	// def getUser(uuid:String):Future[Auth.PrimaryProfile]
	// def getProfileRelationship(rel:Graph.GetProfileRelationships):Future[Graph.ProfileRelationship]
	// def addContentToUserFavorites(userId:String, profile: Auth.ProfileInfo, content:Collaboration.Content):Future[Collaboration.TaggedContent]
	// def loadApplication(load:Apps.App):Future[Apps.Launch]
	// def getOrganization(appName:String, orgId:String):Future[Auth.Organization]
	// def updateProfile(update:Auth.UpdateProfile):Future[Auth.ProfileInfo]
	// def addCollaborationMembers(c:Collaboration.Collaboration, members:Set[Auth.ProfileInfo]):Future[Collaboration.Collaboration]
	// def getCollaborationContent(cid:String, before:Option[String] = None):Future[Collaboration.Collaboration]
	// def getFiles(orgId:String):Future[Resource.FileList]
	// def saveFile(file:Resource.File):Future[Resource.File]
	// def maxSeach(m:Max.Search):Future[Max.SearchResultList]
	// def getCollaborationContentTagged(userId:String, tag:String, cid:Option[String] =  None):Future[Collaboration.TaggedContentList]
	// def createInvite(collaborationId:String, from:Auth.ProfileInfo, to:Auth.ProfileInfo):Future[Collaboration.InviteLink]
}

/**
 * AppParameters is the initilization parameter passed in to your application.
 * @see {ConversantAPI}
 */
class AppParameters{

	/**
	 * @param app {Apps.App}
	 * @param restoreState {Collaboration.ViewerState}
	 * @param organization {Auth.Organization}
	 * @param collaboration {Collaboration.Collaboration}
	 * @param profile {Auth.ProfileInfo}
	 * @param team {Collaboration.SyncUserEvent[]}
     * @param peers {Peers.PeerState[]}
     */
	constructor(app, restoreState, organization, collaboration, provider, team, peers){
		this.app =  m.Type.check(app, m.Apps.App)
		this.restoreState = typeof restoreState === "undefined" ?  null : m.Type.check(restoreState, m.Collaboration.ViewerState)
		this.organization = m.Type.check(organization, m.Auth.Organization)
		this.collaboration = m.Type.check(collaboration, m.Collaboration.Collaboration)
		this.provider = m.Type.check(provider, m.Auth.Provider)
		this.team = team.map( (t) => m.Type.check(t, m.Collaboration.SyncUserEvent) )
		this.peers = peers.map( (p) => m.Type.check(p, m.Peers.PeerState) )
	}
}

/**
 * @class ConversantAPI
 * An implementation of the API that uses window.postMessage as the channel to Observe and addEventListener(message)
 * as the Observable
 */
class ConversantAPI extends API{

	/**
	 * Construct {Rx.Observer} and {Rx.Observable} for communication with the parent frame.
	 */
	constructor(id){
		var observerList = []


		let observer = Rx.Observer.create((data) => {
			console.log('postMessage', data)
			top.window.postMessage(data, '*')
		});
		window.addEventListener('message', (event) => {
			if(event.data && event.data != ''){
				try {
					let x = this.mapper.read(event.data)
					//console.log('sending to ('+observerList.length+') observers',x)
					observerList.forEach( (obs) => obs.onNext(x) )
				} catch (e) {
					console.error('[ERROR] clientAPI:: handling message data',event.data)
					alert('error')
					console.log('ERROR',e)
				}
			}
		}, false);
		console.log('Observable create')
		let observable = Rx.Observable.create( (obs) => {
			console.log('Observable')

			observerList.push(obs)
			//worker.onerror = function (err) {
			//	obs.onError(err);
			//};

			return () => {
				observerList = observerList.filter( (x) => {x != obs} )
				console.log('disposed')
				// onComplete
			}
		});
		super(observer, observable)
		this.id = id
		this.isSyncMode = window.name == "syncApp"
		this.mode = new m.Apps.AppMode(window.name)
	}

	/**
	 *
	 * @param fun {function}
	 * The function to be called when the application can be initialized.  The function will be called with
	 * an instance of {AppParameters}.
     */
	init(fun){
		let pApp = this._futurePromise(m.Apps.InitApp.type())
		let pOrganization = this._futurePromise(m.Apps.InitOrganization.type())
		let pCollaboration = this._futurePromise(m.Apps.InitCollaboration.type())
		let pPofile = this._futurePromise(m.Apps.InitProvider.type())
		let pTeam = this._futurePromise(m.Apps.InitTeam.type())
		let pPeers = this._futurePromise(m.Apps.InitPeers.type())

		Promise.all([pApp, pCollaboration, pPofile, pTeam, pPeers, pOrganization]).then( (vals) => {
			console.log('-- APP INIT --')
			let appParams = new AppParameters( vals[0].app, vals[0].restoreState,  vals[5].organization, vals[1].collaboration, vals[2].provider, vals[3].team, vals[4].peers  )
			this.appParams = appParams
			fun(appParams)
		})
		this._send(this.mapper.write(new m.Apps.Init(this.id, this.mode)))
	}

}


module.exports = {
	ConversantAPI: ConversantAPI,
	AppParameters: AppParameters
};
window.conversant = module.exports;

