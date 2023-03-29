// Send message form.
import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Drafty } from 'tinode-sdk';

import AudioRecorder from './audio-recorder.jsx';

import { KEYPRESS_DELAY } from '../config.js';
import { filePasted } from '../lib/blob-helpers.js';
import { replyFormatter } from '../lib/formatters.js';

const messages = defineMessages({
  messaging_disabled: {
    id: 'messaging_disabled_prompt',
    defaultMessage: 'Messaging disabled',
    description: 'Prompt in SendMessage in read-only topic'
  },
  type_new_message: {
    id: 'new_message_prompt',
    defaultMessage: 'New message',
    description: 'Prompt in send message field'
  },
  add_image_caption: {
    id: 'image_caption_prompt',
    defaultMessage: 'Image caption',
    description: 'Prompt in SendMessage for attached image'
  },
  file_attachment_too_large: {
    id: 'file_attachment_too_large',
    defaultMessage: 'The file size {size} exceeds the {limit} limit.',
    description: 'Error message when attachment is too large'
  },
  cannot_initiate_upload: {
    id: 'cannot_initiate_file_upload',
    defaultMessage: 'Cannot initiate file upload.',
    description: 'Generic error messagewhen attachment fails'
  },
});

class SendMessage extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      quote: null,
      message: '',
      audioRec: false,
      audioAvailable: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      // Make initial keypress time as if it happened 5001 milliseconds in the past.
      keypressTimestamp: new Date().getTime() - KEYPRESS_DELAY - 1
    };

    this.handlePasteEvent = this.handlePasteEvent.bind(this);
    this.handleAttachImage = this.handleAttachImage.bind(this);
    this.handleAttachXlsx = this.handleAttachXlsx.bind(this);
    this.handleAttachFile = this.handleAttachFile.bind(this);
    this.handleAttachAudio = this.handleAttachAudio.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMessageTyping = this.handleMessageTyping.bind(this);

    this.handleQuoteClick = this.handleQuoteClick.bind(this);

    this.formatReply = this.formatReply.bind(this);

  }

  selectDemo(value){
    this.props.onSendMessage(value);
    this.setState({message: ''});
  }

  dragHandle(){
    const container =  document.querySelector('#messages-container')
    if(container){
      container.addEventListener('drop',(e)=>{
        this.dropHandler(e)
      })

      container.addEventListener('dragover',(e)=>{
        this.dragOverHandler(e)
      })
    }
    
  }

  dropHandler(ev) {
    console.log('File(s) dropped');
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    let fileUpload = null;
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...ev.dataTransfer.items].some((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === 'file' && item.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          const file = item.getAsFile();
          console.log(`… file[${i}].name = ${file.name}`);
          fileUpload = file
          return true
        }
      });
    } else {
      // Use DataTransfer interface to access the file(s)
      [...ev.dataTransfer.files].forEach((file, i) => {
        console.log(`… file[${i}].name = ${file.name}`);
      });
    }

    if(fileUpload){
      this.props.onAttachXlsx(fileUpload);
    }
  }
  dragOverHandler(ev) {
    console.log('File(s) in drop zone');
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  }

  setPasteListener(element){

    if (element.getAttribute('listener') !== 'true') {
      element.addEventListener('paste',this.handlePasteEvent, false);
      element.setAttribute('listener', 'true');
    }

  }
  componentDidMount() {
    if (this.messageEditArea) {
      this.setPasteListener(this.messageEditArea)
    }

    this.setState({quote: this.formatReply()});

    
    this.dragHandle()
  }

  componentWillUnmount() {
    if (this.messageEditArea) {
      this.messageEditArea.removeEventListener('paste', this.handlePasteEvent, false);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.messageEditArea) {
      this.messageEditArea.focus();
      this.setPasteListener(this.messageEditArea)
    }

    if (prevProps.topicName != this.props.topicName) {
      this.setState({message: '', audioRec: false, quote: null});
    }
    if (prevProps.reply != this.props.reply) {
      this.setState({quote: this.formatReply()});
    }
  }

  formatReply() {
    return this.props.reply ?
      Drafty.format(this.props.reply.content, replyFormatter, {
        formatMessage: this.props.intl.formatMessage.bind(this.props.intl),
        authorizeURL: this.props.tinode.authorizeURL.bind(this.props.tinode)
      }) : null;
  }

  getItem(item){
    return new Promise((resolve,reject)=>{
      if(item && item.kind === 'string'){
        item.getAsString((message)=>{
          resolve(message)
        })
      }
    })
  }

  handlePasteEvent(e) {

    const items = (event.clipboardData || event.originalEvent.clipboardData || {}).items;
    if (!items || !items.length) {
      return false;
    }
    const item  = items[0]
    // const itemHTML = items[1]
    const itemHTML = e.clipboardData.getData('text/html');

    if(itemHTML && itemHTML.indexOf('xmlns:x="urn:schemas-microsoft-com:office:excel"') > -1){
      this.props.onSendMessage(itemHTML);
      this.setState({message: ''});
      return

    }else if(message.indexOf('<table') > -1 && message.indexOf('<td') > -1){
      item.getAsString((message)=>{
          this.props.onSendMessage(message);
          this.setState({message: ''});
          return
      })
    }

    //   if(itemHTML == null){
    //   item.getAsString((message)=>{
    //     if(message.indexOf('<table') > -1 && message.indexOf('<td') > -1){
    //       this.props.onSendMessage(message);
    //       this.setState({message: ''});
    //     }
    //   })
    // }else{
    //   Promise.all([this.getItem(item), this.getItem(itemHTML)]).then((values) => {
    //     const text = values[0]
    //     const html = values[1]
    //     console.log('html===',html)
    //       if(html && html.indexOf('xmlns:x="urn:schemas-microsoft-com:office:excel"') > -1){
    //         this.props.onSendMessage(html);
    //         this.setState({html: ''});
    //       }else if(text && text.indexOf('<table') > -1 && message.indexOf('<td') > -1){
    //         this.props.onSendMessage(text);
    //         this.setState({text: ''});
    //       }
    //   });
    // }

    // if (this.props.disabled) {
    //   return;
    // }
    // FIXME: handle large files too.
    if (filePasted(e,
      file => { this.props.onAttachImage(file); },
      file => { this.props.onAttachFile(file); },
      file => { this.props.onAttachXlsx(file); },
      this.props.onError)) {

      // If a file was pasted, don't paste base64 data into input field.
      e.preventDefault();
    }
  }

  handleAttachImage(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.props.onAttachImage(e.target.files[0]);
    }
    // Clear the value so the same file can be uploaded again.
    e.target.value = '';
  }
  handleAttachXlsx(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.props.onAttachXlsx(e.target.files[0]);
    }
    // Clear the value so the same file can be uploaded again.
    e.target.value = '';
  }
  handleAttachTable() {
    const message = "table"
    this.props.onSendMessage(message);
    this.setState({message: ''});
    
  }

  handleAttachFile(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.props.onAttachFile(e.target.files[0]);
    }
    // Clear the value so the same file can be uploaded again.
    e.target.value = '';
  }

  handleAttachAudio(url, preview, duration) {
    this.setState({audioRec: false});
    this.props.onAttachAudio(url, preview, duration);
  }

  handleSend(e) {
    e.preventDefault();
    const message = this.state.message.trim();
    if (message || this.props.acceptBlank || this.props.noInput) {
      this.props.onSendMessage(message);
      this.setState({message: ''});
    }
  }

  /* Send on Enter key */
  handleKeyPress(e) {
    if (this.state.audioRec) {
      // Ignore key presses while audio is being recorded.
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Remove this if you don't want Enter to trigger send
    if (e.key === 'Enter') {
      // Have Shift-Enter insert a line break instead
      if (!e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();

        this.handleSend(e);
      }
    }
  }

  handleMessageTyping(e) {
    const newState = {message: e.target.value};
    if (this.props.onKeyPress) {
      const now = new Date().getTime();
      if (now - this.state.keypressTimestamp > KEYPRESS_DELAY) {
        this.props.onKeyPress();
        newState.keypressTimestamp = now;
      }
    }
    this.setState(newState);
  }

  handleQuoteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.reply && this.props.onQuoteClick) {
      const replyToSeq = this.props.reply.seq;
      this.props.onQuoteClick(replyToSeq);
    }
  }

  render() {
    const { formatMessage } = this.props.intl;
    const prompt = this.props.disabled ?
      formatMessage(messages.messaging_disabled) :
      (this.props.messagePrompt ?
        formatMessage(messages[this.props.messagePrompt]) :
        formatMessage(messages.type_new_message));

    const quote = this.state.quote ?
      (<div id="reply-quote-preview">
        <div className="cancel">
          <a href="#" onClick={(e) => {e.preventDefault(); this.props.onCancelReply();}}><i className="material-icons gray">close</i></a>
        </div>
        {this.state.quote}
      </div>) : null;
    const audioEnabled = this.state.audioAvailable && this.props.onAttachAudio;
    return (
      <div id="send-message-wrapper">
        {!this.props.noInput ? quote : null}
        <div id="send-message-panel">
          {!this.props.disabled ?
            <>
              {this.props.onAttachFile && !this.state.audioRec ?
                <>
                  <a href="#" onClick={(e) => {e.preventDefault(); this.attachImage.click();}} title="Add image">
                    <i className="material-icons secondary">photo</i>
                  </a>
                  {/* <a href="#" onClick={(e) => {e.preventDefault(); this.attachFile.click();}} title="Attach file">
                    <i className="material-icons secondary">attach_file</i>
                  </a> */}
                  <a href="#" onClick={(e) => {e.preventDefault(); this.attachXlsx.click();}} title="Attach excel">
                    <i className="material-icons secondary">attach_file</i>
                  </a>
                  <a href="#" onClick={(e) => {e.preventDefault(); this.handleAttachTable();}} title="Add table">
                    <i className="material-icons secondary">table</i>
                  </a>

                  <select name="pets" id="pet-select" onChange={(e)=>{this.selectDemo(e.target.value)}}>
                      <option value="">DEMO</option>
                      <option value="DEMO1">DEMO1</option>
                      <option value="DEMO2">DEMO2</option>
                      <option value="DEMO3">DEMO3</option>
                      <option value="DEMO4">DEMO4</option>
                      <option value="DEMO5">DEMO5</option>
                      <option value="DEMO6">DEMO6</option>
                      <option value="DEMO7">DEMO7</option>
                      <option value="DEMO8">DEMO8</option>
                      <option value="Doc">Doc</option>
                      <option value="Slide">Slide</option>
                  </select>
                </>
                :
                null}
              {this.props.noInput ?
                (quote || <div className="hr thin" />) :
                (this.state.audioRec ?
                  <AudioRecorder
                    onDeleted={_ => this.setState({audioRec: false})}
                    onFinished={this.handleAttachAudio}/> :
                  <textarea id="sendMessage" placeholder={prompt}
                    value={this.state.message} onChange={this.handleMessageTyping}
                    onKeyPress={this.handleKeyPress}
                    ref={(ref) => {this.messageEditArea = ref;}}
                    autoFocus />)}
              {this.state.message || !audioEnabled ?
                <a href="#" onClick={this.handleSend} title="Send">
                  <i className="material-icons">send</i>
                </a> :
                !this.state.audioRec ?
                  <a href="#" onClick={e => {e.preventDefault(); this.setState({audioRec: true})}} title="Voice">
                    <i className="material-icons">mic</i>
                  </a> :
                  null
              }
              <input type="file" ref={(ref) => {this.attachFile = ref;}}
                onChange={this.handleAttachFile} style={{display: 'none'}} />
              <input type="file" ref={(ref) => {this.attachImage = ref;}} accept="image/*"
                onChange={this.handleAttachImage} style={{display: 'none'}} />
              <input type="file" ref={(ref) => {this.attachXlsx = ref;}} accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={this.handleAttachXlsx} style={{display: 'none'}} />
            </>
            :
            <div id="writing-disabled">{prompt}</div>
          }
        </div>
      </div>
    );
  }
};

export default injectIntl(SendMessage);
