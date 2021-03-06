(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rx = require('rx-lite');
var m = require('./model');
var mapper = require('./mapper');

/**
 * @class API
 * base class for api implementation.
 */

var API = (function () {
	function API(observer, observable) {
		_classCallCheck(this, API);

		this.mapper = new mapper.Mapper();
		//this.futures = new Map
		this.channelSubject = Rx.Subject.create(observer, observable);
		this.channelSubject.subscribe(function (x) {
			console.log(x);
		}, function (e) {
			console.log(e);
		});
	}

	_createClass(API, [{
		key: '_send',
		value: function _send(data) {
			//console.log('channelSubject.onNext', data)
			this.channelSubject.onNext(data);
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

	}, {
		key: 'addResponder',
		value: function addResponder(type, fun) {
			var subject = new Rx.Subject();
			this.channelSubject.filter(function (x) {
				return x.$type === type;
			}).subscribe(subject);
			return typeof fun === "undefined" ? subject.subscribe() : subject.subscribe(function (x) {
				return fun(x);
			});
		}
	}, {
		key: '_addFuture',
		value: function _addFuture(type, fun) {
			var subject = new Rx.Subject();
			this.channelSubject.filter(function (x) {
				return x.$type === type;
			}).subscribe(subject);
			var subscription = subject.subscribe(function (x) {
				fun(x);
				subscription.dispose();
			});
		}
	}, {
		key: '_futurePromise',
		value: function _futurePromise(type) {
			var _this = this;

			var p = new Promise(function (resolve, reject) {
				_this._addFuture(type, resolve);
			});
			return p;
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

	}, {
		key: 'addGuest',
		value: function addGuest(profile) {
			var _this2 = this;

			var p = new Promise(function (resolve, reject) {
				m.Type.check(profile, m.Auth.ProfileInfo, reject);
				_this2._addFuture(m.Auth.PrimaryProfile.type(), resolve);
				_this2.send(_this2.mapper.write(profile));
			});
			return p;
		}

		/**
   * def syncUser(sync:Collaboration.SyncUserEvent):Unit
   * Synchronize user state.
   *
   * @param sync {Collaboration.SyncUserEvent}
   * The synchronize event to be shared with other users on the system.  This parameter is
   * of type 'm.Collaboration.SyncUserEvent'
      */

	}, {
		key: 'syncUser',
		value: function syncUser(sync) {
			m.Type.check(sync, m.Collaboration.SyncUserEvent);
			this._send(this.mapper.write(sync));
		}
	}, {
		key: 'getUser',
		value: function getUser(uid, orgId) {
			this._send(new m.Auth.GetPrimaryProfile(uid, orgId));
		}

		/**
   * def syncView(sync:Collaboration.SyncViewEvent):Unit
   * Synchronize view/app state in the synchronization pannel.
   *
   * @param sync {m.Collaboration.ViewerState}
   * The synchronize event bring application state in sync.  This parameter is
   * of type 'm.Collaboration.ViewerState'
      */

	}, {
		key: 'syncView',
		value: function syncView(sync) {
			var _this3 = this;

			m.Type.check(sync, m.Collaboration.View);
			this.appParams.collaboration.foreach(function (c) {
				var syncEvent = new m.Collaboration.SyncViewEvent(c.id, c.orgId, _this3.appParams.provider, sync);
				_this3._send(_this3.mapper.write(syncEvent));
			});
		}
	}, {
		key: 'sendMessage',
		value: function sendMessage(msg, view) {
			var _this4 = this;

			this.appParams.collaboration.foreach(function (c) {
				var content = new m.Collaboration.ContentMsg(m.Auth.zeroId, c.id, c.orgId, "", new Set([_this4.appParams.provider]), new Set([_this4.appParams.provider]), m.Option.None(), m.Option.None(), new Set(), m.Option.Some(new m.Collaboration.MessageBasic(msg, new Set())), view.id);

				_this4._send(_this4.mapper.write(new m.Collaboration.BroadcastContent(content, m.Option.Some(view))));
			});
		}
	}, {
		key: 'sendAppEvent',
		value: function sendAppEvent(msg, coverImgUrl, view) {
			var _this5 = this;

			this.appParams.collaboration.foreach(function (c) {
				var content = new m.Collaboration.ContentAppEvent(m.Auth.zeroId, c.id, c.orgId, "", new Set([_this5.appParams.provider]), new Set([_this5.appParams.provider]), m.Option.Some(new m.Collaboration.MessageBasic(msg, new Set())), view.id, coverImgUrl, new Set([]));

				_this5._send(_this5.mapper.write(new m.Collaboration.BroadcastContent(content, m.Option.Some(view))));
			});
		}
	}, {
		key: 'send',
		value: function send(x) {
			this._send(this.mapper.write(x));
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

	}]);

	return API;
})();

/**
 * AppParameters is the initilization parameter passed in to your application.
 * @see {ConversantAPI}
 */

var AppParameters =

/**
 * @param app {Apps.App}
 * @param restoreState {Collaboration.ViewerState}
 * @param organization {Auth.Organization}
 * @param collaboration {Collaboration.Collaboration}
 * @param profile {Auth.ProfileInfo}
 * @param team {Collaboration.SyncUserEvent[]}
    * @param peers {Peers.PeerState[]}
    */
function AppParameters(app, restoreState, organization, collaboration, provider, team, peers) {
	_classCallCheck(this, AppParameters);

	this.app = m.Type.check(app, m.Apps.App);
	this.restoreState = typeof restoreState === "undefined" ? null : restoreState;
	this.organization = m.Type.check(organization, m.Auth.Organization);
	this.collaboration = collaboration;
	this.provider = m.Type.check(provider, m.Auth.Provider);
	this.team = team.map(function (t) {
		return m.Type.check(t, m.Collaboration.SyncUserEvent);
	});
	this.peers = peers.map(function (p) {
		return m.Type.check(p, m.Peers.PeerState);
	});
};

/**
 * @class ConversantAPI
 * An implementation of the API that uses window.postMessage as the channel to Observe and addEventListener(message)
 * as the Observable
 */

var ConversantAPI = (function (_API) {
	_inherits(ConversantAPI, _API);

	/**
  * Construct {Rx.Observer} and {Rx.Observable} for communication with the parent frame.
  */

	function ConversantAPI(id) {
		_classCallCheck(this, ConversantAPI);

		var observerList = [];

		var observer = Rx.Observer.create(function (data) {
			console.log('postMessage', data);
			top.window.postMessage(data, '*');
		});
		window.addEventListener('message', function (event) {
			if (event.data && event.data != '') {
				try {
					(function () {
						console.log('**data', event.data);
						var x = _this6.mapper.read(event.data);
						//console.log('sending to ('+observerList.length+') observers',x)
						observerList.forEach(function (obs) {
							return obs.onNext(x);
						});
					})();
				} catch (e) {
					console.error('[ERROR] clientAPI:: handling message data', event.data);
					console.log('ERROR', e);
				}
			}
		}, false);
		console.log('Observable create');
		var observable = Rx.Observable.create(function (obs) {
			console.log('Observable');

			observerList.push(obs);
			//worker.onerror = function (err) {
			//	obs.onError(err);
			//};

			return function () {
				observerList = observerList.filter(function (x) {
					x != obs;
				});
				console.log('disposed');
				// onComplete
			};
		});

		var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(ConversantAPI).call(this, observer, observable));

		_this6.id = id;
		_this6.isSyncMode = window.name == "syncApp";
		_this6.mode = new m.Apps.AppMode(window.name);
		return _this6;
	}

	/**
  *
  * @param fun {function}
  * The function to be called when the application can be initialized.  The function will be called with
  * an instance of {AppParameters}.
     */

	_createClass(ConversantAPI, [{
		key: 'init',
		value: function init(fun) {
			var _this7 = this;

			var pApp = this._futurePromise(m.Apps.InitApp.type());
			var pOrganization = this._futurePromise(m.Apps.InitOrganization.type());
			var pCollaboration = this._futurePromise(m.Apps.InitCollaboration.type());
			var pPofile = this._futurePromise(m.Apps.InitProvider.type());
			var pTeam = this._futurePromise(m.Apps.InitTeam.type());
			var pPeers = this._futurePromise(m.Apps.InitPeers.type());

			Promise.all([pApp, pCollaboration, pPofile, pTeam, pPeers, pOrganization]).then(function (vals) {
				console.log('-- APP INIT --');
				var appParams = new AppParameters(vals[0].app, vals[0].restoreState, vals[5].organization, vals[1].collaboration, vals[2].provider, vals[3].team, vals[4].peers);
				_this7.appParams = appParams;
				fun(appParams);
			});
			this._send(this.mapper.write(new m.Apps.Init(this.id, this.mode)));
		}
	}]);

	return ConversantAPI;
})(API);

module.exports = {
	ConversantAPI: ConversantAPI,
	AppParameters: AppParameters
};
window.conversant = module.exports;

},{"./mapper":2,"./model":3,"rx-lite":5}],2:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mapper = (function () {
    function Mapper(type) {
        _classCallCheck(this, Mapper);

        this.$type = type;
        //console.log('created type: '+ type);
        var that = this;
        function buildList(items) {
            if (!items.length) {
                return {
                    "s": "scala.collection.immutable.Nil$"
                };
            } else {
                var head = items[0];
                var tail = items.slice(1);
                return {
                    "t": "scala.collection.immutable.$colon$colon",
                    "v": {
                        "head": that.pickleType(head),
                        "tl$1": that.pickleType(tail)
                    }
                };
            }
        }
        this.objMap = {
            'String': function String(obj) {
                return {
                    't': 'java.lang.String',
                    'v': obj.valueOf()
                };
            },
            'm.Some': function mSome(obj) {
                return {
                    't': 'scala.Some',
                    'v': { 'x': that.pickleType(obj.valueOf()) }
                };
            },
            'm.None': function mNone(obj) {
                return {
                    's': 'scala.None$'
                };
            },
            'm.Integer': function mInteger(obj) {
                return {
                    't': 'java.lang.Integer',
                    'v': obj.valueOf()
                };
            },
            'm.Float': function mFloat(obj) {
                return {
                    't': 'java.lang.Float',
                    'v': obj.valueOf()
                };
            },
            'm.Double': function mDouble(obj) {
                return {
                    't': 'java.lang.Double',
                    'v': obj.valueOf()
                };
            },
            'm.Long': function mLong(obj) {
                return {
                    't': 'java.lang.Long',
                    'v': obj.valueOf()
                };
            },
            'm.UUID': function mUUID(obj) {
                return {
                    't': 'java.util.UUID',
                    'v': obj.uuid.valueOf()
                };
            },
            'Number': function Number(obj) {
                return {
                    't': 'java.lang.Double',
                    'v': obj
                };
            },
            'm.List': function mList(obj) {
                return buildList(obj);
            },
            'Array': function Array(obj) {
                //return buildList(obj)
                return {
                    't': '[D',
                    'v': obj
                };
            },
            'Set': function Set(obj) {
                var t = 'scala.collection.immutable.HashSet$HashTrieSet';
                if (!obj.size) {
                    return {
                        "t": "scala.collection.immutable.Set$EmptySet$",
                        "v": []
                    };
                } else if (obj.size < 4) {
                    t = "scala.collection.immutable.Set$Set" + obj.size;
                }
                var hack = [];
                obj.forEach(function (y) {
                    return hack.push(y);
                });
                return {
                    "t": t,
                    "v": hack.map(function (x) {
                        return that.pickleType(x);
                    })
                };
            },
            'Map': function Map(obj) {
                var t = 'scala.collection.immutable.HashMap$HashTrieMap';
                if (!obj.size) {
                    return {
                        "t": "scala.collection.immutable.Map$EmptyMap$",
                        "v": []
                    };
                } else if (obj.size < 4) {
                    t = "scala.collection.immutable.Map$Map" + (obj.size + 1);
                }
                var hack = [];
                obj.forEach(function (v, k, map) {
                    return hack.push([k[0], v]);
                });
                return {
                    "t": t,
                    "v": hack.map(function (x) {
                        return {
                            'k': that.pickleType(x[0]),
                            'v': that.pickleType(x[1])
                        };
                    })
                };
            }

        };
    }

    _createClass(Mapper, [{
        key: "pickleType",
        value: function pickleType(obj) {
            var jsType = typeof obj === "undefined" ? "undefined" : _typeof(obj);
            var className = obj.constructor.name;
            //console.log('className: '+className)
            if (obj.$type && this.objMap[obj.$type]) {
                return this.objMap[obj.$type](obj);
            } else if (this.objMap[className]) {
                return this.objMap[className](obj);
            } else if (jsType == 'object') {
                //console.log('object: ',obj)
                //console.log('t '+ obj.$type)
                var rep = {
                    't': obj.$type
                };
                var props = {};
                for (var x in obj) {
                    if (x != '$type') {
                        //console.log('x ' + x)
                        props[x] = this.pickleType(obj[x]);
                    }
                }
                rep.v = props;
                //console.log('rep', rep)
                return rep;
            }
            return obj;
        }
    }, {
        key: "write",
        value: function write(obj) {
            //console.log('Mapper::write',obj);
            var pickled = this.pickleType(obj);
            //console.log('Mapper::write',pickled);
            return JSON.stringify(pickled);
        }
    }, {
        key: "unpickleType",
        value: function unpickleType(rep) {
            var _this = this;

            if (!rep) {
                console.log("ERROR: rep is undefined");
                return null;
            }
            //console.log('rep: ',rep);
            if (rep.s && !rep.t) rep.t = rep.s;
            //console.log('type: '+rep.t);
            if (rep.t.indexOf('m.') == 0) {
                // this SHOULD be one of our types.
                var s = rep.t.split('$');
                var namespace = s[0].split('.');
                var className = s[1];
                namespace.push(className);
                var classRef = namespace.reduce(function (pre, cur) {
                    return pre[cur];
                }, window);
                if (!classRef) {
                    console.log('ERROR creating className:', namespace);
                    throw new Error('Error trying to create type: ' + className);
                }
                var inst = new classRef();
                //console.log('instance',inst)
                for (var x in inst) {
                    if (x != '$type') {
                        //console.log('x ' + x)
                        try {
                            var prop = this.unpickleType(rep.v[x]);
                            inst[x] = prop;
                        } catch (e) {
                            console.error('[ERROR] - unpickleType failed for ' + namespace + '.' + x + '  with error: ', e);
                            throw e;
                        }
                    }
                }
                return inst;
            } else {
                // built in type: String, Double, ...
                //console.log('OTHER CLASS:',rep)
                if (rep.t == 'scala.collection.immutable.$colon$colon') {
                    // list
                    var prop = this.unpickleType(rep.v.head);
                    var list = new m.List();
                    list.push(prop);
                    list = list.concat(this.unpickleType(rep.v.tl$1));
                    return list;
                } else if (rep.t == 'scala.collection.immutable.Nil$') {
                    return [];
                } else if (rep.t == 'java.util.UUID') {
                    return new m.UUID(rep.v);
                } else if (rep.t == 'java.lang.String') {
                    return new String(rep.v);
                } else if (rep.t == 'java.lang.Boolean') {
                    return new Boolean(rep.v);
                } else if (rep.t == 'java.lang.Integer') {
                    return new m.Integer(rep.v);
                } else if (rep.t == 'java.lang.Float') {
                    return new m.Float(rep.v);
                } else if (rep.t == 'java.lang.Double') {
                    return new m.Double(rep.v);
                } else if (rep.t == 'java.lang.Long') {
                    return new m.Long(rep.v);
                } else if (rep.t == 'scala.Some') {
                    return m.Option.Some(this.unpickleType(rep.v.x));
                } else if (rep.t == 'scale.None$') {
                    return m.Option.None();
                } else if (rep.t == 'scala.collection.immutable.HashSet$HashTrieSet' || rep.t.indexOf('scala.collection.immutable.Set') == 0) {
                    return rep.v.map(function (x) {
                        return _this.unpickleType(x);
                    });
                } else if (rep.t == 'scala.Some') {
                    return this.unpickleType(rep.v.x);
                } else if (rep.t == 'scala.None$') {
                    return null;
                } else if (rep.t == 'scala.collection.immutable.HashMap$HashTrieMap' || rep.t.indexOf('scala.collection.immutable.Map') == 0) {
                    var hashMap = new Map();
                    rep.v.map(function (x) {
                        hashMap.set([x.k.v], _this.unpickleType(x.v));
                    });
                    return hashMap;
                }
                return rep;
            }
        }
    }, {
        key: "read",
        value: function read(json) {
            var rep = JSON.parse(json);
            //console.log('Mapper::read: '+rep.t);
            var obj = this.unpickleType(rep);
            //console.log('*** Ret: ',obj)
            return obj;
            //return JSON.parse(json)
        }
    }]);

    return Mapper;
})();

function serialize(object) {
    var jsonOutput = serializeToJson(object);

    function serializeToJson(obj) {
        var jobj = {};
        for (var field in obj) {
            if (obj.hasOwnProperty(field)) {
                if (obj[field].$type) {
                    var type = obj[field].$type;
                    if (type == "m.Some") {
                        jobj[field] = [obj[field].val];
                    } else if (type == "m.None") {
                        jobj[field] = [];
                    } else if (type == "m.List" || type == "m.Set") {
                        jobj[field] = obj[field].values.map(function (x) {
                            return serializeToJson(x);
                        });
                    } else if (type == "m.UUID") {
                        jobj[field] = obj[field].valueOf();
                    } else {
                        jobj[field] = serializeToJson(obj[field]);
                    }
                } else if (obj[field].constructor == Map) {
                    jobj[field] = serializeToJson(obj[field]);
                } else if (obj[field].constructor == Array) {
                    jobj[field] = obj[field].map(function (x) {
                        return serializeToJson(x);
                    });
                } else {
                    jobj[field] = obj[field];
                }
            }
        }
        return jobj;
    }

    // Replaces $ signs with . in the serialized json
    function replaceDollarSigns(jsonString) {
        var index = jsonString.search(/\$/);
        if (index != -1) {
            if (jsonString.substring(index, index + 5) != "$type") {
                return jsonString.substring(0, index) + '.' + replaceDollarSigns(jsonString.substring(index + 1));
            } else {
                return jsonString.substring(0, index + 1) + replaceDollarSigns(jsonString.substring(index + 1));
            }
        }
        return jsonString;
    }

    return replaceDollarSigns(JSON.stringify(jsonOutput));
}

module.exports = {
    Mapper: Mapper,
    serialize: serialize
};

},{}],3:[function(require,module,exports){
"use strict";

// TOOD: would like to extend String

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UUID = (function () {
    function UUID(uuid) {
        _classCallCheck(this, UUID);

        this.$type = "m.UUID";
        if (uuid.$type && uuid.$type == this.$type) {
            this.uuid = uuid.uuid;
        } else {
            this.uuid = uuid;
        }
    }

    _createClass(UUID, [{
        key: "valueOf",
        value: function valueOf() {
            return this.uuid;
        }
    }], [{
        key: "zero",
        value: function zero() {
            new UUID('00000000-0000-0000-0000-000000000000');
        }
    }]);

    return UUID;
})();

var Integer = (function (_Number) {
    _inherits(Integer, _Number);

    function Integer(x) {
        _classCallCheck(this, Integer);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Integer).call(this, x));

        _this.val = x;
        _this.$type = "m.Integer";
        return _this;
    }

    _createClass(Integer, [{
        key: "valueOf",
        value: function valueOf() {
            return this.val;
        }
    }]);

    return Integer;
})(Number);

var Float = (function (_Number2) {
    _inherits(Float, _Number2);

    function Float(x) {
        _classCallCheck(this, Float);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Float).call(this, x));

        _this2.val = x;
        _this2.$type = "m.Float";
        return _this2;
    }

    _createClass(Float, [{
        key: "valueOf",
        value: function valueOf() {
            return this.val;
        }
    }]);

    return Float;
})(Number);

var Double = (function (_Number3) {
    _inherits(Double, _Number3);

    function Double(x) {
        _classCallCheck(this, Double);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Double).call(this, x));

        _this3.val = x;
        _this3.$type = "m.Double";
        return _this3;
    }

    _createClass(Double, [{
        key: "valueOf",
        value: function valueOf() {
            return this.val;
        }
    }]);

    return Double;
})(Number);

var Long = (function (_Number4) {
    _inherits(Long, _Number4);

    function Long(x) {
        _classCallCheck(this, Long);

        var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(Long).call(this, x));

        _this4.val = x;
        _this4.$type = "m.Long";
        return _this4;
    }

    _createClass(Long, [{
        key: "valueOf",
        value: function valueOf() {
            return this.val;
        }
    }]);

    return Long;
})(Number);

var List = (function (_Array) {
    _inherits(List, _Array);

    function List() {
        _classCallCheck(this, List);

        var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(List).call(this));

        _this5.$type = "m.List";
        return _this5;
    }

    return List;
})(Array);

var Option = (function () {
    function Option() {
        _classCallCheck(this, Option);
    }

    _createClass(Option, null, [{
        key: "Some",
        value: function Some(val) {
            return new _Some(val);
        }
    }, {
        key: "None",
        value: function None() {
            return new _None();
        }
    }]);

    return Option;
})();

var _Some = (function (_Option) {
    _inherits(_Some, _Option);

    function _Some(val) {
        _classCallCheck(this, _Some);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(_Some).call(this));

        _this6.val = val;
        _this6.$type = "m.Some";
        return _this6;
    }

    _createClass(_Some, [{
        key: "get",
        value: function get() {
            return this.val;
        }
    }, {
        key: "valueOf",
        value: function valueOf() {
            return this.val;
        }
    }, {
        key: "map",
        value: function map(f) {
            return f(this.val);
        }
    }, {
        key: "foreach",
        value: function foreach(f) {
            f(this.val);
        }
    }]);

    return _Some;
})(Option);

var _None = (function (_Option2) {
    _inherits(_None, _Option2);

    function _None() {
        _classCallCheck(this, _None);

        var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(_None).call(this));

        _this7.$type = "m.None";
        return _this7;
    }

    _createClass(_None, [{
        key: "map",
        value: function map(f) {}
    }, {
        key: "foreach",
        value: function foreach(f) {}
    }]);

    return _None;
})(Option);

/**
 * @class Type
 * Helper class for doing runtime type checking and error reporting.
 */

var Type = (function () {
    function Type() {
        _classCallCheck(this, Type);
    }

    _createClass(Type, null, [{
        key: "check",
        value: function check(inst, type, fail) {
            if (!(inst instanceof type)) {
                if (type.type && inst.$type && type.type() == inst.$type) {
                    // FIXME: this is a hack until we have our own mapper.
                    return inst;
                }
                if (typeof fail === "undefined") throw new Error('[ERROR] Type Check failed. ' + (typeof inst === "undefined" ? "undefined" : _typeof(inst)) + ' is not ' + type);else fail(new Error('[ERROR] Type Check failed. ' + (typeof inst === "undefined" ? "undefined" : _typeof(inst)) + ' is not ' + type));
            }
            return inst;
        }
    }]);

    return Type;
})();

/**
 * @class Model
 * Base type for all `Model` types in the system.
 */

var Model =
/**
 *
 * @param type {String} the full class name of the type be instantiated.
 */
function Model(type) {
    _classCallCheck(this, Model);

    this.$type = type;
    //console.log('created type: '+ type);
};

/**
 * @namespace Auth
 */

var Auth = {};

Auth.zeroId = new UUID('00000000-0000-0000-0000-000000000000');

/**
 * @class GetPrimaryProfile
 */
Auth.GetPrimaryProfile = (function (_Model) {
    _inherits(_class, _Model);

    _createClass(_class, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$GetPrimaryProfile';
        }
    }]);

    function _class(uid, orgId) {
        _classCallCheck(this, _class);

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, Auth.GetPrimaryProfile.type()));

        _this8.uuid = null;
        _this8.orgId = null;
        if (arguments.length) {
            _this8.uuid = uuid;
            _this8.orgId = orgId;
        }
        return _this8;
    }

    return _class;
})(Model);

/**
 * @class OrganizationRoles
 * Construct an organization role.
 */
Auth.OrganizationRoles = (function (_Model2) {
    _inherits(_class2, _Model2);

    _createClass(_class2, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$OrganizationRoles';
        }
    }]);

    function _class2(role) {
        _classCallCheck(this, _class2);

        var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class2).call(this, Auth.OrganizationRoles.type()));

        _this9.name = null;
        if (arguments.length) {
            _this9.name = role;
        }
        return _this9;
    }

    /**
     * Return OrganizationRoles TEAM
     * @returns {OrganizationRoles}
     */

    _createClass(_class2, null, [{
        key: "team",
        value: function team() {
            return new OrganizationRoles("team");
        }
        /**
         * Return OrganizationRoles ADMIN
         * @returns {OrganizationRoles}
         */

    }, {
        key: "admin",
        value: function admin() {
            return new OrganizationRoles("admin");
        }
        /**
         * Return OrganizationRoles OWNER
         * @returns {OrganizationRoles}
         */

    }, {
        key: "owner",
        value: function owner() {
            return new OrganizationRoles("owner");
        }
        /**
         * Return OrganizationRoles ORGANIZATION
         * @returns {OrganizationRoles}
         */

    }, {
        key: "organization",
        value: function organization() {
            return new OrganizationRoles("organization");
        }
        /**
         * Return OrganizationRoles GUEST
         * @returns {OrganizationRoles}
         */

    }, {
        key: "guest",
        value: function guest() {
            return new OrganizationRoles("guest");
        }
    }]);

    return _class2;
})(Model);

/**
 * @class Provider
 * A simple view of a provider for a user.  Users can have many providers for many different organization.
 * Users will typically have 1 provider="conversant" per orgId.
 */
Auth.Provider = (function (_Model3) {
    _inherits(_class3, _Model3);

    _createClass(_class3, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$Provider';
        }
        /**
         *
         * @param orgId {String}
         * @param source {String}
         * @param provider {String}
         * @param id {String}
         * @param role {Auth.OrganizationRoles}
         * @param fullName {String}
         */

    }]);

    function _class3(orgId, source, provider, id, role, fullName) {
        _classCallCheck(this, _class3);

        var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class3).call(this, Auth.Provider.type()));

        _this10.orgId = null;
        _this10.source = null;
        _this10.provider = null;
        _this10.id = null;
        _this10.role = null;
        _this10.fullName = null;
        if (arguments.length) {
            _this10.orgId = new UUID(orgId);
            _this10.source = new UUID(source);
            _this10.provider = new String(provider);
            _this10.id = new String(id);
            _this10.role = Type.check(role, Auth.OrganizationRoles);
            _this10.fullName = new String(fullName);
        }
        return _this10;
    }

    return _class3;
})(Model);

/**
 * @class Provider
 * A simple view of a provider for a user.  Users can have many providers for many different organization.
 * Users will typically have 1 provider="conversant" per orgId.
 */
Auth.Bot = (function (_Model4) {
    _inherits(_class4, _Model4);

    _createClass(_class4, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$Bot';
        }
        /**
         *
         * @param orgId {String}
         * @param source {String}
         * @param provider {String}
         * @param id {String}
         * @param role {Auth.OrganizationRoles}
         * @param fullName {String}
         */

    }]);

    function _class4(orgId, source, provider, id, role, fullName) {
        _classCallCheck(this, _class4);

        var _this11 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class4).call(this, Auth.Bot.type()));

        _this11.orgId = null;
        _this11.source = null;
        _this11.provider = null;
        _this11.id = null;
        _this11.role = null;
        _this11.fullName = null;
        if (arguments.length) {
            _this11.orgId = new UUID(orgId);
            _this11.source = new UUID(source);
            _this11.provider = new String(provider);
            _this11.id = new String(id);
            _this11.role = Type.check(role, Auth.OrganizationRoles);
            _this11.fullName = new String(fullName);
        }
        return _this11;
    }

    return _class4;
})(Model);

/**
 * @class Role
 */
Auth.Role = (function (_Model5) {
    _inherits(_class5, _Model5);

    _createClass(_class5, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$Role';
        }
        /**
         *
         * @param orgId {String}
         * @param source {String}
         * @param provider {String}
         * @param id {String}
         * @param role {Auth.OrganizationRoles}
         * @param fullName {String}
         */

    }]);

    function _class5(orgId, source, provider, id, role, fullName) {
        _classCallCheck(this, _class5);

        var _this12 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class5).call(this, Auth.Role.type()));

        _this12.orgId = null;
        _this12.source = null;
        _this12.provider = null;
        _this12.id = null;
        _this12.role = null;
        _this12.fullName = null;
        if (arguments.length) {
            _this12.orgId = new UUID(orgId);
            _this12.source = new UUID(source);
            _this12.provider = new String(provider);
            _this12.id = new String(id);
            _this12.role = Type.check(role, Auth.OrganizationRoles);
            _this12.fullName = new String(fullName);
        }
        return _this12;
    }

    return _class5;
})(Model);

/**
 * @class Organization
 * Organization Entity
 */
Auth.Organization = (function (_Model6) {
    _inherits(_class6, _Model6);

    _createClass(_class6, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */

        value: function type() {
            return 'm.Auth$Organization';
        }
        /**
         *
         * @param url {String}
         * @param name {String}
         * @param provider {Auth.Provider}
         * @param members [Auth.Provider[]]
         * @param settings {Map}
         */

    }]);

    function _class6(url, name, provider, members, settings) {
        _classCallCheck(this, _class6);

        var _this13 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class6).call(this, Auth.Provider.type()));

        _this13.url = null;
        _this13.name = null;
        _this13.provider = null;
        _this13.members = null;
        _this13.settings = null;
        if (arguments.length) {
            _this13.url = new String(url);
            _this13.provider = Type.check(provider, Auth.Provider);
            _this13.members = members.map(function (p) {
                return Type.check(p, Auth.Provider);
            });
            _this13.settings = settings;
        }
        return _this13;
    }

    return _class6;
})(Model);

/**
 * @class PrimaryProfile
 * A list of profiles that are known for that user under that organiztion.
 * The primary will be a provider of type "conversant"
 */
Auth.PrimaryProfile = (function (_Model7) {
    _inherits(_class7, _Model7);

    _createClass(_class7, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$PrimaryProfile';
        }

        /**
         *
         * @param primary {Auth.Provider}
         * @param providers {Auth.Provider[]}
         */

    }]);

    function _class7(primary, providers) {
        _classCallCheck(this, _class7);

        var _this14 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class7).call(this, Auth.PrimaryProfile.type()));

        _this14.primary = Type.check(primary, Auth.Provider);
        _this14.providers = providers.map(function (p) {
            return Type.check(p, Auth.Provider);
        });
        return _this14;
    }

    return _class7;
})(Model);

/**
 * @class UserState
 * Used to pass a user action that requires synchronization by the system.
 */
Auth.UserState = (function (_Model8) {
    _inherits(_class8, _Model8);

    _createClass(_class8, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$UserState';
        }

        //isOnline:Boolean, action:UserAction, state: Map[String, String]

        /**
         *
         * @param isOnline {Boolean}
         * @param action {Auth.UserState}
         * @param state {Map}
         */

    }]);

    function _class8(isOnline, action, state) {
        _classCallCheck(this, _class8);

        var _this15 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class8).call(this, Auth.UserState.type()));

        _this15.isOnline = null;
        _this15.action = null;
        _this15.state = null;
        if (arguments.length) {
            _this15.isOnline = isOnline;
            _this15.action = Type.check(action, Auth.UserAction);
            _this15.state = state;
        }
        return _this15;
    }

    return _class8;
})(Model);

/**
 * @class UserAction
 * Some User level event that requies syncing.
 */
Auth.UserAction = (function (_Model9) {
    _inherits(_class9, _Model9);

    _createClass(_class9, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Auth$UserAction';
        }

        /**
         *
         * @param action {String}
         */

    }]);

    function _class9(action) {
        _classCallCheck(this, _class9);

        var _this16 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class9).call(this, Auth.UserAction.type()));

        _this16.action = null;
        if (arguments.length) {
            _this16.action = new String(action);
        }
        return _this16;
    }

    /**
     * None User Action
     * @returns {Auth.UserAction}
     */

    _createClass(_class9, null, [{
        key: "none",
        value: function none() {
            return Auth.UserAction("none");
        }
        /**
         * typing User Action
         * @returns {Auth.UserAction}
         */

    }, {
        key: "typing",
        value: function typing() {
            return Auth.UserAction("typing");
        }
        /**
         * online User Action
         * @returns {Auth.UserAction}
         */

    }, {
        key: "online",
        value: function online() {
            return Auth.UserAction("online");
        }
        /**
         * presence User Action
         * @returns {Auth.UserAction}
         */

    }, {
        key: "presence",
        value: function presence() {
            return Auth.UserAction("presence");
        }
        /**
         * offline User Action
         * @returns {Auth.UserAction}
         */

    }, {
        key: "offline",
        value: function offline() {
            return Auth.UserAction("offline");
        }
        /**
         * collaborationEnter User Action
         * @returns {Auth.UserAction}
         */

    }, {
        key: "collaborationEnter",
        value: function collaborationEnter() {
            return Auth.UserAction("collaborationEnter");
        }
    }]);

    return _class9;
})(Model);

/**
 * @namespace Entities
 */
var Entities = {};

/**
 * @class NamedEntity
 */
Entities.NamedEntity = (function (_Model10) {
    _inherits(_class10, _Model10);

    /**
     * Return the full class name of this type.
     * @returns {string}
     */

    /**
     *
     * @param uri {String}
     * @param token {String}
     */

    function _class10(type, uri, token) {
        _classCallCheck(this, _class10);

        var _this17 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class10).call(this, type));

        _this17.uri = null;
        _this17.token = null;
        if (arguments.length > 1) {
            _this17.uri = new String(uri);
            _this17.token = new String(token);
        }
        return _this17;
    }

    return _class10;
})(Model);

/**
 * @class LocationEntity
 */
Entities.LocationEntity = (function (_Entities$NamedEntity) {
    _inherits(_class11, _Entities$NamedEntity);

    _createClass(_class11, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Entities$LocationEntity';
        }

        /**
         *
         * @param uri {String}
         * @param token {String}
         */

    }]);

    function _class11(uri, token) {
        _classCallCheck(this, _class11);

        if (arguments.length) {
            var _this18 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class11).call(this, Entities.LocationEntity.type(), uri, token));
        } else {
            var _this18 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class11).call(this, Entities.LocationEntity.type()));
        }
        return _possibleConstructorReturn(_this18);
    }

    return _class11;
})(Entities.NamedEntity);

/**
 * @class OrganizationEntity
 */
Entities.OrganizationEntity = (function (_Entities$NamedEntity2) {
    _inherits(_class12, _Entities$NamedEntity2);

    _createClass(_class12, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Entities$OrganizationEntity';
        }

        /**
         *
         * @param uri {String}
         * @param token {String}
         */

    }]);

    function _class12(uri, token) {
        _classCallCheck(this, _class12);

        if (arguments.length) {
            var _this19 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class12).call(this, Entities.OrganizationEntity.type(), uri, token));
        } else {
            var _this19 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class12).call(this, Entities.OrganizationEntity.type()));
        }
        return _possibleConstructorReturn(_this19);
    }

    return _class12;
})(Entities.NamedEntity);

/**
 * @class PersonEntity
 */
Entities.PersonEntity = (function (_Entities$NamedEntity3) {
    _inherits(_class13, _Entities$NamedEntity3);

    _createClass(_class13, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Entities$PersonEntity';
        }

        /**
         *
         * @param uri {String}
         * @param token {String}
         */

    }]);

    function _class13(uri, token) {
        _classCallCheck(this, _class13);

        if (arguments.length) {
            var _this20 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class13).call(this, Entities.PersonEntity.type(), uri, token));
        } else {
            var _this20 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class13).call(this, Entities.PersonEntity.type()));
        }
        return _possibleConstructorReturn(_this20);
    }

    return _class13;
})(Entities.NamedEntity);

/**
 * @namespace Collaboration
 */
var Collaboration = {};

/**
 * @class PlayerState
 */
Collaboration.PlayerState = (function (_Model11) {
    _inherits(_class14, _Model11);

    _createClass(_class14, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$PlayerState';
        }

        /**
         *
         * @param action {String}
         */

    }]);

    function _class14(state) {
        _classCallCheck(this, _class14);

        var _this21 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class14).call(this, Collaboration.PlayerState.type()));

        _this21.state = null;
        if (arguments.length) {
            _this21.state = new Integer(state);
        }
        return _this21;
    }

    /**
     * UNSTARTED PlayerState
     * @returns {Collaboration.PlayerState}
     */

    _createClass(_class14, null, [{
        key: "UNSTARTED",
        value: function UNSTARTED() {
            return Collaboration.PlayerState(-1);
        }
        /**
         * ENDED PlayerState
         * @returns {Collaboration.PlayerState}
         */

    }, {
        key: "ENDED",
        value: function ENDED() {
            return Collaboration.PlayerState(0);
        }
        /**
         * PLAYING PlayerState
         * @returns {Collaboration.PlayerState}
         */

    }, {
        key: "PLAYING",
        value: function PLAYING() {
            return Collaboration.PlayerState(1);
        }
        /**
         * PAUSED PlayerState
         * @returns {Collaboration.PlayerState}
         */

    }, {
        key: "PAUSED",
        value: function PAUSED() {
            return Collaboration.PlayerState(2);
        }
        /**
         * BUFFERING PlayerState
         * @returns {Collaboration.PlayerState}
         */

    }, {
        key: "BUFFERING",
        value: function BUFFERING() {
            return Collaboration.PlayerState(3);
        }
        /**
         * CUED PlayerState
         * @returns {Collaboration.PlayerState}
         */

    }, {
        key: "CUED",
        value: function CUED() {
            return Collaboration.PlayerState(5);
        }
    }]);

    return _class14;
})(Model);

/**
 * @class View
 */
Collaboration.View = (function (_Model12) {
    _inherits(_class15, _Model12);

    /**
     *
     * @param id {UUID}
     * @param collaborationId {UUID}
     * @param app {Apps.App}
     * @param resource {Resource.Resource}
     * @param key {String}
     * @param entities {Entities.Entity[]}
     */

    function _class15(type, id, collaborationId, app, resource, key, entities) {
        _classCallCheck(this, _class15);

        var _this22 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class15).call(this, type));

        _this22.id = null;
        _this22.collaborationId = null;
        _this22.app = null;
        _this22.resource = null;
        _this22.key = null;
        _this22.entities = new Set();
        if (arguments.length > 1) {
            _this22.id = new UUID(id);
            _this22.collaborationId = new UUID(collaborationId);
            _this22.app = Type.check(app, Apps.App);
            _this22.resource = Type.check(resource, Resource.Resource);
            _this22.key = new String(key);
            // FIXME: Set does not define "map"
            _this22.entities = entities;
        }
        return _this22;
    }

    return _class15;
})(Model);

/**
 * @class UrlView
 */
Collaboration.UrlView = (function (_Collaboration$View) {
    _inherits(_class16, _Collaboration$View);

    _createClass(_class16, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$UrlView';
        }

        /**
         *
         * @param collaborationId {UUID}
         * @param app {Apps.App}
         * @param resource {Resource.Resource}
         * @param key {String}
         * @param entities {Entities.Entity[]}
         */

    }]);

    function _class16(collaborationId, app, resource, key, entities) {
        _classCallCheck(this, _class16);

        if (arguments.length) {
            var _this23 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class16).call(this, Collaboration.UrlView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities));
        } else {
            var _this23 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class16).call(this, Collaboration.UrlView.type()));
        }
        return _possibleConstructorReturn(_this23);
    }

    return _class16;
})(Collaboration.View);

/**
 * @class DocumentView
 */
Collaboration.DocumentView = (function (_Collaboration$View2) {
    _inherits(_class17, _Collaboration$View2);

    _createClass(_class17, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$DocumentView';
        }

        /**
         *
         * @param collaborationId {UUID}
         * @param app {Apps.App}
         * @param resource {Resource.Resource}
         * @param key {String}
         * @param entities {Entities.Entity[]}
         * @param page {Int}
         */

    }]);

    function _class17(collaborationId, app, resource, key, entities, sampleTimeMs, playerState) {
        _classCallCheck(this, _class17);

        if (arguments.length) {
            var _this24 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class17).call(this, Collaboration.DocumentView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, page));

            _this24.page = page;
        } else {
            var _this24 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class17).call(this, Collaboration.DocumentView.type()));

            _this24.page = null;
        }
        return _possibleConstructorReturn(_this24);
    }

    return _class17;
})(Collaboration.View);

/**
 * @class VideoView
 */
Collaboration.VideoView = (function (_Collaboration$View3) {
    _inherits(_class18, _Collaboration$View3);

    _createClass(_class18, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$VideoView';
        }

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

    }]);

    function _class18(collaborationId, app, resource, key, entities, sampleTimeMs, playerState) {
        _classCallCheck(this, _class18);

        if (arguments.length) {
            var _this25 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class18).call(this, Collaboration.VideoView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, sampleTimeMs, playerState));

            _this25.sampleTimeMs = sampleTimeMs;
            _this25.playerState = Type.check(playerState, Collaboration.PlayerState);
        } else {
            var _this25 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class18).call(this, Collaboration.VideoView.type()));

            _this25.sampleTimeMs = null;
            _this25.playerState = null;
        }
        return _possibleConstructorReturn(_this25);
    }

    return _class18;
})(Collaboration.View);

/**
 * @class ImageView
 */
Collaboration.ImageView = (function (_Collaboration$View4) {
    _inherits(_class19, _Collaboration$View4);

    _createClass(_class19, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$ImageView';
        }

        /**
         *
         * @param collaborationId {UUID}
         * @param app {Apps.App}
         * @param resource {Resource.Resource}
         * @param key {String}
         * @param entities {Entities.Entity[]}
         * @param transform {Geom.Transform3d}
         */

    }]);

    function _class19(collaborationId, app, resource, key, entities, transform) {
        _classCallCheck(this, _class19);

        if (arguments.length) {
            var _this26 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class19).call(this, Collaboration.ImageView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform));

            _this26.transform = Type.check(transform, Geom.Transform3d);
        } else {
            var _this26 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class19).call(this, Collaboration.ImageView.type()));

            _this26.transform = null;
        }
        return _possibleConstructorReturn(_this26);
    }

    return _class19;
})(Collaboration.View);

/**
 * @class GLView
 */
Collaboration.GLView = (function (_Collaboration$View5) {
    _inherits(_class20, _Collaboration$View5);

    _createClass(_class20, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$GLView';
        }

        /**
         *
         * @param collaborationId {UUID}
         * @param app {Apps.App}
         * @param resource {Resource.Resource}
         * @param key {String}
         * @param entities {Entities.Entity[]}
         * @param transform {Geom.Transform3d}
         */

    }]);

    function _class20(collaborationId, app, resource, key, entities, transform) {
        _classCallCheck(this, _class20);

        if (arguments.length) {
            var _this27 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class20).call(this, Collaboration.GLView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform));

            _this27.transform = Type.check(transform, Geom.Transform3d);
        } else {
            var _this27 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class20).call(this, Collaboration.GLView.type()));

            _this27.transform = null;
        }
        return _possibleConstructorReturn(_this27);
    }

    return _class20;
})(Collaboration.View);

/**
 * @class MapView
 */
Collaboration.MapView = (function (_Collaboration$View6) {
    _inherits(_class21, _Collaboration$View6);

    _createClass(_class21, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$MapView';
        }

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

    }]);

    function _class21(collaborationId, app, resource, key, entities, lat, lng, zoom, markers, update, address, name) {
        _classCallCheck(this, _class21);

        if (arguments.length) {
            var _this28 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class21).call(this, Collaboration.MapView.type(), '00000000-0000-0000-0000-000000000000', collaborationId, app, resource, key, entities, transform));

            _this28.lat = lat;
            _this28.lng = lng;
            _this28.zoom = zoom;
            _this28.markers = markers;
            _this28.update = update;
            _this28.address = address;
            _this28.name = name;
        } else {
            var _this28 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class21).call(this, Collaboration.MapView.type()));

            _this28.lat = null;
            _this28.lng = null;
            _this28.zoom = null;
            _this28.markers = null;
            _this28.update = null;
            _this28.address = null;
            _this28.name = null;
        }
        return _possibleConstructorReturn(_this28);
    }

    return _class21;
})(Collaboration.View);

/**
 * @class SyncViewEvent
 * Application Event to Sync the View state.
 */
Collaboration.SyncViewEvent = (function (_Model13) {
    _inherits(_class22, _Model13);

    _createClass(_class22, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$SyncViewEvent';
        }

        /**
         *
         * @param collaborationId {String}
         * @param orgId {String}
         * @param provider {Auth.Provider}
         * @param viewerState {Collaboration.View}
         */

    }]);

    function _class22(collaborationId, orgId, provider, viewerState) {
        _classCallCheck(this, _class22);

        var _this29 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class22).call(this, Collaboration.SyncViewEvent.type()));

        _this29.collaborationId = null;
        _this29.orgId = null;
        _this29.provider = null;
        _this29.viewerState = null;
        if (arguments.length) {
            _this29.collaborationId = new UUID(collaborationId);
            _this29.orgId = new UUID(orgId);
            _this29.provider = Type.check(provider, Auth.Provider);
            _this29.viewerState = viewerState;
        }
        return _this29;
    }

    return _class22;
})(Model);

/**
 * @class SyncUserEvent
 * System level event for passing user state.
 */
Collaboration.SyncUserEvent = (function (_Model14) {
    _inherits(_class23, _Model14);

    _createClass(_class23, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$SyncUserEvent';
        }

        /**
         *
         * @param collaborationId {String}
         * @param orgId {String}
         * @param provider {Auth.Provider}
         * @param userState {Auth.UserState}
         */

    }]);

    function _class23(collaborationId, orgId, provider, userState) {
        _classCallCheck(this, _class23);

        var _this30 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class23).call(this, Collaboration.SyncUserEvent.type()));

        _this30.collaborationId = null;
        _this30.orgId = null;
        _this30.provider = null;
        _this30.userState = null;
        if (arguments.length) {
            _this30.collaborationId = new UUID(collaborationId);
            _this30.orgId = new UUID(orgId);
            _this30.provider = Type.check(provider, Auth.Provider);
            _this30.userState = Type.check(userState, Auth.UserState);
        }
        return _this30;
    }

    return _class23;
})(Model);

/**
 * @class Notification
 *
 */
Collaboration.Notification = (function (_Model15) {
    _inherits(_class24, _Model15);

    _createClass(_class24, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$Notification';
        }

        /**
         *
         * @param providerKey {String}
         * @param rules {Collaboration.NotificationRule[]}
         */

    }]);

    function _class24(providerKey, rules) {
        _classCallCheck(this, _class24);

        var _this31 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class24).call(this, Collaboration.Notification.type()));

        _this31.providerKey = null;
        _this31.rules = null;
        if (arguments.length) {
            _this31.providerKey = new String(providerKey);
            // TOOD: rules [NotificationRule]
        }
        return _this31;
    }

    return _class24;
})(Model);

/**
 * @class Collaboration
 */
Collaboration.Collaboration = (function (_Model16) {
    _inherits(_class25, _Model16);

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

    function _class25(type, id, orgId, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class25);

        var _this32 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class25).call(this, type));

        _this32.id = null;
        _this32.orgId = null;
        _this32.members = null;
        _this32.notifications = null;
        _this32.name = null;
        _this32.avatarUrl = null;
        _this32.cover = null;
        _this32.content = null;
        _this32.settings = null;
        console.log('arguments.length', arguments.length);
        if (arguments.length > 1) {
            _this32.id = new UUID(id);
            _this32.orgId = new UUID(orgId);
            _this32.members = members.map(function (m) {
                return Type.check(m, Auth.Provider);
            });
            _this32.notifications = Type.check(notifications, Collaboration.Notification);
            _this32.name = typeof name === "undefined" ? null : new String(name);
            _this32.avatarUrl = avatarUrl;
            _this32.cover = cover;
            _this32.content = content.map(function (c) {
                return Type.check(c, Collaboration.Content);
            });
            _this32.settings = settings;
        }
        return _this32;
    }

    return _class25;
})(Model);

/**
 * @class CollaborationAdHoc
 */
Collaboration.CollaborationAdHoc = (function (_Collaboration$Collab) {
    _inherits(_class26, _Collaboration$Collab);

    _createClass(_class26, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationAdHoc';
        }

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

    }]);

    function _class26(id, orgId, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class26);

        if (arguments.length) {
            var _this33 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class26).call(this, Collaboration.CollaborationAdHoc.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this33 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class26).call(this, Collaboration.CollaborationAdHoc.type()));
        }
        return _possibleConstructorReturn(_this33);
    }

    return _class26;
})(Collaboration.Collaboration);

/**
 * @class CollaborationGroup
 */
Collaboration.CollaborationGroup = (function (_Collaboration$Collab2) {
    _inherits(_class27, _Collaboration$Collab2);

    _createClass(_class27, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationGroup';
        }

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

    }]);

    function _class27(id, orgId, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class27);

        if (arguments.length) {
            var _this34 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class27).call(this, Collaboration.CollaborationGroup.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this34 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class27).call(this, Collaboration.CollaborationGroup.type()));
        }
        return _possibleConstructorReturn(_this34);
    }

    return _class27;
})(Collaboration.Collaboration);

/**
 * @class CollaborationCustomer
 */
Collaboration.CollaborationCustomer = (function (_Collaboration$Collab3) {
    _inherits(_class28, _Collaboration$Collab3);

    _createClass(_class28, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationCustomer';
        }

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

    }]);

    function _class28(id, orgId, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class28);

        if (arguments.length) {
            var _this35 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class28).call(this, Collaboration.CollaborationCustomer.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this35 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class28).call(this, Collaboration.CollaborationCustomer.type()));
        }
        return _possibleConstructorReturn(_this35);
    }

    return _class28;
})(Collaboration.Collaboration);

/**
 * @class CollaborationContact
 */
Collaboration.CollaborationContact = (function (_Collaboration$Collab4) {
    _inherits(_class29, _Collaboration$Collab4);

    _createClass(_class29, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationContact';
        }

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

    }]);

    function _class29(id, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class29);

        if (arguments.length) {
            var _this36 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class29).call(this, Collaboration.CollaborationContact.type(), id, m.Auth.zeroId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this36 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class29).call(this, Collaboration.CollaborationContact.type()));
        }
        return _possibleConstructorReturn(_this36);
    }

    return _class29;
})(Collaboration.Collaboration);

/**
 * @class CollaborationConversation
 */
Collaboration.CollaborationConversation = (function (_Collaboration$Collab5) {
    _inherits(_class30, _Collaboration$Collab5);

    _createClass(_class30, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationConversation';
        }

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

    }]);

    function _class30(id, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class30);

        if (arguments.length) {
            var _this37 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class30).call(this, Collaboration.CollaborationConversation.type(), id, m.Auth.zeroId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this37 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class30).call(this, Collaboration.CollaborationConversation.type()));
        }
        return _possibleConstructorReturn(_this37);
    }

    return _class30;
})(Collaboration.Collaboration);

/**
 * @class CollaborationChannel
 */
Collaboration.CollaborationChannel = (function (_Collaboration$Collab6) {
    _inherits(_class31, _Collaboration$Collab6);

    _createClass(_class31, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$CollaborationChannel';
        }

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

    }]);

    function _class31(id, orgId, members, notifications, name, avatarUrl, cover, content, settings) {
        _classCallCheck(this, _class31);

        if (arguments.length) {
            var _this38 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class31).call(this, Collaboration.CollaborationChannel.type(), id, orgId, members, notifications, name, avatarUrl, cover, content, settings));
        } else {
            var _this38 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class31).call(this, Collaboration.CollaborationChannel.type()));
        }
        return _possibleConstructorReturn(_this38);
    }

    return _class31;
})(Collaboration.Collaboration);

/**
 * @class Content
 */
Collaboration.Content = (function (_Model17) {
    _inherits(_class32, _Model17);

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

    function _class32(type, id, collaborationId, orgId, timestamp, authors, seen, message, viewId) {
        _classCallCheck(this, _class32);

        var _this39 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class32).call(this, type));

        _this39.id = null;
        _this39.collaborationId = null;
        _this39.orgId = null;
        _this39.timestamp = null;
        _this39.authors = null;
        _this39.seen = null;
        _this39.message = null;
        _this39.viewId = null;
        if (arguments.length > 1) {
            _this39.id = new UUID(id);
            _this39.collaborationId = new UUID(collaborationId);
            _this39.orgId = new UUID(orgId);
            _this39.timestamp = new String(timestamp);
            // FIXME: Set does not define "map"
            //this.authors = authors.map((a) => Type.check(a, Auth.Provider))
            _this39.authors = authors;
            //this.seen = seen.map((s) => Type.check(s, Auth.Provider))
            _this39.seen = seen;
            _this39.message = message;
            _this39.viewId = new UUID(viewId);
        }
        return _this39;
    }

    return _class32;
})(Model);

/**
 * @class ContentMsg
 */
Collaboration.ContentMsg = (function (_Collaboration$Conten) {
    _inherits(_class33, _Collaboration$Conten);

    _createClass(_class33, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$ContentMsg';
        }

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

    }]);

    function _class33(id, collaborationId, orgId, timestamp, authors, seen, sentiment, nlp, ner, message, viewId) {
        _classCallCheck(this, _class33);

        if (arguments.length) {
            var _this40 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class33).call(this, Collaboration.ContentMsg.type(), id, collaborationId, orgId, timestamp, authors, seen, message, viewId));

            _this40.sentiment = sentiment;
            _this40.nlp = nlp;
            //this.ner = ner.map((s) => Type.check(s, Entities.NamedEntity))  // FIXME: Set does not have "map" defined on it..
            _this40.ner = ner;
        } else {
            var _this40 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class33).call(this, Collaboration.ContentMsg.type()));

            _this40.sentiment = null;
            _this40.nlp = null;
            _this40.ner = null;
        }

        return _possibleConstructorReturn(_this40);
    }

    return _class33;
})(Collaboration.Content);

/**
 * @class ContentLinkCard
 */
Collaboration.ContentLinkCard = (function (_Collaboration$Conten2) {
    _inherits(_class34, _Collaboration$Conten2);

    _createClass(_class34, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$ContentLinkCard';
        }

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

    }]);

    function _class34(id, collaborationId, orgId, timestamp, authors, seen, message, entityUri, viewId, meta) {
        _classCallCheck(this, _class34);

        if (arguments.length) {
            var _this41 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class34).call(this, Collaboration.ContentLinkCard.type(), id, collaborationId, orgId, timestamp, authors, seen, message, viewId));

            _this41.entityUri = new String(entityUri);
            _this41.meta = Type.check(s, ETL.EntityMeta);
        } else {
            var _this41 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class34).call(this, Collaboration.ContentLinkCard.type()));

            _this41.entityUri = null;
            _this41.meta = null;
        }
        return _possibleConstructorReturn(_this41);
    }

    return _class34;
})(Collaboration.Content);

/**
 * @class ContentNotification
 */
Collaboration.ContentNotification = (function (_Collaboration$Conten3) {
    _inherits(_class35, _Collaboration$Conten3);

    _createClass(_class35, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$ContentNotification';
        }

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

    }]);

    function _class35(id, collaborationId, orgId, timestamp, authors, seen, message, viewId, severity, icon) {
        _classCallCheck(this, _class35);

        if (arguments.length) {
            var _this42 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class35).call(this, Collaboration.ContentNotification.type(), id, collaborationId, orgId, timestamp, authors, seen, message, viewId));

            _this42.severity = Type.check(severity, Collaboration.NotificationLevel);
            _this42.icon = new String(icon);
        } else {
            var _this42 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class35).call(this, Collaboration.ContentNotification.type()));

            _this42.severity = null;
            _this42.icon = null;
        }
        return _possibleConstructorReturn(_this42);
    }

    return _class35;
})(Collaboration.Content);

/**
 * @class ContentAppEvent
 */
Collaboration.ContentAppEvent = (function (_Collaboration$Conten4) {
    _inherits(_class36, _Collaboration$Conten4);

    _createClass(_class36, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$ContentAppEvent';
        }

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

    }]);

    function _class36(id, collaborationId, orgId, timestamp, authors, seen, message, viewId, coverImg, actions) {
        _classCallCheck(this, _class36);

        if (arguments.length) {
            var _this43 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class36).call(this, Collaboration.ContentAppEvent.type(), id, collaborationId, orgId, timestamp, authors, seen, message, viewId));

            _this43.coverImg = new String(coverImg);
            //this.actions = actions.map((s) => Type.check(s, Apps.App))
            _this43.actions = actions;
        } else {
            var _this43 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class36).call(this, Collaboration.ContentAppEvent.type()));

            _this43.coverImg = null;
            _this43.actions = null;
        }
        return _possibleConstructorReturn(_this43);
    }

    return _class36;
})(Collaboration.Content);

/**
 * @class NotificationLevel
 */
Collaboration.NotificationLevel = (function (_Model18) {
    _inherits(_class37, _Model18);

    _createClass(_class37, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$NotificationLevel';
        }

        /**
         * @param severity {String}
         */

    }]);

    function _class37(severity) {
        _classCallCheck(this, _class37);

        var _this44 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class37).call(this, Collaboration.NotificationLevel.type()));

        _this44.severity = null;
        if (arguments.length) {
            _this44.severity = new String(severity);
        }
        return _this44;
    }

    _createClass(_class37, null, [{
        key: "info",
        value: function info() {
            new NotificationLevel("info");
        }
    }, {
        key: "warning",
        value: function warning() {
            new NotificationLevel("warning");
        }
    }, {
        key: "error",
        value: function error() {
            new NotificationLevel("error");
        }
    }]);

    return _class37;
})(Model);

/**
 * @class Message
 */
Collaboration.Message = (function (_Model19) {
    _inherits(_class38, _Model19);

    /**
     *
     * @param text {String}
     * @param mentions {Auth.Provider[]}
     */

    function _class38(type, text, mentions) {
        _classCallCheck(this, _class38);

        var _this45 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class38).call(this, type));

        _this45.text = null;
        _this45.mentions = null;
        if (arguments.length > 1) {
            _this45.text = new String(text);
            // FIXME: no "map" on Set
            //this.mentions = mentions.map((a) => Type.check(a, Auth.Provider))
            _this45.mentions = mentions;
        }
        return _this45;
    }

    return _class38;
})(Model);

/**
 * @class MessageBasic
 */
Collaboration.MessageBasic = (function (_Collaboration$Messag) {
    _inherits(_class39, _Collaboration$Messag);

    _createClass(_class39, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$MessageBasic';
        }

        /**
         *
         * @param text {String}
         * @param mentions {Auth.Provider[]}
         */

    }]);

    function _class39(text, mentions) {
        _classCallCheck(this, _class39);

        if (arguments.length) {
            var _this46 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class39).call(this, Collaboration.MessageBasic.type(), text, mentions));
        } else {
            var _this46 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class39).call(this, Collaboration.MessageBasic.type()));
        }
        return _possibleConstructorReturn(_this46);
    }

    return _class39;
})(Collaboration.Message);

/**
 * @class BroadcastContent
 */
Collaboration.BroadcastContent = (function (_Model20) {
    _inherits(_class40, _Model20);

    _createClass(_class40, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Collaboration$BroadcastContent';
        }

        /**
         *
         * @param content {Collaboration.Content}
         * @param view Option{Collaboration.View}
         */

    }]);

    function _class40(content, view) {
        _classCallCheck(this, _class40);

        var _this47 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class40).call(this, Collaboration.BroadcastContent.type()));

        _this47.content = null;
        _this47.view = null;
        if (arguments.length) {
            _this47.content = content;
            _this47.view = view;
        }
        return _this47;
    }

    return _class40;
})(Model);

/**
 * @namespace Apps
 */
var Apps = {};

/**
 * @class App
 * Identifies an application of the system.
 */
Apps.App = (function (_Model21) {
    _inherits(_class41, _Model21);

    _createClass(_class41, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$App';
        }

        /**
         *
         * @param id {String}
         * @param name {String}
         * @param icon {String}
         * @param origin {String} The origin fo the iframe that the app will be hosted in
         * @param entry {String} The entry point for the application
         * @param args {String}
         */

    }]);

    function _class41(id, name, icon, origin, entry, args) {
        _classCallCheck(this, _class41);

        var _this48 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class41).call(this, Apps.App.type()));

        _this48.id = new String(id);
        _this48.name = new String(name);
        _this48.icon = new String(icon);
        _this48.origin = new String(origin);
        _this48.entry = new String(entry);
        _this48.args = args;
        return _this48;
    }

    _createClass(_class41, null, [{
        key: "info",
        value: function info() {
            new Apps.App("info", "Chat Info", "fa fa-info ", "apps.conversant.im", "https://apps.conversant.im/app/info", {});
        }
    }, {
        key: "invite",
        value: function invite() {
            new Apps.App("invite", "Add People", "fa fa-user-plus ", "apps.conversant.im", "https://apps.conversant.im/app/invite", {});
        }
    }, {
        key: "drive",
        value: function drive() {
            new Apps.App("drive", "Drive", "fa fa-folder ", "apps.conversant.im", "https://apps.conversant.im/app/drive", {});
        }
    }, {
        key: "webCall",
        value: function webCall() {
            new Apps.App("call", "Web Call", "fa fa-phone ", "*.conversant.im", "https://apps.conversant.im/app/call", {});
        }
    }, {
        key: "youtube",
        value: function youtube() {
            new Apps.App("youtube", "YouTube", "fa fa-youtube ", "apps.conversant.im", "https://apps.conversant.im/app/youtube", {});
        }
    }, {
        key: "map",
        value: function map() {
            new Apps.App("map", "Maps", "fa fa-map-marker", "apps.conversant.im", "https://apps.conversant.im/app/map", {});
        }
    }, {
        key: "image",
        value: function image() {
            new Apps.App("image", "Image Viewer", "fa fa-picture-o", "apps.conversant.im", "https://apps.conversant.im/app/image", {});
        }
    }, {
        key: "giffy",
        value: function giffy() {
            new Apps.App("giffy", "Giffy", "fa fa-file-o", "apps.conversant.im", "https://apps.conversant.im/app/giffy", {});
        }
    }]);

    return _class41;
})(Model);

/**
 * @class Launch
 *
 */
Apps.AppMode = (function (_Model22) {
    _inherits(_class42, _Model22);

    _createClass(_class42, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$AppMode';
        }

        /**
         *
         * @param mode {String} mode the app is to run in
         */

    }]);

    function _class42(mode) {
        _classCallCheck(this, _class42);

        var _this49 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class42).call(this, Apps.AppMode.type()));

        _this49.mode = null;
        if (arguments.length) {
            _this49.mode = new String(mode);
        }
        return _this49;
    }

    _createClass(_class42, null, [{
        key: "syncApp",
        value: function syncApp() {
            new Apps.AppMode("syncApp");
        }
    }, {
        key: "collaborationApp",
        value: function collaborationApp() {
            new Apps.AppMode("collaborationApp");
        }
    }, {
        key: "standAloneApp",
        value: function standAloneApp() {
            new Apps.AppMode("standAloneApp");
        }
    }]);

    return _class42;
})(Model);

/**
 * @class Launch
 *
 */
Apps.Launch = (function (_Model23) {
    _inherits(_class43, _Model23);

    _createClass(_class43, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$Launch';
        }

        /**
         *
         * @param app {Apps.App} App to load
         * @param url {String} url to send to app
         * @param mode {Apps.Mode} The mode the app is expected to handle
         */

    }]);

    function _class43(load, url, mode) {
        _classCallCheck(this, _class43);

        var _this50 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class43).call(this, Apps.Launch.type()));

        _this50.load = null;
        _this50.url = null;
        _this50.mode = null;
        if (arguments.length) {
            _this50.app = Type.check(app, Apps.App);
            _this50.url = new String(url);
            _this50.mode = Type.check(mode, Apps.AppMode);
        }

        return _this50;
    }

    return _class43;
})(Model);

/**
 * @class Init
 * Signal the host that the app is ready for initialization.
 */
Apps.Init = (function (_Model24) {
    _inherits(_class44, _Model24);

    _createClass(_class44, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$Init';
        }

        /**
         *
         * @param appId {String} Your app id to initialize
         * @param mode {Apps.AppMode} mode you app is running in.
         */

    }]);

    function _class44(appId, mode) {
        _classCallCheck(this, _class44);

        var _this51 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class44).call(this, Apps.Init.type()));

        _this51.appId = new String(appId);
        _this51.mode = Type.check(mode, Apps.AppMode);
        return _this51;
    }

    return _class44;
})(Model);

/**
 * @class InitApp
 */
Apps.InitApp = (function (_Model25) {
    _inherits(_class45, _Model25);

    _createClass(_class45, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitApp';
        }

        /**
         *
         * @param app {Apps.App}
         * @param restoreState {Collaboration.View} OPTIONAL The view state that is to be restored
         * @param mode {Apps.AppMode}
         */

    }]);

    function _class45(app, restoreState, mode) {
        _classCallCheck(this, _class45);

        var _this52 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class45).call(this, Apps.InitApp.type()));

        _this52.app = null;
        _this52.restoreState = null;
        if (arguments.length) {
            _this52.app = Type.check(app, Apps.App);
            _this52.restoreState = restoreState;
        }
        return _this52;
    }

    return _class45;
})(Model);

/**
 * @class InitProfile
 */
Apps.InitProvider = (function (_Model26) {
    _inherits(_class46, _Model26);

    _createClass(_class46, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitProvider';
        }

        /**
         *
         * @param provider {Auth.Provider}
         */

    }]);

    function _class46(provider) {
        _classCallCheck(this, _class46);

        var _this53 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class46).call(this, Apps.InitProvider.type()));

        _this53.provider = null;
        if (arguments.length) {
            _this53.provider = Type.check(provider, Auth.Provider);
        }
        return _this53;
    }

    return _class46;
})(Model);

/**
 * @class InitOrganization
 */
Apps.InitOrganization = (function (_Model27) {
    _inherits(_class47, _Model27);

    _createClass(_class47, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitOrganization';
        }

        /**
         *
         * @param organization {Auth.Organization}
         */

    }]);

    function _class47(organization) {
        _classCallCheck(this, _class47);

        var _this54 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class47).call(this, Apps.InitOrganization.type()));

        _this54.organization = null;
        if (arguments.length) {
            _this54.organization = Type.check(organization, Auth.Organization);
        }
        return _this54;
    }

    return _class47;
})(Model);

/**
 * @class InitCollaboration
 */
Apps.InitCollaboration = (function (_Model28) {
    _inherits(_class48, _Model28);

    _createClass(_class48, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitCollaboration';
        }

        /**
         *
         * @param collaboration Option{Collaboration.Collaboration}
         */

    }]);

    function _class48(collaboration) {
        _classCallCheck(this, _class48);

        var _this55 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class48).call(this, Apps.InitCollaboration.type()));

        _this55.collaboration = null;
        if (arguments.length) {
            _this55.collaboration = collaboration;
        }
        return _this55;
    }

    return _class48;
})(Model);

/**
 * @class InitTeam
 */
Apps.InitTeam = (function (_Model29) {
    _inherits(_class49, _Model29);

    _createClass(_class49, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitTeam';
        }

        /**
         *
         * @param team {Collaboration.SyncUserEvent[]}
         */

    }]);

    function _class49(team) {
        _classCallCheck(this, _class49);

        var _this56 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class49).call(this, Apps.InitTeam.type()));

        _this56.team = null;
        if (arguments.length) {
            _this56.team = team.map(function (t) {
                return Type.check(t, Collaboration.SyncUserEvent);
            });
        }
        return _this56;
    }

    return _class49;
})(Model);

/**
 * @class InitPeers
 */
Apps.InitPeers = (function (_Model30) {
    _inherits(_class50, _Model30);

    _createClass(_class50, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Apps$InitPeers';
        }

        /**
         *
         * @param peers {Peers.PeerState[]}
         */

    }]);

    function _class50(peers, room) {
        _classCallCheck(this, _class50);

        var _this57 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class50).call(this, Apps.InitPeers.type()));

        _this57.peers = null;
        _this57.room = null;
        if (arguments.length) {
            _this57.peers = peers.map(function (p) {
                return Type.check(t, Peers.PeerState);
            });
            _this57.room = new String(room);
        }
        return _this57;
    }

    return _class50;
})(Model);

/**
 * @namespace Peers
 */
var Peers = {};

/**
 * @class PeerState
 */
Peers.PeerState = (function (_Model31) {
    _inherits(_class51, _Model31);

    _createClass(_class51, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Peers$PeerState';
        }

        /**
         * @param provider {Auth.Provider}
         * @param collaborationId {String}
         * @param userAgent {String}
         * @param iceConnectionState {Peers.IceConnectionState}
         * @param signalingState {Peers.SignalingState}
         */

    }]);

    function _class51(provider, collaborationId, userAgent, iceConnectionState, signalingState) {
        _classCallCheck(this, _class51);

        var _this58 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class51).call(this, Peers.PeerState.type()));

        _this58.provider = null;
        _this58.collaborationId = null;
        _this58.userAgent = null;
        _this58.iceConnectionState = null;
        _this58.signalingState = null;
        if (arguments.length) {
            _this58.provider = null;
            _this58.collaborationId = new String(collaborationId);
            _this58.userAgent = typeof userAgent === "undefined" ? null : new String(userAgent);
            _this58.iceConnectionState = Type.check(iceConnectionState, Peers.IceConnectionState);
            _this58.signalingState = Type.check(signalingState, Peers.SignalingState);
        }
        return _this58;
    }

    return _class51;
})(Model);

/**
 * @class IceConnectionState
 */
Peers.IceConnectionState = (function (_Model32) {
    _inherits(_class52, _Model32);

    _createClass(_class52, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Peers$IceConnectionState';
        }

        /**
         * @param state {String}
         */

    }]);

    function _class52(state) {
        _classCallCheck(this, _class52);

        var _this59 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class52).call(this, Peers.IceConnectionState.type()));

        _this59.state = null;
        if (arguments.length) {
            _this59.state = new String(state);
        }
        return _this59;
    }

    _createClass(_class52, null, [{
        key: "new",
        value: function _new() {
            new IceConnectionState("new");
        }
    }, {
        key: "checking",
        value: function checking() {
            new IceConnectionState("checking");
        }
    }, {
        key: "connected",
        value: function connected() {
            new IceConnectionState("connected");
        }
    }, {
        key: "completed",
        value: function completed() {
            new IceConnectionState("completed");
        }
    }, {
        key: "failed",
        value: function failed() {
            new IceConnectionState("failed");
        }
    }, {
        key: "disconnected",
        value: function disconnected() {
            new IceConnectionState("disconnected");
        }
    }, {
        key: "closed",
        value: function closed() {
            new IceConnectionState("closed");
        }
    }]);

    return _class52;
})(Model);

/**
 * @class SignalingState
 */
Peers.SignalingState = (function (_Model33) {
    _inherits(_class53, _Model33);

    _createClass(_class53, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Peers$SignalingState';
        }

        /**
         * @param state {String}
         */

    }]);

    function _class53(state) {
        _classCallCheck(this, _class53);

        var _this60 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class53).call(this, Peers.SignalingState.type()));

        _this60.state = null;
        if (arguments.length) {
            _this60.state = new String(state);
        }
        return _this60;
    }

    _createClass(_class53, null, [{
        key: "stable",
        value: function stable() {
            new SignalingState("stable");
        }
    }, {
        key: "haveLocalOffer",
        value: function haveLocalOffer() {
            new SignalingState("have-local-offer");
        }
    }, {
        key: "haveLocalPranswer",
        value: function haveLocalPranswer() {
            new SignalingState("have-local-pranswer");
        }
    }, {
        key: "haveRemotePranswer",
        value: function haveRemotePranswer() {
            new SignalingState("have-remote-pranswer");
        }
    }, {
        key: "closed",
        value: function closed() {
            new SignalingState("closed");
        }
    }]);

    return _class53;
})(Model);

/**
 * @namespace Resource
 */
var Resource = {};

/**
 * @class Resource
 */
Resource.Resource = (function (_Model34) {
    _inherits(_class54, _Model34);

    _createClass(_class54, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Resource$Resource';
        }

        /**
         * @param uri {String}
         * @param contentType {String}
         * @param thumbnail {String}
         */

    }]);

    function _class54(uri, contentType, thumbnail) {
        _classCallCheck(this, _class54);

        var _this61 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class54).call(this, Resource.Resource.type()));

        _this61.uri = new String(uri);
        _this61.contentType = new String(contentType);
        _this61.thumbnail = new String(thumbnail);
        return _this61;
    }

    return _class54;
})(Model);

/**
 * @namespace Geom
 */
var Geom = {};

/**
 * @class Transform3d
 * A 3D transformation
 */
Geom.Transform3d = (function (_Model35) {
    _inherits(_class55, _Model35);

    _createClass(_class55, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.Geom$Transform3d';
        }

        /**
         *
         * @param matrix {number[]}
         */

    }]);

    function _class55(matrix) {
        _classCallCheck(this, _class55);

        var _this62 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class55).call(this, Geom.Transform3d.type()));

        _this62.matrix = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
        if (arguments.length) {
            _this62.matrix = matrix;
            if (_this62.matrix.length != 4 * 4) {
                throw new Error('Matrix is not 4x4');
            }
        }
        return _this62;
    }

    /**
     * The identity matrix
     * @returns {number[]}
     */

    _createClass(_class55, null, [{
        key: "identity",
        value: function identity() {
            return new Geom.Transform3d([1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]);
        }
    }]);

    return _class55;
})(Model);

/**
 * @namespace ETL
 */
var ETL = {};

/**
 * @class Resource
 */
ETL.EntityMeta = (function (_Model36) {
    _inherits(_class56, _Model36);

    _createClass(_class56, null, [{
        key: "type",

        /**
         * Return the full class name of this type.
         * @returns {string}
         */
        value: function type() {
            return 'm.ETL$EntityMeta';
        }

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

    }]);

    function _class56(uri, timestamp, version, icon, thumb, domain, publishDate, contentType, title, description, authors, keywords, coverUrl, imgs, meta, content, raw) {
        _classCallCheck(this, _class56);

        var _this63 = _possibleConstructorReturn(this, Object.getPrototypeOf(_class56).call(this, ETL.EntityMeta.type()));

        _this63.uri = null;
        _this63.timestamp = null;
        _this63.version = null;
        _this63.icon = null;
        _this63.thumb = null;
        _this63.domain = null;
        _this63.publishDate = null;
        _this63.contentType = null;
        _this63.title = null;
        _this63.description = null;
        _this63.authors = null;
        _this63.keywords = null;
        _this63.coverUrl = null;
        _this63.imgs = null;
        _this63.meta = null;
        _this63.content = null;
        _this63.raw = null;
        if (arguments.length) {
            _this63.uri = new String(uri);
            _this63.timestamp = new String(timestamp);
            _this63.version = new String(version);
            _this63.icon = new String(icon);
            _this63.thumb = new String(thumb);
            _this63.domain = new String(domain);
            _this63.publishDate = typeof publishDate === "undefined" ? null : new String(publishDate);
            _this63.contentType = new String(contentType);
            _this63.title = new String(title);
            _this63.description = new String(description);
            _this63.authors = authors;
            _this63.keywords = keywords;
            _this63.coverUrl = new String(coverUrl);
            _this63.imgs = imgs;
            _this63.meta = meta;
            _this63.content = typeof content === "undefined" ? null : new String(content);
            _this63.raw = typeof raw === "undefined" ? null : new String(raw);
        }
        return _this63;
    }

    return _class56;
})(Model);

module.exports = {
    Type: Type,
    UUID: UUID,
    List: List,
    Integer: Integer,
    Float: Float,
    Double: Double,
    Long: Long,
    Option: Option,
    Auth: Auth,
    Collaboration: Collaboration,
    Apps: Apps,
    Entities: Entities,
    Geom: Geom,
    Peers: Peers,
    Resource: Resource,
    ETL: ETL
};

window.m = module.exports;

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright (c) Microsoft, All rights reserved. See License.txt in the project root for license information.

;(function (undefined) {

  var objectTypes = {
    'function': true,
    'object': true
  };

  function checkGlobal(value) {
    return (value && value.Object === Object) ? value : null;
  }

  var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType) ? exports : null;
  var freeModule = (objectTypes[typeof module] && module && !module.nodeType) ? module : null;
  var freeGlobal = checkGlobal(freeExports && freeModule && typeof global === 'object' && global);
  var freeSelf = checkGlobal(objectTypes[typeof self] && self);
  var freeWindow = checkGlobal(objectTypes[typeof window] && window);
  var moduleExports = (freeModule && freeModule.exports === freeExports) ? freeExports : null;
  var thisGlobal = checkGlobal(objectTypes[typeof this] && this);
  var root = freeGlobal || ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) || freeSelf || thisGlobal || Function('return this')();

  var Rx = {
    internals: {},
    config: {
      Promise: root.Promise
    },
    helpers: { }
  };

  // Defaults
  var noop = Rx.helpers.noop = function () { },
    identity = Rx.helpers.identity = function (x) { return x; },
    defaultNow = Rx.helpers.defaultNow = Date.now,
    defaultComparer = Rx.helpers.defaultComparer = function (x, y) { return isEqual(x, y); },
    defaultSubComparer = Rx.helpers.defaultSubComparer = function (x, y) { return x > y ? 1 : (x < y ? -1 : 0); },
    defaultKeySerializer = Rx.helpers.defaultKeySerializer = function (x) { return x.toString(); },
    defaultError = Rx.helpers.defaultError = function (err) { throw err; },
    isPromise = Rx.helpers.isPromise = function (p) { return !!p && typeof p.subscribe !== 'function' && typeof p.then === 'function'; },
    isFunction = Rx.helpers.isFunction = (function () {

      var isFn = function (value) {
        return typeof value == 'function' || false;
      };

      // fallback for older versions of Chrome and Safari
      if (isFn(/x/)) {
        isFn = function(value) {
          return typeof value == 'function' && toString.call(value) == '[object Function]';
        };
      }

      return isFn;
    }());

    function cloneArray(arr) {
      var len = arr.length, a = new Array(len);
      for(var i = 0; i < len; i++) { a[i] = arr[i]; }
      return a;
    }

  var errorObj = {e: {}};
  
  function tryCatcherGen(tryCatchTarget) {
    return function tryCatcher() {
      try {
        return tryCatchTarget.apply(this, arguments);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    };
  }

  var tryCatch = Rx.internals.tryCatch = function tryCatch(fn) {
    if (!isFunction(fn)) { throw new TypeError('fn must be a function'); }
    return tryCatcherGen(fn);
  };

  function thrower(e) {
    throw e;
  }

  Rx.config.longStackSupport = false;
  var hasStacks = false, stacks = tryCatch(function () { throw new Error(); })();
  hasStacks = !!stacks.e && !!stacks.e.stack;

  // All code after this point will be filtered from stack traces reported by RxJS
  var rStartingLine = captureLine(), rFileName;

  var STACK_JUMP_SEPARATOR = 'From previous event:';

  function makeStackTraceLong(error, observable) {
    // If possible, transform the error stack trace by removing Node and RxJS
    // cruft, then concatenating with the stack trace of `observable`.
    if (hasStacks &&
        observable.stack &&
        typeof error === 'object' &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
      var stacks = [];
      for (var o = observable; !!o; o = o.source) {
        if (o.stack) {
          stacks.unshift(o.stack);
        }
      }
      stacks.unshift(error.stack);

      var concatedStacks = stacks.join('\n' + STACK_JUMP_SEPARATOR + '\n');
      error.stack = filterStackString(concatedStacks);
    }
  }

  function filterStackString(stackString) {
    var lines = stackString.split('\n'), desiredLines = [];
    for (var i = 0, len = lines.length; i < len; i++) {
      var line = lines[i];

      if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
        desiredLines.push(line);
      }
    }
    return desiredLines.join('\n');
  }

  function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
    if (!fileNameAndLineNumber) {
      return false;
    }
    var fileName = fileNameAndLineNumber[0], lineNumber = fileNameAndLineNumber[1];

    return fileName === rFileName &&
      lineNumber >= rStartingLine &&
      lineNumber <= rEndingLine;
  }

  function isNodeFrame(stackLine) {
    return stackLine.indexOf('(module.js:') !== -1 ||
      stackLine.indexOf('(node.js:') !== -1;
  }

  function captureLine() {
    if (!hasStacks) { return; }

    try {
      throw new Error();
    } catch (e) {
      var lines = e.stack.split('\n');
      var firstLine = lines[0].indexOf('@') > 0 ? lines[1] : lines[2];
      var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
      if (!fileNameAndLineNumber) { return; }

      rFileName = fileNameAndLineNumber[0];
      return fileNameAndLineNumber[1];
    }
  }

  function getFileNameAndLineNumber(stackLine) {
    // Named functions: 'at functionName (filename:lineNumber:columnNumber)'
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) { return [attempt1[1], Number(attempt1[2])]; }

    // Anonymous functions: 'at filename:lineNumber:columnNumber'
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) { return [attempt2[1], Number(attempt2[2])]; }

    // Firefox style: 'function@filename:lineNumber or @filename:lineNumber'
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) { return [attempt3[1], Number(attempt3[2])]; }
  }

  var EmptyError = Rx.EmptyError = function() {
    this.message = 'Sequence contains no elements.';
    Error.call(this);
  };
  EmptyError.prototype = Object.create(Error.prototype);
  EmptyError.prototype.name = 'EmptyError';

  var ObjectDisposedError = Rx.ObjectDisposedError = function() {
    this.message = 'Object has been disposed';
    Error.call(this);
  };
  ObjectDisposedError.prototype = Object.create(Error.prototype);
  ObjectDisposedError.prototype.name = 'ObjectDisposedError';

  var ArgumentOutOfRangeError = Rx.ArgumentOutOfRangeError = function () {
    this.message = 'Argument out of range';
    Error.call(this);
  };
  ArgumentOutOfRangeError.prototype = Object.create(Error.prototype);
  ArgumentOutOfRangeError.prototype.name = 'ArgumentOutOfRangeError';

  var NotSupportedError = Rx.NotSupportedError = function (message) {
    this.message = message || 'This operation is not supported';
    Error.call(this);
  };
  NotSupportedError.prototype = Object.create(Error.prototype);
  NotSupportedError.prototype.name = 'NotSupportedError';

  var NotImplementedError = Rx.NotImplementedError = function (message) {
    this.message = message || 'This operation is not implemented';
    Error.call(this);
  };
  NotImplementedError.prototype = Object.create(Error.prototype);
  NotImplementedError.prototype.name = 'NotImplementedError';

  var notImplemented = Rx.helpers.notImplemented = function () {
    throw new NotImplementedError();
  };

  var notSupported = Rx.helpers.notSupported = function () {
    throw new NotSupportedError();
  };

  // Shim in iterator support
  var $iterator$ = (typeof Symbol === 'function' && Symbol.iterator) ||
    '_es6shim_iterator_';
  // Bug for mozilla version
  if (root.Set && typeof new root.Set()['@@iterator'] === 'function') {
    $iterator$ = '@@iterator';
  }

  var doneEnumerator = Rx.doneEnumerator = { done: true, value: undefined };

  var isIterable = Rx.helpers.isIterable = function (o) {
    return o && o[$iterator$] !== undefined;
  };

  var isArrayLike = Rx.helpers.isArrayLike = function (o) {
    return o && o.length !== undefined;
  };

  Rx.helpers.iterator = $iterator$;

  var bindCallback = Rx.internals.bindCallback = function (func, thisArg, argCount) {
    if (typeof thisArg === 'undefined') { return func; }
    switch(argCount) {
      case 0:
        return function() {
          return func.call(thisArg)
        };
      case 1:
        return function(arg) {
          return func.call(thisArg, arg);
        };
      case 2:
        return function(value, index) {
          return func.call(thisArg, value, index);
        };
      case 3:
        return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
    }

    return function() {
      return func.apply(thisArg, arguments);
    };
  };

  /** Used to determine if values are of the language type Object */
  var dontEnums = ['toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'],
  dontEnumsLength = dontEnums.length;

var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

var objectProto = Object.prototype,
    hasOwnProperty = objectProto.hasOwnProperty,
    objToString = objectProto.toString,
    MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

var keys = Object.keys || (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());

function equalObjects(object, other, equalFunc, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength !== othLength && !isLoose) {
    return false;
  }
  var index = objLength, key;
  while (index--) {
    key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result;

    if (!(result === undefined ? equalFunc(objValue, othValue, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key === 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    if (objCtor !== othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor === 'function' && objCtor instanceof objCtor &&
          typeof othCtor === 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      return +object === +other;

    case errorTag:
      return object.name === other.name && object.message === other.message;

    case numberTag:
      return (object !== +object) ?
        other !== +other :
        object === +other;

    case regexpTag:
    case stringTag:
      return object === (other + '');
  }
  return false;
}

var isObject = Rx.internals.isObject = function(value) {
  var type = typeof value;
  return !!value && (type === 'object' || type === 'function');
};

function isObjectLike(value) {
  return !!value && typeof value === 'object';
}

function isLength(value) {
  return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
}

var isHostObject = (function() {
  try {
    Object({ 'toString': 0 } + '');
  } catch(e) {
    return function() { return false; };
  }
  return function(value) {
    return typeof value.toString !== 'function' && typeof (value + '') === 'string';
  };
}());

function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

var isArray = Array.isArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) === arrayTag;
};

function arraySome (array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

function equalArrays(array, other, equalFunc, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength !== othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

function baseIsEqualDeep(object, other, equalFunc, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag === argsTag) {
      objTag = objectTag;
    } else if (objTag !== objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag === argsTag) {
      othTag = objectTag;
    }
  }
  var objIsObj = objTag === objectTag && !isHostObject(object),
      othIsObj = othTag === objectTag && !isHostObject(other),
      isSameTag = objTag === othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] === object) {
      return stackB[length] === other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

function baseIsEqual(value, other, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, isLoose, stackA, stackB);
}

var isEqual = Rx.internals.isEqual = function (value, other) {
  return baseIsEqual(value, other);
};

  var hasProp = {}.hasOwnProperty,
      slice = Array.prototype.slice;

  var inherits = Rx.internals.inherits = function (child, parent) {
    function __() { this.constructor = child; }
    __.prototype = parent.prototype;
    child.prototype = new __();
  };

  var addProperties = Rx.internals.addProperties = function (obj) {
    for(var sources = [], i = 1, len = arguments.length; i < len; i++) { sources.push(arguments[i]); }
    for (var idx = 0, ln = sources.length; idx < ln; idx++) {
      var source = sources[idx];
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  };

  // Rx Utils
  var addRef = Rx.internals.addRef = function (xs, r) {
    return new AnonymousObservable(function (observer) {
      return new BinaryDisposable(r.getDisposable(), xs.subscribe(observer));
    });
  };

  function arrayInitialize(count, factory) {
    var a = new Array(count);
    for (var i = 0; i < count; i++) {
      a[i] = factory();
    }
    return a;
  }

  /**
   * Represents a group of disposable resources that are disposed together.
   * @constructor
   */
  var CompositeDisposable = Rx.CompositeDisposable = function () {
    var args = [], i, len;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      len = arguments.length;
      args = new Array(len);
      for(i = 0; i < len; i++) { args[i] = arguments[i]; }
    }
    this.disposables = args;
    this.isDisposed = false;
    this.length = args.length;
  };

  var CompositeDisposablePrototype = CompositeDisposable.prototype;

  /**
   * Adds a disposable to the CompositeDisposable or disposes the disposable if the CompositeDisposable is disposed.
   * @param {Mixed} item Disposable to add.
   */
  CompositeDisposablePrototype.add = function (item) {
    if (this.isDisposed) {
      item.dispose();
    } else {
      this.disposables.push(item);
      this.length++;
    }
  };

  /**
   * Removes and disposes the first occurrence of a disposable from the CompositeDisposable.
   * @param {Mixed} item Disposable to remove.
   * @returns {Boolean} true if found; false otherwise.
   */
  CompositeDisposablePrototype.remove = function (item) {
    var shouldDispose = false;
    if (!this.isDisposed) {
      var idx = this.disposables.indexOf(item);
      if (idx !== -1) {
        shouldDispose = true;
        this.disposables.splice(idx, 1);
        this.length--;
        item.dispose();
      }
    }
    return shouldDispose;
  };

  /**
   *  Disposes all disposables in the group and removes them from the group.
   */
  CompositeDisposablePrototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var len = this.disposables.length, currentDisposables = new Array(len);
      for(var i = 0; i < len; i++) { currentDisposables[i] = this.disposables[i]; }
      this.disposables = [];
      this.length = 0;

      for (i = 0; i < len; i++) {
        currentDisposables[i].dispose();
      }
    }
  };

  /**
   * Provides a set of static methods for creating Disposables.
   * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
   */
  var Disposable = Rx.Disposable = function (action) {
    this.isDisposed = false;
    this.action = action || noop;
  };

  /** Performs the task of cleaning up resources. */
  Disposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.action();
      this.isDisposed = true;
    }
  };

  /**
   * Creates a disposable object that invokes the specified action when disposed.
   * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
   * @return {Disposable} The disposable object that runs the given action upon disposal.
   */
  var disposableCreate = Disposable.create = function (action) { return new Disposable(action); };

  /**
   * Gets the disposable that does nothing when disposed.
   */
  var disposableEmpty = Disposable.empty = { dispose: noop };

  /**
   * Validates whether the given object is a disposable
   * @param {Object} Object to test whether it has a dispose method
   * @returns {Boolean} true if a disposable object, else false.
   */
  var isDisposable = Disposable.isDisposable = function (d) {
    return d && isFunction(d.dispose);
  };

  var checkDisposed = Disposable.checkDisposed = function (disposable) {
    if (disposable.isDisposed) { throw new ObjectDisposedError(); }
  };

  var disposableFixup = Disposable._fixup = function (result) {
    return isDisposable(result) ? result : disposableEmpty;
  };

  // Single assignment
  var SingleAssignmentDisposable = Rx.SingleAssignmentDisposable = function () {
    this.isDisposed = false;
    this.current = null;
  };
  SingleAssignmentDisposable.prototype.getDisposable = function () {
    return this.current;
  };
  SingleAssignmentDisposable.prototype.setDisposable = function (value) {
    if (this.current) { throw new Error('Disposable has already been assigned'); }
    var shouldDispose = this.isDisposed;
    !shouldDispose && (this.current = value);
    shouldDispose && value && value.dispose();
  };
  SingleAssignmentDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old = this.current;
      this.current = null;
      old && old.dispose();
    }
  };

  // Multiple assignment disposable
  var SerialDisposable = Rx.SerialDisposable = function () {
    this.isDisposed = false;
    this.current = null;
  };
  SerialDisposable.prototype.getDisposable = function () {
    return this.current;
  };
  SerialDisposable.prototype.setDisposable = function (value) {
    var shouldDispose = this.isDisposed;
    if (!shouldDispose) {
      var old = this.current;
      this.current = value;
    }
    old && old.dispose();
    shouldDispose && value && value.dispose();
  };
  SerialDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old = this.current;
      this.current = null;
    }
    old && old.dispose();
  };

  var BinaryDisposable = Rx.BinaryDisposable = function (first, second) {
    this._first = first;
    this._second = second;
    this.isDisposed = false;
  };

  BinaryDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old1 = this._first;
      this._first = null;
      old1 && old1.dispose();
      var old2 = this._second;
      this._second = null;
      old2 && old2.dispose();
    }
  };

  var NAryDisposable = Rx.NAryDisposable = function (disposables) {
    this._disposables = disposables;
    this.isDisposed = false;
  };

  NAryDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      for (var i = 0, len = this._disposables.length; i < len; i++) {
        this._disposables[i].dispose();
      }
      this._disposables.length = 0;
    }
  };

  /**
   * Represents a disposable resource that only disposes its underlying disposable resource when all dependent disposable objects have been disposed.
   */
  var RefCountDisposable = Rx.RefCountDisposable = (function () {

    function InnerDisposable(disposable) {
      this.disposable = disposable;
      this.disposable.count++;
      this.isInnerDisposed = false;
    }

    InnerDisposable.prototype.dispose = function () {
      if (!this.disposable.isDisposed && !this.isInnerDisposed) {
        this.isInnerDisposed = true;
        this.disposable.count--;
        if (this.disposable.count === 0 && this.disposable.isPrimaryDisposed) {
          this.disposable.isDisposed = true;
          this.disposable.underlyingDisposable.dispose();
        }
      }
    };

    /**
     * Initializes a new instance of the RefCountDisposable with the specified disposable.
     * @constructor
     * @param {Disposable} disposable Underlying disposable.
      */
    function RefCountDisposable(disposable) {
      this.underlyingDisposable = disposable;
      this.isDisposed = false;
      this.isPrimaryDisposed = false;
      this.count = 0;
    }

    /**
     * Disposes the underlying disposable only when all dependent disposables have been disposed
     */
    RefCountDisposable.prototype.dispose = function () {
      if (!this.isDisposed && !this.isPrimaryDisposed) {
        this.isPrimaryDisposed = true;
        if (this.count === 0) {
          this.isDisposed = true;
          this.underlyingDisposable.dispose();
        }
      }
    };

    /**
     * Returns a dependent disposable that when disposed decreases the refcount on the underlying disposable.
     * @returns {Disposable} A dependent disposable contributing to the reference count that manages the underlying disposable's lifetime.
     */
    RefCountDisposable.prototype.getDisposable = function () {
      return this.isDisposed ? disposableEmpty : new InnerDisposable(this);
    };

    return RefCountDisposable;
  })();

  var ScheduledItem = Rx.internals.ScheduledItem = function (scheduler, state, action, dueTime, comparer) {
    this.scheduler = scheduler;
    this.state = state;
    this.action = action;
    this.dueTime = dueTime;
    this.comparer = comparer || defaultSubComparer;
    this.disposable = new SingleAssignmentDisposable();
  };

  ScheduledItem.prototype.invoke = function () {
    this.disposable.setDisposable(this.invokeCore());
  };

  ScheduledItem.prototype.compareTo = function (other) {
    return this.comparer(this.dueTime, other.dueTime);
  };

  ScheduledItem.prototype.isCancelled = function () {
    return this.disposable.isDisposed;
  };

  ScheduledItem.prototype.invokeCore = function () {
    return disposableFixup(this.action(this.scheduler, this.state));
  };

  /** Provides a set of static properties to access commonly used schedulers. */
  var Scheduler = Rx.Scheduler = (function () {

    function Scheduler() { }

    /** Determines whether the given object is a scheduler */
    Scheduler.isScheduler = function (s) {
      return s instanceof Scheduler;
    };

    var schedulerProto = Scheduler.prototype;

    /**
   * Schedules an action to be executed.
   * @param state State passed to the action to be executed.
   * @param {Function} action Action to be executed.
   * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
   */
    schedulerProto.schedule = function (state, action) {
      throw new NotImplementedError();
    };

  /**
   * Schedules an action to be executed after dueTime.
   * @param state State passed to the action to be executed.
   * @param {Function} action Action to be executed.
   * @param {Number} dueTime Relative time after which to execute the action.
   * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
   */
    schedulerProto.scheduleFuture = function (state, dueTime, action) {
      var dt = dueTime;
      dt instanceof Date && (dt = dt - this.now());
      dt = Scheduler.normalize(dt);

      if (dt === 0) { return this.schedule(state, action); }

      return this._scheduleFuture(state, dt, action);
    };

    schedulerProto._scheduleFuture = function (state, dueTime, action) {
      throw new NotImplementedError();
    };

    /** Gets the current time according to the local machine's system clock. */
    Scheduler.now = defaultNow;

    /** Gets the current time according to the local machine's system clock. */
    Scheduler.prototype.now = defaultNow;

    /**
     * Normalizes the specified TimeSpan value to a positive value.
     * @param {Number} timeSpan The time span value to normalize.
     * @returns {Number} The specified TimeSpan value if it is zero or positive; otherwise, 0
     */
    Scheduler.normalize = function (timeSpan) {
      timeSpan < 0 && (timeSpan = 0);
      return timeSpan;
    };

    return Scheduler;
  }());

  var normalizeTime = Scheduler.normalize, isScheduler = Scheduler.isScheduler;

  (function (schedulerProto) {

    function invokeRecImmediate(scheduler, pair) {
      var state = pair[0], action = pair[1], group = new CompositeDisposable();
      action(state, innerAction);
      return group;

      function innerAction(state2) {
        var isAdded = false, isDone = false;

        var d = scheduler.schedule(state2, scheduleWork);
        if (!isDone) {
          group.add(d);
          isAdded = true;
        }

        function scheduleWork(_, state3) {
          if (isAdded) {
            group.remove(d);
          } else {
            isDone = true;
          }
          action(state3, innerAction);
          return disposableEmpty;
        }
      }
    }

    function invokeRecDate(scheduler, pair) {
      var state = pair[0], action = pair[1], group = new CompositeDisposable();
      action(state, innerAction);
      return group;

      function innerAction(state2, dueTime1) {
        var isAdded = false, isDone = false;

        var d = scheduler.scheduleFuture(state2, dueTime1, scheduleWork);
        if (!isDone) {
          group.add(d);
          isAdded = true;
        }

        function scheduleWork(_, state3) {
          if (isAdded) {
            group.remove(d);
          } else {
            isDone = true;
          }
          action(state3, innerAction);
          return disposableEmpty;
        }
      }
    }

    /**
     * Schedules an action to be executed recursively.
     * @param {Mixed} state State passed to the action to be executed.
     * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in recursive invocation state.
     * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
     */
    schedulerProto.scheduleRecursive = function (state, action) {
      return this.schedule([state, action], invokeRecImmediate);
    };

    /**
     * Schedules an action to be executed recursively after a specified relative or absolute due time.
     * @param {Mixed} state State passed to the action to be executed.
     * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in the recursive due time and invocation state.
     * @param {Number | Date} dueTime Relative or absolute time after which to execute the action for the first time.
     * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
     */
    schedulerProto.scheduleRecursiveFuture = function (state, dueTime, action) {
      return this.scheduleFuture([state, action], dueTime, invokeRecDate);
    };

  }(Scheduler.prototype));

  (function (schedulerProto) {

    /**
     * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be scheduled using window.setInterval for the base implementation.
     * @param {Mixed} state Initial state passed to the action upon the first iteration.
     * @param {Number} period Period for running the work periodically.
     * @param {Function} action Action to be executed, potentially updating the state.
     * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
     */
    schedulerProto.schedulePeriodic = function(state, period, action) {
      if (typeof root.setInterval === 'undefined') { throw new NotSupportedError(); }
      period = normalizeTime(period);
      var s = state, id = root.setInterval(function () { s = action(s); }, period);
      return disposableCreate(function () { root.clearInterval(id); });
    };

  }(Scheduler.prototype));

  /** Gets a scheduler that schedules work immediately on the current thread. */
   var ImmediateScheduler = (function (__super__) {
    inherits(ImmediateScheduler, __super__);
    function ImmediateScheduler() {
      __super__.call(this);
    }

    ImmediateScheduler.prototype.schedule = function (state, action) {
      return disposableFixup(action(this, state));
    };

    return ImmediateScheduler;
  }(Scheduler));

  var immediateScheduler = Scheduler.immediate = new ImmediateScheduler();

  /**
   * Gets a scheduler that schedules work as soon as possible on the current thread.
   */
  var CurrentThreadScheduler = (function (__super__) {
    var queue;

    function runTrampoline () {
      while (queue.length > 0) {
        var item = queue.dequeue();
        !item.isCancelled() && item.invoke();
      }
    }

    inherits(CurrentThreadScheduler, __super__);
    function CurrentThreadScheduler() {
      __super__.call(this);
    }

    CurrentThreadScheduler.prototype.schedule = function (state, action) {
      var si = new ScheduledItem(this, state, action, this.now());

      if (!queue) {
        queue = new PriorityQueue(4);
        queue.enqueue(si);

        var result = tryCatch(runTrampoline)();
        queue = null;
        if (result === errorObj) { thrower(result.e); }
      } else {
        queue.enqueue(si);
      }
      return si.disposable;
    };

    CurrentThreadScheduler.prototype.scheduleRequired = function () { return !queue; };

    return CurrentThreadScheduler;
  }(Scheduler));

  var currentThreadScheduler = Scheduler.currentThread = new CurrentThreadScheduler();

  var SchedulePeriodicRecursive = Rx.internals.SchedulePeriodicRecursive = (function () {
    function createTick(self) {
      return function tick(command, recurse) {
        recurse(0, self._period);
        var state = tryCatch(self._action)(self._state);
        if (state === errorObj) {
          self._cancel.dispose();
          thrower(state.e);
        }
        self._state = state;
      };
    }

    function SchedulePeriodicRecursive(scheduler, state, period, action) {
      this._scheduler = scheduler;
      this._state = state;
      this._period = period;
      this._action = action;
    }

    SchedulePeriodicRecursive.prototype.start = function () {
      var d = new SingleAssignmentDisposable();
      this._cancel = d;
      d.setDisposable(this._scheduler.scheduleRecursiveFuture(0, this._period, createTick(this)));

      return d;
    };

    return SchedulePeriodicRecursive;
  }());

  var scheduleMethod, clearMethod;

  var localTimer = (function () {
    var localSetTimeout, localClearTimeout = noop;
    if (!!root.setTimeout) {
      localSetTimeout = root.setTimeout;
      localClearTimeout = root.clearTimeout;
    } else if (!!root.WScript) {
      localSetTimeout = function (fn, time) {
        root.WScript.Sleep(time);
        fn();
      };
    } else {
      throw new NotSupportedError();
    }

    return {
      setTimeout: localSetTimeout,
      clearTimeout: localClearTimeout
    };
  }());
  var localSetTimeout = localTimer.setTimeout,
    localClearTimeout = localTimer.clearTimeout;

  (function () {

    var nextHandle = 1, tasksByHandle = {}, currentlyRunning = false;

    clearMethod = function (handle) {
      delete tasksByHandle[handle];
    };

    function runTask(handle) {
      if (currentlyRunning) {
        localSetTimeout(function () { runTask(handle); }, 0);
      } else {
        var task = tasksByHandle[handle];
        if (task) {
          currentlyRunning = true;
          var result = tryCatch(task)();
          clearMethod(handle);
          currentlyRunning = false;
          if (result === errorObj) { thrower(result.e); }
        }
      }
    }

    var reNative = new RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    var setImmediate = typeof (setImmediate = freeGlobal && moduleExports && freeGlobal.setImmediate) == 'function' &&
      !reNative.test(setImmediate) && setImmediate;

    function postMessageSupported () {
      // Ensure not in a worker
      if (!root.postMessage || root.importScripts) { return false; }
      var isAsync = false, oldHandler = root.onmessage;
      // Test for async
      root.onmessage = function () { isAsync = true; };
      root.postMessage('', '*');
      root.onmessage = oldHandler;

      return isAsync;
    }

    // Use in order, setImmediate, nextTick, postMessage, MessageChannel, script readystatechanged, setTimeout
    if (isFunction(setImmediate)) {
      scheduleMethod = function (action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        setImmediate(function () { runTask(id); });

        return id;
      };
    } else if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleMethod = function (action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        process.nextTick(function () { runTask(id); });

        return id;
      };
    } else if (postMessageSupported()) {
      var MSG_PREFIX = 'ms.rx.schedule' + Math.random();

      var onGlobalPostMessage = function (event) {
        // Only if we're a match to avoid any other global events
        if (typeof event.data === 'string' && event.data.substring(0, MSG_PREFIX.length) === MSG_PREFIX) {
          runTask(event.data.substring(MSG_PREFIX.length));
        }
      };

      root.addEventListener('message', onGlobalPostMessage, false);

      scheduleMethod = function (action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        root.postMessage(MSG_PREFIX + currentId, '*');
        return id;
      };
    } else if (!!root.MessageChannel) {
      var channel = new root.MessageChannel();

      channel.port1.onmessage = function (e) { runTask(e.data); };

      scheduleMethod = function (action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        channel.port2.postMessage(id);
        return id;
      };
    } else if ('document' in root && 'onreadystatechange' in root.document.createElement('script')) {

      scheduleMethod = function (action) {
        var scriptElement = root.document.createElement('script');
        var id = nextHandle++;
        tasksByHandle[id] = action;

        scriptElement.onreadystatechange = function () {
          runTask(id);
          scriptElement.onreadystatechange = null;
          scriptElement.parentNode.removeChild(scriptElement);
          scriptElement = null;
        };
        root.document.documentElement.appendChild(scriptElement);
        return id;
      };

    } else {
      scheduleMethod = function (action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        localSetTimeout(function () {
          runTask(id);
        }, 0);

        return id;
      };
    }
  }());

  /**
   * Gets a scheduler that schedules work via a timed callback based upon platform.
   */
   var DefaultScheduler = (function (__super__) {
     inherits(DefaultScheduler, __super__);
     function DefaultScheduler() {
       __super__.call(this);
     }

     function scheduleAction(disposable, action, scheduler, state) {
       return function schedule() {
         disposable.setDisposable(Disposable._fixup(action(scheduler, state)));
       };
     }

     function ClearDisposable(id) {
       this._id = id;
       this.isDisposed = false;
     }

     ClearDisposable.prototype.dispose = function () {
       if (!this.isDisposed) {
         this.isDisposed = true;
         clearMethod(this._id);
       }
     };

     function LocalClearDisposable(id) {
       this._id = id;
       this.isDisposed = false;
     }

     LocalClearDisposable.prototype.dispose = function () {
       if (!this.isDisposed) {
         this.isDisposed = true;
         localClearTimeout(this._id);
       }
     };

    DefaultScheduler.prototype.schedule = function (state, action) {
      var disposable = new SingleAssignmentDisposable(),
          id = scheduleMethod(scheduleAction(disposable, action, this, state));
      return new BinaryDisposable(disposable, new ClearDisposable(id));
    };

    DefaultScheduler.prototype._scheduleFuture = function (state, dueTime, action) {
      if (dueTime === 0) { return this.schedule(state, action); }
      var disposable = new SingleAssignmentDisposable(),
          id = localSetTimeout(scheduleAction(disposable, action, this, state), dueTime);
      return new BinaryDisposable(disposable, new LocalClearDisposable(id));
    };

    return DefaultScheduler;
  }(Scheduler));

  var defaultScheduler = Scheduler['default'] = Scheduler.async = new DefaultScheduler();

  function IndexedItem(id, value) {
    this.id = id;
    this.value = value;
  }

  IndexedItem.prototype.compareTo = function (other) {
    var c = this.value.compareTo(other.value);
    c === 0 && (c = this.id - other.id);
    return c;
  };

  var PriorityQueue = Rx.internals.PriorityQueue = function (capacity) {
    this.items = new Array(capacity);
    this.length = 0;
  };

  var priorityProto = PriorityQueue.prototype;
  priorityProto.isHigherPriority = function (left, right) {
    return this.items[left].compareTo(this.items[right]) < 0;
  };

  priorityProto.percolate = function (index) {
    if (index >= this.length || index < 0) { return; }
    var parent = index - 1 >> 1;
    if (parent < 0 || parent === index) { return; }
    if (this.isHigherPriority(index, parent)) {
      var temp = this.items[index];
      this.items[index] = this.items[parent];
      this.items[parent] = temp;
      this.percolate(parent);
    }
  };

  priorityProto.heapify = function (index) {
    +index || (index = 0);
    if (index >= this.length || index < 0) { return; }
    var left = 2 * index + 1,
        right = 2 * index + 2,
        first = index;
    if (left < this.length && this.isHigherPriority(left, first)) {
      first = left;
    }
    if (right < this.length && this.isHigherPriority(right, first)) {
      first = right;
    }
    if (first !== index) {
      var temp = this.items[index];
      this.items[index] = this.items[first];
      this.items[first] = temp;
      this.heapify(first);
    }
  };

  priorityProto.peek = function () { return this.items[0].value; };

  priorityProto.removeAt = function (index) {
    this.items[index] = this.items[--this.length];
    this.items[this.length] = undefined;
    this.heapify();
  };

  priorityProto.dequeue = function () {
    var result = this.peek();
    this.removeAt(0);
    return result;
  };

  priorityProto.enqueue = function (item) {
    var index = this.length++;
    this.items[index] = new IndexedItem(PriorityQueue.count++, item);
    this.percolate(index);
  };

  priorityProto.remove = function (item) {
    for (var i = 0; i < this.length; i++) {
      if (this.items[i].value === item) {
        this.removeAt(i);
        return true;
      }
    }
    return false;
  };
  PriorityQueue.count = 0;

  /**
   *  Represents a notification to an observer.
   */
  var Notification = Rx.Notification = (function () {
    function Notification() {

    }

    Notification.prototype._accept = function (onNext, onError, onCompleted) {
      throw new NotImplementedError();
    };

    Notification.prototype._acceptObserver = function (onNext, onError, onCompleted) {
      throw new NotImplementedError();
    };

    /**
     * Invokes the delegate corresponding to the notification or the observer's method corresponding to the notification and returns the produced result.
     * @param {Function | Observer} observerOrOnNext Function to invoke for an OnNext notification or Observer to invoke the notification on..
     * @param {Function} onError Function to invoke for an OnError notification.
     * @param {Function} onCompleted Function to invoke for an OnCompleted notification.
     * @returns {Any} Result produced by the observation.
     */
    Notification.prototype.accept = function (observerOrOnNext, onError, onCompleted) {
      return observerOrOnNext && typeof observerOrOnNext === 'object' ?
        this._acceptObserver(observerOrOnNext) :
        this._accept(observerOrOnNext, onError, onCompleted);
    };

    /**
     * Returns an observable sequence with a single notification.
     *
     * @memberOf Notifications
     * @param {Scheduler} [scheduler] Scheduler to send out the notification calls on.
     * @returns {Observable} The observable sequence that surfaces the behavior of the notification upon subscription.
     */
    Notification.prototype.toObservable = function (scheduler) {
      var self = this;
      isScheduler(scheduler) || (scheduler = immediateScheduler);
      return new AnonymousObservable(function (o) {
        return scheduler.schedule(self, function (_, notification) {
          notification._acceptObserver(o);
          notification.kind === 'N' && o.onCompleted();
        });
      });
    };

    return Notification;
  })();

  var OnNextNotification = (function (__super__) {
    inherits(OnNextNotification, __super__);
    function OnNextNotification(value) {
      this.value = value;
      this.kind = 'N';
    }

    OnNextNotification.prototype._accept = function (onNext) {
      return onNext(this.value);
    };

    OnNextNotification.prototype._acceptObserver = function (o) {
      return o.onNext(this.value);
    };

    OnNextNotification.prototype.toString = function () {
      return 'OnNext(' + this.value + ')';
    };

    return OnNextNotification;
  }(Notification));

  var OnErrorNotification = (function (__super__) {
    inherits(OnErrorNotification, __super__);
    function OnErrorNotification(error) {
      this.error = error;
      this.kind = 'E';
    }

    OnErrorNotification.prototype._accept = function (onNext, onError) {
      return onError(this.error);
    };

    OnErrorNotification.prototype._acceptObserver = function (o) {
      return o.onError(this.error);
    };

    OnErrorNotification.prototype.toString = function () {
      return 'OnError(' + this.error + ')';
    };

    return OnErrorNotification;
  }(Notification));

  var OnCompletedNotification = (function (__super__) {
    inherits(OnCompletedNotification, __super__);
    function OnCompletedNotification() {
      this.kind = 'C';
    }

    OnCompletedNotification.prototype._accept = function (onNext, onError, onCompleted) {
      return onCompleted();
    };

    OnCompletedNotification.prototype._acceptObserver = function (o) {
      return o.onCompleted();
    };

    OnCompletedNotification.prototype.toString = function () {
      return 'OnCompleted()';
    };

    return OnCompletedNotification;
  }(Notification));

  /**
   * Creates an object that represents an OnNext notification to an observer.
   * @param {Any} value The value contained in the notification.
   * @returns {Notification} The OnNext notification containing the value.
   */
  var notificationCreateOnNext = Notification.createOnNext = function (value) {
    return new OnNextNotification(value);
  };

  /**
   * Creates an object that represents an OnError notification to an observer.
   * @param {Any} error The exception contained in the notification.
   * @returns {Notification} The OnError notification containing the exception.
   */
  var notificationCreateOnError = Notification.createOnError = function (error) {
    return new OnErrorNotification(error);
  };

  /**
   * Creates an object that represents an OnCompleted notification to an observer.
   * @returns {Notification} The OnCompleted notification.
   */
  var notificationCreateOnCompleted = Notification.createOnCompleted = function () {
    return new OnCompletedNotification();
  };

  /**
   * Supports push-style iteration over an observable sequence.
   */
  var Observer = Rx.Observer = function () { };

  /**
   *  Creates an observer from the specified OnNext, along with optional OnError, and OnCompleted actions.
   * @param {Function} [onNext] Observer's OnNext action implementation.
   * @param {Function} [onError] Observer's OnError action implementation.
   * @param {Function} [onCompleted] Observer's OnCompleted action implementation.
   * @returns {Observer} The observer object implemented using the given actions.
   */
  var observerCreate = Observer.create = function (onNext, onError, onCompleted) {
    onNext || (onNext = noop);
    onError || (onError = defaultError);
    onCompleted || (onCompleted = noop);
    return new AnonymousObserver(onNext, onError, onCompleted);
  };

  /**
   * Abstract base class for implementations of the Observer class.
   * This base class enforces the grammar of observers where OnError and OnCompleted are terminal messages.
   */
  var AbstractObserver = Rx.internals.AbstractObserver = (function (__super__) {
    inherits(AbstractObserver, __super__);

    /**
     * Creates a new observer in a non-stopped state.
     */
    function AbstractObserver() {
      this.isStopped = false;
    }

    // Must be implemented by other observers
    AbstractObserver.prototype.next = notImplemented;
    AbstractObserver.prototype.error = notImplemented;
    AbstractObserver.prototype.completed = notImplemented;

    /**
     * Notifies the observer of a new element in the sequence.
     * @param {Any} value Next element in the sequence.
     */
    AbstractObserver.prototype.onNext = function (value) {
      !this.isStopped && this.next(value);
    };

    /**
     * Notifies the observer that an exception has occurred.
     * @param {Any} error The error that has occurred.
     */
    AbstractObserver.prototype.onError = function (error) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.error(error);
      }
    };

    /**
     * Notifies the observer of the end of the sequence.
     */
    AbstractObserver.prototype.onCompleted = function () {
      if (!this.isStopped) {
        this.isStopped = true;
        this.completed();
      }
    };

    /**
     * Disposes the observer, causing it to transition to the stopped state.
     */
    AbstractObserver.prototype.dispose = function () { this.isStopped = true; };

    AbstractObserver.prototype.fail = function (e) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.error(e);
        return true;
      }

      return false;
    };

    return AbstractObserver;
  }(Observer));

  /**
   * Class to create an Observer instance from delegate-based implementations of the on* methods.
   */
  var AnonymousObserver = Rx.AnonymousObserver = (function (__super__) {
    inherits(AnonymousObserver, __super__);

    /**
     * Creates an observer from the specified OnNext, OnError, and OnCompleted actions.
     * @param {Any} onNext Observer's OnNext action implementation.
     * @param {Any} onError Observer's OnError action implementation.
     * @param {Any} onCompleted Observer's OnCompleted action implementation.
     */
    function AnonymousObserver(onNext, onError, onCompleted) {
      __super__.call(this);
      this._onNext = onNext;
      this._onError = onError;
      this._onCompleted = onCompleted;
    }

    /**
     * Calls the onNext action.
     * @param {Any} value Next element in the sequence.
     */
    AnonymousObserver.prototype.next = function (value) {
      this._onNext(value);
    };

    /**
     * Calls the onError action.
     * @param {Any} error The error that has occurred.
     */
    AnonymousObserver.prototype.error = function (error) {
      this._onError(error);
    };

    /**
     *  Calls the onCompleted action.
     */
    AnonymousObserver.prototype.completed = function () {
      this._onCompleted();
    };

    return AnonymousObserver;
  }(AbstractObserver));

  var observableProto;

  /**
   * Represents a push-style collection.
   */
  var Observable = Rx.Observable = (function () {

    function makeSubscribe(self, subscribe) {
      return function (o) {
        var oldOnError = o.onError;
        o.onError = function (e) {
          makeStackTraceLong(e, self);
          oldOnError.call(o, e);
        };

        return subscribe.call(self, o);
      };
    }

    function Observable() {
      if (Rx.config.longStackSupport && hasStacks) {
        var oldSubscribe = this._subscribe;
        var e = tryCatch(thrower)(new Error()).e;
        this.stack = e.stack.substring(e.stack.indexOf('\n') + 1);
        this._subscribe = makeSubscribe(this, oldSubscribe);
      }
    }

    observableProto = Observable.prototype;

    /**
    * Determines whether the given object is an Observable
    * @param {Any} An object to determine whether it is an Observable
    * @returns {Boolean} true if an Observable, else false.
    */
    Observable.isObservable = function (o) {
      return o && isFunction(o.subscribe);
    };

    /**
     *  Subscribes an o to the observable sequence.
     *  @param {Mixed} [oOrOnNext] The object that is to receive notifications or an action to invoke for each element in the observable sequence.
     *  @param {Function} [onError] Action to invoke upon exceptional termination of the observable sequence.
     *  @param {Function} [onCompleted] Action to invoke upon graceful termination of the observable sequence.
     *  @returns {Diposable} A disposable handling the subscriptions and unsubscriptions.
     */
    observableProto.subscribe = observableProto.forEach = function (oOrOnNext, onError, onCompleted) {
      return this._subscribe(typeof oOrOnNext === 'object' ?
        oOrOnNext :
        observerCreate(oOrOnNext, onError, onCompleted));
    };

    /**
     * Subscribes to the next value in the sequence with an optional "this" argument.
     * @param {Function} onNext The function to invoke on each element in the observable sequence.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Disposable} A disposable handling the subscriptions and unsubscriptions.
     */
    observableProto.subscribeOnNext = function (onNext, thisArg) {
      return this._subscribe(observerCreate(typeof thisArg !== 'undefined' ? function(x) { onNext.call(thisArg, x); } : onNext));
    };

    /**
     * Subscribes to an exceptional condition in the sequence with an optional "this" argument.
     * @param {Function} onError The function to invoke upon exceptional termination of the observable sequence.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Disposable} A disposable handling the subscriptions and unsubscriptions.
     */
    observableProto.subscribeOnError = function (onError, thisArg) {
      return this._subscribe(observerCreate(null, typeof thisArg !== 'undefined' ? function(e) { onError.call(thisArg, e); } : onError));
    };

    /**
     * Subscribes to the next value in the sequence with an optional "this" argument.
     * @param {Function} onCompleted The function to invoke upon graceful termination of the observable sequence.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Disposable} A disposable handling the subscriptions and unsubscriptions.
     */
    observableProto.subscribeOnCompleted = function (onCompleted, thisArg) {
      return this._subscribe(observerCreate(null, null, typeof thisArg !== 'undefined' ? function() { onCompleted.call(thisArg); } : onCompleted));
    };

    return Observable;
  })();

  var ScheduledObserver = Rx.internals.ScheduledObserver = (function (__super__) {
    inherits(ScheduledObserver, __super__);

    function ScheduledObserver(scheduler, observer) {
      __super__.call(this);
      this.scheduler = scheduler;
      this.observer = observer;
      this.isAcquired = false;
      this.hasFaulted = false;
      this.queue = [];
      this.disposable = new SerialDisposable();
    }

    function enqueueNext(observer, x) { return function () { observer.onNext(x); }; }
    function enqueueError(observer, e) { return function () { observer.onError(e); }; }
    function enqueueCompleted(observer) { return function () { observer.onCompleted(); }; }

    ScheduledObserver.prototype.next = function (x) {
      this.queue.push(enqueueNext(this.observer, x));
    };

    ScheduledObserver.prototype.error = function (e) {
      this.queue.push(enqueueError(this.observer, e));
    };

    ScheduledObserver.prototype.completed = function () {
      this.queue.push(enqueueCompleted(this.observer));
    };


    function scheduleMethod(state, recurse) {
      var work;
      if (state.queue.length > 0) {
        work = state.queue.shift();
      } else {
        state.isAcquired = false;
        return;
      }
      var res = tryCatch(work)();
      if (res === errorObj) {
        state.queue = [];
        state.hasFaulted = true;
        return thrower(res.e);
      }
      recurse(state);
    }

    ScheduledObserver.prototype.ensureActive = function () {
      var isOwner = false;
      if (!this.hasFaulted && this.queue.length > 0) {
        isOwner = !this.isAcquired;
        this.isAcquired = true;
      }
      isOwner &&
        this.disposable.setDisposable(this.scheduler.scheduleRecursive(this, scheduleMethod));
    };

    ScheduledObserver.prototype.dispose = function () {
      __super__.prototype.dispose.call(this);
      this.disposable.dispose();
    };

    return ScheduledObserver;
  }(AbstractObserver));

  var ObservableBase = Rx.ObservableBase = (function (__super__) {
    inherits(ObservableBase, __super__);

    function fixSubscriber(subscriber) {
      return subscriber && isFunction(subscriber.dispose) ? subscriber :
        isFunction(subscriber) ? disposableCreate(subscriber) : disposableEmpty;
    }

    function setDisposable(s, state) {
      var ado = state[0], self = state[1];
      var sub = tryCatch(self.subscribeCore).call(self, ado);
      if (sub === errorObj && !ado.fail(errorObj.e)) { thrower(errorObj.e); }
      ado.setDisposable(fixSubscriber(sub));
    }

    function ObservableBase() {
      __super__.call(this);
    }

    ObservableBase.prototype._subscribe = function (o) {
      var ado = new AutoDetachObserver(o), state = [ado, this];

      if (currentThreadScheduler.scheduleRequired()) {
        currentThreadScheduler.schedule(state, setDisposable);
      } else {
        setDisposable(null, state);
      }
      return ado;
    };

    ObservableBase.prototype.subscribeCore = notImplemented;

    return ObservableBase;
  }(Observable));

var FlatMapObservable = Rx.FlatMapObservable = (function(__super__) {

    inherits(FlatMapObservable, __super__);

    function FlatMapObservable(source, selector, resultSelector, thisArg) {
      this.resultSelector = isFunction(resultSelector) ? resultSelector : null;
      this.selector = bindCallback(isFunction(selector) ? selector : function() { return selector; }, thisArg, 3);
      this.source = source;
      __super__.call(this);
    }

    FlatMapObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this.selector, this.resultSelector, this));
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(observer, selector, resultSelector, source) {
      this.i = 0;
      this.selector = selector;
      this.resultSelector = resultSelector;
      this.source = source;
      this.o = observer;
      AbstractObserver.call(this);
    }

    InnerObserver.prototype._wrapResult = function(result, x, i) {
      return this.resultSelector ?
        result.map(function(y, i2) { return this.resultSelector(x, y, i, i2); }, this) :
        result;
    };

    InnerObserver.prototype.next = function(x) {
      var i = this.i++;
      var result = tryCatch(this.selector)(x, i, this.source);
      if (result === errorObj) { return this.o.onError(result.e); }

      isPromise(result) && (result = observableFromPromise(result));
      (isArrayLike(result) || isIterable(result)) && (result = Observable.from(result));
      this.o.onNext(this._wrapResult(result, x, i));
    };

    InnerObserver.prototype.error = function(e) { this.o.onError(e); };

    InnerObserver.prototype.completed = function() { this.o.onCompleted(); };

    return FlatMapObservable;

}(ObservableBase));

  var Enumerable = Rx.internals.Enumerable = function () { };

  function IsDisposedDisposable(state) {
    this._s = state;
    this.isDisposed = false;
  }

  IsDisposedDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this.isDisposed = true;
      this._s.isDisposed = true;
    }
  };

  var ConcatEnumerableObservable = (function(__super__) {
    inherits(ConcatEnumerableObservable, __super__);
    function ConcatEnumerableObservable(sources) {
      this.sources = sources;
      __super__.call(this);
    }

    function scheduleMethod(state, recurse) {
      if (state.isDisposed) { return; }
      var currentItem = tryCatch(state.e.next).call(state.e);
      if (currentItem === errorObj) { return state.o.onError(currentItem.e); }
      if (currentItem.done) { return state.o.onCompleted(); }

      // Check if promise
      var currentValue = currentItem.value;
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));

      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new InnerObserver(state, recurse)));
    }

    ConcatEnumerableObservable.prototype.subscribeCore = function (o) {
      var subscription = new SerialDisposable();
      var state = {
        isDisposed: false,
        o: o,
        subscription: subscription,
        e: this.sources[$iterator$]()
      };

      var cancelable = currentThreadScheduler.scheduleRecursive(state, scheduleMethod);
      return new NAryDisposable([subscription, cancelable, new IsDisposedDisposable(state)]);
    };

    function InnerObserver(state, recurse) {
      this._state = state;
      this._recurse = recurse;
      AbstractObserver.call(this);
    }

    inherits(InnerObserver, AbstractObserver);

    InnerObserver.prototype.next = function (x) { this._state.o.onNext(x); };
    InnerObserver.prototype.error = function (e) { this._state.o.onError(e); };
    InnerObserver.prototype.completed = function () { this._recurse(this._state); };

    return ConcatEnumerableObservable;
  }(ObservableBase));

  Enumerable.prototype.concat = function () {
    return new ConcatEnumerableObservable(this);
  };

  var CatchErrorObservable = (function(__super__) {
    function CatchErrorObservable(sources) {
      this.sources = sources;
      __super__.call(this);
    }

    inherits(CatchErrorObservable, __super__);

    function scheduleMethod(state, recurse) {
      if (state.isDisposed) { return; }
      var currentItem = tryCatch(state.e.next).call(state.e);
      if (currentItem === errorObj) { return state.o.onError(currentItem.e); }
      if (currentItem.done) { return state.lastError !== null ? state.o.onError(state.lastError) : state.o.onCompleted(); }

      var currentValue = currentItem.value;
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));

      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new InnerObserver(state, recurse)));
    }

    CatchErrorObservable.prototype.subscribeCore = function (o) {
      var subscription = new SerialDisposable();
      var state = {
        isDisposed: false,
        e: this.sources[$iterator$](),
        subscription: subscription,
        lastError: null,
        o: o
      };

      var cancelable = currentThreadScheduler.scheduleRecursive(state, scheduleMethod);
      return new NAryDisposable([subscription, cancelable, new IsDisposedDisposable(state)]);
    };

    function InnerObserver(state, recurse) {
      this._state = state;
      this._recurse = recurse;
      AbstractObserver.call(this);
    }

    inherits(InnerObserver, AbstractObserver);

    InnerObserver.prototype.next = function (x) { this._state.o.onNext(x); };
    InnerObserver.prototype.error = function (e) { this._state.lastError = e; this._recurse(this._state); };
    InnerObserver.prototype.completed = function () { this._state.o.onCompleted(); };

    return CatchErrorObservable;
  }(ObservableBase));

  Enumerable.prototype.catchError = function () {
    return new CatchErrorObservable(this);
  };

  Enumerable.prototype.catchErrorWhen = function (notificationHandler) {
    var sources = this;
    return new AnonymousObservable(function (o) {
      var exceptions = new Subject(),
        notifier = new Subject(),
        handled = notificationHandler(exceptions),
        notificationDisposable = handled.subscribe(notifier);

      var e = sources[$iterator$]();

      var state = { isDisposed: false },
        lastError,
        subscription = new SerialDisposable();
      var cancelable = currentThreadScheduler.scheduleRecursive(null, function (_, self) {
        if (state.isDisposed) { return; }
        var currentItem = tryCatch(e.next).call(e);
        if (currentItem === errorObj) { return o.onError(currentItem.e); }

        if (currentItem.done) {
          if (lastError) {
            o.onError(lastError);
          } else {
            o.onCompleted();
          }
          return;
        }

        // Check if promise
        var currentValue = currentItem.value;
        isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));

        var outer = new SingleAssignmentDisposable();
        var inner = new SingleAssignmentDisposable();
        subscription.setDisposable(new BinaryDisposable(inner, outer));
        outer.setDisposable(currentValue.subscribe(
          function(x) { o.onNext(x); },
          function (exn) {
            inner.setDisposable(notifier.subscribe(self, function(ex) {
              o.onError(ex);
            }, function() {
              o.onCompleted();
            }));

            exceptions.onNext(exn);
          },
          function() { o.onCompleted(); }));
      });

      return new NAryDisposable([notificationDisposable, subscription, cancelable, new IsDisposedDisposable(state)]);
    });
  };

  var RepeatEnumerable = (function (__super__) {
    inherits(RepeatEnumerable, __super__);
    function RepeatEnumerable(v, c) {
      this.v = v;
      this.c = c == null ? -1 : c;
    }

    RepeatEnumerable.prototype[$iterator$] = function () {
      return new RepeatEnumerator(this);
    };

    function RepeatEnumerator(p) {
      this.v = p.v;
      this.l = p.c;
    }

    RepeatEnumerator.prototype.next = function () {
      if (this.l === 0) { return doneEnumerator; }
      if (this.l > 0) { this.l--; }
      return { done: false, value: this.v };
    };

    return RepeatEnumerable;
  }(Enumerable));

  var enumerableRepeat = Enumerable.repeat = function (value, repeatCount) {
    return new RepeatEnumerable(value, repeatCount);
  };

  var OfEnumerable = (function(__super__) {
    inherits(OfEnumerable, __super__);
    function OfEnumerable(s, fn, thisArg) {
      this.s = s;
      this.fn = fn ? bindCallback(fn, thisArg, 3) : null;
    }
    OfEnumerable.prototype[$iterator$] = function () {
      return new OfEnumerator(this);
    };

    function OfEnumerator(p) {
      this.i = -1;
      this.s = p.s;
      this.l = this.s.length;
      this.fn = p.fn;
    }

    OfEnumerator.prototype.next = function () {
     return ++this.i < this.l ?
       { done: false, value: !this.fn ? this.s[this.i] : this.fn(this.s[this.i], this.i, this.s) } :
       doneEnumerator;
    };

    return OfEnumerable;
  }(Enumerable));

  var enumerableOf = Enumerable.of = function (source, selector, thisArg) {
    return new OfEnumerable(source, selector, thisArg);
  };

  var ToArrayObservable = (function(__super__) {
    inherits(ToArrayObservable, __super__);
    function ToArrayObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    ToArrayObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o));
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o) {
      this.o = o;
      this.a = [];
      AbstractObserver.call(this);
    }
    
    InnerObserver.prototype.next = function (x) { this.a.push(x); };
    InnerObserver.prototype.error = function (e) { this.o.onError(e);  };
    InnerObserver.prototype.completed = function () { this.o.onNext(this.a); this.o.onCompleted(); };

    return ToArrayObservable;
  }(ObservableBase));

  /**
  * Creates an array from an observable sequence.
  * @returns {Observable} An observable sequence containing a single element with a list containing all the elements of the source sequence.
  */
  observableProto.toArray = function () {
    return new ToArrayObservable(this);
  };

  /**
   *  Creates an observable sequence from a specified subscribe method implementation.
   * @example
   *  var res = Rx.Observable.create(function (observer) { return function () { } );
   *  var res = Rx.Observable.create(function (observer) { return Rx.Disposable.empty; } );
   *  var res = Rx.Observable.create(function (observer) { } );
   * @param {Function} subscribe Implementation of the resulting observable sequence's subscribe method, returning a function that will be wrapped in a Disposable.
   * @returns {Observable} The observable sequence with the specified implementation for the Subscribe method.
   */
  Observable.create = function (subscribe, parent) {
    return new AnonymousObservable(subscribe, parent);
  };

  var Defer = (function(__super__) {
    inherits(Defer, __super__);
    function Defer(factory) {
      this._f = factory;
      __super__.call(this);
    }

    Defer.prototype.subscribeCore = function (o) {
      var result = tryCatch(this._f)();
      if (result === errorObj) { return observableThrow(result.e).subscribe(o);}
      isPromise(result) && (result = observableFromPromise(result));
      return result.subscribe(o);
    };

    return Defer;
  }(ObservableBase));

  /**
   *  Returns an observable sequence that invokes the specified factory function whenever a new observer subscribes.
   *
   * @example
   *  var res = Rx.Observable.defer(function () { return Rx.Observable.fromArray([1,2,3]); });
   * @param {Function} observableFactory Observable factory function to invoke for each observer that subscribes to the resulting sequence or Promise.
   * @returns {Observable} An observable sequence whose observers trigger an invocation of the given observable factory function.
   */
  var observableDefer = Observable.defer = function (observableFactory) {
    return new Defer(observableFactory);
  };

  var EmptyObservable = (function(__super__) {
    inherits(EmptyObservable, __super__);
    function EmptyObservable(scheduler) {
      this.scheduler = scheduler;
      __super__.call(this);
    }

    EmptyObservable.prototype.subscribeCore = function (observer) {
      var sink = new EmptySink(observer, this.scheduler);
      return sink.run();
    };

    function EmptySink(observer, scheduler) {
      this.observer = observer;
      this.scheduler = scheduler;
    }

    function scheduleItem(s, state) {
      state.onCompleted();
      return disposableEmpty;
    }

    EmptySink.prototype.run = function () {
      var state = this.observer;
      return this.scheduler === immediateScheduler ?
        scheduleItem(null, state) :
        this.scheduler.schedule(state, scheduleItem);
    };

    return EmptyObservable;
  }(ObservableBase));

  var EMPTY_OBSERVABLE = new EmptyObservable(immediateScheduler);

  /**
   *  Returns an empty observable sequence, using the specified scheduler to send out the single OnCompleted message.
   *
   * @example
   *  var res = Rx.Observable.empty();
   *  var res = Rx.Observable.empty(Rx.Scheduler.timeout);
   * @param {Scheduler} [scheduler] Scheduler to send the termination call on.
   * @returns {Observable} An observable sequence with no elements.
   */
  var observableEmpty = Observable.empty = function (scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return scheduler === immediateScheduler ? EMPTY_OBSERVABLE : new EmptyObservable(scheduler);
  };

  var FromObservable = (function(__super__) {
    inherits(FromObservable, __super__);
    function FromObservable(iterable, fn, scheduler) {
      this._iterable = iterable;
      this._fn = fn;
      this._scheduler = scheduler;
      __super__.call(this);
    }

    function createScheduleMethod(o, it, fn) {
      return function loopRecursive(i, recurse) {
        var next = tryCatch(it.next).call(it);
        if (next === errorObj) { return o.onError(next.e); }
        if (next.done) { return o.onCompleted(); }

        var result = next.value;

        if (isFunction(fn)) {
          result = tryCatch(fn)(result, i);
          if (result === errorObj) { return o.onError(result.e); }
        }

        o.onNext(result);
        recurse(i + 1);
      };
    }

    FromObservable.prototype.subscribeCore = function (o) {
      var list = Object(this._iterable),
          it = getIterable(list);

      return this._scheduler.scheduleRecursive(0, createScheduleMethod(o, it, this._fn));
    };

    return FromObservable;
  }(ObservableBase));

  var maxSafeInteger = Math.pow(2, 53) - 1;

  function StringIterable(s) {
    this._s = s;
  }

  StringIterable.prototype[$iterator$] = function () {
    return new StringIterator(this._s);
  };

  function StringIterator(s) {
    this._s = s;
    this._l = s.length;
    this._i = 0;
  }

  StringIterator.prototype[$iterator$] = function () {
    return this;
  };

  StringIterator.prototype.next = function () {
    return this._i < this._l ? { done: false, value: this._s.charAt(this._i++) } : doneEnumerator;
  };

  function ArrayIterable(a) {
    this._a = a;
  }

  ArrayIterable.prototype[$iterator$] = function () {
    return new ArrayIterator(this._a);
  };

  function ArrayIterator(a) {
    this._a = a;
    this._l = toLength(a);
    this._i = 0;
  }

  ArrayIterator.prototype[$iterator$] = function () {
    return this;
  };

  ArrayIterator.prototype.next = function () {
    return this._i < this._l ? { done: false, value: this._a[this._i++] } : doneEnumerator;
  };

  function numberIsFinite(value) {
    return typeof value === 'number' && root.isFinite(value);
  }

  function isNan(n) {
    return n !== n;
  }

  function getIterable(o) {
    var i = o[$iterator$], it;
    if (!i && typeof o === 'string') {
      it = new StringIterable(o);
      return it[$iterator$]();
    }
    if (!i && o.length !== undefined) {
      it = new ArrayIterable(o);
      return it[$iterator$]();
    }
    if (!i) { throw new TypeError('Object is not iterable'); }
    return o[$iterator$]();
  }

  function sign(value) {
    var number = +value;
    if (number === 0) { return number; }
    if (isNaN(number)) { return number; }
    return number < 0 ? -1 : 1;
  }

  function toLength(o) {
    var len = +o.length;
    if (isNaN(len)) { return 0; }
    if (len === 0 || !numberIsFinite(len)) { return len; }
    len = sign(len) * Math.floor(Math.abs(len));
    if (len <= 0) { return 0; }
    if (len > maxSafeInteger) { return maxSafeInteger; }
    return len;
  }

  /**
  * This method creates a new Observable sequence from an array-like or iterable object.
  * @param {Any} arrayLike An array-like or iterable object to convert to an Observable sequence.
  * @param {Function} [mapFn] Map function to call on every element of the array.
  * @param {Any} [thisArg] The context to use calling the mapFn if provided.
  * @param {Scheduler} [scheduler] Optional scheduler to use for scheduling.  If not provided, defaults to Scheduler.currentThread.
  */
  var observableFrom = Observable.from = function (iterable, mapFn, thisArg, scheduler) {
    if (iterable == null) {
      throw new Error('iterable cannot be null.')
    }
    if (mapFn && !isFunction(mapFn)) {
      throw new Error('mapFn when provided must be a function');
    }
    if (mapFn) {
      var mapper = bindCallback(mapFn, thisArg, 2);
    }
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromObservable(iterable, mapper, scheduler);
  }

  var FromArrayObservable = (function(__super__) {
    inherits(FromArrayObservable, __super__);
    function FromArrayObservable(args, scheduler) {
      this._args = args;
      this._scheduler = scheduler;
      __super__.call(this);
    }

    function scheduleMethod(o, args) {
      var len = args.length;
      return function loopRecursive (i, recurse) {
        if (i < len) {
          o.onNext(args[i]);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }

    FromArrayObservable.prototype.subscribeCore = function (o) {
      return this._scheduler.scheduleRecursive(0, scheduleMethod(o, this._args));
    };

    return FromArrayObservable;
  }(ObservableBase));

  /**
  *  Converts an array to an observable sequence, using an optional scheduler to enumerate the array.
  * @deprecated use Observable.from or Observable.of
  * @param {Scheduler} [scheduler] Scheduler to run the enumeration of the input sequence on.
  * @returns {Observable} The observable sequence whose elements are pulled from the given enumerable sequence.
  */
  var observableFromArray = Observable.fromArray = function (array, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromArrayObservable(array, scheduler)
  };

  var NeverObservable = (function(__super__) {
    inherits(NeverObservable, __super__);
    function NeverObservable() {
      __super__.call(this);
    }

    NeverObservable.prototype.subscribeCore = function (observer) {
      return disposableEmpty;
    };

    return NeverObservable;
  }(ObservableBase));

  var NEVER_OBSERVABLE = new NeverObservable();

  /**
   * Returns a non-terminating observable sequence, which can be used to denote an infinite duration (e.g. when using reactive joins).
   * @returns {Observable} An observable sequence whose observers will never get called.
   */
  var observableNever = Observable.never = function () {
    return NEVER_OBSERVABLE;
  };

  function observableOf (scheduler, array) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromArrayObservable(array, scheduler);
  }

  /**
  *  This method creates a new Observable instance with a variable number of arguments, regardless of number or type of the arguments.
  * @returns {Observable} The observable sequence whose elements are pulled from the given arguments.
  */
  Observable.of = function () {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return new FromArrayObservable(args, currentThreadScheduler);
  };

  /**
  *  This method creates a new Observable instance with a variable number of arguments, regardless of number or type of the arguments.
  * @param {Scheduler} scheduler A scheduler to use for scheduling the arguments.
  * @returns {Observable} The observable sequence whose elements are pulled from the given arguments.
  */
  Observable.ofWithScheduler = function (scheduler) {
    var len = arguments.length, args = new Array(len - 1);
    for(var i = 1; i < len; i++) { args[i - 1] = arguments[i]; }
    return new FromArrayObservable(args, scheduler);
  };

  var PairsObservable = (function(__super__) {
    inherits(PairsObservable, __super__);
    function PairsObservable(o, scheduler) {
      this._o = o;
      this._keys = Object.keys(o);
      this._scheduler = scheduler;
      __super__.call(this);
    }

    function scheduleMethod(o, obj, keys) {
      return function loopRecursive(i, recurse) {
        if (i < keys.length) {
          var key = keys[i];
          o.onNext([key, obj[key]]);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }

    PairsObservable.prototype.subscribeCore = function (o) {
      return this._scheduler.scheduleRecursive(0, scheduleMethod(o, this._o, this._keys));
    };

    return PairsObservable;
  }(ObservableBase));

  /**
   * Convert an object into an observable sequence of [key, value] pairs.
   * @param {Object} obj The object to inspect.
   * @param {Scheduler} [scheduler] Scheduler to run the enumeration of the input sequence on.
   * @returns {Observable} An observable sequence of [key, value] pairs from the object.
   */
  Observable.pairs = function (obj, scheduler) {
    scheduler || (scheduler = currentThreadScheduler);
    return new PairsObservable(obj, scheduler);
  };

    var RangeObservable = (function(__super__) {
    inherits(RangeObservable, __super__);
    function RangeObservable(start, count, scheduler) {
      this.start = start;
      this.rangeCount = count;
      this.scheduler = scheduler;
      __super__.call(this);
    }

    function loopRecursive(start, count, o) {
      return function loop (i, recurse) {
        if (i < count) {
          o.onNext(start + i);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }

    RangeObservable.prototype.subscribeCore = function (o) {
      return this.scheduler.scheduleRecursive(
        0,
        loopRecursive(this.start, this.rangeCount, o)
      );
    };

    return RangeObservable;
  }(ObservableBase));

  /**
  *  Generates an observable sequence of integral numbers within a specified range, using the specified scheduler to send out observer messages.
  * @param {Number} start The value of the first integer in the sequence.
  * @param {Number} count The number of sequential integers to generate.
  * @param {Scheduler} [scheduler] Scheduler to run the generator loop on. If not specified, defaults to Scheduler.currentThread.
  * @returns {Observable} An observable sequence that contains a range of sequential integral numbers.
  */
  Observable.range = function (start, count, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new RangeObservable(start, count, scheduler);
  };

  var RepeatObservable = (function(__super__) {
    inherits(RepeatObservable, __super__);
    function RepeatObservable(value, repeatCount, scheduler) {
      this.value = value;
      this.repeatCount = repeatCount == null ? -1 : repeatCount;
      this.scheduler = scheduler;
      __super__.call(this);
    }

    RepeatObservable.prototype.subscribeCore = function (observer) {
      var sink = new RepeatSink(observer, this);
      return sink.run();
    };

    return RepeatObservable;
  }(ObservableBase));

  function RepeatSink(observer, parent) {
    this.observer = observer;
    this.parent = parent;
  }

  RepeatSink.prototype.run = function () {
    var observer = this.observer, value = this.parent.value;
    function loopRecursive(i, recurse) {
      if (i === -1 || i > 0) {
        observer.onNext(value);
        i > 0 && i--;
      }
      if (i === 0) { return observer.onCompleted(); }
      recurse(i);
    }

    return this.parent.scheduler.scheduleRecursive(this.parent.repeatCount, loopRecursive);
  };

  /**
   *  Generates an observable sequence that repeats the given element the specified number of times, using the specified scheduler to send out observer messages.
   * @param {Mixed} value Element to repeat.
   * @param {Number} repeatCount [Optiona] Number of times to repeat the element. If not specified, repeats indefinitely.
   * @param {Scheduler} scheduler Scheduler to run the producer loop on. If not specified, defaults to Scheduler.immediate.
   * @returns {Observable} An observable sequence that repeats the given element the specified number of times.
   */
  Observable.repeat = function (value, repeatCount, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new RepeatObservable(value, repeatCount, scheduler);
  };

  var JustObservable = (function(__super__) {
    inherits(JustObservable, __super__);
    function JustObservable(value, scheduler) {
      this._value = value;
      this._scheduler = scheduler;
      __super__.call(this);
    }

    JustObservable.prototype.subscribeCore = function (o) {
      var state = [this._value, o];
      return this._scheduler === immediateScheduler ?
        scheduleItem(null, state) :
        this._scheduler.schedule(state, scheduleItem);
    };

    function scheduleItem(s, state) {
      var value = state[0], observer = state[1];
      observer.onNext(value);
      observer.onCompleted();
      return disposableEmpty;
    }

    return JustObservable;
  }(ObservableBase));

  /**
   *  Returns an observable sequence that contains a single element, using the specified scheduler to send out observer messages.
   *  There is an alias called 'just' or browsers <IE9.
   * @param {Mixed} value Single element in the resulting observable sequence.
   * @param {Scheduler} scheduler Scheduler to send the single element on. If not specified, defaults to Scheduler.immediate.
   * @returns {Observable} An observable sequence containing the single specified element.
   */
  var observableReturn = Observable['return'] = Observable.just = function (value, scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return new JustObservable(value, scheduler);
  };

  var ThrowObservable = (function(__super__) {
    inherits(ThrowObservable, __super__);
    function ThrowObservable(error, scheduler) {
      this._error = error;
      this._scheduler = scheduler;
      __super__.call(this);
    }

    ThrowObservable.prototype.subscribeCore = function (o) {
      var state = [this._error, o];
      return this._scheduler === immediateScheduler ?
        scheduleItem(null, state) :
        this._scheduler.schedule(state, scheduleItem);
    };

    function scheduleItem(s, state) {
      var e = state[0], o = state[1];
      o.onError(e);
      return disposableEmpty;
    }

    return ThrowObservable;
  }(ObservableBase));

  /**
   *  Returns an observable sequence that terminates with an exception, using the specified scheduler to send out the single onError message.
   *  There is an alias to this method called 'throwError' for browsers <IE9.
   * @param {Mixed} error An object used for the sequence's termination.
   * @param {Scheduler} scheduler Scheduler to send the exceptional termination call on. If not specified, defaults to Scheduler.immediate.
   * @returns {Observable} The observable sequence that terminates exceptionally with the specified exception object.
   */
  var observableThrow = Observable['throw'] = function (error, scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return new ThrowObservable(error, scheduler);
  };

  var CatchObservable = (function (__super__) {
    inherits(CatchObservable, __super__);
    function CatchObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }

    CatchObservable.prototype.subscribeCore = function (o) {
      var d1 = new SingleAssignmentDisposable(), subscription = new SerialDisposable();
      subscription.setDisposable(d1);
      d1.setDisposable(this.source.subscribe(new CatchObserver(o, subscription, this._fn)));
      return subscription;
    };

    return CatchObservable;
  }(ObservableBase));

  var CatchObserver = (function(__super__) {
    inherits(CatchObserver, __super__);
    function CatchObserver(o, s, fn) {
      this._o = o;
      this._s = s;
      this._fn = fn;
      __super__.call(this);
    }

    CatchObserver.prototype.next = function (x) { this._o.onNext(x); };
    CatchObserver.prototype.completed = function () { return this._o.onCompleted(); };
    CatchObserver.prototype.error = function (e) {
      var result = tryCatch(this._fn)(e);
      if (result === errorObj) { return this._o.onError(result.e); }
      isPromise(result) && (result = observableFromPromise(result));

      var d = new SingleAssignmentDisposable();
      this._s.setDisposable(d);
      d.setDisposable(result.subscribe(this._o));
    };

    return CatchObserver;
  }(AbstractObserver));

  /**
   * Continues an observable sequence that is terminated by an exception with the next observable sequence.
   * @param {Mixed} handlerOrSecond Exception handler function that returns an observable sequence given the error that occurred in the first sequence, or a second observable sequence used to produce results when an error occurred in the first sequence.
   * @returns {Observable} An observable sequence containing the first sequence's elements, followed by the elements of the handler sequence in case an exception occurred.
   */
  observableProto['catch'] = function (handlerOrSecond) {
    return isFunction(handlerOrSecond) ? new CatchObservable(this, handlerOrSecond) : observableCatch([this, handlerOrSecond]);
  };

  /**
   * Continues an observable sequence that is terminated by an exception with the next observable sequence.
   * @param {Array | Arguments} args Arguments or an array to use as the next sequence if an error occurs.
   * @returns {Observable} An observable sequence containing elements from consecutive source sequences until a source sequence terminates successfully.
   */
  var observableCatch = Observable['catch'] = function () {
    var items;
    if (Array.isArray(arguments[0])) {
      items = arguments[0];
    } else {
      var len = arguments.length;
      items = new Array(len);
      for(var i = 0; i < len; i++) { items[i] = arguments[i]; }
    }
    return enumerableOf(items).catchError();
  };

  /**
   * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences or Promises produces an element.
   * This can be in the form of an argument list of observables or an array.
   *
   * @example
   * 1 - obs = observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
   * 2 - obs = observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
   * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
   */
  observableProto.combineLatest = function () {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    if (Array.isArray(args[0])) {
      args[0].unshift(this);
    } else {
      args.unshift(this);
    }
    return combineLatest.apply(this, args);
  };

  function falseFactory() { return false; }
  function argumentsToArray() {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return args;
  }

  var CombineLatestObservable = (function(__super__) {
    inherits(CombineLatestObservable, __super__);
    function CombineLatestObservable(params, cb) {
      this._params = params;
      this._cb = cb;
      __super__.call(this);
    }

    CombineLatestObservable.prototype.subscribeCore = function(observer) {
      var len = this._params.length,
          subscriptions = new Array(len);

      var state = {
        hasValue: arrayInitialize(len, falseFactory),
        hasValueAll: false,
        isDone: arrayInitialize(len, falseFactory),
        values: new Array(len)
      };

      for (var i = 0; i < len; i++) {
        var source = this._params[i], sad = new SingleAssignmentDisposable();
        subscriptions[i] = sad;
        isPromise(source) && (source = observableFromPromise(source));
        sad.setDisposable(source.subscribe(new CombineLatestObserver(observer, i, this._cb, state)));
      }

      return new NAryDisposable(subscriptions);
    };

    return CombineLatestObservable;
  }(ObservableBase));

  var CombineLatestObserver = (function (__super__) {
    inherits(CombineLatestObserver, __super__);
    function CombineLatestObserver(o, i, cb, state) {
      this._o = o;
      this._i = i;
      this._cb = cb;
      this._state = state;
      __super__.call(this);
    }

    function notTheSame(i) {
      return function (x, j) {
        return j !== i;
      };
    }

    CombineLatestObserver.prototype.next = function (x) {
      this._state.values[this._i] = x;
      this._state.hasValue[this._i] = true;
      if (this._state.hasValueAll || (this._state.hasValueAll = this._state.hasValue.every(identity))) {
        var res = tryCatch(this._cb).apply(null, this._state.values);
        if (res === errorObj) { return this._o.onError(res.e); }
        this._o.onNext(res);
      } else if (this._state.isDone.filter(notTheSame(this._i)).every(identity)) {
        this._o.onCompleted();
      }
    };

    CombineLatestObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    CombineLatestObserver.prototype.completed = function () {
      this._state.isDone[this._i] = true;
      this._state.isDone.every(identity) && this._o.onCompleted();
    };

    return CombineLatestObserver;
  }(AbstractObserver));

  /**
  * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences or Promises produces an element.
  *
  * @example
  * 1 - obs = Rx.Observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
  * 2 - obs = Rx.Observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
  * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
  */
  var combineLatest = Observable.combineLatest = function () {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);
    return new CombineLatestObservable(args, resultSelector);
  };

  /**
   * Concatenates all the observable sequences.  This takes in either an array or variable arguments to concatenate.
   * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order.
   */
  observableProto.concat = function () {
    for(var args = [], i = 0, len = arguments.length; i < len; i++) { args.push(arguments[i]); }
    args.unshift(this);
    return observableConcat.apply(null, args);
  };

  var ConcatObserver = (function(__super__) {
    inherits(ConcatObserver, __super__);
    function ConcatObserver(s, fn) {
      this._s = s;
      this._fn = fn;
      __super__.call(this);
    }

    ConcatObserver.prototype.next = function (x) { this._s.o.onNext(x); };
    ConcatObserver.prototype.error = function (e) { this._s.o.onError(e); };
    ConcatObserver.prototype.completed = function () { this._s.i++; this._fn(this._s); };

    return ConcatObserver;
  }(AbstractObserver));

  var ConcatObservable = (function(__super__) {
    inherits(ConcatObservable, __super__);
    function ConcatObservable(sources) {
      this._sources = sources;
      __super__.call(this);
    }

    function scheduleRecursive (state, recurse) {
      if (state.disposable.isDisposed) { return; }
      if (state.i === state.sources.length) { return state.o.onCompleted(); }

      // Check if promise
      var currentValue = state.sources[state.i];
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));

      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new ConcatObserver(state, recurse)));
    }

    ConcatObservable.prototype.subscribeCore = function(o) {
      var subscription = new SerialDisposable();
      var disposable = disposableCreate(noop);
      var state = {
        o: o,
        i: 0,
        subscription: subscription,
        disposable: disposable,
        sources: this._sources
      };

      var cancelable = immediateScheduler.scheduleRecursive(state, scheduleRecursive);
      return new NAryDisposable([subscription, disposable, cancelable]);
    };

    return ConcatObservable;
  }(ObservableBase));

  /**
   * Concatenates all the observable sequences.
   * @param {Array | Arguments} args Arguments or an array to concat to the observable sequence.
   * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order.
   */
  var observableConcat = Observable.concat = function () {
    var args;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      args = new Array(arguments.length);
      for(var i = 0, len = arguments.length; i < len; i++) { args[i] = arguments[i]; }
    }
    return new ConcatObservable(args);
  };

  /**
   * Concatenates an observable sequence of observable sequences.
   * @returns {Observable} An observable sequence that contains the elements of each observed inner sequence, in sequential order.
   */
  observableProto.concatAll = function () {
    return this.merge(1);
  };

  var MergeObservable = (function (__super__) {
    inherits(MergeObservable, __super__);

    function MergeObservable(source, maxConcurrent) {
      this.source = source;
      this.maxConcurrent = maxConcurrent;
      __super__.call(this);
    }

    MergeObservable.prototype.subscribeCore = function(observer) {
      var g = new CompositeDisposable();
      g.add(this.source.subscribe(new MergeObserver(observer, this.maxConcurrent, g)));
      return g;
    };

    return MergeObservable;

  }(ObservableBase));

  var MergeObserver = (function (__super__) {
    function MergeObserver(o, max, g) {
      this.o = o;
      this.max = max;
      this.g = g;
      this.done = false;
      this.q = [];
      this.activeCount = 0;
      __super__.call(this);
    }

    inherits(MergeObserver, __super__);

    MergeObserver.prototype.handleSubscribe = function (xs) {
      var sad = new SingleAssignmentDisposable();
      this.g.add(sad);
      isPromise(xs) && (xs = observableFromPromise(xs));
      sad.setDisposable(xs.subscribe(new InnerObserver(this, sad)));
    };

    MergeObserver.prototype.next = function (innerSource) {
      if(this.activeCount < this.max) {
        this.activeCount++;
        this.handleSubscribe(innerSource);
      } else {
        this.q.push(innerSource);
      }
    };
    MergeObserver.prototype.error = function (e) { this.o.onError(e); };
    MergeObserver.prototype.completed = function () { this.done = true; this.activeCount === 0 && this.o.onCompleted(); };

    function InnerObserver(parent, sad) {
      this.parent = parent;
      this.sad = sad;
      __super__.call(this);
    }

    inherits(InnerObserver, __super__);

    InnerObserver.prototype.next = function (x) { this.parent.o.onNext(x); };
    InnerObserver.prototype.error = function (e) { this.parent.o.onError(e); };
    InnerObserver.prototype.completed = function () {
      this.parent.g.remove(this.sad);
      if (this.parent.q.length > 0) {
        this.parent.handleSubscribe(this.parent.q.shift());
      } else {
        this.parent.activeCount--;
        this.parent.done && this.parent.activeCount === 0 && this.parent.o.onCompleted();
      }
    };

    return MergeObserver;
  }(AbstractObserver));

  /**
  * Merges an observable sequence of observable sequences into an observable sequence, limiting the number of concurrent subscriptions to inner sequences.
  * Or merges two observable sequences into a single observable sequence.
  * @param {Mixed} [maxConcurrentOrOther] Maximum number of inner observable sequences being subscribed to concurrently or the second observable sequence.
  * @returns {Observable} The observable sequence that merges the elements of the inner sequences.
  */
  observableProto.merge = function (maxConcurrentOrOther) {
    return typeof maxConcurrentOrOther !== 'number' ?
      observableMerge(this, maxConcurrentOrOther) :
      new MergeObservable(this, maxConcurrentOrOther);
  };

  /**
   * Merges all the observable sequences into a single observable sequence.
   * The scheduler is optional and if not specified, the immediate scheduler is used.
   * @returns {Observable} The observable sequence that merges the elements of the observable sequences.
   */
  var observableMerge = Observable.merge = function () {
    var scheduler, sources = [], i, len = arguments.length;
    if (!arguments[0]) {
      scheduler = immediateScheduler;
      for(i = 1; i < len; i++) { sources.push(arguments[i]); }
    } else if (isScheduler(arguments[0])) {
      scheduler = arguments[0];
      for(i = 1; i < len; i++) { sources.push(arguments[i]); }
    } else {
      scheduler = immediateScheduler;
      for(i = 0; i < len; i++) { sources.push(arguments[i]); }
    }
    if (Array.isArray(sources[0])) {
      sources = sources[0];
    }
    return observableOf(scheduler, sources).mergeAll();
  };

  var CompositeError = Rx.CompositeError = function(errors) {
    this.innerErrors = errors;
    this.message = 'This contains multiple errors. Check the innerErrors';
    Error.call(this);
  };
  CompositeError.prototype = Object.create(Error.prototype);
  CompositeError.prototype.name = 'CompositeError';

  var MergeDelayErrorObservable = (function(__super__) {
    inherits(MergeDelayErrorObservable, __super__);
    function MergeDelayErrorObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    MergeDelayErrorObservable.prototype.subscribeCore = function (o) {
      var group = new CompositeDisposable(),
        m = new SingleAssignmentDisposable(),
        state = { isStopped: false, errors: [], o: o };

      group.add(m);
      m.setDisposable(this.source.subscribe(new MergeDelayErrorObserver(group, state)));

      return group;
    };

    return MergeDelayErrorObservable;
  }(ObservableBase));

  var MergeDelayErrorObserver = (function(__super__) {
    inherits(MergeDelayErrorObserver, __super__);
    function MergeDelayErrorObserver(group, state) {
      this._group = group;
      this._state = state;
      __super__.call(this);
    }

    function setCompletion(o, errors) {
      if (errors.length === 0) {
        o.onCompleted();
      } else if (errors.length === 1) {
        o.onError(errors[0]);
      } else {
        o.onError(new CompositeError(errors));
      }
    }

    MergeDelayErrorObserver.prototype.next = function (x) {
      var inner = new SingleAssignmentDisposable();
      this._group.add(inner);

      // Check for promises support
      isPromise(x) && (x = observableFromPromise(x));
      inner.setDisposable(x.subscribe(new InnerObserver(inner, this._group, this._state)));
    };

    MergeDelayErrorObserver.prototype.error = function (e) {
      this._state.errors.push(e);
      this._state.isStopped = true;
      this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };

    MergeDelayErrorObserver.prototype.completed = function () {
      this._state.isStopped = true;
      this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };

    inherits(InnerObserver, __super__);
    function InnerObserver(inner, group, state) {
      this._inner = inner;
      this._group = group;
      this._state = state;
      __super__.call(this);
    }

    InnerObserver.prototype.next = function (x) { this._state.o.onNext(x); };
    InnerObserver.prototype.error = function (e) {
      this._state.errors.push(e);
      this._group.remove(this._inner);
      this._state.isStopped && this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };
    InnerObserver.prototype.completed = function () {
      this._group.remove(this._inner);
      this._state.isStopped && this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };

    return MergeDelayErrorObserver;
  }(AbstractObserver));

  /**
  * Flattens an Observable that emits Observables into one Observable, in a way that allows an Observer to
  * receive all successfully emitted items from all of the source Observables without being interrupted by
  * an error notification from one of them.
  *
  * This behaves like Observable.prototype.mergeAll except that if any of the merged Observables notify of an
  * error via the Observer's onError, mergeDelayError will refrain from propagating that
  * error notification until all of the merged Observables have finished emitting items.
  * @param {Array | Arguments} args Arguments or an array to merge.
  * @returns {Observable} an Observable that emits all of the items emitted by the Observables emitted by the Observable
  */
  Observable.mergeDelayError = function() {
    var args;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      var len = arguments.length;
      args = new Array(len);
      for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    }
    var source = observableOf(null, args);
    return new MergeDelayErrorObservable(source);
  };

  var MergeAllObservable = (function (__super__) {
    inherits(MergeAllObservable, __super__);

    function MergeAllObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    MergeAllObservable.prototype.subscribeCore = function (o) {
      var g = new CompositeDisposable(), m = new SingleAssignmentDisposable();
      g.add(m);
      m.setDisposable(this.source.subscribe(new MergeAllObserver(o, g)));
      return g;
    };

    return MergeAllObservable;
  }(ObservableBase));

  var MergeAllObserver = (function (__super__) {
    function MergeAllObserver(o, g) {
      this.o = o;
      this.g = g;
      this.done = false;
      __super__.call(this);
    }

    inherits(MergeAllObserver, __super__);

    MergeAllObserver.prototype.next = function(innerSource) {
      var sad = new SingleAssignmentDisposable();
      this.g.add(sad);
      isPromise(innerSource) && (innerSource = observableFromPromise(innerSource));
      sad.setDisposable(innerSource.subscribe(new InnerObserver(this, sad)));
    };

    MergeAllObserver.prototype.error = function (e) {
      this.o.onError(e);
    };

    MergeAllObserver.prototype.completed = function () {
      this.done = true;
      this.g.length === 1 && this.o.onCompleted();
    };

    function InnerObserver(parent, sad) {
      this.parent = parent;
      this.sad = sad;
      __super__.call(this);
    }

    inherits(InnerObserver, __super__);

    InnerObserver.prototype.next = function (x) {
      this.parent.o.onNext(x);
    };
    InnerObserver.prototype.error = function (e) {
      this.parent.o.onError(e);
    };
    InnerObserver.prototype.completed = function () {
      this.parent.g.remove(this.sad);
      this.parent.done && this.parent.g.length === 1 && this.parent.o.onCompleted();
    };

    return MergeAllObserver;
  }(AbstractObserver));

  /**
  * Merges an observable sequence of observable sequences into an observable sequence.
  * @returns {Observable} The observable sequence that merges the elements of the inner sequences.
  */
  observableProto.mergeAll = function () {
    return new MergeAllObservable(this);
  };

  var SkipUntilObservable = (function(__super__) {
    inherits(SkipUntilObservable, __super__);

    function SkipUntilObservable(source, other) {
      this._s = source;
      this._o = isPromise(other) ? observableFromPromise(other) : other;
      this._open = false;
      __super__.call(this);
    }

    SkipUntilObservable.prototype.subscribeCore = function(o) {
      var leftSubscription = new SingleAssignmentDisposable();
      leftSubscription.setDisposable(this._s.subscribe(new SkipUntilSourceObserver(o, this)));

      isPromise(this._o) && (this._o = observableFromPromise(this._o));

      var rightSubscription = new SingleAssignmentDisposable();
      rightSubscription.setDisposable(this._o.subscribe(new SkipUntilOtherObserver(o, this, rightSubscription)));

      return new BinaryDisposable(leftSubscription, rightSubscription);
    };

    return SkipUntilObservable;
  }(ObservableBase));

  var SkipUntilSourceObserver = (function(__super__) {
    inherits(SkipUntilSourceObserver, __super__);
    function SkipUntilSourceObserver(o, p) {
      this._o = o;
      this._p = p;
      __super__.call(this);
    }

    SkipUntilSourceObserver.prototype.next = function (x) {
      this._p._open && this._o.onNext(x);
    };

    SkipUntilSourceObserver.prototype.error = function (err) {
      this._o.onError(err);
    };

    SkipUntilSourceObserver.prototype.onCompleted = function () {
      this._p._open && this._o.onCompleted();
    };

    return SkipUntilSourceObserver;
  }(AbstractObserver));

  var SkipUntilOtherObserver = (function(__super__) {
    inherits(SkipUntilOtherObserver, __super__);
    function SkipUntilOtherObserver(o, p, r) {
      this._o = o;
      this._p = p;
      this._r = r;
      __super__.call(this);
    }

    SkipUntilOtherObserver.prototype.next = function () {
      this._p._open = true;
      this._r.dispose();
    };

    SkipUntilOtherObserver.prototype.error = function (err) {
      this._o.onError(err);
    };

    SkipUntilOtherObserver.prototype.onCompleted = function () {
      this._r.dispose();
    };

    return SkipUntilOtherObserver;
  }(AbstractObserver));

  /**
   * Returns the values from the source observable sequence only after the other observable sequence produces a value.
   * @param {Observable | Promise} other The observable sequence or Promise that triggers propagation of elements of the source sequence.
   * @returns {Observable} An observable sequence containing the elements of the source sequence starting from the point the other sequence triggered propagation.
   */
  observableProto.skipUntil = function (other) {
    return new SkipUntilObservable(this, other);
  };

  var SwitchObservable = (function(__super__) {
    inherits(SwitchObservable, __super__);
    function SwitchObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    SwitchObservable.prototype.subscribeCore = function (o) {
      var inner = new SerialDisposable(), s = this.source.subscribe(new SwitchObserver(o, inner));
      return new BinaryDisposable(s, inner);
    };

    inherits(SwitchObserver, AbstractObserver);
    function SwitchObserver(o, inner) {
      this.o = o;
      this.inner = inner;
      this.stopped = false;
      this.latest = 0;
      this.hasLatest = false;
      AbstractObserver.call(this);
    }

    SwitchObserver.prototype.next = function (innerSource) {
      var d = new SingleAssignmentDisposable(), id = ++this.latest;
      this.hasLatest = true;
      this.inner.setDisposable(d);
      isPromise(innerSource) && (innerSource = observableFromPromise(innerSource));
      d.setDisposable(innerSource.subscribe(new InnerObserver(this, id)));
    };

    SwitchObserver.prototype.error = function (e) {
      this.o.onError(e);
    };

    SwitchObserver.prototype.completed = function () {
      this.stopped = true;
      !this.hasLatest && this.o.onCompleted();
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(parent, id) {
      this.parent = parent;
      this.id = id;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function (x) {
      this.parent.latest === this.id && this.parent.o.onNext(x);
    };

    InnerObserver.prototype.error = function (e) {
      this.parent.latest === this.id && this.parent.o.onError(e);
    };

    InnerObserver.prototype.completed = function () {
      if (this.parent.latest === this.id) {
        this.parent.hasLatest = false;
        this.parent.stopped && this.parent.o.onCompleted();
      }
    };

    return SwitchObservable;
  }(ObservableBase));

  /**
  * Transforms an observable sequence of observable sequences into an observable sequence producing values only from the most recent observable sequence.
  * @returns {Observable} The observable sequence that at any point in time produces the elements of the most recent inner observable sequence that has been received.
  */
  observableProto['switch'] = observableProto.switchLatest = function () {
    return new SwitchObservable(this);
  };

  var TakeUntilObservable = (function(__super__) {
    inherits(TakeUntilObservable, __super__);

    function TakeUntilObservable(source, other) {
      this.source = source;
      this.other = isPromise(other) ? observableFromPromise(other) : other;
      __super__.call(this);
    }

    TakeUntilObservable.prototype.subscribeCore = function(o) {
      return new BinaryDisposable(
        this.source.subscribe(o),
        this.other.subscribe(new TakeUntilObserver(o))
      );
    };

    return TakeUntilObservable;
  }(ObservableBase));

  var TakeUntilObserver = (function(__super__) {
    inherits(TakeUntilObserver, __super__);
    function TakeUntilObserver(o) {
      this._o = o;
      __super__.call(this);
    }

    TakeUntilObserver.prototype.next = function () {
      this._o.onCompleted();
    };

    TakeUntilObserver.prototype.error = function (err) {
      this._o.onError(err);
    };

    TakeUntilObserver.prototype.onCompleted = noop;

    return TakeUntilObserver;
  }(AbstractObserver));

  /**
   * Returns the values from the source observable sequence until the other observable sequence produces a value.
   * @param {Observable | Promise} other Observable sequence or Promise that terminates propagation of elements of the source sequence.
   * @returns {Observable} An observable sequence containing the elements of the source sequence up to the point the other sequence interrupted further propagation.
   */
  observableProto.takeUntil = function (other) {
    return new TakeUntilObservable(this, other);
  };

  function falseFactory() { return false; }
  function argumentsToArray() {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return args;
  }

  var WithLatestFromObservable = (function(__super__) {
    inherits(WithLatestFromObservable, __super__);
    function WithLatestFromObservable(source, sources, resultSelector) {
      this._s = source;
      this._ss = sources;
      this._cb = resultSelector;
      __super__.call(this);
    }

    WithLatestFromObservable.prototype.subscribeCore = function (o) {
      var len = this._ss.length;
      var state = {
        hasValue: arrayInitialize(len, falseFactory),
        hasValueAll: false,
        values: new Array(len)
      };

      var n = this._ss.length, subscriptions = new Array(n + 1);
      for (var i = 0; i < n; i++) {
        var other = this._ss[i], sad = new SingleAssignmentDisposable();
        isPromise(other) && (other = observableFromPromise(other));
        sad.setDisposable(other.subscribe(new WithLatestFromOtherObserver(o, i, state)));
        subscriptions[i] = sad;
      }

      var outerSad = new SingleAssignmentDisposable();
      outerSad.setDisposable(this._s.subscribe(new WithLatestFromSourceObserver(o, this._cb, state)));
      subscriptions[n] = outerSad;

      return new NAryDisposable(subscriptions);
    };

    return WithLatestFromObservable;
  }(ObservableBase));

  var WithLatestFromOtherObserver = (function (__super__) {
    inherits(WithLatestFromOtherObserver, __super__);
    function WithLatestFromOtherObserver(o, i, state) {
      this._o = o;
      this._i = i;
      this._state = state;
      __super__.call(this);
    }

    WithLatestFromOtherObserver.prototype.next = function (x) {
      this._state.values[this._i] = x;
      this._state.hasValue[this._i] = true;
      this._state.hasValueAll = this._state.hasValue.every(identity);
    };

    WithLatestFromOtherObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    WithLatestFromOtherObserver.prototype.completed = noop;

    return WithLatestFromOtherObserver;
  }(AbstractObserver));

  var WithLatestFromSourceObserver = (function (__super__) {
    inherits(WithLatestFromSourceObserver, __super__);
    function WithLatestFromSourceObserver(o, cb, state) {
      this._o = o;
      this._cb = cb;
      this._state = state;
      __super__.call(this);
    }

    WithLatestFromSourceObserver.prototype.next = function (x) {
      var allValues = [x].concat(this._state.values);
      if (!this._state.hasValueAll) { return; }
      var res = tryCatch(this._cb).apply(null, allValues);
      if (res === errorObj) { return this._o.onError(res.e); }
      this._o.onNext(res);
    };

    WithLatestFromSourceObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    WithLatestFromSourceObserver.prototype.completed = function () {
      this._o.onCompleted();
    };

    return WithLatestFromSourceObserver;
  }(AbstractObserver));

  /**
   * Merges the specified observable sequences into one observable sequence by using the selector function only when the (first) source observable sequence produces an element.
   * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
   */
  observableProto.withLatestFrom = function () {
    if (arguments.length === 0) { throw new Error('invalid arguments'); }

    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);

    return new WithLatestFromObservable(this, args, resultSelector);
  };

  function falseFactory() { return false; }
  function emptyArrayFactory() { return []; }

  var ZipObservable = (function(__super__) {
    inherits(ZipObservable, __super__);
    function ZipObservable(sources, resultSelector) {
      this._s = sources;
      this._cb = resultSelector;
      __super__.call(this);
    }

    ZipObservable.prototype.subscribeCore = function(observer) {
      var n = this._s.length,
          subscriptions = new Array(n),
          done = arrayInitialize(n, falseFactory),
          q = arrayInitialize(n, emptyArrayFactory);

      for (var i = 0; i < n; i++) {
        var source = this._s[i], sad = new SingleAssignmentDisposable();
        subscriptions[i] = sad;
        isPromise(source) && (source = observableFromPromise(source));
        sad.setDisposable(source.subscribe(new ZipObserver(observer, i, this, q, done)));
      }

      return new NAryDisposable(subscriptions);
    };

    return ZipObservable;
  }(ObservableBase));

  var ZipObserver = (function (__super__) {
    inherits(ZipObserver, __super__);
    function ZipObserver(o, i, p, q, d) {
      this._o = o;
      this._i = i;
      this._p = p;
      this._q = q;
      this._d = d;
      __super__.call(this);
    }

    function notEmpty(x) { return x.length > 0; }
    function shiftEach(x) { return x.shift(); }
    function notTheSame(i) {
      return function (x, j) {
        return j !== i;
      };
    }

    ZipObserver.prototype.next = function (x) {
      this._q[this._i].push(x);
      if (this._q.every(notEmpty)) {
        var queuedValues = this._q.map(shiftEach);
        var res = tryCatch(this._p._cb).apply(null, queuedValues);
        if (res === errorObj) { return this._o.onError(res.e); }
        this._o.onNext(res);
      } else if (this._d.filter(notTheSame(this._i)).every(identity)) {
        this._o.onCompleted();
      }
    };

    ZipObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    ZipObserver.prototype.completed = function () {
      this._d[this._i] = true;
      this._d.every(identity) && this._o.onCompleted();
    };

    return ZipObserver;
  }(AbstractObserver));

  /**
   * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences or an array have produced an element at a corresponding index.
   * The last element in the arguments must be a function to invoke for each series of elements at corresponding indexes in the args.
   * @returns {Observable} An observable sequence containing the result of combining elements of the args using the specified result selector function.
   */
  observableProto.zip = function () {
    if (arguments.length === 0) { throw new Error('invalid arguments'); }

    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);

    var parent = this;
    args.unshift(parent);

    return new ZipObservable(args, resultSelector);
  };

  /**
   * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences have produced an element at a corresponding index.
   * @param arguments Observable sources.
   * @param {Function} resultSelector Function to invoke for each series of elements at corresponding indexes in the sources.
   * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
   */
  Observable.zip = function () {
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    if (Array.isArray(args[0])) {
      args = isFunction(args[1]) ? args[0].concat(args[1]) : args[0];
    }
    var first = args.shift();
    return first.zip.apply(first, args);
  };

function falseFactory() { return false; }
function emptyArrayFactory() { return []; }
function argumentsToArray() {
  var len = arguments.length, args = new Array(len);
  for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
  return args;
}

var ZipIterableObservable = (function(__super__) {
  inherits(ZipIterableObservable, __super__);
  function ZipIterableObservable(sources, cb) {
    this.sources = sources;
    this._cb = cb;
    __super__.call(this);
  }

  ZipIterableObservable.prototype.subscribeCore = function (o) {
    var sources = this.sources, len = sources.length, subscriptions = new Array(len);

    var state = {
      q: arrayInitialize(len, emptyArrayFactory),
      done: arrayInitialize(len, falseFactory),
      cb: this._cb,
      o: o
    };

    for (var i = 0; i < len; i++) {
      (function (i) {
        var source = sources[i], sad = new SingleAssignmentDisposable();
        (isArrayLike(source) || isIterable(source)) && (source = observableFrom(source));

        subscriptions[i] = sad;
        sad.setDisposable(source.subscribe(new ZipIterableObserver(state, i)));
      }(i));
    }

    return new NAryDisposable(subscriptions);
  };

  return ZipIterableObservable;
}(ObservableBase));

var ZipIterableObserver = (function (__super__) {
  inherits(ZipIterableObserver, __super__);
  function ZipIterableObserver(s, i) {
    this._s = s;
    this._i = i;
    __super__.call(this);
  }

  function notEmpty(x) { return x.length > 0; }
  function shiftEach(x) { return x.shift(); }
  function notTheSame(i) {
    return function (x, j) {
      return j !== i;
    };
  }

  ZipIterableObserver.prototype.next = function (x) {
    this._s.q[this._i].push(x);
    if (this._s.q.every(notEmpty)) {
      var queuedValues = this._s.q.map(shiftEach),
          res = tryCatch(this._s.cb).apply(null, queuedValues);
      if (res === errorObj) { return this._s.o.onError(res.e); }
      this._s.o.onNext(res);
    } else if (this._s.done.filter(notTheSame(this._i)).every(identity)) {
      this._s.o.onCompleted();
    }
  };

  ZipIterableObserver.prototype.error = function (e) { this._s.o.onError(e); };

  ZipIterableObserver.prototype.completed = function () {
    this._s.done[this._i] = true;
    this._s.done.every(identity) && this._s.o.onCompleted();
  };

  return ZipIterableObserver;
}(AbstractObserver));

/**
 * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences or an array have produced an element at a corresponding index.
 * The last element in the arguments must be a function to invoke for each series of elements at corresponding indexes in the args.
 * @returns {Observable} An observable sequence containing the result of combining elements of the args using the specified result selector function.
 */
observableProto.zipIterable = function () {
  if (arguments.length === 0) { throw new Error('invalid arguments'); }

  var len = arguments.length, args = new Array(len);
  for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
  var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;

  var parent = this;
  args.unshift(parent);
  return new ZipIterableObservable(args, resultSelector);
};

  function asObservable(source) {
    return function subscribe(o) { return source.subscribe(o); };
  }

  /**
   *  Hides the identity of an observable sequence.
   * @returns {Observable} An observable sequence that hides the identity of the source sequence.
   */
  observableProto.asObservable = function () {
    return new AnonymousObservable(asObservable(this), this);
  };

  var DematerializeObservable = (function (__super__) {
    inherits(DematerializeObservable, __super__);
    function DematerializeObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    DematerializeObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new DematerializeObserver(o));
    };

    return DematerializeObservable;
  }(ObservableBase));

  var DematerializeObserver = (function (__super__) {
    inherits(DematerializeObserver, __super__);

    function DematerializeObserver(o) {
      this._o = o;
      __super__.call(this);
    }

    DematerializeObserver.prototype.next = function (x) { x.accept(this._o); };
    DematerializeObserver.prototype.error = function (e) { this._o.onError(e); };
    DematerializeObserver.prototype.completed = function () { this._o.onCompleted(); };

    return DematerializeObserver;
  }(AbstractObserver));

  /**
   * Dematerializes the explicit notification values of an observable sequence as implicit notifications.
   * @returns {Observable} An observable sequence exhibiting the behavior corresponding to the source sequence's notification values.
   */
  observableProto.dematerialize = function () {
    return new DematerializeObservable(this);
  };

  var DistinctUntilChangedObservable = (function(__super__) {
    inherits(DistinctUntilChangedObservable, __super__);
    function DistinctUntilChangedObservable(source, keyFn, comparer) {
      this.source = source;
      this.keyFn = keyFn;
      this.comparer = comparer;
      __super__.call(this);
    }

    DistinctUntilChangedObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new DistinctUntilChangedObserver(o, this.keyFn, this.comparer));
    };

    return DistinctUntilChangedObservable;
  }(ObservableBase));

  var DistinctUntilChangedObserver = (function(__super__) {
    inherits(DistinctUntilChangedObserver, __super__);
    function DistinctUntilChangedObserver(o, keyFn, comparer) {
      this.o = o;
      this.keyFn = keyFn;
      this.comparer = comparer;
      this.hasCurrentKey = false;
      this.currentKey = null;
      __super__.call(this);
    }

    DistinctUntilChangedObserver.prototype.next = function (x) {
      var key = x, comparerEquals;
      if (isFunction(this.keyFn)) {
        key = tryCatch(this.keyFn)(x);
        if (key === errorObj) { return this.o.onError(key.e); }
      }
      if (this.hasCurrentKey) {
        comparerEquals = tryCatch(this.comparer)(this.currentKey, key);
        if (comparerEquals === errorObj) { return this.o.onError(comparerEquals.e); }
      }
      if (!this.hasCurrentKey || !comparerEquals) {
        this.hasCurrentKey = true;
        this.currentKey = key;
        this.o.onNext(x);
      }
    };
    DistinctUntilChangedObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    DistinctUntilChangedObserver.prototype.completed = function () {
      this.o.onCompleted();
    };

    return DistinctUntilChangedObserver;
  }(AbstractObserver));

  /**
  *  Returns an observable sequence that contains only distinct contiguous elements according to the keyFn and the comparer.
  * @param {Function} [keyFn] A function to compute the comparison key for each element. If not provided, it projects the value.
  * @param {Function} [comparer] Equality comparer for computed key values. If not provided, defaults to an equality comparer function.
  * @returns {Observable} An observable sequence only containing the distinct contiguous elements, based on a computed key value, from the source sequence.
  */
  observableProto.distinctUntilChanged = function (keyFn, comparer) {
    comparer || (comparer = defaultComparer);
    return new DistinctUntilChangedObservable(this, keyFn, comparer);
  };

  var TapObservable = (function(__super__) {
    inherits(TapObservable,__super__);
    function TapObservable(source, observerOrOnNext, onError, onCompleted) {
      this.source = source;
      this._oN = observerOrOnNext;
      this._oE = onError;
      this._oC = onCompleted;
      __super__.call(this);
    }

    TapObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this));
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, p) {
      this.o = o;
      this.t = !p._oN || isFunction(p._oN) ?
        observerCreate(p._oN || noop, p._oE || noop, p._oC || noop) :
        p._oN;
      this.isStopped = false;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      var res = tryCatch(this.t.onNext).call(this.t, x);
      if (res === errorObj) { this.o.onError(res.e); }
      this.o.onNext(x);
    };
    InnerObserver.prototype.error = function(err) {
      var res = tryCatch(this.t.onError).call(this.t, err);
      if (res === errorObj) { return this.o.onError(res.e); }
      this.o.onError(err);
    };
    InnerObserver.prototype.completed = function() {
      var res = tryCatch(this.t.onCompleted).call(this.t);
      if (res === errorObj) { return this.o.onError(res.e); }
      this.o.onCompleted();
    };

    return TapObservable;
  }(ObservableBase));

  /**
  *  Invokes an action for each element in the observable sequence and invokes an action upon graceful or exceptional termination of the observable sequence.
  *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
  * @param {Function | Observer} observerOrOnNext Action to invoke for each element in the observable sequence or an o.
  * @param {Function} [onError]  Action to invoke upon exceptional termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
  * @param {Function} [onCompleted]  Action to invoke upon graceful termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
  * @returns {Observable} The source sequence with the side-effecting behavior applied.
  */
  observableProto['do'] = observableProto.tap = observableProto.doAction = function (observerOrOnNext, onError, onCompleted) {
    return new TapObservable(this, observerOrOnNext, onError, onCompleted);
  };

  /**
  *  Invokes an action for each element in the observable sequence.
  *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
  * @param {Function} onNext Action to invoke for each element in the observable sequence.
  * @param {Any} [thisArg] Object to use as this when executing callback.
  * @returns {Observable} The source sequence with the side-effecting behavior applied.
  */
  observableProto.doOnNext = observableProto.tapOnNext = function (onNext, thisArg) {
    return this.tap(typeof thisArg !== 'undefined' ? function (x) { onNext.call(thisArg, x); } : onNext);
  };

  /**
  *  Invokes an action upon exceptional termination of the observable sequence.
  *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
  * @param {Function} onError Action to invoke upon exceptional termination of the observable sequence.
  * @param {Any} [thisArg] Object to use as this when executing callback.
  * @returns {Observable} The source sequence with the side-effecting behavior applied.
  */
  observableProto.doOnError = observableProto.tapOnError = function (onError, thisArg) {
    return this.tap(noop, typeof thisArg !== 'undefined' ? function (e) { onError.call(thisArg, e); } : onError);
  };

  /**
  *  Invokes an action upon graceful termination of the observable sequence.
  *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
  * @param {Function} onCompleted Action to invoke upon graceful termination of the observable sequence.
  * @param {Any} [thisArg] Object to use as this when executing callback.
  * @returns {Observable} The source sequence with the side-effecting behavior applied.
  */
  observableProto.doOnCompleted = observableProto.tapOnCompleted = function (onCompleted, thisArg) {
    return this.tap(noop, null, typeof thisArg !== 'undefined' ? function () { onCompleted.call(thisArg); } : onCompleted);
  };

  var FinallyObservable = (function (__super__) {
    inherits(FinallyObservable, __super__);
    function FinallyObservable(source, fn, thisArg) {
      this.source = source;
      this._fn = bindCallback(fn, thisArg, 0);
      __super__.call(this);
    }

    FinallyObservable.prototype.subscribeCore = function (o) {
      var d = tryCatch(this.source.subscribe).call(this.source, o);
      if (d === errorObj) {
        this._fn();
        thrower(d.e);
      }

      return new FinallyDisposable(d, this._fn);
    };

    function FinallyDisposable(s, fn) {
      this.isDisposed = false;
      this._s = s;
      this._fn = fn;
    }
    FinallyDisposable.prototype.dispose = function () {
      if (!this.isDisposed) {
        var res = tryCatch(this._s.dispose).call(this._s);
        this._fn();
        res === errorObj && thrower(res.e);
      }
    };

    return FinallyObservable;

  }(ObservableBase));

  /**
   *  Invokes a specified action after the source observable sequence terminates gracefully or exceptionally.
   * @param {Function} finallyAction Action to invoke after the source observable sequence terminates.
   * @returns {Observable} Source sequence with the action-invoking termination behavior applied.
   */
  observableProto['finally'] = function (action, thisArg) {
    return new FinallyObservable(this, action, thisArg);
  };

  var IgnoreElementsObservable = (function(__super__) {
    inherits(IgnoreElementsObservable, __super__);

    function IgnoreElementsObservable(source) {
      this.source = source;
      __super__.call(this);
    }

    IgnoreElementsObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new InnerObserver(o));
    };

    function InnerObserver(o) {
      this.o = o;
      this.isStopped = false;
    }
    InnerObserver.prototype.onNext = noop;
    InnerObserver.prototype.onError = function (err) {
      if(!this.isStopped) {
        this.isStopped = true;
        this.o.onError(err);
      }
    };
    InnerObserver.prototype.onCompleted = function () {
      if(!this.isStopped) {
        this.isStopped = true;
        this.o.onCompleted();
      }
    };
    InnerObserver.prototype.dispose = function() { this.isStopped = true; };
    InnerObserver.prototype.fail = function (e) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.observer.onError(e);
        return true;
      }

      return false;
    };

    return IgnoreElementsObservable;
  }(ObservableBase));

  /**
   *  Ignores all elements in an observable sequence leaving only the termination messages.
   * @returns {Observable} An empty observable sequence that signals termination, successful or exceptional, of the source sequence.
   */
  observableProto.ignoreElements = function () {
    return new IgnoreElementsObservable(this);
  };

  var MaterializeObservable = (function (__super__) {
    inherits(MaterializeObservable, __super__);
    function MaterializeObservable(source, fn) {
      this.source = source;
      __super__.call(this);
    }

    MaterializeObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new MaterializeObserver(o));
    };

    return MaterializeObservable;
  }(ObservableBase));

  var MaterializeObserver = (function (__super__) {
    inherits(MaterializeObserver, __super__);

    function MaterializeObserver(o) {
      this._o = o;
      __super__.call(this);
    }

    MaterializeObserver.prototype.next = function (x) { this._o.onNext(notificationCreateOnNext(x)) };
    MaterializeObserver.prototype.error = function (e) { this._o.onNext(notificationCreateOnError(e)); this._o.onCompleted(); };
    MaterializeObserver.prototype.completed = function () { this._o.onNext(notificationCreateOnCompleted()); this._o.onCompleted(); };

    return MaterializeObserver;
  }(AbstractObserver));

  /**
   *  Materializes the implicit notifications of an observable sequence as explicit notification values.
   * @returns {Observable} An observable sequence containing the materialized notification values from the source sequence.
   */
  observableProto.materialize = function () {
    return new MaterializeObservable(this);
  };

  /**
   *  Repeats the observable sequence a specified number of times. If the repeat count is not specified, the sequence repeats indefinitely.
   * @param {Number} [repeatCount]  Number of times to repeat the sequence. If not provided, repeats the sequence indefinitely.
   * @returns {Observable} The observable sequence producing the elements of the given sequence repeatedly.
   */
  observableProto.repeat = function (repeatCount) {
    return enumerableRepeat(this, repeatCount).concat();
  };

  /**
   *  Repeats the source observable sequence the specified number of times or until it successfully terminates. If the retry count is not specified, it retries indefinitely.
   *  Note if you encounter an error and want it to retry once, then you must use .retry(2);
   *
   * @example
   *  var res = retried = retry.repeat();
   *  var res = retried = retry.repeat(2);
   * @param {Number} [retryCount]  Number of times to retry the sequence. If not provided, retry the sequence indefinitely.
   * @returns {Observable} An observable sequence producing the elements of the given sequence repeatedly until it terminates successfully.
   */
  observableProto.retry = function (retryCount) {
    return enumerableRepeat(this, retryCount).catchError();
  };

  /**
   *  Repeats the source observable sequence upon error each time the notifier emits or until it successfully terminates. 
   *  if the notifier completes, the observable sequence completes.
   *
   * @example
   *  var timer = Observable.timer(500);
   *  var source = observable.retryWhen(timer);
   * @param {Observable} [notifier] An observable that triggers the retries or completes the observable with onNext or onCompleted respectively.
   * @returns {Observable} An observable sequence producing the elements of the given sequence repeatedly until it terminates successfully.
   */
  observableProto.retryWhen = function (notifier) {
    return enumerableRepeat(this).catchErrorWhen(notifier);
  };
  var ScanObservable = (function(__super__) {
    inherits(ScanObservable, __super__);
    function ScanObservable(source, accumulator, hasSeed, seed) {
      this.source = source;
      this.accumulator = accumulator;
      this.hasSeed = hasSeed;
      this.seed = seed;
      __super__.call(this);
    }

    ScanObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new ScanObserver(o,this));
    };

    return ScanObservable;
  }(ObservableBase));

  var ScanObserver = (function (__super__) {
    inherits(ScanObserver, __super__);
    function ScanObserver(o, parent) {
      this._o = o;
      this._p = parent;
      this._fn = parent.accumulator;
      this._hs = parent.hasSeed;
      this._s = parent.seed;
      this._ha = false;
      this._a = null;
      this._hv = false;
      this._i = 0;
      __super__.call(this);
    }

    ScanObserver.prototype.next = function (x) {
      !this._hv && (this._hv = true);
      if (this._ha) {
        this._a = tryCatch(this._fn)(this._a, x, this._i, this._p);
      } else {
        this._a = this._hs ? tryCatch(this._fn)(this._s, x, this._i, this._p) : x;
        this._ha = true;
      }
      if (this._a === errorObj) { return this._o.onError(this._a.e); }
      this._o.onNext(this._a);
      this._i++;
    };

    ScanObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    ScanObserver.prototype.completed = function () {
      !this._hv && this._hs && this._o.onNext(this._s);
      this._o.onCompleted();
    };

    return ScanObserver;
  }(AbstractObserver));

  /**
  *  Applies an accumulator function over an observable sequence and returns each intermediate result. The optional seed value is used as the initial accumulator value.
  *  For aggregation behavior with no intermediate results, see Observable.aggregate.
  * @param {Mixed} [seed] The initial accumulator value.
  * @param {Function} accumulator An accumulator function to be invoked on each element.
  * @returns {Observable} An observable sequence containing the accumulated values.
  */
  observableProto.scan = function () {
    var hasSeed = false, seed, accumulator = arguments[0];
    if (arguments.length === 2) {
      hasSeed = true;
      seed = arguments[1];
    }
    return new ScanObservable(this, accumulator, hasSeed, seed);
  };

  var SkipLastObservable = (function (__super__) {
    inherits(SkipLastObservable, __super__);
    function SkipLastObservable(source, c) {
      this.source = source;
      this._c = c;
      __super__.call(this);
    }

    SkipLastObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new SkipLastObserver(o, this._c));
    };

    return SkipLastObservable;
  }(ObservableBase));

  var SkipLastObserver = (function (__super__) {
    inherits(SkipLastObserver, __super__);
    function SkipLastObserver(o, c) {
      this._o = o;
      this._c = c;
      this._q = [];
      __super__.call(this);
    }

    SkipLastObserver.prototype.next = function (x) {
      this._q.push(x);
      this._q.length > this._c && this._o.onNext(this._q.shift());
    };

    SkipLastObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    SkipLastObserver.prototype.completed = function () {
      this._o.onCompleted();
    };

    return SkipLastObserver;
  }(AbstractObserver));

  /**
   *  Bypasses a specified number of elements at the end of an observable sequence.
   * @description
   *  This operator accumulates a queue with a length enough to store the first `count` elements. As more elements are
   *  received, elements are taken from the front of the queue and produced on the result sequence. This causes elements to be delayed.
   * @param count Number of elements to bypass at the end of the source sequence.
   * @returns {Observable} An observable sequence containing the source sequence elements except for the bypassed ones at the end.
   */
  observableProto.skipLast = function (count) {
    if (count < 0) { throw new ArgumentOutOfRangeError(); }
    return new SkipLastObservable(this, count);
  };

  /**
   *  Prepends a sequence of values to an observable sequence with an optional scheduler and an argument list of values to prepend.
   *  @example
   *  var res = source.startWith(1, 2, 3);
   *  var res = source.startWith(Rx.Scheduler.timeout, 1, 2, 3);
   * @param {Arguments} args The specified values to prepend to the observable sequence
   * @returns {Observable} The source sequence prepended with the specified values.
   */
  observableProto.startWith = function () {
    var values, scheduler, start = 0;
    if (!!arguments.length && isScheduler(arguments[0])) {
      scheduler = arguments[0];
      start = 1;
    } else {
      scheduler = immediateScheduler;
    }
    for(var args = [], i = start, len = arguments.length; i < len; i++) { args.push(arguments[i]); }
    return enumerableOf([observableFromArray(args, scheduler), this]).concat();
  };

  var TakeLastObserver = (function (__super__) {
    inherits(TakeLastObserver, __super__);
    function TakeLastObserver(o, c) {
      this._o = o;
      this._c = c;
      this._q = [];
      __super__.call(this);
    }

    TakeLastObserver.prototype.next = function (x) {
      this._q.push(x);
      this._q.length > this._c && this._q.shift();
    };

    TakeLastObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    TakeLastObserver.prototype.completed = function () {
      while (this._q.length > 0) { this._o.onNext(this._q.shift()); }
      this._o.onCompleted();
    };

    return TakeLastObserver;
  }(AbstractObserver));

  /**
   *  Returns a specified number of contiguous elements from the end of an observable sequence.
   * @description
   *  This operator accumulates a buffer with a length enough to store elements count elements. Upon completion of
   *  the source sequence, this buffer is drained on the result sequence. This causes the elements to be delayed.
   * @param {Number} count Number of elements to take from the end of the source sequence.
   * @returns {Observable} An observable sequence containing the specified number of elements from the end of the source sequence.
   */
  observableProto.takeLast = function (count) {
    if (count < 0) { throw new ArgumentOutOfRangeError(); }
    var source = this;
    return new AnonymousObservable(function (o) {
      return source.subscribe(new TakeLastObserver(o, count));
    }, source);
  };

observableProto.flatMapConcat = observableProto.concatMap = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).merge(1);
};
  var MapObservable = (function (__super__) {
    inherits(MapObservable, __super__);

    function MapObservable(source, selector, thisArg) {
      this.source = source;
      this.selector = bindCallback(selector, thisArg, 3);
      __super__.call(this);
    }

    function innerMap(selector, self) {
      return function (x, i, o) { return selector.call(this, self.selector(x, i, o), i, o); };
    }

    MapObservable.prototype.internalMap = function (selector, thisArg) {
      return new MapObservable(this.source, innerMap(selector, this), thisArg);
    };

    MapObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new InnerObserver(o, this.selector, this));
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, selector, source) {
      this.o = o;
      this.selector = selector;
      this.source = source;
      this.i = 0;
      AbstractObserver.call(this);
    }

    InnerObserver.prototype.next = function(x) {
      var result = tryCatch(this.selector)(x, this.i++, this.source);
      if (result === errorObj) { return this.o.onError(result.e); }
      this.o.onNext(result);
    };

    InnerObserver.prototype.error = function (e) {
      this.o.onError(e);
    };

    InnerObserver.prototype.completed = function () {
      this.o.onCompleted();
    };

    return MapObservable;

  }(ObservableBase));

  /**
  * Projects each element of an observable sequence into a new form by incorporating the element's index.
  * @param {Function} selector A transform function to apply to each source element; the second parameter of the function represents the index of the source element.
  * @param {Any} [thisArg] Object to use as this when executing callback.
  * @returns {Observable} An observable sequence whose elements are the result of invoking the transform function on each element of source.
  */
  observableProto.map = observableProto.select = function (selector, thisArg) {
    var selectorFn = typeof selector === 'function' ? selector : function () { return selector; };
    return this instanceof MapObservable ?
      this.internalMap(selectorFn, thisArg) :
      new MapObservable(this, selectorFn, thisArg);
  };

  function plucker(args, len) {
    return function mapper(x) {
      var currentProp = x;
      for (var i = 0; i < len; i++) {
        var p = currentProp[args[i]];
        if (typeof p !== 'undefined') {
          currentProp = p;
        } else {
          return undefined;
        }
      }
      return currentProp;
    }
  }

  /**
   * Retrieves the value of a specified nested property from all elements in
   * the Observable sequence.
   * @param {Arguments} arguments The nested properties to pluck.
   * @returns {Observable} Returns a new Observable sequence of property values.
   */
  observableProto.pluck = function () {
    var len = arguments.length, args = new Array(len);
    if (len === 0) { throw new Error('List of properties cannot be empty.'); }
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return this.map(plucker(args, len));
  };

observableProto.flatMap = observableProto.selectMany = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).mergeAll();
};

Rx.Observable.prototype.flatMapLatest = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).switchLatest();
};
  var SkipObservable = (function(__super__) {
    inherits(SkipObservable, __super__);
    function SkipObservable(source, count) {
      this.source = source;
      this._count = count;
      __super__.call(this);
    }

    SkipObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new SkipObserver(o, this._count));
    };

    function SkipObserver(o, c) {
      this._o = o;
      this._r = c;
      AbstractObserver.call(this);
    }

    inherits(SkipObserver, AbstractObserver);

    SkipObserver.prototype.next = function (x) {
      if (this._r <= 0) {
        this._o.onNext(x);
      } else {
        this._r--;
      }
    };
    SkipObserver.prototype.error = function(e) { this._o.onError(e); };
    SkipObserver.prototype.completed = function() { this._o.onCompleted(); };

    return SkipObservable;
  }(ObservableBase));

  /**
   * Bypasses a specified number of elements in an observable sequence and then returns the remaining elements.
   * @param {Number} count The number of elements to skip before returning the remaining elements.
   * @returns {Observable} An observable sequence that contains the elements that occur after the specified index in the input sequence.
   */
  observableProto.skip = function (count) {
    if (count < 0) { throw new ArgumentOutOfRangeError(); }
    return new SkipObservable(this, count);
  };

  var SkipWhileObservable = (function (__super__) {
    inherits(SkipWhileObservable, __super__);
    function SkipWhileObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }

    SkipWhileObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new SkipWhileObserver(o, this));
    };

    return SkipWhileObservable;
  }(ObservableBase));

  var SkipWhileObserver = (function (__super__) {
    inherits(SkipWhileObserver, __super__);

    function SkipWhileObserver(o, p) {
      this._o = o;
      this._p = p;
      this._i = 0;
      this._r = false;
      __super__.call(this);
    }

    SkipWhileObserver.prototype.next = function (x) {
      if (!this._r) {
        var res = tryCatch(this._p._fn)(x, this._i++, this._p);
        if (res === errorObj) { return this._o.onError(res.e); }
        this._r = !res;
      }
      this._r && this._o.onNext(x);
    };
    SkipWhileObserver.prototype.error = function (e) { this._o.onError(e); };
    SkipWhileObserver.prototype.completed = function () { this._o.onCompleted(); };

    return SkipWhileObserver;
  }(AbstractObserver));

  /**
   *  Bypasses elements in an observable sequence as long as a specified condition is true and then returns the remaining elements.
   *  The element's index is used in the logic of the predicate function.
   *
   *  var res = source.skipWhile(function (value) { return value < 10; });
   *  var res = source.skipWhile(function (value, index) { return value < 10 || index < 10; });
   * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
   * @param {Any} [thisArg] Object to use as this when executing callback.
   * @returns {Observable} An observable sequence that contains the elements from the input sequence starting at the first element in the linear series that does not pass the test specified by predicate.
   */
  observableProto.skipWhile = function (predicate, thisArg) {
    var fn = bindCallback(predicate, thisArg, 3);
    return new SkipWhileObservable(this, fn);
  };

  var TakeObservable = (function(__super__) {
    inherits(TakeObservable, __super__);
    function TakeObservable(source, count) {
      this.source = source;
      this._count = count;
      __super__.call(this);
    }

    TakeObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new TakeObserver(o, this._count));
    };

    function TakeObserver(o, c) {
      this._o = o;
      this._c = c;
      this._r = c;
      AbstractObserver.call(this);
    }

    inherits(TakeObserver, AbstractObserver);

    TakeObserver.prototype.next = function (x) {
      if (this._r-- > 0) {
        this._o.onNext(x);
        this._r <= 0 && this._o.onCompleted();
      }
    };

    TakeObserver.prototype.error = function (e) { this._o.onError(e); };
    TakeObserver.prototype.completed = function () { this._o.onCompleted(); };

    return TakeObservable;
  }(ObservableBase));

  /**
   *  Returns a specified number of contiguous elements from the start of an observable sequence, using the specified scheduler for the edge case of take(0).
   * @param {Number} count The number of elements to return.
   * @param {Scheduler} [scheduler] Scheduler used to produce an OnCompleted message in case <paramref name="count count</paramref> is set to 0.
   * @returns {Observable} An observable sequence that contains the specified number of elements from the start of the input sequence.
   */
  observableProto.take = function (count, scheduler) {
    if (count < 0) { throw new ArgumentOutOfRangeError(); }
    if (count === 0) { return observableEmpty(scheduler); }
    return new TakeObservable(this, count);
  };

  var TakeWhileObservable = (function (__super__) {
    inherits(TakeWhileObservable, __super__);
    function TakeWhileObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }

    TakeWhileObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new TakeWhileObserver(o, this));
    };

    return TakeWhileObservable;
  }(ObservableBase));

  var TakeWhileObserver = (function (__super__) {
    inherits(TakeWhileObserver, __super__);

    function TakeWhileObserver(o, p) {
      this._o = o;
      this._p = p;
      this._i = 0;
      this._r = true;
      __super__.call(this);
    }

    TakeWhileObserver.prototype.next = function (x) {
      if (this._r) {
        this._r = tryCatch(this._p._fn)(x, this._i++, this._p);
        if (this._r === errorObj) { return this._o.onError(this._r.e); }
      }
      if (this._r) {
        this._o.onNext(x);
      } else {
        this._o.onCompleted();
      }
    };
    TakeWhileObserver.prototype.error = function (e) { this._o.onError(e); };
    TakeWhileObserver.prototype.completed = function () { this._o.onCompleted(); };

    return TakeWhileObserver;
  }(AbstractObserver));

  /**
   *  Returns elements from an observable sequence as long as a specified condition is true.
   *  The element's index is used in the logic of the predicate function.
   * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
   * @param {Any} [thisArg] Object to use as this when executing callback.
   * @returns {Observable} An observable sequence that contains the elements from the input sequence that occur before the element at which the test no longer passes.
   */
  observableProto.takeWhile = function (predicate, thisArg) {
    var fn = bindCallback(predicate, thisArg, 3);
    return new TakeWhileObservable(this, fn);
  };

  var FilterObservable = (function (__super__) {
    inherits(FilterObservable, __super__);

    function FilterObservable(source, predicate, thisArg) {
      this.source = source;
      this.predicate = bindCallback(predicate, thisArg, 3);
      __super__.call(this);
    }

    FilterObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new InnerObserver(o, this.predicate, this));
    };

    function innerPredicate(predicate, self) {
      return function(x, i, o) { return self.predicate(x, i, o) && predicate.call(this, x, i, o); }
    }

    FilterObservable.prototype.internalFilter = function(predicate, thisArg) {
      return new FilterObservable(this.source, innerPredicate(predicate, this), thisArg);
    };

    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, predicate, source) {
      this.o = o;
      this.predicate = predicate;
      this.source = source;
      this.i = 0;
      AbstractObserver.call(this);
    }

    InnerObserver.prototype.next = function(x) {
      var shouldYield = tryCatch(this.predicate)(x, this.i++, this.source);
      if (shouldYield === errorObj) {
        return this.o.onError(shouldYield.e);
      }
      shouldYield && this.o.onNext(x);
    };

    InnerObserver.prototype.error = function (e) {
      this.o.onError(e);
    };

    InnerObserver.prototype.completed = function () {
      this.o.onCompleted();
    };

    return FilterObservable;

  }(ObservableBase));

  /**
  *  Filters the elements of an observable sequence based on a predicate by incorporating the element's index.
  * @param {Function} predicate A function to test each source element for a condition; the second parameter of the function represents the index of the source element.
  * @param {Any} [thisArg] Object to use as this when executing callback.
  * @returns {Observable} An observable sequence that contains elements from the input sequence that satisfy the condition.
  */
  observableProto.filter = observableProto.where = function (predicate, thisArg) {
    return this instanceof FilterObservable ? this.internalFilter(predicate, thisArg) :
      new FilterObservable(this, predicate, thisArg);
  };

function createCbObservable(fn, ctx, selector, args) {
  var o = new AsyncSubject();

  args.push(createCbHandler(o, ctx, selector));
  fn.apply(ctx, args);

  return o.asObservable();
}

function createCbHandler(o, ctx, selector) {
  return function handler () {
    var len = arguments.length, results = new Array(len);
    for(var i = 0; i < len; i++) { results[i] = arguments[i]; }

    if (isFunction(selector)) {
      results = tryCatch(selector).apply(ctx, results);
      if (results === errorObj) { return o.onError(results.e); }
      o.onNext(results);
    } else {
      if (results.length <= 1) {
        o.onNext(results[0]);
      } else {
        o.onNext(results);
      }
    }

    o.onCompleted();
  };
}

/**
 * Converts a callback function to an observable sequence.
 *
 * @param {Function} fn Function with a callback as the last parameter to convert to an Observable sequence.
 * @param {Mixed} [ctx] The context for the func parameter to be executed.  If not specified, defaults to undefined.
 * @param {Function} [selector] A selector which takes the arguments from the callback to produce a single item to yield on next.
 * @returns {Function} A function, when executed with the required parameters minus the callback, produces an Observable sequence with a single value of the arguments to the callback as an array.
 */
Observable.fromCallback = function (fn, ctx, selector) {
  return function () {
    typeof ctx === 'undefined' && (ctx = this); 

    var len = arguments.length, args = new Array(len)
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return createCbObservable(fn, ctx, selector, args);
  };
};

function createNodeObservable(fn, ctx, selector, args) {
  var o = new AsyncSubject();

  args.push(createNodeHandler(o, ctx, selector));
  fn.apply(ctx, args);

  return o.asObservable();
}

function createNodeHandler(o, ctx, selector) {
  return function handler () {
    var err = arguments[0];
    if (err) { return o.onError(err); }

    var len = arguments.length, results = [];
    for(var i = 1; i < len; i++) { results[i - 1] = arguments[i]; }

    if (isFunction(selector)) {
      var results = tryCatch(selector).apply(ctx, results);
      if (results === errorObj) { return o.onError(results.e); }
      o.onNext(results);
    } else {
      if (results.length <= 1) {
        o.onNext(results[0]);
      } else {
        o.onNext(results);
      }
    }

    o.onCompleted();
  };
}

/**
 * Converts a Node.js callback style function to an observable sequence.  This must be in function (err, ...) format.
 * @param {Function} fn The function to call
 * @param {Mixed} [ctx] The context for the func parameter to be executed.  If not specified, defaults to undefined.
 * @param {Function} [selector] A selector which takes the arguments from the callback minus the error to produce a single item to yield on next.
 * @returns {Function} An async function which when applied, returns an observable sequence with the callback arguments as an array.
 */
Observable.fromNodeCallback = function (fn, ctx, selector) {
  return function () {
    typeof ctx === 'undefined' && (ctx = this); 
    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return createNodeObservable(fn, ctx, selector, args);
  };
};

  function isNodeList(el) {
    if (root.StaticNodeList) {
      // IE8 Specific
      // instanceof is slower than Object#toString, but Object#toString will not work as intended in IE8
      return el instanceof root.StaticNodeList || el instanceof root.NodeList;
    } else {
      return Object.prototype.toString.call(el) === '[object NodeList]';
    }
  }

  function ListenDisposable(e, n, fn) {
    this._e = e;
    this._n = n;
    this._fn = fn;
    this._e.addEventListener(this._n, this._fn, false);
    this.isDisposed = false;
  }
  ListenDisposable.prototype.dispose = function () {
    if (!this.isDisposed) {
      this._e.removeEventListener(this._n, this._fn, false);
      this.isDisposed = true;
    }
  };

  function createEventListener (el, eventName, handler) {
    var disposables = new CompositeDisposable();

    // Asume NodeList or HTMLCollection
    var elemToString = Object.prototype.toString.call(el);
    if (isNodeList(el) || elemToString === '[object HTMLCollection]') {
      for (var i = 0, len = el.length; i < len; i++) {
        disposables.add(createEventListener(el.item(i), eventName, handler));
      }
    } else if (el) {
      disposables.add(new ListenDisposable(el, eventName, handler));
    }

    return disposables;
  }

  /**
   * Configuration option to determine whether to use native events only
   */
  Rx.config.useNativeEvents = false;

  var EventObservable = (function(__super__) {
    inherits(EventObservable, __super__);
    function EventObservable(el, name, fn) {
      this._el = el;
      this._n = name;
      this._fn = fn;
      __super__.call(this);
    }

    function createHandler(o, fn) {
      return function handler () {
        var results = arguments[0];
        if (isFunction(fn)) {
          results = tryCatch(fn).apply(null, arguments);
          if (results === errorObj) { return o.onError(results.e); }
        }
        o.onNext(results);
      };
    }

    EventObservable.prototype.subscribeCore = function (o) {
      return createEventListener(
        this._el,
        this._n,
        createHandler(o, this._fn));
    };

    return EventObservable;
  }(ObservableBase));

  /**
   * Creates an observable sequence by adding an event listener to the matching DOMElement or each item in the NodeList.
   * @param {Object} element The DOMElement or NodeList to attach a listener.
   * @param {String} eventName The event name to attach the observable sequence.
   * @param {Function} [selector] A selector which takes the arguments from the event handler to produce a single item to yield on next.
   * @returns {Observable} An observable sequence of events from the specified element and the specified event.
   */
  Observable.fromEvent = function (element, eventName, selector) {
    // Node.js specific
    if (element.addListener) {
      return fromEventPattern(
        function (h) { element.addListener(eventName, h); },
        function (h) { element.removeListener(eventName, h); },
        selector);
    }

    // Use only if non-native events are allowed
    if (!Rx.config.useNativeEvents) {
      // Handles jq, Angular.js, Zepto, Marionette, Ember.js
      if (typeof element.on === 'function' && typeof element.off === 'function') {
        return fromEventPattern(
          function (h) { element.on(eventName, h); },
          function (h) { element.off(eventName, h); },
          selector);
      }
    }

    return new EventObservable(element, eventName, selector).publish().refCount();
  };

  var EventPatternObservable = (function(__super__) {
    inherits(EventPatternObservable, __super__);
    function EventPatternObservable(add, del, fn) {
      this._add = add;
      this._del = del;
      this._fn = fn;
      __super__.call(this);
    }

    function createHandler(o, fn) {
      return function handler () {
        var results = arguments[0];
        if (isFunction(fn)) {
          results = tryCatch(fn).apply(null, arguments);
          if (results === errorObj) { return o.onError(results.e); }
        }
        o.onNext(results);
      };
    }

    EventPatternObservable.prototype.subscribeCore = function (o) {
      var fn = createHandler(o, this._fn);
      var returnValue = this._add(fn);
      return new EventPatternDisposable(this._del, fn, returnValue);
    };

    function EventPatternDisposable(del, fn, ret) {
      this._del = del;
      this._fn = fn;
      this._ret = ret;
      this.isDisposed = false;
    }

    EventPatternDisposable.prototype.dispose = function () {
      if(!this.isDisposed) {
        isFunction(this._del) && this._del(this._fn, this._ret);
      }
    };

    return EventPatternObservable;
  }(ObservableBase));

  /**
   * Creates an observable sequence from an event emitter via an addHandler/removeHandler pair.
   * @param {Function} addHandler The function to add a handler to the emitter.
   * @param {Function} [removeHandler] The optional function to remove a handler from an emitter.
   * @param {Function} [selector] A selector which takes the arguments from the event handler to produce a single item to yield on next.
   * @returns {Observable} An observable sequence which wraps an event from an event emitter
   */
  var fromEventPattern = Observable.fromEventPattern = function (addHandler, removeHandler, selector) {
    return new EventPatternObservable(addHandler, removeHandler, selector).publish().refCount();
  };

  var FromPromiseObservable = (function(__super__) {
    inherits(FromPromiseObservable, __super__);
    function FromPromiseObservable(p, s) {
      this._p = p;
      this._s = s;
      __super__.call(this);
    }

    function scheduleNext(s, state) {
      var o = state[0], data = state[1];
      o.onNext(data);
      o.onCompleted();
    }

    function scheduleError(s, state) {
      var o = state[0], err = state[1];
      o.onError(err);
    }

    FromPromiseObservable.prototype.subscribeCore = function(o) {
      var sad = new SingleAssignmentDisposable(), self = this;

      this._p
        .then(function (data) {
          sad.setDisposable(self._s.schedule([o, data], scheduleNext));
        }, function (err) {
          sad.setDisposable(self._s.schedule([o, err], scheduleError));
        });

      return sad;
    };

    return FromPromiseObservable;
  }(ObservableBase));

  /**
  * Converts a Promise to an Observable sequence
  * @param {Promise} An ES6 Compliant promise.
  * @returns {Observable} An Observable sequence which wraps the existing promise success and failure.
  */
  var observableFromPromise = Observable.fromPromise = function (promise, scheduler) {
    scheduler || (scheduler = defaultScheduler);
    return new FromPromiseObservable(promise, scheduler);
  };

  /*
   * Converts an existing observable sequence to an ES6 Compatible Promise
   * @example
   * var promise = Rx.Observable.return(42).toPromise(RSVP.Promise);
   *
   * // With config
   * Rx.config.Promise = RSVP.Promise;
   * var promise = Rx.Observable.return(42).toPromise();
   * @param {Function} [promiseCtor] The constructor of the promise. If not provided, it looks for it in Rx.config.Promise.
   * @returns {Promise} An ES6 compatible promise with the last value from the observable sequence.
   */
  observableProto.toPromise = function (promiseCtor) {
    promiseCtor || (promiseCtor = Rx.config.Promise);
    if (!promiseCtor) { throw new NotSupportedError('Promise type not provided nor in Rx.config.Promise'); }
    var source = this;
    return new promiseCtor(function (resolve, reject) {
      // No cancellation can be done
      var value;
      source.subscribe(function (v) {
        value = v;
      }, reject, function () {
        resolve(value);
      });
    });
  };

  /**
   * Invokes the asynchronous function, surfacing the result through an observable sequence.
   * @param {Function} functionAsync Asynchronous function which returns a Promise to run.
   * @returns {Observable} An observable sequence exposing the function's result value, or an exception.
   */
  Observable.startAsync = function (functionAsync) {
    var promise = tryCatch(functionAsync)();
    if (promise === errorObj) { return observableThrow(promise.e); }
    return observableFromPromise(promise);
  };

  var MulticastObservable = (function (__super__) {
    inherits(MulticastObservable, __super__);
    function MulticastObservable(source, fn1, fn2) {
      this.source = source;
      this._fn1 = fn1;
      this._fn2 = fn2;
      __super__.call(this);
    }

    MulticastObservable.prototype.subscribeCore = function (o) {
      var connectable = this.source.multicast(this._fn1());
      return new BinaryDisposable(this._fn2(connectable).subscribe(o), connectable.connect());
    };

    return MulticastObservable;
  }(ObservableBase));

  /**
   * Multicasts the source sequence notifications through an instantiated subject into all uses of the sequence within a selector function. Each
   * subscription to the resulting sequence causes a separate multicast invocation, exposing the sequence resulting from the selector function's
   * invocation. For specializations with fixed subject types, see Publish, PublishLast, and Replay.
   *
   * @example
   * 1 - res = source.multicast(observable);
   * 2 - res = source.multicast(function () { return new Subject(); }, function (x) { return x; });
   *
   * @param {Function|Subject} subjectOrSubjectSelector
   * Factory function to create an intermediate subject through which the source sequence's elements will be multicast to the selector function.
   * Or:
   * Subject to push source elements into.
   *
   * @param {Function} [selector] Optional selector function which can use the multicasted source sequence subject to the policies enforced by the created subject. Specified only if <paramref name="subjectOrSubjectSelector" is a factory function.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
   */
  observableProto.multicast = function (subjectOrSubjectSelector, selector) {
    return isFunction(subjectOrSubjectSelector) ?
      new MulticastObservable(this, subjectOrSubjectSelector, selector) :
      new ConnectableObservable(this, subjectOrSubjectSelector);
  };

  /**
   * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence.
   * This operator is a specialization of Multicast using a regular Subject.
   *
   * @example
   * var resres = source.publish();
   * var res = source.publish(function (x) { return x; });
   *
   * @param {Function} [selector] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all notifications of the source from the time of the subscription on.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
   */
  observableProto.publish = function (selector) {
    return selector && isFunction(selector) ?
      this.multicast(function () { return new Subject(); }, selector) :
      this.multicast(new Subject());
  };

  /**
   * Returns an observable sequence that shares a single subscription to the underlying sequence.
   * This operator is a specialization of publish which creates a subscription when the number of observers goes from zero to one, then shares that subscription with all subsequent observers until the number of observers returns to zero, at which point the subscription is disposed.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence.
   */
  observableProto.share = function () {
    return this.publish().refCount();
  };

  /**
   * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence containing only the last notification.
   * This operator is a specialization of Multicast using a AsyncSubject.
   *
   * @example
   * var res = source.publishLast();
   * var res = source.publishLast(function (x) { return x; });
   *
   * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will only receive the last notification of the source.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
   */
  observableProto.publishLast = function (selector) {
    return selector && isFunction(selector) ?
      this.multicast(function () { return new AsyncSubject(); }, selector) :
      this.multicast(new AsyncSubject());
  };

  /**
   * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence and starts with initialValue.
   * This operator is a specialization of Multicast using a BehaviorSubject.
   *
   * @example
   * var res = source.publishValue(42);
   * var res = source.publishValue(function (x) { return x.select(function (y) { return y * y; }) }, 42);
   *
   * @param {Function} [selector] Optional selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive immediately receive the initial value, followed by all notifications of the source from the time of the subscription on.
   * @param {Mixed} initialValue Initial value received by observers upon subscription.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
   */
  observableProto.publishValue = function (initialValueOrSelector, initialValue) {
    return arguments.length === 2 ?
      this.multicast(function () {
        return new BehaviorSubject(initialValue);
      }, initialValueOrSelector) :
      this.multicast(new BehaviorSubject(initialValueOrSelector));
  };

  /**
   * Returns an observable sequence that shares a single subscription to the underlying sequence and starts with an initialValue.
   * This operator is a specialization of publishValue which creates a subscription when the number of observers goes from zero to one, then shares that subscription with all subsequent observers until the number of observers returns to zero, at which point the subscription is disposed.
   * @param {Mixed} initialValue Initial value received by observers upon subscription.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence.
   */
  observableProto.shareValue = function (initialValue) {
    return this.publishValue(initialValue).refCount();
  };

  /**
   * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence replaying notifications subject to a maximum time length for the replay buffer.
   * This operator is a specialization of Multicast using a ReplaySubject.
   *
   * @example
   * var res = source.replay(null, 3);
   * var res = source.replay(null, 3, 500);
   * var res = source.replay(null, 3, 500, scheduler);
   * var res = source.replay(function (x) { return x.take(6).repeat(); }, 3, 500, scheduler);
   *
   * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all the notifications of the source subject to the specified replay buffer trimming policy.
   * @param bufferSize [Optional] Maximum element count of the replay buffer.
   * @param windowSize [Optional] Maximum time length of the replay buffer.
   * @param scheduler [Optional] Scheduler where connected observers within the selector function will be invoked on.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
   */
  observableProto.replay = function (selector, bufferSize, windowSize, scheduler) {
    return selector && isFunction(selector) ?
      this.multicast(function () { return new ReplaySubject(bufferSize, windowSize, scheduler); }, selector) :
      this.multicast(new ReplaySubject(bufferSize, windowSize, scheduler));
  };

  /**
   * Returns an observable sequence that shares a single subscription to the underlying sequence replaying notifications subject to a maximum time length for the replay buffer.
   * This operator is a specialization of replay which creates a subscription when the number of observers goes from zero to one, then shares that subscription with all subsequent observers until the number of observers returns to zero, at which point the subscription is disposed.
   *
   * @example
   * var res = source.shareReplay(3);
   * var res = source.shareReplay(3, 500);
   * var res = source.shareReplay(3, 500, scheduler);
   *

   * @param bufferSize [Optional] Maximum element count of the replay buffer.
   * @param window [Optional] Maximum time length of the replay buffer.
   * @param scheduler [Optional] Scheduler where connected observers within the selector function will be invoked on.
   * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence.
   */
  observableProto.shareReplay = function (bufferSize, windowSize, scheduler) {
    return this.replay(null, bufferSize, windowSize, scheduler).refCount();
  };

  var RefCountObservable = (function (__super__) {
    inherits(RefCountObservable, __super__);
    function RefCountObservable(source) {
      this.source = source;
      this._count = 0;
      this._connectableSubscription = null;
      __super__.call(this);
    }

    RefCountObservable.prototype.subscribeCore = function (o) {
      var subscription = this.source.subscribe(o);
      ++this._count === 1 && (this._connectableSubscription = this.source.connect());
      return new RefCountDisposable(this, subscription);
    };

    function RefCountDisposable(p, s) {
      this._p = p;
      this._s = s;
      this.isDisposed = false;
    }

    RefCountDisposable.prototype.dispose = function () {
      if (!this.isDisposed) {
        this.isDisposed = true;
        this._s.dispose();
        --this._p._count === 0 && this._p._connectableSubscription.dispose();
      }
    };

    return RefCountObservable;
  }(ObservableBase));

  var ConnectableObservable = Rx.ConnectableObservable = (function (__super__) {
    inherits(ConnectableObservable, __super__);
    function ConnectableObservable(source, subject) {
      this.source = source;
      this._connection = null;
      this._source = source.asObservable();
      this._subject = subject;
      __super__.call(this);
    }

    function ConnectDisposable(parent, subscription) {
      this._p = parent;
      this._s = subscription;
    }

    ConnectDisposable.prototype.dispose = function () {
      if (this._s) {
        this._s.dispose();
        this._s = null;
        this._p._connection = null;
      }
    };

    ConnectableObservable.prototype.connect = function () {
      if (!this._connection) {
        var subscription = this._source.subscribe(this._subject);
        this._connection = new ConnectDisposable(this, subscription);
      }
      return this._connection;
    };

    ConnectableObservable.prototype._subscribe = function (o) {
      return this._subject.subscribe(o);
    };

    ConnectableObservable.prototype.refCount = function () {
      return new RefCountObservable(this);
    };

    return ConnectableObservable;
  }(Observable));

  var TimerObservable = (function(__super__) {
    inherits(TimerObservable, __super__);
    function TimerObservable(dt, s) {
      this._dt = dt;
      this._s = s;
      __super__.call(this);
    }

    TimerObservable.prototype.subscribeCore = function (o) {
      return this._s.scheduleFuture(o, this._dt, scheduleMethod);
    };

    function scheduleMethod(s, o) {
      o.onNext(0);
      o.onCompleted();
    }

    return TimerObservable;
  }(ObservableBase));

  function _observableTimer(dueTime, scheduler) {
    return new TimerObservable(dueTime, scheduler);
  }

  function observableTimerDateAndPeriod(dueTime, period, scheduler) {
    return new AnonymousObservable(function (observer) {
      var d = dueTime, p = normalizeTime(period);
      return scheduler.scheduleRecursiveFuture(0, d, function (count, self) {
        if (p > 0) {
          var now = scheduler.now();
          d = new Date(d.getTime() + p);
          d.getTime() <= now && (d = new Date(now + p));
        }
        observer.onNext(count);
        self(count + 1, new Date(d));
      });
    });
  }

  function observableTimerTimeSpanAndPeriod(dueTime, period, scheduler) {
    return dueTime === period ?
      new AnonymousObservable(function (observer) {
        return scheduler.schedulePeriodic(0, period, function (count) {
          observer.onNext(count);
          return count + 1;
        });
      }) :
      observableDefer(function () {
        return observableTimerDateAndPeriod(new Date(scheduler.now() + dueTime), period, scheduler);
      });
  }

  /**
   *  Returns an observable sequence that produces a value after each period.
   *
   * @example
   *  1 - res = Rx.Observable.interval(1000);
   *  2 - res = Rx.Observable.interval(1000, Rx.Scheduler.timeout);
   *
   * @param {Number} period Period for producing the values in the resulting sequence (specified as an integer denoting milliseconds).
   * @param {Scheduler} [scheduler] Scheduler to run the timer on. If not specified, Rx.Scheduler.timeout is used.
   * @returns {Observable} An observable sequence that produces a value after each period.
   */
  var observableinterval = Observable.interval = function (period, scheduler) {
    return observableTimerTimeSpanAndPeriod(period, period, isScheduler(scheduler) ? scheduler : defaultScheduler);
  };

  /**
   *  Returns an observable sequence that produces a value after dueTime has elapsed and then after each period.
   * @param {Number} dueTime Absolute (specified as a Date object) or relative time (specified as an integer denoting milliseconds) at which to produce the first value.
   * @param {Mixed} [periodOrScheduler]  Period to produce subsequent values (specified as an integer denoting milliseconds), or the scheduler to run the timer on. If not specified, the resulting timer is not recurring.
   * @param {Scheduler} [scheduler]  Scheduler to run the timer on. If not specified, the timeout scheduler is used.
   * @returns {Observable} An observable sequence that produces a value after due time has elapsed and then each period.
   */
  var observableTimer = Observable.timer = function (dueTime, periodOrScheduler, scheduler) {
    var period;
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    if (periodOrScheduler != null && typeof periodOrScheduler === 'number') {
      period = periodOrScheduler;
    } else if (isScheduler(periodOrScheduler)) {
      scheduler = periodOrScheduler;
    }
    if ((dueTime instanceof Date || typeof dueTime === 'number') && period === undefined) {
      return _observableTimer(dueTime, scheduler);
    }
    if (dueTime instanceof Date && period !== undefined) {
      return observableTimerDateAndPeriod(dueTime.getTime(), periodOrScheduler, scheduler);
    }
    return observableTimerTimeSpanAndPeriod(dueTime, period, scheduler);
  };

  function observableDelayRelative(source, dueTime, scheduler) {
    return new AnonymousObservable(function (o) {
      var active = false,
        cancelable = new SerialDisposable(),
        exception = null,
        q = [],
        running = false,
        subscription;
      subscription = source.materialize().timestamp(scheduler).subscribe(function (notification) {
        var d, shouldRun;
        if (notification.value.kind === 'E') {
          q = [];
          q.push(notification);
          exception = notification.value.error;
          shouldRun = !running;
        } else {
          q.push({ value: notification.value, timestamp: notification.timestamp + dueTime });
          shouldRun = !active;
          active = true;
        }
        if (shouldRun) {
          if (exception !== null) {
            o.onError(exception);
          } else {
            d = new SingleAssignmentDisposable();
            cancelable.setDisposable(d);
            d.setDisposable(scheduler.scheduleRecursiveFuture(null, dueTime, function (_, self) {
              var e, recurseDueTime, result, shouldRecurse;
              if (exception !== null) {
                return;
              }
              running = true;
              do {
                result = null;
                if (q.length > 0 && q[0].timestamp - scheduler.now() <= 0) {
                  result = q.shift().value;
                }
                if (result !== null) {
                  result.accept(o);
                }
              } while (result !== null);
              shouldRecurse = false;
              recurseDueTime = 0;
              if (q.length > 0) {
                shouldRecurse = true;
                recurseDueTime = Math.max(0, q[0].timestamp - scheduler.now());
              } else {
                active = false;
              }
              e = exception;
              running = false;
              if (e !== null) {
                o.onError(e);
              } else if (shouldRecurse) {
                self(null, recurseDueTime);
              }
            }));
          }
        }
      });
      return new BinaryDisposable(subscription, cancelable);
    }, source);
  }

  function observableDelayAbsolute(source, dueTime, scheduler) {
    return observableDefer(function () {
      return observableDelayRelative(source, dueTime - scheduler.now(), scheduler);
    });
  }

  function delayWithSelector(source, subscriptionDelay, delayDurationSelector) {
    var subDelay, selector;
    if (isFunction(subscriptionDelay)) {
      selector = subscriptionDelay;
    } else {
      subDelay = subscriptionDelay;
      selector = delayDurationSelector;
    }
    return new AnonymousObservable(function (o) {
      var delays = new CompositeDisposable(), atEnd = false, subscription = new SerialDisposable();

      function start() {
        subscription.setDisposable(source.subscribe(
          function (x) {
            var delay = tryCatch(selector)(x);
            if (delay === errorObj) { return o.onError(delay.e); }
            var d = new SingleAssignmentDisposable();
            delays.add(d);
            d.setDisposable(delay.subscribe(
              function () {
                o.onNext(x);
                delays.remove(d);
                done();
              },
              function (e) { o.onError(e); },
              function () {
                o.onNext(x);
                delays.remove(d);
                done();
              }
            ));
          },
          function (e) { o.onError(e); },
          function () {
            atEnd = true;
            subscription.dispose();
            done();
          }
        ));
      }

      function done () {
        atEnd && delays.length === 0 && o.onCompleted();
      }

      if (!subDelay) {
        start();
      } else {
        subscription.setDisposable(subDelay.subscribe(start, function (e) { o.onError(e); }, start));
      }

      return new BinaryDisposable(subscription, delays);
    }, this);
  }

  /**
   *  Time shifts the observable sequence by dueTime.
   *  The relative time intervals between the values are preserved.
   *
   * @param {Number} dueTime Absolute (specified as a Date object) or relative time (specified as an integer denoting milliseconds) by which to shift the observable sequence.
   * @param {Scheduler} [scheduler] Scheduler to run the delay timers on. If not specified, the timeout scheduler is used.
   * @returns {Observable} Time-shifted sequence.
   */
  observableProto.delay = function () {
    var firstArg = arguments[0];
    if (typeof firstArg === 'number' || firstArg instanceof Date) {
      var dueTime = firstArg, scheduler = arguments[1];
      isScheduler(scheduler) || (scheduler = defaultScheduler);
      return dueTime instanceof Date ?
        observableDelayAbsolute(this, dueTime, scheduler) :
        observableDelayRelative(this, dueTime, scheduler);
    } else if (Observable.isObservable(firstArg) || isFunction(firstArg)) {
      return delayWithSelector(this, firstArg, arguments[1]);
    } else {
      throw new Error('Invalid arguments');
    }
  };

  var DebounceObservable = (function (__super__) {
    inherits(DebounceObservable, __super__);
    function DebounceObservable(source, dt, s) {
      isScheduler(s) || (s = defaultScheduler);
      this.source = source;
      this._dt = dt;
      this._s = s;
      __super__.call(this);
    }

    DebounceObservable.prototype.subscribeCore = function (o) {
      var cancelable = new SerialDisposable();
      return new BinaryDisposable(
        this.source.subscribe(new DebounceObserver(o, this.source, this._dt, this._s, cancelable)),
        cancelable);
    };

    return DebounceObservable;
  }(ObservableBase));

  var DebounceObserver = (function (__super__) {
    inherits(DebounceObserver, __super__);
    function DebounceObserver(observer, source, dueTime, scheduler, cancelable) {
      this._o = observer;
      this._s = source;
      this._d = dueTime;
      this._scheduler = scheduler;
      this._c = cancelable;
      this._v = null;
      this._hv = false;
      this._id = 0;
      __super__.call(this);
    }

    DebounceObserver.prototype.next = function (x) {
      this._hv = true;
      this._v = x;
      var currentId = ++this._id, d = new SingleAssignmentDisposable();
      this._c.setDisposable(d);
      d.setDisposable(this._scheduler.scheduleFuture(this, this._d, function (_, self) {
        self._hv && self._id === currentId && self._o.onNext(x);
        self._hv = false;
      }));
    };

    DebounceObserver.prototype.error = function (e) {
      this._c.dispose();
      this._o.onError(e);
      this._hv = false;
      this._id++;
    };

    DebounceObserver.prototype.completed = function () {
      this._c.dispose();
      this._hv && this._o.onNext(this._v);
      this._o.onCompleted();
      this._hv = false;
      this._id++;
    };

    return DebounceObserver;
  }(AbstractObserver));

  function debounceWithSelector(source, durationSelector) {
    return new AnonymousObservable(function (o) {
      var value, hasValue = false, cancelable = new SerialDisposable(), id = 0;
      var subscription = source.subscribe(
        function (x) {
          var throttle = tryCatch(durationSelector)(x);
          if (throttle === errorObj) { return o.onError(throttle.e); }

          isPromise(throttle) && (throttle = observableFromPromise(throttle));

          hasValue = true;
          value = x;
          id++;
          var currentid = id, d = new SingleAssignmentDisposable();
          cancelable.setDisposable(d);
          d.setDisposable(throttle.subscribe(
            function () {
              hasValue && id === currentid && o.onNext(value);
              hasValue = false;
              d.dispose();
            },
            function (e) { o.onError(e); },
            function () {
              hasValue && id === currentid && o.onNext(value);
              hasValue = false;
              d.dispose();
            }
          ));
        },
        function (e) {
          cancelable.dispose();
          o.onError(e);
          hasValue = false;
          id++;
        },
        function () {
          cancelable.dispose();
          hasValue && o.onNext(value);
          o.onCompleted();
          hasValue = false;
          id++;
        }
      );
      return new BinaryDisposable(subscription, cancelable);
    }, source);
  }

  observableProto.debounce = function () {
    if (isFunction (arguments[0])) {
      return debounceWithSelector(this, arguments[0]);
    } else if (typeof arguments[0] === 'number') {
      return new DebounceObservable(this, arguments[0], arguments[1]);
    } else {
      throw new Error('Invalid arguments');
    }
  };

  var TimestampObservable = (function (__super__) {
    inherits(TimestampObservable, __super__);
    function TimestampObservable(source, s) {
      this.source = source;
      this._s = s;
      __super__.call(this);
    }

    TimestampObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new TimestampObserver(o, this._s));
    };

    return TimestampObservable;
  }(ObservableBase));

  var TimestampObserver = (function (__super__) {
    inherits(TimestampObserver, __super__);
    function TimestampObserver(o, s) {
      this._o = o;
      this._s = s;
      __super__.call(this);
    }

    TimestampObserver.prototype.next = function (x) {
      this._o.onNext({ value: x, timestamp: this._s.now() });
    };

    TimestampObserver.prototype.error = function (e) {
      this._o.onError(e);
    };

    TimestampObserver.prototype.completed = function () {
      this._o.onCompleted();
    };

    return TimestampObserver;
  }(AbstractObserver));

  /**
   *  Records the timestamp for each value in an observable sequence.
   *
   * @example
   *  1 - res = source.timestamp(); // produces { value: x, timestamp: ts }
   *  2 - res = source.timestamp(Rx.Scheduler.default);
   *
   * @param {Scheduler} [scheduler]  Scheduler used to compute timestamps. If not specified, the default scheduler is used.
   * @returns {Observable} An observable sequence with timestamp information on values.
   */
  observableProto.timestamp = function (scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    return new TimestampObservable(this, scheduler);
  };

  function sampleObservable(source, sampler) {
    return new AnonymousObservable(function (o) {
      var atEnd = false, value, hasValue = false;

      function sampleSubscribe() {
        if (hasValue) {
          hasValue = false;
          o.onNext(value);
        }
        atEnd && o.onCompleted();
      }

      var sourceSubscription = new SingleAssignmentDisposable();
      sourceSubscription.setDisposable(source.subscribe(
        function (newValue) {
          hasValue = true;
          value = newValue;
        },
        function (e) { o.onError(e); },
        function () {
          atEnd = true;
          sourceSubscription.dispose();
        }
      ));

      return new BinaryDisposable(
        sourceSubscription,
        sampler.subscribe(sampleSubscribe, function (e) { o.onError(e); }, sampleSubscribe)
      );
    }, source);
  }

  /**
   *  Samples the observable sequence at each interval.
   *
   * @example
   *  1 - res = source.sample(sampleObservable); // Sampler tick sequence
   *  2 - res = source.sample(5000); // 5 seconds
   *  2 - res = source.sample(5000, Rx.Scheduler.timeout); // 5 seconds
   *
   * @param {Mixed} intervalOrSampler Interval at which to sample (specified as an integer denoting milliseconds) or Sampler Observable.
   * @param {Scheduler} [scheduler]  Scheduler to run the sampling timer on. If not specified, the timeout scheduler is used.
   * @returns {Observable} Sampled observable sequence.
   */
  observableProto.sample = observableProto.throttleLatest = function (intervalOrSampler, scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    return typeof intervalOrSampler === 'number' ?
      sampleObservable(this, observableinterval(intervalOrSampler, scheduler)) :
      sampleObservable(this, intervalOrSampler);
  };

  var TimeoutError = Rx.TimeoutError = function(message) {
    this.message = message || 'Timeout has occurred';
    this.name = 'TimeoutError';
    Error.call(this);
  };
  TimeoutError.prototype = Object.create(Error.prototype);

  function timeoutWithSelector(source, firstTimeout, timeoutDurationSelector, other) {
    if (isFunction(firstTimeout)) {
      other = timeoutDurationSelector;
      timeoutDurationSelector = firstTimeout;
      firstTimeout = observableNever();
    }
    Observable.isObservable(other) || (other = observableThrow(new TimeoutError()));
    return new AnonymousObservable(function (o) {
      var subscription = new SerialDisposable(),
        timer = new SerialDisposable(),
        original = new SingleAssignmentDisposable();

      subscription.setDisposable(original);

      var id = 0, switched = false;

      function setTimer(timeout) {
        var myId = id, d = new SingleAssignmentDisposable();

        function timerWins() {
          switched = (myId === id);
          return switched;
        }

        timer.setDisposable(d);
        d.setDisposable(timeout.subscribe(function () {
          timerWins() && subscription.setDisposable(other.subscribe(o));
          d.dispose();
        }, function (e) {
          timerWins() && o.onError(e);
        }, function () {
          timerWins() && subscription.setDisposable(other.subscribe(o));
        }));
      };

      setTimer(firstTimeout);

      function oWins() {
        var res = !switched;
        if (res) { id++; }
        return res;
      }

      original.setDisposable(source.subscribe(function (x) {
        if (oWins()) {
          o.onNext(x);
          var timeout = tryCatch(timeoutDurationSelector)(x);
          if (timeout === errorObj) { return o.onError(timeout.e); }
          setTimer(isPromise(timeout) ? observableFromPromise(timeout) : timeout);
        }
      }, function (e) {
        oWins() && o.onError(e);
      }, function () {
        oWins() && o.onCompleted();
      }));
      return new BinaryDisposable(subscription, timer);
    }, source);
  }

  function timeout(source, dueTime, other, scheduler) {
    if (isScheduler(other)) {
      scheduler = other;
      other = observableThrow(new TimeoutError());
    }
    if (other instanceof Error) { other = observableThrow(other); }
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    Observable.isObservable(other) || (other = observableThrow(new TimeoutError()));
    return new AnonymousObservable(function (o) {
      var id = 0,
        original = new SingleAssignmentDisposable(),
        subscription = new SerialDisposable(),
        switched = false,
        timer = new SerialDisposable();

      subscription.setDisposable(original);

      function createTimer() {
        var myId = id;
        timer.setDisposable(scheduler.scheduleFuture(null, dueTime, function () {
          switched = id === myId;
          if (switched) {
            isPromise(other) && (other = observableFromPromise(other));
            subscription.setDisposable(other.subscribe(o));
          }
        }));
      }

      createTimer();

      original.setDisposable(source.subscribe(function (x) {
        if (!switched) {
          id++;
          o.onNext(x);
          createTimer();
        }
      }, function (e) {
        if (!switched) {
          id++;
          o.onError(e);
        }
      }, function () {
        if (!switched) {
          id++;
          o.onCompleted();
        }
      }));
      return new BinaryDisposable(subscription, timer);
    }, source);
  }

  observableProto.timeout = function () {
    var firstArg = arguments[0];
    if (firstArg instanceof Date || typeof firstArg === 'number') {
      return timeout(this, firstArg, arguments[1], arguments[2]);
    } else if (Observable.isObservable(firstArg) || isFunction(firstArg)) {
      return timeoutWithSelector(this, firstArg, arguments[1], arguments[2]);
    } else {
      throw new Error('Invalid arguments');
    }
  };

  /**
   * Returns an Observable that emits only the first item emitted by the source Observable during sequential time windows of a specified duration.
   * @param {Number} windowDuration time to wait before emitting another item after emitting the last item
   * @param {Scheduler} [scheduler] the Scheduler to use internally to manage the timers that handle timeout for each item. If not provided, defaults to Scheduler.timeout.
   * @returns {Observable} An Observable that performs the throttle operation.
   */
  observableProto.throttle = function (windowDuration, scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    var duration = +windowDuration || 0;
    if (duration <= 0) { throw new RangeError('windowDuration cannot be less or equal zero.'); }
    var source = this;
    return new AnonymousObservable(function (o) {
      var lastOnNext = 0;
      return source.subscribe(
        function (x) {
          var now = scheduler.now();
          if (lastOnNext === 0 || now - lastOnNext >= duration) {
            lastOnNext = now;
            o.onNext(x);
          }
        },function (e) { o.onError(e); }, function () { o.onCompleted(); }
      );
    }, source);
  };

  var PausableObservable = (function (__super__) {
    inherits(PausableObservable, __super__);
    function PausableObservable(source, pauser) {
      this.source = source;
      this.controller = new Subject();

      if (pauser && pauser.subscribe) {
        this.pauser = this.controller.merge(pauser);
      } else {
        this.pauser = this.controller;
      }

      __super__.call(this);
    }

    PausableObservable.prototype._subscribe = function (o) {
      var conn = this.source.publish(),
        subscription = conn.subscribe(o),
        connection = disposableEmpty;

      var pausable = this.pauser.distinctUntilChanged().subscribe(function (b) {
        if (b) {
          connection = conn.connect();
        } else {
          connection.dispose();
          connection = disposableEmpty;
        }
      });

      return new NAryDisposable([subscription, connection, pausable]);
    };

    PausableObservable.prototype.pause = function () {
      this.controller.onNext(false);
    };

    PausableObservable.prototype.resume = function () {
      this.controller.onNext(true);
    };

    return PausableObservable;

  }(Observable));

  /**
   * Pauses the underlying observable sequence based upon the observable sequence which yields true/false.
   * @example
   * var pauser = new Rx.Subject();
   * var source = Rx.Observable.interval(100).pausable(pauser);
   * @param {Observable} pauser The observable sequence used to pause the underlying sequence.
   * @returns {Observable} The observable sequence which is paused based upon the pauser.
   */
  observableProto.pausable = function (pauser) {
    return new PausableObservable(this, pauser);
  };

  function combineLatestSource(source, subject, resultSelector) {
    return new AnonymousObservable(function (o) {
      var hasValue = [false, false],
        hasValueAll = false,
        isDone = false,
        values = new Array(2),
        err;

      function next(x, i) {
        values[i] = x;
        hasValue[i] = true;
        if (hasValueAll || (hasValueAll = hasValue.every(identity))) {
          if (err) { return o.onError(err); }
          var res = tryCatch(resultSelector).apply(null, values);
          if (res === errorObj) { return o.onError(res.e); }
          o.onNext(res);
        }
        isDone && values[1] && o.onCompleted();
      }

      return new BinaryDisposable(
        source.subscribe(
          function (x) {
            next(x, 0);
          },
          function (e) {
            if (values[1]) {
              o.onError(e);
            } else {
              err = e;
            }
          },
          function () {
            isDone = true;
            values[1] && o.onCompleted();
          }),
        subject.subscribe(
          function (x) {
            next(x, 1);
          },
          function (e) { o.onError(e); },
          function () {
            isDone = true;
            next(true, 1);
          })
        );
    }, source);
  }

  var PausableBufferedObservable = (function (__super__) {
    inherits(PausableBufferedObservable, __super__);
    function PausableBufferedObservable(source, pauser) {
      this.source = source;
      this.controller = new Subject();

      if (pauser && pauser.subscribe) {
        this.pauser = this.controller.merge(pauser);
      } else {
        this.pauser = this.controller;
      }

      __super__.call(this);
    }

    PausableBufferedObservable.prototype._subscribe = function (o) {
      var q = [], previousShouldFire;

      function drainQueue() { while (q.length > 0) { o.onNext(q.shift()); } }

      var subscription =
        combineLatestSource(
          this.source,
          this.pauser.startWith(false).distinctUntilChanged(),
          function (data, shouldFire) {
            return { data: data, shouldFire: shouldFire };
          })
          .subscribe(
            function (results) {
              if (previousShouldFire !== undefined && results.shouldFire !== previousShouldFire) {
                previousShouldFire = results.shouldFire;
                // change in shouldFire
                if (results.shouldFire) { drainQueue(); }
              } else {
                previousShouldFire = results.shouldFire;
                // new data
                if (results.shouldFire) {
                  o.onNext(results.data);
                } else {
                  q.push(results.data);
                }
              }
            },
            function (err) {
              drainQueue();
              o.onError(err);
            },
            function () {
              drainQueue();
              o.onCompleted();
            }
          );
      return subscription;      
    };

    PausableBufferedObservable.prototype.pause = function () {
      this.controller.onNext(false);
    };

    PausableBufferedObservable.prototype.resume = function () {
      this.controller.onNext(true);
    };

    return PausableBufferedObservable;

  }(Observable));

  /**
   * Pauses the underlying observable sequence based upon the observable sequence which yields true/false,
   * and yields the values that were buffered while paused.
   * @example
   * var pauser = new Rx.Subject();
   * var source = Rx.Observable.interval(100).pausableBuffered(pauser);
   * @param {Observable} pauser The observable sequence used to pause the underlying sequence.
   * @returns {Observable} The observable sequence which is paused based upon the pauser.
   */
  observableProto.pausableBuffered = function (pauser) {
    return new PausableBufferedObservable(this, pauser);
  };

  var ControlledObservable = (function (__super__) {
    inherits(ControlledObservable, __super__);
    function ControlledObservable (source, enableQueue, scheduler) {
      __super__.call(this);
      this.subject = new ControlledSubject(enableQueue, scheduler);
      this.source = source.multicast(this.subject).refCount();
    }

    ControlledObservable.prototype._subscribe = function (o) {
      return this.source.subscribe(o);
    };

    ControlledObservable.prototype.request = function (numberOfItems) {
      return this.subject.request(numberOfItems == null ? -1 : numberOfItems);
    };

    return ControlledObservable;

  }(Observable));

  var ControlledSubject = (function (__super__) {
    inherits(ControlledSubject, __super__);
    function ControlledSubject(enableQueue, scheduler) {
      enableQueue == null && (enableQueue = true);

      __super__.call(this);
      this.subject = new Subject();
      this.enableQueue = enableQueue;
      this.queue = enableQueue ? [] : null;
      this.requestedCount = 0;
      this.requestedDisposable = null;
      this.error = null;
      this.hasFailed = false;
      this.hasCompleted = false;
      this.scheduler = scheduler || currentThreadScheduler;
    }

    addProperties(ControlledSubject.prototype, Observer, {
      _subscribe: function (o) {
        return this.subject.subscribe(o);
      },
      onCompleted: function () {
        this.hasCompleted = true;
        if (!this.enableQueue || this.queue.length === 0) {
          this.subject.onCompleted();
          this.disposeCurrentRequest();
        } else {
          this.queue.push(Notification.createOnCompleted());
        }
      },
      onError: function (error) {
        this.hasFailed = true;
        this.error = error;
        if (!this.enableQueue || this.queue.length === 0) {
          this.subject.onError(error);
          this.disposeCurrentRequest();
        } else {
          this.queue.push(Notification.createOnError(error));
        }
      },
      onNext: function (value) {
        if (this.requestedCount <= 0) {
          this.enableQueue && this.queue.push(Notification.createOnNext(value));
        } else {
          (this.requestedCount-- === 0) && this.disposeCurrentRequest();
          this.subject.onNext(value);
        }
      },
      _processRequest: function (numberOfItems) {
        if (this.enableQueue) {
          while (this.queue.length > 0 && (numberOfItems > 0 || this.queue[0].kind !== 'N')) {
            var first = this.queue.shift();
            first.accept(this.subject);
            if (first.kind === 'N') {
              numberOfItems--;
            } else {
              this.disposeCurrentRequest();
              this.queue = [];
            }
          }
        }

        return numberOfItems;
      },
      request: function (number) {
        this.disposeCurrentRequest();
        var self = this;

        this.requestedDisposable = this.scheduler.schedule(number,
        function(s, i) {
          var remaining = self._processRequest(i);
          var stopped = self.hasCompleted || self.hasFailed;
          if (!stopped && remaining > 0) {
            self.requestedCount = remaining;

            return disposableCreate(function () {
              self.requestedCount = 0;
            });
              // Scheduled item is still in progress. Return a new
              // disposable to allow the request to be interrupted
              // via dispose.
          }
        });

        return this.requestedDisposable;
      },
      disposeCurrentRequest: function () {
        if (this.requestedDisposable) {
          this.requestedDisposable.dispose();
          this.requestedDisposable = null;
        }
      }
    });

    return ControlledSubject;
  }(Observable));

  /**
   * Attaches a controller to the observable sequence with the ability to queue.
   * @example
   * var source = Rx.Observable.interval(100).controlled();
   * source.request(3); // Reads 3 values
   * @param {bool} enableQueue truthy value to determine if values should be queued pending the next request
   * @param {Scheduler} scheduler determines how the requests will be scheduled
   * @returns {Observable} The observable sequence which only propagates values on request.
   */
  observableProto.controlled = function (enableQueue, scheduler) {

    if (enableQueue && isScheduler(enableQueue)) {
      scheduler = enableQueue;
      enableQueue = true;
    }

    if (enableQueue == null) {  enableQueue = true; }
    return new ControlledObservable(this, enableQueue, scheduler);
  };

  /**
   * Pipes the existing Observable sequence into a Node.js Stream.
   * @param {Stream} dest The destination Node.js stream.
   * @returns {Stream} The destination stream.
   */
  observableProto.pipe = function (dest) {
    var source = this.pausableBuffered();

    function onDrain() {
      source.resume();
    }

    dest.addListener('drain', onDrain);

    source.subscribe(
      function (x) {
        !dest.write(String(x)) && source.pause();
      },
      function (err) {
        dest.emit('error', err);
      },
      function () {
        // Hack check because STDIO is not closable
        !dest._isStdio && dest.end();
        dest.removeListener('drain', onDrain);
      });

    source.resume();

    return dest;
  };

  var TransduceObserver = (function (__super__) {
    inherits(TransduceObserver, __super__);
    function TransduceObserver(o, xform) {
      this._o = o;
      this._xform = xform;
      __super__.call(this);
    }

    TransduceObserver.prototype.next = function (x) {
      var res = tryCatch(this._xform['@@transducer/step']).call(this._xform, this._o, x);
      if (res === errorObj) { this._o.onError(res.e); }
    };

    TransduceObserver.prototype.error = function (e) { this._o.onError(e); };

    TransduceObserver.prototype.completed = function () {
      this._xform['@@transducer/result'](this._o);
    };

    return TransduceObserver;
  }(AbstractObserver));

  function transformForObserver(o) {
    return {
      '@@transducer/init': function() {
        return o;
      },
      '@@transducer/step': function(obs, input) {
        return obs.onNext(input);
      },
      '@@transducer/result': function(obs) {
        return obs.onCompleted();
      }
    };
  }

  /**
   * Executes a transducer to transform the observable sequence
   * @param {Transducer} transducer A transducer to execute
   * @returns {Observable} An Observable sequence containing the results from the transducer.
   */
  observableProto.transduce = function(transducer) {
    var source = this;
    return new AnonymousObservable(function(o) {
      var xform = transducer(transformForObserver(o));
      return source.subscribe(new TransduceObserver(o, xform));
    }, source);
  };

  var AnonymousObservable = Rx.AnonymousObservable = (function (__super__) {
    inherits(AnonymousObservable, __super__);

    // Fix subscriber to check for undefined or function returned to decorate as Disposable
    function fixSubscriber(subscriber) {
      return subscriber && isFunction(subscriber.dispose) ? subscriber :
        isFunction(subscriber) ? disposableCreate(subscriber) : disposableEmpty;
    }

    function setDisposable(s, state) {
      var ado = state[0], self = state[1];
      var sub = tryCatch(self.__subscribe).call(self, ado);
      if (sub === errorObj && !ado.fail(errorObj.e)) { thrower(errorObj.e); }
      ado.setDisposable(fixSubscriber(sub));
    }

    function AnonymousObservable(subscribe, parent) {
      this.source = parent;
      this.__subscribe = subscribe;
      __super__.call(this);
    }

    AnonymousObservable.prototype._subscribe = function (o) {
      var ado = new AutoDetachObserver(o), state = [ado, this];

      if (currentThreadScheduler.scheduleRequired()) {
        currentThreadScheduler.schedule(state, setDisposable);
      } else {
        setDisposable(null, state);
      }
      return ado;
    };

    return AnonymousObservable;

  }(Observable));

  var AutoDetachObserver = (function (__super__) {
    inherits(AutoDetachObserver, __super__);

    function AutoDetachObserver(observer) {
      __super__.call(this);
      this.observer = observer;
      this.m = new SingleAssignmentDisposable();
    }

    var AutoDetachObserverPrototype = AutoDetachObserver.prototype;

    AutoDetachObserverPrototype.next = function (value) {
      var result = tryCatch(this.observer.onNext).call(this.observer, value);
      if (result === errorObj) {
        this.dispose();
        thrower(result.e);
      }
    };

    AutoDetachObserverPrototype.error = function (err) {
      var result = tryCatch(this.observer.onError).call(this.observer, err);
      this.dispose();
      result === errorObj && thrower(result.e);
    };

    AutoDetachObserverPrototype.completed = function () {
      var result = tryCatch(this.observer.onCompleted).call(this.observer);
      this.dispose();
      result === errorObj && thrower(result.e);
    };

    AutoDetachObserverPrototype.setDisposable = function (value) { this.m.setDisposable(value); };
    AutoDetachObserverPrototype.getDisposable = function () { return this.m.getDisposable(); };

    AutoDetachObserverPrototype.dispose = function () {
      __super__.prototype.dispose.call(this);
      this.m.dispose();
    };

    return AutoDetachObserver;
  }(AbstractObserver));

  var InnerSubscription = function (s, o) {
    this._s = s;
    this._o = o;
  };

  InnerSubscription.prototype.dispose = function () {
    if (!this._s.isDisposed && this._o !== null) {
      var idx = this._s.observers.indexOf(this._o);
      this._s.observers.splice(idx, 1);
      this._o = null;
    }
  };

  /**
   *  Represents an object that is both an observable sequence as well as an observer.
   *  Each notification is broadcasted to all subscribed observers.
   */
  var Subject = Rx.Subject = (function (__super__) {
    inherits(Subject, __super__);
    function Subject() {
      __super__.call(this);
      this.isDisposed = false;
      this.isStopped = false;
      this.observers = [];
      this.hasError = false;
    }

    addProperties(Subject.prototype, Observer.prototype, {
      _subscribe: function (o) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.observers.push(o);
          return new InnerSubscription(this, o);
        }
        if (this.hasError) {
          o.onError(this.error);
          return disposableEmpty;
        }
        o.onCompleted();
        return disposableEmpty;
      },
      /**
       * Indicates whether the subject has observers subscribed to it.
       * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
       */
      hasObservers: function () { return this.observers.length > 0; },
      /**
       * Notifies all subscribed observers about the end of the sequence.
       */
      onCompleted: function () {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
            os[i].onCompleted();
          }

          this.observers.length = 0;
        }
      },
      /**
       * Notifies all subscribed observers about the exception.
       * @param {Mixed} error The exception to send to all observers.
       */
      onError: function (error) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          this.error = error;
          this.hasError = true;
          for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
            os[i].onError(error);
          }

          this.observers.length = 0;
        }
      },
      /**
       * Notifies all subscribed observers about the arrival of the specified element in the sequence.
       * @param {Mixed} value The value to send to all observers.
       */
      onNext: function (value) {
        checkDisposed(this);
        if (!this.isStopped) {
          for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
            os[i].onNext(value);
          }
        }
      },
      /**
       * Unsubscribe all observers and release resources.
       */
      dispose: function () {
        this.isDisposed = true;
        this.observers = null;
      }
    });

    /**
     * Creates a subject from the specified observer and observable.
     * @param {Observer} observer The observer used to send messages to the subject.
     * @param {Observable} observable The observable used to subscribe to messages sent from the subject.
     * @returns {Subject} Subject implemented using the given observer and observable.
     */
    Subject.create = function (observer, observable) {
      return new AnonymousSubject(observer, observable);
    };

    return Subject;
  }(Observable));

  /**
   *  Represents the result of an asynchronous operation.
   *  The last value before the OnCompleted notification, or the error received through OnError, is sent to all subscribed observers.
   */
  var AsyncSubject = Rx.AsyncSubject = (function (__super__) {
    inherits(AsyncSubject, __super__);

    /**
     * Creates a subject that can only receive one value and that value is cached for all future observations.
     * @constructor
     */
    function AsyncSubject() {
      __super__.call(this);
      this.isDisposed = false;
      this.isStopped = false;
      this.hasValue = false;
      this.observers = [];
      this.hasError = false;
    }

    addProperties(AsyncSubject.prototype, Observer.prototype, {
      _subscribe: function (o) {
        checkDisposed(this);

        if (!this.isStopped) {
          this.observers.push(o);
          return new InnerSubscription(this, o);
        }

        if (this.hasError) {
          o.onError(this.error);
        } else if (this.hasValue) {
          o.onNext(this.value);
          o.onCompleted();
        } else {
          o.onCompleted();
        }

        return disposableEmpty;
      },
      /**
       * Indicates whether the subject has observers subscribed to it.
       * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
       */
      hasObservers: function () {
        checkDisposed(this);
        return this.observers.length > 0;
      },
      /**
       * Notifies all subscribed observers about the end of the sequence, also causing the last received value to be sent out (if any).
       */
      onCompleted: function () {
        var i, len;
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          var os = cloneArray(this.observers), len = os.length;

          if (this.hasValue) {
            for (i = 0; i < len; i++) {
              var o = os[i];
              o.onNext(this.value);
              o.onCompleted();
            }
          } else {
            for (i = 0; i < len; i++) {
              os[i].onCompleted();
            }
          }

          this.observers.length = 0;
        }
      },
      /**
       * Notifies all subscribed observers about the error.
       * @param {Mixed} error The Error to send to all observers.
       */
      onError: function (error) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          this.hasError = true;
          this.error = error;

          for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
            os[i].onError(error);
          }

          this.observers.length = 0;
        }
      },
      /**
       * Sends a value to the subject. The last value received before successful termination will be sent to all subscribed and future observers.
       * @param {Mixed} value The value to store in the subject.
       */
      onNext: function (value) {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.value = value;
        this.hasValue = true;
      },
      /**
       * Unsubscribe all observers and release resources.
       */
      dispose: function () {
        this.isDisposed = true;
        this.observers = null;
        this.error = null;
        this.value = null;
      }
    });

    return AsyncSubject;
  }(Observable));

  var AnonymousSubject = Rx.AnonymousSubject = (function (__super__) {
    inherits(AnonymousSubject, __super__);
    function AnonymousSubject(observer, observable) {
      this.observer = observer;
      this.observable = observable;
      __super__.call(this);
    }

    addProperties(AnonymousSubject.prototype, Observer.prototype, {
      _subscribe: function (o) {
        return this.observable.subscribe(o);
      },
      onCompleted: function () {
        this.observer.onCompleted();
      },
      onError: function (error) {
        this.observer.onError(error);
      },
      onNext: function (value) {
        this.observer.onNext(value);
      }
    });

    return AnonymousSubject;
  }(Observable));

  /**
   *  Represents a value that changes over time.
   *  Observers can subscribe to the subject to receive the last (or initial) value and all subsequent notifications.
   */
  var BehaviorSubject = Rx.BehaviorSubject = (function (__super__) {
    inherits(BehaviorSubject, __super__);
    function BehaviorSubject(value) {
      __super__.call(this);
      this.value = value;
      this.observers = [];
      this.isDisposed = false;
      this.isStopped = false;
      this.hasError = false;
    }

    addProperties(BehaviorSubject.prototype, Observer.prototype, {
      _subscribe: function (o) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.observers.push(o);
          o.onNext(this.value);
          return new InnerSubscription(this, o);
        }
        if (this.hasError) {
          o.onError(this.error);
        } else {
          o.onCompleted();
        }
        return disposableEmpty;
      },
      /**
       * Gets the current value or throws an exception.
       * Value is frozen after onCompleted is called.
       * After onError is called always throws the specified exception.
       * An exception is always thrown after dispose is called.
       * @returns {Mixed} The initial value passed to the constructor until onNext is called; after which, the last value passed to onNext.
       */
      getValue: function () {
        checkDisposed(this);
        if (this.hasError) { thrower(this.error); }
        return this.value;
      },
      /**
       * Indicates whether the subject has observers subscribed to it.
       * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
       */
      hasObservers: function () { return this.observers.length > 0; },
      /**
       * Notifies all subscribed observers about the end of the sequence.
       */
      onCompleted: function () {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.isStopped = true;
        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          os[i].onCompleted();
        }

        this.observers.length = 0;
      },
      /**
       * Notifies all subscribed observers about the exception.
       * @param {Mixed} error The exception to send to all observers.
       */
      onError: function (error) {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.isStopped = true;
        this.hasError = true;
        this.error = error;

        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          os[i].onError(error);
        }

        this.observers.length = 0;
      },
      /**
       * Notifies all subscribed observers about the arrival of the specified element in the sequence.
       * @param {Mixed} value The value to send to all observers.
       */
      onNext: function (value) {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.value = value;
        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          os[i].onNext(value);
        }
      },
      /**
       * Unsubscribe all observers and release resources.
       */
      dispose: function () {
        this.isDisposed = true;
        this.observers = null;
        this.value = null;
        this.error = null;
      }
    });

    return BehaviorSubject;
  }(Observable));

  /**
   * Represents an object that is both an observable sequence as well as an observer.
   * Each notification is broadcasted to all subscribed and future observers, subject to buffer trimming policies.
   */
  var ReplaySubject = Rx.ReplaySubject = (function (__super__) {

    var maxSafeInteger = Math.pow(2, 53) - 1;

    function createRemovableDisposable(subject, observer) {
      return disposableCreate(function () {
        observer.dispose();
        !subject.isDisposed && subject.observers.splice(subject.observers.indexOf(observer), 1);
      });
    }

    inherits(ReplaySubject, __super__);

    /**
     *  Initializes a new instance of the ReplaySubject class with the specified buffer size, window size and scheduler.
     *  @param {Number} [bufferSize] Maximum element count of the replay buffer.
     *  @param {Number} [windowSize] Maximum time length of the replay buffer.
     *  @param {Scheduler} [scheduler] Scheduler the observers are invoked on.
     */
    function ReplaySubject(bufferSize, windowSize, scheduler) {
      this.bufferSize = bufferSize == null ? maxSafeInteger : bufferSize;
      this.windowSize = windowSize == null ? maxSafeInteger : windowSize;
      this.scheduler = scheduler || currentThreadScheduler;
      this.q = [];
      this.observers = [];
      this.isStopped = false;
      this.isDisposed = false;
      this.hasError = false;
      this.error = null;
      __super__.call(this);
    }

    addProperties(ReplaySubject.prototype, Observer.prototype, {
      _subscribe: function (o) {
        checkDisposed(this);
        var so = new ScheduledObserver(this.scheduler, o), subscription = createRemovableDisposable(this, so);

        this._trim(this.scheduler.now());
        this.observers.push(so);

        for (var i = 0, len = this.q.length; i < len; i++) {
          so.onNext(this.q[i].value);
        }

        if (this.hasError) {
          so.onError(this.error);
        } else if (this.isStopped) {
          so.onCompleted();
        }

        so.ensureActive();
        return subscription;
      },
      /**
       * Indicates whether the subject has observers subscribed to it.
       * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
       */
      hasObservers: function () {
        return this.observers.length > 0;
      },
      _trim: function (now) {
        while (this.q.length > this.bufferSize) {
          this.q.shift();
        }
        while (this.q.length > 0 && (now - this.q[0].interval) > this.windowSize) {
          this.q.shift();
        }
      },
      /**
       * Notifies all subscribed observers about the arrival of the specified element in the sequence.
       * @param {Mixed} value The value to send to all observers.
       */
      onNext: function (value) {
        checkDisposed(this);
        if (this.isStopped) { return; }
        var now = this.scheduler.now();
        this.q.push({ interval: now, value: value });
        this._trim(now);

        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onNext(value);
          observer.ensureActive();
        }
      },
      /**
       * Notifies all subscribed observers about the exception.
       * @param {Mixed} error The exception to send to all observers.
       */
      onError: function (error) {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.isStopped = true;
        this.error = error;
        this.hasError = true;
        var now = this.scheduler.now();
        this._trim(now);
        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onError(error);
          observer.ensureActive();
        }
        this.observers.length = 0;
      },
      /**
       * Notifies all subscribed observers about the end of the sequence.
       */
      onCompleted: function () {
        checkDisposed(this);
        if (this.isStopped) { return; }
        this.isStopped = true;
        var now = this.scheduler.now();
        this._trim(now);
        for (var i = 0, os = cloneArray(this.observers), len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onCompleted();
          observer.ensureActive();
        }
        this.observers.length = 0;
      },
      /**
       * Unsubscribe all observers and release resources.
       */
      dispose: function () {
        this.isDisposed = true;
        this.observers = null;
      }
    });

    return ReplaySubject;
  }(Observable));

  /**
  * Used to pause and resume streams.
  */
  Rx.Pauser = (function (__super__) {
    inherits(Pauser, __super__);
    function Pauser() {
      __super__.call(this);
    }

    /**
     * Pauses the underlying sequence.
     */
    Pauser.prototype.pause = function () { this.onNext(false); };

    /**
    * Resumes the underlying sequence.
    */
    Pauser.prototype.resume = function () { this.onNext(true); };

    return Pauser;
  }(Subject));

  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    root.Rx = Rx;

    define(function() {
      return Rx;
    });
  } else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = Rx).Rx = Rx;
    } else {
      freeExports.Rx = Rx;
    }
  } else {
    // in a browser or Rhino
    root.Rx = Rx;
  }

  // All code before this point will be filtered from stack traces.
  var rEndingLine = captureLine();

}.call(this));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4}]},{},[1]);
