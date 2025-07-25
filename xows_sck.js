/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
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
 *                     Copyright (c) 2022 Eric M.
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
"use strict";
/* ------------------------------------------------------------------
 *
 *                      WebSocket API Layer
 *
 * ------------------------------------------------------------------ */
/**
 * Socket error codes
 */
const XOWS_SOCK_CLOS = 0x000;
const XOWS_SOCK_FAIL = 0x020;

/**
 * Reference to created WebSocket connection object
 */
let xows_sck_sock = null;

/**
 * WebSocket service connection URL
 */
let xows_sck_url = null;

/**
 * WebSocket service connection Protocol
 */
let xows_sck_prot = null;

/**
 * Reference to custom event callback function for socket open
 */
let xows_sck_fw_onopen = function() {};

/**
 * Reference to custom event callback function for data received
 */
let xows_sck_fw_onrecv = function() {};

/**
 * Reference to callback function for received socket closed
 */
let xows_sck_fw_onclose = function() {};

/**
 * Set custom callback function for socket event
 *
 * The possible event type are the following:
 *  - open   : Socket successfully opened
 *  - recv   : Socket received data
 *  - close  : Socket closed
 *
 * @param   {string}    type      Event type to assign callback to
 * @param   {function}  callback  Function to set as callback
 */
function xows_sck_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase()) {
    case "open":  xows_sck_fw_onopen = callback; break;
    case "recv":  xows_sck_fw_onrecv = callback; break;
    case "close": xows_sck_fw_onclose = callback; break;
    case "error": xows_sck_fw_onerror = callback; break;
  }
}

/**
 * WebSocket object onerror callback
 *
 * @param   {object}    event     Error event
 */
function xows_sck_onerror(event)
{
  // This callback is totally pointless as event reports nothing
  // interesting and the onclose callback is call right after with
  // the few available error data.
  // I leave this here to remember to avoid trying doing something
  // with it
}

/**
 * WebSocket object onclose callback
 *
 * @param   {object}    event     Close event
 */
function xows_sck_onclose(event)
{
  let text, code = XOWS_SOCK_CLOS;

  // WebSocket API is not prolix on error reporting (this become an habit with
  // JavaScript APIs).
  // Experience showed that the Event's "reason" property is usualy empty
  // (never seen anything in) while the most commons (if not only ones) error
  // codes reported are 1000 for "happy close" or 1006 for "something went
  // wrong, now, guess what".
  // The 1006 code can be reported for any connection faillure like network
  // unreachable, NXDOMAIN, connection refused, connection lost, etc.

  if(event.code !== 1000) { //< not normal close

    code = XOWS_SOCK_FAIL;

    switch(event.code)
    {
    case 1001: text = "Going Away"; break;
    case 1002: text = "Protocol error"; break;
    case 1003: text = "Unsupported Data"; break;
    case 1004: text = "Reserved"; break;
    case 1005: text = "No Status Rcvd"; break;
    case 1006: text = "Abnormal Closure"; break; //< most common error, never see another
    case 1007: text = "Invalid frame payload data"; break;
    case 1008: text = "Policy Violation"; break;
    case 1009: text = "Message Too Big"; break;
    case 1010: text = "Mandatory Ext."; break;
    case 1011: text = "Internal Error"; break;
    case 1012: text = "Service Restart"; break;
    case 1013: text = "Try Again Later"; break;
    case 1014: text = "Bad Gateway"; break;
    case 1015: text = "TLS handshake"; break;
    default: text = "Unknow error ("+event.code+")";
    }

  } else {
    text = "socket closed";
  }

  // Output log
  xows_log(code ? 0 : 2,"sck_onclose", text);

  // destroy socket object
  xows_sck_sock = null;

  // Forward socket closed
  xows_sck_fw_onclose(code, text);
}

/**
 * WebSocket object onopen callback
 *
 * @param   {object}    event     Open event
 */
function xows_sck_onopen(event)
{
  xows_log(2,"sck_onopen","socket connected");

  // Forward to custom callback
  xows_sck_fw_onopen();
}

/**
 * WebSocket object onmessage callback
 *
 * @param   {object}    event     Message event
 */
function xows_sck_onmesg(event)
{
  xows_log(3,"sck_recv",event.data,null,"#AB5655");

  // Forward to custom callback
  xows_sck_fw_onrecv(event.data);
}

/**
 * Setup a new WebSocket connection parameters
 *
 * @param   {string}    url       WS service URL
 * @param   {string[]}  protocols Sub-protocols to select on WS service
 */
function xows_sck_setup(url, protocols)
{
  xows_log(2,"sck_setup","setup new connection",url);

  // Store connection URL
  xows_sck_url = url;
  xows_sck_prot = protocols;
}

/**
 * Create new WebSocket instance to open socket
 */
function xows_sck_connect()
{
  // Create new WebSocket object (open connection)
  xows_sck_sock = new WebSocket(xows_sck_url, xows_sck_prot);

  // assing callback to WebSocket object
  xows_sck_sock.onclose = xows_sck_onclose;
  xows_sck_sock.onerror = xows_sck_onerror;
  xows_sck_sock.onmessage = xows_sck_onmesg;
  xows_sck_sock.onopen = xows_sck_onopen;

  xows_log(2,"sck_connect","socket connecting",xows_sck_url);
}

/**
 * Close WebSocket connection an destroy object
 */
function xows_sck_close()
{
  if(xows_sck_sock) {
    xows_log(2,"sck_close","closing connection");
    xows_sck_sock.close();
    xows_sck_sock = null;
  }
}

/**
 * Send data to WebSocket socket
 *
 * @param   {string}    data      Text data to send
 */
function xows_sck_send(data)
{
  xows_sck_sock.send(data);
  xows_log(3,"sck_send",data,null,"#55ABAB");
}
