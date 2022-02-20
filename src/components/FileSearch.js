import React, {useState, useEffect, useRef} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faSearch , faTimes} from '@fortawesome/free-solid-svg-icons'
import PropTypes from "prop-types" //属性检查 类似于typescript作用
import useKeyPress from "../hooks/useKeyPress" //引入自定义hooks事件
import useIpcRenderer from "../hooks/useIpcRenderer"
const FileSearch = ({title, onFileSearch})=>{
    const [inputActive, setInputActive] = useState(false)
    const [value, setValue] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    let node = useRef(null)//确保react将相应的dom设置成需要节点 记住dom节点
    //关闭搜索
    const closeSearch = ()=>{
        // e.preventDefault()
        setInputActive(false)
        setValue('')
        onFileSearch("")
    }
    useEffect(()=>{
        if(enterPressed && inputActive){
            onFileSearch(value)
        }
        if(escPressed && inputActive){
            closeSearch()
        }
        // const handleInputEvent = (event)=>{
        //     //获取键盘事件，根据键盘事件判断是否进行搜索
        //     const {keyCode} = event
         
        //     if(keyCode===13 && inputActive){ //判断为enter键
        //         onFileSearch(value)
        //     }else if(keyCode===27 && inputActive){//判断为esc键
        //         closeSearch(event)
        //     }
        // }
        // //给键盘添加事件
        // document.addEventListener('keyup',handleInputEvent)
        // //在事件结束时 清除掉绑定
        // return ()=>{
        //     document.removeEventListener('keyup',handleInputEvent)
        // }
    })
    //input聚焦 高亮
    useEffect(()=>{
        if(inputActive){
            node.current.focus()
        }
    },[inputActive])//标注依赖 当inputActive为true时执行这个高亮设置

    useIpcRenderer({
        'search-file': setInputActive,
      })
    return(
        <div className="alert alert-primary d-flex justify-content-between align-items-center"> 
            { !inputActive && 
                <>
                    <span>{title}</span>
                    <button 
                    type="button" 
                    className="icon-button"
                    onClick={()=>{setInputActive(true)}}> 
                        <FontAwesomeIcon tittle="搜索" size="lg" icon={faSearch} />
                    </button>
                </>
            }
            {   inputActive && 
                <>
                    <input className="form-control "
                    value={value}
                    ref={node}
                    onChange={(e)=>{setValue(e.target.value)}}
                    />
                    <button 
                    type="button" 
                    className="icon-button "
                    onClick={closeSearch}>
                        <FontAwesomeIcon tittle="关闭" size="lg" icon={faTimes} />
                    </button>
                </>

            }
        </div>
    )
}
//检查参数格式是否符合要求
FileSearch.propTypes={
    title:PropTypes.string,
    onFileSearch:PropTypes.func.isRequired
}
//设置默认值
FileSearch.defaultProps={
    title:"我的云文档"
}
export default FileSearch