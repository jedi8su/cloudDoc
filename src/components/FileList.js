import React, {useState, useEffect, useRef} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faEdit , faTrash, faTimes} from '@fortawesome/free-solid-svg-icons'
import { faMarkdown} from '@fortawesome/free-brands-svg-icons'
import PropTypes from "prop-types" //属性检查 类似于typescript作用
import useKeyPress from "../hooks/useKeyPress" //引入自定义hooks事件
//添加上下文菜单功能
import useContextMenu from "../hooks/useContextMenu"
import {getParentNode} from "../utils/help"

const FileList = ({files,onFileClick,onSaveEdit,onFileDelete}) =>{
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState("")
    let node = useRef(null)
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    //关闭编辑框
    const closeSearch=(editItem)=>{
        // e.preventDefault()
        setEditStatus(false)
        setValue("")
        //判断是否是新建文档 如果是新建文档，当完成时，需要进行删除
        if(editItem.isNew){
            onFileDelete(editItem.id)
        }

    }
    //添加上下文菜单/鼠标右键菜单
    const clickedItem=useContextMenu([
        {
            label:"打开",
            click:()=>{
                const parentElement = getParentNode(clickedItem.current,'file-item')
                if(parentElement){
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label:"重命名",
            click:()=>{
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    const { id, title } = parentElement.dataset
                    setEditStatus(id)
                    setValue(title)
                }
            }
        },
        {
            label:"删除",
            click:()=>{
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ],".file-lish",[files])
    
    //是否有新建的文档
    useEffect(()=>{
        const newFile= files.find(file=>file.isNew)
        if(newFile){
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    },[files])
    //enter esc键盘操作
    useEffect(()=>{
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew)//isNew用来区分是否是新建
            setEditStatus(false)
            setValue('')
        }
        if(escPressed && editStatus) {
            closeSearch(editItem)
        }
        
    })
    //编辑时 生成光标
    useEffect(() => {
        if (editStatus) {
          node.current.focus()
        }
      }, [editStatus])
    return (
        <ul className="list-group list-group-flush file-lish">
            {
                files.map(file=>(
                    <li className="list-group-item bg-light row d-flex align-items-center file-item mx-0"
                    key={file.id}
                    data-id={file.id}
                    data-title={file.title}
                    >
                        { (file.id !== editStatus && !file.isNew) &&
                        <>
                            <span className="col-2">
                                <FontAwesomeIcon size="lg" icon={faMarkdown}/>
                            </span>
                            <span className="col-8 c-link"
                                onClick={()=>{onFileClick(file.id)}}
                            >
                                {file.title}
                            </span>
                            {/* <button 
                            type="button" 
                            className="icon-button col-1"
                            onClick={()=>{setEditStatus(file.id);setValue(file.title)}}>
                                <FontAwesomeIcon tittle="编辑" size="lg" icon={faEdit} />
                            </button> */}
                            {/* <button 
                            type="button" 
                            className="icon-button col-1"
                            onClick={()=>{onFileDelete(file.id)}}>
                                <FontAwesomeIcon tittle="删除" size="lg" icon={faTrash} />
                            </button> */}
                        </>
                        }
                        {((file.id===editStatus) || file.isNew) &&   
                        <>
                            <input className="form-control col-10"
                                value={value}
                                ref={node}
                                placeholder="请输入文件名称"
                                onChange={(e)=>{setValue(e.target.value)}}
                            />
                            <button 
                            type="button" 
                            className="icon-button col-2"
                            onClick={()=>{closeSearch(file)}}>
                                <FontAwesomeIcon tittle="关闭" size="lg" icon={faTimes} />
                            </button>
                        </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}
FileList.prototypes={
    files:PropTypes.array,
    onFileClick:PropTypes.func,
    onFileDelete:PropTypes.func,
    onSaveEdit:PropTypes.func,
}
export default FileList