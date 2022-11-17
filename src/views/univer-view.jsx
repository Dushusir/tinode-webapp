import React, { createRef } from 'react';
import { makeid } from '../lib/utils';

export default class UniverView extends React.PureComponent {
  ref = createRef()
  componentDidMount(){
    const { DEFAULT_WORKBOOK_DATA, univerSheetCustom,UniverCore } = UniverPreactTs
    const workbookData = UniverCore.Tools.deepClone(DEFAULT_WORKBOOK_DATA)
    workbookData.id = makeid(6)
        const sheetConfig = {
            container: this.ref.current,
            layout: {
                innerRight: false,
                outerLeft: false,
                infoBar:false,
                toolBar:false,
                formulaBar:false,
                sheetBar:false,
                countBar:false,
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
            baseSheetsConfig: sheetConfig,
        });
  }
  componentWillUnmount() {
    this.setState = ()=>false;
}
  render() {
    return (
      <div id="univer-demo" ref={this.ref} style={{width: '600px', height: '300px'}}>
      </div>
    );
  }
};
