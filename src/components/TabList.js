import React from "react"
import PropTypes from "prop-types" 
import classNames from "classnames" //class库 可以用于拼接 判断class值
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faTimes} from '@fortawesome/free-solid-svg-icons'
import "./TabList.scss"
const TabList = ({files, activeId,unsaveIds,onTabClick,onCloseTab})=>{
    return(
        <ul className="nav nav-pills tablist-component">
            {files.map(file=>{
                const withUnsavedMark = unsaveIds.includes(file.id);//判断是否已经保存
                const fClassName=classNames({
                    'nav-link':true,
                    "active":file.id===activeId,
                    'withUnsaved':withUnsavedMark
                })
                return (
                    <li className="nav-item" key={file.id}>
                        <a
                            href="#"
                            className={fClassName}
                            onClick={(e)=>{e.preventDefault();onTabClick(file.id)}}
                        >
                            {file.title}
                            <span 
                                className="mx-1 close-icon"
                                onClick={(e)=>{
                                    e.stopPropagation();//阻止向上冒泡 避免触发父级点击事件
                                    onCloseTab(file.id)
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes}/>
                            </span>
                            {withUnsavedMark && <span className="rounded-circle unsaved-icon mx-1"></span>}
                        </a>
                    </li>
                )
            })

            }
        </ul>
    )
}
TabList.protoTypes={
    files:PropTypes.array,
    activeId:PropTypes.string,
    unsaveIds:PropTypes.array,
    onTabClick:PropTypes.func,
    onCloseTab:PropTypes.func
}
TabList.defaultProps={
    unsaveIds:[]
}
export default TabList