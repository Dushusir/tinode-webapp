import React from 'react';
import { FormattedMessage } from 'react-intl';
import SendMessage from './send-message.jsx';

import { REM_SIZE } from '../config.js';
import { fitImageSize } from '../lib/blob-helpers.js';
import { bytesToHumanSize, shortenFileName } from '../lib/strformat.js';
import UniverView from '../views/univer-view.jsx'

export default class XlsxPreview extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      height: 0
    };
    this.handleSendImage = this.handleSendImage.bind(this);
  }

  assignWidth(node) {
    if (node && !this.state.width) {
      const bounds = node.getBoundingClientRect();
      this.setState({
        width: bounds.width | 0,
        height: bounds.height | 0
      });
    }
  }

  handleSendImage(caption) {
    this.props.onClose();
    this.props.onSendMessage(caption);
  }

  render() {
    if (!this.props.content) {
      return null;
    }

    const width = this.props.content.width || '-';
    const height = this.props.content.height || '-';
    return (
      <div id="image-preview">
        
        <div id="image-preview-container">
          <UniverView key={new Date().getTime()} content={this.props.content.file}></UniverView>
        </div>
        {this.props.onSendMessage ?
          <SendMessage
            messagePrompt="add_image_caption"
            acceptBlank={true}
            tinode={this.props.tinode}
            reply={this.props.reply}
            onCancelReply={this.props.onCancelReply}
            onSendMessage={this.handleSendImage}
            onError={this.props.onError} />
          :
          <div id="image-preview-footer">
            <div>
              <div><b><FormattedMessage id="label_file_name" defaultMessage="File name:"
                description="Label for a file name" /></b></div>
              <div><span title={this.props.content.name}>{fname}</span></div>
            </div>
            <div>
              <div><b><FormattedMessage id="label_content_type" defaultMessage="Content type:"
                description="Label for file content type (mime)" /></b></div>
              <div>{this.props.content.type}</div>
            </div>
            <div>
              <div><b><FormattedMessage id="label_size" defaultMessage="Size:"
                description="Label for file size" /></b></div>
              <div>{width} &times; {height} px; {bytesToHumanSize(this.props.content.size)}</div>
            </div>
          </div>}
      </div>
    );
  }
};
