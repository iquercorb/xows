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
 *                    WebRTC Interface API Module
 *
 * ------------------------------------------------------------------ */

/**
 * Media Call WebRTC RTCPeerConnection object
 */
let xows_wrtc_pc = null;

/**
 * Reference to custom event callback function for SDP string created
 */
let xows_wrtc_cb_onsdp = function(){};

/**
 * Reference to custom event callback function for remote Stream available
 */
let xows_wrtc_cb_onstream = function(){};

/**
 * Reference to custom event callback function for established connection
 */
let xows_wrtc_cb_onlinked = function(){};

/**
 * Reference to custom event callback function for error
 */
let xows_wrtc_cb_onerror = function(){};

/**
 * Queue for pending Remote Description to be configured
 */
const xows_wrtc_remote_queue = [];

/**
 * Flag for Remote Description/Stream currentely pending
 */
let xows_wrtc_remote_pendg = false;

/**
 * Generate Turn server REST API credential from secret
 *
 * @param   {string}    name      Username to use for generation
 * @param   {string}    secret    TURN server static secret
 *
 * @return  {object}    Generated username and password
 */
function xows_wrtc_gen_credential(name, secret)
{
  const expire = parseInt(Date.now()/1000) + 24*3600;
  const username = expire+":"+name;
  const password = xows_bytes_to_b64(xows_hmac_sha1(username, secret));

  return {"username":username,"password":password};
}

/**
 * Callback function for WebRTC Peer Connection error
 *
 * @param   {object}      error    Error object
 */
function xows_wrtc_onerror(error)
{
  xows_log(1,"wrtc_onerror",error.message);

  // Forward error
  xows_wrtc_cb_onerror(error.message);
}

/**
 * Callback function for WebRTC Peer Connection connection state changed
 *
 * @param   {object}      event     Event object
 */
function xows_wrtc_onstatechange(event)
{
  xows_log(2,"wrtc_onstatechange","state",xows_wrtc_pc.connectionState);

  if(xows_wrtc_pc.connectionState === "connected")
    xows_wrtc_cb_onlinked(); //< Forward status
}

/**
 * Callback function for WebRTC Peer Connection SDP Offer/Answer created
 *
 * @param   {object}      description    Session Description (RTCSessionDescription) object
 */
function xows_wrtc_setlocaldesc(description)
{
  // Set Local Description
  xows_wrtc_pc.setLocalDescription(description).then(null, xows_wrtc_onerror);
}

/**
 * Callback function for WebRTC Peer Connection negotiation required
 *
 * @param   {object}      event     Event object
 */
function xows_wrtc_onnegotiation(event)
{
  // Request to create an SDP Offer
  xows_wrtc_pc.createOffer().then(xows_wrtc_setlocaldesc, xows_wrtc_onerror);
}

/**
 * Callback function for WebRTC Peer Connection ICE gathering state changed
 *
 * @param   {object}      event    Event object
 */
function xows_wrtc_onicestate(event)
{
  if(xows_wrtc_pc.iceGatheringState == "complete") {

    // Forward generated local SDP
    if(xows_isfunc(xows_wrtc_cb_onsdp)) {

      xows_log(2,"wrtc_onicestate","Local description available");

      xows_wrtc_cb_onsdp(xows_wrtc_pc.localDescription.sdp);
    }
  }
}

/**
 * WebRTC Peer Connection ontrack callback function
 *
 * @param   {object}      event    RTCP Track event (RTCTrackEvent) object
 */
function xows_wrtc_ontrack(event)
{
  // Forward media stream
  if(event.streams.length) {

    xows_log(2,"wrtc_ontrack","Remote stream available");

    // Takes the first item from Remote queue
    const item = xows_wrtc_remote_queue.shift();

    // Call onstream callback with custom parameter
    if(xows_isfunc(item.onstream))
      item.onstream(event.streams[0], item.param);

    // Remote Description no longer pending
    xows_wrtc_remote_pendg = false;

    // We can process the next Remote description in queue
    xows_wrtc_remote_next();
  }
}

/**
 * Clear and reset WebRTC Peer Connection
 */
function xows_wrtc_clear()
{
  // Close RTC Peer Connection
  if(xows_wrtc_pc) {

    xows_wrtc_pc.close();
    xows_wrtc_pc = null;

    xows_log(2,"wrtc_setup","WebRTC cleared");
  }
}

/**
 * Create new WebRTC Peer Connection using specified STUN and TURN server list
 *
 * The ICE server description object must follow the service shema as provided
 * by the XMPP External Service Discovery (XEP-0215).
 *
 * TURN servers must be provided with either REST API 'username' and 'password',
 * or a 'secret' propertie corresponding to server's static auth secret.
 *
 * @param   {object[]}    ices     Array of ICE server description objects
 * @param   {function}    onlinked Callback function for connection success
 * @param   {function}    onerror  Callback function for error
 */
function xows_wrtc_setup(ices, onlinked, onerror)
{
  // Clear any previous config
  xows_wrtc_clear();

  // Build array for ICE Servers descriptor
  const iceservers = [];

  for(let i = 0; i < ices.length; ++i) {
    const ice = {urls:ices[i].type+":"+ices[i].host};
    // Check whether we need to generate credentials
    if(ices[i].secret) {
      const creds = xows_wrtc_gen_credential(xows_cli_self.bare, ices[i].secret);
      ice.username = creds.username;
      ice.credential = creds.password;
    } else {
      if(ices[i].username) ice.username = ices[i].username;
      if(ices[i].password) ice.credential = ices[i].password;
    }
    iceservers.push(ice);
  }

  if(onlinked) xows_wrtc_cb_onlinked = onlinked;
  if(onerror) xows_wrtc_cb_onerror = onerror;

  // Create new RTC Peer Connection object
  xows_wrtc_pc = new RTCPeerConnection({"iceServers":iceservers});

  // Set callback functions
  xows_wrtc_pc.ontrack = xows_wrtc_ontrack;
  xows_wrtc_pc.onnegotiationneeded = xows_wrtc_onnegotiation;
  xows_wrtc_pc.onconnectionstatechange = xows_wrtc_onstatechange;
  xows_wrtc_pc.onicegatheringstatechange = xows_wrtc_onicestate;

  xows_log(2,"wrtc_setup","WebRTC initialized");
}

/**
 * Set WebRTC Peer Connection local stream.
 *
 * A call before xows_wrtc_remote_sdp is considered as a call initiation to
 * produce an Offer, otherwise as call acceptance to produce an Answer.
 *
 * Once SDP description (either Offer or Answer) created, 'onspd' callback
 * is called with the local SDP description string as parameter.
 *
 * @param   {object}      stream    Media Streams API MediaStream object.
 * @param   {function}    onsdp     Callback function for SDP description created
 */
function xows_wrtc_local_stream(stream, onsdp)
{
  if(!xows_wrtc_pc) {
    xows_log(1,"wrtc_local_stream","WebRTC not initialized");
    return;
  }

  // Set on remote response callback
  if(onsdp) xows_wrtc_cb_onsdp = onsdp;

  // Add stream tracks to RTC Connection
  const tracks = stream.getTracks();
  for(let i = 0; i < tracks.length; ++i)
    xows_wrtc_pc.addTrack(tracks[i]);

  xows_log(2,"wrtc_local_stream","Local stream added");

  // Already set remoteDescription mean call acceptance, we must created and
  // SDP Answer.
  if(xows_wrtc_pc.remoteDescription) {
    // Request to create an SDP Answer
    xows_wrtc_pc.createAnswer().then(xows_wrtc_setlocaldesc, xows_wrtc_onerror);
  }

  // An unset remoteDescription mean call initiation, the WebRTC interface
  // will call onnegotiationneeded callback to request creation of SDP Offer.
}

/**
 * Setup the next Remote description to WebRTC Peer Connection.
 *
 * This function is used for a Remote description management in FIFO way and
 * should not be called on itself.
 *
 * See: xows_wrtc_remote_sdp
 */
function xows_wrtc_remote_next()
{
  if(!xows_wrtc_remote_queue.length || xows_wrtc_remote_pendg)
    return;

  xows_log(2,"wrtc_remote_next","Remote description added");

  const item = xows_wrtc_remote_queue[0];
  xows_wrtc_pc.setRemoteDescription(item.desc).then(null, xows_wrtc_onerror);

  // Remote Description pending for new Stream
  xows_wrtc_remote_pendg = true;
}

/**
 * Add Remote description to be supplied to WebRTC Peer Connection.
 *
 * If called before xows_wrtc_local_stream, the 'sdp' parameteris treated as
 * an incoming Answer, otherwise it is treated as an incoming Offer.
 *
 * Once remote stream availabl, 'onstream' callback is called with remote
 * media stream as first parameter and the supplied custom 'param' parameter
 * as second one.
 *
 * @param   {string}      sdp       Received remote SDP Description string.
 * @param   {function}    onstream  Callback function for Remote stream available.
 * @param   {any}        [param]    Optionnal user parameter to be passed to onstream
 */
function xows_wrtc_remote_sdp(sdp, onstream, param)
{
  if(!xows_wrtc_pc) {
    xows_log(1,"wrtc_local_stream","WebRTC not initialized");
    return;
  }

  // Already set localDescription mean we are initiator
  const type = xows_wrtc_pc.localDescription ? "answer" : "offer";
  const desc = new RTCSessionDescription({"type":type,"sdp":sdp});

  // Add to Remote queue, this will be threated as FIFO
  xows_wrtc_remote_queue.push({"desc":desc,"onstream":onstream,"param":param});

  xows_log(2,"wrtc_remote_sdp","Remote description queued");

  // Treat next
  xows_wrtc_remote_next();
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Local Description defined.
 *
 * #return  {boolean}   True if Local Description is defined, false otherwise.
 */
function xows_wrtc_has_local()
{
  return xows_wrtc_pc ? (xows_wrtc_pc.localDescription !== null) : false;
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Remote Description defined.
 *
 * #return  {boolean}   True if Remote Description is defined, false otherwise.
 */
function xows_wrtc_has_remote()
{
  return xows_wrtc_pc ? (xows_wrtc_pc.remoteDescription !== null) : false;
}

/**
 * Returns whether WebRTC Peer Connection is currently ready, meaning
 * object exist and is configured.
 *
 * #return  {boolean}   True if WebRTC Peer Connection is ready, false otherwise.
 */
function xows_wrtc_ready()
{
  return (xows_wrtc_pc !== null);
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Local Description defined.
 *
 * #return  {boolean}   True if Local Description is defined, false otherwise.
 */
function xows_wrtc_linked()
{
  return xows_wrtc_pc ? (xows_wrtc_pc.connectionState === "connected") : false;
}

/**
 * Returns whether WebRTC Peer Connection can be considered as busy.
 *
 * #return  {boolean}   True if WebRTC Peer Connection is busy, false otherwise.
 */
function xows_wrtc_busy()
{
  return xows_wrtc_has_local();
}

