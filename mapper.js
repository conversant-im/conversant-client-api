"use strict"

class Mapper{


    constructor(type){
        this.$type = type;
        //console.log('created type: '+ type);
        let that = this
        function buildList(items){
            if(!items.length){
                return {
                    "s": "scala.collection.immutable.Nil$"
                }
            }else {
                var head = items[0]
                var tail = items.slice(1)
                return {
                    "t": "scala.collection.immutable.$colon$colon",
                    "v": {
                        "head": that.pickleType(head),
                        "tl$1": that.pickleType(tail)
                    }
                }
            }
        }
        this.objMap = {
             'String' : (obj) => {
                return {
                    't': 'java.lang.String',
                    'v': obj.valueOf()
                }
            },
            'm.Some' : (obj) => {
                return {
                    't': 'scala.Some',
                    'v': {'x':that.pickleType(obj.valueOf()) }
                }
            },
            'm.None' : (obj) => {
                return {
                    's': 'scala.None$'
                }
            },
            'm.Integer' : (obj) => {
                return {
                    't': 'java.lang.Integer',
                    'v': obj.valueOf()
                }
            },
            'm.Float' : (obj) => {
                return {
                    't': 'java.lang.Float',
                    'v': obj.valueOf()
                }
            },
            'm.Double' : (obj) => {
                return {
                    't': 'java.lang.Double',
                    'v': obj.valueOf()
                }
            },
            'm.Long' : (obj) => {
                return {
                    't': 'java.lang.Long',
                    'v': obj.valueOf()
                }
            },
            'm.UUID' : (obj) => {
                return {
                    't': 'java.util.UUID',
                    'v': obj.uuid.valueOf()
                }
            },
            'Number' : (obj) => {
                return {
                    't': 'java.lang.Double',
                    'v': obj
                }
            },
            'm.List' : (obj) => {
                return buildList(obj)
            },
            'Array' : (obj) => {
                //return buildList(obj)
                return {
                    't':'[D',
                    'v': obj
                }
            },
            'Set' : (obj) => {
                var t = 'scala.collection.immutable.HashSet$HashTrieSet'
                if(! obj.size ){
                    return  {
                        "t": "scala.collection.immutable.Set$EmptySet$",
                        "v": []
                    }
                }else if(obj.size < 4){
                    t = "scala.collection.immutable.Set$Set"+(obj.size)
                }
                var hack = [];
                obj.forEach( (y) => hack.push(y) );
                return  {
                    "t": t,
                    "v": hack.map( (x) => {
                        return that.pickleType(x)
                    })
                }
            },
            'Map' : (obj) => {
                var t = 'scala.collection.immutable.HashMap$HashTrieMap'
                if(! obj.size ){
                    return  {
                        "t": "scala.collection.immutable.Map$EmptyMap$",
                        "v": []
                    }
                }else if(obj.size < 4){
                    t = "scala.collection.immutable.Map$Map"+(obj.size+1)
                }
                return  {
                    "t": t,
                    "v": obj.entries().map( (x) => {
                        return {
                            'k':that.pickleType(x[0]),
                            'v':that.pickleType(x[1])
                        }
                    })
                }
            }

        }
    }


    pickleType(obj){
        let jsType = typeof obj
        let className = obj.constructor.name
        //console.log('className: '+className)
        if(obj.$type && this.objMap[obj.$type]){
            return this.objMap[obj.$type](obj)
        }else if(this.objMap[className]){
            return this.objMap[className](obj)
        }else if(jsType == 'object'){
            //console.log('object: ',obj)
            //console.log('t '+ obj.$type)
            var rep = {
                't':obj.$type
            }
            var props = {}
            for(let x in obj ){
                if(x != '$type') {
                    //console.log('x ' + x)
                    props[x] = this.pickleType(obj[x])
                }
            }
            rep.v = props
            //console.log('rep', rep)
            return rep;
        }
        return obj;
    }

    write(obj){
        //console.log('Mapper::write',obj);
        let pickled = this.pickleType(obj)
        //console.log('Mapper::write',pickled);
        return JSON.stringify(pickled)
    }


    unpickleType(rep){
        if(!rep){
            console.log("ERROR: rep is undefined")
            return null;
        }
        //console.log('rep: ',rep);
        if(rep.s && !rep.t)rep.t = rep.s
        //console.log('type: '+rep.t);
        if(rep.t.indexOf('m.') == 0){ // this SHOULD be one of our types.
            let s = rep.t.split('$')
            var namespace = s[0].split('.')
            let className = s[1]
            namespace.push(className)
            //console.log('className:',namespace)
            let classRef = namespace.reduce( (pre, cur) => pre[cur], window)
            //console.log('classRef',classRef)
            let inst = new classRef
            //console.log('instance',inst)
            for(let x in inst ){
                if(x != '$type') {
                    //console.log('x ' + x)
                    try {
                        let prop = this.unpickleType(rep.v[x])
                        inst[x] = prop
                    }catch(e){
                        console.error('[ERROR] - unpickleType failed for '+namespace+'.'+x+'  with error: ',e);
                        throw e;
                    }
                }
            }
            return inst
        }else{
            // built in type: String, Double, ...
            //console.log('OTHER CLASS:',rep)
            if(rep.t == 'scala.collection.immutable.$colon$colon'){ // list
                let prop = this.unpickleType(rep.v.head)
                var list = new m.List()
                list.push(prop)
                list = list.concat(this.unpickleType(rep.v.tl$1))
                return list
            }else if(rep.t == 'scala.collection.immutable.Nil$'){
                return []
            }else if(rep.t == 'java.util.UUID'){
                return new m.UUID(rep.v)
            }else if(rep.t == 'java.lang.String'){
                return new String(rep.v)
            }else if(rep.t == 'java.lang.Boolean'){
                return new Boolean(rep.v)
            }else if(rep.t == 'java.lang.Integer' ){
                return new m.Integer(rep.v)
            }else if(rep.t == 'java.lang.Float'){
                return new m.Float(rep.v)
            }else if(rep.t == 'java.lang.Double'){
                return new m.Double(rep.v)
            }else if(rep.t == 'java.lang.Long'){
                return new m.Long(rep.v)
            }else if(rep.t == 'scala.Some'){
                return m.Option.Some(this.unpickleType(rep.v.x))
            }else if(rep.t == 'scale.None$'){
                return m.Option.None()
            }else if(rep.t == 'scala.collection.immutable.HashSet$HashTrieSet' || rep.t.indexOf('scala.collection.immutable.Set') == 0){
                return rep.v.map( x => this.unpickleType(x) )
            }else if(rep.t == 'scala.Some'){
                return this.unpickleType(rep.v.x)
            }else if(rep.t == 'scala.None$'){
                return null
            }else if(rep.t == 'scala.collection.immutable.HashMap$HashTrieMap' || rep.t.indexOf('scala.collection.immutable.Map') == 0){
                var hashMap = new Map()
                rep.v.map( (x) => {
                    hashMap.set([x.k.v],this.unpickleType(x.v))
                })
                return hashMap
            }
            return rep
        }
    }

    read(json){
        let rep = JSON.parse(json)
        //console.log('Mapper::read: '+rep.t);
        let obj = this.unpickleType(rep)
        //console.log('*** Ret: ',obj)
        return obj
        //return JSON.parse(json)
    }
}

function serialize(object) {
    var jsonOutput = serializeToJson(object);

    function serializeToJson(obj) {
        var jobj = {};
        for (var field in obj){
            if (obj.hasOwnProperty(field)) {
                if (obj[field].$type) {
                    var type = obj[field].$type;
                    if (type == "m.Some") {
                        jobj[field] = [obj[field].val]; 
                    } else if (type == "m.None") {
                        jobj[field] = [];
                    } else if (type == "m.List" || type == "m.Set") {
                        jobj[field] = obj[field].values.map(x => serializeToJson(x));
                    } else if (type == "m.UUID") {
                        jobj[field] = obj[field].valueOf();
                    } else {
                        jobj[field] = serializeToJson(obj[field]);
                    }
                } else if (obj[field].constructor == Map) {
                    jobj[field] = serializeToJson(obj[field]);
                } else if (obj[field].constructor == Array) {
                    jobj[field] = obj[field].map(x => serializeToJson(x));
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
}