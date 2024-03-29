// Single chat message bubble, sent or received.

import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Drafty, Tinode } from 'tinode-sdk';

import Attachment from './attachment.jsx';
import LetterTile from './letter-tile.jsx';
import ReceivedMarker from './received-marker.jsx'

import { fullFormatter } from '../lib/formatters.js';
import { sanitizeUrl } from '../lib/utils.js';
import UniverView from '../views/univer-view.jsx'

class BaseChatMessage extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      progress: 0
    };

    if (props.uploader) {
      props.uploader.onProgress = this.handleProgress.bind(this);
    }

    this.handleImagePreview = this.handleImagePreview.bind(this);
    this.handleFormButtonClick = this.handleFormButtonClick.bind(this);
    this.handleContextClick = this.handleContextClick.bind(this);
    this.handleCancelUpload = this.handleCancelUpload.bind(this);
    this.handleQuoteClick = this.handleQuoteClick.bind(this);

    this.formatterContext = {
      formatMessage: props.intl.formatMessage.bind(props.intl),
      viewportWidth: props.viewportWidth,
      authorizeURL: props.tinode.authorizeURL.bind(props.tinode),

      onImagePreview: this.handleImagePreview,
      onFormButtonClick: this.handleFormButtonClick,
      onQuoteClick: this.handleQuoteClick
    };
  }

  handleImagePreview(e) {
    e.preventDefault();
    this.props.onImagePreview({
      url: e.target.src,
      filename: e.target.title,
      width: e.target.dataset.width,
      height: e.target.dataset.height,
      size: e.target.dataset.size,
      type: e.target.dataset.mime
    });
  }

  handleFormButtonClick(e) {
    e.preventDefault();
    const data = {
      seq: this.props.seq
    };
    data.resp = {};
    if (e.target.dataset.name) {
      data.resp[e.target.dataset.name] = e.target.dataset.val ? e.target.dataset.val :
        e.target.dataset.val === undefined ? 1 : '' + e.target.dataset.val;
    }
    if (e.target.dataset.act == 'url') {
      data.ref = sanitizeUrl(e.target.dataset.ref) || 'about:blank';
    }
    const text = e.target.dataset.title || 'unknown';
    this.props.onFormResponse(e.target.dataset.act, text, data);
  }

  handleContextClick(e,innerRef) {
    e.preventDefault();
    e.stopPropagation();
    const menuItems = [];
    if (this.props.received == Tinode.MESSAGE_STATUS_FAILED) {
      menuItems.push('menu_item_send_retry');
    }
    if (this.props.userIsWriter &&
        this.props.received > Tinode.MESSAGE_STATUS_FAILED &&
        this.props.received < Tinode.MESSAGE_STATUS_DEL_RANGE) {
      menuItems.push('menu_item_reply');
    }
    menuItems.push('menu_item_forward');
    menuItems.push('menu_item_copy');

    this.props.showContextMenu({
      seq: this.props.seq,
      content: this.props.content,
      userFrom: this.props.userFrom,
      userName: this.props.userName,
      y: e.pageY,
      x: e.pageX,
      pickReply: this.props.pickReply,
      innerRef
    }, menuItems);
  }

  handleProgress(ratio) {
    this.setState({progress: ratio});
  }

  handleCancelUpload() {
    this.props.onCancelUpload(this.props.seq, this.props.uploader);
  }

  handleQuoteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const replyToSeq = this.props.replyToSeq;
    if (replyToSeq) {
      this.props.onQuoteClick(replyToSeq);
    }
  }

  render() {
    const sideClass = this.props.sequence + ' ' + (this.props.response ? 'left' : 'right');
    const bubbleClass = (this.props.sequence == 'single' || this.props.sequence == 'last') ? 'bubble tip' : 'bubble';
    const avatar = this.props.userAvatar || true;
    const fullDisplay = (this.props.isGroup && this.props.response &&
      (this.props.sequence == 'single' || this.props.sequence == 'last'));

    let content = this.props.content;
    const attachments = [];

    if(content && content.txt){
      content = content.txt
    }

    const univerList = ['table','sheet','doc','slide','DEMO1','DEMO2','DEMO3','DEMO4','DEMO5','DEMO6','DEMO7','DEMO8','Doc','Slide','Sheet']
    if(typeof content === 'string' && content.indexOf('univerJson') > -1 && content.indexOf('exportJson') > -1){
      attachments.push(<UniverView key={new Date().getTime()} content={content}/>);
    }
    else if(typeof content === 'string' && (univerList.includes(content) || (content.indexOf('<table') > -1 && content.indexOf('<td') > -1) || content.indexOf('luckysheet.lashuju.com/univer/?id=') !== -1)){
      attachments.push(<UniverView key={new Date().getTime()} content={content}/>);
    }
    else if (this.props.mimeType == Drafty.getContentType() && Drafty.isValid(content)) {
      Drafty.attachments(content, (att, i) => {
        if (att.mime == 'application/json') {
          // Don't show json objects as attachments.
          // They are not meant for users.
          return;
        }
        attachments.push(<Attachment
          tinode={this.props.tinode}
          downloadUrl={Drafty.getDownloadUrl(att)}
          filename={att.name}
          uploading={Drafty.isProcessing(att)}
          mimetype={att.mime}
          size={Drafty.getEntitySize(att)}
          progress={this.state.progress}
          onCancelUpload={this.handleCancelUpload}
          onError={this.props.onError}
          key={i} />);
      }, this);
      const tree = Drafty.format(content, fullFormatter, this.formatterContext);
      content = React.createElement(React.Fragment, null, tree);
    }
    else if (this.props.deleted) {
      // Message represents a range of deleted messages.
      content = <><i className="material-icons gray">block</i> <i className="gray">
        <FormattedMessage id="deleted_content"
          defaultMessage="content deleted" description="Shown when messages are deleted" />
      </i></>
    } else if (typeof content != 'string') {
      content = <><i className="material-icons gray">warning_amber</i> <i className="gray">
        <FormattedMessage id="invalid_content"
          defaultMessage="invalid content" description="Shown when the message is unreadable" /></i></>
    }

    return (
      <li ref={this.props.innerRef} className={sideClass}>
        {this.props.isGroup && this.props.response ?
          <div className="avatar-box">
            {fullDisplay ?
              <LetterTile
                tinode={this.props.tinode}
                topic={this.props.userFrom}
                title={this.props.userName}
                avatar={avatar} /> :
              null}
          </div> :
          null}
        <div>
          <div className={bubbleClass}>
            <div className="content-meta">
              <div className="message-content">
                {content}
                {attachments}
              </div>
              {this.props.timestamp ?
                <ReceivedMarker
                  timestamp={this.props.timestamp}
                  received={this.props.received} />
                : null}
            </div>
            {this.props.showContextMenu ?
              <span className="menuTrigger">
                <a href="#" onClick={(e) => this.handleContextClick(e,this.props.innerRef)}>
                  <i className="material-icons">expand_more</i>
                </a>
              </span> : null
            }
          </div>
          {fullDisplay ?
            <div className="author">
              {this.props.userName ||
                <i><FormattedMessage id="user_not_found" defaultMessage="Not found"
                description="In place of a user's full name when the user is not found." /></i>
              }
            </div>
            : null
          }
        </div>
      </li>
    );
  }
};

const IntlChatMessage = injectIntl(BaseChatMessage);
const ChatMessage = React.forwardRef((props, ref) => <IntlChatMessage innerRef = {ref} {...props} />);

export default ChatMessage;
