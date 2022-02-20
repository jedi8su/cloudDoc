import {useState, useEffect, } from "react"
//根据传入的键盘keycode判断是否执行部分逻辑
const useKeyPress=(targetKeyCode)=>{
    const [keyPressed, setKeyPressed] = useState(false) //判断是否有键盘按下的动作
    //直接使用even中的keycode进行比较
    const keyDownHandler = ({keyCode})=>{
        if(keyCode===targetKeyCode){
            setKeyPressed(true)
        }
    }
    const keyUpHandler = ({keyCode})=>{
        if(keyCode===targetKeyCode){
            setKeyPressed(false)
        }
    }
    //添加键盘监听事件
    useEffect(()=>{
        document.addEventListener("keydown",keyDownHandler)
        document.addEventListener("keyup",keyUpHandler)
        return ()=>{
            document.removeEventListener("keydown",keyDownHandler)
            document.removeEventListener("keyup",keyUpHandler)
        }
    },[])//无依赖 加载的时候添加 销毁的时候清除 可以直接用[]
    return keyPressed
}

export default useKeyPress