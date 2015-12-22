# conversant-client-api
Javascript API for conversant.im apps.
Write custom applications that allow you and your team to collaborate and store conversation and view state `in context`. 

## Index
* [conversant.im](https://www.conversant.im)
* [developer api](http://conversant-im.github.io/conversant-client-api/)
* [api documentation](http://conversant-im.github.io/conversant-client-api/docs.html)
* [live chat](https://nxtwv.conversant.im/client)
* [issues / bugs](https://github.com/conversant-im/conversant-client-api/issues)

## Overview
This api relies on a streaming based approach.  The underly data types describe the messages that can be pushed onto the stream or subscribed to react to when seen on the stream.  The first part of this documentation will server to outline terminology used in the system, as well as illustrate the flow of data through the system architecture. 

### Terminology
Your application can exist in 2 `states`.
* `personal` is the application state that each individual user sees the application in the `application panel`.  This state is the workspace that is unique to each user as they prepare content to be collaborated on in the `sync` state.
* `sync` is a shared application view that is common to all users that are present in the collaboration.  Each users interactions to your app in the `sync` state should update all other views accordingly.

![diagram](http://conversant-im.github.io/conversant-client-api/images/api1.png)

#### A word on restoring state.
Your application is responsible for reporting `view state` when a user enter messages into the chat stream.  In addition users can `restore` state at the instance of a paticular chat message.  Your application will receive this restore state and must respond to restore your applications state to the one reported.

#### Data flow.
You application is hosted in an iframe. Commonication with the iframe is brokered through the `window.postMessage` api.  The main conversant application connects to the cluster via a websocket.  Messages all have a strong `type`.  These types are the basis for interacting with the system.  For more information on the `types` that are available to use as a thirs party developer, view the `types` documentation.
* `host` is the conversant.im site that maintains the websocket connection to the backend cluster.
* `application` referse to all applications that are loaded in the `personal` or `sync` iframes.  These applications are communicated with over the `postMessage` channel.

Data that enters the system via the websocket is pused to applications to react to.  Additionally data that is pushed onto the stream will eventually make its way to the cluster via the websocket and results will be pushed down to the `host` and then made available to your `application`.

## Usage
### Node
```nodejs
npm install conversant-client-api
```
The use the `require` in your own module.  ex:
```nodejs
let conversant = require('conversant-client-api')
```

### Browser
To simply include the file in a web browser and use the window level api, you can include the `bundle.js` which includes everything you need to get running in a modern web browser.  
```html
<script src="bundle.js"></script>
```
Alternativly you can build the latest source using `node` with the following command.
```nodejs
node build.js
```

## Getting Started
### Register your application
TODO: docs on where and how to register your application with conversant.im
NOTE: people will require SSL certs for self hosted applicatons
NOTE: public vs. private apps
NOTE: include the `origin` the app will be hosted on

### The Code
A full reference of types and API documentation can be found here: [http://conversant-im.github.io/conversant-client-api/docs.html](http://conversant-im.github.io/conversant-client-api/docs.html)
```javascript
var conversant = new ConversantAPI();
conversant.init(function(appInit){
  var profile = appInit.profile; // This is of type m.Auth.ProfileInfo
  var collaboration = appInit.collaboration; // This is of type m.Collaboration.Collaboration
  var team = appInit.team; // This is of type m.Collaboration.SyncUserEvent[]
  var peers = appInit.peers; // This is of type m.Peers.PeerState[]
  
  // we can listen for types that our application can respond to like this.
  conversant.addResponder(m.Collaboration.SyncViewEvent.type(),function(sync){
    // sync will be of type m.Collaboration.SyncViewEvent
  });
  
  // alternatively if you prefer to deal with an Rx.Subscription directly
  // See documentation on RxJS for ways of working with subscriptions
  var subscription = conversant.addResponder(m.Collaboration.SyncViewEvent.type());
  
  
  // Here is an example of calling the API to add a guest account.
  var guest = new m.Auth.ProfileInfo(profile.orgId, 'email', 'some@email.com', m.Auth.OrganizationRoles.guest(), 'Sponge Bob');
  
  conversant.addGuest(guest).then(function(primaryProfile){
    // addGuest returns a Promise that will be filled with m.Auth.PrimaryProfile
    var guestProfile = primaryProfile;   // type m.Auth.PrimaryProfile
  });
});
```

### Word of Caution on Promise
Do not use Promise API when events happen in close time proximaty to one another.  Use `addResponder` instead and filter the data for your expected result.  Here is an example of what `NOT TO DO`.
```javascript
var bob = new m.Auth.ProfileInfo(profile.orgId, 'email', 'some@email.com', m.Auth.OrganizationRoles.guest(), 'Sponge Bob');
var patrick = new m.Auth.ProfileInfo(profile.orgId, 'email', 'some2@email.com', m.Auth.OrganizationRoles.guest(), 'Patrick');

conversant.addGuest(bob).then(function(primaryProfile){
  console.log('bob?',primaryProfile);
});
conversant.addGuest(patrick).then(function(primaryProfile){
  console.log('patrick?',primaryProfile);
});

// The order that these events will be serviced by the backend cluster is Not garenteed.  
// So for example it is possible that `patrick` returned before `bob` or `bob` then `patric`.
// In addition which ever one is returned first will fill BOTH promises.

```
The order that these events will be serviced by the backend cluster is Not garenteed. So for example it is possible that `patrick` returned before `bob` or `bob` then `patric`. In addition which ever one is returned first will fill BOTH promises.  So for example if patric was returned first.  You would get.
* `> bob? <patric object>`
* `> patrick? <patric object>`

If you need to predictably handle these you would do it as follows.
```javascript
conversant.addResponder(m.Auth.PrimaryProfile.type(),function(profile){
  if( profile.primary.fullName == 'Sponge Bob' ){
    // do stuff..
  }else if(profile.primary.fullName == 'Patrick'){
    // other stuff
  }
});
```
