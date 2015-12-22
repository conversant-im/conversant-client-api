"use strict"

class Mapper{
    constructor(type){
        this.$type = type;
        console.log('created type: '+ type);
    }

    write(obj){
        return JSON.stringify(obj)
    }
}

module.exports = {
    Mapper: Mapper
}








