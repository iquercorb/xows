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
 *                         GUI API Interface
 *
 *                       Media Call Sub-Module
 *
 * ------------------------------------------------------------------ */
/* -------------------------------------------------------------------
 * Calls Interactions - Call View
 * -------------------------------------------------------------------*/
/**
 * Chat Call frame on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_view_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.tagName !== "BUTTON")
    return;

  let mutted;

  switch(event.target.id)
  {
    case "call_spkr": {
        const call_volu = xows_doc("call_volu");
        mutted = event.target.classList.toggle("MUTTED");
        xows_gui_audio.vol.gain.value = mutted ? 0 : parseInt(call_volu.value) / 100;
        call_volu.disabled = mutted;
        xows_gui_sound_play(mutted ? "mute" : "unmute"); //< Play sound
      } break;

    case "call_came": {
        mutted = event.target.classList.toggle("MUTTED");
        // Enable/Disable local video tracks
        xows_cli_call_self_mute(xows_gui_peer, "video", mutted);
        xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      } break;

    case "call_micr": {
        mutted = event.target.classList.toggle("MUTTED");
        // Enable/Disable local video tracks
        xows_cli_call_self_mute(xows_gui_peer, "audio", mutted);
        xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      } break;

    case "call_hgup": {
        // Hangup and clear data
        xows_gui_call_self_hangup(xows_gui_peer,"success");
      } break;

    case "call_expd": {
        // Set Chat Frame layout to exapnd Call Frame
        const full = xows_doc_cls_tog("chat_fram","CALL-FULL");
        // Change expand/reduce button title
        const title = full ? "Reduce" : "Expand";
        xows_doc("call_expd").title = xows_l10n_get(title);
      } break;
  }
}

/**
 * Chat Call Volume slider on-input callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_view_oninput(event)
{
  const gain = parseInt(event.target.value) / 100;

  // Set volume
  xows_gui_audio.vol.gain.value = gain;
  xows_log(2, "gui_call_volu_oninput", "volume", gain);

  // Change volume slider icon according current level
  let cls = "";

  if(gain > 0.66) {
    cls = "RNG-MAX";
  } else if(gain < 0.33) {
    cls = "RNG-MIN";
  }

  xows_doc("call_spkr").className = cls;
}

/**
 * Function to open the Chat Multimedia Call Session layout
 *
 * @param   {object}    peer    Peer object
 */
function xows_gui_call_view_open(peer)
{
  const call_view = xows_gui_doc(peer,"call_view");

  // Reset expand/reduce button title
  xows_gui_doc(peer,"call_expd").title = xows_l10n_get("Expand");

  // Reset volume slider and button to initial state
  const call_spkr = xows_gui_doc(peer,"call_spkr");
  const call_volu = xows_gui_doc(peer,"call_volu");

  call_spkr.className = "";
  call_volu.disabled = false;
  call_volu.value = 50;

  // Set gain to current volume slider position
  xows_gui_audio.vol.gain.value = parseInt(call_volu.value) / 100;

  // Reset Microphone and camera button to intial state
  const call_came = xows_gui_doc(peer,"call_came");
  const call_micr = xows_gui_doc(peer,"call_micr");

  call_micr.className = "";
  call_came.className = "";
  call_came.hidden = !xows_cli_call_medias(peer).video;

  if(call_view.hidden) {
    if(peer === xows_gui_peer) {
      // Add event listeners
      xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
      xows_doc_listener_add(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
    }

    // Show Call view
    call_view.hidden = false;

    // Keep scroll to proper position from bottom. Calling this
    // manually allow us to get rid of ResizeObserver
    xows_gui_doc_scrl_keep(peer);
  }
}

/**
 * Function to close Multimedia Call Session layout
 *
 * @param   {object}    peer    Peer object
 */
function xows_gui_call_view_close(peer)
{
  const call_view = xows_gui_doc(peer,"call_view");

  // Mute sound
  xows_gui_audio.vol.gain.value = 0;

  if(peer === xows_gui_peer) {
    // Remove event listeners
    xows_doc_listener_rem(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
    xows_doc_listener_rem(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
  }

  // Hide Call view
  call_view.hidden = true;

  // Empty the peer/stream view grid
  xows_gui_doc(peer,"call_grid").innerHTML = "";

  // Reset Chat frame layout
  xows_doc("chat_fram").classList.remove("CALL-FULL");
}

/**
 * Function to add peer to the Chat Multimedia session (Call view)
 * interface
 *
 * @param   {object}    peer      Call Peer object
 * @param   {object}    part      Participant Peer object
 * @param   {object}    stream    Participant Stream object
 */
function xows_gui_call_view_part_add(peer, part, stream)
{
  const call_grid = xows_gui_doc(peer, "call_grid");

  const is_video = stream.getVideoTracks().length;
  if(is_video && part.self) return; //< No local video loopback

  // Search for already existing stream for this peer
  let element = call_grid.querySelector("div[data-peer='"+xows_cli_peer_iden(part)+"']");

  let media;

  if(element) {
    // Simply update stream
    element.firstChild.srcObject = stream;
    return;
  } else {
    // Create <strm-audio> or <strm-video> element from template
    if(is_video) {
      element = xows_tpl_spawn_stream_video(part);
      media = element.querySelector("video");
    } else {
      element = xows_tpl_spawn_stream_audio(part);
      media = element.querySelector("audio");
    }
  }

  // Mute audio output since it will be managed through AudioContext
  media.muted = true;

  // Creates AudioSource node and store it within Media object
  media.srcNode = xows_gui_audio.ctx.createMediaStreamSource(stream);

  // If stream is Audio we create required stuff for VU-Meter animation
  if(!is_video) {
    // Create Analyser node dans Buffer node stored within the Media
    // objecy to perform audio peek analysis for visual effects
    media.fftNode = xows_gui_audio.ctx.createAnalyser();
    media.fftNode.fftSize = 2048;
    media.fftBuff = new Float32Array(media.fftNode.frequencyBinCount);
    media.srcNode.connect(media.fftNode);
  }

  // Connect AudioSource -> Analyser [-> GainNode]
  if(!part.self) media.srcNode.connect(xows_gui_audio.vol);

  // Set stream to Media element
  media.srcObject = stream;
  media.autoplay = true;

  // Add Stream element to layout
  if(part.self) {
    call_grid.insertBefore(element, call_grid.firstChild);
  } else {
    call_grid.appendChild(element);
  }
}
/* -------------------------------------------------------------------
 * Calls Interactions - Call View - VU-Meter animation
 * -------------------------------------------------------------------*/
/**
 * Call View VU-Meter animation interval handle.
 */
let xows_gui_call_view_vumet_hnd = null;

/**
 * Start the Call View VU-Meter animation
 *
 * The VU-Meter animation (which is not strictly a VU-Meter) is used to
 * show visual feedback according audio volume arround Chat Call frame
 * participants.
 *
 * @param   {number}    rate    Animation refresh rate in miliseconds
 */
function xows_gui_call_view_vumet_run(rate)
{
  if(!xows_gui_call_view_vumet_hnd)
    xows_gui_call_view_vumet_hnd = setInterval(xows_gui_call_view_vumet_anim, rate);
}

/**
 * Stop the Call View VU-Meter animation
 */
function xows_gui_call_view_vumet_stop()
{
  clearInterval(xows_gui_call_view_vumet_hnd);
  xows_gui_call_view_vumet_hnd = null;
}

/**
 * Call View VU-Meter animation function.
 *
 * The VU-Meter animation (which is not strictly a VU-Meter) is used to
 * show visual feedback according audio volume arround Chat Call frame
 * participants.
 *
 * This function is used within a loop (using requestAnimationFrame) to
 * perform real-time audio analysis of input audio stream to change the
 * proper HTML element color according silence or speaking.
 */
function xows_gui_call_view_vumet_anim()
{
  // Avoid useless calculations
  if(xows_doc("call_view").hidden)
    return;

  // Get list of Audio Media objects
  const audio = xows_doc("call_grid").querySelectorAll("audio");

  // For each Audio object
  for(let i = 0; i < audio.length; ++i) {

    // Get Analyzer time domain (PCM samples)
    audio[i].fftNode.getFloatTimeDomainData(audio[i].fftBuff);

    // Get peek value for window
    let data, peek = 0.0;
    for(let j = 0; j < audio[i].fftBuff.length; j++) {
      data = Math.abs(audio[i].fftBuff[j]); // raw data are between 1.0 and -1.0
      if(data > peek) peek = data;
    }

    // If peek value is greater than threshold, change color
    const color = peek > 0.08 ? "var(--link-base)" : "var(--text-tone4)";
    if(audio[i].parentNode.style.borderColor !== color) {
      audio[i].parentNode.style.borderColor = color;
    }
  }
}

/* -------------------------------------------------------------------
 * Calls Interactions - Ringing dialog
 * -------------------------------------------------------------------*/
/**
 * Constants for Ring dialog type
 */
const XOWS_RING_TERM = 0;
const XOWS_RING_NEGO = 1;
const XOWS_RING_RING = 2;

/**
 * History Call Ringing dialog on-click callback
 *
 * @param   {object}    event      Event object
 */
function xows_gui_call_ring_onclick(event)
{
  switch(event.target.id)
  {
  case "ring_bt_clos":
    // dummy case, will close dialog
    break;

  case "ring_bt_deny":
    // Reject or abort call
    xows_gui_call_self_cancel(xows_gui_peer);
    break;

  case "ring_bt_pkup":
    // Ask user for input devices and send answer
    xows_gui_call_self_accept(xows_gui_peer);
    return; //< do not close dialog, it will pass to Negotiation state

  default:
    return; //< return without closing
  }

  // Close dialog
  xows_gui_call_ring_close(xows_gui_peer);
}

/**
 * Show the History Call Ringing dialog of the specified Peer
 *
 * @param   {object}    peer          Contact Peer object.
 * @param   {number}    type          Dialog type.
 * @param   {string}    reason        Calling dialog open reason
 */
function xows_gui_call_ring_show(peer, type, reason)
{
  const call_ring = xows_gui_doc(peer,"call_ring");

  let is_video = false, inbound = false;

  if(type !== XOWS_RING_TERM) {
    // Check for inbound or outbound call
    inbound = xows_cli_call_is_inbd(peer);
    // Get session Medias/Constraints
    is_video = xows_cli_call_medias(peer).video;
  }

  let text, tone, bell;

  switch(type)
  {
  case XOWS_RING_RING:
    if(inbound) {
      bell = true;
      text = is_video ? "Incoming video call..." : "Incoming audio call...";
    } else {
      tone = true;
      text = "Call in progress...";
    }
    break;

  case XOWS_RING_NEGO:
    text = "Network negotiation...";
    break;

  case XOWS_RING_TERM:
      switch(reason)
      {
      case "decline":    //< peer declined call
        text = "The call has been declined";
        break;

      case "buzy":       //< peer is buzy
        text = "The other party is buzy";
        break;

      case "success":    //< peer hung up call
        text = xows_cli_call_misd(peer) ? "You missed a call" : "The other party hung up";
        break;

      case "incompatible-parameters": //< this may come after input devices access failure
        if(xows_cli_call_is_inbd(peer)) {
          // user denied access to input devices while answering a call
          text = "Input devices access failed";
        } else {
          text = "The other party lacks suitable devices";
        }
        break;

      // The common Jingle errors
      case "failed-transport":
      case "failed-application":
      case "unsupported-applications":
      case "unsupported-transports":
        text = "The other party encountered error";
        break;

      default:
        text = xows_l10n_get("Call failure") + ": " + xows_xml_beatify_tag(reason);
      }
    break;
  }

  call_ring.classList.toggle("RING-VDEO", is_video);
  call_ring.classList.toggle("RING-RING", (type === XOWS_RING_RING));
  call_ring.classList.toggle("RING-NEGO", (type === XOWS_RING_NEGO));
  call_ring.classList.toggle("RING-TERM", (type === XOWS_RING_TERM));
  call_ring.classList.toggle("RING-INBD", inbound);

  call_ring.querySelector("RING-TEXT").innerText = xows_l10n_get(text);

  if(bell) {
    xows_gui_sound_play("ringbell"); //< Play Ring Bell sound
  } else {
    xows_gui_sound_stop("ringbell"); //< Stop Ring Bell sound
  }

  if(tone) {
    xows_gui_sound_play("ringtone"); //< Play Ring Bell sound
  } else {
    xows_gui_sound_stop("ringtone"); //< Stop Ring Bell sound
  }

  if(call_ring.hidden) {

    // Add event listener
    if(peer === xows_gui_peer)
      xows_doc_listener_add(call_ring, "click", xows_gui_call_ring_onclick);

    // Show the incoming call dialog
    call_ring.hidden = false;

    // Force scroll down
    xows_gui_doc_scrl_down(peer, false);

    // Configure chat navigation bar
    xows_gui_chat_nav_alert(peer, "RINGING");
  }
}

/**
 * History Call Ringing dialog of the specified Peer
 *
 * @param   {object}    peer          Contact Peer object.
 */
function xows_gui_call_ring_close(peer)
{
  // Stop Ring Tone & Bell sound
  xows_gui_sound_stop("ringtone");
  xows_gui_sound_stop("ringbell");

  const call_ring = xows_gui_doc(peer,"call_ring");

  // Remove event listener
  if(peer === xows_gui_peer)
    xows_doc_listener_rem(call_ring, "click", xows_gui_call_ring_onclick);

  // Hide the dialog
  call_ring.hidden = true;

  // Configure chat navigation bar
  xows_gui_chat_nav_reset(peer, "RINGING");
}

/* -------------------------------------------------------------------
 * Calls Interactions - General functions
 * -------------------------------------------------------------------*/
/**
 * Multimedia Calls hang up and clear all active or pending
 * call sessions
 */
function xows_gui_call_exit_all()
{
  let peers = xows_cli_call_peer_list();

  for(let i = 0; i < peers.length; ++i) {

    // Hang up with peer
    xows_cli_call_self_hangup(peers[i], "failed-application");

    // Close and reset GUI elements
    xows_gui_call_exit(peers[i]);
  }
}

/**
 * Multimedia Calls clear and reset GUI element for the specified Peer
 *
 * @param   {object}     peer       Related Peer object
 */
function xows_gui_call_exit(peer)
{
  // Remove in call (buzy) badge from tabs/roster/contact
  xows_gui_badg_buzy(peer, false);

  // Close any potentially opened Call view frame
  xows_gui_call_view_close(peer);

  // Enable chat header call buttons
  xows_gui_doc_update(peer, XOWS_UPDT_BUZY);

  // If no more call sessions, stop VU-Meter animation
  if(!xows_cli_call_count())
    xows_gui_call_view_vumet_stop();
}

/* -------------------------------------------------------------------
 * Calls Interactions - User actions (Outbound)
 * -------------------------------------------------------------------*/
/**
 * User invite (outbound Offer) the specified Peer for a call
 *
 * This function is a transition function that only starts user input devices
 * access permissions request. Once user authorized devices and stream acquired,
 * 'xows_gui_call_self_invite_onmedia' is called to launch proper routines for
 * call initiation (Offer).
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     constr       Constraints for media aquisition
 */
function xows_gui_call_self_invite(peer, constr)
{
  // Send media request to User, on success call 'xows_cli_call_self_invite'
  xows_gui_wnd_media_try(constr, xows_gui_call_self_invite_onmedia, xows_gui_call_self_cancel, peer);
}

/**
 * Callback for User invite (outbound Offer) Peer for a call, once local
 * stream acquired (after getUserMedia).
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Acquired local input Stream
 */
function xows_gui_call_self_invite_onmedia(peer, stream)
{
  // Initiate call (create session)
  xows_cli_call_self_invite(peer, stream);

  // Dsiable chat header call buttons
  xows_gui_doc_update(peer, XOWS_UPDT_BUZY);

  // Open Ring dialog in Negotiation mode
  xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);

  // Add local participant (ourself) to Call View
  xows_gui_call_view_part_add(peer, xows_cli_self, stream);
}

/**
 * User accept (outbound Answer) an inbound call from the specified Peer
 *
 * This function is a transition function that only starts user input devices
 * access permissions request. Once user authorized devices and stream acquired,
 * 'xows_gui_call_self_accept_onmedia' is called to launch proper routines for
 * call accept (Answer).
 *
 * If the constr parameter is set to null, the function automatically
 * determines proper media constraints according peer's medias and current
 * available inputs.
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     constr       Constraints for media aquisition
 */
function xows_gui_call_self_accept(peer, constr)
{
  if(!constr) {

    // Get session medias (remote medias, at this stage)
    constr = xows_cli_call_medias(peer);

    // keep only the full-duplex ables medias.
    constr.audio = constr.audio && xows_gui_devices_has("audioinput");
    constr.video = constr.video && xows_gui_devices_has("videoinput");
  }

  // Send media request to User
  xows_gui_wnd_media_try(constr, xows_gui_call_self_accept_onmedia, xows_gui_call_self_cancel, peer);
}

/**
 * Callback for User accept (outbound Answer) an inbound call, once local
 * stream acquired (after getUserMedia).
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Acquired local input Stream
 */
function xows_gui_call_self_accept_onmedia(peer, stream)
{
  // Answer call
  xows_cli_call_self_accept(peer, stream);

  // Dsiable chat header call buttons
  xows_gui_doc_update(peer, XOWS_UPDT_BUZY);

  // Open Ring dialog in Negotiation mode
  xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);

  // Get session medias (remote medias, at this stage)
  const constr = xows_cli_call_medias(peer);

  // keep only medias that are reciprocal
  constr.audio = constr.audio && xows_gui_devices_has("audioinput");
  constr.video = constr.video && xows_gui_devices_has("videoinput");

  // Add local participant (ourself) to Call View
  xows_gui_call_view_part_add(peer, xows_cli_self, stream);
}

/**
 * User cancel call, either directly or indirectly.
 *
 * This function is called:
 * - Directly if user explicitely canceled or declined call from Ring dialog.
 * - As Callback if user input devices access ahs failed or was denied.
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}    [error]       Optional forwarded error (DOMException)
 */
function xows_gui_call_self_cancel(peer, error)
{
  let reason;

  if(error) {
    // This is an abort due to failled or denied input media access
    xows_doc_mbox_open(XOWS_STYL_ERR, "Input devices access failed",
                       "Access to input devices is required for call session, configure your browser to allow it and try again.",
                       null, null,
                       null, null);

    reason = "incompatible-parameters";

  } else {
    // This is abort due to user cancel outbound or reject inbound call
    if(xows_cli_call_is_inbd(peer)) {
      // User declined inbound call invite
      reason = "decline";
    } else {
      // User canceled outboud call invite
      reason = "success";
    }
  }

  if(xows_cli_call_exists(peer)) {

    // Set Ring dialog in Terminate mode
    xows_gui_call_ring_show(peer, XOWS_RING_TERM, reason);

    // Hang up with Peer
    xows_gui_call_self_hangup(peer, reason);

  }
}

/**
 * User terminate call for the specified Peer. This function is
 * called when user takes the initiative to hang-up.
 *
 * If not 'reason' is provided, data for the specified Remote peer is cleared
 * without sending session terminate signaling.
 *
 * @param   {object}     peer       Related Peer object
 * @param   {string}    [reason]    Optionnal reason to HangUp
 */
function xows_gui_call_self_hangup(peer, reason)
{
  // Hang up with peer
  xows_cli_call_self_hangup(peer, reason);

  // Close and reset GUI elements
  xows_gui_call_exit(peer);

  // Play Hangup sound
  xows_gui_sound_play("hangup");
}

/* -------------------------------------------------------------------
 * Calls Interactions - Remote events (Inbound)
 * -------------------------------------------------------------------*/
/**
 * Callback for received call invite (inbound Offer) from a Peer
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_call_onoffer(peer, stream)
{
  // Start the VU-Meter animation for Call View
  xows_gui_call_view_vumet_run(50);

  // Add remote participant to Call View
  xows_gui_call_view_part_add(peer, peer, stream);

  // If peer is offscreen during incomming call, add notification
  if(peer !== xows_gui_peer)
    xows_gui_badg_unrd_call(peer, true);

  // Open Ring dialog in Ringing mode
  xows_gui_call_ring_show(peer, XOWS_RING_RING, null);
}

/**
 * Callback for received call accept (inbound Answer) from a Peer
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_call_onanwse(peer, stream)
{
  // Start the VU-Meter animation for Call View
  xows_gui_call_view_vumet_run(50);

  // Add remote participant to Call View
  xows_gui_call_view_part_add(peer, peer, stream);
}

/**
 * Callback for Multimedia-Call negotiation state changes
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_call_onstate(peer, state)
{
  if(state === "ringing") {

    // Set Ring dialog in Ringing mode
    xows_gui_call_ring_show(peer, XOWS_RING_RING, null);
  }

  if(state === "gathering") {

    // Set Ring dialog in Negotiation mode
    xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);
  }

  if(state === "connected") {

    // Set Ring dialog in Negotiation mode
    xows_gui_call_ring_close(peer);

    // Add in call (buzy) badge to tabs/roster/contact
    xows_gui_badg_buzy(peer, true);

    // Open Chat Multimedia View layout
    xows_gui_call_view_open(peer);
  }
}

/**
 * Callback for Multimedia-Call received call termination
 *
 * @param   {object}     peer     Related Peer object
 * @param   {string}     reason   Termination reason string
 */
function xows_gui_call_ontermd(peer, reason)
{
  // Open the Call dialog
  xows_gui_call_ring_show(peer, XOWS_RING_TERM, reason);

  // Close and reset GUI elements
  xows_gui_call_exit(peer);

  // Play Hangup sound
  xows_gui_sound_play("hangup");
}

/**
 * Callback for Multimedia-Call received call error
 *
 * An internal parameter set to true mean error was generated by local
 * WebRTC/Transport processing, otherwise, this is a remote XMPP/Jingle
 * query error response.
 *
 * @param   {object}     peer       Related Peer object
 * @param   {boolean}    internal   Indicate internal RTC process error
 * @param   {string}     message    Error message
 */
function xows_gui_call_onerror(peer, internal, error)
{
  let reason;

  if(internal) {

    // Presence of errorCode property mean error come from ICE gathering
    // process, typically STUN or TURN server is unreachable or returned
    // error.
    //
    // Otherwise, error is a DOMEception from the WebRTC API possibly caused
    // by (too) many different things.

    if(error.errorCode) { //< ICE Gathering error
      reason = "Network Error ("+error.errorCode+")";
    } else {              //< WebRTC API DOMException
      reason = "Internal Error ("+error.name+")";
    }

  } else {

    // Ignore unsuported-info error since it is not critital
    if(error.jing === "unsupported-info") {
      xows_log(1,"cli_jing_parse","received unsuported info from",peer.addr);
      return;
    }

    // This is an error replied by Jingle peer
    reason = "Remote Peer Error ("+error.name+")";
  }

  // Close and reset GUI elements
  xows_gui_call_exit(peer);

  // Open the Call dialog
  xows_gui_call_ring_show(peer, XOWS_RING_TERM, reason);
}
