"use strict"
//import API from './api'
let m = require('./model')
let mapper = require('./mapper')
//var WildEmitter = require('wildemitter');

class API {
	constructor() {
		this.mapper = new mapper.Mapper()
	}

	send(data){
		// TODO: window.postMessage..
	}

	addTeamMember(profile) {
		let p1 = new Promise((resolve, reject) => {
			if (! profile instanceof m.Auth.ProfileInfo) {
				reject('[ERROR] type error - argument profile not an instance of m.Auth.ProfileInfo')
			}
			// TODO: subscribe .. and remove subsciption
			// Rx.js
			send(this.mapper.write(profile))
		});
		return p1;
	}
}

class ConversantAPI extends API{
	constructor(){
		super()
	}

}


module.exports = ConversantAPI;
window.ConversantAPI = ConversantAPI;

