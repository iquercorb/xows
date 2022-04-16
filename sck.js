/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                        v0.9.0 - (Jan. 2021)
 *                          ____       ____
 *                          \   \     /   /
 *                           \    \_/    /
 *                      .   .-           -.   .
 *                     /|  /   -.     .-   \  |\
 *                    | \_/  |___\   /___|  \_/ |
 *                    .                         .
 *                     \.__       ___       __./
 *                         /     /   \     \ 
 *                        /_____/     \_____\
 *         
 *                 Copyright (c) 2020 - 2021 Eric M.
 * 
 *     This file is part of X.O.W.S (XMPP Over WebSocket Library).
 * 
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 * 
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source
 * 
 * @licend
 */
 
/* ------------------------------------------------------------------
 * 
 *                      WebSocket API Layer
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Reference to created WebSocket connection object.
 */
let xows_sck_sock = null;

/**
 * WebSocket service connection URL.
 */
let xows_sck_url = null;

/**
 * Reference to custom event callback function for socket open.
 */
let xows_sck_fw_onopen = function() {};

/**
 * Reference to custom event callback function for data received.
 */
let xows_sck_fw_onrecv = function() {};

/**
 * Reference to callback function for received socket closed.
 */
let xows_sck_fw_onclose = function() {};

/**
 * Set custom callback function for socket event. The possible event
 * type are the following:
 * - open   : Socket successfully opened.
 * - recv   : Socket received data.
 * - close  : Socket closed.
 * 
 * @param   {string}    type      Event type to assign callback to.
 * @param   {function}  callback  Function to set as callback.
 */
function xows_sck_set_callback(type, callback)
{
  if(!xows_is_func(callback))
    return;
    
  switch(type.toLowerCase()) {
    case "open":  xows_sck_fw_onopen = callback; break;
    case "recv":  xows_sck_fw_onrecv = callback; break;
    case "close": xows_sck_fw_onclose = callback; break;
  }
}

/**
 * WebSocket object onerror callback.
 * 
 * @param   {object}  event   Error event
 */
function xows_sck_error(event)
{
  xows_log(0,"sck_error","Socket connection error");
  //const err_msg = "Socket connection error";
  //xows_sck_fw_onclose(XOWS_SIG_ERR,err_msg); //< Close with error
  //xows_sck_sock = null; //< destroy socket object
}

/**
 * WebSocket object onclose callback.
 * 
 * @param   {object}  event   Close event
 */
function xows_sck_closed(event)
{
  if(event.code !== 1000) { //< normal close
    
    let err_msg;
    
    switch(event.code)
    {
    case 1001: err_msg = "Going Away"; break;
    case 1002: err_msg = "Protocol error"; break;
    case 1003: err_msg = "Unsupported Data"; break;
    case 1004: err_msg = "Reserved"; break;
    case 1005: err_msg = "No Status Rcvd"; break;
    case 1006: err_msg = "Abnormal Closure"; break;
    case 1007: err_msg = "Invalid frame payload data"; break;
    case 1008: err_msg = "Policy Violation"; break;
    case 1009: err_msg = "Message Too Big"; break;
    case 1010: err_msg = "Mandatory Ext."; break;
    case 1011: err_msg = "Internal Error"; break;
    case 1012: err_msg = "Service Restart"; break;
    case 1013: err_msg = "Try Again Later"; break;
    case 1014: err_msg = "Bad Gateway"; break;
    case 1015: err_msg = "TLS handshake"; break;
    default: err_msg = "Unhandled error ("+event.code+")";
    }

    xows_log(0,"sck_closed",err_msg);
    xows_sck_fw_onclose(XOWS_SIG_ERR,"Socket connection error"); //< Close with error
  } else {
    xows_log(2,"sck_closed","socket closed");
    xows_sck_fw_onclose(3); //< Close without error
  }
  // destroy socket object
  xows_sck_sock = null;
}

/**
 * WebSocket object onopen callback.
 * 
 * @param   {object}  event   Open event
 */
function xows_sck_opened(event)
{
  xows_log(2,"sck_opened","socket connected");
  
  // Forward to custom callback
  xows_sck_fw_onopen();
}

/**
 * WebSocket object onmessage callback.
 * 
 * @param   {object}  event   Message event
 */
function xows_sck_recv(event)
{
  xows_log(3,"sck_recv",event.data,null,"#AB5655");
  
  // Forward to custom callback
  xows_sck_fw_onrecv(event.data);
}

/**
 * Create a new WebSocket object and open connection.
 * 
 * @param   {string}    url        WS service URL
 * @param   {string[]}  protocols  Sub-protocols to select on WS service.
 */
function xows_sck_create(url, protocols)
{
  xows_log(3,"sck_create","socket connecting",url);
  
  // Store connection URL
  xows_sck_url = url;

  // Create new WebSocket object (open connection)
  xows_sck_sock = new WebSocket(xows_sck_url, protocols);
  
  // assing callback to WebSocket object
  xows_sck_sock.onerror = xows_sck_error;
  xows_sck_sock.onopen = xows_sck_opened;
  xows_sck_sock.onclose = xows_sck_closed;
  xows_sck_sock.onmessage = xows_sck_recv;
}

/**
 * Close WebSocket connection an destroy object
 */
function xows_sck_destroy()
{
  if(xows_sck_sock !== null) {
    xows_log(3,"sck_destroy","closing WebSocket");
    xows_sck_sock.close(); 
    xows_sck_sock = null;
  }
}

/**
 * Send data to WebSocket socket.
 * 
 * @param   {string}  data    Text data to send.
 */
function xows_sck_send(data)
{
  xows_log(3,"sck_send",data,null,"#55ABAB");
  xows_sck_sock.send(data);
}
