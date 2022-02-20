//对数据格式进行处理，做成obj形式，按照ID查找数据
export const flattenArr = (arr) =>{
    return arr.reduce((map,item)=>{
        map[item.id]=item
        return map
    },{})
}

//将obj数据还原成arr数据
export const objToArr=(obj)=>{
    return Object.keys(obj).map(key=>obj[key])
}

//获取父级节点
export const getParentNode = (node, parentClassName)=>{
    let current = node;
    while (current !==null){
        if(current.classList.contains(parentClassName)){
            return current
        }
        current = current.parentNode
    }
    return false
}
export const timestampToString = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }