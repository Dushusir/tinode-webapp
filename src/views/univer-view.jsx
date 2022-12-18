import React, { createRef } from 'react';
import { makeid } from '../lib/utils';
import * as LuckyExcel from 'luckyexcel';

export default class UniverView extends React.PureComponent {
  ref = createRef()
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
    // handle xlsx
    if (typeof content === 'object' && content.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.handleFile(content)
      this.removeContent()
      return
    }

    content = content.trim()
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
        innerRight: false,
        outerLeft: false,
        infoBar: false,
        toolBar: false,
        formulaBar: false,
        sheetBar: false,
        countBar: false,
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
        baseSheetsConfig: sheetConfig,
      }

      // 加上协同
      if(isCollaboration){
        
        univerSheetCustomConfig.collaborationConfig = {
          // url: 'ws://localhost:8448/ws',
          url: 'ws://luckysheet.lashuju.com/ws',
        }
        
        if(window.collaborationInstance){
          const collborationPlugin = window.collaborationInstance.context.getPluginManager().getPluginByName('collaboration')

          console.log('collborationPlugin.getCollaborationController()======',collborationPlugin.getCollaborationController());
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
      const univerList = ['table','sheet','doc','slide','DEMO1','DEMO2','DEMO3','DEMO4','Doc','Slide','Sheet']
      const content = node.textContent
      if (univerList.includes(content) || (content.indexOf('<table') > -1 && content.indexOf('<td') > -1) || (content.indexOf('univerJson') > -1 && content.indexOf('exportJson') > -1)) {
        node.textContent = '';
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
