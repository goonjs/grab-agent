'use strict';

import React, { Component } from 'react';
import { StyleSheet, View, Text, AlertIOS } from 'react-native';
import { bindActionCreators } from 'redux';
import RequestList from '../components/requestList';
import RequestDetail from '../components/requestDetail';
import { connect } from 'react-redux';

import '../../UserAgent';
import io from 'socket.io-client/socket.io';

class MobileApp extends Component {
  componentWillMount() {
    this.socket = io('http://localhost:3700', {jsonp: false});
    this.socket.on('connect', this.props.onSocketConnect);
    this.socket.on('disconnect', this.props.onSocketDisconnect);
    this.socket.on('consumer_enquiry', this.refresh.bind(this));

    this.refresh();
  }

  refresh() {
    fetch('http://localhost:4300/api/get-enquiries')
      .then((response) => response.json())
      .then((responseData) => {
        this.props.onRefresh(responseData);
      });
  }

  messageChange(item) {
    fetch('http://localhost:4300/api/agent_typing', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: item.key })
    });
    //this.socket.emit('typing', { item: item });
  }

  submit(item, message) {
    item.message = message;
    fetch('http://localhost:4300/api/agent_response', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item)
    }).then(() => {
      this.props.onReset();
    });
    //this.socket.emit('response', { item: item });
  }

  cancel(item) {
    fetch('http://localhost:4300/api/agent_cancel', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: item.key })
    }).then(() => {
      this.props.onReset();
    });
    // this.socket.emit('cancel', { item: item });
  }

  render() {
    return (
      <View style={styles.container}>
        <View>

        </View>

        <View>
          {this.props.detail.item ?
            <RequestDetail
              item={this.props.detail.item}
              onChangeMessage={this.messageChange.bind(this, this.props.detail.item)}
              onSubmit={this.submit.bind(this, this.props.detail.item)}
              onCancel={this.cancel.bind(this, this.props.detail.item)} />
          :
            <RequestList
              list={this.props.list}
              onSelect={this.props.onListItemSelect} />
          }
        </View>

        <Text style={styles.status}>
          Server {this.props.socket.connected ?
            'connected'
          :
            'disconnected'
          }
        </Text>
      </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  status: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default connect(state => ({
    list: state.list,
    detail: state.detail,
    socket: state.socket
  }),
  (dispatch) => {
    return {
      onSocketConnect: () => {
        return dispatch({ type: 'CONNECT' });
      },
      onSocketDisconnect: () => {
        return dispatch({ type: 'DISCONNECT' });
      },
      onRefresh: (data) => {
        return dispatch({ type: 'REFRESH', list: data });
      },
      onListItemSelect: (item) => {
        return dispatch({ type: 'SET', item: item });
      },
      onReset: () => {
        return dispatch({ type: 'RESET' });
      }
    }
  }
)(MobileApp);
