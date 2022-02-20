import React from "react"
import PropTypes from "prop-types"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"

//左侧部分的底部按键 经分析文字、颜色、图标、事件不同，据此传入参数
const BottomBtn =({text,colorClass,icon,onBtnClick})=>{
    return(
        <button
         type="button"
         className={`btn btn-block no-border w-100 ${colorClass}`}
         onClick={onBtnClick}
        >
            <FontAwesomeIcon 
                className="mx-1"
                size="lg" 
                icon={icon}
            />
            {text}
        </button>
    )
}
BottomBtn.prototypes={
    text:PropTypes.string,
    colorClass:PropTypes.string,
    icon:PropTypes.element.isRequired,
    onBtnClick:PropTypes.func,
}
BottomBtn.defaultProps={
    text:"新建"
}
export default BottomBtn