import React, {useState, useEffect} from "react"
import './App.css';
import { faPlus, faFileImport, } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from "react-simplemde-editor";
import { v4 as uuidv4 } from "uuid"
import {flattenArr, objToArr, timestampToString} from "./utils/help"
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css"
import fileHelper from "./utils/fileHelper"
import FileSearch from "./components/FileSearch"//引入左侧搜索框
import FileList from "./components/FileList"//引入左侧列表
import BottomBtn from "./components/BottomBtn"
import TabList from "./components/TabList"
import defaultFiles from "./utils/defaultFiles"//引入测试数据
import useIpcRenderer from "./hooks/useIpcRenderer"
import Loader from "./components/Loader"
//引入node方法
const {join, basename, extname, dirname} = window.require('path')
const  {remote, ipcRenderer}  = window.require("electron");
const Store = window.require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({name: 'Settings'})//设置存储位置
//判断是够需要自动同步到七牛云
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
//提取需要保存到store到
const saveFilesToStore = (files) => {
  // we don't have to store any info in file system, eg: isNew, body ,etc
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}
function App() {
  const [files, setFiles] = useState(fileStore.get("files") || {}) //将数据obj化
  const [activeFileId, setActiveFileID] = useState("")
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  const [searchedFiles,setSearchedFiles] = useState([])
  const [isLoading, setLoading] = useState(false)
  const filesArr = objToArr(files)//将数据由obj转回
  // const savedLocation =remote.app.getPath("documents")//electron中自带方法 找到适合保存文件的地方
  const savedLocation =settingsStore.get("sacedFileLocation") || remote.app.getPath("documents")//electron中自带方法 找到适合保存文件的地方
  //通过过滤找到选中的文档
  const activeFile = files[activeFileId]
  //通过过滤找到要打开的文档
  const openedFiles = openedFileIDs.map(openID=>{
      return files[openID]
    })
  //判断是否有进行搜索，如果有搜索结果就优先展示
  const fileListArr = (searchedFiles.length>0)?searchedFiles:filesArr;
  

  //左侧列表点击事件
  const fileClick=(fileID)=>{
    //把ID传给activeID
    setActiveFileID(fileID)
    const currentFile = files[fileID];
    const {id, title, path, isLoaded} = currentFile;
    //如果开启了自动同步，需要进行下载操作
    if(getAutoSync()){
      ipcRenderer.send("download-file", {key:`${title}.md`,path, id})
    }else{
      //如果是第一次读取，就通过node获取文档内容
      if(!isLoaded){
        fileHelper.readFile(path).then(value=>{
          const newFile = {...files[fileID],body:value,isLoaded:true}
          setFiles({...files,[fileID]:newFile})
        })
      }
    }
    
    //如果当前ID中没有点击的ID 再执行添加
    //把ID传给打开文件的ID
    if(!openedFileIDs.includes(fileID)){
      setOpenedFileIDs([...openedFileIDs,fileID  ])
    }
  }
  
  //删除列表文档
  const deleteFile =(id)=>{
    //通过ID过滤当前文档列表 删除后重置列表
    // const newFiles=files.filter(file=>file.id!==id)
    //判断是否是在新建文档都过程中 使用了esc退出
    if(files[id].isNew){
      const {[id]:value,...afterDelete} = files
      setFiles(afterDelete)
    }else{
      fileHelper.deleteFile(files[id].path).then(()=>{
        const {[id]:value,...afterDelete} = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        //如果有当前文档是打开状态 需要同步关闭
        tabClose(id)
      })
    }
  }

  //修改文档名称
  const updateFileName =(id,title, isNew)=>{
    //根据ID找到对应文档 替换名称 然后更新
    // const newFiles = files.map(file=>{
    //   if(file.id===id){
    //     file.title=title
    //     file.isNew=false
    //   }
    //   return file
    // })
    // setFiles(newFiles)
    // newpath 应该根据是否是新文档 对路径做处理
    const newPath = isNew ? join(savedLocation, `${title}.md`)
    : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  //搜索文档
  const fileSearch = (keyword)=>{
    const newFiles=filesArr.filter(file=>file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }
  //新建文档
  const createNewFile=()=>{
    const newID=uuidv4()
    
    const newFile={
      id:newID,
      title:"",
      body:"## 请输入 Markdown",
      createdAt:new Date().getTime(),
      isNew:true,
    }
    setFiles({...files,[newID]:newFile})
  }
  //点击前切换tab标签
  const tabClick= (fileID)=>{
    //把ID传给activeID
    setActiveFileID(fileID)
  }

  //关闭当前tab页面
  const tabClose = (id) =>{
    //从当前的openID列表中删除选中项
    const tabWithout = openedFileIDs.filter(fileID=>fileID!==id)
    setOpenedFileIDs(tabWithout)
    //删除当前tab后，如果还有标签就自动切换 否则置空
    if(tabWithout.length>0){
      setActiveFileID(tabWithout[0])
    }else{
      setActiveFileID("")
    }
  }

  //修改文档内容
  const fileChange =(id, value)=>{
    //更新文件内容
    // const newFiles = files.map(file=>{
    //   if(file.id===id){
    //     file.body=value
    //   }
    //   return file
    // })
    if (value !== files[id].body) {
      const newFile = {...files[id], body:value}
      setFiles({...files,[id]:newFile})
      //更新未保存ID
      if(!unsavedFileIDs.includes(id)){
        setUnsavedFileIDs([...unsavedFileIDs,id])
      }
    }
    
  }
  //保存Markdown编辑内容
  const saveCurrentFile = ()=>{
    const {path, body, title} =activeFile;
    fileHelper.writeFile(path,body).then(()=>{
      //完成保存后 更新unsaveID
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id!==activeFile.id))
      //判断是否需要把文档自动同步到七牛云
      if(getAutoSync()){
        ipcRenderer.send("upload-file",{key:`${title}.md`,path})
      }
    })
  }

  //导入文件
  const importFiles = ()=>{
    remote.dialog.showOpenDialog({
      title:"选择需要导入的 Markdown 文件",
      properties:["openFile","multiSelections"],
      filters:[
        {name:"Markdown files", extensions:['md']}
      ]
    },(paths)=>{
     
      if(Array.isArray(paths)){
        //过滤已经导入过的文档
        const filteredPaths = paths.filter(path=>{
          const alreadyAdded =Object.values(files).find(file=>{
            return file.path ===path
          })
          return !alreadyAdded
        })
        //给要导入的数组添加其他元素
        const importFilesArr=filteredPaths.map(path=>{
          return{
            id:uuidv4(),
            title:basename(path,extname(path)),
            path
          }
        })
        //把文件设置为相同结构
        const newFiles = {...files,...flattenArr(importFilesArr)}
        //更新文件
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if(importFilesArr.length>0){
          remote.dialog.showMessageBox({
            type:"info",
            title:`成功导入了${importFilesArr.length}个文件`,
            message:`成功导入了${importFilesArr.length}个文件`,
          })
        }
      }
    })
  }
  const activeFileUploaded = ()=>{
    const {id} = activeFile;
    const modifiedFile ={...files[id], isSynced:true, updatedAt:new Date().getTime()}
    const newFiles={...files, [id]:modifiedFile}
    setFiles(newFiles)
    saveFilesToStore(newFiles)

  }

  const activeFileDownloaded=(event, message)=>{
    const currentFile= files[message.id]
    const {id, path} =currentFile;
    fileHelper.readFile(path).then(value=>{
      let newFile
      if(message.status==="download-success"){
        newFile = {...files[id],body:value,isLoaded:true,isSynced:true,updatedAt:new Date().getTime()}
      }else{
        newFile = {...files[id],body:value, isLoaded:true}
      }
      const newFiles={...files, [id]:newFile}
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  //全部上传到云空间后，改变文件状态
  const filesUploaded=()=>{
    const newFiles = objToArr(files).reduce((result,file)=>{
      const currentTime = new Date().getTime()
      result[file.id]={
        ...files[file.id],
        isSynced:true,
        updatedAt:currentTime
      }
      return result
    },{})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  //监听原生菜单
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,//七牛云上传成功
    'file-downloaded': activeFileDownloaded,//七牛云下载
    'files-uploaded': filesUploaded,
    'loading-status': (message, status) => { setLoading(status) }
  })
  
  return (
    <div className="App container-fluid px-0">
      {isLoading &&
        <Loader/>
      }
      <div className="row g-0">
        <div className="col-4 bg-light left-panel g-0">
          <FileSearch  onFileSearch={fileSearch}></FileSearch>
          <FileList 
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
           />
           <div className="row g-0 button-group">
            <div className="col-6">
              <BottomBtn 
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col-6">
              <BottomBtn 
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
           </div>
        </div>
        <div className="col-8 right-panel">
          { !activeFile && 
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>  
          }
          { activeFile &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileId}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                value={activeFile && activeFile.body}
                key={activeFile && activeFile.id} 
                onChange={(value) => {fileChange(activeFile.id, value)}}
                options={{
                  minHeight: '515px',
                }}
              />
              {activeFile.isSynced&&
              <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updatedAt)} </span>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
