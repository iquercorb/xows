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
 *                  Copyright (c) 2019-2025 Eric M.
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
/* ---------------------------------------------------------------------------
 *
 * XMPP Module
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for XMPP connection error codes
 */
const XOWS_XMPP_FAIL = 0x040;   //< Stream or session error
const XOWS_XMPP_AUTH = 0x080;   //< Authentication error
const XOWS_XMPP_REGI = 0x100;   //< Registration error
const XOWS_XMPP_HGUP = 0x200;   //< Unexpected connection close

/**
 * Storage for current connection WebSocket address
 */
let xows_xmp_addr = null;

/**
 * Storage for session authentication data
 */
const xows_xmp_auth = {"bare":null,"user":null,"pass":null,"save":false,"regi":false};

/**
 * Storage for current session host domain
 */
let xows_xmp_host = null;

/**
 * Storage for session resource/bind data
 */
const xows_xmp_bind = {"full":null,"bare":null,"node":null,"resc":null};

/**
 * Global flag for session/connection status
 */
let xows_xmp_sess = false;

/* ---------------------------------------------------------------------------
 *
 * Module Events Configuration
 *
 * ---------------------------------------------------------------------------*/
/**
 * Module Event-Forwarding callback for Unhandled error received
 */
let xows_xmp_fw_onerror = function() {};

/**
 * Set callback functions for Module events.
 *
 * The possible events are the following:
 *
 *  - session   : XMPP Session open
 *  - presence  : Contact presence
 *  - subscrib  : Contact subscribe request
 *  - occupant  : Room occupant presence
 *  - roster    : Roster push (add or remove Contact)
 *  - message   : Common chat messages with body
 *  - chatstate : Chat states messages
 *  - receipt   : Message receipts
 *  - subject   : Room subject
 *  - pubsub    : Received PubSub event
 *  - error     : Received error
 *  - close     : Session close
 *
 * @param   {string}    event     Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_xmp_set_callback(event, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(event.toLowerCase()) {
    case "sessready": xows_xmp_fw_sess_onready = callback; break;
    case "sessclose": xows_xmp_fw_sess_onclose = callback; break;
    case "rostpush":  xows_xmp_fw_rost_onrecv = callback; break;
    case "presrecv":  xows_xmp_fw_pres_onrecv = callback; break;
    case "pressubs":  xows_xmp_fw_pres_onsubs = callback; break;
    case "presfail":  xows_xmp_fw_pres_onfail = callback; break;
    case "presmuco":  xows_xmp_fw_pres_onmuco = callback; break;
    case "msgrecv":   xows_xmp_fw_msg_onrecv = callback; break;
    case "msgchst":   xows_xmp_fw_msg_onchst = callback; break;
    case "msgrecp":   xows_xmp_fw_msg_onrecp = callback; break;
    case "msgretr":   xows_xmp_fw_msg_onretr = callback; break;
    case "msgpubs":   xows_xmp_fw_msg_onpubs = callback; break;
    case "mucsubj":   xows_xmp_fw_muc_onsubj = callback; break;
    case "mucnoti":   xows_xmp_fw_muc_onnoti = callback; break;
    case "jingrecv":  xows_xmp_fw_jing_onecv = callback; break;
    case "error":     xows_xmp_fw_onerror = callback; break;
  }
}

/* -------------------------------------------------------------------
 *
 * Utilities functions
 *
 * -------------------------------------------------------------------*/
/**
 * Creates a new Internal Message object.
 *
 * This creates a new dictionary object that represents a received or sent
 * XMPP chat message. Such objects are used to store and transfert parsed
 * message data from and to the Module.
 *
 * @param   {string}    id      Message 'id' attribute
 * @param   {string}    to      Message 'to' attribute
 * @param   {string}    from    Message 'from' attribute
 * @param   {string}    type    Message 'type' attribute
 * @param   {string}   [body]   Optional Message <body> node text content
 * @param   {string}   [xoob]   Optional Out Of Band Data URI
 * @param   {string}   [time]   Optional Message parsed or created time
 * @param   {string}   [recp]   Optional Receipt <received> node 'id' attribute
 * @param   {string}   [retr]   Optional Retract <retract> node 'id' attribute
 * @param   {string}   [repl]   Optional Correction <replace> node 'id' attribute
 * @param   {string}   [rpid]   Optional Replies <reply> node 'id' attribute
 * @param   {string}   [rpto]   Optional Replies <reply> node 'to' attribute
 * @param   {string}   [orid]   Optional UID <origin-id> node 'id' attribute
 * @param   {string}   [szid]   Optional UID <stanza-id> node 'id' attribute
 * @param   {string}   [ocid]   Optional MUC <occupant-id> node 'id' attribute
 * @param   {string}   [page]   Optional MAM Result (Page) 'id' attribute
 */
function xows_xmp_message_forge(id, to, from, type, body, xoob, time, recp, retr, repl, rpid, rpto, orid, szid, ocid, page)
{
  // Set default time
  if(!time) time = new Date().getTime();

  // Create message object
  return {
    "id":id,        //< Message ID
    "to":to,        //< Message recipient
    "from":from,    //< Message sender
    "type":type,    //< Message type
    "body":body,    //< Body content
    "xoob":xoob,    //< Out Of Band URI
    "time":time,    //< Message time
    "recp":recp,    //< Message Receipt
    "retr":retr,    //< Retract message ID
    "repl":repl,    //< Replace message ID
    "rpid":rpid,    //< Reply message ID
    "rpto":rpto,    //< Reply message Author Address
    "orid":orid,    //< Embeded origin-id
    "szid":szid,    //< Embeded stanza-id
    "ocid":ocid,    //< Embeded occupant-id
    "page":page     //< RMS page number
  };
}

/**
 * Parses the given error result <iq> stanza and generate generic log output.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {number}    level     Log level to set
 * @param   {string}    scope     Message origin, scope or context
 *
 * @return  {string}    Generated error details text
 */
function xows_xmp_error_log(stanza, level, scope)
{
  let details;

  // Get inner <error> child and try to find <text>
  const error = stanza.querySelector("error");
  if(error) {

    // Check for <condition> child
    const cond = xows_xml_ns_select(error, XOWS_NS_IETF_STANZAS);
    if(cond) details = xows_xml_beatify_tag(cond.tagName);

    // Check for <text> child (error message)
    const text = error.querySelector("text");
    if(text) details += ": " + xows_xml_innertext(text);
  }

  xows_log(level,scope,"query ("+stanza.getAttribute("id")+") error",details);

  return details;
}

/**
 * Parses the given error result <iq> and returns the parsed error as
 * object.
 *
 * Generated object has the following properties:
 *    code : "code" attribute of <error> node
 *    type : "type" attribute of <error> node
 *    name : Tag name of <error> node's child (eg. "bad-request" ... )
 *    text : Inner text of <error> node's child.
 *
 * @param   {element}   stanza    Received <iq> stanza
 *
 * @return  {object}    Parsed error generic data
 */
function xows_xmp_error_parse(stanza)
{
  let data = null;

  // Get inner <error> child
  const error = stanza.querySelector("error");
  if(error) {
    data = {};
    // Check for "code" attribute
    if(error.hasAttribute("code"))
      data.code = error.getAttribute("code");
    // Check for "type" attribute
    if(error.hasAttribute("type"))
      data.type = error.getAttribute("type");

    // Check for <condition> child
    const cond = xows_xml_ns_select(error, XOWS_NS_IETF_STANZAS);
    data.name = cond ? cond.tagName : "";

    // Check for <text> child (error message)
    const text = error.querySelector("text");
    data.text = text ? xows_xml_innertext(text) : "";
  }

  return data;
}

/* -------------------------------------------------------------------
 *
 * Connect / Disconnect
 *
 * -------------------------------------------------------------------*/
/**
 * Resets all session and connection parameters to initial state.
 *
 * @param   {boolean}   auth    Indicate to reset auth data
 */
function xows_xmp_reset(auth = true)
{
  // Session disconnected
  xows_xmp_sess = false;

  // Reset server parameters
  xows_xmp_addr = null;
  xows_xmp_host = null;

  // Reset stream-management data
  xows_xmp_sm3_reset();

  if(auth) {
    // Reset auth data
    xows_xmp_auth.jbar = null;
    xows_xmp_auth.user = null;
    xows_xmp_auth.pass = null;
    xows_xmp_auth.save = false;
    xows_xmp_auth.regi = false;
  }

  // Reset session data
  xows_xmp_bind.jbar = null;
  xows_xmp_bind.jful = null;
  xows_xmp_bind.node = null;
  xows_xmp_bind.resc = null;
}

/**
 * Attempts to connect and login XMPP session at specified WebSocket address.
 *
 * @param   {string}    url       Server WebSocket address/URL
 * @param   {string}    jid       Authentication JID (user@domain)
 * @param   {string}    pass      Authentication password
 * @param   {boolean}   save      Indicates to save credentials for auto-login
 * @param   {boolean}   regi      Indiractes to proceed new account registration
 */
function xows_xmp_connect(url, jid, pass, save, regi)
{
  // if socket already openned, close it
  xows_sck_close();

  // Reset to initial state
  xows_xmp_reset();

  // Set callbacks for socket events
  xows_sck_set_callback("open",  xows_xmp_sck_onopen);
  xows_sck_set_callback("recv",  xows_xmp_sck_onrecv);
  xows_sck_set_callback("close", xows_xmp_sck_onclose);

  // store connexion url
  xows_xmp_addr = url;

  // Split JID into user and domain parts
  const jid_split = jid.split("@");

  // Verify we got a well formed JID
  xows_xmp_host = null;
  if(jid_split[1] !== undefined)
    if(jid_split[1].length !== 0)
      xows_xmp_host = jid_split[1];

  if(xows_xmp_host === null) {
    xows_log(0,"xmp_connect","wrong JID format");
    xows_xmp_failure(XOWS_XMPP_AUTH, "invalid username (JID domain missing)");
    return;
  }

  // store authentication data
  xows_xmp_auth.jbar = jid;
  xows_xmp_auth.user = jid_split[0];
  xows_xmp_auth.pass = pass;
  xows_xmp_auth.save = save;
  xows_xmp_auth.regi = regi;

  // Setup new WebSocket connection
  xows_sck_setup(url, "xmpp");

  // Open connection
  xows_sck_connect();
}

let xows_xmp_resume_pnd = false;

/**
 * Attempts to resume XMPP session.
 *
 * Uses the previousely stored WebSocket address and authantication data to
 * reconnect server then try to recover an interrupted XMPP session.
 */
function xows_xmp_resume()
{
  // Output log
  xows_log(2,"xmp_resume","try reconnect");

  // close socket
  xows_sck_close();

  // Open connection
  xows_sck_connect();
}

/**
 * Throws XMPP session/connection failure.
 *
 * This is used internally by the Module to throw a connection or session
 * failure. Triggered scenario depend on current session state.
 *
 * Failure that occure during a valid session trigger a connection/session
 * recover scenario, otherwise this is a connection attempt failure (either due
 * to authentication failure or stream negotiation problem).
 *
 * @parma   {number}    code      Failure code
 * @param   {string}   [text]     Optional information or error message
 */
function xows_xmp_failure(code, text)
{
  xows_log(2,"xmp_failure","connection failure",text);

  // Check for valid session running
  if(xows_xmp_sess) {

    // Session is over
    xows_xmp_sess = false;

    xows_xmp_resume_pnd = true;

  } else {

    if(!xows_xmp_resume_pnd) {

      // Reset to initial state
      xows_xmp_reset();

      // Close session with server
      xows_xmp_fram_close_send();
    }
  }

  // Forward close with failure
  xows_xmp_fw_sess_onclose(code, text);
}

/**
 * Closes the XMPP session.
 */
function xows_xmp_disconnect()
{
  // This is a session lost
  xows_log(2,"xmp_disconnect","user disconnect");

  // Reset to initial state
  xows_xmp_reset();

  // Reset pending connection recover
  xows_xmp_resume_pnd = false;

  // Close session with server
  xows_xmp_fram_close_send();

  // Forward session cloded
  xows_xmp_fw_sess_onclose(0);
}

/**
 * Closes fastly and without precaution the XMPP session.
 *
 * This is special session close procedure used in case user closed the
 * web-client window or tab (unload event) to (try to) properly close
 * session with server in quickest way possible.
 */
function xows_xmp_onuload()
{
  // Ignore if no socket available
  if(!xows_sck_sock)
    return;

  // Session is over
  xows_xmp_sess = false;

  // Send unavailable <presence> stanza
  xows_sck_sock.send("<presence xmlns='jabber:client' type='unavailable'/>");

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.6

  // Send the <close> stanza to close stream
  xows_sck_sock.send("<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>");
}

/* ---------------------------------------------------------------------------
 *
 * Socket Management
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles Socket open event.
 *
 * This triggers the XMPP stream open scenario.
 */
function xows_xmp_sck_onopen()
{
  // Initialize XMPP session open
  xows_xmp_fram_open_send();
}

/**
 * Handles Socket close event.
 *
 * @parma   {number}    code      Socket error code or 0
 * @param   {string}   [text]     Optional error message
 */
function xows_xmp_sck_onclose(code, text)
{
  if(code) { //< Connection error

    // If socket close is on error and resource is bound, this
    // mean the socket close occurred during a valid session
    if(xows_xmp_sess) {
      xows_log(1,"xmp_sck_onclose","connection lost");
      code |= XOWS_XMPP_HGUP;
    } else {
      xows_log(1,"xmp_sck_onclose","connection failled");
      code |= XOWS_XMPP_FAIL;
    }

    xows_xmp_failure(code, "unable to connect to remote server");
  }
}

/* ---------------------------------------------------------------------------
 *
 * Stanza Send and Receive
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Jabber Client namespace
 */
const XOWS_NS_CLIENT       = "jabber:client";

/**
 * Handles Socket received message event.
 *
 * This parses the raw data as XML then forwards it to the proper processing
 * function according stanza type.
 *
 * @param   {string}    data      Received data
 */
function xows_xmp_sck_onrecv(data)
{
  // Get stanza object tree from raw XML string
  const stanza = xows_xml_parse(data).firstChild;
  const name = stanza.tagName;

  // Session management ack
  if(name === "a") return xows_xmp_sm3_a_recv(stanza);
  if(name === "r") return xows_xmp_sm3_r_recv(stanza);
  xows_xmp_sm3_handle_recv(); //< increase stream-management received counter

  // Session common stanzas
  if(name === "iq") return xows_xmp_iq_recv(stanza);
  if(name === "message") return xows_xmp_message_recv(stanza);
  if(name === "presence") return xows_xmp_presence_recv(stanza);

  // SASL process stanzas
  if(name === "challenge") return xows_xmp_sasl_challenge_recv(stanza);
  if(name === "success") return xows_xmp_sasl_success_recv(stanza);
  if(name === "failure") return xows_xmp_sasl_failure_recv(stanza);

  // Framing and stream stanzas
  if(name === "open")  return xows_xmp_fram_open_recv(stanza);
  if(name === "close") return xows_xmp_fram_close_recv(stanza);
  if(name === "stream:error") return xows_xmp_stream_error_recv(stanza);
  if(name === "stream:features") return xows_xmp_stream_features_recv(stanza);
  if(name === "enabled") return xows_xmp_sm3_enabled_recv(stanza);
  if(name === "failed") return xows_xmp_sm3_failed_recv(stanza);
  if(name === "resumed") return xows_xmp_sm3_resumed_recv(stanza);

  xows_log(1,"xmp_recv","unprocessed stanza",event.data);
}

/**
 * Storage for temporarily unable to send queued stanzas.
 */
const xows_xmp_send_que = [];

/**
 * Stack for IQ stanza queries result tracking management.
 */
const xows_xmp_query_stack = new Map();

/**
 * Send an XMPP stanza.
 *
 * Query Result tracking and processing:
 *
 * If the 'onresult' parameter is defined, an Query Stack entry is added with
 * the supplied 'onresult' and 'onparse' parameters referenced by the stanza
 * (usually an IQ query) ID.
 * If a stanza with that referenced ID (usually an IQ result or error) is
 * received (it should be), the stanza is forwarded to the 'onresult' callback
 * with the initially defined 'onparse' as second parameter.
 *
 * @param   {element}     stanza      XML node
 * @param   {function}   [onresult]   Callback for query result forwarding
 * @param   {function}   [onparse]    Callback for parsed result forwarding
 */
function xows_xmp_send(stanza, onresult, onparse)
{
  // Add jabber:client namespace
  if(stanza.tagName === "presence" ||
      stanza.tagName === "message" ||
      stanza.tagName === "iq") {
    if(!stanza.namespaceURI)
      stanza.setAttribute("xmlns", XOWS_NS_CLIENT);
  }

  // Add id to stanza
  let id = stanza.getAttribute("id");
  if(!id) {
    id = xows_gen_uuid();
    stanza.setAttribute("id", id);
  }

  // If callaback is supplied, add request to stack
  if(xows_isfunc(onresult))
    xows_xmp_query_stack.set(id,{"onresult":onresult,"onparse":onparse});

  if(xows_sck_sock && xows_xmp_sess) {

    // Send serialized data to socket
    xows_sck_send(xows_xml_serialize(stanza));

    // Stream management ack request
    xows_xmp_sm3_handle_sent();

  } else {

    xows_log(2,"xows_xmp_send","enqueue stanza");

    // Add timestamp for delayed delivery
    const stamp = new Date().toISOString();
    xows_xml_parent(stanza,
      xows_xml_node("delay",{"xmlns":XOWS_NS_DELAY,"stamp":stamp}));

    // Add stanza to queue
    xows_xmp_send_que.push(xows_xml_serialize(stanza));
  }
}

/**
 * Send an XMPP stanza without additionnal check.
 *
 * This function is used to send XMPP low-level stanza to allow to
 * communicate with server while stream is not established yet.
 *
 * This is required since the normal send function enqueue stanzas until
 * socket is open and stream established.
 *
 * @param   {element}     stanza      XML node
 * @param   {function}   [onresult]   Callback for query result forwarding
 */
function xows_xmp_send_raw(stanza, onresult)
{
  if(!xows_sck_sock) {
    xows_log(0,"xmp_send_raw","socket is closed");
    return;
  }

  if(stanza.tagName === "iq") {

    if(!stanza.namespaceURI)
      stanza.setAttribute("xmlns", XOWS_NS_CLIENT);

    // Add id to stanza
    let id = stanza.getAttribute("id");
    if(!id) {
      id = xows_gen_uuid();
      stanza.setAttribute("id", id);
    }

    // If callaback is supplied, add request to stack
    if(xows_isfunc(onresult))
      xows_xmp_query_stack.set(id,{"onresult":onresult,"onparse":null});
  }

  // Send serialized data to socket
  xows_sck_send(xows_xml_serialize(stanza));
}

/**
 * Flushes stanza queue, sending all pending stanzas stored
 * during connection loss.
 */
function xows_xmp_flush()
{
  if(!xows_sck_sock) {
    xows_log(0,"xmp_send_raw","socket is closed");
    return;
  }

  xows_log(2,"xows_xmp_flush","flushing stanzas queue");

  while(xows_xmp_send_que.length)
    // Send serialized data to socket
    xows_sck_send(xows_xmp_send_que.shift());
}

/* ---------------------------------------------------------------------------
 *
 * XMPP Subprotocol for WebSocket (RFC-7395)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for XMPP Subprotocol for WebSocket (RFC-7395) XMLNS
 */
const XOWS_NS_IETF_FRAMING = "urn:ietf:params:xml:ns:xmpp-framing";

/**
 * Parses received Framing Open stanza (RFC-7395 Subprotocol for WebSocket)
 *
 * @param   {element}   stanza    Received <open> stanza
 */
function xows_xmp_fram_open_recv(stanza)
{
  // Check for proper version & XMLNS
  if(stanza.getAttribute("version") !== "1.0" || stanza.namespaceURI !== XOWS_NS_IETF_FRAMING) {
    xows_log(0,"xmp_fram_open_recv", "invalid server framing");
    xows_xmp_failure(XOWS_XMPP_FAIL, "invalid server framing");
  }

  return true;
}

/**
 * Sends Framing Open stanza (RFC-7395 Subprotocol for WebSocket)
 */
function xows_xmp_fram_open_send()
{
  xows_log(2,"xmp_fram_open_send","open stream");

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.3

  // Send the first <open> stanza to init stream
  xows_sck_send("<open to='"+xows_xmp_host+"' version='1.0' xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>");
}

/**
 * Parses received Framing Close stanza (RFC-7395 Subprotocol for WebSocket)
 *
 * @param   {element}   stanza    Received <close> stanza
 */
function xows_xmp_fram_close_recv(stanza)
{
  if(xows_xmp_sess) {

    // Bound resource mean unexpected close from server
    xows_log(1,"xmp_fram_close_recv","unexpected stream close");

    xows_xmp_failure(XOWS_XMPP_HGUP, "the server closed the stream");

  } else {

    // Normal close reponse from server
    xows_log(2,"xmp_fram_close_recv","stream closed");

    // Close socket
    xows_sck_close();
  }

  return true;
}

/**
 * Sends Framing Close stanza (RFC-7395 Subprotocol for WebSocket)
 */
function xows_xmp_fram_close_send()
{
  if(!xows_sck_sock)
    return;

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.6

  // Some log output
  xows_log(2,"xmp_fram_close_send","closes stream");

  // Send the <close> stanza to close stream
  xows_sck_send("<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>");
}

/* ---------------------------------------------------------------------------
 *
 * XMPP API - XMPP Stream Management (XEP-0198)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for XMPP Stream Management (XEP-0198) XMLNS
 */
const XOWS_NS_SM3 = "urn:xmpp:sm:3";

/**
 * Storage for Stream Management (XEP-0198) data
 */
const xows_xmp_sm3_data = {id:null,max:null,hr:0,hs:0};

/**
 * Storage for Stream Management (XEP-0198) stanzas-tracking processing
 */
const xows_xmp_sm3_track_cnt = {s:0,r:0};

/**
 * Storage for Stream Management (XEP-0198) stanzas-tracking setTimeout handles
 */
const xows_xmp_sm3_track_hto = {s:null,r:null};

/**
 * Resets Stream Management (XEP-0198) related data
 */
function xows_xmp_sm3_reset()
{
  // Reset Stream Management data
  xows_xmp_sm3_data.id = null;
  xows_xmp_sm3_data.max = null;
  xows_xmp_sm3_data.hr = 0;
  xows_xmp_sm3_data.hs = 0;

  // Reset tracking timeout and counters
  if(xows_xmp_sm3_track_hto.r) {
    clearTimeout(xows_xmp_sm3_track_hto.r);
    xows_xmp_sm3_track_hto.r = null;
  }

  if(xows_xmp_sm3_track_hto.s) {
    clearTimeout(xows_xmp_sm3_track_hto.s);
    xows_xmp_sm3_track_hto.s = null;
  }

  xows_xmp_sm3_track_cnt.r = 0;
  xows_xmp_sm3_track_cnt.s = 0;
}

/**
 * Updates count of received handled stanzas for Stream-Management processing.
 *
 * This increases count of received handled stanza starting from received
 * Stream-Management <enabled> and manages periodic Ack reponse sending.
 *
 * As recommended by XEP-0198, an Ack reponse will be sent automatically to
 * server (without request) either each 10 handled stanzas or 60 seconds after
 * the last handled stanza.
 *
 * @param   {boolean}   force     Bypass automated process and send Ack reponse anyway
 */
function xows_xmp_sm3_handle_recv(force)
{
  if(xows_xmp_sm3_track_hto.r) {
    clearTimeout(xows_xmp_sm3_track_hto.r);
    xows_xmp_sm3_track_hto.r = null;
  }

  if(xows_xmp_sess && xows_xmp_sm3_data.id) {

    xows_xmp_sm3_data.hr++;

    if(force || xows_xmp_sm3_track_cnt.r >= 10) {
      // Reset counter and send a request
      xows_xmp_sm3_track_cnt.r = 0;
      xows_sck_send("<a xmlns='urn:xmpp:sm:3' h='"+xows_xmp_sm3_data.hr+"'/>");
    } else {
      // Increase counter
      xows_xmp_sm3_track_cnt.r++;
      // Set timeout to force send a request after 60 seconds
      xows_xmp_sm3_track_hto.r = setTimeout(xows_xmp_sm3_handle_sent, 60000, true);
    }
  }
}

/**
 * Updates count of sent stanzas for Stream-Management processing.
 *
 * This increases count of sent stanza starting from received Stream-Management
 * <enabled> and manages Ack request sending.
 *
 * An Ack request will be sent automatically to server either
 * each 10 sent stanzas or 60 seconds after the last sent stanza.
 *
 * @param   {boolean}   force     Bypass automated process and send Ack request anyway
 */
function xows_xmp_sm3_handle_sent(force)
{
  if(xows_xmp_sm3_track_hto.s) {
    clearTimeout(xows_xmp_sm3_track_hto.s);
    xows_xmp_sm3_track_hto.s = null;
  }

  if(xows_xmp_sess && xows_xmp_sm3_data.id) {
    if(force || xows_xmp_sm3_track_cnt.s >= 10) {
      // Reset counter and send a request
      xows_xmp_sm3_track_cnt.s = 0;
      xows_sck_send("<r xmlns='urn:xmpp:sm:3'/>");
    } else {
      // Increase counter
      xows_xmp_sm3_track_cnt.s++;
      // Set timeout to force send a request after 60 seconds
      xows_xmp_sm3_track_hto.s = setTimeout(xows_xmp_sm3_handle_sent, 60000, true);
    }
  }
}

/**
 * Handles received Enabled (<enabled>) Stream Management (XEP-0198) stanza
 *
 * @param   {element}   stanza    Received <enabled> stanza
 */
function xows_xmp_sm3_enabled_recv(stanza)
{
  // Check for Stream Management support
  const xmlns = stanza.namespaceURI;

  if(xmlns === XOWS_NS_SM3) {

    if(stanza.hasAttribute("resume")) {

      xows_xmp_sm3_data.id = stanza.getAttribute("id");

      if(stanza.hasAttribute("max"))
        xows_xmp_sm3_data.max = stanza.getAttribute("max");

      xows_log(2,"xmp_sm3_enabled_recv","server enabled resume",xows_xmp_sm3_data.id);
    }
  }
}

/**
 * Handles received Resumed (<resumed>) Stream Management (XEP-0198) stanza
 *
 * @param   {element}   stanza    Received <resumed> stanza
 */
function xows_xmp_sm3_resumed_recv(stanza)
{
  // Session connected
  xows_xmp_sess = true;

  // No longer in resume scenario
  xows_xmp_resume_pnd = false;

  const hs = parseInt(stanza.getAttribute("h"));

  xows_log(2,"xmp_sm3_resumed_recv","session resumed",hs);

  // Session resumed, forward to client
  xows_xmp_fw_sess_onready(xows_xmp_bind, true);
}

/**
 * Handles received Failed (<failed>) Stream Management (XEP-0198) stanza
 *
 * @param   {element}   stanza    Received <failed> stanza
 */
function xows_xmp_sm3_failed_recv(stanza)
{
  if(xows_xmp_resume_pnd) {

    xows_log(1,"xmp_sm3_failed_recv","session resume failed");

    // Abort resume scenario
    xows_xmp_resume_pnd = false;

    // Reset session-management data
    xows_xmp_sm3_reset();

    // Query for resource bind
    xows_xmp_bind_query();
  }
}

/**
 * Handles received Ack reponse (<a>) Stream Management (XEP-0198) stanza
 *
 * @param   {element}   stanza    Received <a> stanza
 */
function xows_xmp_sm3_a_recv(stanza)
{
  // Set tracking as "Up to date" to prevent flooding for Ack
  if(xows_xmp_sm3_track_hto.s) {
    clearTimeout(xows_xmp_sm3_track_hto.s);
    xows_xmp_sm3_track_hto.s = null;
  }
  xows_xmp_sm3_track_cnt.s = 0;

  // Server send us its count of handled (received) stanza
  xows_xmp_sm3_data.hs = parseInt(stanza.getAttribute("h"));
  return true;
}

/**
 * Handles received Ack request (<r>) Stream Management (XEP-0198) stanza
 *
 * @param   {element}   stanza    Received <r> stanza
 */
function xows_xmp_sm3_r_recv(stanza)
{
  // Set tracking as "Up to date" to prevent flooding for Ack
  if(xows_xmp_sm3_track_hto.r) {
    clearTimeout(xows_xmp_sm3_track_hto.r);
    xows_xmp_sm3_track_hto.r = null;
  }
  xows_xmp_sm3_track_cnt.r = 0;

  // Send to server our count of handled (received) stanza
  xows_sck_send("<a xmlns='urn:xmpp:sm:3' h='"+xows_xmp_sm3_data.hr+"'/>");
  return true;
}

/**
 * Sends an Enable request (<enable>) for Stream Management (XEP-0198) support
 */
function xows_xmp_sm3_enable_query()
{
  xows_sck_send("<enable xmlns='urn:xmpp:sm:3' resume='true'/>");
}

/**
 * Sends an Resume request (<resume>) for Stream Management (XEP-0198)
 *
 * @param   {element}   stanza    Received <stream:error> stanza
 */
function xows_xmp_sm3_resume_query()
{
  xows_log(2,"xmp_sm3_resume_query","request stream resume");
  xows_sck_send("<resume xmlns='urn:xmpp:sm:3' previd='"+xows_xmp_sm3_data.id+
                                                 "' h='"+xows_xmp_sm3_data.hr+"'/>");
}

/* ---------------------------------------------------------------------------
 *
 * XMPP Core (RFC-6120)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for XMPP Core (RFC-6120) XMLNS
 */
const XOWS_NS_IETF_SASL    = "urn:ietf:params:xml:ns:xmpp-sasl";
const XOWS_NS_IETF_BIND    = "urn:ietf:params:xml:ns:xmpp-bind";
const XOWS_NS_IETF_STREAMS = "urn:ietf:params:xml:ns:xmpp-streams";

/**
 * Module Event-Forwarding callback for XMPP session ready
 */
let xows_xmp_fw_sess_onready = function() {};

/**
 * Module Event-Forwarding callback for XMPP session closed
 */
let xows_xmp_fw_sess_onclose = function() {};

/* ---------------------------------------------------------------------------
 * XMPP Core (RFC-6120) - Stream Negotiation
 * ---------------------------------------------------------------------------*/
/**
 * Storage for server's stream features list
 */
const xows_xmp_stream_feat = [];

/**
 * Handles received Stream Error (<stream:error>) stanza
 *
 * @param   {element}   stanza    Received <stream:error> stanza
 */
function xows_xmp_stream_error_recv(stanza)
{
  // Get the first child of <stream:error> this is the error type
  const cond = xows_xml_ns_select(stanza, XOWS_NS_IETF_STREAMS);

  // Output log
  xows_log(0,"xmp_stream_error_recv",cond.tagName);

  // Exit session (forward session close)
  xows_xmp_failure(XOWS_XMPP_FAIL, "the server reported stream error");

  return true;
}

/**
 * Handles received Stream Features (<stream:features>) stanza
 *
 * @param   {element}   stanza    Received <stream:features> stanza
 */
function xows_xmp_stream_features_recv(stanza)
{
  // We handle two cases of <stream:features> :
  //
  // - the frist received from the server should be the SASL mechanism
  //   list for authentication with available feature such as
  //   account registration.
  //
  // - The second is sent after authentication success to list common
  //   server sessions features.

  // Check for SASL feature
  const mechanisms = stanza.getElementsByTagName("mechanism");
  if(mechanisms.length) {

    // Get list of available mechanisms name
    xows_xmp_sasl_mechanisms.length = 0;
    for(let i = 0; i < mechanisms.length; ++i)
      xows_xmp_sasl_mechanisms.push(xows_xml_innertext(mechanisms[i]));

    xows_log(2,"xmp_stream_features_recv","received authentication mechanisms",xows_xmp_sasl_mechanisms.join(", "));

    // Check whether we are in account registration scenario
    if(xows_xmp_auth.regi) {

      const register = stanza.querySelector("register");

      if(register) {
        // Start registration process
        xows_xmp_regi_get_query(null, xows_xmp_regi_server_get_parse);
      } else {
        xows_log(0,"xmp_stream_features_recv","registration not allowed");
        // Exit session (forward session close)
        xows_xmp_failure(XOWS_XMPP_REGI,"account registration is not allowed by the server");
      }

    } else {
      // Start SASL negotiation
      xows_xmp_sasl_auth_send();
    }

    // We should now receive an <challenge> or <success> stanza...
    return true; //< stanza processed

  } else {

    // no <mechanism> in stanza, this should be the second <stream:features>
    // sent after authentication success, so we check for <bind> and <session>
    // items to continue with session initialization.
    xows_xmp_stream_feat.length = 0;

    // Store list of stream features XMLNS
    for(let i = 0; i < stanza.childNodes.length; ++i) {
      xows_xmp_stream_feat.push(stanza.childNodes[i].namespaceURI);
    }

    // Output log
    xows_log(2,"xmp_stream_features_recv","received features",xows_xmp_stream_feat.join(", "));

    // Is it possible to resume stream ?
    if(xows_xmp_resume_pnd && xows_xmp_sm3_data.id) {
      // Query to resume session
      xows_xmp_sm3_resume_query();
    } else {
      // Query for resource bind
      xows_xmp_bind_query();
    }
  }

  return false;
}

/* ---------------------------------------------------------------------------
 * XMPP Core (RFC-6120) - SASL
 * ---------------------------------------------------------------------------*/
/**
 * Storage for available SASL mechanisms proposed by server.
 */
const xows_xmp_sasl_mechanisms = [];

/**
 * Sends initial SASL Auth (<auth>) request.
 *
 * This initializes the proper SASL Module mechanism according available ones
 * then send the initial <auth> request to starts SASL negotiation.
 */
function xows_xmp_sasl_auth_send()
{
  // Try to initialize SASL
  const sasl_mech = xows_sasl_select(xows_xmp_sasl_mechanisms);
  if(!sasl_mech) {
    xows_log(0,"xmp_sasl_auth_send","no suitable SASL mechanism");
    // Exit session (forward session close)
    xows_xmp_failure(XOWS_XMPP_FAIL, "unable to find a suitable authentication mechanism");
    return;
  }

  xows_log(2,"xmp_sasl_auth_send","select authentication mechanism",sasl_mech);

  // If no password supplied, get saved auth data (if available)
  let auth_data = null;
  if(!xows_xmp_auth.pass) {

    // Get saved auth data (or null)
    auth_data = xows_cach_auth_get();

    // Check whether saved auth data exists and SALS mechanism match
    if(!auth_data || auth_data.mech !== sasl_mech) {
      xows_xmp_failure(XOWS_XMPP_FAIL, "unable to find authentication data for automatic login");
      return;
    }
  }

  // Prepare SASL authentication data
  xows_sasl_prepare(auth_data, xows_xmp_auth.jbar, xows_xmp_auth.user, xows_xmp_auth.pass);

  // Create SASL starting auth request
  const sasl_request = xows_sasl_get_request();
  if(sasl_request) { // MD5-DIGEST have empty request
    xows_log(2,"xmp_sasl_auth_send","sending authentication request",sasl_request);
    xows_xmp_send_raw(xows_xml_node("auth",{"xmlns":XOWS_NS_IETF_SASL,"mechanism":sasl_mech},btoa(sasl_request)));
  }
}

/**
 * Handles received SASL Challenge (<challenge>).
 *
 * This parses the received SASL challenge string then send an SASL Response
 * (<reponse>) with proper payload.
 *
 * @param   {element}   stanza    Received <challenge> stanza
 */
function xows_xmp_sasl_challenge_recv(stanza)
{
  // Get SASL challenge incomming from server
  const sasl_challenge = atob(xows_xml_innertext(stanza));

  xows_log(2,"xmp_sasl_challenge_recv","received authentication challenge",sasl_challenge);

  // Get SASL challenge response
  const sasl_response = xows_sasl_get_response(sasl_challenge);

  xows_log(2,"xmp_sasl_challenge_recv","sending challenge response",sasl_response);

  // Create and send SASL challenge response stanza
  xows_xmp_send_raw(xows_xml_node("response",{"xmlns":XOWS_NS_IETF_SASL},btoa(sasl_response)));

  // We should now receive an <faillure> or <success> stanza...
  return true; //< stanza processed
}

/**
 * Handles received SASL Faillure (<failure>).
 *
 * @param   {element}   stanza    Received <failure> stanza
 */
function xows_xmp_sasl_failure_recv(stanza)
{
  // As reminder, list of most common errors :
  //
  // <aborted/> : server acknolege abor request (not an error).
  // <malformed-request/> : auth request is empty or malformed.
  // <incorrect-encoding/> : supplied data base64 encoding is incorrect.
  // <invalid-authzid/> : invalid authoization identifier.
  // <invalid-mechanism/> : unsuported or invalid requested mechanism.
  // <mechanism-too-weak/> : requested mechanism is too weak according to current server policy.
  // <not-authorized/> : most common error, wrong username or password.
  // <temporary-auth-failure/> : failure due to server side error.

  const cond = stanza.firstChild;
  let text;
  switch(cond.tagName)
  {
  case "not-authorized" :
    text = "wrong username or password";
    break;
  default:
    text = xows_l10n_get("authentication error")+" ("+cond.tagName+")";
    break;
  }

  // Output log
  xows_log(0,"xmp_sasl_failure_recv",cond.tagName);

  // Exit session (forward session close)
  setTimeout(xows_xmp_failure, xows_options.login_fail_delay*1000, XOWS_XMPP_AUTH, text);

  return true;
}

/**
 * Handles received SASL Success (<success>).
 *
 * @param   {element}   stanza    Received <success> stanza
 */
function xows_xmp_sasl_success_recv(stanza)
{
  // Get <succees> stanza embeded data, this should be the SASL sever
  // proof (at least for SCRAM-SHA-1)
  const sasl_sproof = xows_xml_innertext(stanza);

  if(sasl_sproof.length !== 0) {
    xows_log(2,"xmp_sasl_success_recv","received server proof signature",sasl_sproof);
  }

  // Check server integrity
  if(!xows_sasl_chk_integrity(atob(sasl_sproof))) {
    // Output log
    xows_log(0,"xmp_sasl_success_recv","SASL integrity error");
    // Exit session (forward session close)
    xows_xmp_failure(XOWS_XMPP_FAIL, "server integrity check failed");
    return true;
  }

  xows_log(2,"xmp_sasl_success_recv","authentication success");

  // Save auth data if requested
  if(xows_xmp_auth.save)
    xows_cach_auth_save(xows_sasl_get_data());

  // Whenever a stream restart is mandated (eg. after successful SASL
  // negotiation), both the server and client streams are implicitly
  // closed and new streams MUST  be opened, using the same process as
  // in Section 3.4.
  //
  // The client MUST send a new stream <open/> element and MUST NOT send
  // a closing <close/> element.
  xows_xmp_fram_open_send();

  return true; //< stanza processed
}

/* ---------------------------------------------------------------------------
 * XMPP Core (RFC-6120) - Resource Binding
 * ---------------------------------------------------------------------------*/
/**
 * Handles received result of resouce bind (RFC-6120) query.
 *
 * @param   {element}   stanza    Received query response stanza
 */
function xows_xmp_bind_parse(stanza)
{
  if(stanza.getAttribute("type") === "error") {
    xows_xmp_error_log(stanza,0,"xmp_bind_parse");
    // Exit session (forward session close)
    xows_xmp_failure(XOWS_XMPP_FAIL, "resource bind error");
    return;
  }

  // Get the full JID and parse the received resource
  const full_jid = xows_xml_innertext(stanza.querySelector("jid"));
  xows_xmp_bind.jful = full_jid;
  xows_xmp_bind.jbar = xows_jid_bare(full_jid);
  xows_xmp_bind.node = xows_jid_node(full_jid);
  xows_xmp_bind.resc = xows_jid_resc(full_jid);

  xows_log(2,"xmp_bind_parse","resource bind",xows_xmp_bind.jful);

  // Session connected
  xows_xmp_sess = true;

  // Check for stream management feature
  for(let i = 0; i < xows_xmp_stream_feat.length; ++i) {
    if(xows_xmp_stream_feat[i] === XOWS_NS_SM3) {
      // Enable stream resume
      xows_xmp_sm3_enable_query();
      break;
    }
  }

  // Session ready, forward to client
  xows_xmp_fw_sess_onready(xows_xmp_bind, false);
}

/**
 * Sends resource bind (RFC-6120) query.
 *
 * @param   {string}  [resource]   Optional resource string to enforce
 */
function xows_xmp_bind_query(resource = null)
{
  // Query for resource binding to start session open process
  xows_log(2,"xmp_bind_query","query bind resource",resource ? resource : "from server");

  const bind = xows_xml_node("bind",{"xmlns":XOWS_NS_IETF_BIND});

  // If resource string is provided, request to bind this specific one
  if(resource)
    xows_xml_parent(bind, xows_xml_node("resource", null, resource));

  xows_xmp_send_raw(xows_xml_node("iq",{"type":"set"},bind), xows_xmp_bind_parse);
}

/* ---------------------------------------------------------------------------
 *
 * XMPP Core (RFC-6120) - IQ stanza semantics
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for IQ stanza semantics XMLNS
 */
const XOWS_NS_IETF_STANZAS = "urn:ietf:params:xml:ns:xmpp-stanzas";

/**
 * Handles received IQ (<iq>) stanza.
 *
 * If the received IQ stanza ID is found in queries stack, it is then
 * forwarded to the defined 'onresult' callback for that query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_iq_recv(stanza)
{
  const id = stanza.getAttribute("id"); //< Get the <iq> ID

  // Search for query with the specified ID in stack
  if(xows_xmp_query_stack.has(id)) {

    // Retrieve query parameters and remove entrie from stack
    const query = xows_xmp_query_stack.get(id);
    xows_xmp_query_stack.delete(id);

    // If query have a valid onresult function, call it
    if(xows_isfunc(query.onresult))
      query.onresult(stanza, query.onparse);

    return true; //< stanza is processed
  }

  // Check for "get" iq type, can come from user to query infos
  if(stanza.getAttribute("type") === "get") {
    const child = stanza.firstChild; //< get the first chid
    if(child !== undefined) {
      const xmlns = child.namespaceURI;
      // Check for ping request
      if(xmlns === XOWS_NS_PING) return xows_xmp_ping_reply(stanza);
      // Check for time request
      if(xmlns === XOWS_NS_TIME) return xows_xmp_iq_time_reply(stanza);
      // Check for version request
      if(xmlns === XOWS_NS_VERSION) return xows_xmp_iq_version_reply(stanza);
      // Check for disco#info request
      if(xmlns === XOWS_NS_DISCOINFO) return xows_xmp_disco_info_reply(stanza);
    }
    return false; //< stanza not processed
  }

  // Check for "set" iq type, can come to update roster or data
  if(stanza.getAttribute("type") === "set") {
    const child = stanza.firstChild; //< get the first chid
    if(child !== undefined) {
      const xmlns = child.namespaceURI;
      // Check for roster push
      if(xmlns === XOWS_NS_ROSTER) return xows_xmp_rost_push_recv(stanza);
      // Check for jingle session
      if(xmlns === XOWS_NS_JINGLE) return xows_xmp_jing_recv(stanza);
    }
    return false; //< stanza not processed
  }

  return false; //< stanza not processed
}

/**
 * Checks for unhandled IQ error and forward event if required.
 *
 * If the IQ type is error and 'onparse' is not defined, this is therfore an
 * unhandled error, it is then forwarded to default (unhandled error) event
 * callback and true is returned. In any other case the function returns false.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {string}    type      IQ type attribute value
 * @param   {function}  onparse   Callback for parsed result forwarding
 *
 * @return  {boolean}   True in case of unhandled error, false otherwise.
 */
function xows_xmp_iq_unhandled(stanza, type, onparse)
{
  if(type === "error" && !xows_isfunc(onparse)) {

    // Output log
    xows_xmp_error_log(stanza,1,"xmp_iq_unhandled");

    // Forward unhandled error
    xows_xmp_fw_onerror(stanza.getAttribute("from"), xows_xmp_error_parse(stanza));

    return true;
  }

  return false;
}

/**
 * Handles a received IQ result.
 *
 * This is the default IQ result processing function, the received stanza is
 * not processed beyond result type to determins whether it is an error. If an
 * 'onparse' callback is defined, the stanza is then forwarded to it.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_iq_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), type, xows_xmp_error_parse(stanza));
}

/**
 * Sends an error type IQ stanza.
 *
 * @parma   {string}    id          Query ID the error is related to
 * @parma   {string}    to          Destination JID
 * @parma   {string}    type        Error type (type attribute of <error> node)
 * @param   {string}    reason      Error reason (<error> child node tagname)
 */
function xows_xmp_iq_error_send(id, to, type, reason)
{
  xows_xmp_send(  xows_xml_node("iq",{"id":id,"type":"error","to":to},
                    xows_xml_node("error",{"type":type},
                      xows_xml_node(reason,{"xmlns":XOWS_NS_IETF_STANZAS}))));
}

/**
 * Sends a result type IQ stanza.
 *
 * @parma   {string}    id          Query ID the error is related to
 * @parma   {string}    to          Destination JID
 */
function xows_xmp_iq_result_send(id, to)
{
  xows_xmp_send(xows_xml_node("iq",{"id":id,"type":"result","to":to}));
}

/* ---------------------------------------------------------------------------
 *
 * XMPP Core (RFC-6120) - Message stanza semantics routines
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Delayed Delivery (XEP-0203) XMLNS
 */
const XOWS_NS_DELAY = "urn:xmpp:delay";

/* ---------------------------------------------------------------------------
 * Message semantics - Last Message Correction (XEP-0308)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Last Message Correction (XEP-0308) XMLNS
 */
const XOWS_NS_CORRECT = "urn:xmpp:message-correct:0";


/* ---------------------------------------------------------------------------
 * Message semantics - Last Message Correction (XEP-0308)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Message Replies (XEP-0461) XMLNS
 */
const XOWS_NS_REPLY = "urn:xmpp:reply:0";

/* ---------------------------------------------------------------------------
 * Message semantics - Last Message Correction (XEP-0308)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Unique and Stable Stanza IDs (XEP-0359) XMLNS
 */
const XOWS_NS_SID = "urn:xmpp:sid:0";

/* ---------------------------------------------------------------------------
 * XMPP API - Message semantics - Last Message Correction (XEP-0308)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Anonymous unique occupant identifiers for MUCs (XEP-0421) XMLNS
 */
const XOWS_NS_OCCUID = "urn:xmpp:occupant-id:0";

/* ---------------------------------------------------------------------------
 * XMPP API - Message semantics - Message Styling (XEP-0393)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Message Styling (XEP-0393) XMLNS
 */
const XOWS_NS_STYLING = "urn:xmpp:styling:0";

/* ---------------------------------------------------------------------------
 * XMPP API - Message semantics - Out of Band Data (XEP-0066)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Out of Band Data (XEP-0066) XMLNS
 */
const XOWS_NS_XOOB = "jabber:x:oob";

/**
 * Module Event-Forwarding callback for Received Chat Message (with Body content)
 */
let xows_xmp_fw_msg_onrecv = function() {};

/**
 * Module Event-Forwarding callback for Received MUC (XEP-0045) Subject Message
 */
let xows_xmp_fw_muc_onsubj = function() {};

/**
 * Module Event-Forwarding callback for Received MUC (XEP-0045) Notification Message
 */
let xows_xmp_fw_muc_onnoti = function() {};

/**
 * Handles a received Message (<message>) stanza.
 *
 * @param   {element}   stanza    Received <message> stanza
 */
function xows_xmp_message_recv(stanza)
{
  // Get message main attributes
  const id = stanza.getAttribute("id");
  const from = stanza.getAttribute("from");
  const to = stanza.getAttribute("to");
  const type = stanza.getAttribute("type");

  if(type === "error") {
    xows_xmp_fw_msg_onrecv(xows_xmp_message_forge(id, to, from, type), xows_xmp_error_parse(stanza));
    return true;
  }

  let time, body, xoob, chst, repl, rpid, rpto, orid, szid, ocid, mucx;

  for(let i = 0; i < stanza.childNodes.length; ++i) {

    const node = stanza.childNodes[i];

    // Skip the non-object nodes
    if(node.nodeType !== 1)
      continue;

    // Store child xmlns attribute and tagname
    const tname = node.tagName;
    const xmlns = node.namespaceURI;

    // Check whether this is a MAM archive query result
    if(xmlns === XOWS_NS_MAM)
      return xows_xmp_mam_result_recv(node);

    // Check whether this is a PubSub event
    if(xmlns === XOWS_NS_PUBSUBEVENT)
      return xows_xmp_pubsub_recv(from, node);

    // Check whether this is an encapsuled carbons copy
    if(xmlns === XOWS_NS_CARBONS) {
      // Take the inner <message> node and parse it
      const message = node.querySelector("message");
      return message ? xows_xmp_message_recv(message) : false;
    }

    // Check for Message Delivery Receipts (XEP-0184)
    if(xmlns === XOWS_NS_RECEIPTS) {
      if(tname === "request") { //< Can be <request> or <received>
        xows_xmp_message_receipt_send(from, id);
        continue;
      } else { //< we assume this is a <received>
        xows_xmp_fw_msg_onrecp(id, from, to, node.getAttribute("id"));
        return true;
      }
    }

    // Check for Message Retraction (XEP-0424)
    if(xmlns === XOWS_NS_RETRACT) {
      xows_xmp_fw_msg_onretr(id, from, type, node.getAttribute("id"));
      return true;
    }

    // Check for <subject> node
    if(tname === "subject") {
      xows_xmp_fw_muc_onsubj(id, from, xows_xml_innertext(node));
      return true;
    }

    // Check for room configuration notification
    if(xmlns === XOWS_NS_MUCUSER) {
      if(type === "groupchat") {
        const mucstat = node.querySelectorAll("status"); //< search for <status>
        if(mucstat.length) {
          const muccode = [];
          for(let j = 0; j < mucstat.length; ++j)
            muccode.push(parseInt(mucstat[j].getAttribute("code")));
          xows_xmp_fw_muc_onnoti(id, from, muccode);
          return true;
        }
        /*
        const item = node.querySelectorAll("status"); //< search for <item>
        if(item) {
          // I don't know what to do with that...
          mucx = {"jid" :item.getAttribute("jid"),
                  "affi":item.getAttribute("affiliation"),
                  "role":item.getAttribute("role"),
                  "nick":item.getAttribute("nick")};
        }
        */
      }
      continue;
    }

    // Check for chat state notification
    if(xmlns === XOWS_NS_CHATSTATES) {
      chst = xows_xmp_chatstate_value.get(tname);
      continue;
    }

    // Check for <delay> node, meaning of offline storage delivery
    if(xmlns === XOWS_NS_DELAY) {
      time = new Date(node.getAttribute("stamp")).getTime();
      continue;
    }

    // Check for Anonymous unique occupant identifiers for MUCs (XEP-0421)
    if(xmlns === XOWS_NS_OCCUID) {
      ocid = node.getAttribute("id");
      continue;
    }

    // Check for Unique and Stable Stanza IDs (XEP-0359)
    if(xmlns === XOWS_NS_SID) {
      if(tname === "origin-id") orid = node.getAttribute("id");
      if(tname === "stanza-id") szid = node.getAttribute("id");
      continue;
    }

    // Check for Replies (XEP-0461)
    if(xmlns === XOWS_NS_REPLY) {
      rpid = node.getAttribute("id");
      if(node.hasAttribute("to"))
        rpto = node.getAttribute("to");
      continue;
    }

    // Check for Last Message Correction (XEP-0308)
    if(xmlns === XOWS_NS_CORRECT) {
      repl = node.getAttribute("id");
      continue;
    }

    // Check for Out Of Band Data URI
    if(xmlns === XOWS_NS_XOOB) {
      const url = node.querySelector("url"); //< search for <url>
      xoob = xows_xml_innertext(url);
      continue;
    }

    // Check for <body> node
    if(tname === "body") {
      body = xows_xml_innertext(node);
      continue;
    }
  }

  // Notice : Some clients embeds chatstates along the <body>, in this case
  // we must forward both events.
  let handled = false;

  if(body) {
    xows_xmp_fw_msg_onrecv(xows_xmp_message_forge(id, to, from, type, body, xoob ,time,
                                                 null, null, repl, rpid, rpto,
                                                 orid, szid, ocid));
    handled = true;
  }

  if(chst !== undefined) {
    xows_xmp_fw_msg_onchst(id, from, type, chst, ocid);
    handled = true;
  }

  // Write log
  if(!handled)
    xows_log(1,"xmp_message_recv","unhandled message ("+from+")",type);

  return handled;
}

/**
 * Sends a Chat Message (with body content) stanza.
 *
 * @param   {string}    type      Message type
 * @param   {string}    to        Recipient address (JID)
 * @param   {string}    body      Message <body> content
 * @param   {boolean}   recp      Request message receipt
 * @param   {string}   [repl]     Optionnal message ID this one Replace
 * @param   {string}   [rpid]     Optionnal replyed message ID
 * @param   {string}   [rpto]     Optionnal replyed message author JID
 * @param   {string}   [xoob]     Optionnal Out of Band Data URI
 *
 * @return  {string}    Sent message ID
 */
function xows_xmp_message_body_send(type, to, body, recp, repl, rpid, rpto, xoob)
{
  // Generate 'custom' id to allow sender to track message
  const id = xows_gen_uuid();

  // Create message stanza
  const stanza =  xows_xml_node("message",{"id":id,"to":to,"type":type},
                    xows_xml_node("body",null,body));

  // Add Out of Band Data URI
  if(xoob)
    xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_XOOB},
                              xows_xml_node("url",null,xoob)));

  // Add Origin ID (XEP-0359)
  xows_xml_parent(stanza, xows_xml_node("origin-id",{"id":id,"xmlns":XOWS_NS_SID}));

  // Add replace
  if(repl)
    xows_xml_parent(stanza, xows_xml_node("replace",{"id":repl,"xmlns":XOWS_NS_CORRECT}));

  // Add reply
  if(rpid)
    xows_xml_parent(stanza, xows_xml_node("reply",{"id":rpid,"to":rpto,"xmlns":XOWS_NS_REPLY}));

  // Add receipt request (only if one-to-one chat)
  if(recp && type === "chat")
    xows_xml_parent(stanza, xows_xml_node("request",{"xmlns":XOWS_NS_RECEIPTS}));

  // Send final message
  xows_xmp_send(stanza);

  return id;
}

/* ---------------------------------------------------------------------------
 * Message semantics - Chat State Notifications (XEP-0085)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Chat State Notifications (XEP-0085) XMLNS
 */
const XOWS_NS_CHATSTATES = "http://jabber.org/protocol/chatstates";

/**
 * Module Event-Forwarding callback for Received Chat Stat (XEP-0085) Message
 */
let xows_xmp_fw_msg_onchst = function() {};

/**
 * Constant values for Chat State Notifications (XEP-0085) types
 */
const XOWS_CHAT_GONE    = 0;
const XOWS_CHAT_ACTI    = 1;
const XOWS_CHAT_INAC    = 2;
const XOWS_CHAT_PAUS    = 3;
const XOWS_CHAT_COMP    = 4;

/**
 * Conversion Map for Chat State string to Constant value
 */
const xows_xmp_chatstate_value = new Map([
  ["gone"      , 0],
  ["active"    , 1],
  ["inactive"  , 2],
  ["paused"    , 3],
  ["composing" , 4]
]);

/**
 * Conversion Array for Constant Value to Chat State string
 */
const xows_xmp_chatstate_string = [
  "gone",
  "active",
  "inactive",
  "paused",
  "composing"
];

/**
 * Sends a Chat Stat notification (XEP-0085) message stanza.
 *
 * @param   {string}    to        Recipient address (JID)
 * @param   {string}    type      Message type to set
 * @param   {number}    chat      Chat state to set
 */
function xows_xmp_message_chatstate_send(to, type, chat)
{
  const state = xows_xmp_chatstate_string[chat];

  // Generate id to create origin-id
  const id = xows_gen_uuid();

  // Base stanza
  const message = xows_xml_node("message",{"id":id,"to":to,"type":type},
                    xows_xml_node(state,{"xmlns":XOWS_NS_CHATSTATES}));

  // Add <no-store> node to prevent message to be stored in MAM
  xows_xml_parent(message, xows_xml_node("no-store",{"xmlns":"urn:xmpp:hints"}));

  // Add <origin-id> node
  xows_xml_parent(message, xows_xml_node("origin-id",{"id":id,"xmlns":XOWS_NS_SID}));

    // Send message
  xows_xmp_send(message);
}

/* ---------------------------------------------------------------------------
 * Message semantics - Message Delivery Receipts (XEP-0184)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Message Delivery Receipts (XEP-0184) XMLNS
 */
const XOWS_NS_RECEIPTS = "urn:xmpp:receipts";

/**
 * Module Event-Forwarding callback for Received Receipt Message
 */
let xows_xmp_fw_msg_onrecp = function() {};

/**
 * Sends a Delivery Receipts (XEP-0184) message stanza.
 *
 * @param   {string}    to        Recipient address (JID)
 * @param   {string}    id        Message ID to send receipt about
 */
function xows_xmp_message_receipt_send(to, id)
{
  xows_xmp_send(xows_xml_node("message",{"to":to},
                  xows_xml_node("received",{"id":id,"xmlns":XOWS_NS_RECEIPTS})));
}

/* ---------------------------------------------------------------------------
 * Message semantics - Message Retraction (XEP-0424)
 * ---------------------------------------------------------------------------*/
/**
 * Constant for Message Retraction (XEP-0424) XMLNS
 */
const XOWS_NS_RETRACT = "urn:xmpp:message-retract:1";
const XOWS_NS_RETRACT_TOMB = "urn:xmpp:message-retract:1#tombstone";

/**
 * Module Event-Forwarding callback for Received Retraction Message
 */
let xows_xmp_fw_msg_onretr = function() {};

/**
 * Sends a Retraction (XEP-0424) message stanza.
 *
 * @param   {string}    to        Recipient address (JID)
 * @param   {string}    type      Message type to set
 * @param   {string}    usid      Unique and Stable ID if message to retract
 */
function xows_xmp_message_retract_send(to, type, usid)
{
  // Generate id to create origin-id
  const id = xows_gen_uuid();

  // Base stanza
  const message = xows_xml_node("message",{"id":id,"to":to,"type":type},
                    xows_xml_node("retract",{"id":usid,"xmlns":XOWS_NS_RETRACT}));

  // Add <store> node to ensure message to be stored in MAM
  xows_xml_parent(message, xows_xml_node("store",{"xmlns":"urn:xmpp:hints"}));

  // Add <fallback> node
  //xows_xml_parent(message, xows_xml_node("fallback",{"xmlns":"urn:xmpp:fallback:0","for":XOWS_NS_RETRACT}));

  // Add <body> node
  //xows_xml_parent(message, xows_xml_node("body",null,"/me retracted a previous message, but it's unsupported by your client."));

  // Add <origin-id> node
  xows_xml_parent(message, xows_xml_node("origin-id",{"id":id,"xmlns":XOWS_NS_SID}));

  // Send message
  xows_xmp_send(message);
}

/* ---------------------------------------------------------------------------
 *
 * IM and Presence (RFC-6121) - Roster Management
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Roster Management (XEP-0321) XMLNS
 */
const XOWS_NS_ROSTER = "jabber:iq:roster";

/**
 * Module Event-Forwarding callback for Received Roster Push
 */
let xows_xmp_fw_rost_onrecv = function() {};

/**
 * Handles a received Roster Push IQ stanza.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_rost_push_recv(stanza)
{
  // Get iq Id to create response
  const id = stanza.getAttribute("id");

  // Send response iq
  xows_xmp_send(  xows_xml_node("iq",{"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER})));

  // Parse <item> child, it should be alone
  const item = stanza.querySelector("item");

  const jid = item.getAttribute("jid");
  const name = item.getAttribute("name");
  const subs = xows_xmp_subs_val.get(item.getAttribute("subscription"));
  let group = item.querySelector("group");
  group = group ? xows_xml_innertext(group) : null;

  // Forward parse result
  xows_xmp_fw_rost_onrecv(jid, name, subs, group);
}

/**
 * Handles received result of Roster-Get query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_rost_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, items = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_rost_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Turn <item> to object's array
    const nodes = stanza.getElementsByTagName("item");
    for(let i = 0; i < nodes.length; ++i) {
      items.push({"jid"   : nodes[i].getAttribute("jid"),
                  "name"  : nodes[i].getAttribute("name"),
                  "subs"  : xows_xmp_subs_val.get(nodes[i].getAttribute("subscription")),
                  "group" : xows_xml_innertext(nodes[i].querySelector("group"))});
    }
  }

  // Forward result to client
  onparse(items, error);
}

/**
 * Sends a Roster-Get IQ query.
 *
 * This is used to query server for user Roster items.
 *
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_rost_get_query(onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER}));

  xows_xmp_send(iq, xows_xmp_rost_get_parse, onparse);
}

/**
 * Sends a Roster-Set IQ query.
 *
 * This is used to query server for user Roster modification (add or removes item)
 *
 * @param   {string}    jid       Contact or Room JID to add
 * @param   {string}    name      Item Display name or null to remove item
 * @param   {string}   [group]    Optionnal group name where to add contact or null to ignore
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_rost_set_query(jid, name, group, onparse)
{
  // Create the item child
  const item = xows_xml_node("item",{"jid":jid});

  // Null name means item to be removed
  if(!name) {
    item.setAttribute("subscription","remove");
  } else {
    item.setAttribute("name",name);
    if(group) xows_xml_parent(item,xows_xml_node("group",null,group));
  }

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_ROSTER},item));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * IM and Presence (RFC-6121) - Presence exchange & Subscriptions
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for presence Show (availability) level
 */
const XOWS_SHOW_OFF     = 0;
const XOWS_SHOW_DND     = 1;
const XOWS_SHOW_XA      = 2;
const XOWS_SHOW_AWAY    = 3;
const XOWS_SHOW_ON      = 4;
const XOWS_SHOW_CHAT    = 5;

/**
 * Conversion Map for Presence Show string to Constant value
 */
const xows_xmp_show_val = new Map([
  ["dnd",   1],
  ["xa",    2],
  ["away",  3],
  ["chat",  5]
]);

/**
 * Conversion Map for Constant value to Presence Show string
 */
const xows_xmp_show_str = new Map([
  [1,  "dnd"],
  [2,   "xa"],
  [3, "away"],
  [4,   null],
  [5, "chat"]
]);

/**
 * Constant values for presence Subscription direction
 */
const XOWS_SUBS_REM     = -1; //< remove subscription
const XOWS_SUBS_NONE    = 0x0;  //< mutual non-subscription
const XOWS_SUBS_FROM    = 0x1;  //< subscription allowed by user
const XOWS_SUBS_TO      = 0x2;  //< subscription allowed by contact
const XOWS_SUBS_BOTH    = 0x3;  //< mutual subscription

/**
 * Conversion Map for presence subscription string to Constant value
 */
const xows_xmp_subs_val  = new Map([
  ["remove" ,  -1],
  ["none"   , 0x0],
  ["from"   , 0x1],
  ["to"     , 0x2],
  ["both"   , 0x3]
]);

/**
 * Module Event-Forwarding callback for Received Normal Presence
 */
let xows_xmp_fw_pres_onrecv = function() {};

/**
 * Module Event-Forwarding callback for Received Subscription Presence
 */
let xows_xmp_fw_pres_onsubs = function() {};

/**
 * Module Event-Forwarding callback for Received MUC (Occupant) Presence
 */
let xows_xmp_fw_pres_onmuco = function() {};

/**
 * Module Event-Forwarding callback for Received Error Presence
 */
let xows_xmp_fw_pres_onfail = function() {};

/**
 * Handles a received Presence (<presence>) stanza.
 *
 * @param   {element}   stanza    Received <presence> stanza
 */
function xows_xmp_presence_recv(stanza)
{
  const from = stanza.getAttribute("from"); //< Sender JID/Ress

  // Usual presence informations
  let show = XOWS_SHOW_ON; //< In case <show> node is not present
  let prio = 0; //< In case <priority> node is not present

  // Check whether presence has "type" attribute
  if(stanza.hasAttribute("type")) {

    const type = stanza.getAttribute("type");

    switch(type)
    {
    case "unavailable":
      show = XOWS_SHOW_OFF;
      break;
    case "subscribe":
    case "unsubscribe":
    case "subscribed":
    case "unsubscribed": {
      // Check for <nick> child
      const nick = stanza.querySelector("nick");
      const name = nick ? xows_xml_innertext(nick) : null;

      // Foward subscription
      xows_xmp_fw_pres_onsubs(from, type, name);
      } return true;
    case "error": {
      // get error data
      const error = xows_xmp_error_parse(stanza);
      xows_log(1,"xmp_presence_recv","error",from+" - "+error.type);
      // Forward error
      xows_xmp_fw_pres_onfail(from, error);
      } return true;
    }

  }

  // Additionnal <presence> informations or data
  let stat, caps, ocid, mucx, phot = null;

  for(let i = 0; i < stanza.childNodes.length; ++i) {

    const node = stanza.childNodes[i];

    if(node.nodeType !== 1)
      continue;

    const tname = node.tagName;
    const xmlns = node.namespaceURI;

    // Check for common presence informations
    switch(tname)
    {
    case "show": {
      const text = xows_xml_innertext(node);
      show = text ? xows_xmp_show_val.get(text) : XOWS_SHOW_ON; //< No text mean simply "available"
      continue; }

    case "priority":
      prio = parseInt(xows_xml_innertext(node));
      continue;

    case "status":
      stat = xows_xml_innertext(node);
      continue;
    }

    switch(xmlns)
    {
    case XOWS_NS_VCARDXUPDATE: { // Support for XEP-0153 vCard-Based Avatars
        const photo = node.querySelector("photo");
        if(photo) phot = xows_xml_innertext(photo);
      } continue;

    case XOWS_NS_CAPS: //< Entity capabilities (XEP-0115)
      caps = {"node":node.getAttribute("node"),
              "ver" :node.getAttribute("ver")};
      continue;

    case XOWS_NS_OCCUID: //< Anonymous unique occupant ID (XEP-0421)
      ocid = node.getAttribute("id");
      continue;

    case XOWS_NS_MUCUSER: { //< Room occupant informations
        const item = node.querySelector("item"); //< should be an <item>

        mucx = {"affi" : xows_xmp_affi_val.get(item.getAttribute("affiliation")),
                "role" : xows_xmp_role_val.get(item.getAttribute("role")),
                "jful" : item.getAttribute("jid"),
                "nick" : item.getAttribute("nick"),
                "code" : []};

        const mucs = node.querySelectorAll("status"); //< search for <status>
        for(let j = 0; j < mucs.length; ++j)
          mucx.code.push(parseInt(mucs[j].getAttribute("code")));

        // search for <destroy> element
        const destroy = node.querySelector("destroy");
        if(destroy) {
          const reason = node.querySelector("reason");
          mucx.destroy = reason ? xows_xml_innertext(reason) : "Unspecified reason";
        }

      } continue;
    }
  }

  // Check whether this a presence from MUC
  if(mucx !== undefined) {
    xows_xmp_fw_pres_onmuco(from, show, stat, mucx, ocid, phot);
  } else {
    // Default is usual contact presence
    xows_xmp_fw_pres_onrecv(from, show, prio, stat, caps, phot);
  }

  return true;
}

/**
 * Sends a Presence (<presence>) stanza.
 *
 * @param   {string}    to        Recipient address (JID) or null
 * @param   {string}    type      Presence type or null
 * @param   {number}    show      Availability level 0 to 4 or null
 * @param   {string}    stat      Status string to set
 * @param   {string}   [nick]     Optional nickname
 * @param   {boolean}  [mucx]     Optional MUC data
 * @param   {string}   [phot]     Optional Avatar Hash
 */
function xows_xmp_presence_send(to, type, show, stat, nick, mucx, phot)
{
  // Create the initial and default <presence> stanza
  const stanza = xows_xml_node("presence");

  // Add destination attribute
  if(to) stanza.setAttribute("to", to);

  // Add type attribute
  if(type) stanza.setAttribute("type", type);

  // Append the <show> and <priority> children
  if(show > XOWS_SHOW_OFF) {

    // Translate show level number to string
    if(show !== XOWS_SHOW_ON) //> The <show> element must NOT be empty
      xows_xml_parent(stanza, xows_xml_node("show", null, xows_xmp_show_str.get(show)));

    // Set priority according show level
    xows_xml_parent(stanza, xows_xml_node("priority", null, (show * 20)));

    // Append vcard-temp:x:update for avatar update
    if(typeof phot === "string") {
      xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_VCARDXUPDATE},
                                xows_xml_node("photo",null,phot)));
    }

    // Append <c> (caps) child
    xows_xml_parent(stanza, xows_xml_node("c",{"xmlns":XOWS_NS_CAPS,"hash":"sha-1","node":XOWS_APP_NODE,"ver":xows_xmp_caps_self_verif()}));
  }

  // Append <status> child
  if(typeof stat === "string") {
    // Great Javascript journey here. First, an empty string is always
    // translated as Boolean "false", but, like things were not confusing
    // enough, I also discovered that a String is NOT ALWAYS a String because
    // literal-string ARE NOT instance of String(). Am I alone to go mad when
    // seeing things like that ?
    xows_xml_parent(stanza, xows_xml_node("status", null, stat));
  }

  // Append <nick> child if supplied
  if(nick) xows_xml_parent(stanza, xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick));

  // Append the proper <x> child for MUC protocole
  if(mucx) {
    const x = xows_xml_node("x",{"xmlns":XOWS_NS_MUC});
    // Append <password> child if supplied
    if(mucx.pass) xows_xml_parent(x, xows_xml_node("password",null,mucx.pass));
    xows_xml_parent(stanza, x);
  }

  // Send the final <presence> stanza
  xows_xmp_send(stanza);
}

/* ---------------------------------------------------------------------------
 *
 * XMPP Ping (XEP-0199)
 *
 * ---------------------------------------------------------------------------*/
/**
 *  Constant value for XMPP Ping (XEP-0199) XMLNS
 */
const XOWS_NS_PING = "urn:xmpp:ping";

/**
 * Handles a received Ping QI query.
 *
 * This replies with an Ping QI result.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_ping_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // Send pong
  xows_xmp_send(xows_xml_node("iq",{"id":id,"to":from,"type":"result"}));
}

/* ---------------------------------------------------------------------------
 *
 * Entity Time (XEP-0202)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Entity Time (XEP-0202) XMLNS
 */
const XOWS_NS_TIME  = "urn:xmpp:time";

/**
 * Handles a received Time QI query.
 *
 * This replies with an Time QI result.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_iq_time_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // Create date
  const date = new Date();
  // we must add a leading zero to the time zone offset value wich may
  // be negative
  let off = date.getTimezoneOffset() / 60;
  let tzo = (off < 0) ? "-" : ""; // if negative start with minus
  off = Math.abs(off); // take absolute value
  tzo += ((off > 9) ? off : "0"+off) + ":00";
  const utc = date.toJSON();

  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("time",{"xmlns":XOWS_NS_TIME},[
                      xows_xml_node("tzo",null,tzo),
                      xows_xml_node("utc",null,utc)])));

}

/* ---------------------------------------------------------------------------
 *
 * Software Version (XEP-0092)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Software Version (XEP-0092) XMLNS
 */
const XOWS_NS_VERSION      = "jabber:iq:version";

/**
 * Handles a received Version QI query.
 *
 * This replies with an Version QI result.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_iq_version_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");

  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_VERSION},[
                      xows_xml_node("name",null,XOWS_APP_NAME),
                      xows_xml_node("version",null,XOWS_APP_VERS)])));
}

/* ---------------------------------------------------------------------------
 *
 * Service Discovery (XEP-0030)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Service Discovery (XEP-0030) XMLNS
 */
const XOWS_NS_DISCOINFO    = "http://jabber.org/protocol/disco#info";
const XOWS_NS_DISCOITEMS   = "http://jabber.org/protocol/disco#items";

/**
 * Handles a received disco#info QI query.
 *
 * This replies with an disco#info QI result.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_disco_info_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // get the <query> element to get node attribute if exists
  const query = stanza.querySelector("query");
  const node = query ? query.getAttribute("node") : null;

  // Send response
  const caps = xows_xmp_caps_self_features();
  xows_xmp_send(  xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node},caps)));
}

/**
 * Parses received IQ result of disco#info query
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_disco_info_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, node = null, xform = null;
  const idens = [];
  const feats = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_disco_info_parse");
    error = xows_xmp_error_parse(stanza);
  } else {

    // Get the <query> child element
    const query = stanza.querySelector("query");

    node = query.getAttribute("node");

    // Turn each <identity> into object's array.
    const identity = query.querySelectorAll("identity");
    for(let i = 0; i < identity.length; ++i) {
      idens.push({ "category": identity[i].getAttribute("category"),
                  "type"    : identity[i].getAttribute("type"),
                  "name"    : identity[i].getAttribute("name")});
    }

    // Turn each <feature var=""> into string array.
    const feature = query.querySelectorAll("feature");
    for(let i = 0; i < feature.length; ++i) {
      if(feature[i].hasAttribute("var"))
        feats.push(feature[i].getAttribute("var"));
    }

    // Parse the <x> element if exists
    const x = query.querySelector("x");
    xform = x ? xows_xmp_xdata_parse(x) : null;
  }

  // Forward result to client
  onparse(stanza.getAttribute("from"), node, idens, feats, xform, error);
}

/**
 * Sends an disco#info IQ query
 *
 * @param   {string}    to        Target address (JID or URL)
 * @param   {string}    node      Query node attribute or null to ignore
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_disco_info_query(to, node, onparse)
{
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node}));

  xows_xmp_send(iq, xows_xmp_disco_info_parse, onparse);
}

/**
 * Parses received IQ result of disco#items query
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_disco_items_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error;
  const items = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_disco_items_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Turn <item> elements into object's array
    const nodes = stanza.getElementsByTagName("item");
    for(let i = 0; i < nodes.length; ++i) {
      items.push({ "jid"   : nodes[i].getAttribute("jid"),
                   "name"  : nodes[i].getAttribute("name")});
    }
  }

  // Forward result to client
  onparse(stanza.getAttribute("from"), items, error);
}

/**
 * Sends an disco#items IQ query
 *
 * @param   {string}    to        Entity JID, name or URL
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_disco_items_query(to, onparse)
{
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOITEMS}));

  xows_xmp_send(iq, xows_xmp_disco_items_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * External Service Discovery (XEP-0215)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for External Service Discovery (XEP-0215) XMLNS
 */
const XOWS_NS_EXTDISCO = "urn:xmpp:extdisco:2";

/**
 * Parses received IQ result of External-Service-Discovery query
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_extdisco_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  const svcs = [];
  let error;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_extdisco_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Turn each <service> into object's array.
    const service = stanza.querySelectorAll("service");
    for(let i = 0; i < service.length; ++i) {
      svcs.push({ "type"      : service[i].getAttribute("type"),
                  "host"      : service[i].getAttribute("host"),
                  "port"      : service[i].getAttribute("port"),
                  "transport" : service[i].getAttribute("transport"),
                  "username"  : service[i].getAttribute("username"),
                  "password"  : service[i].getAttribute("password"),
                  "restricted": service[i].getAttribute("restricted")});
    }
  }

  // Forward result to client
  onparse(stanza.getAttribute("from"), svcs, error);
}

/**
 * Sends an External-Service-Discovery IQ query
 *
 * @param   {string}    to        Target address (JID or URL)
 * @param   {string}    type      Query type attribute or null to ignore
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_extdisco_query(to, type, onparse)
{
  // Create the services child
  const services = xows_xml_node("services",{"xmlns":XOWS_NS_EXTDISCO});

  // Add type if supplied
  if(type) services.setAttribute("type",type);

  const iq =  xows_xml_node("iq",{"type":"get","to":to},services);

  xows_xmp_send(iq, xows_xmp_extdisco_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * Data Forms (XEP-0004)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Data Forms (XEP-0004) XMLNS
 */
const XOWS_NS_XDATA = "jabber:x:data";

/**
 * Parses an X Data Form (<x>) node.
 *
 * This converts X Data Form (<x>) node content to an Array of dictionary
 * objects.
 *
 * @param   {element}   x         X Data Form (<x>) node to parse
 *
 * @return  {object[]}  Array of parsed field to complete
 */
function xows_xmp_xdata_parse(x)
{
  const form = [];

  // Turn each <field> into object's array
  const nodes = x.getElementsByTagName("field");
  for(let i = 0; i < nodes.length; ++i) {
    // Create base Field object
    const field = {
      "required"  : (nodes[i].querySelector("required") !== null),
      "type"      : nodes[i].getAttribute("type"),
      "label"     : nodes[i].getAttribute("label"),
      "var"       : nodes[i].getAttribute("var")};

    // Check for <desc> node
    const desc = nodes[i].querySelector(":scope > desc");
    if(desc) field.desc = xows_xml_innertext(desc);

    // Fill value array if any
    const value = nodes[i].querySelectorAll(":scope > value");
    if(value.length) {
      field.value = [];
      for(let j = 0; j < value.length; ++j)
        field.value.push(xows_xml_innertext(value[j]));
    }

    // Fill option array if any
    const option = nodes[i].querySelectorAll(":scope > option");
    if(option.length) {
      field.option = [];
      for(let j = 0; j < option.length; ++j) {
        field.option.push({
          "label":option[j].getAttribute("label"),
          "value":xows_xml_innertext(option[j].querySelector(":scope > value"))});
      }
    }

    form.push(field);
  }
  return form;
}

/**
 * Builds up an X Data Form (<x>) submit type node.
 *
 * This converts supplied array of dictionary object to a corresponding
 * X Data Form (<x>) node.
 *
 * The given Array must contain one or more dictionary objects with each one
 * "var" and one "value" property.
 * The "var" property value must be a string, the "value" property value can be
 * null or an array containing one or more string convertible values:
 *
 *   [
 *    {"var":"name1", "value":[<data>]},
 *    {"var":"name2", "value":[<data>,<data,...]},
 *    ...
 *   ]
 *
 * @param   {object[]}  field     Object's array to turn as <field> elements
 *
 * @return  {element}   X Data Form (<x>) node
 */
function xows_xmp_xdata_make(field)
{
  // The base <x> node
  const x = xows_xml_node("x",{"xmlns":XOWS_NS_XDATA,"type":"submit"});

  if(field && field.length) {
    // Add <field> elements with proper values to <x> node
    let node;
    for(let i = 0; i < field.length; ++i) {
      // Create base <field> node
      node = xows_xml_node("field");
      // Add available informations to node
      if(field[i]["var"]) node.setAttribute("var", field[i]["var"]);
      if(field[i].type) node.setAttribute("type", field[i].type);
      if(field[i].value) {
        const value = field[i].value;
        for(let j = 0; j < value.length; ++j)
          xows_xml_parent(node,xows_xml_node("value",null,value[j]));
      }
      // Add <field> to <x>
      xows_xml_parent(x, node);
    }
  }
  return x;
}

/**
 * Builds up an X Data Form (<x>) cancel type node.
 *
 * @return  {object}    The <x> node with <field> to submit
 */
function xows_xmp_xdata_cancel()
{
  return xows_xml_node("x",{"xmlns":XOWS_NS_XDATA,"type":"cancel"});
}

/* ---------------------------------------------------------------------------
 *
 * In-Band Registration (XEP-0077)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for In-Band Registration (XEP-0077) XMLNS
 */
const XOWS_NS_REGISTER     = "jabber:iq:register";

/**
 * Parses received IQ result of Registration-Get query.
 *
 * This parses the X Data From received as result of In-Band Registration
 * "get" IQ query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_regi_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, data = null, xform = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_regi_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    const username = stanza.querySelector("username");
    const password = stanza.querySelector("password");
    const email = stanza.querySelector("email");
    // Get common registration elements
    data = {"registered": stanza.querySelector("registered") ? true : false,
            "username":   username ? xows_xml_innertext(username) : null,
            "password":   password ? xows_xml_innertext(password) : null,
            "email":      email ? xows_xml_innertext(email) : null};

    // Check whether we have <x> element
    const x = stanza.querySelector("x");
    if(x) xform = xows_xmp_xdata_parse(x);
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), data, xform, error);
}

/**
 * Sends a Registration-Get IQ query.
 *
 * This is used to retrieve user account data form in order to be modified
 * and submitted back.
 *
 * @param   {string}    to        Peer or service JID
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_regi_get_query(to, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER}));

  if(to !== null) iq.setAttribute("to",to);

  xows_xmp_send(iq, xows_xmp_regi_get_parse, onparse);
}

/**
 * Sends a Registration-Set IQ query.
 *
 * This is used to submit modified account data form.
 *
 * @param   {string}    to        Peer or service JID or null
 * @param   {object}    data      Registration data to submit or null to ignore
 * @param   {object[]}  xform     Fulfilled x-data form or null to ignore
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_regi_set_query(to, data, xform, onparse)
{
  // Create the base <query> node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER});

  // Add child nodes as supplied
  if(data !== null) {
    if(data.username  !== null) xows_xml_parent(query, xows_xml_node("username",null,data.username));
    if(data.password  !== null) xows_xml_parent(query, xows_xml_node("password",null,data.password));
    if(data.email     !== null) xows_xml_parent(query, xows_xml_node("email",   null,data.email));
  }

  if(xform !== null)
    xows_xml_parent(query, xows_xmp_xdata_make(xform));

  // Create and launch the query
  const iq =  xows_xml_node("iq",{"type":"set"},query);

  if(to !== null) iq.setAttribute("to",to);

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parses received IQ result of Registration-Set query for Server Account
 * Registration process.
 *
 * This parses the result of In-Band Registration form submition IQ query. On
 * success, the SASL negotiation is started to login new session.
 *
 * This function is part of the Server Account Registration process.
 *
 * @param   {string}    from      Query Sender JID
 * @param   {string}    type      Query Response type
 * @param   {object}    error     Error data if any
 */
function xows_xmp_regi_server_set_parse(from, type, error)
{
  // Check whether we got an error as submit response
  if(type === "error") {

    xows_log(0,"xmp_regi_server_set_parse",error.name);

    let text = null;
    // Set error message string as possible
    if(error.code === "409" || error.name === "conflict") {
      text = "unsername already exists";
    } else if(error.code === "406" || error.name === "not-acceptable") {
      text = "username contains illegal characters";
    } else {
      text = xows_l10n_get("unable to register")+" ("+error.name+")";
    }

    // Exit session (forward session close)
    setTimeout(xows_xmp_failure, xows_options.login_fail_delay*1000, XOWS_XMPP_REGI, text);

  } else {

    // Reset the client with congratulation message
    xows_log(2,"xmp_regi_server_set_parse","success");

    // we are no longer on register process
    xows_xmp_auth.regi = false;

    // Start new authentication process
    xows_xmp_sasl_auth_send();
  }
}

/**
 * Parses received IQ result of Registration-Get query for Server Account
 * Registration process.
 *
 * This prases the received User Account Data form to be modified or
 * fulfilled to complete the registration process. It then immediatly submit
 * the form via IQ "set" query.
 *
 * This function is part of the Server Account Registration process.
 *
 * @param   {string}    from        Sender JID
 * @param   {object}    data        Replied registration data
 * @param   {object[]}  xform       Parsed x-data form to fulfill
 * @param   {object}   [error]      Error data if any
 */
function xows_xmp_regi_server_get_parse(from, data, xform, error)
{
  // The server may respond with a form or via old legacy way
  // we handle both cases.
  if(xform) {
    // For each fied of form, find know var name and fulfill
    for(let i = 0; i < xform.length; ++i) {
      if(xform[i]["var"] === "username") xform[i].value = [xows_xmp_auth.user];
      if(xform[i]["var"] === "password") xform[i].value = [xows_xmp_auth.pass];
    }
  } else {
    // Fulfill <username> and <password> element as required
    if(data.username !== null) data.username = xows_xmp_auth.user;
    if(data.password !== null) data.password = xows_xmp_auth.pass;
  }

  // Submit the register parmaters
  xows_xmp_regi_set_query(null, data, xform, xows_xmp_regi_server_set_parse);
}

/**
 * Parses received IQ result of of Registration-Set query for Account
 * Password Change.
 *
 * This function is part of the Account Password Change process.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_regi_pass_set_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, xform = null;

  // First query may be an error with x-data form to fulfill
  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_regi_pass_set_parse");
    error = xows_xmp_error_parse(stanza);
    // Check whether we have <x> element
    const x = stanza.querySelector("x");
    if(x) xform = xows_xmp_xdata_parse(x);
  }

  // Forward parse result
  onparse(type, xform, error);
}

/**
 * Sends a Registration-Set IQ query for Account Password Change.
 *
 * This function is part of the Account Password Change process.
 *
 * @param   {string}    pass      New password to set
 * @param   {object[]}  xform     Fulfilled x-data form or null to ignore
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_regi_pass_set_query(pass, xform, onparse)
{
  // Create the base <query> node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER});

  // Add child nodes as supplied
  if(pass) {
    xows_xml_parent(query, xows_xml_node("username",null,xows_xmp_auth.user));
    xows_xml_parent(query, xows_xml_node("password",null,pass));
  }

  if(xform !== null)
    xows_xml_parent(query, xows_xmp_xdata_make(xform));

  // Create and launch the query
  const iq =  xows_xml_node("iq",{"type":"set"},query);

  // Send query with dedicated parsing function
  xows_xmp_send(iq, xows_xmp_regi_pass_set_parse, onparse);
}

/**
 * Parses received IQ result of of Registration-Set query for Account
 * Registration Cancel.
 *
 * This function is part of the Account Registration Cancel (Account deletion)
 * process.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_regi_remove_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, xform = null;

  // First query may be an error with x-data form to fulfill
  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_regi_remove_parse");
    error = xows_xmp_error_parse(stanza);
    // Check whether we have <x> element
    const x = stanza.querySelector("x");
    if(x) xform = xows_xmp_xdata_parse(x);
  }

  // Forward parse result
  onparse(type, xform, error);
}

/**
 * Sends a Registration-Set IQ query for Account Registration Cancel.
 *
 * This function is part of the Account Registration Cancel (Account deletion)
 * process.
 *
 * @param   {string}    to        Entity JID or null
 * @param   {object[]}  xform     Fulfilled x-data form or null to ignore
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_regi_remove_query(to, xform, onparse)
{
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER});

  if(xform) {
    xows_xml_parent(query, xows_xmp_xdata_make(xform));
  } else {
    xows_xml_parent(query, xows_xml_node("remove"));
  }

  // Build attribute list
  const attr = {"type":"set"};
  if(to) attr.to = to;

  // Create and launch the query
  const iq =  xows_xml_node("iq",attr,query);

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_regi_remove_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * Message Carbons (XEP-0280)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Message Carbons (XEP-0280) XMLNS
 */
const XOWS_NS_CARBONS      = "urn:xmpp:carbons:2";
//const XOWS_NS_CARBONS_RUL  = "urn:xmpp:carbons:rules:0";

/**
 * Sends a Message-Carbons IQ query.
 *
 * @param   {boolean}   enable    Boolean to query enable or disable
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_carbons_query(enable, onparse)
{
  // Create enable or disable node
  const tag = (enable) ? "enable" : "disable";

  // Send request to enable carbons
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node(tag,{"xmlns":XOWS_NS_CARBONS}));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * Vcard-temp (XEP-0054)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Vcard-temp (XEP-0054) XMLNS
 */
const XOWS_NS_VCARD        = "vcard-temp";
const XOWS_NS_VCARDXUPDATE = "vcard-temp:x:update";

/**
 * Sends a vCard-Temp-Set IQ query.
 *
 * This is used to publish user (own) vCard-Temp.
 *
 * @param   {element}     vcard     vCard element
 * @param   {function}   [onparse]  Optional callback to receive query result
 */
function xows_xmp_vcardt_set_query(vcard, onparse)
{
  // Put vCard child elements in array to be updated
  const data = [];
  for(let i = 0; i < vcard.children.length; ++i)
    data.push(vcard.children[i]);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"set","to":xows_xmp_bind.jbar},
                xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD},data));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parses recieved IQ result of vCard-Temp-Get query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_vcardt_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, vcard = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_vcardt_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    vcard = stanza.querySelector("vCard");
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), vcard, error);
}

/**
 * Sends a vCard-Temp-Get IQ query.
 *
 * This is used to obtain either own or other peer's vCard-Temp.
 *
 * @param   {object}    to        Contact JID or null to get own
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_vcardt_get_query(to, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"},
              xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD}));

  // Set the "to" attribute if supplied
  if(to !== null) iq.setAttribute("to", to);

  // Use generic iq parsing function
  xows_xmp_send(iq, xows_xmp_vcardt_get_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * User Avatar to vCard-Based Avatars Conversion (XEP-0398)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for User Avatar to vCard-Based Avatars Conversion (XEP-0398) XMLNS
 */
const XOWS_NS_PEPVCARDCONV = "urn:xmpp:pep-vcard-conversion:0";

/* ---------------------------------------------------------------------------
 *
 * Publish-Subscribe (XEP-0060)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Publish-Subscribe (XEP-0060) XMLNS
 */
const XOWS_NS_PUBSUB       = "http://jabber.org/protocol/pubsub";
const XOWS_NS_PUBSUBEVENT  = "http://jabber.org/protocol/pubsub#event";
const XOWS_NS_PUBSUBOWNER  = "http://jabber.org/protocol/pubsub#owner";
const XOWS_NS_PUBSUBOPTS   = "http://jabber.org/protocol/pubsub#publish-options";

/**
 * Module Event-Forwarding callback for Received PEP notification
 */
let xows_xmp_fw_msg_onpubs = function() {};

/* ---------------------------------------------------------------------------
 * Publish-Subscribe - Common routines
 * ---------------------------------------------------------------------------*/
/**
 * Handles recevied PEP-Node-Notification message.
 *
 * @param   {string}    from      Message Sender
 * @param   {string}    event     The <event> element of received message
 */
function xows_xmp_pubsub_recv(from, event)
{
  const items = event.querySelector("items");
  if(!items) return false;

  // Get each <item>
  const itemls = [];
  const allitem = items.querySelectorAll("item");
  for(let i = 0; i < allitem.length; ++i) {
    itemls.push({ "id"      : allitem[i].getAttribute("id"),
                  "child"   : allitem[i].firstChild});
  }

  // Get each <retract>
  const retrls = [];
  const allretr = items.querySelectorAll("retract");
  for(let i = 0; i < allretr.length; ++i) {
    retrls.push({ "id"      : allretr[i].getAttribute("id")});
  }

  // Forward event
  xows_xmp_fw_msg_onpubs(from, items.getAttribute("node"), itemls, retrls);

  return true; //< stanza processed
}

/**
 * Sends a PEP-Node-Publish IQ query.
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {element}   publish   Payload XML node (<publish>)
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_pubsub_publish(node, publish, access, onparse)
{
  const children = [publish];

  // the <publish-options> child
  if(access) {
    children.push(xows_xml_node("publish-options",{"node":node},
                    xows_xmp_xdata_make([ {"var":"FORM_TYPE","type":"hidden",
                                            "value":[XOWS_NS_PUBSUBOPTS]},
                                          {"var":"pubsub#access_model",
                                            "value":[access]},
                                          {"var":"pubsub#persist_items",
                                            "value":["true"]}])));
  }

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},children));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parses received result of PEP-Node-Configure-Get IQ query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_pubsub_conf_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, node = null, xform = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_pubsub_conf_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Get PubSub node
    node = stanza.querySelector("configure").getAttribute("node");
    // Parse configuration Form DATA
    xform = xows_xmp_xdata_parse(stanza.querySelector("x"));
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), node, xform, error);
}

/**
 * Sends a PEP-Node-Configure-Get IQ query.
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_pubsub_conf_get_query(node, onparse)
{
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUBOWNER},
                  xows_xml_node("configure",{"node":node})));

  // Send final message
  xows_xmp_send(iq, xows_xmp_pubsub_conf_get_parse, onparse);
}

/**
 * Sends a PEP-Node-Configure-Set IQ query.
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {object}    xform     PEP configuration Data Form to submit
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_pubsub_conf_set_query(node, xform, onparse)
{
  const x = xows_xmp_xdata_make(xform);

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUBOWNER},
                  xows_xml_node("configure",{"node":node},x)));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Sends a PEP-Node-Configure-Set Cancel IQ query.
 *
 * This is used to cancel PEP node configuration.
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_pubsub_conf_set_cancel(node, onparse)
{
  const x = xows_xmp_xdata_cancel();

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUBOWNER},
                  xows_xml_node("configure",{"node":node},x)));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Sends a PEP-Node-Retract-Set IQ query.
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {string}    id        Item Id to delete
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_pubsub_retract(node, id, onparse)
{
  const item = xows_xml_node("item",{"id":id});

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("retract",{"node":node,"notify":"true"},item)));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* ---------------------------------------------------------------------------
 * Publish-Subscribe - PEP Native Bookmarks (XEP-0402)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for PEP Native Bookmarks (XEP-0402) XMLNS
 */
const XOWS_NS_BOOKMARKS = "urn:xmpp:bookmarks:1";

/**
 * Sends PEP-Node-Publish IQ query for Native-Bookmarks node.
 *
 * @param   {string}    jid       Bookmark Room JID
 * @param   {string}    name      Bookmark display name
 * @param   {boolean}   auto      Room autojoin flag
 * @param   {string}    nick      Room prefered nick
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_bookmark_publish(jid, name, auto, nick, onparse)
{
  // The <conference> node
  const conference = xows_xml_node("conference",{"xmlns":XOWS_NS_BOOKMARKS,"name":name,"autojoin":auto});

  // Optional <nick> child of <conference>
  if(nick)  xows_xml_parent(conference, xows_xml_node("nick",null,nick));

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_BOOKMARKS},
                    xows_xml_node("item",{"id":jid},
                      conference));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_BOOKMARKS, publish, "whitelist", onparse);
}

/**
 * Sends PEP-Node-Publish IQ query for Native-Bookmarks node.
 *
 * @param   {string}    jid       Bookmark Room JID
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_bookmark_retract(jid, onparse)
{
  xows_xmp_pubsub_retract(XOWS_NS_BOOKMARKS, jid, onparse);
}

/**
 * Parses received IQ result of PEP-Node-Get query for Native-Bookmarks node.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_bookmark_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error;
  const itemls = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_nick_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Get each <item>
    const allitem = stanza.querySelectorAll("item");
    for(let i = 0; i < allitem.length; ++i) {
      itemls.push({ "id"      : allitem[i].getAttribute("id"),
                    "child"   : allitem[i].firstChild});
    }
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), itemls, [], error);
}

/**
 * Sends a PEP-Node-Get IQ query for Native-Bookmarks node.
 *
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_bookmark_get_query(onparse)
{
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_BOOKMARKS})));
  // Send query
  xows_xmp_send(iq, xows_xmp_bookmark_get_parse, onparse);
}

/* ---------------------------------------------------------------------------
 * Publish-Subscribe - vCard4 Over XMPP (XEP-0292)
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for vCard4 Over XMPP (XEP-0292) XMLNS
 */
const XOWS_NS_VCARD4       = "urn:xmpp:vcard4";
const XOWS_NS_IETF_VCARD4  = "urn:ietf:params:xml:ns:vcard-4.0";

/**
 * Sends PEP-Node-Publish IQ query for vCard4 node.
 *
 * @param   {object}    vcard     vCard4 data to set
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_vcard4_publish(vcard, access, onparse)
{
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_VCARD4},
                    xows_xml_node("item",null,
                      xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4},vcard)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_VCARD4, publish, access, onparse);
}

/**
 * Parses received IQ result of PEP-Node-Get query for vCard4 node.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_vcard4_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, vcard4 = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_vcard4_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    vcard4 = stanza.querySelector("vcard");
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), vcard4, error);
}

/**
 * Sends a PEP-Node-Get IQ query for vCard4 node.
 *
 * @param   {string}    to        Contact JID get vcard
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_vcard4_get_query(to, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get","to":to},
              xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4}));

  xows_xmp_send(iq, xows_xmp_vcard4_get_parse, onparse);
}

/* ---------------------------------------------------------------------------
 * Publish-Subscribe - User Nickname (XEP-0172)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for User Nickname (XEP-0172) XMLNS
 */
const XOWS_NS_NICK = "http://jabber.org/protocol/nick";

/**
 * Sends PEP-Node-Publish IQ query for User-Nickname node.
 *
 * @param   {string}    nick      Nickname to publish
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_nick_publish(nick, onparse)
{
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null,
                      xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_NICK, publish, null, onparse);
}

/**
 * Parses received IQ result of PEP-Node-Get query for User-Nickname node.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_nick_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, nick = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_nick_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    nick = stanza.querySelector("nick");
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), nick, error);
}

/**
 * Sends a PEP-Node-Get IQ query for User-Nickname node.
 *
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_nick_get_query(to, onparse)
{
  // Create the query
  /*
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null))));
  */
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_NICK})));

  // Send query
  xows_xmp_send(iq, xows_xmp_nick_get_parse, onparse);
}

/* ---------------------------------------------------------------------------
 * XMPP API - PubSub - User Avatar (XEP-0084)
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for User Avatar (XEP-0084) XMLNS
 */
const XOWS_NS_AVATAR_DATA  = "urn:xmpp:avatar:data";
const XOWS_NS_AVATAR_META  = "urn:xmpp:avatar:metadata";

/**
 * Sends PEP-Node-Publish IQ query for Avatar:Data node.
 *
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {string}    data      Base-64 encoded Data to publish
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_avat_data_publish(hash, data, onparse)
{
  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash},
                      xows_xml_node("data",{"xmlns":XOWS_NS_AVATAR_DATA},data)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_DATA, publish, null, onparse);
}

/**
 * Sends PEP-Node-Publish IQ query for Avatar:Metadata node.
 *
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {number}    type      Image type (expected image/png)
 * @param   {number}    bytes     Image data size in bytes
 * @param   {number}    width     Image width in pixel
 * @param   {number}    height    Image width in pixel
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_avat_meta_publish(hash, type, bytes, width, height, onparse)
{
  let publish;

  if(hash) {

    // Create the <info> node
    const info = xows_xml_node("info",{"id":hash,"type":type,"bytes":bytes,"width":width,"height":height});

    // The <publish> child
    publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_META},
                xows_xml_node("item",{"id":hash},
                  xows_xml_node("metadata",{"xmlns":XOWS_NS_AVATAR_META},info)));
  } else {

    // The <publish> child
    publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_META},
                xows_xml_node("item",null,xows_xml_node("metadata",{"xmlns":XOWS_NS_AVATAR_META})));
  }

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_META, publish, null, onparse);
}

/**
 * Parses received IQ result of PEP-Node-Get query for Avatar:Data node
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_avat_data_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, id = null, data = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_avat_data_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    // Retrieve the first <item> child
    const item = stanza.querySelector("item");
    if(item) {
      // Get the data hash
      id = item.getAttribute("id");
      // Retrieve the <data> child
      data = xows_xml_innertext(item.querySelector("data"));
    }
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), id, data, error);
}

/**
 * Sends PEP-Node-Get IQ query for Avatar:Data node.
 *
 * @param   {number}    to        Target bare JID
 * @param   {string}    hash      Data Id to get (SAH-1 data hash)
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_avat_data_get_query(to, hash, onparse)
{
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash}))));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_data_get_parse, onparse);
}

/**
 * Parses received IQ result of PEP-Node-Get query for Avatar:Metadata node
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_avat_meta_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, metadata = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_avat_meta_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    metadata = stanza.querySelector("metadata");
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), metadata, error);
}

/**
 * Sends PEP-Node-Get IQ query for Avatar:Metadata node.
 *
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_avat_meta_get_query(to, onparse)
{
  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_META})));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_meta_get_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * Message Archive Management (XEP-0313)
 *
 * -------------------------------------------------------------------*/
/**
 * Constant value for Message Archive Management (XEP-0313) XMLNS
 */
const XOWS_NS_MAM = "urn:xmpp:mam:2";

/**
 *  Constant value for Result Set Management (XEP-0059) XMLNS
 */
const XOWS_NS_RSM = "http://jabber.org/protocol/rsm";

/**
 * Storage stack for MAM query result tracking and processing
 */
const xows_xmp_mam_stack = new Map();

/**
 * Storage for for MAM query process parameters
 */
const xows_xmp_mam_param = new Map();

/**
 * Handles received MAM result Message.
 *
 * @param   {element}   result    Received <result> element.
 */
function xows_xmp_mam_result_recv(result)
{
  // Get result page ID
  const page = result.getAttribute("id");

  // Get result queryid
  const qid = result.getAttribute("queryid");
  if(!xows_xmp_mam_stack.has(qid)) {
    xows_log(1,"xmp_recv_mam_result","unknown queryid for MAM result",qid);
    return;
  }

  // Get forwarded content
  const forward = result.querySelector("forwarded");
  if(!forward) return false;

  // We found found a <message> node
  const message = forward.querySelector("message");
  if(!message) return false;

  // Get message common data
  const id = message.getAttribute("id");
  const type = message.getAttribute("type");
  const from = message.getAttribute("from");
  const to = message.getAttribute("to");

  let body, xoob, recp, repl, retr, rpid, rpto, orid, szid, ocid;

  // Notice for future implementation :
  //
  // It is important to NOT delete any received archive result, even
  // "invisibles" ones such as Chat States, Receipts and Retractions in order
  // to keep consistant sequence with precise timestamp to properly gather
  // next or previous archives.

  // Loop over children
  for(let i = 0; i < message.childNodes.length; ++i) {

    const node = message.childNodes[i];

    // Skip the non-object nodes
    if(node.nodeType !== 1)
      continue;

    // Get XMLNS
    const xmlns = node.namespaceURI;
    const tname = node.tagName;

    // Check for chatstate
    if(xmlns === XOWS_NS_CHATSTATES)
      continue; //< We don't care chat states

    // Check for delivery receipt
    if(xmlns === XOWS_NS_RECEIPTS) {
      recp = node.getAttribute("id");
      continue;
    }

    // Check for message retraction
    if(xmlns === XOWS_NS_RETRACT) {
      retr = node.getAttribute("id");
      continue; //< We do not need more data
    }

    // Check for correction
    if(xmlns === XOWS_NS_CORRECT) {
      repl = node.getAttribute("id");
      continue;
    }

    // Check for Replies (XEP-0461)
    if(xmlns === XOWS_NS_REPLY) {
      rpid = node.getAttribute("id");
      if(node.hasAttribute("to"))
        rpto = node.getAttribute("to");
      continue;
    }

    if(xmlns === XOWS_NS_SID) {
      if(tname === "origin-id") orid = node.getAttribute("id");
      if(tname === "stanza-id") szid = node.getAttribute("id");
      continue;
    }

    if(xmlns === XOWS_NS_OCCUID) {
      ocid = node.getAttribute("id");
      continue;
    }

    // Check for Out Of Band Data URI
    if(xmlns === XOWS_NS_XOOB) {
      const url = node.querySelector("url"); //< search for <url>
      xoob = xows_xml_innertext(url);
      continue;
    }

    // Check for <body> node
    if(tname === "body") {
      body = node.hasChildNodes() ? xows_xml_innertext(node) : "";
    }
  }

  // We should found a <delay> node
  let time = null;
  const delay = forward.querySelector("delay");
  if(delay) time = new Date(delay.getAttribute("stamp")).getTime();

  // If message is a retraction, delete the fallback body text
  if(retr) body = null;

  // If no stanza-id uses result page which is the Stable ID
  if(!szid) szid = page;

  // Add archived message to stack
  xows_xmp_mam_stack.get(qid).push(xows_xmp_message_forge(id, to, from, type, body, xoob, time,
                                                          recp, retr, repl, rpid, rpto,
                                                          orid, szid, ocid, page));

  xows_log(2,"xmp_recv_mam_result","Adding archived message to result stack","from "+from);

  return true; //< stanza processed
}

/**
 * Parses received IQ result of Message-Archive-Management query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_mam_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  // Check for query error
  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_mam_parse");
    return;
  }

  // Get query result id
  const id = stanza.getAttribute("id");
  if(!xows_xmp_mam_param.has(id)) {
    xows_log(1,"xmp_mam_parse","MAM query id not found",id);
    return;
  }

  // Retrieve stored query parameters
  const param = xows_xmp_mam_param.get(id);
  xows_xmp_mam_param.delete(id); //< delete entrie we do not need it

  // Retrieve queryid to get proper result stack
  if(!xows_xmp_mam_stack.has(param.qid)) {
    xows_log(1,"xmp_mam_parse","MAM result queryid not found",param.qid);
    return;
  }
  const stack = xows_xmp_mam_stack.get(param.qid);
  xows_xmp_mam_stack.delete(param.qid); //< delete entrie we do not need it

  //Check for the <fin> node to ensure this is what we seek for
  const fin = stanza.querySelector("fin");
  if(fin) {

    // Variables we will need
    let node, first, last, complete, count = 0;

    // Check whether archive request is completed
    complete = (fin.getAttribute("complete") === "true") ? true : false;

    // Total page count (beyond "max" value) for this query
    node = fin.querySelector("count");
    if(node) count = parseInt(xows_xml_innertext(node));

    // Result first RSM Page id
    node = fin.querySelector("first");
    if(node) {
      first = xows_xml_innertext(node);
    } else {
      xows_log(2,"xmp_mam_parse","No result received");
      // Forward parse result
      onparse(param.to, param.jid, [], count, complete);
      return;
    }

    // Result last RSM Page id
    node = fin.querySelector("last");
    if(node) last = xows_xml_innertext(node);

    // Extract messages from stack
    let result, i = 0;
    const n = stack.length;

    // Align index to the first page
    for( ; i < n; i++)
      if(stack[i].page === first) break;

    if(i >= n) {
      xows_log(0, "xmp_mam_parse","first result page not found in stack",first);
      result = []; //< create empty result
    } else {
      // Get messages untile we found the last page
      const start = i;
      let size = 0;
      do {
        if(i === n) {
          xows_log(1, "xmp_mam_parse","last result page not found (reached end of stack)",last);
          break;
        }
        size++;
      } while(stack[i++].page !== last);

      // extract messages from stack
      result = stack.splice(start, size);
    }

    xows_log(2,"xmp_mam_parse","results collected","("+result.length+"/"+count+") '"+first+"'=>'"+last+"'");

    // Forward parse result
    onparse(param.to, param.jid, result, count, complete);
  }
}

/**
 * Sends a Message-Archive-Management IQ query.
 *
 * @param   {string}    to        Query destination, or Null for default
 * @param   {number}    max       Maximum count of result pages to get
 * @param   {string}    jid       With JID filter
 * @param   {number}    start     Start time filter
 * @param   {number}    end       End time filter
 * @param   {string}    before    Result page Id to get messages before
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_mam_query(to, max, jid, start, end, before, onparse)
{
  // Add the needed x:data filter field
  const field = [];
  field.push({"var":"FORM_TYPE","type":"hidden","value":[XOWS_NS_MAM]});
  if(  jid) field.push({"var":"with"  ,"value":[jid]});
  if(start) field.push({"var":"start" ,"value":[new Date(start).toJSON()]});
  if(  end) field.push({"var":"end"   ,"value":[new Date(end).toJSON()]});

  // The rsm part
  const rsm = xows_xml_node("set",{"xmlns":XOWS_NS_RSM},
                    xows_xml_node("max",null,max));

  // If the before value is set, or if start is endefined
  // (ascending time query) we add the <befor> child
  if(before || !start) {
    xows_xml_parent(rsm, xows_xml_node("before",null,before));
  }

  // Generate new query ID with proper stack slot
  const qid = xows_gen_nonce_asc(12);
  xows_xmp_mam_stack.set(qid,[]);

  // Create the final stanza
  const id = xows_gen_uuid();
  const iq =  xows_xml_node("iq",{"id":id,"type":"set"},
                xows_xml_node("query",{"xmlns":XOWS_NS_MAM,"queryid":qid},[
                  xows_xmp_xdata_make(field),rsm]));

  if(to !== null) iq.setAttribute("to",to);

  // Store query ID with the "with" parameter
  xows_xmp_mam_param.set(id,{"to":to,"jid":jid,"qid":qid});

  xows_log(2,"xmp_mam_query","send Archive query","with "+jid+" start "+start+" end "+end);

  // Send the query
  xows_xmp_send(iq, xows_xmp_mam_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * HTTP File Upload (XEP-0363)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for HTTP File Upload (XEP-0363) XMLNS
 */
const XOWS_NS_HTTPUPLOAD = "urn:xmpp:http:upload:0";

/**
 * Parses received IQ result of HTTP-File-Upload query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_upld_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  const id = stanza.getAttribute("id");

  let error, geturl = null, puthdr = [], puturl = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_upld_parse");
    error = xows_xmp_error_parse(stanza);
    // Search for HTTP-Upload <condition> child
    const upldcond = xows_xml_ns_select(stanza, XOWS_NS_HTTPUPLOAD);
    if(upldcond)
      error.upld = upldcond.tagName;
  } else {

    // Get PUT and GET urls
    puturl = stanza.querySelector("put").getAttribute("url");
    geturl = stanza.querySelector("get").getAttribute("url");

    // Parse HTTP PUT header data
    const slot_hdr = stanza.querySelectorAll("header");
    if(slot_hdr.length) {
      for(let i = 0; i < slot_hdr.length; ++i)
        puthdr.push({"name":slot_hdr[i].getAttribute("name"),
                     "data":xows_xml_innertext(slot_hdr[i])});
    }
  }

  // Forward parse result
  onparse(id, puturl, puthdr, geturl, error);
}

/**
 * Sends an HTTP-File-Upload IQ query.
 *
 * @param   {string}    to        Http-Upload service URL
 * @param   {string}    id        Custom query ID to track result
 * @param   {string}    name      Upload file name
 * @param   {number}    size      Upload file size in bytes
 * @param   {string}    type      Upload file MIM type
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_upld_query(to, id, name, size, type, onparse)
{
  let attr = {"xmlns":XOWS_NS_HTTPUPLOAD,"filename":name,"size":size};
  if(type) attr.type = type;

  const iq =  xows_xml_node("iq",{"id":id,"to":to,"type":"get"},
                xows_xml_node("request",attr));

  xows_xmp_send(iq, xows_xmp_upld_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * Multi-User Chat (XEP-0045)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Multi-User Chat (XEP-0045) XMLNS
 */
const XOWS_NS_MUC          = "http://jabber.org/protocol/muc";
const XOWS_NS_MUCUSER      = "http://jabber.org/protocol/muc#user";
const XOWS_NS_MUCOWNER     = "http://jabber.org/protocol/muc#owner";
const XOWS_NS_MUCADMIN     = "http://jabber.org/protocol/muc#admin";

/*
 * Privilege                  None      Visitor   Participant  Moderator
 * ---------------------------------------------------------------------
 * Present in Room                        x           x           x
 * Change Nickname                        x           x           x
 * Send Private Messages                  x           x           x
 * Invite Other Users                     x           x           x
 * Send Messages to All                   +           x           x
 * Modify Subject                                     x           x
 * Kick                                                           x
 * Grant Voice                                                    x
 * Revoke Voice                                                   x
 *
 *
 * Privilege                Outcast   None    Member    Admin   Owner
 * ---------------------------------------------------------------------
 * Ban Members                                            x       x
 * Edit Member List                                       x       x
 * Assign / Remove Moderator Role                         !       !
 * Edit Admin List                                                x
 * Edit Owner List                                                x
 * Change Room Configuration                                      x
 * Destroy Room                                                   x
 */

/**
 * Constant values for MUC Room Roles
 */
const XOWS_ROLE_NONE = 0;
const XOWS_ROLE_VIST = 1;
const XOWS_ROLE_PART = 2;
const XOWS_ROLE_MODO = 3;

/**
 * Conversion Map for MUC Room Role string to Constant value.
 */
const xows_xmp_role_val = new Map([
  ["none",        0],
  ["visitor",     1],
  ["participant", 2],
  ["moderator",   3]
]);

/**
 * Conversion Map for MUC Room Role Constant value to string.
 */
const xows_xmp_role_str = new Map([
  [0, "none"       ],
  [1, "visitor"    ],
  [2, "participant"],
  [3, "moderator"  ]
]);

/**
 * Constant values for MUC Room Affilations
 */
const XOWS_AFFI_OUTC = -1;
const XOWS_AFFI_NONE = 0;
const XOWS_AFFI_MEMB = 1;
const XOWS_AFFI_ADMN = 2;
const XOWS_AFFI_OWNR = 3;

/**
 * Conversion Map for MUC Room Affilations string to Constant value.
 */
const xows_xmp_affi_val = new Map([
  ["outcast", -1],
  ["none",     0],
  ["member",   1],
  ["admin",    2],
  ["owner",    3]
]);

/**
 * Conversion Map for MUC Room Affilations Constant value to string.
 */
const xows_xmp_affi_str = new Map([
  [-1, "outcast"],
  [ 0, "none"   ],
  [ 1, "member" ],
  [ 2, "admin"  ],
  [ 3, "owner"  ]
]);

/* ---------------------------------------------------------------------------
 * Multi-User Chat - MUC Owner usage
 * ---------------------------------------------------------------------------*/
/**
 * Parses received IQ result of MUC-Owner-Get query for Room configuration.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, xform = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_muc_cfg_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    xform = xows_xmp_xdata_parse(stanza.querySelector("x"));
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), xform, error);
}

/**
 * Sends a MUC-Owner-Get IQ query for Room configuration.
 *
 * This is used to obtain MUC Room current configuration as X Data From.
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_get_guery(to, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER}));

  xows_xmp_send(iq, xows_xmp_muc_cfg_get_parse, onparse);
}

/**
 * Sends a MUC-Owner-Cancel IQ query for Room configuration.
 *
 * This is used to cancel MUC Room configuration process.
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_muc_cfg_set_cancel(to, onparse)
{
  // Create the <x> form node
  const x = xows_xmp_xdata_cancel();

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},x));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Sends a MUC-Owner-Set IQ query for Room configuration.
 *
 * This is used to submit MUC Room modified configuration.
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {object[]}  form      Filled form array to submit
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_muc_cfg_set_query(to, form, onparse)
{
  // Create the <x> form node
  const x = xows_xmp_xdata_make(form);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},x));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Sends a MUC-Owner-Destroy IQ query for Room Deletion.
 *
 * @param   {string}    to        Room JID to be destroyed
 * @param   {string}   [alt]      Optional JID of alternate Room to join
 * @param   {string}   [pass]     Optional password for alternate Room
 * @param   {string}   [reason]   Optional reason string
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_muc_destroy_query(to, alt, pass, reason, onparse)
{
  // Base destroy node
  const destroy = xows_xml_node("destroy",null,null);

  // set optional elements
  if(alt) destroy.setAttribute("jid", alt);
  if(pass) xows_xml_parent(destroy,xows_xml_node("password",null,pass));
  if(reason) xows_xml_parent(destroy,xows_xml_node("reason",null,reason));

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},destroy));

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* ---------------------------------------------------------------------------
 * Multi-User Chat - MUC Admin usage
 * ---------------------------------------------------------------------------*/
/**
 * Sends a MUC-Admin-Set IQ query for Room Members Affilation.
 *
 * This is used to modify the affiliation of the specified Room members.
 *
 * the 'items' parameter must be an array of dictionnary objects formated as
 * follow:
 *    {affiliation:<string>,jid:<string>}
 * or
 *    {affiliation:<string>,jid:<string>,reason:<string>}
 *
 * @param   {string}    to        Room JID to assign Members affilation
 * @param   {object[]}  item      Item to configure affiliation
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_muc_affi_set_query(to, item, onparse)
{
  // Create the query node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_MUCADMIN});

  // Create optional reason node
  const reason = item.reason ? xows_xml_node("reason",null,item.reason) : null;

  // Create attributes list
  const attribs = { "jid":item.jid,
                    "affiliation":xows_xmp_affi_str.get(item.affi) };

  // Add item node
  xows_xml_parent(query,xows_xml_node("item",attribs,reason));

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},query);

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parses received IQ result of MUC-Admin-Get query for Room Members
 * Affilation.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_affi_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, items = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_muc_affi_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    const query = stanza.querySelector("query").childNodes;
    for(let i = 0; i < query.length; ++i) {
      items.push({"affi"  :xows_xmp_affi_val.get(query[i].getAttribute("affiliation")),
                  "jid"   :query[i].getAttribute("jid"),
                  "nick"  :query[i].getAttribute("nick")});
    }
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), items, error);
}

/**
 * Sends a MUC-Admin-Get IQ query for Room Members Affilation.
 *
 * This is used to obtain list of Members with the specified Room affiliation.
 *
 * @param   {string}    to        Room JID to assign Members role
 * @param   {string}    affi      Affiliation to get occupant list
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_affi_get_query(to, affi, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCADMIN},
                xows_xml_node("item",{"affiliation":affi})));

  xows_xmp_send(iq, xows_xmp_muc_affi_get_parse, onparse);
}

/* -------------------------------------------------------------------
 * Multi-User Chat - MUC Moderator usage
 * -------------------------------------------------------------------*/
/**
 * Sends a MUC Subject GroupChat Message.
 *
 * This is used to specify the subject of a MUC Room.
 *
 * @param   {string}    id        Message ID or null for auto
 * @param   {string}    to        JID of the recipient
 * @param   {string}    subj      Subject content
 *
 * @return  {string}    Sent message ID
 */
function xows_xmp_muc_subject_send(to, subj)
{
  const id = xows_gen_uuid();
  // Send message
  xows_xmp_send(xows_xml_node("message",{"id":id,"to":to,"type":"groupchat"},
                  xows_xml_node("subject",null,xows_xml_escape(subj))));
  return id;
}

/**
 * Sends a MUC-Admin-Set IQ query for Room Participants Role.
 *
 * This is used to modify the Role of the specified Room participants.
 *
 * The 'items' parameter must be an Array of dictionnary objects formated as
 * follow:
 *    {nick:<string>,role:<string>}
 * or
 *    {nick:<string>,role:<string>,reason:<string>}
 *
 * @param   {string}    to        Room JID to assign Occupant role
 * @param   {Object[]}  item      Item to configure role
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_xmp_muc_role_set_query(to, item, onparse)
{
  // Create the query node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_MUCADMIN});

  // Create optional reason node
  const reason = item.reason ? xows_xml_node("reason",null,item.reason) : null;

  // Create attributes list
  const attribs = { "nick":item.nick,
                    "role":xows_xmp_role_str.get(item.role) };

  // Add item node
  xows_xml_parent(query,xows_xml_node("item",attribs,reason));

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},query);

  // Use generic iq parse function to forward  unhandled error
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parses received IQ result of MUC-Admin-Get query for Room Participants
 * Role.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_role_get_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, items = [];

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_muc_role_get_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    const query = stanza.querySelector("query").childNodes;
    for(let i = 0; i < query.length; ++i) {
      items.push({"role"  :xows_xmp_role_val.get(query[i].getAttribute("role")),
                  "nick"  :query[i].getAttribute("nick")});
    }
  }

  onparse(stanza.getAttribute("from"), items, error);
}

/**
 * Sends a MUC-Admin-Get IQ query for Room Participants Role.
 *
 * This is used to obtain list of Participants with the specified Room Role.
 *
 * @param   {string}    to        Room JID to assign Occupant role
 * @param   {string}    role      Role to get occupant list
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_role_get_query(to, role, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCADMIN},
                xows_xml_node("item",{"role":role})));

  xows_xmp_send(iq, xows_xmp_muc_role_get_parse, onparse);
}

/* -------------------------------------------------------------------
 * Multi-User Chat - MUC Room-User usage
 * -------------------------------------------------------------------*/
/**
 * Parses received IQ result of MUC-disco#info query for MUC Reserved Nickname.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_nick_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error, name = null;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_muc_nick_parse");
    error = xows_xmp_error_parse(stanza);
  } else {
    const iden = stanza.querySelector("identity");
    name = iden ? iden.getAttribute("name") : null;
  }

  // Forward parsed result
  onparse(stanza.getAttribute("from"), name, error);
}

/**
 * Sends a MUC-disco#info IQ query for MUC Reserved Nickname.
 *
 * @param   {string}    to        Room JID to assign Occupant role
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_nick_query(to, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":"x-roomuser-item"}));

  xows_xmp_send(iq, xows_xmp_muc_nick_parse, onparse);
}

/* ---------------------------------------------------------------------------
 *
 * Jingle (XEP-0166)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant values for Jingle (XEP-0166) XMLNS
 */
const XOWS_NS_JINGLE       = "urn:xmpp:jingle:1";                     //< XEP-0166
const XOWS_NS_JINGLE_ERR   = "urn:xmpp:jingle:errors:1";              //< XEP-0166
const XOWS_NS_JINGLE_RTP1  = "urn:xmpp:jingle:apps:rtp:1";            //< XEP-0166
const XOWS_NS_JINGLE_RTPA  = "urn:xmpp:jingle:apps:rtp:audio";        //< XEP-0166
const XOWS_NS_JINGLE_RTPV  = "urn:xmpp:jingle:apps:rtp:video";        //< XEP-0166
const XOWS_NS_JINGLE_ICE   = "urn:xmpp:jingle:transports:ice-udp:1";  //< XEP-0166 / XEP-0176
const XOWS_NS_JINGLE_FB    = "urn:xmpp:jingle:apps:rtp:rtcp-fb:0";    //< XEP-0166 / XEP-0293
const XOWS_NS_JINGLE_HEXT  = "urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"; //< XEP-0166 / XEP-0294
const XOWS_NS_JINGLE_DTLS  = "urn:xmpp:jingle:apps:dtls:0";           //< XEP-0166 / XEP-0320
const XOWS_NS_JINGLE_GRP   = "urn:xmpp:jingle:apps:grouping:0";       //< XEP-0166 / XEP-0338
const XOWS_NS_JINGLE_SSMA  = "urn:xmpp:jingle:apps:rtp:ssma:0";       //< XEP-0166 / XEP-0339
const XOWS_NS_JINGLE_RTPI  = "urn:xmpp:jingle:apps:rtp:info:1";       //< XEP-0167

/**
 * Module Event-Forwarding callback for Received Jingle IQ
 */
let xows_xmp_fw_jing_onecv = function() {};

/* ---------------------------------------------------------------------------
 * Jingle - Session Description Protocol (SDP) conversions
 * ---------------------------------------------------------------------------*/
/**
 * Generates SDP string from Jingle RTP Session Request (<Jingle>) node.
 *
 * The supplied Jingle node must follow the Jingle RTP Sessions standard
 * (XEP-0167), which is the only one supported by this function.
 *
 * @parma   {object}    jingle      Jingle (<Jingle>) node to parse
 *
 * @return  {string}    SDP string or null if failed.
 */
function xows_xmp_jing_jingle2sdp(jingle)
{
  // Check for support and compatibility
  const descs = jingle.querySelectorAll("description");
  for(let i = 0; i < descs.length; ++i)
    if(descs[i].namespaceURI !== XOWS_NS_JINGLE_RTP1)
      return null;

  // Get proper SID for originator
  const sid = Math.round(Date.now() / 1.0);

  // Sessions base infos
  let sdp = "v=0\r\n"
          + "o=- "+sid+" 0 IN IP4 0.0.0.0\r\n"
          + "s=-\r\n"
          + "t=0 0\r\n";

  // Session group infos
  const group = jingle.querySelector("group");
  if(group) { // a=group:BUNDLE 0 1
    sdp += "a=group:"+group.getAttribute("semantics");
    const content = group.querySelectorAll("content");
    for(let i = 0; i < content.length; ++i) {
      sdp += " " + content[i].getAttribute("name");
    }
    sdp += "\r\n";
  }

  //a=msid-semantic:WMS *
  // not implemented

  //a=ice-options:trickle
  // not handled by jingle

  // Medias infos from <content> nodes
  const content = jingle.querySelectorAll(":scope > content");
  for(let i = 0; i < content.length; ++i) {

    const description = content[i].querySelector("description");
    const transport = content[i].querySelector("transport");
    const fingerprints = transport.querySelectorAll("fingerprint");

    //m=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101
    sdp += "m="+description.getAttribute("media");
    sdp += fingerprints.length ? " 1 RTP/SAVPF" : " RTP/AVPF";

    const payload_type = description.querySelectorAll("payload-type");
    for(let j = 0; j < payload_type.length; ++j)
      sdp += " "+payload_type[j].getAttribute("id");
    sdp += "\r\n";

    // c=IN IP4 0.0.0.0
    sdp += "c=IN IP4 0.0.0.0\r\n";

    // a=sendrecv
    const senders = transport.getAttribute("senders");
    switch(senders)
    {
    case "both": sdp += "a=sendrecv"; break;
    case "initiator": sdp += "a=sendonly"; break;
    case "responder": sdp += "a=recvonly"; break;
    case "none": sdp += "a=inactive"; break;
    }
    sdp += "\r\n";

    //a=mid:0
    sdp += "a=mid:"+content[i].getAttribute("name")+"\r\n";

    //a=ice-ufrag:73bc0993
    if(transport.hasAttribute("ufrag"))
      sdp += "a=ice-ufrag:"+transport.getAttribute("ufrag")+"\r\n";

    //a=ice-pwd:fd0164c4f8e4c916de72c655471c5214
    if(transport.hasAttribute("pwd"))
      sdp += "a=ice-pwd:"+transport.getAttribute("pwd")+"\r\n";

    //a=fingerprint:sha-256 3F:65:FD:45:26:D7:04:9F:54:7F:A6:28:BE:99:DA:F2:2D:10:D8:AA:CA:73:AA:17:81:29:FD:4F:BE:FD:14:90
    const fingerprint = transport.querySelectorAll("fingerprint");
    for(let j = 0; j < fingerprint.length; ++j)
      sdp += "a=fingerprint:"+fingerprint[j].getAttribute("hash")+" "+xows_xml_innertext(fingerprint[j])+"\r\n";

    //a=setup:actpass
    if(fingerprint.length)
      sdp += "a=setup:"+fingerprint[0].getAttribute("setup")+"\r\n";

    //a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
    const rtp_hdrext = description.querySelectorAll("rtp-hdrext");
    for(let j = 0; j < rtp_hdrext.length; ++j) {
      sdp += "a=extmap:"+rtp_hdrext[j].getAttribute("id");
      if(rtp_hdrext[j].getAttribute("senders") == "initiator") sdp += "/recvonly";
      sdp += " "+rtp_hdrext[j].getAttribute("uri")+"\r\n";
    }

    //a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
    for(let j = 0; j < payload_type.length; ++j) {
      const parameter = payload_type[j].querySelectorAll("parameter");
      if(parameter.length) {
        sdp += "a=fmtp:"+payload_type[j].getAttribute("id")+" ";
        for(let k = 0; k < parameter.length; ++k) {
          sdp += parameter[k].getAttribute("name")+"="+parameter[k].getAttribute("value");
          if(k < (parameter.length - 1)) sdp += ";";
        }
        sdp += "\r\n";
      }
    }

    //a=rtcp-fb:120 nack
    for(let j = 0; j < payload_type.length; ++j) {
      const rtcp_fb = payload_type[j].querySelectorAll("rtcp-fb");
      if(rtcp_fb.length) {
        for(let k = 0; k < rtcp_fb.length; ++k) {
          sdp += "a=rtcp-fb:"+payload_type[j].getAttribute("id");
          sdp += " "+rtcp_fb[k].getAttribute("type");
          if(rtcp_fb[k].hasAttribute("subtype"))
            sdp += " "+rtcp_fb[k].getAttribute("subtype");
          sdp += "\r\n";
        }
      }
    }

    //a=rtcp-mux
    if(description.querySelector("rtcp-mux"))
      sdp += "a=rtcp-mux\r\n";

    //a=rtpmap:98 rtx/90000
    for(let j = 0; j < payload_type.length; ++j) {
      sdp += "a=rtpmap:"+payload_type[j].getAttribute("id")+" ";
      sdp += payload_type[j].getAttribute("name");
      if(payload_type[j].hasAttribute("clockrate"))
        sdp += "/"+payload_type[j].getAttribute("clockrate");
      if(payload_type[j].hasAttribute("channels"))
        sdp += "/"+payload_type[j].getAttribute("channels");
      sdp += "\r\n";
    }

    //a=ssrc:1815119038 cname:{082af9fe-ac02-43d5-b5b6-069a14fa999f}
    const source = description.querySelectorAll("source");
    for(let j = 0; j < source.length; ++j) {
      sdp += "a=ssrc:"+source[j].getAttribute("ssrc");
      const parameter = source[j].querySelector("parameter");
      if(parameter)
        sdp += " "+parameter.getAttribute("name")+":"+parameter.getAttribute("value");
      sdp += "\r\n";
    }

    //a=ssrc-group:FID 1815119038 3975978373
    const ssrc_group = description.querySelectorAll("ssrc-group");
    for(let j = 0; j < ssrc_group.length; ++j) {
      sdp += "a=ssrc-group:"+ssrc_group[j].getAttribute("semantics");
      const source = ssrc_group[j].querySelectorAll("source");
      for(let k = 0; k < source.length; ++k) {
        sdp += " "+source[k].getAttribute("ssrc");
      }
      sdp += "\r\n";
    }

    //a=candidate:0 1 UDP 2122187007 192.168.16.8 35041 typ host
    const candidate = transport.querySelectorAll("candidate");
    for(let j = 0; j < candidate.length; ++j) {
      sdp += "a=candidate:"+candidate[j].getAttribute("foundation");
      sdp += " "+candidate[j].getAttribute("component");
      sdp += " "+candidate[j].getAttribute("protocol").toUpperCase();
      sdp += " "+candidate[j].getAttribute("priority");
      sdp += " "+candidate[j].getAttribute("ip");
      sdp += " "+candidate[j].getAttribute("port");
      if(candidate[j].hasAttribute("type")) sdp += " typ "+candidate[j].getAttribute("type");
      if(candidate[j].hasAttribute("rel-addr")) sdp += " raddr "+candidate[j].getAttribute("rel-addr");
      if(candidate[j].hasAttribute("rel-port")) sdp += " rport "+candidate[j].getAttribute("rel-port");
      if(candidate[j].hasAttribute("generation")) sdp += " generation "+candidate[j].getAttribute("generation");
      sdp += "\r\n";
    }
  }

  return sdp;
}

/**
 * Builds up jingle RTP Session Request (<Jingle>) node from SDP string.
 *
 * Notice that the "initiator", "responder" and "action"  attributes of the
 * Jingle (<Jingle>) query cannot be deducted from SPD data,  therefore, they
 * are not set by this function.
 *
 * @parma   {string}    sdp         SDP string to parse
 *
 * @return  {object}    Jingle (<Jingle>) node.
 */
function xows_xmp_jing_sdp2jingle(sdp)
{
  // Parse SDP string to JSON
  const sdpjson = xows_sdp_parse(sdp);

  // Base <jingle> node
  const jingle = xows_xml_node("jingle",{"xmlns":XOWS_NS_JINGLE});

  const creator = "initiator"; //< FIXME: when this is not the case ?

  // Create the <group> node
  const group = xows_xml_node("group",{"xmlns":XOWS_NS_JINGLE_GRP,"semantics":sdpjson.group.type});
  for(const mid in sdpjson.group.mids)
    xows_xml_parent(group, xows_xml_node("content",{"name":mid}));
  // Add <group> node to <jingle>
  xows_xml_parent(jingle, group);

  // Create <content> nodes from SDP Medias
  for(let i = 0; i < sdpjson.media.length; ++i) {

    // Create the <content> node
    const content = xows_xml_node("content",{"creator":creator,"name":sdpjson.media[i].mid});

    // Create the <description> node
    const description = xows_xml_node("description",{"xmlns":XOWS_NS_JINGLE_RTP1,"media":sdpjson.media[i].type});

    // Add the <payload-type> nodes to <description>
    if(sdpjson.media[i].rtpmap) {
      const rtp = sdpjson.media[i].rtpmap;
      for(let j = 0; j < rtp.length; ++j)
        xows_xml_parent(description, xows_xml_node("payload-type",{"id":rtp[j].payload,"name":rtp[j].codec,"clockrate":rtp[j].rate,"channels":rtp[j].channels}));
    }

    // Add <parameter> nodes (from fmtp) to <payload-type> nodes
    if(sdpjson.media[i].fmtp) {
      const fmt = sdpjson.media[i].fmtp;
      for(let j = 0; j < fmt.length; ++j) {
        // Retrieve previousely created <payload-type> node
        const payload_type = description.querySelector("payload-type[id='"+fmt[j].payload+"']");
        if(payload_type) {
          for(let k = 0; k < fmt[j].config.length; ++k) {
            const param = fmt[j].config[k].split('=');
            xows_xml_parent(payload_type, xows_xml_node("parameter",{"name":param[0],"value":param[1]}));
          }
        }
      }
    }
    // Add <rtcp-fb> nodes (from rtcp-fb) to <payload-type> nodes
    if(sdpjson.media[i].rtcpFb) {
      const fb = sdpjson.media[i].rtcpFb;
      for(let j = 0; j < fb.length; ++j) {
        // Retrieve previousely created <payload-type> node
        const payload_type = description.querySelector("payload-type[id='"+fb[j].payload+"']");
        if(payload_type)
          xows_xml_parent(payload_type, xows_xml_node("rtcp-fb",{"xmlns":XOWS_NS_JINGLE_FB,"type":fb[j].type,"subtype":fb[j].subtype}));
      }
    }

    // add <ssrc-group> nodes to <description>
    if(sdpjson.media[i].ssrcGroup) {
      const sgrp = sdpjson.media[i].ssrcGroup;
      for(let j = 0; j < sgrp.length; ++j) {
        // new <ssrc-group> node
        const ssrc_group = xows_xml_node("ssrc-group",{"xmlns":XOWS_NS_JINGLE_SSMA,"semantics":sgrp[j].semantics});
        // add <source> nodes to <ssrc-group>
        for(let k = 0; k < sgrp[j].ssrcs.length; ++k)
          xows_xml_parent(ssrc_group, xows_xml_node("source",{"ssrc":sgrp[j].ssrcs[k]}));
        // add to <description>
        xows_xml_parent(description, ssrc_group);
      }
    }

    // add <source> nodes
    if(sdpjson.media[i].ssrc) {
      const ssrc = sdpjson.media[i].ssrc;
      for(let j = 0; j < ssrc.length; ++j) {
        // new <source> node with <parameter> into <description>
        xows_xml_parent(description, xows_xml_node("source",{"xmlns":XOWS_NS_JINGLE_SSMA,"ssrc":ssrc[j].id},
                                        xows_xml_node("parameter",{"name":ssrc[j].attribute,"value":ssrc[j].value})));
      }
    }

    // add <rtp-hdrext> nodes
    if(sdpjson.media[i].extmap) {
      const ext = sdpjson.media[i].extmap;
      for(let j = 0; j < ext.length; ++j) {
        // new <rtp-hdrext> node
        const rtp_hdrext = xows_xml_node("rtp-hdrext",{"xmlns":XOWS_NS_JINGLE_HEXT,"id":ext[j].value,"uri":ext[j].uri});
        if(ext[j].direction === "recvonly") rtp_hdrext.setAttribute("senders","initiator");
        // add to <description>
        xows_xml_parent(description, rtp_hdrext);
      }
    }

    // add <rtcp-mux> node
    if(sdpjson.media[i].rtcpMux)
      xows_xml_parent(description, xows_xml_node("rtcp-mux"));

    // Add <content> to <description>
    xows_xml_parent(content, description);

    // Create the <transport> node
    const transport = xows_xml_node("transport",{"xmlns":XOWS_NS_JINGLE_ICE,"pwd":sdpjson.media[i].icePwd,"ufrag":sdpjson.media[i].iceUfrag});

    // Set transport 'senders' attribute according SDP media direction
    switch(sdpjson.media[i].direction)
    {
    case "sendrecv":  transport.setAttribute("senders","both"); break;
    case "sendonly":  transport.setAttribute("senders","initiator"); break;
    case "recvonly":  transport.setAttribute("senders","responder"); break;
    case "inactive":  transport.setAttribute("senders","none"); break;
    }

    // Add <fingerprint> nodes
    if(sdpjson.media[i].fingerprint || sdpjson.fingerprint) {
      const fingerprint = sdpjson.media[i].fingerprint ? sdpjson.media[i].fingerprint : sdpjson.fingerprint;
      for(let j = 0; j < fingerprint.length; ++j)
        xows_xml_parent(transport, xows_xml_node("fingerprint",{"xmlns":XOWS_NS_JINGLE_DTLS,"hash":fingerprint[j].type,"setup":sdpjson.media[i].setup},fingerprint[j].hash));
    }

    // Add ICE candidates
    if(sdpjson.media[i].candidate) {
      const ice = sdpjson.media[i].candidate;
      for(let j = 0; j < ice.length; ++j) {
        // Node attributes
        const attribs = { "component":ice[j].component,"network":ice[j].network,"foundation":ice[j].foundation,"generation":ice[j].generation,
                          "protocol":ice[j].protocol,"priority":ice[j].priority,"ip":ice[j].ip,"port":ice[j].port,"type":ice[j].type,
                          "rel-addr":ice[j].raddr,"rel-port":ice[j].rport};

        // Add <candidate> node to <transport>
        xows_xml_parent(transport, xows_xml_node("candidate", attribs));
      }
    }

    // Add <transport> node to <content>
    xows_xml_parent(content, transport);

    // Add <content> to <jingle>
    xows_xml_parent(jingle, content);
  }

  return jingle;
}

/* ---------------------------------------------------------------------------
 * Jingle - Session management
 * ---------------------------------------------------------------------------*/
/**
 * Handles received Jingle IQ query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 */
function xows_xmp_jing_recv(stanza)
{
  const id = stanza.getAttribute("id");
  const from = stanza.getAttribute("from");
  const jingle = stanza.querySelector("jingle");
  const action = jingle.getAttribute("action");

  let data;

  switch(action)
  {
  case "session-terminate": {
      // Get terminate reason
      const reason = jingle.querySelector("reason");
      if(reason && reason.childNodes[0])
        data = reason.childNodes[0].tagName;
    } break;

  case "session-initiate":
  case "session-accept": {
      // Convert jingle RTP Session description to SDP string
      data = xows_xmp_jing_jingle2sdp(jingle);
      if(data === null) {
        xows_log(1,"xmp_recv_jingle","error","RTP to SDP conversion failed");
        // Send back error
        xows_xmp_iq_error_send(id, from, "cancel", "bad-request");
        return;
      }
    } break;

  case "session-info": {
      // Check whether <jingle> node has some payload,
      // otherwise this is a session ping
      if(jingle.childNodes.length)
        data = jingle.childNodes[0].tagName;
    } break;
  }

  // Forward to client
  xows_xmp_fw_jing_onecv(from, id, jingle.getAttribute("sid"), action, data);
}

/**
 * Parses received IQ result of Jingle query.
 *
 * @param   {element}   stanza    Received <iq> stanza
 * @param   {function}  onparse   Callback for parsed result forwarding
 */
function xows_xmp_jing_parse(stanza, onparse)
{
  const type = stanza.getAttribute("type");

  // Check for unhandled error
  if(xows_xmp_iq_unhandled(stanza,type,onparse))
    return;

  if(!xows_isfunc(onparse))
    return;

  let error;

  if(type === "error") {
    xows_xmp_error_log(stanza,1,"xmp_jing_parse");
    error = xows_xmp_error_parse(stanza);
    // Search for Jingle <condition> child
    const jingcond = xows_xml_ns_select(stanza, XOWS_NS_JINGLE_ERR);
    if(jingcond) error.jing = jingcond.tagName;
  }

  // Forward parse result
  onparse(stanza.getAttribute("from"), type, error);
}

/**
 * Sends a Jingle RTP-Session-Initiate IQ query.
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sdp         SDP offer string
 * @param   {function} [onparse]    Optional callback to receive query result
 *
 * @return  {string}    Initiated Jingle session ID
 */
function xows_xmp_jing_initiate_sdp(to, sdp, onparse)
{
  // Create <jingle> RTP session from SDP string
  const jingle = xows_xmp_jing_sdp2jingle(sdp);
  const sid = xows_gen_nonce_asc(16); // xows_sdp_get_sid(sdp);

  // Complete <jingle> node with proper attributes
  jingle.setAttribute("initiator",xows_xmp_bind.jful);
  jingle.setAttribute("action","session-initiate");
  jingle.setAttribute("sid",sid);

  // Send message
  const iq = xows_xml_node("iq",{"type":"set","to":to},jingle);

  // Use jingle-specific iq parse function to handle jingle errors
  xows_xmp_send(iq, xows_xmp_jing_parse, onparse);

  return sid;
}

/**
 * Sends a Jingle RTP-Session-Accept IQ query.
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sid         Jingle session ID
 * @parma   {string}    sdp         SDP answer string
 * @param   {function} [onparse]    Optional callback to receive query result
 */
function xows_xmp_jing_accept_sdp(to, sid, sdp, onparse)
{
  // Create <jingle> RTP session from SDP string
  const jingle = xows_xmp_jing_sdp2jingle(sdp);

  // Complete <jingle> node with proper attributes
  jingle.setAttribute("responder",xows_xmp_bind.jful);
  jingle.setAttribute("action","session-accept");
  jingle.setAttribute("sid",sid);

  // Send message
  const iq = xows_xml_node("iq",{"type":"set","to":to},jingle);

  // Use jingle-specific iq parse function to handle jingle errors
  xows_xmp_send(iq, xows_xmp_jing_parse, onparse);
}

/**
 * Sends a Jingle RTP-Session-Info IQ query.
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sid         Jingle session ID
 * @parma   {string}    info        Payload information to send
 * @parma   {string}   [attr]       Optional Payload attributes
 * @param   {function} [onparse]    Optional callback to receive query result
 */
function xows_xmp_jing_info(to, sid, info, attr, onparse)
{
  // Compose payload attributes
  let info_attr = {"xmlns":XOWS_NS_JINGLE_RTPI};
  if(attr) info_attr = Object.assign(info_attr, attr);

  // Create IQ stanza
  const iq =  xows_xml_node("iq",{"type":"set","to":to},
                xows_xml_node("jingle",{"xmlns":XOWS_NS_JINGLE,"sid":sid,"action":"session-info"},
                  xows_xml_node(info, info_attr, null)));

  // Use jingle-specific iq parse function to handle jingle errors
  xows_xmp_send(iq, xows_xmp_jing_parse, onparse);
}

/**
 * Sends a Jingle RTP-Session-Terminate IQ query.
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sid         Jingle session ID
 * @parma   {string}    reason      Session terminate reason
 * @param   {function} [onparse]    Optional callback to receive query result
 */
function xows_xmp_jing_terminate(to, sid, reason, onparse)
{
  // Create IQ stanza
  const iq =  xows_xml_node("iq",{"type":"set","to":to},
                xows_xml_node("jingle",{"xmlns":XOWS_NS_JINGLE,"sid":sid,"action":"session-terminate"},
                  xows_xml_node("reason",null,xows_xml_node(reason))));

  // Use jingle-specific iq parse function to handle jingle errors
  xows_xmp_send(iq, xows_xmp_jing_parse, onparse);
}

/**
 * Sends a Jingle-Specific IQ error.
 *
 * @parma   {string}    id          Stanza id to reply
 * @parma   {string}    to          Destination JID
 * @parma   {string}    type        Error type attribute
 * @parma   {string}    condjing    Jingle error condition
 * @parma   {string}    condxmpp    XMPP error condition
 */
function xows_xmp_jing_error(id, to, type, condjing, condxmpp)
{
  // Send error stanza
  xows_xmp_send(xows_xml_node("iq",{"id":id,"type":"error","to":to},
                  xows_xml_node("error",{"type":type},
                    [xows_xml_node(condxmpp,{"xmlns":XOWS_NS_IETF_STANZAS}),
                     xows_xml_node(condjing,{"xmlns":XOWS_NS_JINGLE_ERR})])));
}

/* ---------------------------------------------------------------------------
 *
 * XMPP API - Entity Capabilities (XEP-0115)
 *
 * ---------------------------------------------------------------------------*/
/**
 * Constant value for Entity Capabilities (XEP-0115) XMLNS
 */
const XOWS_NS_CAPS = "http://jabber.org/protocol/caps";

/**
 * Returns client (own) identity and features list.
 *
 * This returns an array of XML elements defining client identity and features.
 *
 * @return  {element[]}   Array of XML elements.
 */
function xows_xmp_caps_self_features()
{
  //let ns_vcard4 = XOWS_NS_VCARD4;
  let ns_avatar_meta = XOWS_NS_AVATAR_META;
  let ns_nick = XOWS_NS_NICK;
  let ns_bookmarks = XOWS_NS_BOOKMARKS;

  // Optional features (pubsub notify subscribtion)
  //if(xows_options.vcard4_notify) ns_vcard4 += "+notify";
  if(xows_options.cli_pepnotify_avat) ns_avatar_meta += "+notify";
  if(xows_options.cli_pepnotify_nick) ns_nick += "+notify";
  if(xows_options.cli_pepnotify_bkms) ns_bookmarks += "+notify";

  const caps = [
    xows_xml_node("identity",{"category":"client","name":XOWS_APP_NAME,"type":"web"}),
    xows_xml_node("feature",{"var":XOWS_NS_CAPS}),
    xows_xml_node("feature",{"var":XOWS_NS_DISCOINFO}),
    xows_xml_node("feature",{"var":XOWS_NS_DISCOITEMS}),
    xows_xml_node("feature",{"var":XOWS_NS_PING}),
    xows_xml_node("feature",{"var":XOWS_NS_TIME}),
    xows_xml_node("feature",{"var":XOWS_NS_VERSION}),
    xows_xml_node("feature",{"var":XOWS_NS_CHATSTATES}),
    xows_xml_node("feature",{"var":XOWS_NS_RECEIPTS}),
    xows_xml_node("feature",{"var":XOWS_NS_CORRECT}),
    xows_xml_node("feature",{"var":XOWS_NS_STYLING}),
    xows_xml_node("feature",{"var":XOWS_NS_SID}),
    xows_xml_node("feature",{"var":XOWS_NS_RETRACT}),
    xows_xml_node("feature",{"var":XOWS_NS_REPLY}),
    xows_xml_node("feature",{"var":XOWS_NS_XOOB}),
    xows_xml_node("feature",{"var":XOWS_NS_VCARD}),
    xows_xml_node("feature",{"var":ns_nick}),
    //xows_xml_node("feature",{"var":XOWS_NS_IETF_VCARD4}),
    //xows_xml_node("feature",{"var":ns_vcard4}),
    xows_xml_node("feature",{"var":XOWS_NS_AVATAR_DATA}),
    xows_xml_node("feature",{"var":ns_avatar_meta}),
    xows_xml_node("feature",{"var":ns_bookmarks}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTP1}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTPA}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTPV})
  ];

  return caps;
}

/**
 * Storage for cached client (own) capabilities verification string
 */
let xows_xmp_caps_self_cach = null;

/**
 * Returns client (own) entity capabilities verification hash string.
 *
 * This generates the verification hash from data returned by the
 * 'xows_xmp_caps_self_features' function.
 *
 * @return  {string}    Base64 encoded verficiation hash
 */
function xows_xmp_caps_self_verif()
{
  if(xows_xmp_caps_self_cach)
    return xows_xmp_caps_self_cach;

  const caps = xows_xmp_caps_self_features();

  let S = "";

  // List for identity
  const identiy = [];
  for(let i = 0; i < caps.length; ++i) {
    if(caps[i].tagName === "identity") {
      let iden = "";
      iden += caps[i].getAttribute("category") + "/";
      iden += caps[i].getAttribute("type") + "/";
      if(caps[i].hasAttribute("xml:lang"))
        iden += caps[i].getAttribute("xml:lang");
      iden += "/";
      iden += caps[i].getAttribute("name");
      identiy.push(iden);
    }
  }

  // Sort identity list
  identiy.sort();

  for(let i = 0; i < identiy.length; ++i)
    S += identiy[i] + "<";

  // List for feature
  const feature = [];
  for(let i = 0; i < caps.length; ++i)
    if(caps[i].tagName === "feature")
      feature.push(caps[i].getAttribute("var"));

  // Sort feature list
  feature.sort();

  for(let i = 0; i < feature.length; ++i)
    S += feature[i] + "<";

  // Save generated string
  xows_xmp_caps_self_cach = xows_bytes_to_b64(xows_hash_sha1(xows_str_to_utf8(S)));

  return xows_xmp_caps_self_cach;
}
