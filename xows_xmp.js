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
/* ------------------------------------------------------------------
 *
 *                          XMPP API Layer
 *
 * ------------------------------------------------------------------ */

//const XOWS_NS_RETRACT      = "urn:xmpp:message-retract:0";
//const XOWS_NS_RETRACT      = "urn:xmpp:message-retract:1";
//const XOWS_NS_MODERATE     = "urn:xmpp:message-moderate:0";
//const XOWS_NS_SID          = "urn:xmpp:sid:0";                        //< XEP-0359
//const XOWS_NS_MARKERS      = "urn:xmpp:chat-markers";

/* -------------------------------------------------------------------
 *
 * XMPP API - Client interface
 *
 * -------------------------------------------------------------------*/

/**
 * Server connection URL
 */
let xows_xmp_addr = null;

/**
 * XMPP Server domain
 */
let xows_xmp_host = null;

/**
 * XMPP authentication data
 */
const xows_xmp_auth = {"bare":null,"user":null,"pass":null,"regi":false};

/**
 * XMPP Session data
 */
const xows_xmp_bind = {"full":null,"bare":null,"node":null,"resc":null};

/**
 * XMPP interface error event client callback
 */
let xows_xmp_fw_onerror = function() {};

/**
 * Set callback functions for parse result of received common stanzas
 *
 * Possibles slot parameter value are the following:
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
 * @param   {string}    type      Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_xmp_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase()) {
    case "session":   xows_xmp_fw_onsession = callback; break;
    case "presence":  xows_xmp_fw_onpresence = callback; break;
    case "subscrib":  xows_xmp_fw_onsubscrib = callback; break;
    case "occupant":  xows_xmp_fw_onoccupant = callback; break;
    case "rostpush":  xows_xmp_fw_onrostpush = callback; break;
    case "message":   xows_xmp_fw_onmessage = callback; break;
    case "chatstate": xows_xmp_fw_onchatstate = callback; break;
    case "receipt":   xows_xmp_fw_onreceipt = callback; break;
    case "subject":   xows_xmp_fw_onsubject = callback; break;
    case "pubsub":    xows_xmp_fw_onpubsub = callback; break;
    case "jingle":    xows_xmp_fw_onjingle = callback; break;
    case "error":     xows_xmp_fw_onerror = callback; break;
    case "close":     xows_xmp_fw_onclose = callback; break;
  }
}

/**
 * Open a new XMPP client session to the specified WebSocket URL
 *
 * @param   {string}    url       URL to WebSocket service
 * @param   {string}    jid       Authentication JID (user@domain)
 * @param   {string}    password  Authentication password
 * @param   {boolean}   register  If true proceed to register new account
 */
function xows_xmp_connect(url, jid, password, register)
{
  // if socket already openned, close it
  xows_sck_destroy();

  // Set callbacks for socket events
  xows_sck_set_callback("open", xows_xmp_sck_onopen);
  xows_sck_set_callback("recv", xows_xmp_sck_onrecv);
  xows_sck_set_callback("close", xows_xmp_sck_onclose);

  // store connexion url
  xows_xmp_addr = url;

  // Reset bind data from previous session
  xows_xmp_bind.full = null;
  xows_xmp_bind.bare = null;
  xows_xmp_bind.node = null;
  xows_xmp_bind.resc = null;

  // Split JID into user and domain parts
  const jid_split = jid.split("@");

  // Verify we got a well formed JID
  xows_xmp_host = null;
  if(jid_split[1] !== undefined)
    if(jid_split[1].length !== 0)
      xows_xmp_host = jid_split[1];

  if(xows_xmp_host === null) {
    let err_msg = "Incomplete JID (undefined domain)";
    xows_log(0,"xmp_connect",err_msg);
    xows_xmp_fw_onclose(XOWS_SIG_ERR,err_msg); //< close with error message
    return;
  }

  // store authentication data
  xows_xmp_auth.bare = jid;
  xows_xmp_auth.user = jid_split[0];
  xows_xmp_auth.pass = password;

  // Is there a registration connexion
  xows_xmp_auth.regi = register;

  // Open new WebSocket connection
  xows_sck_create(url, "xmpp");
}

/**
 * Perform specific actions to handle XMPP connection loss
 *
 * @param   {string}    mesg  Optional error message
 */
function xows_xmp_connectloss(mesg)
{
  let code;

  // If session is active, this is indeed a connection loss
  if(xows_xmp_bind.resc) {

    // Output log
    xows_log(2,"xmp_connectloss","connection lost",xows_xmp_bind.resc);

    // Session is now over
    xows_xmp_bind.resc = null;

    // This is actually a connection loss
    code = XOWS_SIG_HUP;

  } else {

    // Probably connexion error
    code = XOWS_SIG_ERR;
  }

  // Forward to client
  xows_xmp_fw_onclose(code,mesg);
}

/**
 * Try to open a new XMPP client session to the specified WebSocket URL
 * using previousely defined connexion parameter.
 */
function xows_xmp_reconnect()
{
  // Output log
  xows_log(2,"xmp_reconnect","try reconnect",xows_xmp_addr);

  // Verify we have connexion parameters
  if(!xows_xmp_addr || !xows_xmp_auth.bare || !xows_xmp_auth.user || !xows_xmp_auth.pass)
    return;

  // If socket already openned, close it
  xows_sck_destroy();

  // Open new WebSocket connection
  xows_sck_create(xows_xmp_addr, "xmpp");
}

/**
 * Special function to close session and exit the quickest way
 * possible, used to terminate session when browser exit page
 */
function xows_xmp_flyyoufools()
{
  // Ignore if no socket available
  if(!xows_sck_sock)
    return;

  // Session is over
  xows_xmp_bind.resc = null;
  xows_xmp_auth.user = null;

  // Send unavailable <presence> stanza
  xows_sck_sock.send("<presence xmlns='jabber:client' type='unavailable'/>");

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.6

  // Send the <close> stanza to close stream
  xows_sck_sock.send("<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>");
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Socket routines and events
 *
 * -------------------------------------------------------------------*/

/**
 * Handle socket open event
 */
function xows_xmp_sck_onopen()
{
  // Initialize XMPP session open
  xows_xmp_fram_open_send();
}

/**
 * Handle socket close event
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [mesg]     Optional information or error message
 */
function xows_xmp_sck_onclose(code, mesg)
{
  // No username mean session closed by client
  if(xows_xmp_auth.user)
    // This may be a connection loss
    xows_xmp_connectloss(mesg);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Basic stanza Send and Receive routines
 *
 * -------------------------------------------------------------------*/
/**
 * List of XMPP specific XML name space strings
 */
const XOWS_NS_CLIENT       = "jabber:client";

/**
 * Handle socket received message event
 *
 * This parse the raw data as XML then forward it to the proper function.
 *
 * @param   {string}    data      Received raw data string
 */
function xows_xmp_sck_onrecv(data)
{
  // Get stanza object tree from raw XML string
  const stanza = xows_xml_parse(data).firstChild;
  const name = stanza.tagName;

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

  xows_log(1,"xmp_recv","unprocessed stanza",event.data);
}

/**
 * Send an XMPP stanza with optional callbacks function to handle
 * received result or response for server
 *
 * If the onresult parameter is defined, the callback is called once
 * an stanza with the same id as the initial query is received with
 * the received stanza as unique parameter.
 *
 * @param   {object}    stanza    Stanza XML Element object
 * @param   {function} [onresult] Callback for received query result
 * @param   {function} [onparse]  Callback for parsed result forwarding
 */
function xows_xmp_send(stanza, onresult, onparse)
{
  if(!xows_sck_sock)
    return;

  // Add jabber:client namespace
  if(stanza.tagName === "presence" ||
      stanza.tagName === "message" ||
      stanza.tagName === "iq") {
    if(!stanza.getAttribute("xmlns"))
      stanza.setAttribute("xmlns",XOWS_NS_CLIENT);
  }

  // Add id to stanza
  let id = stanza.getAttribute("id");
  if(!id) {
    id = xows_gen_uuid();
    stanza.setAttribute("id", id);
  }

  // If callaback is supplied, add request to stack
  if(xows_isfunc(onresult))
    xows_xmp_iq_stack.set(id,{"onresult":onresult,"onparse":onparse});

  // Send serialized data to socket
  xows_sck_send(xows_xml_serialize(stanza));
}

/* -------------------------------------------------------------------
 *
 * XMPP API - XMPP Subprotocol for WebSocket (RFC-7395)
 *
 * -------------------------------------------------------------------*/
/**
 * XMPP Subprotocol for WebSocket (RFC-7395) XMLNS constants
 */
const XOWS_NS_IETF_FRAMING = "urn:ietf:params:xml:ns:xmpp-framing";

/**
 * Parse received XMPP Framing (RFC-7395 Subprotocol for WebSocket)
 *
 * @param   {object}    stanza    Received <open> stanza
 */
function xows_xmp_fram_open_recv(stanza)
{
  // Check for proper version & XMLNS
  if(stanza.getAttribute("version") != "1.0" || stanza.getAttribute("xmlns") != XOWS_NS_IETF_FRAMING) {
    const err_msg = "Invalid server framing";
    xows_log(0,"xmp_fram_open_recv", err_msg);
    xows_xmp_fram_close_send(XOWS_SIG_ERR,err_msg);
  }

  return true;
}

/**
 * Open Framed Stream (RFC-7395 Subprotocol for WebSocket)
 */
function xows_xmp_fram_open_send()
{
  xows_log(2,"xmp_fram_open_send","open framed stream");

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.3

  // Send the first <open> stanza to init stream
  xows_xmp_send(xows_xml_node("open",{"to":xows_xmp_host,"version":"1.0","xmlns":XOWS_NS_IETF_FRAMING}));
}

/**
 * Function to proceed an received <close> stanza
 *
 * @param   {object}    stanza    Received <close> stanza
 */
function xows_xmp_fram_close_recv(stanza)
{
  xows_log(2,"xmp_fram_close_recv","framed stream closed");

  // Check whether this is an unexpected close
  if(xows_xmp_bind.resc) {

    // Close is unexpected
    xows_xmp_connectloss("Server closed the stream");

  } else {

    // Close follow our request
    xows_sck_destroy();
    xows_xmp_fw_onclose(3); //< close without error
  }

  return true;
}

/**
 * Close the current a new XMPP client session and WebSocket
 * connection
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [mesg]     Optional information or error message
 */
function xows_xmp_fram_close_send(code, mesg)
{
  // Session is over
  xows_xmp_bind.resc = null;

  // https://datatracker.ietf.org/doc/html/rfc7395#section-3.6

  // Send the <close> stanza to close stream
  xows_xmp_send(xows_xml_node("close",{"xmlns":XOWS_NS_IETF_FRAMING}));
  //xows_sck_sock.send("<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>");

  // Some log output
  xows_log(2,"xmp_fram_close_send","close framed stream");

  // Different behavior depending whether close initiated by client
  if(code < 0) {

    // This is an unexpected error, threated as server error
    xows_xmp_fw_onclose(code, mesg);

  } else {

    // Reset auth data only if close is initiated by user
    xows_xmp_auth.bare = null;
    xows_xmp_auth.user = null;
    xows_xmp_auth.pass = null;
  }
}

/* -------------------------------------------------------------------
 *
 * XMPP API - XMPP Core (RFC-6120)
 *
 * -------------------------------------------------------------------*/
/**
 * XMPP Core (RFC-6120) XMLNS constants
 */
const XOWS_NS_IETF_SASL    = "urn:ietf:params:xml:ns:xmpp-sasl";
const XOWS_NS_IETF_BIND    = "urn:ietf:params:xml:ns:xmpp-bind";
const XOWS_NS_IETF_SESSION = "urn:ietf:params:xml:ns:xmpp-session"; //< Obsoleted RFC-3921

/**
 * XMPP session ready event client callback
 */
let xows_xmp_fw_onsession = function() {};

/**
 * XMPP stream closed event client callback
 */
let xows_xmp_fw_onclose = function() {};

/* -------------------------------------------------------------------
 * XMPP API - XMPP Core (RFC-6120) - Stream Negotiation
 * -------------------------------------------------------------------*/
/**
 * Array to hold current server required or available stream features
 * such as <bind> and <session>
 */
const xows_xmp_stream_feat = [];

/**
 * Function to proceed an received <stream:error> stanza
 *
 * @param   {object}    stanza    Received <stream:error> stanza
 */
function xows_xmp_stream_error_recv(stanza)
{
  // Get the first child of <stream:error> this is the error type
  const err_cde = stanza.firstChild.tagName;
  // Get the <text> node content if exists
  const err_txt = xows_xml_innertext(stanza.querySelector("text"));
  // Output log
  xows_log(0,"xmp_stream_error_recv",err_cde,err_txt);
  // Server stream error
  xows_xmp_connectloss("Server thrown a stream error");
  return true;
}

/**
 * Function to proceed an received <stream:features> stanza
 *
 * @param   {object}    stanza    Received <stream:features> stanza
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
    for(let i = 0, n = mechanisms.length; i < n; ++i)
      xows_xmp_sasl_mechanisms.push(xows_xml_innertext(mechanisms[i]));
    // Output log
    xows_log(2,"xmp_stream_features_recv","received authentication mechanisms",xows_xmp_sasl_mechanisms.join(", "));
    // Check whether we are in account registration scenario
    if(xows_xmp_auth.regi) {
      const register = stanza.querySelector("register");
      if(register) {
        // Start registration process
        xows_xmp_regi_get_query(null,xows_xmp_regi_server_get_parse);
      } else {
        let err_msg = "Account registration is not allowed by server";
        xows_log(0,"xmp_stream_features_recv",err_msg);
        xows_xmp_fram_close_send(XOWS_SIG_ERR,err_msg);
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
    let i = stanza.childNodes.length;
    while(i--) xows_xmp_stream_feat.push(stanza.childNodes[i].getAttribute("xmlns"));
    // Output log
    xows_log(2,"xmp_stream_features_recv","received features",xows_xmp_stream_feat.join(", "));
    // Query for resource bind
    xows_xmp_bind_query();
  }
  return false;
}

/* -------------------------------------------------------------------
 * XMPP API - XMPP Core (RFC-6120) - SASL
 * -------------------------------------------------------------------*/
/**
 * Array of available SASL mechanism for late authentication
 */
const xows_xmp_sasl_mechanisms = [];

/**
 * Function to start SASL auth process
 *
 * This function requires that the SASL mechanisms list (xows_xmp_sasl_mechanisms)
 * to be filled with available candidates.
 */
function xows_xmp_sasl_auth_send()
{
  // Try to initialize SASL
  if(!xows_sasl_init(xows_xmp_sasl_mechanisms, xows_xmp_auth.bare, xows_xmp_auth.user, xows_xmp_auth.pass)) {
    let err_msg = "Unable to find a suitable authentication mechanism";
    xows_log(0,"xmp_sasl_auth_send",err_msg);
    xows_xmp_fram_close_send(XOWS_SIG_ERR, err_msg);
    return;
  }

  // SASL succeed to Initialize, we start the process
  const sasl_mechanism = xows_sasl_get_selected();

  xows_log(2,"xmp_sasl_auth_send","select authentication mechanism",sasl_mechanism);

  // Create SASL starting auth request
  const sasl_request = xows_sasl_get_request();

  if(sasl_request.length !== 0) {
    xows_log(2,"xmp_sasl_auth_send","sending authentication request",sasl_request);
    xows_xmp_send(xows_xml_node("auth",{"xmlns":XOWS_NS_IETF_SASL,"mechanism":sasl_mechanism},btoa(sasl_request)));
  }
}

/**
 * Function to proceed an received <challenge> stanza (SASL auth)
 *
 * @param   {object}    stanza    Received <challenge> stanza
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
  xows_xmp_send(xows_xml_node("response",{"xmlns":XOWS_NS_IETF_SASL},btoa(sasl_response)));

  // We should now receive an <faillure> or <success> stanza...
  return true; //< stanza processed
}

/**
 * Function to proceed an received <failure> stanza (SASL auth)
 *
 * @param   {object}    stanza    Received <failure> stanza
 */
function xows_xmp_sasl_failure_recv(stanza)
{
  // Compose error message
  let err_msg;
  const err_cde = stanza.firstChild.tagName;

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
  switch(err_cde.toLowerCase())
  {
  case "not-authorized" :
    err_msg = "Wrong username or password";
    break;
  default:
    err_msg = "Authentication failure";
    break;
  }

  // Output log
  xows_log(0,"xmp_sasl_failure_recv", err_cde);

  // Close with error after delay
  setTimeout(xows_xmp_fram_close_send,xows_options.login_delay,XOWS_SIG_ERR,err_msg);

  return true;
}

/**
 * Function to proceed an received <success> stanza (SASL auth)
 *
 * @param   {object}    stanza    Received <success> stanza
 */
function xows_xmp_sasl_success_recv(stanza)
{
  // Get <succees> stanza embeded data, this might be the SASL sever
  // proof (at least for SCRAM-SHA-1)
  const sasl_sproof = xows_xml_innertext(stanza);

  if(sasl_sproof.length !== 0) {
    xows_log(2,"xmp_sasl_success_recv","received server proof signature",sasl_sproof);
  }

  // Check server integrity
  if(!xows_sasl_chk_integrity(atob(sasl_sproof))) {
    // Output log
    const err_msg = "Server integrity check failed";
    xows_log(0,"xmp_sasl_success_recv",err_msg);
    xows_xmp_fram_close_send(XOWS_SIG_ERR,err_msg);
    return true;
  }

  xows_log(2,"xmp_sasl_success_recv","authentication success");

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
/* -------------------------------------------------------------------
 * XMPP API - XMPP Core (RFC-6120) - Resource Binding
 * -------------------------------------------------------------------*/
/**
 * Parse Resource Binding (RFC-6120) query result
 *
 * @param   {object}    stanza    Received query response stanza
 */
function xows_xmp_bind_parse(stanza)
{
  if(stanza.getAttribute("type") === "error") {
    const err_msg = "bind resource error";
    xows_log(0,"xmp_bind_parse",err_msg,xows_xmp_iq_error_text(stanza));
    xows_xmp_fram_close_send(XOWS_SIG_ERR, err_msg); //< Close with error
    return;
  }

  // Get the full JID and parse the received resource
  const full_jid = xows_xml_innertext(stanza.querySelector("jid"));
  xows_xmp_bind.full = full_jid;
  xows_xmp_bind.bare = xows_jid_bare(full_jid);
  xows_xmp_bind.node = xows_jid_node(full_jid);
  xows_xmp_bind.resc = xows_jid_resc(full_jid);

  xows_log(2,"xmp_bind_parse","binded resource",xows_xmp_bind.full);

  // Session ready, forward to client
  xows_xmp_fw_onsession(xows_xmp_bind);

  // FIXME: The following code is obsoleted by RFC-6120
  /*
  // Check whether stream session feature is available
  if(xows_xmp_stream_feat.includes(XOWS_NS_IETF_SESSION)) {
    // Query for stream session
    xows_xmp_session_query();
  } else {
    // Session ready, forward to client
    xows_xmp_fw_onsession(xows_xmp_bind);
  }
  */
}

/**
 * Query Resource Binding (RFC-6120)
 *
 * @param   {string}  [resource]   Optional resource string to 'enforce'
 */
function xows_xmp_bind_query(resource = null)
{
  // Query for resource binding to start session open process
  xows_log(2,"xmp_bind_query","query bind resource",resource ? resource : "from server");

  const bind = xows_xml_node("bind",{"xmlns":XOWS_NS_IETF_BIND});

  // If resource string is provided, request to bind this specific one
  if(resource)
    xows_xml_parent(bind, xows_xml_node("resource", null, resource));

  xows_xmp_send(xows_xml_node("iq",{"type":"set"},bind), xows_xmp_bind_parse);
}
/* -------------------------------------------------------------------
 * XMPP API - DEPRECATED - XMPP Core (RFC-3921) - Session Establishment
 * -------------------------------------------------------------------*/
/**
 * DEPRECATED - Parse Session Establishment (RFC-3921) query result
 *
 * @param   {object}    stanza    Received query response stanza
 */
function xows_xmp_session_parse(stanza)
{
  if(stanza.getAttribute("type") === "error") {
    const err_msg = "session establishment failure";
    xows_log(0,"xmp_session_parse",err_msg,xows_xmp_iq_error_text(stanza));
    xows_xmp_fram_close_send(XOWS_SIG_ERR, err_msg); //< Close with error
    return;
  }

  xows_log(2,"xmp_session_parse","session established");

  // Session ready, forward to client
  xows_xmp_fw_onsession(xows_xmp_bind);
}

/**
 * DEPRECATED - Query Session Establishment (RFC-3921)
 */
function xows_xmp_session_query()
{
  xows_log(2,"xmp_session_query","query for session");

  // Go to the next step by sending query for session open
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("session",{"xmlns":XOWS_NS_IETF_SESSION}));

  xows_xmp_send(iq, xows_xmp_session_parse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - XMPP Core (RFC-6120) - IQ stanza semantics routines
 *
 * -------------------------------------------------------------------*/
/**
 * IQ stanza semantics XMLNS constants
 */
const XOWS_NS_IETF_STANZAS = "urn:ietf:params:xml:ns:xmpp-stanzas";

/**
 * Map object to store parameters bound to sent iq queries
 */
const xows_xmp_iq_stack = new Map();

/**
 * Function to proceed an received <iq> stanza
 *
 * @param   {object}    stanza    Received <iq> stanza
 */
function xows_xmp_iq_recv(stanza)
{
  const id = stanza.getAttribute("id"); //< Get the <iq> ID

  // Search for query with the specified ID in stack
  if(xows_xmp_iq_stack.has(id)) {

    // Retrieve query parameters and remove entrie from stack
    const query = xows_xmp_iq_stack.get(id);
    xows_xmp_iq_stack.delete(id);

    // If query have a valid onresult function, call it
    if(xows_isfunc(query.onresult))
      query.onresult(stanza, query.onparse);

    return true; //< stanza is processed
  }

  // Check for "get" iq type, can come from user to query infos
  if(stanza.getAttribute("type") === "get") {
    const child = stanza.firstChild; //< get the first chid
    if(child !== undefined) {
      const xmlns = child.getAttribute("xmlns");
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
      const xmlns = child.getAttribute("xmlns");
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
 * Function to parse an iq stanza in a generical way.
 *
 * This parse function may be used by serveral other functions.
 *
 * @param   {object}    stanza    Received iq stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_iq_parse(stanza, onparse)
{
  let err_type, err_code, err_name, err_text;

  const id = stanza.getAttribute("id");
  const type = stanza.getAttribute("type");

  // Check for error
  if(type === "error") {
    // Get error details
    const error = stanza.querySelector("error");
    err_type = error.getAttribute("type");
    err_code = error.getAttribute("code");
    err_name = error.firstChild.tagName;
    err_text = xows_xml_innertext(stanza.querySelector("text"));
    const err_mesg = xows_xmp_iq_error_text(stanza);
    xows_log(1,"xmp_iq_parse","query '"+id+"' error",err_mesg);
    // Forward error message
    xows_xmp_fw_onerror(XOWS_SIG_ERR,err_mesg);
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), type, err_type, err_code, err_name, err_text);
}

/**
 * Function to send formated <iq> error stanza
 *
 * @parma   {string}    id          Query ID the error is related to
 * @parma   {string}    to          Destination JID
 * @parma   {string}    type        Error type (type attribute of <error> node)
 * @param   {string}    reason      Error reason (<error> child node tagname)
 * @param   {string}   [message]    Optionnal message to include within reason
 */
function xows_xmp_iq_error_send(id, to, type, reason, message)
{
  xows_xmp_send(  xows_xml_node("iq",{"id":id,"type":"error","to":to},
                    xows_xml_node("error",{"type":type},
                      xows_xml_node(reason,{"xmlns":XOWS_NS_IETF_STANZAS},content))));
}

/**
 * Function to send formated <iq> result stanza
 *
 * @parma   {string}    id          Query ID the error is related to
 * @parma   {string}    to          Destination JID
 */
function xows_xmp_iq_result_send(id, to)
{
  xows_xmp_send(xows_xml_node("iq",{"id":id,"type":"result","to":to}));
}

/**
 * Parse the given error <iq> and returns the parsed error type
 * and hint text
 *
 * @param   {object}    stanza    Received <iq> stanza
 *
 * @return  {string}    Parsed error type and text as combined string
 */
function xows_xmp_iq_error_text(stanza)
{
  let str;

  // Get inner <error> child and try to find <text>
  const error = stanza.querySelector("error");
  if(error) {
    // get error tagname and beautify it
    str = error.firstChild.tagName;
    str = str.replace(/-/g, " ");
    str = str[0].toUpperCase() + str.substring(1);
    // if <text> is available, append it
    const text = error.querySelector("text");
    if(text) str += ": " + xows_xml_innertext(text);
  }

  return str;
}


/* -------------------------------------------------------------------
 *
 * XMPP API - XMPP Core (RFC-6120) - Message stanza semantics routines
 *
 * -------------------------------------------------------------------*/
/**
 * Delayed Delivery (XEP-0203) XMLNS constant
 */
const XOWS_NS_DELAY = "urn:xmpp:delay";

/**
 * Message stanza received body message event client callback
 */
let xows_xmp_fw_onmessage = function() {};

/**
 * Message stanza received chat sate message event client callback
 */
let xows_xmp_fw_onchatstate = function() {};

/**
 * Message stanza received receipt message event client callback
 */
let xows_xmp_fw_onreceipt = function() {};

/**
 * Multi-User Chat (XEP-0045) received subject event callback
 */
let xows_xmp_fw_onsubject = function() {};

/**
 * Parse received <message> stanza
 *
 * @param   {object}    stanza    Received <message> stanza
 */
function xows_xmp_message_recv(stanza)
{
  // Get message main attributes
  const type = stanza.getAttribute("type");

  const id = stanza.getAttribute("id");
  const from = stanza.getAttribute("from");
  const to = stanza.getAttribute("to");

  let body, subj, time, chat, rpid, rcid;

  let xmlns, tag, node, i = stanza.childNodes.length;
  while(i--) {
    node = stanza.childNodes[i];
    // Skip the non-object nodes
    if(node.nodeType !== 1) continue;
    // Store child xmlns attribute
    xmlns = node.getAttribute("xmlns");
    // Check whether this is a MAM archive query result
    if(xmlns === XOWS_NS_MAM) {
      xows_log(2,"xmp_message_recv","received Archive result");
      return xows_xmp_mam_result_recv(node);
    }
    // Check whether this is a PubSub event
    if(xmlns === XOWS_NS_PUBSUBEVENT) {
      xows_log(2,"xmp_message_recv","received PubSub Event");
      return xows_xmp_pubsub_recv(from, node);
    }
    // Check whether this is an encapsuled carbons copy
    if(xmlns === XOWS_NS_CARBONS) {
      xows_log(2,"xmp_message_recv","received forwarded Carbons");
      // Take the inner <message> node and parse it
      const message = node.querySelector("message");
      return message ? xows_xmp_message_recv(message) : false;
    }
    tag = node.tagName;
    // Check whether this is a delivery receipt request or receive
    if(xmlns === XOWS_NS_RECEIPTS) {
      if(tag === "request") {
        xows_log(2,"xmp_message_recv","received Receipt request");
        xows_xmp_message_receipt_send(from, id);
      } else if(tag === "received") {
        rcid = node.getAttribute("id");
        continue;
      }
    }
    // Check for chat state notification
    if(xmlns === XOWS_NS_CHATSTATES) {
      chat = xows_xmp_chatstate_value[tag];
      continue;
    }
    // Check for <delay> node, meaning of offline storage delivery
    if(xmlns === XOWS_NS_DELAY) {
      time = new Date(node.getAttribute("stamp")).getTime();
      continue;
    }
    // Check for <replace> node, meaning of replacement
    if(xmlns === XOWS_NS_CORRECT) {
      rpid = node.getAttribute("id");
      continue;
    }
    // Check for <body> node
    if(tag === "body") {
      body = xows_xml_innertext(node);
      continue;
    }
    // Check for <subject> node
    if(tag === "subject") {
      subj = xows_xml_innertext(node);
    }
  }

  // Forward message to proper callback
  let handled = false;

  if(chat !== undefined) {
    xows_xmp_fw_onchatstate(id, type, from, to, chat, time);
    handled = true;
  }
  if(body !== undefined) {
    xows_xmp_fw_onmessage(id, type, from, to, body, time, rpid);
    handled = true;
  }
  if(rcid !== undefined) {
    xows_xmp_fw_onreceipt(id, from, to, rcid, time);
    handled = true;
  }
  if(subj !== undefined) {
    xows_xmp_fw_onsubject(id, from, subj);
    handled = true;
  }

  // Write log
  xows_log(2,"xmp_message_recv",
    (handled) ? "Handling message" : "unhandled message",
    "from "+from+" to "+to);

  return handled;
}

/**
 * Send a message with textual content
 *
 * @param   {string}    type      Message type
 * @param   {string}    to        JID of the recipient
 * @param   {string}    body      Message content
 * @param   {boolean}   recp      Request message receipt
 * @param   {string}   [corr]     Optionnal message ID this one replace
 *
 * @return  {string}    Sent message ID
 */
function xows_xmp_message_body_send(type, to, body, recp, corr)
{
  // Generate 'custom' id to allow sender to track message
  const id = xows_gen_uuid();

  // Create message stanza
  const stanza =  xows_xml_node("message",{"id":id,"to":to,"type":type},
                    xows_xml_node("body",null,body));

  // Add receipt request
  if(recp) xows_xml_parent(stanza, xows_xml_node("request",{"xmlns":XOWS_NS_RECEIPTS}));

  // Add replace
  if(corr) xows_xml_parent(stanza, xows_xml_node("replace",{"id":corr,"xmlns":XOWS_NS_CORRECT}));

  xows_log(2,"xmp_message_body_send","send message","type "+type+" to "+to);

  // Send final message
  xows_xmp_send(stanza);

  return id;
}

/* -------------------------------------------------------------------
 * XMPP API - Message semantics - Chat State Notifications (XEP-0085)
 * -------------------------------------------------------------------*/
/**
 * Chat State Notifications (XEP-0085) XMLNS constants
 */
const XOWS_NS_CHATSTATES = "http://jabber.org/protocol/chatstates";

/**
 * Chat State Notifications (XEP-0085) values constants
 */
const XOWS_CHAT_GONE    = 0;
const XOWS_CHAT_ACTI    = 1;
const XOWS_CHAT_INAC    = 2;
const XOWS_CHAT_PAUS    = 3;
const XOWS_CHAT_COMP    = 4;

/**
 * Chat State Notifications (XEP-0085) string to value mapping
 */
const xows_xmp_chatstate_value = {
  "gone"      : 0,
  "active"    : 1,
  "inactive"  : 2,
  "paused"    : 3,
  "composing" : 4
};

/**
 * Chat State Notifications (XEP-0085) value to string mapping
 */
const xows_xmp_chatstate_string = ["gone","active","inactive","paused","composing"];

/**
 * Send a message with chat state notification (XEP-0085)
 *
 * @param   {string}    to        JID of the recipient
 * @param   {string}    type      Message type to set
 * @param   {number}    chat      Chat state to set
 */
function xows_xmp_message_chatstate_send(to, type, chat)
{
  const state = xows_xmp_chatstate_string[chat];

  xows_log(2,"xmp_message_chatstate_send","send chat state",state+" to "+to);

  xows_xmp_send(xows_xml_node("message",{"to":to,"type":type},
                  xows_xml_node(state,{"xmlns":XOWS_NS_CHATSTATES})));
}

/* -------------------------------------------------------------------
 * XMPP API - Message semantics - Message Delivery Receipts (XEP-0184)
 * -------------------------------------------------------------------*/
/**
 * Message Delivery Receipts (XEP-0184) XMLNS constants
 */
const XOWS_NS_RECEIPTS = "urn:xmpp:receipts";

/**
 * Send receipt for the specified message ID at the specified
 * destination.
 *
 * @param   {string}    to        Destnation JID
 * @param   {string}    id        Message ID to send receipt about
 */
function xows_xmp_message_receipt_send(to, id)
{
  xows_log(2,"xmp_message_receipt_send","send message Receipt","received "+id+" to "+to);

  xows_xmp_send(xows_xml_node("message",{"to":to},
                  xows_xml_node("received",{"id":id,"xmlns":XOWS_NS_RECEIPTS})));
}

/* -------------------------------------------------------------------
 * XMPP API - Message semantics - Last Message Correction (XEP-0308)
 * -------------------------------------------------------------------*/
/**
 * Last Message Correction (XEP-0308) XMLNS constants
 */
const XOWS_NS_CORRECT = "urn:xmpp:message-correct:0";

/* -------------------------------------------------------------------
 * XMPP API - Message semantics - Message Styling (XEP-0393)
 * -------------------------------------------------------------------*/
/**
 * Message Styling (XEP-0393) XMLNS constants
 */
const XOWS_NS_STYLING      = "urn:xmpp:styling:0";

/* -------------------------------------------------------------------
 *
 * XMPP API - IM and Presence (RFC-6121) - Roster Management
 *
 * -------------------------------------------------------------------*/
/**
 * Roster Management (XEP-0321) XMLNS constants
 */
const XOWS_NS_ROSTER       = "jabber:iq:roster";

/**
 * Roster Management (XEP-0321) roster push event callback
 */
let xows_xmp_fw_onrostpush = function() {};

/**
 * Function to proceed an received roster push <iq> stanza
 *
 * @param   {object}    stanza    Received <iq> stanza
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

  const bare = item.getAttribute("jid");
  const name = item.getAttribute("name");
  const subs = xows_xmp_subs_mask_map[item.getAttribute("subscription")];
  let group = item.querySelector("group");
  group = group ? xows_xml_innertext(group) : null;

  xows_log(2,"xmp_rost_push_recv","received Roster Push");

  // Forward parse result
  xows_xmp_fw_onrostpush(bare, name, subs, group);
}

/**
 * Function to parse result of get roster query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_rost_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_rost_get_parse","parse get Roster",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Turn <item> to object's array
  const nodes = stanza.getElementsByTagName("item");
  const item = [];
  for(let i = 0, n = nodes.length; i < n; ++i) {
    item.push({ "bare"  : nodes[i].getAttribute("jid"),
                "name"  : nodes[i].getAttribute("name"),
                "subs"  : xows_xmp_subs_mask_map[nodes[i].getAttribute("subscription")],
                "group" : xows_xml_innertext(nodes[i].querySelector("group"))});
  }

  // Forward result to client
  if(xows_isfunc(onparse))
    onparse(item);
}

/**
 * Send query to get roster content to the server
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
 * Send query to add or remove item to/from roster
 *
 * @param   {string}    jid       Contact or Room JID to add
 * @param   {string}    name      Item Display name or null to remove item
 * @param   {string}    group     Group name where to add contact or null to ignore
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_rost_set_query(jid, name, group, onparse)
{
  xows_log(2,"xmp_rost_set_query","query set Roster",jid);

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

  // Use generic parse function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - IM and Presence (RFC-6121) - Presence exchange & Subscriptions
 *
 * -------------------------------------------------------------------*/
/**
 * List of presence show level
 */
const XOWS_SHOW_OFF     = 0;
const XOWS_SHOW_DND     = 1;
const XOWS_SHOW_XA      = 2;
const XOWS_SHOW_AWAY    = 3;
const XOWS_SHOW_ON      = 4;
const XOWS_SHOW_CHAT    = 5;

/**
 * List of presence subscrition values/mask bits
 */
const XOWS_SUBS_REM     = -1;
const XOWS_SUBS_NONE    = 0;
const XOWS_SUBS_FROM    = 1;
const XOWS_SUBS_TO      = 2;
const XOWS_SUBS_BOTH    = 3;

/**
 * Correspondance map array for presence subscription string to value
 */
const xows_xmp_subs_mask_map = {
  "remove": -1,
  "none"  : 0,
  "from"  : 1,
  "to"    : 2,
  "both"  : 3
};

/**
 * Correspondance map array for presence show string to level
 */
const xows_xmp_show_level = new Map([["dnd",1],["xa",2],["away",3],["chat",5]]);

/**
 * Correspondance map array for presence show level to string
 */
const xows_xmp_show_name = ["","dnd","xa","away","","chat"];

/**
 * Reference to callback function for received presence
 */
let xows_xmp_fw_onpresence = function() {};

/**
 * Reference to callback function for received subscribe presence
 */
let xows_xmp_fw_onsubscrib = function() {};

/**
 * Multi-User Chat (XEP-0045) received presence event callback
 */
let xows_xmp_fw_onoccupant = function() {};

/**
 * Function to proceed an received <presence> stanza
 *
 * @param   {object}    stanza    Received <presence> stanza
 */
function xows_xmp_presence_recv(stanza)
{
  const from = stanza.getAttribute("from"); //< Sender JID/Ress

  // Usual presence informations
  let show, prio, stat;

  if(stanza.hasAttribute("type")) {
    const type = stanza.getAttribute("type"); //< Presence type
    if(type === "unavailable") show = -1; // unavailabel <presence>
    if(type.includes("subscrib")) { //< subscription <presence>
      xows_log(2,"xmp_presence_recv","received subscrib",from+" type:"+type);
      // Check for <nick> child
      const node = stanza.querySelector("nick");
      const nick = node ? xows_xml_innertext(node) : null;
      // Foward subscription
      xows_xmp_fw_onsubscrib(from, type, nick);
      return true;
    }
    if(type === "error") { //<  an error occurred
      const err_msg = "("+from+") "+xows_xmp_iq_error_text(stanza);
      xows_log(1,"xmp_presence_recv","error",from+" - "+err_msg);
      xows_xmp_fw_onerror(XOWS_SIG_ERR,err_msg);
      return true;
    }
  }

  // Additionnal <presence> informations or data
  let node, muc, phot;

  let child, i = stanza.childNodes.length;
  while(i--) {
    child = stanza.childNodes[i];

    if(child.nodeType !== 1)
      continue;

    // Check for usual presence informations
    if(child.tagName === "show") {
      const text = xows_xml_innertext(child);
      show = text ? xows_xmp_show_level.get(text) : XOWS_SHOW_ON; //< No text mean simply "available"
      continue;
    }
    if(child.tagName === "priority") {
      prio = xows_xml_innertext(child); continue;
    }
    if(child.tagName === "status") {
      stat = xows_xml_innertext(child); continue;
    }
    // Check for entity capabilities (XEP-0115)
    if(child.tagName === "c") {
      if(child.getAttribute("xmlns") === XOWS_NS_CAPS) {
        node = {"node":child.getAttribute("node"),
                "ver" :child.getAttribute("ver")};
      }
      continue;
    }
    // Check for <x> element
    if(child.tagName === "x") {
      const xmlns = child.getAttribute("xmlns");
      // Check whether we received a MUC presence protocole
      if(xmlns === XOWS_NS_MUCUSER) {
        const item = child.querySelector("item"); //< should be an <item>
        muc = { "affi" : xows_xmp_affi_level_map[item.getAttribute("affiliation")],
                "role" : xows_xmp_role_level_map[item.getAttribute("role")],
                "full" : item.getAttribute("jid"),
                "nick" : item.getAttribute("nickname"),
                "code" : []};
        const status = child.querySelectorAll("status"); //< search for <status>
        let j = status.length;
        while(j--) muc.code.push(parseInt(status[j].getAttribute("code")));
      }
      // Check whether we have a vcard-temp element (avatar)
      if(xmlns === XOWS_NS_VCARDXUPDATE) {
        phot = xows_xml_innertext(child.firstChild); //< should be an <photo>
      }
    }
  }

  // Check whether this a presence from MUC
  if(muc !== undefined) {
    xows_log(2,"xmp_presence_recv","received MUC presence",from);
    xows_xmp_fw_onoccupant(from, show, stat, muc, phot);
    return true;
  }

  // Default is usual contact presence
  xows_log(2,"xmp_presence_recv","received presence",from+" show:"+show);
  xows_xmp_fw_onpresence(from, show, prio, stat, node, phot);
  return true;
}

/**
 * Send common <presence> stanza to server or MUC room to update
 * client availability and/or join or exit MUC room
 *
 * @param   {string}    to        Destination JID (can be null)
 * @param   {string}    type      Presence type attribute (can be null)
 * @param   {number}    level     Availability level 0 to 4 (can be null)
 * @param   {string}    status    Status string tu set
 * @param   {string}    [photo]   Optionnal photo data hash to send
 * @param   {boolean}   [muc]     Append MUC xmlns child to stanza
 * @param   {string}    [nick]    Optional nickname for subscribe request
 */
function xows_xmp_presence_send(to, type, level, status, photo, muc, nick)
{
  // Create the initial and default <presence> stanza
  const stanza = xows_xml_node("presence");

  // Add destination attribute
  if(to) stanza.setAttribute("to", to);

  // Add type attribute
  if(type) stanza.setAttribute("type", type);

  // Append the <show> and <priority> children
  if(level > XOWS_SHOW_OFF) {
    // Translate show level number to string
    xows_xml_parent(stanza, xows_xml_node("show",null,xows_xmp_show_name[level]));
    // Set priority according show level
    xows_xml_parent(stanza, xows_xml_node("priority",null,(level * 20)));
    // Append <status> child
    if(status) xows_xml_parent(stanza, xows_xml_node("status",null,status));

    //if(xows_cli_feat_srv_has(XOWS_NS_VCARD)) {
      // Append vcard-temp:x:update for avatar update child
      xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_VCARDXUPDATE},
                                  (photo)?xows_xml_node("photo",null,photo):null));
    //}

    // Append <c> (caps) child
    xows_xml_parent(stanza, xows_xml_node("c",{ "xmlns":XOWS_NS_CAPS,
                                                "hash":"sha-1",
                                                "node":XOWS_APP_NODE,
                                                "ver":xows_xmp_caps_self_verif()}));
  }

  // Append the proper <x> child for MUC protocole
  if(muc) xows_xml_parent(stanza, xows_xml_node("x",{"xmlns":XOWS_NS_MUC}));

  // Append <nick> child if required
  if(nick) xows_xml_parent(stanza, xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick));

  xows_log(2,"xmp_presence_send",type ? type : "show", to ? to : level);

  // Send the final <presence> stanza
  xows_xmp_send(stanza);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - XMPP Ping (XEP-0199)
 *
 * -------------------------------------------------------------------*/
/**
 *  XMPP Ping (XEP-0199) XMLNS constants
 */
const XOWS_NS_PING = "urn:xmpp:ping";

/**
 * Function to send response to <iq> ping query
 *
 * @param   {object}    stanza    Received <iq> stanza
 */
function xows_xmp_ping_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  xows_log(2,"xmp_ping_reply","responds to Ping",from);
  // Send pong
  xows_xmp_send(xows_xml_node("iq",{"id":id,"to":from,"type":"result"}));
}
/* -------------------------------------------------------------------
 *
 * XMPP API - Entity Time (XEP-0202)
 *
 * -------------------------------------------------------------------*/
/**
 *  Entity Time (XEP-0202) XMLNS constants
 */
const XOWS_NS_TIME  = "urn:xmpp:time";

/**
 *  Function to send response to <iq> time query
 *
 * @param   {object}    stanza    Received <iq> stanza
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

  xows_log(2,"xmp_iq_time_reply","responds to Time",from);

  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("time",{"xmlns":XOWS_NS_TIME},[
                      xows_xml_node("tzo",null,tzo),
                      xows_xml_node("utc",null,utc)])));

}

/* -------------------------------------------------------------------
 *
 * XMPP API - Software Version (XEP-0092)
 *
 * -------------------------------------------------------------------*/
/**
 *  Software Version (XEP-0092) XMLNS constants
 */
const XOWS_NS_VERSION      = "jabber:iq:version";

/**
 *  Function to send response to <iq> version query
 *
 * @param   {object}    stanza    Received <iq> stanza
 */
function xows_xmp_iq_version_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");

  xows_log(2,"xmp_iq_version_reply","responds to Version",from);

  // Send time
  xows_xmp_send( xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_VERSION},[
                      xows_xml_node("name",null,XOWS_APP_NAME),
                      xows_xml_node("version",null,XOWS_APP_VERS)])));
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Service Discovery (XEP-0030)
 *
 * -------------------------------------------------------------------*/
/**
 * Service Discovery (XEP-0030) XMLNS constants
 */
const XOWS_NS_DISCOINFO    = "http://jabber.org/protocol/disco#info";
const XOWS_NS_DISCOITEMS   = "http://jabber.org/protocol/disco#items";

/**
 * Function to reply to <iq> disco#info query
 *
 * @param   {object}    stanza    Received <iq> stanza
 */
function xows_xmp_disco_info_reply(stanza)
{
  // Get iq sender and ID
  const from = stanza.getAttribute("from");
  const id = stanza.getAttribute("id");
  // get the <query> element to get node attribute if exists
  const query = stanza.querySelector("query");
  const node = query ? query.getAttribute("node") : null;

  xows_log(2,"xmp_disco_info_reply","responds to disco#info",from);

  // Send response
  const caps = xows_xmp_caps_self_features();
  xows_xmp_send(  xows_xml_node("iq",{"to":from,"id":id,"type":"result"},
                    xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node},caps)));
}

/**
 * Parse result of disco#info query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_disco_info_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_disco_info_parse","parse Disco#info",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Get the <query> child element
  const query = stanza.querySelector("query");

  let i, n, nodes;

  // Turn each <identity> into object's array.
  nodes = query.getElementsByTagName("identity");
  const iden = [];
  for(i = 0, n = nodes.length; i < n; ++i) {
    iden.push({ "category": nodes[i].getAttribute("category"),
                "type"    : nodes[i].getAttribute("type"),
                "name"    : nodes[i].getAttribute("name")});
  }

  // Turn each <feature var=""> into string array.
  nodes = query.getElementsByTagName("feature");
  const feat = [];
  for(i = 0, n = nodes.length; i < n; ++i) {
    if(nodes[i].hasAttribute("var"))
      feat.push(nodes[i].getAttribute("var"));
  }

  // Parse the <x> element if exists
  const x = query.querySelector("x");
  const form = x ? xows_xmp_xdata_parse(x) : null;

  // Forward result to client
  if(xows_isfunc(onparse))
    onparse( stanza.getAttribute("from"), iden, feat, form, query.getAttribute("node"));
}

/**
 * Send a disco#info query
 *
 * @param   {string}    to        Target JID or URL
 * @param   {string}    node      Query node attribute or null to ignore
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_disco_info_query(to, node, onparse)
{
  xows_log(2,"xmp_disco_info_query","query disco#info",to);

  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOINFO,"node":node}));

  xows_xmp_send(iq, xows_xmp_disco_info_parse, onparse);
}

/**
 * Parse result of disco#items query
 *
 * @param   {object}    stanza    Received stanza corresponding to query
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_disco_items_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_disco_items_parse","parse Disco#items",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Turn <item> elements into object's array
  const nodes = stanza.getElementsByTagName("item");
  const item = [];
  for(let i = 0, n = nodes.length; i < n; ++i) {
    item.push({ "jid"   : nodes[i].getAttribute("jid"),
                "name"  : nodes[i].getAttribute("name")});
  }

  // Forward result to client
  if(xows_isfunc(onparse))
    onparse( stanza.getAttribute("from"), item);
}

/**
 * Send a disco#items query
 *
 * @param   {string}    to        Entity JID, name or URL
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_disco_items_query(to, onparse)
{
  xows_log(2,"xmp_disco_items_query","query disco#items",to);

  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("query",{"xmlns":XOWS_NS_DISCOITEMS}));

  xows_xmp_send(iq, xows_xmp_disco_items_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - External Service Discovery (XEP-0215)
 *
 * -------------------------------------------------------------------*/
/**
 * External Service Discovery (XEP-0215) XMLNS constants
 */
const XOWS_NS_EXTDISCO = "urn:xmpp:extdisco:2";

/**
 * Parse result of external services discovery query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_extdisco_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_extdisco_parse","parse extdisco",xows_xmp_iq_error_text(stanza));
    // Forward result to client
    if(xows_isfunc(onparse))
      onparse(null);
    return;
  }

  // Get the <services> child element
  const query = stanza.querySelector("services");

  let i, n, nodes;

  // Turn each <service> into object's array.
  nodes = query.getElementsByTagName("service");
  const svcs = [];
  for(i = 0, n = nodes.length; i < n; ++i) {
    svcs.push({ "type"      : nodes[i].getAttribute("type"),
                "host"      : nodes[i].getAttribute("host"),
                "port"      : nodes[i].getAttribute("port"),
                "transport" : nodes[i].getAttribute("transport"),
                "username"  : nodes[i].getAttribute("username"),
                "password"  : nodes[i].getAttribute("password"),
                "restricted": nodes[i].getAttribute("restricted")});
  }

  // Forward result to client
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), svcs);
}

/**
 * Send a external services discovery query
 *
 * @param   {string}    to        Target JID or URL
 * @param   {string}    type      Query type attribute or null to ignore
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_extdisco_query(to, type, onparse)
{
  xows_log(2,"xmp_extdisco_query","query extdisco");

  // Create the services child
  const services = xows_xml_node("services",{"xmlns":XOWS_NS_EXTDISCO});

  // Add type if supplied
  if(type) services.setAttribute("type",type);

  const iq =  xows_xml_node("iq",{"type":"get","to":to},services);

  xows_xmp_send(iq, xows_xmp_extdisco_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Data Forms (XEP-0004)
 *
 * -------------------------------------------------------------------*/
/**
 * Data Forms (XEP-0004) XMLNS constants
 */
const XOWS_NS_XDATA        = "jabber:x:data";

/**
 * Function to parse a standard jabber:x:data form
 *
 * @param   {object}    x         The <x> stanza element to parse
 *
 * @return  {object[]}  Array of parsed field to complete
 */
function xows_xmp_xdata_parse(x)
{
  const form = [];
  // Turn each <field> into object's array
  const nodes = x.getElementsByTagName("field");
  for(let i = 0, n = nodes.length; i < n; ++i) {
    form.push({
      "required"  : (nodes[i].querySelector("required") !== null),
      "type"      : nodes[i].getAttribute("type"),
      "label"     : nodes[i].getAttribute("label"),
      "var"       : nodes[i].getAttribute("var"),
      "value"     : xows_xml_innertext(nodes[i].querySelector("value"))});
  }
  return form;
}

/**
 * Function to create a standard jabber:x:data submit <x> node using
 * the given array
 *
 * Given array must contain one or more objects with properly filled
 * "var" and "value" values.
 *
 * @param   {object[]}  field     Object's array to turn as <field> elements
 *
 * @return  {object}    The <x> node with <field> to submit
 */
function xows_xmp_xdata_make(field)
{
  // The base <x> node
  const x = xows_xml_node("x",{"xmlns":XOWS_NS_XDATA,"type":"submit"});

  if(field && field.length) {
    // Add <field> elements with proper values to <x> node
    let node;
    for(let i = 0, n = field.length; i < n; ++i) {
      // Create base <field> node
      node = xows_xml_node("field");
      // Add available informations to node
      if(field[i]["var"]) node.setAttribute("var", field[i]["var"]);
      if(field[i].type) node.setAttribute("type", field[i].type);
      if(field[i].value) xows_xml_parent(node,xows_xml_node("value",null,field[i].value));
      // Add <field> to <x>
      xows_xml_parent(x, node);
    }
  }
  return x;
}

/**
 * Function to create a standard jabber:x:data cancal <x> node
 *
 * @return  {object}    The <x> node with <field> to submit
 */
function xows_xmp_xdata_cancel()
{
  return xows_xml_node("x",{"xmlns":XOWS_NS_XDATA,"type":"cancel"});
}

/* -------------------------------------------------------------------
 *
 * XMPP API - In-Band Registration (XEP-0077)
 *
 * -------------------------------------------------------------------*/
/**
 * In-Band Registration (XEP-0077) XMLNS constants
 */
const XOWS_NS_REGISTER     = "jabber:iq:register";

/**
 * Function to parse result of register form query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_regi_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_regi_get_parse","parse get Register",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Get common registration elements
  const username = stanza.querySelector("username");
  const password = stanza.querySelector("password");
  const email = stanza.querySelector("email");
  const x = stanza.querySelector("x");

  // Check whether we have <registered> element, meaning already registered
  const regd = stanza.querySelector("registered") ? true : false;
  const user = username ? xows_xml_innertext(username) : null;
  const pass = password ? xows_xml_innertext(password) : null;
  const mail = email ? xows_xml_innertext(email) : null;
  const form = x ? xows_xmp_xdata_parse(x) : null;

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), regd, user, pass, mail, form);
}

/**
 * Send a register fields query to the specified destination
 *
 * @param   {string}    to        Peer or service JID
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_regi_get_query(to, onparse)
{
  xows_log(2,"xmp_regi_get_query","query get Register");

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER}));

  if(to !== null) iq.setAttribute("to",to);

  xows_xmp_send(iq, xows_xmp_regi_get_parse, onparse);
}


/**
 * Send a register form query to the specified destination
 *
 * @param   {string}    to        Peer or service JID or null
 * @param   {string}    user      Content for <user> or null to ignore
 * @param   {string}    pass      Content for <pass> or null to ignore
 * @param   {string}    mail      Content for <mail> or null to ignore
 * @param   {object[]}  form      Fulfilled x-data form null to ignore
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_regi_set_query(to, user, pass, mail, form, onparse)
{
  xows_log(2,"xmp_regi_submit","submit Register");

  // Create the base <query> node
  const query = xows_xml_node("query",{"xmlns":XOWS_NS_REGISTER});

  // Add child nodes as supplied
  if(user !== null) xows_xml_parent(query, xows_xml_node("username",null,user));
  if(pass !== null) xows_xml_parent(query, xows_xml_node("password",null,pass));
  if(mail !== null) xows_xml_parent(query, xows_xml_node("email",null,mail));
  if(form !== null) xows_xml_parent(query, xows_xmp_xdata_make(form));

  // Create and launch the query
  const iq =  xows_xml_node("iq",{"type":"set"},query);

  if(to !== null) iq.setAttribute("to",to);

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Parse Server account registration form submit (set) result
 *
 * This function is part of the server account registration scenario, called
 * once the server responded to registration form submition.
 *
 * @param   {string}    from      Query Sender JID
 * @param   {string}    type      Query Response type
 * @param   {string}    er_type   Error type if available
 * @param   {string}    er_code   Error code if available
 * @param   {string}    er_name   Error code if available
 * @param   {string}    er_text   Error text if available
 */
function xows_xmp_regi_server_set_parse(from, type, er_type, er_code, er_name, er_text)
{
  let err_msg = null;

  // Check whether we got an error as submit response
  if(type === "error") {
    // Set error message string as possible
    if(er_code === "409" || er_name === "conflict")
      err_msg = er_text ? er_text : "Unsername already exists";
    if(er_code === "406" || er_name === "not-acceptable")
      err_msg = er_text ? er_text : "Username contains illegal characters";
  } else {
    if(type === "result") {
      // Reset the client with congratulation message
      xows_log(2,"xmp_regi_server_set_parse","success");
      // we are no longer on register process
      xows_xmp_auth.regi = false;

      // Start new authentication process
      xows_xmp_sasl_auth_send();

    } else {
      // This case is unexpected and unknown
      err_msg = "Unexpected registration error";
    }
  }

  // If we got an error the process stops here
  if(err_msg !== null) {
    xows_log(0,"xmp_regi_server_set_parse",err_msg);
    // Close with error after delay
    setTimeout(xows_xmp_fram_close_send, xows_options.login_delay, XOWS_SIG_ERR, err_msg);
  }
}

/**
 * Parse Server account registration form query (get) result
 *
 * This function is part of the account registration scenario, called
 * once the server responded to registration form query.
 *
 * @param   {string}    from        Sender JID
 * @param   {boolean}   registered  Indicate <registered> child in response
 * @param   {string}    user        <user> child content or null if not present
 * @param   {string}    pass        <pass> child content or null if not present
 * @param   {string}    email       <email> child content or null if not present
 * @param   {object[]}  form        Parsed x-data form to fulfill
 */
function xows_xmp_regi_server_get_parse(from, registered, user, pass, email, form)
{
  // The server may respond with a form or via old legacy way
  // we handle both cases.
  if(form !== undefined) {
    // For each fied of form, find know var name and fulfill
    let i = form.length;
    while(i--) {
      if(form[i]["var"] === "username") form[i].value = xows_xmp_auth.user;
      if(form[i]["var"] === "password") form[i].value = xows_xmp_auth.pass;
    }
  } else {
    // Fulfill <username> and <password> element as required
    if(user !== null) user = xows_xmp_auth.user;
    if(pass !== null) pass = xows_xmp_auth.pass;
  }
  // Submit the register parmaters
  xows_xmp_regi_set_query(null, user, pass, null, form,
                           xows_xmp_regi_server_set_parse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Message Carbons (XEP-0280)
 *
 * -------------------------------------------------------------------*/
/**
 * Message Carbons (XEP-0280) XMLNS constants
 */
const XOWS_NS_CARBONS      = "urn:xmpp:carbons:2";
//const XOWS_NS_CARBONS_RUL  = "urn:xmpp:carbons:rules:0";

/**
 * Send query to enable or disable carbons (XEP-0280)
 *
 * @param   {boolean}   enable    Boolean to query enable or disable
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_carbons_query(enable, onparse)
{
  // Create enable or disable node
  const tag = (enable) ? "enable" : "disable";

  xows_log(2,"xmp_carbons_query","query Message Carbons",tag);

  // Send request to enable carbons
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node(tag,{"xmlns":XOWS_NS_CARBONS}));

  // Use generic parsing function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Vcard-temp (XEP-0054)
 *
 * -------------------------------------------------------------------*/
/**
 * Vcard-temp (XEP-0054) XMLNS constants
 */
const XOWS_NS_VCARD        = "vcard-temp";
const XOWS_NS_VCARDXUPDATE = "vcard-temp:x:update";

/**
 * Send query to publish vcard-temp
 *
 * @param   {object}    vcard     vCard data to set
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcardt_set_query(vcard, onparse)
{
  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"set","to":xows_xmp_bind.bare},
              xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD},vcard));

  // Use generic iq parsing function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Function to parse result of get vcard-temp query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcardt_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_vcardt_get_parse","parse get vcard-Temp",xows_xmp_iq_error_text(stanza));
    return;
  }
  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), stanza.querySelector("vCard"));
}

/**
 * Send query to retrieve vcard-temp
 *
 * @param   {object}    to        Contact JID or null to get own
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcardt_get_query(to, onparse)
{
  xows_log(2,"xmp_vcardt_get_query_","query get vcard-Temp",to);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get"},
              xows_xml_node("vCard",{"xmlns":XOWS_NS_VCARD}));

  // Set the "to" attribute if supplied
  if(to !== null) iq.setAttribute("to", to);

  // Use generic iq parsing function
  xows_xmp_send(iq, xows_xmp_vcardt_get_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Publish-Subscribe (XEP-0060)
 *
 * -------------------------------------------------------------------*/
/**
 * Publish-Subscribe (XEP-0060) XMLNS constants
 */
const XOWS_NS_PUBSUB       = "http://jabber.org/protocol/pubsub";
const XOWS_NS_PUBSUBEVENT  = "http://jabber.org/protocol/pubsub#event";
const XOWS_NS_PUBSUBOPTS   = "http://jabber.org/protocol/pubsub#publish-options";

/**
 * Publish-Subscribe (XEP-0060) event client callback
 */
let xows_xmp_fw_onpubsub = function() {};

 /* -------------------------------------------------------------------
 * XMPP API - PubSub - Common routines
 * -------------------------------------------------------------------*/
/**
 * Parse recevied forwarded Pubsub event message
 *
 * @param   {string}    from      Message Sender
 * @param   {string}    event     The <event> element of received message
 */
function xows_xmp_pubsub_recv(from, event)
{
  const items = event.querySelector("items");
  if(!items) return false;

  // Get Event node
  const node = items.getAttribute("node");

  // Get each item child
  const item = [];
  for(let i = 0, n = items.childNodes.length; i < n; ++i) {
    item.push({ "id": items.childNodes[i].getAttribute("id"),
                "data": items.childNodes[i].firstChild});
  }

  // Forward event
  xows_xmp_fw_onpubsub(from, node, item);

  return true; //< stanza processed
}

/**
 * Generic function to publish to account PEP Node
 *
 * @param   {string}    node      PEP node (xmlns)
 * @param   {object}    publish   <publish> child node to add
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_pubsub_publish(node, publish, access, onparse)
{
  xows_log(2,"xmp_pubsub_publish","publish PEP node",node);

  const children = [publish];

  // the <publish-options> child
  if(access) {
    children.push(xows_xml_node("publish-options",{"node":node},
                    xows_xmp_xdata_make([ {"var":"FORM_TYPE","type":"hidden",
                                            "value":XOWS_NS_PUBSUBOPTS},
                                          {"var":"pubsub#access_model",
                                            "value":access}])));
  }

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"set"},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},children));

  // Send final message with generic parsing function
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* -------------------------------------------------------------------
 * XMPP API - PubSub - PEP Native Bookmarks (XEP-0402)
 * -------------------------------------------------------------------*/
/**
 * PEP Native Bookmarks (XEP-0402) XMLNS constants
 */
const XOWS_NS_BOOKMARKS    = "urn:xmpp:bookmarks:1";                  //< XEP-0402

/**
 * Send query to publish bookmark
 *
 * @param   {string}    jid       Bookmark Room JID
 * @param   {string}    name      Bookmark display name
 * @param   {boolean}   auto      Room autojoin flag
 * @param   {string}    nick      Room prefered nick
 * @param   {function}  onparse   Callback to forward parse result
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

/* -------------------------------------------------------------------
 * XMPP API - PubSub - vCard4 Over XMPP (XEP-0292)
 * -------------------------------------------------------------------*/
/**
 * vCard4 Over XMPP (XEP-0292) XMLNS constants
 */
const XOWS_NS_VCARD4       = "urn:xmpp:vcard4";
const XOWS_NS_IETF_VCARD4  = "urn:ietf:params:xml:ns:vcard-4.0";

/**
 * Send query to publish vcard-4
 *
 * @param   {object}    vcard     vCard4 data to set
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcard4_publish(vcard, access, onparse)
{
  xows_log(2,"xmp_vcard4_publish","publish vCard4",nick);

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_VCARD4},
                    xows_xml_node("item",null,
                      xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4},vcard)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_VCARD4, publish, access, onparse);
}

/**
 * Function to parse result of get vcard-4 query
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcard4_get_parse(stanza, onparse)
{
  let vcard = null;
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_vcard4_get_parse","parse get vCard-4",xows_xmp_iq_error_text(stanza));
  } else {
    vcard = stanza.querySelector("vcard");
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse( stanza.getAttribute("from"), vcard);
}

/**
 * Send query to get vcard-4
 *
 * @param   {string}    to        Contact JID get vcard
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_vcard4_get_query(to, onparse)
{
  xows_log(2,"xmp_vcard4_get_query","query get vCard-4",to);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"type":"get","to":to},
              xows_xml_node("vcard",{"xmlns":XOWS_NS_IETF_VCARD4}));

  xows_xmp_send(iq, xows_xmp_vcard4_get_parse, onparse);
}

/* -------------------------------------------------------------------
 * XMPP API - PubSub - User Nickname (XEP-0172)
 * -------------------------------------------------------------------*/
/**
 * User Nickname (XEP-0172) XMLNS constants
 */
const XOWS_NS_NICK         = "http://jabber.org/protocol/nick";

/**
 * Publish XEP-0172 User Nickname
 *
 * @param   {string}    nick      Nickname to publish
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_nick_publish(nick, onparse)
{
  xows_log(2,"xmp_nick_publish","publish Nickname",nick);

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null,
                      xows_xml_node("nick",{"xmlns":XOWS_NS_NICK},nick)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_NICK, publish, null, onparse);
}

/**
 * Function to handle result of Query XEP-0172 User Nickname
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_nick_get_parse(stanza, onparse)
{
  const from = stanza.getAttribute("from");

  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_nick_get_parse","parse get Nickname ("+from+")",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(from, stanza.querySelector("nick"));
}

/**
 * Query XEP-0172 User Nickname
 *
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_nick_get_query(to, onparse)
{
  xows_log(2,"xmp_nick_get_query","query get Nickname",to);

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_NICK},
                    xows_xml_node("item",null))));
  // Send query
  xows_xmp_send(iq, xows_xmp_nick_get_parse, onparse);
}

/* -------------------------------------------------------------------
 * XMPP API - PubSub - User Avatar (XEP-0084)
 * -------------------------------------------------------------------*/
/**
 * User Avatar (XEP-0084) XMLNS constants
 */
const XOWS_NS_AVATAR_DATA  = "urn:xmpp:avatar:data";
const XOWS_NS_AVATAR_META  = "urn:xmpp:avatar:metadata";

/**
 * Publish XEP-0084 User Avatar data
 *
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {string}    data      Base-64 encoded Data to publish
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_data_publish(hash, data, access, onparse)
{
  xows_log(2,"xmp_avat_data_publish","publish Avatar-Data",hash);

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash},
                      xows_xml_node("data",{"xmlns":XOWS_NS_AVATAR_DATA},data)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_DATA, publish, null, onparse); //< access option generate precondition error
}

/**
 * Publish XEP-0084 User Avatar metadata
 *
 * @param   {string}    hash      Base-64 encoded SAH-1 hash of data
 * @param   {number}    type      Image type (expected image/png)
 * @param   {number}    bytes     Image data size in bytes
 * @param   {number}    width     Image width in pixel
 * @param   {number}    height    Image width in pixel
 * @param   {string}    access    Pubsub Access model to define
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_meta_publish(hash, type, bytes, width, height, access, onparse)
{
  xows_log(2,"xmp_avat_meta_publish","publish Avatar-Metadata",hash);

  // Create the <info> node
  const info = xows_xml_node("info",{"id":hash,"type":type,"bytes":bytes,"width":width,"height":height});

  // The <publish> child
  const publish = xows_xml_node("publish",{"node":XOWS_NS_AVATAR_META},
                    xows_xml_node("item",{"id":hash},
                      xows_xml_node("metadata",{"xmlns":XOWS_NS_AVATAR_META},info)));

  // Publish PEP node
  xows_xmp_pubsub_publish(XOWS_NS_AVATAR_META, publish, access, onparse);
}

/**
 * Function to handle result of Query XEP-0084 User Avatar data
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_data_get_parse(stanza, onparse)
{
  let id, data = null;
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_avat_data_get_parse","parse get Avatar-Data",xows_xmp_iq_error_text(stanza));
  }

  // Retrieve the first <item> child
  const item = stanza.querySelector("item");
  if(item) {
    // Get the data hash
    id = item.getAttribute("id");
    // Retrieve the <data> child
    data = xows_xml_innertext(item.querySelector("data"));
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(stanza.getAttribute("from"), id, data);
}

/**
 * Query XEP-0084 User Avatar data
 *
 * @param   {number}    to        Target bare JID
 * @param   {string}    hash      Data Id to get (SAH-1 data hash)
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_data_get_query(to, hash, onparse)
{
  xows_log(2,"xmp_avat_data_get_query","query get Avatar-Data",to+" hash:"+hash);

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_DATA},
                    xows_xml_node("item",{"id":hash}))));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_data_get_parse, onparse);
}

/**
 * Function to handle result of Query XEP-0084 User Avatar data
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_meta_get_parse(stanza, onparse)
{
  const from = stanza.getAttribute("from");

  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_avat_meta_get_parse","parse get Avatar-Metadata ("+from+")",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(from, stanza.querySelector("metadata"));
}

/**
 * Query XEP-0084 User Avatar metadata
 *
 * @param   {number}    to        Target bare JID
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_avat_meta_get_query(to, onparse)
{
  xows_log(2,"xmp_avat_meta_get_query","query get Avatar-Metadata",to);

  // Create the query
  const iq =  xows_xml_node("iq",{"type":"get","to":to},
                xows_xml_node("pubsub",{"xmlns":XOWS_NS_PUBSUB},
                  xows_xml_node("items",{"node":XOWS_NS_AVATAR_META})));
  // Send query
  xows_xmp_send(iq, xows_xmp_avat_meta_get_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Message Archive Management(XEP-0313) routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 *  Message Archive Management(XEP-0313) XMLNS constants
 */
const XOWS_NS_MAM = "urn:xmpp:mam:2";

/**
 *  Result Set Management (XEP-0059) XMLNS constants
 */
const XOWS_NS_RSM = "http://jabber.org/protocol/rsm";

/**
 *  Map object to store separated stack of incomming archived messages
 *  following a MAM query
 */
const xows_xmp_mam_stack = new Map();

/**
 *  Map object to store parameters associated with a MAM query
 */
const xows_xmp_mam_param = new Map();

/**
 * Parse recevied forwarded archived message from MAM query
 *
 * @param   {string}    result    The <result> element of received message
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

  let id, from, to, time, body, rpid, rcid;

  // We should found a <delay> node
  const delay = forward.querySelector("delay");
  if(delay) time = new Date(delay.getAttribute("stamp")).getTime();
  // We found found a <message> node
  const message = forward.querySelector("message");
  if(message) {
    // Get message common data
    id = message.getAttribute("id");
    from = message.getAttribute("from");
    to = message.getAttribute("to");
    // Loop over children
    let node, xmlns, i = message.childNodes.length;
    while(i--) {
      node = message.childNodes[i];
      // Skip the non-object nodes
      if(node.nodeType !== 1)
        continue;
      // Get XMLNS
      xmlns = node.getAttribute("xmlns");
      // Check for chatstate
      if(xmlns === XOWS_NS_CHATSTATES)
        continue;
      // Check for delivery receipt
      if(xmlns === XOWS_NS_RECEIPTS) {
        rcid = node.getAttribute("id");
        continue;
      }
      // Check for correction
      if(xmlns === XOWS_NS_CORRECT) {
        rpid = node.getAttribute("id");
        continue;
      }
      // Check for <body> node
      if(node.tagName === "body") {
        body = node.hasChildNodes() ? xows_xml_innertext(node) : "";
      }
    }

    // This should never happen
    if(!time) time = new Date(0).getTime();

    // Add archived message to stack
    xows_xmp_mam_stack.get(qid).push({"page":page,"id":id,"from":from,"to":to,"time":time,"body":body,"repl":rpid,"recp":rcid});

    xows_log(2,"xmp_recv_mam_result","Adding archived message to result stack","from "+from+" to "+to);
    return true; //< stanza processed
  }
  return false;
}

/**
 * Archive result parsing function called when archive query result
 * is received.
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_mam_parse(stanza, onparse)
{
  // Get query result id
  const id = stanza.getAttribute("id");
  if(!xows_xmp_mam_param.has(id)) {
    xows_log(1,"xmp_mam_parse","MAM query id not found",id);
    return;
  }

  // Retrieve stored query parameters
  const param = xows_xmp_mam_param.get(id);
  xows_xmp_mam_param.delete(id); //< delete entrie we do not need it

  // Check for query error
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_mam_parse","Archive query failure ("+param.to+")",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Retrieve queryid to get proper result stack
  if(!xows_xmp_mam_stack.has(param.qid)) {
    xows_log(1,"xmp_mam_parse","MAM result queryid not found",qid);
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
      if(xows_isfunc(onparse))
        onparse(param.to, param.jid, [], count, complete);
      return;
    }

    // Result last RSM Page id
    node = fin.querySelector("last");
    if(node) last = xows_xml_innertext(node);

    // Extract messages from stack
    let i, result;
    const n = stack.length;

    // Align index to the first page
    for(i = 0; i < n; i++)
      if(stack[i].page === first) break;

    if(i >= n) {
      xows_log(0, "xmp_mam_parse","first result page not found in stack",first);
      result = []; //< create empty result
    } else {
      // Get messages untile we found the last page
      let start = i, size = 0;
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
    if(xows_isfunc(onparse))
      onparse(param.to, param.jid, result, count, complete);
  }
}

/**
 * Send query for archived messages matching the supplied filters
 * and the specified result set page
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
  field.push({"var":"FORM_TYPE","type":"hidden","value":XOWS_NS_MAM});
  if(  jid) field.push({"var":"with"  ,"value":jid});
  if(start) field.push({"var":"start" ,"value":new Date(start).toJSON()});
  if(  end) field.push({"var":"end"   ,"value":new Date(end).toJSON()});

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

  xows_log(2,"xmp_mam_query","send Archive query",
            "with "+jid+" start "+start+" end "+end);

  // Send the query
  xows_xmp_send(iq, xows_xmp_mam_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - HTTP File Upload (XEP-0363) routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * HTTP File Upload (XEP-0363) XMLNS constants
 */
const XOWS_NS_HTTPUPLOAD   = "urn:xmpp:http:upload:0";

/**
 *  HTTP Upload per-filename query parameters storage
 */
const xows_xmp_upld_param = new Map();

/**
 * Http Upload result parsing function called when Http Upload query
 * result is received
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_upld_parse(stanza, onparse)
{
  const id = stanza.getAttribute("id");

  // Retrieve query parameters
  if(!xows_xmp_upld_param.has(id)) {
    xows_log(1,"xmp_upld_parse","query parameters not found");
    return;
  }
  const param = xows_xmp_upld_param.get(id);
  xows_xmp_upld_param.delete(id);

  if(stanza.getAttribute("type") === "error") {
    const err_msg = xows_xmp_iq_error_text(stanza);
    xows_log(1,"xmp_upld_parse","HTTP-Upload query error",err_msg);
    // Forward parse result
    if(xows_isfunc(onparse))
      onparse(param.name, null, null, null, err_msg);
    return;
  }

  // Get the <slot> node in the stanza
  const slot = stanza.querySelector("slot");
  // Get <put> node
  const put = slot.querySelector("put");
  // Retreive the URL for HTTP PUT
  const puturl = put.getAttribute("url");
  // Retreive header data for HTTP PUT
  const header = put.getElementsByTagName("header");
  // Get the URL for HTTP GET
  const geturl = slot.querySelector("get").getAttribute("url");

  xows_log(2,"xmp_upld_parse","accepted HTTP-Upload slot",puturl);

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(param.name, puturl, header, geturl);
}

/**
 * Send a query to request a slot for file upload via
 * HTTP Upload service
 *
 * @param   {string}    url       Http-Upload service URL
 * @param   {string}    name      Upload file name
 * @param   {number}    size      Upload file size in bytes
 * @param   {string}    type      Upload file MIM type
 * @param   {function}  onparse   Callback to forward parse result
 */
function xows_xmp_upld_query(url, name, size, type, onparse)
{
  xows_log(2,"xmp_upld_query","send HTTP-Upload query",size+" bytes required");

  let attr = {"xmlns":XOWS_NS_HTTPUPLOAD,"filename":name,"size":size};
  if(type) attr.type = type;

  const id = xows_gen_uuid();
  const iq =  xows_xml_node("iq",{"id":id,"to":url,"type":"get"},
                xows_xml_node("request",attr));

  xows_xmp_upld_param.set(id,{"name":name});

  xows_xmp_send(iq, xows_xmp_upld_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Multi-User Chat (XEP-0045) routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Multi-User Chat (XEP-0045) XMLNS constants
 */
const XOWS_NS_MUC          = "http://jabber.org/protocol/muc";
const XOWS_NS_MUCUSER      = "http://jabber.org/protocol/muc#user";
const XOWS_NS_MUCOWNER     = "http://jabber.org/protocol/muc#owner";

/**
 * Multi-User Chat (XEP-0045) Room role constants
 */
const XOWS_ROLE_NONE = 0;
const XOWS_ROLE_VIST = 1;
const XOWS_ROLE_PART = 2;
const XOWS_ROLE_MODO = 3;

/**
 * Multi-User Chat (XEP-0045) Room role string to constant mapping
 */
const xows_xmp_role_level_map = {
  "none"          : 0,
  "visitor"       : 1,
  "participant"   : 2,
  "moderator"     : 3
};

/**
 * Multi-User Chat (XEP-0045) Room affiliation constants
 */
const XOWS_AFFI_OUTC = -1;
const XOWS_AFFI_NONE = 0;
const XOWS_AFFI_MEMB = 1;
const XOWS_AFFI_ADMN = 2;
const XOWS_AFFI_OWNR = 3;

/**
 * Multi-User Chat (XEP-0045) Room affiliation string to constant mapping
 */
const xows_xmp_affi_level_map = {
  "outcast"       : -1,
  "none"          : 0,
  "member"        : 1,
  "admin"         : 2,
  "owner"         : 3
};

/**
 * Send a subject to MUC room
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

  xows_log(2,"xmp_muc_subject_send","send subject to",to);

  // Send message
  xows_xmp_send(xows_xml_node("message",{"id":id,"to":to,"type":"groupchat"},
                  xows_xml_node("subject",null,xows_xml_escape(subj))));

  return id;
}

/**
 * Function to parse result of MUC room config form
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_get_parse(stanza, onparse)
{
  if(stanza.getAttribute("type") === "error") {
    xows_log(1,"xmp_muc_cfg_get_parse","parse get MUC config",xows_xmp_iq_error_text(stanza));
    return;
  }

  // Forward parse result
  if(xows_isfunc(onparse))
    onparse(  stanza.getAttribute("from"),
              xows_xmp_xdata_parse(stanza.querySelector("x")));
}

/**
 * Send query to get MUC room config form
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_get_guery(to, onparse)
{
  xows_log(2,"xmp_muc_cfg_get_guery","query get MUC config",to);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"get"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER}));

  xows_xmp_send(iq, xows_xmp_muc_cfg_get_parse, onparse);
}

/**
 * Send query to cancel MUC form process
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_set_cancel(to, onparse)
{
  xows_log(2,"xmp_muc_cfg_set_cancel","cancel set MUC config",to);

  // Create the <x> form node
  const x = xows_xmp_xdata_cancel();

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},x));

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to submit MUC room config form
 *
 * @param   {string}    to        Room JID to get configuration from
 * @param   {object[]}  form      Filled form array to submit
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_cfg_set_query(to, form, onparse)
{
  xows_log(2,"xmp_muc_cfg_set_query","query set MUC config",to);

  // Create the <x> form node
  const x = xows_xmp_xdata_make(form);

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},x));

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to set MUC occupant role
 *
 * @param   {string}    to        Room JID to assign Occupant role
 * @param   {string}    nick      Occupant nickname in Room
 * @param   {string}    role      Role to assign
 * @param   {string}   [reason]   Optional reason string
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_role_query(to, nick, role, reason, onparse)
{
  xows_log(2,"xmp_muc_role_set_query","query set MUC role",to);

  const r = reason ? xows_xml_node("reason",null,reason) : null;

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},
                xows_xml_node("item",{"nick":nick,"role":role},r)));

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to set MUC occupant affiliation
 *
 * @param   {string}    to        Room JID to assign Occupant affilation
 * @param   {string}    jid       Occupant JID (the real one)
 * @param   {string}    affi      Affiliation to assign
 * @param   {string}   [reason]   Optional reason string
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_affi_query(to, jid, affi, reason, onparse)
{
  xows_log(2,"xmp_muc_role_set_query","query set MUC role",to);

  const r = reason ? xows_xml_node("reason",null,reason) : null;

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},
                xows_xml_node("item",{"affiliation":affi,"jid":jid},r)));

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/**
 * Send query to to destroy MUC room
 *
 * @param   {string}    to        Room JID to be destroyed
 * @param   {string}   [alt]      Optional JID of alternate Room to join
 * @param   {string}   [passwd]   Optional password for alternate Room
 * @param   {string}   [reason]   Optional reason string
 * @param   {function}  onparse   Callback to receive parse result
 */
function xows_xmp_muc_destroy_query(to, alt, passwd, reason, onparse)
{
  xows_log(2,"xmp_muc_destroy_query","query destroy MUC room",to);

  // Base destroy node
  const destroy = xows_xml_node("destroy",null,null);

  // set optional elements
  if(alt) destroy.setAttribute("jid", alt);
  if(passwd) xows_xml_parent(destroy,xows_xml_node("password",null,passwd));
  if(reason) xows_xml_parent(destroy,xows_xml_node("reason",null,reason));

  // Create and launch the query
  const iq = xows_xml_node("iq",{"to":to,"type":"set"},
              xows_xml_node("query",{"xmlns":XOWS_NS_MUCOWNER},destroy));

  // We use generical iq parse function to get potential error message
  xows_xmp_send(iq, xows_xmp_iq_parse, onparse);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Jingle (XEP-0166) routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Jingle (XEP-0166) XMLNS constants
 */
const XOWS_NS_JINGLE       = "urn:xmpp:jingle:1";                     //< XEP-0166
const XOWS_NS_JINGLE_RTP1  = "urn:xmpp:jingle:apps:rtp:1";            //< XEP-0166
const XOWS_NS_JINGLE_RTPA  = "urn:xmpp:jingle:apps:rtp:audio";        //< XEP-0166
const XOWS_NS_JINGLE_RTPV  = "urn:xmpp:jingle:apps:rtp:video";        //< XEP-0166
const XOWS_NS_JINGLE_ICE   = "urn:xmpp:jingle:transports:ice-udp:1";  //< XEP-0166 / XEP-0176
const XOWS_NS_JINGLE_FB    = "urn:xmpp:jingle:apps:rtp:rtcp-fb:0";    //< XEP-0166 / XEP-0293
const XOWS_NS_JINGLE_HEXT  = "urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"; //< XEP-0166 / XEP-0294
const XOWS_NS_JINGLE_DTLS  = "urn:xmpp:jingle:apps:dtls:0";           //< XEP-0166 / XEP-0320
const XOWS_NS_JINGLE_GRP   = "urn:xmpp:jingle:apps:grouping:0";       //< XEP-0166 / XEP-0338
const XOWS_NS_JINGLE_SSMA  = "urn:xmpp:jingle:apps:rtp:ssma:0";       //< XEP-0166 / XEP-0339

/**
 * Jingle (XEP-0166) event client callback
 */
let xows_xmp_fw_onjingle = function() {};

/* -------------------------------------------------------------------
 * XMPP API - Jingle - SDP / Jingle conversions routines
 * -------------------------------------------------------------------*/
/**
 * Create SDP string from jingle RTP session request
 *
 * The supplied jingle node must follow the Jingle RTP Sessions
 * standard (XEP-0167), which is the only one supported by this
 * function.
 *
 * @parma   {object}    jingle      Jingle node to convert
 *
 * @return  {string}    SDP string or null if failed.
 */
function xows_xmp_jing_jingle2sdp(jingle)
{
  // Check for support and compatibility
  const descs = jingle.querySelectorAll("description");
  for(let i = 0; i < descs.length; ++i)
    if(descs[i].getAttribute("xmlns") !== XOWS_NS_JINGLE_RTP1)
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
 * Create jingle RTP session request from SDP raw string.
 *
 * The created jingle node does not have all required attributes:
 * initiator, responder and action attributes have to be defined.
 *
 * @parma   {string}    sdp         SDP string to parse
 *
 * @return  {object}    RTP session <Jingle> node.
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
/* -------------------------------------------------------------------
 * XMPP API - Jingle - Session management interface
 * -------------------------------------------------------------------*/
/**
 * Function to proceed an received <jingle> stanza
 *
 * @param   {object}    stanza    Received <jingle> stanza
 */
function xows_xmp_jing_recv(stanza)
{
  const from = stanza.getAttribute("from");
  const jingle = stanza.querySelector("jingle");
  const action = jingle.getAttribute("action");

  let mesg;

  if(action === "session-terminate") {

    // Get terminate reason
    const reason = jingle.querySelector("reason");
    if(reason && reason.childNodes[0])
      mesg = reason.childNodes[0].tagName;

  } else {

    // Convert jingle RTP Session description to SDP string
    mesg = xows_xmp_jing_jingle2sdp(jingle);
    if(mesg === null) {
      xows_log(1,"xmp_recv_jingle","error","RTP to SDP conversion failed");
      // Send back error
      xows_xmp_iq_error_send(stanza.getAttribute("id"), from, "cancel", "bad-request");
      return;
    }

  }

  xows_log(2,"xmp_recv_jingle","received "+action,from);

  // Forward to client
  xows_xmp_fw_onjingle(from, stanza.getAttribute("id"), jingle.getAttribute("sid"), action, mesg);
}

/**
 * Parse received jingle request acknowledge, this function forward
 * only errors to client.
 *
 * @param   {object}    stanza    Received query response stanza
 * @param   {function}  onresult  Callback to forward result
 */
function xows_xmp_jing_result(stanza, onresult)
{
  if(stanza.getAttribute("type") === "error") {

    const err_msg = xows_xmp_iq_error_text(stanza);
    xows_log(1,"xmp_jingle_parse","Jingle query error",err_msg);

    // Forward parse result
    if(xows_isfunc(onresult))
      onresult(XOWS_SIG_ERR, err_msg);

    return;
  }

  // Forward parse result
  if(xows_isfunc(onresult))
    onresult(3);
}

/**
 * Send Jingle RTP session initiate from SDP offer
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sdp         SDP offer string
 * @param   {function} [onresult]   Optionnal callback for request result
 *
 * @return  {string}    Initiated Jingle session ID
 */
function xows_xmp_jing_initiate_sdp(to, sdp, onresult)
{
  // Create <jingle> RTP session from SDP string
  const jingle = xows_xmp_jing_sdp2jingle(sdp);
  const sid = xows_gen_nonce_asc(16); // xows_sdp_get_sid(sdp);

  // Complete <jingle> node with proper attributes
  jingle.setAttribute("initiator",xows_xmp_bind.full);
  jingle.setAttribute("action","session-initiate");
  jingle.setAttribute("sid",sid);

  // Send message
  xows_xmp_send(xows_xml_node("iq",{"type":"set","to":to},jingle),
                xows_xmp_jing_result, onresult);
}

/**
 * Send Jingle RTP session accept from SDP answer
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sid         Jingle session ID
 * @parma   {string}    sdp         SDP answer string
 * @param   {function} [onresult]   Optionnal callback for request result
 */
function xows_xmp_jing_accept_sdp(to, sid, sdp, onresult)
{
  // Create <jingle> RTP session from SDP string
  const jingle = xows_xmp_jing_sdp2jingle(sdp);

  // Complete <jingle> node with proper attributes
  jingle.setAttribute("responder",xows_xmp_bind.full);
  jingle.setAttribute("action","session-accept");
  jingle.setAttribute("sid",sid);

  // Send message
  xows_xmp_send(xows_xml_node("iq",{"type":"set","to":to},jingle),
                xows_xmp_jing_result, onresult);
}

/**
 * Send Jingle session request from SDP
 *
 * @parma   {string}    to          Destination JID
 * @parma   {string}    sid         Jingle session ID
 * @parma   {string}    reason      Session terminate reason
 * @param   {function} [onresult]   Optionnal callback for request result
 */
function xows_xmp_jing_terminate(to, sid, reason, onresult)
{
  // Send message
  xows_xmp_send(xows_xml_node("iq",{"type":"set","to":to},
                  xows_xml_node("jingle",{"xmlns":XOWS_NS_JINGLE,"sid":sid,"action":"session-terminate"},
                    xows_xml_node("reason",null,xows_xml_node(reason)))),
                      xows_xmp_jing_result, onresult);
}

/* -------------------------------------------------------------------
 *
 * XMPP API - Entity Capabilities (XEP-0115)
 *
 * -------------------------------------------------------------------*/
/**
 * Entity Capabilities (XEP-0115) XMLNS constants
 */
const XOWS_NS_CAPS         = "http://jabber.org/protocol/caps";

/**
 * Get own entity capabilities
 *
 * This returns an array  containing XML nodes ready to be injected
 * into a query result stanza.
 *
 * @return  {string}    Array of XML objects defining client identity and features.
 */
function xows_xmp_caps_self_features()
{
  let vcard4 = XOWS_NS_VCARD4;
  let avatar = XOWS_NS_AVATAR_META;

  // Optional features (pubsub notify subscribtion)
  if(xows_options.vcard4_notify) vcard4 += "+notify";
  if(xows_options.avatar_notify) avatar += "+notify";

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
    //xows_xml_node("feature",{"var":XOWS_NS_SID}),
    xows_xml_node("feature",{"var":XOWS_NS_VCARD}),
    xows_xml_node("feature",{"var":XOWS_NS_IETF_VCARD4}),
    xows_xml_node("feature",{"var":vcard4}),
    xows_xml_node("feature",{"var":XOWS_NS_AVATAR_DATA}),
    xows_xml_node("feature",{"var":avatar}),
    xows_xml_node("feature",{"var":XOWS_NS_BOOKMARKS+"+notify"}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTP1}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTPA}),
    xows_xml_node("feature",{"var":XOWS_NS_JINGLE_RTPV})
  ];

  return caps;
}

/**
 * Get own entity capabilities verification hash
 *
 * This build the verification hash from data returned by the
 * xows_xmp_caps_self_features function.
 *
 * @return  {string}    Base64 encoded verficiation hash
 */
function xows_xmp_caps_self_verif()
{
  const caps = xows_xmp_caps_self_features();

  let i, n = caps.length, S = "";

  // Concatenate indentities
  for(i = 0; i < n; ++i) {
    if(caps[i].tagName === "identity") {
      S += caps[i].getAttribute("category") + "/";
      S += caps[i].getAttribute("type") + "/";
      S += (caps[i].hasAttribute("xml:lang")?caps[i].getAttribute("xml:lang"):"") + "/";
      S += caps[i].getAttribute("name") + "<";
    }
  }
  // Concatenate features
  for(i = 0; i < n; ++i) {
    if(caps[i].tagName === "feature")
      S += caps[i].getAttribute("var") + "<";
  }

  return xows_bytes_to_b64(xows_hash_sha1(S));
}
