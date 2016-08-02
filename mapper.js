"use strict"

class Mapper{


    constructor(type){
        this.$type = type;
        console.log('created type: '+ type);
        this.objMap = {
                'String' : (obj) => {
                //console.log('dealing with String')
                return {
                    't': 'java.lang.String',
                    'v': obj.valueOf()
                }
            },
            'Number' : (obj) => {
                return {
                    't': 'java.lang.Double',
                    'v': obj.valueOf()
                }
            },
            'm.UUID' : (obj) => {
                return {
                    't': 'java.util.UUID',
                    'v': obj.uuid.valueOf()
                }
            }
        }
    }


    pickleType(obj){
        let jsType = typeof obj
        console.log('jsType: '+jsType)
        let className = obj.constructor.name
        console.log('className: '+className)
        if(obj.$type && this.objMap[obj.$type]){
            return this.objMap[obj.$type](obj)
        }else if(this.objMap[className]){
            return this.objMap[className](obj)
        }else if(jsType == 'object'){
            console.log('object: ',obj)
            console.log('t '+ obj.$type)
            var rep = {
                't':obj.$type
            }
            var props = {}
            for(let x in obj ){
                if(x != '$type') {
                    console.log('x ' + x)
                    props[x] = this.pickleType(obj[x])
                }
            }
            rep.v = props
            console.log('rep', rep)
            return rep;
        }
        return obj;
    }

    write(obj){
        console.log('Mapper::write',obj);
        let pickled = this.pickleType(obj)
        console.log('Mapper::write',pickled);
        return JSON.stringify(pickled)
    }


    unpickleType(rep){
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
                    let prop = this.unpickleType(rep.v[x])
                    inst[x] = prop
                }
            }
            return inst
        }else{
            // built in type: String, Double, ...
            //console.log('OTHER CLASS:',rep)
            if(rep.t == 'scala.collection.immutable.$colon$colon'){ // list
                let prop = this.unpickleType(rep.v.head)
                var list = [prop]
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
            }else if(rep.t == 'java.lang.Integer' || rep.t == 'java.lang.Float' || rep.t == 'java.lang.Double'){
                return new Number(rep.v)
            }else if(rep.t == 'scala.collection.immutable.Map$EmptyMap$'){
                return {}
            }else if(rep.t == 'scala.collection.immutable.HashSet$HashTrieSet' || rep.t.indexOf('scala.collection.immutable.Set') == 0){
                return rep.v.map( x => this.unpickleType(x) )
            }else if(rep.t == 'scala.Some'){
                return this.unpickleType(rep.v.x)
            }else if(rep.t == 'scala.None$'){
                return null
            }else if(rep.t == 'scala.collection.immutable.HashMap$HashTrieMap' || rep.t.indexOf('scala.collection.immutable.Map') == 0){
                var hasMap = {}
                rep.v.map( (x) => {
                    hasMap[x.k.v] = this.unpickleType(x.v)
                })
                return hasMap
            }
            return rep
        }
    }

    read(json){
        let rep = JSON.parse(json)
        console.log('Mapper::read: '+rep.t);
        let obj = this.unpickleType(rep)
        console.log('*** Ret: ',obj)
        return obj
        //return JSON.parse(json)
    }
}

module.exports = {
    Mapper: Mapper
}








