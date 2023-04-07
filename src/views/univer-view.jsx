import React, { createRef } from 'react';
import { makeid } from '../lib/utils';
import * as LuckyExcel from 'luckyexcel';


const ipAddress = '47.100.177.253:8500'
export const urlCollbaration = 'http://luckysheet.lashuju.com/univer/'
const univer_config = {"type":"sheet","template":"DEMO1"}


// 协同

function newDocs(url, params, cb) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(response.statusText);
      }
    })
    .then(document => {
      // 处理获取到的文档信息
      console.log(document);
      cb && cb(document)
    })
    .catch(error => {
      console.error(error);
      cb(null)
    }); 

}


function openDocs(id,cb) {
  // 定义请求参数
      const data = new FormData();
      data.append('id', id);

      // 创建 XMLHttpRequest 对象
      const xhr = new XMLHttpRequest();

      // 监听请求完成事件
      xhr.onload = function() {
      if (xhr.status === 200) {
          const document = JSON.parse(xhr.responseText);
          // 处理获取到的文档信息
          console.log(document);
          cb && cb(document)
      } else {
          console.error(xhr.statusText);
      }
      };

      // 发送 POST 请求
      xhr.open('POST', 'http://'+ipAddress+'/open', true);
      xhr.send(data);

}
function updateDocs(id,config,cb) {
  // 定义请求参数
      const data = new FormData();
      data.append('id', id);
      data.append('config', JSON.stringify(config));

      // 创建 XMLHttpRequest 对象
      const xhr = new XMLHttpRequest();

      // 监听请求完成事件
      xhr.onload = function() {
      if (xhr.status === 200) {
          const document = JSON.parse(xhr.responseText);
          // 处理获取到的文档信息
          console.log(document);
          cb && cb(document)
      } else {
          console.error(xhr.statusText);
      }
      };

      // 发送 POST 请求
      xhr.open('POST', 'http://'+ipAddress+'/update', true);
      xhr.send(data);

}


function refresh(params) {
  const rootEle = document.querySelector('.affine-default-viewport');
  if (!rootEle) return;

  var config = {
    childList: true,
    subtree: true,
  };
  var time = null;
  new MutationObserver(() => {
    if (time) {
      clearTimeout(time);
      time = null;
    }

    time = setTimeout(() => {

      window.dispatchEvent(new Event('resize', {}));
    }, 500);
  }).observe(rootEle, config);
}



export default class UniverView extends React.PureComponent {
  ref = createRef()
  univerId = ''
  componentDidMount() {
    let content = this.props.content

    if(typeof content === 'string' && content.indexOf('univerJson') > -1 &&window.__univer &&window.__univer[content]){
      const exportJson = window.__univer[content].exportJson
      this.handleExportJson(exportJson)
      this.removeContent()
      return
    }
    else if(typeof content === 'string' && content.indexOf('univerJson') > -1&& content.indexOf('exportJson') > -1){
      const data = JSON.parse(content)

      const isCollaboration = this.isCollaboration(content)
      const exportJson = data.exportJson;
      this.handleExportJson(exportJson,isCollaboration)
      this.removeContent()
      return
    }
    // handle http://luckysheet.lashuju.com/univer/?id=nxt0kDHPz3
    else if(content.indexOf('luckysheet.lashuju.com/univer/?id=') !== -1){
      const univerId = content.split('?id=')[1];
      return this.initSheetByDemoNew(content, {univerId})
    }
      
    // handle xlsx
    if (typeof content === 'object' && content.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.handleFile(content)
      this.removeContent()
      return
    }

    content = content.trim()

    // let isPasteSheet = content.indexOf('universheet_copy_action_table') !== -1;
    let isPasteSheet = (content.indexOf('<table') > -1 && content.indexOf('<td') > -1);
    let config = {
        toolbar:false,
        isPasteSheet
    }


    this.initUniverNew(content,config)
    return;
    // table html string
    if (content.indexOf('<table') > -1 && content.indexOf('<td') > -1) {
      this.initSheet(content)
    } else {
      switch (content) {
        case 'table':
        case 'sheet':
          this.initSheet()
          break;
        case 'doc':
          this.initDoc()
          break;
        case 'slide':
          this.initSlide()
          break;
        case 'DEMO1':
        case 'DEMO2':
        case 'DEMO3':
        case 'DEMO4':
          this.initSheetByDemo(content)
          break;
        case 'Doc':
          this.initDoc()
          break;
        case 'Slide':
          this.initSlide()
          break;

        default:
          break;
      }
    }

    this.removeContent()

  }
  initUniverNew(content,setting){

    refresh()

    const {isPasteSheet} = setting
    if (isPasteSheet) {
      this.initSheetNew(content,setting)
    } else {
      switch (content) {
        case 'table':
        case 'sheet':
          this.initSheetNew(content,setting)
          break;
        case 'doc':
          this.initDocNew(setting)
          break;
        case 'slide':
          this.initSlideNew(setting)
          break;
        case 'DEMO1':
        case 'DEMO2':
        case 'DEMO3':
        case 'DEMO4':
        case 'DEMO5':
        case 'DEMO6':
        case 'DEMO7':
        case 'DEMO8':
          this.initSheetByDemoNew(content,setting)
          break;
        case 'Doc':
          this.initDocNew(setting)
          break;
        case 'Slide':
          this.initSlideNew(setting)
          break;

        default:
          break;
      }
    }

    this.removeContent()
  }

  initSheetNew(tableHTML,setting) {
    const { toolbar, isPasteSheet,success: cb } = setting
    let cellData = {}
    let mergeData = {}
    let rowData = []
    let columnData = []

    if (isPasteSheet) {
      const { BaseComponent } = UniverPreactTs
      const { handelTableToJson,handleTableColgroup, handleTableRowGroup, handleTableMergeData,handelExcelToJson,handlePlainToJson  } = BaseComponent


      // const data = handelTableToJson(tableHTML)
      // const colInfo = handleTableColgroup(tableHTML);
      // const rowInfo = handleTableRowGroup(tableHTML);

      let data;
      let colInfo;
      let rowInfo;
      if (tableHTML) {
          if (tableHTML.indexOf('xmlns:x="urn:schemas-microsoft-com:office:excel"') > -1) {
              data = handelExcelToJson(tableHTML);
              colInfo = handleTableColgroup(tableHTML);
              rowInfo = handleTableRowGroup(tableHTML);
          } else if (tableHTML.indexOf('<table') > -1 && tableHTML.indexOf('<td') > -1) {
              data = handelTableToJson(tableHTML);
              colInfo = handleTableColgroup(tableHTML);
              rowInfo = handleTableRowGroup(tableHTML);
          } else {
              data = handlePlainToJson(tableHTML);
          }
      }


        columnData = colInfo.map(w => {
            return { w }
        })
        rowData = rowInfo.map(h => {
            return { h }
        })

        const tableData = handleTableMergeData(data);
        mergeData = tableData.mergeData;

        data.forEach((row, i) => {
        cellData[i] = {}
        row.forEach((column, j) => {
          cellData[i][j] = column
        })
      })
    } else {
      cellData = {
        '0': {
          '0': {
            m: '',
            v: ''
          }
        }
      }
    }

    const { univerSheetCustom, CommonPluginData } = UniverPreactTs
    const { DEFAULT_WORKBOOK_DATA } = CommonPluginData
    const baseSheetsConfig = {
     
      selections: {
        'sheet-01': [
          {
            selection: {
              startRow: 0,
              endRow: 1,
              startColumn: 0,
              endColumn: 1,
            },
            cell: {
              row: 0,
              column: 0,
            },
          },
        ],
      },
    };

    let uiSheetsConfig = {
      container: this.ref.current,
      layout: {
        sheetContainerConfig: {
          infoBar: false,
          formulaBar: false,
          toolbar,
          sheetBar: false,
          countBar: false,
          rightMenu: false,
        },
      },
    }

    let columnCount = 13
    if (window.innerWidth < 1366) {
      columnCount = 7;
    }
    const config = {
      id: makeid(6),
      styles: null,
      namedRanges: null,
      sheetOrder:[],
      sheets: {
        'sheet-01': {
          type: 0,
          id: 'sheet-01',
          name: 'sheet1',
          // columnCount,
          status: 1,
          cellData,
          freezeColumn: 1,
          rowCount: 1000,
          columnCount: 20,
          freezeRow: 1,
          zoomRatio: 1,
          scrollTop: 200,
          scrollLeft: 100,
          defaultColumnWidth: 72,
          defaultRowHeight: 19,
          showGridlines: 1,
          rowTitle: {
              width: 46,
              hidden: 0,
          },
          columnTitle: {
              height: 20,
              hidden: 0,
          },
          rowData,
          columnData,
          mergeData
        }
      }
    }

    if(isPasteSheet){
      config.sheets['sheet-01'].mergeData = mergeData;
      config.sheets['sheet-01'].rowData = rowData;
      config.sheets['sheet-01'].columnData = columnData;
  }

    const coreConfig = Object.assign({}, DEFAULT_WORKBOOK_DATA, config)

    // 协同
    newDocs('http://' + ipAddress + '/new', univer_config, (json) => {

        // offline
        if (json == null) {
            const universheet = univerSheetCustom({
                coreConfig,
                uiSheetsConfig,
                baseSheetsConfig
            })

            cb && cb(universheet)

            return
        }


        const id = json.id;
        const config = json.config;

        if (config === 'default') {

            updateDocs(id, coreConfig, () => {
                const universheet = univerSheetCustom({
                    univerConfig: {
                        id
                    },
                    coreConfig,
                    uiSheetsConfig,
                    baseSheetsConfig,
                    collaborationConfig: {
                        url: `${'ws://' + ipAddress + '/ws/'}${id}`
                    }
                })

                cb && cb(universheet)

                this.univerId = universheet.getWorkBook().getContext().getUniver().getGlobalContext().getUniverId();
                this.ref.current.setAttribute('data-univerId',this.univerId);
            })
        }
    })

    // univerSheetCustom({
    //   coreConfig,
    //   baseSheetsConfig,
    //   uiSheetsConfig
    // });

  }
  initSheetByDemoNew(demo,setting) {
    const { toolbar,univerId, success: cb} = setting
    const { univerSheetCustom, CommonPluginData,UniverCore } = UniverPreactTs
    const { DEFAULT_WORKBOOK_DATA_DEMO1,DEFAULT_WORKBOOK_DATA_DEMO2,DEFAULT_WORKBOOK_DATA_DEMO3,DEFAULT_WORKBOOK_DATA_DEMO4,DEFAULT_WORKBOOK_DATA_DEMO5,DEFAULT_WORKBOOK_DATA_DEMO6,DEFAULT_WORKBOOK_DATA_DEMO7,DEFAULT_WORKBOOK_DATA_DEMO8 } = CommonPluginData

    const baseSheetsConfig = {
      
      selections: {
        'sheet-01': [
          {
            selection: {
              startRow: 0,
              endRow: 0,
              startColumn: 3,
              endColumn: 3,
            },
            cell: {
              row: 0,
              column: 3,
            },
          },
        ],
      },
    };

    let uiSheetsConfig = {
      container: this.ref.current,
      layout: {
        sheetContainerConfig: {
          infoBar: false,
          formulaBar: false,
          toolbar,
          sheetBar: false,
          countBar: false,
          rightMenu: false,
        },
      },
    }
    
  if(univerId){
    openDocs(univerId,(json)=>{
      const universheetconfig = json.config;
      const id = json.id;

      const universheet = univerSheetCustom({
          univerConfig:{
              id
          },
          coreConfig:JSON.parse(universheetconfig),
          uiSheetsConfig,
          collaborationConfig:{
              url: `${'ws://'+ipAddress+'/ws/'}${id}`
          }
      });

      cb && cb(universheet)

      this.univerId = universheet.getWorkBook().getContext().getUniver().getGlobalContext().getUniverId();
      this.ref.current.setAttribute('data-univerId',this.univerId);

  })

  return
  }

    const demoInfo = {
      'DEMO1':DEFAULT_WORKBOOK_DATA_DEMO1,
      'DEMO2':DEFAULT_WORKBOOK_DATA_DEMO2,
      'DEMO3':DEFAULT_WORKBOOK_DATA_DEMO3,
      'DEMO4':DEFAULT_WORKBOOK_DATA_DEMO4,
      'DEMO5':DEFAULT_WORKBOOK_DATA_DEMO5,
      'DEMO6':DEFAULT_WORKBOOK_DATA_DEMO6,
      'DEMO7':DEFAULT_WORKBOOK_DATA_DEMO7,
      'DEMO8':DEFAULT_WORKBOOK_DATA_DEMO8,
    }


    

    const coreConfig = UniverCore.Tools.deepClone(demoInfo[demo])

    coreConfig.id = makeid(6);
    coreConfig.sheetOrder = []

    newDocs('http://'+ipAddress+'/new',univer_config,(json)=>{

  // offline
  if(json == null){
    const universheet = univerSheetCustom({
      coreConfig,
      uiSheetsConfig,
      baseSheetsConfig
    })
  
    cb && cb(universheet)

    return
  }


  const id = json.id;
  const config = json.config;

  if(config === 'default'){

    updateDocs(id,coreConfig,()=>{
      const universheet = univerSheetCustom({
        univerConfig:{
            id
        },
        coreConfig,
        uiSheetsConfig,
        baseSheetsConfig,
        collaborationConfig:{
          url: `${'ws://'+ipAddress+'/ws/'}${id}`
      }
      })
    
      cb && cb(universheet)

      this.univerId = universheet.getWorkBook().getContext().getUniver().getGlobalContext().getUniverId();
      this.ref.current.setAttribute('data-univerId',this.univerId);
    })
  }
  
})

    // univerSheetCustom({
    //   coreConfig,
    //   baseSheetsConfig,
    //   uiSheetsConfig
    // });

  }
  initDocNew(setting) {
    const { toolbar } = setting
    const { univerDocCustom,UniverCore,CommonPluginData } = UniverPreactTs

    const { DEFAULT_DOCUMENT_DATA_EN } = CommonPluginData
    
    const coreConfig = UniverCore.Tools.deepClone(DEFAULT_DOCUMENT_DATA_EN)
    coreConfig.id = makeid(6)
    
    const uiDocsConfig = {
      container: this.ref.current,
      layout: {
        docContainerConfig:{
          innerRight: false,
        outerLeft: false,
        infoBar: false,
        toolbar,
        }
        
      },
    }
    const univerdoc = univerDocCustom({
      coreConfig,
      uiDocsConfig,
    });

    // window.addEventListener('resize', function (event) {
    //   console.log('resize doc')
    //   univerdoc._context
    //     .getPluginManager()
    //     .getRequirePluginByName('document').getDocsView().scrollToCenter();
    // }, true);

  }
  initSlideNew(setting) {
    const { toolbar } = setting
    const { univerSlideCustom,UniverCore,CommonPluginData } = UniverPreactTs
    const { DEFAULT_SLIDE_DATA } = CommonPluginData
    
    const coreConfig = UniverCore.Tools.deepClone(DEFAULT_SLIDE_DATA)
    coreConfig.id = makeid(6)

    const uiSlidesConfig = {
      container: this.ref.current,
      layout: {
        slideContainerConfig:{
          innerLeft: false,
        innerRight: false,
        outerLeft: false,
        infoBar: false,
        toolbar
        }
        
      },
    }
    const universlide = univerSlideCustom({
      coreConfig,
      uiSlidesConfig,
    });

    
  // window.addEventListener('resize', function (event) {
  //   console.log('resize slide')
  //   universlide._context
  //     .getPluginManager()
  //     .getPluginByName('slide')
  //     .getCanvasView()
  //     .scrollToCenter();
  // }, true);
  }

  initSheetDefaultData() {
    const { DEFAULT_WORKBOOK_DATA, univerSheetCustom, UniverCore } = UniverPreactTs
    const workbookData = UniverCore.Tools.deepClone(DEFAULT_WORKBOOK_DATA)
    workbookData.id = makeid(6);
    let columnCount = 8
    if (window.innerWidth < 1366) {
      columnCount = 5;
    }
    workbookData.sheetOrder = []
    workbookData.sheets['sheet-01'].columnCount = columnCount;


    const sheetConfig = {
      container: this.ref.current,
      layout: {
        sheetContainerConfig:{
          innerRight: false,
          outerLeft: false,
          infoBar: false,
          toolBar: false,
          formulaBar: false,
          sheetBar: false,
          countBar: false,
        }
        
      },
      selections: {
        'sheet-01': [
          {
            selection: {
              startRow: 0,
              endRow: 0,
              startColumn: 3,
              endColumn: 3,
            },
            cell: {
              row: 0,
              column: 3,
            },
          },
        ],
      },
    };

    univerSheetCustom({
      coreConfig: workbookData,
      baseSheetsConfig: sheetConfig
    });
  }

  initSheet(tableHTML) {

    let cellData = {}
    if (tableHTML) {
      const { BaseComponent } = UniverPreactTs
      const { handelTableToJson } = BaseComponent
      const array = handelTableToJson(tableHTML)

      array.forEach((row, i) => {
        cellData[i] = {}
        row.forEach((column, j) => {
          cellData[i][j] = column
        })
      })
    } else {
      cellData = {
        '0': {
          '0': {
            m: '',
            v: ''
          }
        }
      }
    }

    const { univerSheetCustom, CommonPluginData } = UniverPreactTs
    const { DEFAULT_WORKBOOK_DATA } = CommonPluginData
    const sheetConfig = {
      container: this.ref.current,
      layout: {
        sheetContainerConfig: {
          infoBar: false,
          formulaBar: false,
          toolBar: false,
          sheetBar: false,
          countBar: false,
          rightMenu: false,
        },
      },
      selections: {
        'sheet-01': [
          {
            selection: {
              startRow: 0,
              endRow: 0,
              startColumn: 3,
              endColumn: 3,
            },
            cell: {
              row: 0,
              column: 3,
            },
          },
        ],
      },
    };

    let columnCount = 13
    if (window.innerWidth < 1366) {
      columnCount = 7;
    }
    const config = {
      id: makeid(6),
      styles: null,
      namedRanges: null,
      sheetOrder:[],
      sheets: {
        'sheet-01': {
          type: 0,
          id: 'sheet-01',
          name: 'sheet1',
          columnCount,
          status: 1,
          cellData
        }
      }
    }
    const coreConfig = Object.assign({}, DEFAULT_WORKBOOK_DATA, config)

    univerSheetCustom({
      coreConfig,
      baseSheetsConfig: sheetConfig,
    });

  }
  initSheetByDemo(demo) {

    const { univerSheetCustom, CommonPluginData,UniverCore } = UniverPreactTs
    const { DEFAULT_WORKBOOK_DATA_DEMO1,DEFAULT_WORKBOOK_DATA_DEMO2,DEFAULT_WORKBOOK_DATA_DEMO3,DEFAULT_WORKBOOK_DATA_DEMO4 } = CommonPluginData
    
    const demoInfo = {
      'DEMO1':DEFAULT_WORKBOOK_DATA_DEMO1,
      'DEMO2':DEFAULT_WORKBOOK_DATA_DEMO2,
      'DEMO3':DEFAULT_WORKBOOK_DATA_DEMO3,
      'DEMO4':DEFAULT_WORKBOOK_DATA_DEMO4,
    }
    const sheetConfig = {
      container: this.ref.current,
      layout: {
        sheetContainerConfig: {
          infoBar: false,
          formulaBar: false,
          toolBar: false,
          sheetBar: false,
          countBar: false,
          rightMenu: false,
        },
      },
      selections: {
        'sheet-01': [
          {
            selection: {
              startRow: 0,
              endRow: 0,
              startColumn: 3,
              endColumn: 3,
            },
            cell: {
              row: 0,
              column: 3,
            },
          },
        ],
      },
    };

    const coreConfig = UniverCore.Tools.deepClone(demoInfo[demo])

    coreConfig.id = makeid(6);
    coreConfig.sheetOrder = []
    univerSheetCustom({
      coreConfig,
      baseSheetsConfig: sheetConfig,
    });

  }
  initDoc() {
    const { univerDocCustom,UniverCore,CommonPluginData } = UniverPreactTs

    const { DEFAULT_DOCUMENT_DATA_EN } = CommonPluginData
    
    const coreConfig = UniverCore.Tools.deepClone(DEFAULT_DOCUMENT_DATA_EN)
    coreConfig.id = makeid(6)
    
    const docConfig = {
      container: this.ref.current,
      layout: {
        innerRight: false,
        outerLeft: false,
        infoBar: false,
        toolBar: false,
      },
    }
    univerDocCustom({
      coreConfig,
      baseDocsConfig: docConfig,
    });
  }
  initSlide() {
    const { univerSlideCustom,UniverCore,CommonPluginData } = UniverPreactTs
    const { DEFAULT_SLIDE_DATA } = CommonPluginData
    
    const coreConfig = UniverCore.Tools.deepClone(DEFAULT_SLIDE_DATA)
    coreConfig.id = makeid(6)

    const slideConfig = {
      container: this.ref.current,
      layout: {
        innerLeft: false,
        innerRight: false,
        outerLeft: false,
        infoBar: false,
        toolBar: false
      },
    }
    univerSlideCustom({
      coreConfig,
      baseSlidesConfig: slideConfig,
    });
  }

  handleFile(file) {
    const transformExcelToLucky = LuckyExcel.default.transformExcelToLucky;

    transformExcelToLucky(file, (exportJson) => {
      this.handleExportJson(exportJson)

    });
  }
  handleExportJson(exportJson, isCollaboration = false) {
      if (exportJson.sheets == null || exportJson.sheets.length == 0) {
        alert('Failed to read the content of the excel file, currently does not support xls files!');
        return;
      }

      const { univerSheetCustom, CommonPluginData, UniverCore } = UniverPreactTs
      const { migrate } = UniverCore
      const { DEFAULT_WORKBOOK_DATA } = CommonPluginData

      const luckysheetConfig = {
        container: 'universheet',
        data: exportJson.sheets,
        title: exportJson.info.name,
      };
      const univerWorkbookConfig = migrate(luckysheetConfig);


      const uiSheetsConfig = {
        container: this.ref.current,
        layout: {
          sheetContainerConfig: {
            infoBar: false,
            formulaBar: false,
            toolBar: false,
            sheetBar: false,
            countBar: false,
            rightMenu: false,
          },
        }
      };

      const config = {
        id: makeid(6),
        styles: null,
        namedRanges: null,
        sheets: univerWorkbookConfig.sheets,
        sheetOrder:[]
      }
      const coreConfig = Object.assign({}, DEFAULT_WORKBOOK_DATA, config)

      const univerSheetCustomConfig = {
        coreConfig,
        uiSheetsConfig,
      }

      // 加上协同
      if(isCollaboration){
        
        univerSheetCustomConfig.collaborationConfig = {
          // url: 'ws://localhost:8448/ws',
          url: 'ws://luckysheet.lashuju.com/ws',
        }
        
        if(window.collaborationInstance){
          const collborationPlugin = window.collaborationInstance.context.getUniver().getGlobalContext().getPluginManager().getPluginByName('collaboration')

          collborationPlugin.getCollaborationController().close();

          window.collaborationInstance = univerSheetCustom(univerSheetCustomConfig);
          return
        }

        window.collaborationInstance = univerSheetCustom(univerSheetCustomConfig);
        return
      }
      univerSheetCustom(univerSheetCustomConfig);

  }

  removeContent() {
    const node = this.ref.current && this.ref.current.previousSibling && this.ref.current.previousSibling
    if (node && node.nodeType === Node.TEXT_NODE) {
      const univerList = ['table','sheet','doc','slide','DEMO1','DEMO2','DEMO3','DEMO4','DEMO5','DEMO6','DEMO7','DEMO8','Doc','Slide','Sheet']
      const content = node.textContent
      if (univerList.includes(content) || (content.indexOf('<table') > -1 && content.indexOf('<td') > -1) || (content.indexOf('univerJson') > -1 && content.indexOf('exportJson') > -1) || content.indexOf('luckysheet.lashuju.com/univer/?id=') !== -1) {
        node.textContent = '';


      //   this.ref.current.insertAdjacentHTML('afterbegin', '<button class="btn-univer-copy">复制</button>');

      //   const btnUniverCopy = this.ref.current.querySelector('.btn-univer-copy');
      //   btnUniverCopy.addEventListener('click', () => {
      //     const url = urlCollbaration + '?id=' + this.univerId;
      //     copyTextToClipboard(url);
      //     alert('copy url success:  ' + url)
      // })
      }
    }
  }

  isCollaboration(content){
    return content.indexOf('Fill in the specific division of labor after the project is disassembled') > -1;
  }
  componentWillUnmount() {
    this.setState = () => false;
  }
  render() {
    return (
      <div id="univer-demo" className='univer-demo' ref={this.ref}>
      </div>
    );
  }
};
