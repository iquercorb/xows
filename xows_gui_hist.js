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
 *                  Chat Histor Management Sub-Module
 *
 * ------------------------------------------------------------------ */
/**
 * Callback function to handle user click in chat history
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_hist_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Check for click on embeded image
  if(event.target.tagName === "IMG") {
    // Open image viewer
    xows_doc_view_open(event.target);
    return;
  }

  // Check for closest <mesg-rply> parent
  const mesg_rply = event.target.closest("MESG-RPLY");
  if(mesg_rply) {
    // Highlight replied message
    xows_gui_hist_mesg_hligh(xows_gui_peer, mesg_rply.dataset.id);
    return;
  }

  // Check for closest <li-mesg> parent
  const li_msg = event.target.closest("LI-MESG");
  if(!li_msg)
    return;

  // Special behavior for mobile devices to allow message interaction
  if(event.type.startsWith("touch")) {

    // Unselect any previousely selected message
    const li_selected = xows_doc("hist_ul").querySelector("LI-MESG.SELECTED");
    if(li_selected) li_selected.classList.remove("SELECTED");

    // Select the 'touched' message
    if(li_msg) li_msg.classList.add("SELECTED");
  }

  // Check for click on <button> element
  if(event.target.tagName === "BUTTON") {

     // If button has a valid name, this is history message button
     if(event.target.name) {

      switch(event.target.name)
      {
      case "mesg_bt_edit":
        xows_gui_mesg_repl_dlg_open(li_msg);
        break;
      case "edit_bt_abort":
        xows_gui_mesg_repl_dlg_close(li_msg);
        break;
      case "edit_bt_valid":
        xows_gui_mesg_repl_dlg_valid(li_msg.querySelector("MESG-INPT"));
        break;

      case "mesg_bt_trsh":
        xows_gui_mesg_retr_dlg_open(li_msg);
        break;
      case "trsh_bt_abort":
        xows_gui_mesg_retr_dlg_abort(li_msg);
        break;
      case "trsh_bt_valid":
        xows_gui_mesg_retr_dlg_valid(li_msg);
        break;

      case "mesg_bt_rply":
        xows_gui_edit_rply_set(li_msg);
        break;
      }

      return;
    }
  }
}

/**
 * Update chat history messages avatar and nickname of the specified
 * author.
 *
 * @param   {object}    peer      Chat history Peer, Room or Contact
 * @param   {object}    author    Author Peer object to update message
 */
function xows_gui_hist_update(peer, author)
{
  // If incoming message is off-screen we get history <div> and <ul> of
  // fragment history corresponding to contact
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  if(!hist_ul || !hist_ul.children.length)
    return;

  // Get peer ID
  const peerid =  xows_cli_peer_iden(author);

  let i;

  // Set new content for all <mesg-from>
  const spn = hist_ul.querySelectorAll("MESG-FROM[data-peer='"+peerid+"'],RPLY-FROM[data-peer='"+peerid+"']");
  i = spn.length;
  while(i--) if(author.name != spn[i].innerText) spn[i].innerText = author.name;

  if(!author.avat)
    return;

  // Retrieve or generate avatar CSS class
  const cls = xows_tpl_spawn_avat_cls(author);

  // Set new CSS class to all corresponding figures
  const fig = hist_ul.querySelectorAll("MESG-AVAT[data-peer='"+peerid+"'],RPLY-AVAT[data-peer='"+peerid+"']");
  i = fig.length;
  while(i--) if(cls != fig[i].className) fig[i].className = cls;
}

/**
 * Update chat history messages after connection resume to mark
 * messages as failed.
 *
 * @param   {object}    peer      Chat history Peer, Room or Contact
 */
function xows_gui_hist_resume(peer)
{
  // If incoming message is off-screen we get history <div> and <ul> of
  // fragment history corresponding to contact
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  if(!hist_ul || !hist_ul.children.length)
    return;

  const sent = hist_ul.querySelectorAll(".MESG-SENT");
  for(let i = 0; i < sent.length; ++i) {
    if(!sent[i].classList.contains("MESG-RECP"))
      sent[i].classList.add("MESG-FAIL");
  }
}

/**
 * Find history message <li-mesg> element corresponding to specified ID
 *
 * If tomb parameter is set to true and the specified messae was not found,
 * a dummy tombstone message is returned.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Message id or Unique and Stable Stanza ID
 * @param   {string}   [from]     Optional message author JID
 * @param   {boolean}  [tomb]     Optional returns tombstone on fail
 */
function xows_gui_hist_mesg_find(peer, id, from, tomb = false)
{
  // Get Peer's history <ul> element in fast way
  /*
  let hist_ul;
  if(peer === xows_gui_peer) {
    hist_ul = document.getElementById("hist_ul");
  } else {
    hist_ul = xows_doc_frag_element_find(peer.addr,"chat_fram","hist_ul");
  }
  */
  const hist_ul = xows_gui_doc(peer,"hist_ul");

  // First search by id attribute
  let li_msg = hist_ul.querySelector("LI-MESG[data-id='"+id+"']");

  // If no id attribute matches, search for Unique and Stable Stanza IDs (XEP-0359)
  if(!li_msg) {
    if(peer.type === XOWS_PEER_ROOM) {
      li_msg = hist_ul.querySelector("LI-MESG[data-szid='"+id+"']");
    } else {
      li_msg = hist_ul.querySelector("LI-MESG[data-orid='"+id+"']");
    }
  }

  // No message found, generates tombstone message as requested
  if(tomb && !li_msg)
    li_msg = xows_tpl_mesg_null_spawn(id, from, xows_l10n_get("The message is unreachable"));

  return li_msg;
}

/* -------------------------------------------------------------------
 * Chat History - Update and Modifications
 * -------------------------------------------------------------------*/
/**
 * Perform corrected message replacement with proper references update
 *
 * @param   {object}    peer        Peer object
 * @param   {object}    li_old      Replaced message <li-mesg> element
 * @param   {object}    li_new      New message <li-mesg> element
 *
 * @return  {object}    Inserted new message
 */
function xows_gui_hist_mesg_repl(peer, li_old, li_new)
{
  // Discard old message
  li_old.hidden = true;
  li_old.innerHTML = "";

  const hist_ul = xows_gui_doc(peer, "hist_ul");

  const old_id = xows_tpl_mesg_bestref(peer, li_old);

  // Search for references to old message to be updated
  const li_refs = hist_ul.querySelectorAll("MESG-RPLY[data-id='"+old_id+"']");
  for(let i = 0; i < li_refs.length; ++i)
    xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_new);

  // Also check chat input reply reference
  const edit_rply = xows_gui_doc(peer,"edit_rply");
  if(edit_rply.dataset.id === old_id)
    edit_rply.dataset.id = xows_tpl_mesg_bestref(peer, li_new);

  // Insert replacement message to list
  return hist_ul.insertBefore(li_new, li_old.nextSibling);
}

/**
 * Handle incomming message retraction from the server to update message
 * history and references
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Message Unique and Stable ID to retract
 */
function xows_gui_hist_mesg_retr(peer, usid)
{
  // Retreive message element
  const li_msg = xows_gui_hist_mesg_find(peer, usid);

  if(!li_msg) {
    xows_log(1,"gui_hist_mesg_retract","retracted message not found",usid);
    return;
  }

  // Discard message
  li_msg.hidden = true;
  li_msg.innerHTML = "";

  // Search for references to message to be updated
  const li_refs = xows_gui_doc(peer,"hist_ul").querySelectorAll("MESG-RPLY[data-id='"+usid+"']");

  if(li_refs.length) {
    // Create temporary Null dummy message
    const li_tomb = xows_tpl_mesg_null_spawn(usid,"",xows_l10n_get("The message was deleted"));
    // Update messages with reply
    for(let i = 0; i < li_refs.length; ++i)
      xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_tomb);
  }

  // If next message is same author, adjust the "Append" style
  const next_li = li_msg.nextSibling;
  if(next_li) {
    if(next_li.dataset.from === li_msg.dataset.from)
      next_li.classList.toggle("MESG-APPEND", li_msg.classList.contains("MESG-APPEND"));
  }
}

/**
 * Highlight (blue) the specified Move scroll to the specified element
 *
 * @param   {object}    peer      Peer object to get scroll value
 * @param   {object}    id        Message ID or Unique and Stable ID
 */
function xows_gui_hist_mesg_hligh(peer, id)
{
  // Search for already focus message
  const hig_li = xows_gui_doc(peer,"hist_ul").querySelector(".HIGHLIGHT");
  if(hig_li) hig_li.classList.remove("HIGHLIGHT");

  if(!id) return;

  // Retreive message element
  const li_msg = xows_gui_hist_mesg_find(peer, id);
  if(!li_msg) return;

  // Add focus class
  li_msg.classList.add("HIGHLIGHT");

  if(peer === xows_gui_peer) {
    // Scroll to element if necessary
    if((li_msg.offsetTop - xows_doc("chat_main").scrollTop) < 0)
      li_msg.scrollIntoView({behavior:"smooth",block:"center"});
  }
}

/**
 * Callback function to add sent or received message to the history
 * window
 *
 * @param   {object}    peer      Related Peer object
 * @param   {object}    mesg      Message object
 * @param   {boolean}   wait      Message wait for receipt
 * @param   {boolean}   self      Message is an echo of one sent by user itself
 * @param   {object}    error     Error data if any
 */
function xows_gui_hist_onrecv(peer, mesg, wait, self, error)
{
  // Check for error message
  if(error) {
    // Find corresponding erroneous message according Id
    const err_li = xows_gui_hist_mesg_find(peer, mesg.id);
    // Mark message as failed
    if(err_li) err_li.classList.add("MESG-FAIL");
    // Print warning log
    xows_log(1,"gui_cli_onmessage","message error",error.name);
    return;
  }

  // MUC specific, we may receive message from ourself as confirmation
  // of reception with server additionnal data
  if(peer.type === XOWS_PEER_ROOM) {
    // Message to update
    const upd_li = xows_gui_hist_mesg_find(peer, (mesg.orid ? mesg.orid : mesg.id));
    if(upd_li) {
      xows_tpl_mesg_update(upd_li, peer, mesg, true);
      return;
    }
  }

  let li_rep, li_rpl;

  // Search for corrected message to be discarded
  if(mesg.repl) {
    li_rep = xows_gui_hist_mesg_find(peer, mesg.repl);
    // We ignore correction which are not in visible history or if correction
    // message have no body, in this case this mean message deletion
    if(!li_rep) return;
  }

  // Search for replied message to be referenced
  if(mesg.rpid)
    li_rpl = xows_gui_hist_mesg_find(peer, mesg.rpid, mesg.rpto, true);

  const hist_ul = xows_gui_doc(peer, "hist_ul");

  // Get last valid (non discarded) previous message
  let li_prv = hist_ul.lastElementChild;
  while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

  // Create new message element
  const li_msg = xows_tpl_mesg_spawn(peer, mesg, wait, li_prv, li_rep, li_rpl);

  // Insert or append message, depending whether li_ref is null
  if(li_rep) {
    xows_gui_hist_mesg_repl(peer, li_rep, li_msg);
  } else {
    hist_ul.appendChild(li_msg);
  }

  // Avoid notifications for correction messages and ourself
  if(!mesg.repl && !peer.self) {

    let alert = true;

    // For MUC we avoid notification unless explicit mention
    if(peer.type === XOWS_PEER_ROOM) {
      if(!(mesg.rpto && xows_cli_occu_self(peer).addr === mesg.rpto))
        alert = false;
    }

    // If offsecreen peer, add an Unread messag notification
    if(alert && peer !== xows_gui_peer)
      xows_gui_badg_unrd_mesg(peer, mesg.id);

    // If GUI is not in focus, send browser Push Notification
    if(alert && !xows_gui_has_focus)
      xows_gui_wnd_noti_emit(peer, mesg.body);
  }

  // Keep scroll to proper position from bottom. Calling this
  // manually allow us to get rid of ResizeObserver
  xows_gui_doc_scrl_keep(peer);

  // Signals something new appending to chat
  if(xows_gui_doc_scrl_get(peer) > 50) {
    if(self) {
      // Force scroll down
      xows_gui_doc_scrl_down(peer, false);
    } else {
      // Show the "unread" chat navigation signal
      xows_gui_chat_nav_alert(peer, "UNREAD");
    }
  }
}

/**
 * Handle incomming receipts from the server to update history message
 * element style
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Receipt related message Id
 */
function xows_gui_hist_onrecp(peer, id)
{
  // Check whether message is from or to current chat contact
  const li_msg = xows_gui_hist_mesg_find(peer, id);
  if(li_msg) {
    li_msg.classList.add("MESG-RECP");
  } else {
    xows_log(1,"gui_cli_onreceipt","message not found",id);
  }
}

/**
 * Handle incomming retraction message
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Retracted message SID
 */
function xows_gui_hist_onretr(peer, usid)
{
  xows_gui_hist_mesg_retr(peer, usid);
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Archive Management (MAM)
 * -------------------------------------------------------------------*/
/**
 * Reference to setTimeout sent to temporize archive queries
 */
const xows_gui_mam_query_to = new Map();

/**
 * Query arvhived message for the specified Peer
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    delay     Delay to temporize query
 * @param   {boolean}   newer     If true, fetch newer message instead of older
 * @param   {number}   [count]    Count of visible message to get
 */
function xows_gui_mam_query(peer, delay, newer, count = 0)
{
  if(xows_gui_mam_query_to.has(peer))  //< Query already pending
    return;

  const hist_ul = xows_gui_doc(peer, "hist_ul");

  let end, start = null; //< IMPORTANT, set null for logic purposes

  // Get start or end time depending after parameter, we get time
  // always 25 ms after or before to prevent received the last or
  // first message already in history.
  if(newer) {

    if(hist_ul.children.length)
      start = parseInt(hist_ul.lastElementChild.dataset.time) + 25;

  } else {

    const hist_beg = xows_gui_doc(peer,"hist_beg");

    // Check whether we already reached the first archived message
    if(hist_beg.className.length)
      return;

    if(hist_ul.children.length)
      end = parseInt(hist_ul.firstElementChild.dataset.time) - 25;
  }

  // If no count specified, set default
  if(count === 0)
    count = xows_options.cli_archive_count;

  // To prevent flood and increase ergonomy the archive query is temporised
  xows_gui_mam_query_to.set(peer, setTimeout(xows_cli_mam_fetch, delay,
                                             peer, count,
                                             start, end,
                                             xows_gui_mam_parse));
}

/**
 * Fetch the newer available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    delay     Temporization delay (in miliseconds)
 */
function xows_gui_mam_fetch_newer(peer, delay = 0)
{
  xows_gui_mam_query(peer, delay, true);
}

/**
 * Fetch older available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    delay     Temporization delay (in miliseconds)
 */
function xows_gui_mam_fetch_older(peer, delay = 0)
{
  let count = xows_options.cli_archive_count;

  // Check whether this is a fetch for newly joined Room
  if(peer.type === XOWS_PEER_ROOM && !peer.live) {

    // We need to subtract required count of history message by
    // those we already got from the server
    let count = xows_options.cli_archive_count;
    count -= xows_gui_doc(peer,"hist_ul").children.length;
  }

  if(count > 0)
    xows_gui_mam_query(peer, delay, false, count);
}

/**
 * Callback function to handle the received archives for a contacts
 *
 * @param   {object}    peer      Archive related peer (Contact or Room)
 * @param   {boolean}   newer     Result are newer rather than older
 * @param   {object[]}  result    Received archived messages
 * @param   {number}    count     Count of gathered true (visible) messages
 * @param   {boolean}   complete  Indicate results are complete (no remain)
 */
function xows_gui_mam_parse(peer, newer, result, count, complete)
{
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  let li_ref = null;

  /*
  // Check whether we must append or prepend received archived messages
  if(result.length && hist_ul.children.length) {
    // We compare time (unix epoch) to ensure last archived message is
    // older (or equal) than the current oldest history message.
    if(hist_ul.firstElementChild.dataset.time >= result[result.length-1].time) {
      li_ref = hist_ul.firstElementChild; //< node to insert messages before
    } else {
      older = false;
    }
  }
  */

  if(!newer)
    li_ref = hist_ul.firstElementChild; //< node to insert messages before

  const hist_beg = xows_gui_doc(peer, "hist_beg");

  // Disable all spin loader
  //hist_beg.className = "";

  let li_rep, li_rpl, li_prv, added = 0;

  const n = result.length;
  for(let i = 0; i < n; ++i) {

    const mesg = result[i];

    // Search for message retraction
    if(mesg.retr) {
      xows_gui_hist_mesg_retr(peer, mesg.retr);
      continue;
    }

    // Check whether message has body (this may be reciept or chatstate)
    if(!mesg.body) continue;

    // If message with id alread exists, skip to prevent double
    if(xows_gui_hist_mesg_find(peer, (mesg.orid ? mesg.orid : mesg.id)))
      continue;

    // Search for corrected message to be discarded
    if(mesg.repl) {
      li_rep = xows_gui_hist_mesg_find(peer, mesg.repl);
      if(!li_rep) continue; //< ignore correction which are not in visible history
    } else {
      li_rep = null;
    }

    // Search for reply/quoted message to be referenced
    if(mesg.rpid) {
      li_rpl = xows_gui_hist_mesg_find(peer, mesg.rpid, mesg.rpto, true);
    } else {
      li_rpl = null;
    }

    // Get last valid (non discarded) previous message
    while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

    // Create new message element
    const li_msg = xows_tpl_mesg_spawn(peer, mesg, false, li_prv, li_rep, li_rpl);

    if(li_rep) {
      // Message correction is insert after the corrected message
      xows_gui_hist_mesg_repl(peer, li_rep, li_msg);
    } else {
      // Insert or append message, depending whether li_ref is null
      li_prv = hist_ul.insertBefore(li_msg, li_ref);
    }

    // Increase added message count
    added++;
  }

  xows_log(2,"gui_mam_parse",added+" added messages for",peer.addr);

  // Checks whether we reached end or start of available history, so we
  // display the proper "bounding" elements.
  if(complete) {
    // We reached the oldest history message
    hist_beg.className = "HIST-START";
  }

  // Back scroll to proper position from bottom. Keep that here
  // unless you enable resize observer for "chat_hist"
  if(added > 0)
    xows_gui_doc_scrl_keep(peer);

  xows_gui_mam_query_to.delete(peer); //< Allow a new archive query

  // Inform MAM loaded
  if(newer) {
    xows_load_task_done(peer, XOWS_FETCH_NEWR);
  } else {
    xows_load_task_done(peer, XOWS_FETCH_OLDR);
  }
}

/* -------------------------------------------------------------------
 *
 * Messages Interactions
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Messages Interactions - Message Correction Dialog
 * -------------------------------------------------------------------*/
/**
 * History message correction Cancel function
 *
 * @param   {element}    [li_msg]   Instance of <li-mesg> or null
 */
function xows_gui_mesg_repl_dlg_close(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName != "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("chat_hist").querySelector(".MESG-EDITOR");
  }

  if(li_msg)
    xows_tpl_mesg_edit_remove(li_msg);
}

/**
 * History message correction Enable function
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to open editor in
 */
function xows_gui_mesg_repl_dlg_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_repl_dlg_close();

  // Spawn <mesg-edit> instance next to <mesg-body>
  const mesg_edit = xows_tpl_mesg_edit_insert(li_msg);

  // Set caret and focus
  const mesg_inpt = mesg_edit.querySelector("MESG-INPT");
  xows_doc_caret_at(mesg_inpt);
  mesg_inpt.focus();
}

/**
 * History message correction validation (enter) function, called when
 * user press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {object}    inpt      Instance of <mesg-inpt> element
 */
function xows_gui_mesg_repl_dlg_valid(inpt)
{
  // Retrieve the parent <li-mesg> element
  const li_msg = inpt.closest("LI-MESG");

  // Get input text
  const inpt_text = inpt.innerText.trimEnd();

  // Check for difference to prevent useless correction
  if(inpt_text !== li_msg.querySelector("MESG-BODY").dataset.raw) {
    // Get message reply
    const rply = li_msg.querySelector("MESG-RPLY");
    // Send message correction
    xows_cli_msg_send(xows_gui_peer, inpt_text, li_msg.dataset.id, rply.dataset.id, rply.dataset.to);
  }

  // Close editor
  xows_tpl_mesg_edit_remove(li_msg);
}

/* -------------------------------------------------------------------
 * Messages Interactions - Message Retract Dialog
 * -------------------------------------------------------------------*/
/**
 * Cancel history message retraction (delete) (close dialog)
 *
 * @param   {element}    [li_msg]   Instance of <li-mesg> or null
 */
function xows_gui_mesg_retr_dlg_abort(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName != "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("chat_hist").querySelector(".MESG-TRASH");
  }

  if(li_msg)
    xows_tpl_mesg_trsh_remove(li_msg);
}

/**
 * Open history message retraction (delete) dialog
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to open editor in
 */
function xows_gui_mesg_retr_dlg_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_retr_dlg_abort();

  // Spawn <mesg-trsh> instance next to <mesg-body>
  xows_tpl_mesg_trsh_insert(li_msg);
}

/**
 * History message correction validation (enter) function, called when
 * user press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to retract
 */
function xows_gui_mesg_retr_dlg_valid(li_msg)
{
  // Get most suitable Stanza reference ID, either Origin-Id, Stanza-Id or Id
  const usid = xows_tpl_mesg_bestref(xows_gui_peer, li_msg);

  // Send message retraction
  if(usid) xows_cli_msg_retr(xows_gui_peer, usid);
}

